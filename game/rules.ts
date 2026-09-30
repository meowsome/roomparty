// This is where commands are handled.
// It takes the current game state, the actor (host or player), and the command, and returns 
// either an array of events to apply to the game state, or an error if the command is invalid.

import type { Command } from "../shared/command";
import type { Actor } from "../shared/actor";
import type { GameState } from "../shared/state";

import type { GameEvent } from "./event";

export type CommandError = {
    code: string;
    message: string;
};

export type CommandResult =
    | {
        type: "SUCCESS";
        events: GameEvent[];
    }
    | {
        type: "ERROR";
        error: CommandError;
    };

export function handleCommand(
    state: GameState,
    actor: Actor,
    command: Command,
): CommandResult {
    switch (command.type) {
        case "BECOME":
            switch (command.role) {
                case "HOST":
                    return becomeHost(state, actor);

                case "PLAYER":
                    return becomePlayer(state, actor, command.desiredName);
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
                    return destroyHost(state, actor);
                case "PLAYER":
                    return destroyPlayer(state, actor);
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

function becomeHost(state: GameState, actor: Actor): CommandResult {

    if (state.host) {
        return {
            type: "ERROR",
            error: {
                code: "HOST_EXISTS",
                message: "There is already a host in the game.",
            },
        };
    }

    if (actor.type !== "UNASSIGNED") {
        return {
            type: "ERROR",
            error: {
                code: "ALREADY_ASSIGNED",
                message: "This connection already has an identity.",
            },
        };
    }

    return {
        type: "SUCCESS",
        events: [
            {
                type: "HOST_BECAME"
            }
        ],
    };

}

function becomePlayer(state: GameState, actor: Actor, desiredName: string): CommandResult {
    if (actor.type !== "UNASSIGNED") {
        return {
            type: "ERROR",
            error: {
                code: "ALREADY_ASSIGNED",
                message: "This connection already has an identity.",
            },
        };
    }

    const name = desiredName.trim();

    if (name.length === 0) {
        return {
            type: "ERROR",
            error: {
                code: "INVALID_NAME",
                message: "Player name cannot be empty.",
            },
        };
    }

    if (isAlphanumeric(name) === false) {
        return {
            type: "ERROR",
            error: {
                code: "INVALID_NAME",
                message: "Player name must be alphanumeric.",
            },
        };
    }

    const key = normalizeName(name);

    // Rejoin as an existing Player
    const existingPlayer = state.players[key];
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
                    name: name,
                },
            },
        ],
    };
}

function destroyHost(state: GameState, actor: Actor): CommandResult {
    if (actor.type !== "HOST") {
        return {
            type: "ERROR",
            error: {
                code: "NOT_A_HOST",
                message: "Only the host can destroy themselves.",
            },
        };
    }

    return {
        type: "SUCCESS",
        events: [
            {
                type: "HOST_DESTROYED",
            }
        ]
    };
}

function destroyPlayer(state: GameState, actor: Actor): CommandResult {
    if (actor.type !== "PLAYER") {
        return {
            type: "ERROR",
            error: {
                code: "NOT_A_PLAYER",
                message: "Only a player can destroy themselves.",
            },
        };
    }

    const key = normalizeName(actor.name);

    if (!state.players[key]) {
        return {
            type: "ERROR",
            error: {
                code: "PLAYER_NOT_FOUND",
                message: "The player does not exist.",
            },
        };
    }

    return {
        type: "SUCCESS",
        events: [
            {
                type: "PLAYER_DESTROYED",
                playerName: actor.name,
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

function normalizeName(name: string): string {
    return name.trim().toLowerCase();
}

function isAlphanumeric(str: string): boolean {
  return /^[a-zA-Z0-9]+$/.test(str);
}
