// This is the single function that mutates the game state. It takes the current state and an event, and returns the new state.
// It does not contain any validation logic. It is a simple pure function that applies the event to the state. 

import type { GameEvent } from "./event";
import type { GameState } from "./state";

export function applyEvent(
    state: GameState,
    event: GameEvent,
): GameState {
    switch (event.type) {
        case "HOST_BECAME":
            return {
                ...state,
                host: true,
            };

        case "HOST_DESTROYED":
            return {
                ...state,
                host: false,
            };

        case "PLAYER_BECAME": {
            const key = normalizeName(event.player.name);

            return {
                ...state,
                players: {
                    ...state.players,
                    [key]: event.player,
                },
            };
        }

        case "PLAYER_DESTROYED": {
            const players = {
                ...state.players,
            };

            delete players[event.playerName];

            return {
                ...state,
                players,
            };
        }

        case "COUNTER_INCREMENTED":
            return {
                ...state,
                counter: state.counter + 1,
            };

        case "COUNTER_DECREMENTED":
            return {
                ...state,
                counter: state.counter - 1,
            };

        case "COUNTER_RESET":
            return {
                ...state,
                counter: 0,
            };
    }
}

function normalizeName(name: string): string {
    return name.trim().toLowerCase();
}