// Given a game state and a game event, returns the next game state after applying the event.
// This assumes events are valid.

import type { GameEvent } from "../shared/event.js";
import type { GameState } from "../shared/model/game-state.js";
import { getPlayerId } from "../shared/model/player.js";

import { assertNever } from "../shared/assert-never.js";

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

        case "VOTE_CAST":
            nextState = {
                ...state,
                // In our rounds,
                rounds: state.rounds.map((round, index) =>
                    // Find the round that matches the round in the event.
                    index === state.currentRound
                        // And then update the votes for that round
                        ? {
                            ...round,
                            votes: {
                                ...round.votes,
                                // With our new vote for this player.
                                [event.playerId]: event.vote,
                            },
                        }
                        // Otherwise don't touch it.
                        : round
                ),
            };
            break;

        case "GAME_ADVANCED":
            switch (state.phase) {
                case "VOTING":
                    nextState = {
                        ...state,
                        phase: "RESULTS",
                    };
                    break;
                case "RESULTS":
                    nextState = {
                        ...state,
                        phase: "WORD_CLOUD",
                    };
                    break;
                case "WORD_CLOUD":
                    nextState = {
                        ...state,
                        phase: "VOTING",
                        currentRound: state.currentRound + 1,
                    };
                    break;
                default:
                    return assertNever(state.phase);
            }
            break;
            

        default:
            return assertNever(event);
    }

    return {
        ...nextState,
        revision: state.revision + 1,
    };
}