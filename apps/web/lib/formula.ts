import { DraftPlayer, FormulaWeights, MetricKey, Position } from './types';

export const ORIGINAL_FORMULA_WEIGHTS: Record<Position, FormulaWeights> = {
  G: {
    pts: 0.3643590224,
    trb: 0.1680422451,
    ast: 0.1915565534,
    stl: 0.0502018637,
    blk: 0.1179875371,
    tov: -0.011420381,
    fgPercent: -0.019626079,
    freeThrowPercent: 0.0180259115,
    threePointPercent: 0.0587804068,
    availability: 0.015
  },
  F: {
    pts: 0.2498149599,
    trb: 0.0528860681,
    ast: 0.4003164475,
    stl: -0.0150143829,
    blk: 0.1257441821,
    tov: -0.1051423144,
    fgPercent: -0.0100611978,
    freeThrowPercent: -0.0228781508,
    threePointPercent: -0.0181422966,
    availability: 0.015
  },
  C: {
    pts: 0.1567796142,
    trb: 0.1133047432,
    ast: 0.377695524,
    stl: -0.0007074915,
    blk: 0.0913250405,
    tov: -0.1527700789,
    fgPercent: 0.0571077744,
    freeThrowPercent: -0.0174904306,
    threePointPercent: 0.0324260233,
    availability: 0.015
  }
};

const metricValue = (player: DraftPlayer, key: MetricKey) =>
  key === 'availability' ? player.availability : player.metrics[key];

export const scorePosition = (
  players: DraftPlayer[],
  position: Position,
  weights: FormulaWeights
) => {
  return players
    .filter((player) => player.position === position)
    .map((player) => {
      const score = (Object.keys(weights) as MetricKey[]).reduce((sum, key) => {
        return sum + metricValue(player, key) * weights[key];
      }, 0);

      return {
        ...player,
        score
      };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 10);
};

export const isOriginalFormula = (weightsByPosition: Record<Position, FormulaWeights>) => {
  const tolerance = 1e-9;
  return (Object.keys(ORIGINAL_FORMULA_WEIGHTS) as Position[]).every((position) => {
    return (Object.keys(ORIGINAL_FORMULA_WEIGHTS[position]) as MetricKey[]).every((key) => {
      return Math.abs(weightsByPosition[position][key] - ORIGINAL_FORMULA_WEIGHTS[position][key]) <= tolerance;
    });
  });
};
