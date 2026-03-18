import Link from 'next/link';
import { getFullOriginalLeaderboards, normalizePosition } from '@/lib/data';

type PageProps = {
  params: {
    position: string;
  };
};

export function generateStaticParams() {
  return [{ position: 'G' }, { position: 'F' }, { position: 'C' }];
}

export default function PositionLeaderboardPage({ params }: PageProps) {
  const position = normalizePosition(params.position);

  if (!position) {
    return (
      <main className="container">
        <section className="card">
          <h1>Leaderboard not found</h1>
          <p>Choose one of: G, F, or C.</p>
          <Link href="/" className="seeMoreButton">
            Back to dashboard
          </Link>
        </section>
      </main>
    );
  }

  const allBoards = getFullOriginalLeaderboards();
  const board = allBoards[position];

  return (
    <main className="container">
      <section className="card">
        <h1>{position} Full Leaderboard</h1>
        <p className="chartSubtitle">Based on original `leaderboards.csv` rankings.</p>
        <div className="seeMoreWrap" style={{ justifyContent: 'flex-start', marginBottom: '0.75rem' }}>
          <Link href="/" className="seeMoreButton">
            Back to dashboard
          </Link>
        </div>

        <div className="fullLeaderboardTableWrap">
          <table className="fullLeaderboardTable">
            <thead>
              <tr>
                <th>Rank</th>
                <th>Player</th>
                <th>Team</th>
                <th>Pick</th>
                <th>FinalScore</th>
              </tr>
            </thead>
            <tbody>
              {board.map((player) => (
                <tr key={`${position}-${player.rank}-${player.player}`}>
                  <td>{player.rank}</td>
                  <td>{player.player}</td>
                  <td>{player.team}</td>
                  <td>{player.pick}</td>
                  <td>{player.score.toFixed(3)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
