"use client";

import React from 'react';

type GameWindowProps = {
	
};

export const GameWindow = (props: GameWindowProps) => {
	return (
		<div className='GameWindow-container'>
			<img src="https://edgychess.com/images/Edgy_Chess_Setup_3d.png" alt="Game Window" className='GameWindow-image' />
		</div>
	);
};
