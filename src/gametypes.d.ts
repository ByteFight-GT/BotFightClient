/**
 * Stores gamestate data corresponding to a player during the game, like their stamina, paint, etc.
 */
type PlayerGameState_t = {
	totalPaint: number; // sum of all # of layers of paint on all tiles
	uniquePaintedCells: number; // # of UNIQUE tiles painted (ignores multi-layered)
	
	stamina: number;
	maxStamina: number;
	
	controlledHills: Set<number>;
	
	beaconCount: number;
}

type PlayerColor_t = 'blue' | 'green';
