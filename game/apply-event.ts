// Given a game state and a game event, returns the next game state after applying the event.
// This assumes events are valid.

import type { GameEvent } from "../shared/event";
import type { GameState } from "../shared/model/game-state";
import { getPlayerId } from "../shared/model/player";

import { assertNever } from "../shared/assert-never";

export function applyGameEvent(
    state: GameState,
    event: GameEvent,
): GameState {
    let nextState: GameState;

    switch (event.type) {
        case "HOST_BECAME": 
            nextState = {
                ...state,
                host: true,
            };
            break;

        case "HOST_DESTROYED": 
            nextState = {
                ...state,
                host: false,
            };
            break;

        case "PLAYER_BECAME": 
            const playerId = getPlayerId(event.player.displayName);
            nextState = {
                ...state,
                players: {
                    ...state.players,
                    [playerId]: event.player,
                },
            };
            break;

        case "PLAYER_DESTROYED": 
            const players = {
                ...state.players,
            };

            delete players[event.playerId];

            nextState = {
                ...state,
                players,
            };
            break;

        case "COUNTER_INCREMENTED": 
            nextState = {
                ...state,
                counter: state.counter + 1,
            };
            break;

        case "COUNTER_DECREMENTED": 
            nextState = {
                ...state,
                counter: state.counter - 1,
            };
            break;

        case "COUNTER_RESET": 
            nextState = {
                ...state,
                counter: 0,
            };
            break;

        default:
            return assertNever(event);
    }

    return {
        ...nextState,
        revision: state.revision + 1,
    };
}