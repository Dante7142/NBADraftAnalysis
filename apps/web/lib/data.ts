import fs from 'node:fs';
import path from 'node:path';
import Papa from 'papaparse';
import { DraftPlayer, Position } from './types';

type RawRow = {
  Player: string;
  Team: string;
  Pick: string;
  Position: string;
  AvailabilityScore: string;
  PTS: string;
  TRB: string;
  AST: string;
  WS: string;
  BPM: string;
  VORP: string;
  STL: string;
  BLK: string;
  TOV: string;
};

const toNumber = (value: string | undefined) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const normalizePosition = (value: string): Position | null => {
  if (value === 'G' || value === 'F' || value === 'C') {
    return value;
  }
  return null;
};

export const getDraftPlayers = (): DraftPlayer[] => {
  const csvPath = path.resolve(process.cwd(), '..', '..', 'DraftData.csv');
  const csv = fs.readFileSync(csvPath, 'utf8');

  const parsed = Papa.parse<RawRow>(csv, {
    header: true,
    skipEmptyLines: true,
    dynamicTyping: false
  });

  return parsed.data
    .map((row) => {
      const position = normalizePosition(row.Position);
      if (!position || !row.Player) {
        return null;
      }

      return {
        player: row.Player,
        team: row.Team || 'FA',
        pick: toNumber(row.Pick),
        position,
        availability: toNumber(row.AvailabilityScore),
        metrics: {
          pts: toNumber(row.PTS),
          trb: toNumber(row.TRB),
          ast: toNumber(row.AST),
          ws: toNumber(row.WS),
          bpm: toNumber(row.BPM),
          vorp: toNumber(row.VORP),
          stl: toNumber(row.STL),
          blk: toNumber(row.BLK),
          tov: toNumber(row.TOV)
        }
      } satisfies DraftPlayer;
    })
    .filter((player): player is DraftPlayer => player !== null);
};
