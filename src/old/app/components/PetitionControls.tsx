import Search from './Search';
import StatusButtons from './statusButtons';
import PetitionSort from './PetitionSort';
import './petitioncontrols.css';

export default function PetitionControls() {
  return (
    <section className="petition-controls" aria-label="Search, filter, and sort petitions">
      <Search placeholder="Search petitions..." />
      <div className="petition-controls-options">
        <StatusButtons />
        <PetitionSort />
      </div>
    </section>
  );
}
