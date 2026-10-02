// A room is a single instance of a game, with its own game state and connections.

import type { GameState, Round } from "../shared/model/game-state";
import type { Connections } from "../server/connections";

export type Room = {
    game: GameState;
    connections: Connections;
};

export function createRoom(rounds: any): Room {
    return {
        game: {
            revision: 0,
            host: false,
            players: {},
            phase: "VOTING",
            currentRound: 0,

            // Just dump it right in we can do validation later
            rounds: rounds,
        },

        connections: {
            host: null,
            players: new Map(),
            unassigned: new Set(),
        },
    };
}