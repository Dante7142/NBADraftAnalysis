import { FormulaDashboard } from '@/components/formula-dashboard';
import { getDraftPlayers, getOriginalLeaderboards } from '@/lib/data';

export default function Page() {
  const players = getDraftPlayers();
  const originalLeaderboards = getOriginalLeaderboards();

  return <FormulaDashboard players={players} originalLeaderboards={originalLeaderboards} />;
}
