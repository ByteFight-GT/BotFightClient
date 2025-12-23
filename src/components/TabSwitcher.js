import { useState } from 'react';
import LocalRenderer from './LocalRenderer';
import MapRenderer from './MapRenderer'
import Replayer from './Replayer'
import PlayerSettings from './PlayerSettings'

function TabSwitcher() {
  const [activeTab, setActiveTab] = useState(0);  // State to track active tab

  const handleTabClick = (index) => {
    setActiveTab(index);  // Change the active tab when clicked
  };

  return (
    <div className="h-screen flex flex-col">
      <div className="flex-none ml-2 space-x-2 border-gray-300">
        {/* Tab Buttons */}
        <button
          className={`px-4 py-2 rounded-t-md text-sm font-medium transition-colors duration-300 ${
            activeTab === 0
              ? 'bg-yellow-500 text-black border-b-2 border-yellow-500'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
          onClick={() => handleTabClick(0)}
        >
          Match Player
        </button>
        <button
          className={`px-4 py-2 rounded-t-md text-sm font-medium transition-colors duration-300 ${
            activeTab === 1
              ? 'bg-yellow-500 text-black border-b-2 border-yellow-500'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
          onClick={() => handleTabClick(1)}
        >
          Map Builder
        </button>
        <button
          className={`px-4 py-2 rounded-t-md text-sm font-medium transition-colors duration-300 ${
            activeTab === 2
              ? 'bg-yellow-500 text-black border-b-2 border-yellow-500'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
          onClick={() => handleTabClick(2)}
        >
          Match Replayer
        </button>
        <button
          className={`px-4 py-2 rounded-t-md text-sm font-medium transition-colors duration-300 ${
            activeTab === 3
              ? 'bg-yellow-500 text-black border-b-2 border-yellow-500'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
          onClick={() => handleTabClick(3)}
        >
          Settings
        </button>
      </div>

        {/* Tab Content */}
        {activeTab === 0 && (
            <LocalRenderer />
        )}
        {activeTab === 1 && (

            <MapRenderer />

        )}
        {activeTab === 2 && (

            <Replayer />

        )}
        {activeTab === 3 && (

            <PlayerSettings />

        )}
      
    </div>
  );
}

export default TabSwitcher;
