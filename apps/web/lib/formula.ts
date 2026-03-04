import { DraftPlayer, FormulaWeights, MetricKey, Position } from './types';

export const DEFAULT_WEIGHTS: Record<Position, FormulaWeights> = {
  G: {
    pts: 1.2,
    trb: 0.6,
    ast: 1.3,
    ws: 1,
    bpm: 1,
    vorp: 1,
    stl: 0.9,
    blk: 0.3,
    tov: -0.7,
    availability: 0.8
  },
  F: {
    pts: 1.1,
    trb: 1,
    ast: 0.7,
    ws: 1,
    bpm: 1,
    vorp: 0.9,
    stl: 0.7,
    blk: 0.8,
    tov: -0.6,
    availability: 0.8
  },
  C: {
    pts: 1,
    trb: 1.3,
    ast: 0.5,
    ws: 1.1,
    bpm: 1,
    vorp: 1,
    stl: 0.5,
    blk: 1.2,
    tov: -0.6,
    availability: 0.9
  }
};

const metricValue = (player: DraftPlayer, key: MetricKey) =>
  key === 'availability' ? player.availability : player.metrics[key];

const zScore = (value: number, mean: number, stdDev: number) => {
  if (stdDev === 0) {
    return 0;
  }
  return (value - mean) / stdDev;
};

export const scorePosition = (
  players: DraftPlayer[],
  position: Position,
  weights: FormulaWeights
) => {
  const pool = players.filter((player) => player.position === position);
  const metrics = Object.keys(weights) as MetricKey[];

  const stats = Object.fromEntries(
    metrics.map((key) => {
      const values = pool.map((player) => metricValue(player, key));
      const mean = values.reduce((sum, value) => sum + value, 0) / Math.max(values.length, 1);
      const variance =
        values.reduce((sum, value) => sum + (value - mean) ** 2, 0) / Math.max(values.length, 1);
      return [key, { mean, stdDev: Math.sqrt(variance) }];
    })
  ) as Record<MetricKey, { mean: number; stdDev: number }>;

  return pool
    .map((player) => {
      const score = metrics.reduce((sum, key) => {
        const value = metricValue(player, key);
        const { mean, stdDev } = stats[key];
        return sum + zScore(value, mean, stdDev) * weights[key];
      }, 0);

      return {
        ...player,
        score
      };
    })
    .sort((a, b) => b.score - a.score);
};
