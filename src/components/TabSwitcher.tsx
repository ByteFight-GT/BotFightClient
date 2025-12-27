import Link from 'next/link';

function TabSwitcher() {
  return (
    <div className="flex-none ml-2 space-x-2 border-gray-300">
      <Link href="/player">Match Player</Link>
      <Link href="/replayer">Replayer</Link>
      <Link href="/mapbuilder">Map Builder</Link>
      <Link href="/settings">Settings</Link>
    </div>
  );
}

export default TabSwitcher;
