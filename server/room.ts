// A room is a single instance of a game, with its own game state and connections.

import type { GameState } from "../shared/model/game-state";
import type { Connections } from "./connections";

export type Room = {
    game: GameState;
    connections: Connections;
};

export function createRoom(): Room {
    return {
        game: {
            revision: 0,
            counter: 0,
            host: false,
            players: {},
        },

        connections: {
            host: null,
            players: new Map(),
            unassigned: new Set(),
        },
    };
}