"use client";

import React from 'react';
import { CollapsibleDocker } from './CollapsibleDocker';

type GameInfoProps = {
	
};

export const GameInfo = (props: GameInfoProps) => {
	return (
		<CollapsibleDocker title="Game Info">
			<div className='p-4'>
				Game info docker body!!
			</div>
		</CollapsibleDocker>
	);
};
