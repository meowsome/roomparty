// This is the single function that mutates the game state. It takes the current state and an event, and returns the new state.
// It does not contain any validation logic. It is a simple pure function that applies the event to the state. 

import type { GameEvent } from "./event";
import type { GameState } from "../shared/state";
import { getPlayerId } from "../shared/model/player";

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
            const playerId = getPlayerId(event.player.displayName);
            return {
                ...state,
                players: {
                    ...state.players,
                    [playerId]: event.player,
                },
            };
        }

        case "PLAYER_DESTROYED": {
            const players = {
                ...state.players,
            };

            delete players[event.playerId];

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