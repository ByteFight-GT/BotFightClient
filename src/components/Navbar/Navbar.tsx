import Link from 'next/link';
import './Navbar.css';

function Navbar() {
  return (
    <div className="navbar-container">
      <Link href="/player">Match Player</Link>
      <Link href="/replayer">Replayer</Link>
      <Link href="/mapbuilder">Map Builder</Link>
      <Link href="/settings">Settings</Link>
    </div>
  );
}

export default Navbar;
