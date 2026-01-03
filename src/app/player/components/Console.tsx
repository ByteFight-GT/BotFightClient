"use client";

import React from 'react';
import { CollapsibleDocker } from './CollapsibleDocker';

type ConsoleProps = {
	blueTeamName: string;
	greenTeamName: string;
};

/**
 * Console docker for match player.
 * We only have space to show one at a time i think so this will have tabs to switch between players
 */
export const Console = (props: ConsoleProps) => {

	const [selectedTab, setSelectedTab] = React.useState<PlayerColor_t>('blue');

	return (
		<CollapsibleDocker title="Console">
			<div className='Console-tabs-bar'>
				<div
				title={props.blueTeamName} 
				className={`Console-tab blue ${selectedTab === 'blue'? 'selected' : ''}`} 
				onClick={() => setSelectedTab('blue')}>
					<img src='/blue_team_icon.svg' alt={selectedTab[0]} className='Console-tab-icon' />
					<span>&nbsp;{props.blueTeamName}</span>
				</div>

				<div 
				title={props.greenTeamName}
				className={`Console-tab green ${selectedTab === 'green'? 'selected' : ''}`} 
				onClick={() => setSelectedTab('green')}>
					<img src='/green_team_icon.svg' alt={selectedTab[0]} className='Console-tab-icon' />
					<span>&nbsp;{props.greenTeamName}</span>
				</div>
			</div>

			<div className='Console-body'>
				Console body!!
				<br />
				Text
				<br />
				More text
				<br />
				Even more text!!!!
			</div>
		</CollapsibleDocker>
	);
};
