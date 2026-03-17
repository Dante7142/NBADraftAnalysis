'use client';

import { useMemo, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ReferenceLine,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';
import { DEFAULT_WEIGHTS, scorePosition } from '@/lib/formula';
import { DraftPlayer, FormulaWeights, MetricKey, Position } from '@/lib/types';

const METRIC_LABELS: Record<MetricKey, string> = {
  pts: 'PTS',
  trb: 'TRB',
  ast: 'AST',
  ws: 'Win Shares',
  bpm: 'BPM',
  vorp: 'VORP',
  stl: 'STL',
  blk: 'BLK',
  tov: 'TOV (penalty)',
  availability: 'Availability'
};

type Props = {
  players: DraftPlayer[];
};

export function FormulaDashboard({ players }: Props) {
  const [activePosition, setActivePosition] = useState<Position>('G');
  const [weightsByPosition, setWeightsByPosition] = useState<Record<Position, FormulaWeights>>(
    DEFAULT_WEIGHTS
  );

  const leaderboards = useMemo(
    () => ({
      G: scorePosition(players, 'G', weightsByPosition.G).slice(0, 10),
      F: scorePosition(players, 'F', weightsByPosition.F).slice(0, 10),
      C: scorePosition(players, 'C', weightsByPosition.C).slice(0, 10)
    }),
    [players, weightsByPosition]
  );

  const activeBoard = leaderboards[activePosition];

  const teamComparison = useMemo(() => {
    const grouped = new Map<string, { total: number; count: number }>();
    activeBoard.forEach((player) => {
      const current = grouped.get(player.team) ?? { total: 0, count: 0 };
      grouped.set(player.team, {
        total: current.total + player.score,
        count: current.count + 1
      });
    });

    return [...grouped.entries()]
      .map(([team, values]) => ({
        team,
        avgScore: Number((values.total / values.count).toFixed(2)),
        players: values.count
      }))
      .sort((a, b) => b.avgScore - a.avgScore);
  }, [activeBoard]);

  const outlierThreshold = useMemo(() => {
    if (activeBoard.length === 0) return 0;
    const mean = activeBoard.reduce((sum, p) => sum + p.score, 0) / activeBoard.length;
    const variance = activeBoard.reduce((sum, p) => sum + (p.score - mean) ** 2, 0) / activeBoard.length;
    return mean + Math.sqrt(variance);
  }, [activeBoard]);

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
      <h1>NBA Draft Performance Formula Lab</h1>
      <p>
        Tune the score formula by position. Each slider change recalculates the top-10 leaderboard in
        real time.
      </p>

      <section className="card">
        <div className="positionTabs">
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

        <div className="sliderGrid">
          {(Object.keys(weightsByPosition[activePosition]) as MetricKey[]).map((metric) => {
            const value = weightsByPosition[activePosition][metric];
            return (
              <label key={metric}>
                <span>
                  {METRIC_LABELS[metric]}: <strong>{value.toFixed(2)}</strong>
                </span>
                <input
                  type="range"
                  min={-2}
                  max={2}
                  step={0.05}
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
            <h2>{position} Leaderboard (Top 10)</h2>
            <ol>
              {leaderboards[position].map((player) => (
                <li key={`${position}-${player.player}`}>
                  <img
                    src={`https://ui-avatars.com/api/?name=${encodeURIComponent(player.player)}&background=random`}
                    alt={player.player}
                    width={34}
                    height={34}
                  />
                  <div>
                    <strong>{player.player}</strong>
                    <small>
                      {player.team} • Pick #{player.pick}
                    </small>
                  </div>
                  <span>{player.score.toFixed(2)}</span>
                </li>
              ))}
            </ol>
          </article>
        ))}
      </section>

      <section className="grid twoUp">
        <article className="card chartCard">
          <h2>{activePosition}: Team Comparison (Top 10)</h2>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={teamComparison}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="team" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="avgScore" fill="#1d4ed8" name="Avg score" />
              <Bar dataKey="players" fill="#14b8a6" name="# of players" />
            </BarChart>
          </ResponsiveContainer>
        </article>

        <article className="card chartCard">
          <h2>{activePosition}: Outlier View (Pick vs Score)</h2>
          <ResponsiveContainer width="100%" height={280}>
            <ScatterChart>
              <CartesianGrid />
              <XAxis dataKey="pick" name="Draft pick" />
              <YAxis dataKey="score" name="Formula score" />
              <Tooltip cursor={{ strokeDasharray: '3 3' }} />
              <ReferenceLine y={outlierThreshold} stroke="#dc2626" label="Outlier threshold" />
              <Scatter data={activeBoard} fill="#9333ea" />
            </ScatterChart>
          </ResponsiveContainer>
        </article>
      </section>
    </main>
  );
}
