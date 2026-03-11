import { useRaceStore } from './store/raceStore';
import TeamSetup from './components/setup/TeamSetup';
import RaceTrack from './components/race/RaceTrack';
import ResultBoard from './components/result/ResultBoard';

export default function App() {
  const { raceState } = useRaceStore();

  if (!raceState) {
    return <TeamSetup />;
  }

  if (raceState.phase === 'result') {
    return <ResultBoard />;
  }

  return <RaceTrack />;
}
