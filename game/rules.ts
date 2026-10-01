// This is where commands are resolved.
// It takes the current game state, the actor (host or player), and the command, and resolves it into 
// either an array of events to apply to the game state, or an error if the command is invalid.

import type { Command, CommandResult, CommandError } from "../shared/command";
import type { Actor } from "../shared/actor";
import type { GameState } from "../shared/model/game-state";

import type { GameEvent } from "../shared/event";
import { getPlayerId } from "../shared/model/player";
import { isKeyObject } from "util/types";

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

        case "INCREMENT":
            return increment(state, actor);

        case "DECREMENT":
            return decrement(state, actor);

        case "RESET_COUNTER":
            return resetCounter(state, actor);
        
        default:
            return {
                type: "ERROR",
                error: {
                    code: "INVALID_COMMAND",
                    message: "The provided command is not recognized.",
                },
            };
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

function increment(state: GameState, actor: Actor): CommandResult {
    if (actor.type !== "PLAYER")
    {
        return {
            type: "ERROR",
            error: {
                code: "NOT_A_PLAYER",
                message: "Only a player can increment the counter.",
            },
        };
    }


    return {
        type: "SUCCESS",
        events: [
            {
                type: "COUNTER_INCREMENTED",
            }
        ],
    };
}

function decrement(state: GameState, actor: Actor): CommandResult {
    if (actor.type !== "PLAYER") {
        return {
            type: "ERROR",
            error: {
                code: "NOT_A_PLAYER",
                message: "Only a player can decrement the counter.",
            },
        };
    }

    return {
        type: "SUCCESS",
        events: [
            {
                type: "COUNTER_DECREMENTED",
            }
        ],
    };
}

function resetCounter(state: GameState, actor: Actor): CommandResult {
    if (actor.type !== "HOST")
    {
        return {
            type: "ERROR",
            error: {
                code: "NOT_A_HOST",
                message: "Only the host can reset the counter.",
            },
        };
    }

    return {
        type: "SUCCESS",
        events: [
            {
                type: "COUNTER_RESET",
            }
        ],
    };
}

function isAlphanumeric(str: string): boolean {
  return /^[a-zA-Z0-9]+$/.test(str);
}
