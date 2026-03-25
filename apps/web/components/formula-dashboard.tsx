'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  CartesianGrid,
  LabelList,
  Legend,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';
import {
  isOriginalFormula,
  ORIGINAL_FORMULA_WEIGHTS,
  scoreAllPlayersForPosition,
  scorePlayer,
  scorePosition
} from '@/lib/formula';
import { DraftPlayer, FormulaWeights, LeaderboardPlayer, MetricKey, Position } from '@/lib/types';
import { PlayerAvatar } from '@/components/player-avatar';

const METRIC_LABELS: Record<MetricKey, string> = {
  pts: 'Points (PTS)',
  trb: 'Rebounds (TRB)',
  ast: 'Assists (AST)',
  stl: 'Steals (STL)',
  blk: 'Blocks (BLK)',
  tov: 'Turnovers (TOV)',
  fgPercent: 'FG%',
  freeThrowPercent: 'FT%',
  threePointPercent: '3P%',
  availability: 'Availability'
};

type Props = {
  players: DraftPlayer[];
  originalLeaderboards: Record<Position, LeaderboardPlayer[]>;
};

type LotteryPoint = {
  pick: number;
  score: number;
  player: string;
};

export function FormulaDashboard({ players, originalLeaderboards }: Props) {
  const [activePosition, setActivePosition] = useState<Position>('G');
  const [weightsByPosition, setWeightsByPosition] = useState<Record<Position, FormulaWeights>>(
    ORIGINAL_FORMULA_WEIGHTS
  );

  const computedLeaderboards = useMemo<Record<Position, LeaderboardPlayer[]>>(
    () => ({
      G: scorePosition(players, 'G', weightsByPosition.G),
      F: scorePosition(players, 'F', weightsByPosition.F),
      C: scorePosition(players, 'C', weightsByPosition.C)
    }),
    [players, weightsByPosition]
  );

  const scoredPools = useMemo<Record<Position, LeaderboardPlayer[]>>(
    () => ({
      G: scoreAllPlayersForPosition(players, 'G', weightsByPosition.G),
      F: scoreAllPlayersForPosition(players, 'F', weightsByPosition.F),
      C: scoreAllPlayersForPosition(players, 'C', weightsByPosition.C)
    }),
    [players, weightsByPosition]
  );

  const scoredAllPlayers = useMemo(() => {
    return players.map((player) => ({
      ...player,
      score: scorePlayer(player, weightsByPosition[player.position])
    }));
  }, [players, weightsByPosition]);


  const isPositionOriginal = (position: Position) => {
    const keys = Object.keys(ORIGINAL_FORMULA_WEIGHTS[position]) as MetricKey[];
    return keys.every(
      (key) => Math.abs(weightsByPosition[position][key] - ORIGINAL_FORMULA_WEIGHTS[position][key]) <= 1e-9
    );
  };

  const showingOriginal = isOriginalFormula(weightsByPosition);
  const displayedLeaderboards: Record<Position, LeaderboardPlayer[]> = {
    G: isPositionOriginal('G') ? originalLeaderboards.G : computedLeaderboards.G,
    F: isPositionOriginal('F') ? originalLeaderboards.F : computedLeaderboards.F,
    C: isPositionOriginal('C') ? originalLeaderboards.C : computedLeaderboards.C
  };

  const lotteryByPick = useMemo(() => {
    const lotteryPool = scoredPools[activePosition].filter((player) => player.pick >= 1 && player.pick <= 15);
    const grouped = new Map<number, { best: LeaderboardPlayer; worst: LeaderboardPlayer }>();

    lotteryPool.forEach((player) => {
      const current = grouped.get(player.pick);
      if (!current) {
        grouped.set(player.pick, { best: player, worst: player });
        return;
      }

      if (player.score > current.best.score) {
        current.best = player;
      }
      if (player.score < current.worst.score) {
        current.worst = player;
      }
    });

    return Array.from(grouped.entries())
      .sort((a, b) => a[0] - b[0])
      .map(([pick, pair]) => ({
        pick,
        best: pair.best,
        worst: pair.worst
      }));
  }, [activePosition, scoredPools]);

  const bestLotteryPoints: LotteryPoint[] = lotteryByPick.map((entry) => ({
    pick: entry.pick,
    score: Number(entry.best.score.toFixed(3)),
    player: entry.best.player
  }));

  const worstLotteryPoints: LotteryPoint[] = lotteryByPick.map((entry) => ({
    pick: entry.pick,
    score: Number(entry.worst.score.toFixed(3)),
    player: entry.worst.player
  }));

  const averageByPick = useMemo(() => {
    const grouped = new Map<number, { total: number; count: number }>();

    scoredAllPlayers.forEach((player) => {
      const current = grouped.get(player.pick) ?? { total: 0, count: 0 };
      grouped.set(player.pick, {
        total: current.total + player.score,
        count: current.count + 1
      });
    });

    return Array.from(grouped.entries())
      .sort((a, b) => a[0] - b[0])
      .map(([pick, values]) => ({
        pick,
        averageScore: Number((values.total / values.count).toFixed(3))
      }));
  }, [scoredAllPlayers]);

  const setWeight = (metric: MetricKey, value: number) => {
    setWeightsByPosition((prev) => ({
      ...prev,
      [activePosition]: {
        ...prev[activePosition],
        [metric]: value
      }
    }));
  };

  return (
    <main className="container">
      <section className="hero">
        <div>
          <p className="eyebrow">NBA Draft Analysis</p>
          <h1>PerformanceScore Formula Studio</h1>
          <p className="eyebrow">Interactive scouting baseline + what-if lab</p>
          <p className="subtitle">
            Explore how position-specific formula changes affect the top draft outcomes. The app loads with
            your original formula and `leaderboards.csv`, then updates live as you tune weights.
          </p>
        </div>
        <div className="heroStatus">
          <p className="statusLabel">Mode</p>
          <p className={`statusPill ${showingOriginal ? 'original' : 'custom'}`}>
            {showingOriginal ? 'Original Baseline' : 'Custom Formula'}
          </p>
        </div>
      </section>

      <section className="card aboutCard">
        <h2>About this project</h2>
        <p>
          This project evaluates NBA draft outcomes (1995–2015) by comparing each player&apos;s career
          production against expectations for their draft slot. The core idea is to build a
          position-specific <strong>PerformanceScore</strong>, combine it with expected value by pick, and
          highlight overperformers and underperformers. The current weights shown are a reflection of the
          ridge regression model. Users can play around with the numbers as they wish to see if they
          disagree or agree with weights. General Managers can use this to look for players that better fit
          their programs (ex. points-oriented vs rebounds-oriented).
        </p>
        <p>
          Link to github repo:{' '}
          <a href="https://github.com/Dante7142/NBADraftAnalysis.git" target="_blank" rel="noreferrer">
            https://github.com/Dante7142/NBADraftAnalysis.git
          </a>
        </p>
        <p>Email me with any question at vedapothina@gmail.com</p>
      </section>

      <section className="card">
        <h2>Formula Controls</h2>
        <div className="toolbar">
          <div className="positionTabs" role="tablist" aria-label="Select position">
            {(['G', 'F', 'C'] as Position[]).map((position) => (
              <button
                key={position}
                className={position === activePosition ? 'active' : ''}
                onClick={() => setActivePosition(position)}
              >
                {position}
              </button>
            ))}
          </div>
          <button
            className="resetButton"
            type="button"
            onClick={() => setWeightsByPosition(ORIGINAL_FORMULA_WEIGHTS)}
            disabled={showingOriginal}
          >
            Revert to original formula
          </button>
        </div>

        <div className="sliderGrid">
          {(Object.keys(weightsByPosition[activePosition]) as MetricKey[]).map((metric) => {
            const value = weightsByPosition[activePosition][metric];
            return (
              <label key={metric} className="sliderRow">
                <span>
                  {METRIC_LABELS[metric]} <strong>{value.toFixed(4)}</strong>
                </span>
                <input
                  type="range"
                  min={-0.5}
                  max={0.5}
                  step={0.0005}
                  value={value}
                  onChange={(event) => setWeight(metric, Number(event.target.value))}
                />
              </label>
            );
          })}
        </div>
      </section>

      <section className="grid">
        {(['G', 'F', 'C'] as Position[]).map((position) => (
          <article key={position} className="card">
            <h2>{position} Leaderboard (Top 10 by score)</h2>
            <ol>
              {displayedLeaderboards[position].map((player, index) => (
                <li key={`${position}-${player.player}`}>
                  <PlayerAvatar playerName={player.player} size={36} />
                  <div>
                    <strong>
                      #{player.rank ?? index + 1} {player.player}
                    </strong>
                    <small>
                      {player.team} • Pick #{player.pick}
                    </small>
                  </div>
                  <span className="scoreValue">{player.score.toFixed(3)}</span>
                </li>
              ))}
            </ol>
            <div className="seeMoreWrap">
              <Link className="seeMoreButton" href={`/leaderboards/${position}`}>
                See more
              </Link>
            </div>
          </article>
        ))}
      </section>

      <section className="grid twoUp">
        <article className="card chartCard">
          <h2>Lottery Picks (1–15): Best and Worst {activePosition}s by Draft Pick</h2>
          <p className="chartSubtitle">Green = Best Performer | Red = Worst Performer</p>
          <ResponsiveContainer width="100%" height={420}>
            <ScatterChart margin={{ top: 24, right: 20, bottom: 16, left: 16 }}>
              <CartesianGrid />
              <XAxis
                dataKey="pick"
                type="number"
                domain={[1, 15]}
                ticks={[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15]}
                label={{ value: 'Draft Pick', position: 'insideBottom', offset: -8 }}
              />
              <YAxis
                dataKey="score"
                type="number"
                label={{ value: 'Performance Score', angle: -90, position: 'insideLeft' }}
              />
              <Tooltip formatter={(value: number) => value.toFixed(3)} />
              <Legend />
              <Scatter name="Best performer" data={bestLotteryPoints} fill="#15803d">
                <LabelList dataKey="player" position="top" fontSize={12} fill="#15803d" />
              </Scatter>
              <Scatter name="Worst performer" data={worstLotteryPoints} fill="#dc2626">
                <LabelList dataKey="player" position="bottom" fontSize={12} fill="#dc2626" />
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
        </article>

        <article className="card chartCard">
          <h2>Average Player Performance by Draft Pick</h2>
          <p className="chartSubtitle">Mean PerformanceScore aggregated across all positions</p>
          <ResponsiveContainer width="100%" height={420}>
            <LineChart data={averageByPick} margin={{ top: 24, right: 20, bottom: 16, left: 16 }}>
              <CartesianGrid />
              <XAxis
                dataKey="pick"
                label={{ value: 'Draft Pick', position: 'insideBottom', offset: -8 }}
              />
              <YAxis
                dataKey="averageScore"
                label={{ value: 'Average Performance Score', angle: -90, position: 'insideLeft' }}
              />
              <Tooltip formatter={(value: number) => value.toFixed(3)} />
              <ReferenceLine y={0} stroke="#94a3b8" />
              <Line
                type="monotone"
                dataKey="averageScore"
                stroke="#0f172a"
                strokeWidth={3}
                dot={{ r: 3 }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </article>
      </section>
    </main>
  );
}
