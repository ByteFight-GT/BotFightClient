"use client";

import React from 'react';
import '../components.css';
import { CollapsibleDocker } from './CollapsibleDocker';

type MatchControllerProps = {
	
};

/**
 * Interface for users to start/queue new matches, pick bots, maps, etc 
 */
export const MatchController = (props: MatchControllerProps) => {
	return (
		<CollapsibleDocker title='Match Controller'>
			<div className='p-4'>
				Match controller Stuff! 
			</div>
		</CollapsibleDocker>
	);
};
