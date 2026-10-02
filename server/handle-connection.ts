// Handles the lifecycle of a connection to the server, including receiving commands, executing them, and sending back the resulting game state.

import type { ServerConnection } from "../shared/connection";
import type { Command } from "../shared/command";
import type { Actor } from "../shared/actor";
import { getPlayerId } from "../shared/model/player";
import { GameEvent } from "../shared/event";

import { getGameStateView } from "../game/view";
import { applyGameEvent } from "../game/apply-event";  

import { updateConnections, addConnection, removeConnection } from "./connections";
import { executeCommand } from "./execute-command";
import { type Room } from "../game/room";  

export function handleConnection(
    connection: ServerConnection,
    room: Room,
) {
    // Each connection has an associated actor, which starts as unassigned and can become a host or player.
    let actor: Actor = {
        type: "UNASSIGNED",
    };

    addConnection(room, connection);

    // Send the initial game state to the new connection.
    sendView(
        connection,
        room,
        actor,
    );

    connection.receive((raw) => {
        actor = handleMessage(
            connection,
            room,
            actor,
            raw,
        );
    });

    connection.receiveClose(() => {
        if (actor.type === "HOST") {
            room.game = applyGameEvent(room.game, {
                type: "HOST_DESTROYED",
            });
        }

        removeConnection(
            connection,
            room,
            actor,
        );
    });
}

function handleMessage(
    connection: ServerConnection,
    room: Room,
    actor: Actor,
    raw: object,
): Actor {
    // Command parsing and validation
    const command = raw as Command;
    if (command === null) {
        sendError(
            connection,
            "INVALID_COMMAND",
            "Invalid command.",
        );

        return actor;
    }

    // Execute the command and get the resulting events.
    const result = executeCommand(
        room,
        actor,
        command,
    );

    if (result.type === "ERROR") {
        sendError(
            connection,
            result.error.code,
            result.error.message,
        );

        return actor;
    }

    // Apply the events to the game state and update the actor and connections accordingly.
    for (const event of result.events) {
        room.game = applyGameEvent(room.game, event);
        actor = updateActor(actor, event);
        updateConnections(room, connection, event);
    }

    broadcastState(room);

    return actor;
}

function sendView(
    connection: ServerConnection,
    room: Room,
    actor: Actor,
) {
    // Provide the client with their view state as well as their actor identity.
    connection.send({
        type: "STATE",
        state: getGameStateView(
            room.game,
            actor,
        )
    });
}

function sendError(
    connection: ServerConnection,
    code: string,
    message: string,
) {
    connection.send({
        type: "ERROR",
        error: {
            code,
            message,
        },
    });
}

function broadcastState(
    room: Room,
) {
    if (room.connections.host !== null) {
        sendView(
            room.connections.host,
            room,
            {
                type: "HOST",
            },
        );
    }

    for (const [playerId, connection] of room.connections.players) {
        sendView(
            connection,
            room,
            {
                type: "PLAYER",
                playerId: playerId,
            },
        );
    }

    for (const connection of room.connections.unassigned) {
        sendView(
            connection,
            room,
            {
                type: "UNASSIGNED",
            },
        );
    }
}

function updateActor(
    actor: Actor,
    event: GameEvent,
): Actor {

    switch (event.type) {

        case "HOST_BECAME":
            return {
                type: "HOST",
            };

        case "PLAYER_BECAME":
            return {
                type: "PLAYER",
                playerId: getPlayerId(event.player.displayName),
            };

        case "HOST_DESTROYED":
            if (actor.type === "HOST") {
                return {
                    type: "UNASSIGNED",
                };
            }

            return actor;

        case "PLAYER_DESTROYED":
            if (
                actor.type === "PLAYER" &&
                actor.playerId === event.playerId
            ) {
                return {
                    type: "UNASSIGNED",
                };
            }

            return actor;

        default:
            return actor;
    }
}