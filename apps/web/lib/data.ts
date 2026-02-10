import fs from 'node:fs';
import path from 'node:path';
import Papa from 'papaparse';
import { DraftPlayer, LeaderboardPlayer, Position } from './types';

type RawDraftRow = {
  Player: string;
  Team: string;
  Pick: string;
  Position: string;
  AvailabilityScore: string;
  PTS: string;
  TRB: string;
  AST: string;
  STL: string;
  BLK: string;
  TOV: string;
  FGPercent: string;
  FreeThrowPercent: string;
  ThreePointPercent: string;
};

type RawLeaderboardRow = {
  Player: string;
  Team: string;
  Pick: string;
  Position: string;
  PosRank: string;
  FinalScore: string;
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

const getRootCsv = (filename: string) => path.resolve(process.cwd(), '..', '..', filename);

export const getDraftPlayers = (): DraftPlayer[] => {
  const csv = fs.readFileSync(getRootCsv('DraftData.csv'), 'utf8');

  const parsed = Papa.parse<RawDraftRow>(csv, {
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
          stl: toNumber(row.STL),
          blk: toNumber(row.BLK),
          tov: toNumber(row.TOV),
          fgPercent: toNumber(row.FGPercent),
          freeThrowPercent: toNumber(row.FreeThrowPercent),
          threePointPercent: toNumber(row.ThreePointPercent)
        }
      } satisfies DraftPlayer;
    })
    .filter((player): player is DraftPlayer => player !== null);
};

export const getOriginalLeaderboards = (): Record<Position, LeaderboardPlayer[]> => {
  const csv = fs.readFileSync(getRootCsv('leaderboards.csv'), 'utf8');
  const parsed = Papa.parse<RawLeaderboardRow>(csv, {
    header: true,
    skipEmptyLines: true,
    dynamicTyping: false
  });

  const grouped: Record<Position, LeaderboardPlayer[]> = { G: [], F: [], C: [] };

  parsed.data.forEach((row) => {
    const position = normalizePosition(row.Position);
    if (!position || !row.Player) {
      return;
    }

    const rank = toNumber(row.PosRank);
    if (rank < 1 || rank > 10) {
      return;
    }

    grouped[position].push({
      player: row.Player,
      team: row.Team || 'FA',
      pick: toNumber(row.Pick),
      position,
      availability: 0,
      metrics: {
        pts: 0,
        trb: 0,
        ast: 0,
        stl: 0,
        blk: 0,
        tov: 0,
        fgPercent: 0,
        freeThrowPercent: 0,
        threePointPercent: 0
      },
      score: toNumber(row.FinalScore),
      rank
    });
  });

  (Object.keys(grouped) as Position[]).forEach((position) => {
    grouped[position].sort((a, b) => (a.rank ?? 999) - (b.rank ?? 999));
  });

  return grouped;
};
