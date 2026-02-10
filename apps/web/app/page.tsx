import { FormulaDashboard } from '@/components/formula-dashboard';
import { getDraftPlayers } from '@/lib/data';

export default function Page() {
  const players = getDraftPlayers();
  return <FormulaDashboard players={players} />;
}
