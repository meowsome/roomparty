// Transforms commands into game events, if allowed. Does not touch the game state.

import type { Command } from "../shared/command";
import type { Actor } from "../shared/actor";
import type { CommandResult, CommandError } from "../shared/command";
import { getPlayerId } from "../shared/model/player";

import { resolveCommand } from "../game/resolve-command";

import { isPlayerConnected } from "./connections";
import { Room } from "./room";

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

    // If the command is allowed, resolve it into events to apply to the game state.
    const gameResult = resolveCommand(
        room.game,
        actor,
        command,
    );

    return gameResult;
}


// Manages the rules of a room.
// This is NOT where game rules are enforced.
function authorizeCommand(
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