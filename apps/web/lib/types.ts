export type Position = 'G' | 'F' | 'C';

export type DraftPlayer = {
  player: string;
  team: string;
  pick: number;
  position: Position;
  availability: number;
  metrics: {
    pts: number;
    trb: number;
    ast: number;
    stl: number;
    blk: number;
    tov: number;
    fgPercent: number;
    freeThrowPercent: number;
    threePointPercent: number;
  };
};

export type LeaderboardPlayer = DraftPlayer & {
  score: number;
  rank?: number;
};

export type MetricKey = keyof DraftPlayer['metrics'] | 'availability';

export type FormulaWeights = Record<MetricKey, number>;
