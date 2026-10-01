// This file contains the types and functions for the game room. 
// The room is conceptually a "game server" that manages the game state and the connections to the clients.
// This is where the "command" -> "event" -> "update state" flow occurs. 

import type { Command } from "../shared/command";
import type { Actor } from "../shared/actor";
import type { GameState } from "../shared/state";
import type { CommandResult, CommandError } from "../shared/command";
import type { Connection } from "../shared/connection";
import { getPlayerId } from "../shared/model/player";

import { applyGameEvent } from "../game/reducer";
import { resolveCommand } from "../game/rules";

export type Room = {
    game: GameState;

    connections: {
        host: Connection | null;
        players: Map<string, Connection>;
        unassigned: Set<Connection>;
    };
};

export function createRoom(): Room {
    return {
        game: {
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

export function executeCommand(
    room: Room,
    actor: Actor,
    command: Command,
): CommandResult {


    // Check against the room's rules to see if the command is allowed.
    const roomResult = authorizeCommand(
        room,
        actor,
        command,
    );

    if (roomResult !== null) {
        return {
            type: "ERROR",
            error: roomResult,
        };
    }


    // Resolve the command into events to apply to the game state.
    const gameResult = resolveCommand(
        room.game,
        actor,
        command,
    );

    if (gameResult.type === "ERROR") {
        return gameResult;
    }

    // Apply the events to the game state.
    for (const event of gameResult.events) {
        room.game = applyGameEvent(
            room.game,
            event,
        );
    }

    return gameResult;
}


// Manages the rules of a room.
// This is NOT where game rules are enforced.
export function authorizeCommand(
    room: Room,
    actor: Actor,
    command: Command,
): CommandError | null {

    switch (command.type) {

        case "BECOME": {

            // A connection can only take on an identity if it
            // does not already have one.
            if (actor.type !== "UNASSIGNED") {
                return {
                    code: "ALREADY_ASSIGNED",
                    message: "This connection already has an identity.",
                };
            }

            if (command.role === "HOST") {

                // A host identity can only be taken if 
                // there is no host already connected.
                if (room.connections.host !== null) {
                    return {
                        code: "HOST_ALREADY_CONNECTED",
                        message: "A host is already connected.",
                    };
                }
            }

            if (command.role === "PLAYER") {

                const playerId = getPlayerId(
                    command.desiredName,
                );

                // A player identity can only be bound to one
                // connection at a time.
                if (isPlayerConnected(room, playerId)) {
                    return {
                        code: "PLAYER_ALREADY_CONNECTED",
                        message: "That player is already connected.",
                    };
                }
            }

            return null;
        }

        default:
            return null;
    }
}

function isPlayerConnected(room: Room, playerId: string): boolean {
    return room.connections.players.has(playerId);
}