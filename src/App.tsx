import { useRaceStore } from './store/raceStore';
import TeamSetup from './components/TeamSetup';
import RaceTrack from './components/RaceTrack';
import ResultBoard from './components/ResultBoard';
import './styles/race.css';

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
