// This takes a command and an actor, and returns the resulting game events if the command is valid, or an error if it is not. 
// It does not mutate the game state.

import type { Command, CommandResult } from "../shared/command.js";
import type { Actor } from "../shared/actor.js";
import type { GameState, Vote } from "../shared/model/game-state.js";
import { getPlayerId } from "../shared/model/player.js";

import { assertNever } from "../shared/assert-never.js";

export function resolveCommand(
    state: GameState,
    actor: Actor,
    command: Command,
): CommandResult {
    switch (command.type) {
        case "BECOME":
            switch (command.role) {
                case "HOST":
                        return {
                            type: "SUCCESS",
                            events: [
                                {
                                    type: "HOST_BECAME"
                                }
                            ],
                        };
                case "PLAYER":
                    return becomePlayer(state, command.desiredName);
                default:
                    return {
                        type: "ERROR",
                        error: {
                            code: "INVALID_ROLE",
                            message: "The provided role is not recognized.",
                        },
                    };
            }
            
        case "DESTROY":
            switch(actor.type){
                case "HOST":
                        return {
                            type: "SUCCESS",
                            events: [
                                {
                                    type: "HOST_DESTROYED",
                                }
                            ]
                        };
                case "PLAYER":
                    return destroyPlayer(state, actor.playerId);
                default:
                    return {
                        type: "ERROR",
                        error: {
                            code: "NOT_A_HOST_OR_PLAYER",
                            message: "Only a host or player can destroy themselves.",
                        },
                    };
            }

        case "CAST_VOTE":
            return castVote(state, actor, command.vote);
        case "ADVANCE_GAME":
            return advanceGame(state, actor);

        default:
            return assertNever(command);
    }
}

function becomePlayer(state: GameState, desiredName: string): CommandResult {

    const cleanDesiredName = desiredName.trim();

    if (cleanDesiredName.length === 0) {
        return {
            type: "ERROR",
            error: {
                code: "INVALID_NAME",
                message: "Player name cannot be empty.",
            },
        };
    }

    if (isAlphanumeric(cleanDesiredName) === false) {
        return {
            type: "ERROR",
            error: {
                code: "INVALID_NAME",
                message: "Player name must be alphanumeric.",
            },
        };
    }

    const playerId = getPlayerId(cleanDesiredName);

    // Rejoin as an existing Player
    const existingPlayer = state.players[playerId];
    if (existingPlayer !== undefined) {
        return {
            type: "SUCCESS",
            events: [
                {
                    type: "PLAYER_BECAME",
                    player: existingPlayer,
                },
            ],
        };
    }

    // Otherwise, create a new Player
    return {
        type: "SUCCESS",
        events: [
            {
                type: "PLAYER_BECAME",
                player: {
                    displayName: cleanDesiredName,
                },
            },
        ],
    };
}

function destroyPlayer(state: GameState, playerId: string): CommandResult {

    if (!state.players[playerId]) {
        return {
            type: "ERROR",
            error: {
                code: "PLAYER_NOT_FOUND",
                message: "The player does not exist in the game.",
            },
        };
    }

    return {
        type: "SUCCESS",
        events: [
            {
                type: "PLAYER_DESTROYED",
                playerId: playerId,
            }
        ]
    };
}

function castVote(state: GameState, actor: Actor, vote: Vote): CommandResult {
    if (actor.type !== "PLAYER") {
        return {
            type: "ERROR",
            error: {
                code: "NOT_A_PLAYER",
                message: "Only a player can cast a vote.",
            },
        };
    }

    if (state.phase !== "VOTING") {
        return {
            type: "ERROR",
            error: {
                code: "NOT_VOTING_PHASE",
                message: "Votes can only be cast during the voting phase.",
            },
        };
    }

    return {
        type: "SUCCESS",
        events: [
            {
                type: "VOTE_CAST",
                playerId: actor.playerId,
                vote: vote,
            }
        ]
    };

}

function advanceGame(
    state: GameState,
    actor: Actor,
): CommandResult {

    if (actor.type !== "HOST") {
        return {
            type: "ERROR",
            error: {
                code: "NOT_A_HOST",
                message: "Only the host can advance the game.",
            },
        };
    }

    switch (state.phase) {
        case "VOTING":
        case "RESULTS":
            return {
                type: "SUCCESS",
                events: [
                    { type: "GAME_ADVANCED" },
                ],
            };

        case "WORD_CLOUD":
            if (state.currentRound >= state.rounds.length - 1) {
                return {
                    type: "ERROR",
                    error: {
                        code: "GAME_COMPLETE",
                        message: "There are no more rounds.",
                    },
                };
            }

            return {
                type: "SUCCESS",
                events: [
                    { type: "GAME_ADVANCED" },
                ],
            };

        default:
            return assertNever(state.phase);
    }
}


function isAlphanumeric(str: string): boolean {
  return /^[a-zA-Z0-9]+$/.test(str);
}
