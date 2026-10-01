import type { Connection } from "../shared/connection";

import type { Command } from "../shared/command";
import type { Actor } from "../shared/actor";
import { getPlayerId } from "../shared/model/player";

import type { GameEvent } from "../shared/event";
import { getGameStateView } from "../game/view";
import {
    executeCommand,
    type Room,
} from "./room";

export function handleConnection(
    connection: Connection,
    room: Room,
) {
    let actor: Actor = {
        type: "UNASSIGNED",
    };

    room.connections.unassigned.add(connection);

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
        removeConnection(
            connection,
            room,
            actor,
        );
    });
}

function handleMessage(
    connection: Connection,
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

    // Check if the command can be executed by this connection.
    if (!canExecute(connection,room,command)) {
        return actor;
    }

    // If so, execute the command and update the game state.
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

    // Handle special events that affect the connection identity.
    const newActor = handleEvents(
        connection,
        room,
        actor,
        result.events,
    );

    broadcastState(room);

    return newActor;
}

function canExecute(
    connection: Connection,
    room: Room,
    command: Command,
): boolean {
    if (command.type === "BECOME" && command.role === "PLAYER") {
        const name = command.desiredName
            .trim()
            .toLowerCase();

        const existingConnection = room.connections.players.get(name);

        if (existingConnection !== undefined && existingConnection !== connection) {
            sendError(
                connection,
                "PLAYER_ALREADY_CONNECTED",
                "That player is already connected.",
            );

            return false;
        }
    }

    return true;
}

function handleEvents(
    connection: Connection,
    room: Room,
    actor: Actor,
    events: GameEvent[],
): Actor {
    for (const event of events) {
        switch (event.type) {

            // Handle special event types that affect the connection identity.
            case "HOST_BECAME":
                room.connections.unassigned.delete(connection);
                actor = {
                    type: "HOST",
                };

                room.connections.host = connection;
                break;

            case "PLAYER_BECAME":
                room.connections.unassigned.delete(connection);

                actor = {
                    type: "PLAYER",
                    playerId: getPlayerId(event.player.displayName),
                };

                room.connections.players.set(
                    getPlayerId(event.player.displayName),
                    connection,
                );
                break;

            case "HOST_DESTROYED":
                room.connections.host = null;
                actor = {
                    type: "UNASSIGNED",
                };
                room.connections.unassigned.add(connection);
                break;

            case "PLAYER_DESTROYED":
                room.connections.players.delete(
                    getPlayerId(event.playerId),
                );
                actor = {
                    type: "UNASSIGNED",
                };
                room.connections.unassigned.add(connection);
                break;

        }
    }

    return actor;
}

function sendView(
    connection: Connection,
    room: Room,
    actor: Actor,
) {
    // Provide the client with their view state as well as their actor identity.
    connection.send({
        type: "STATE",
        state: getGameStateView(
            room.game,
            actor,
        ),
        actor: actor
    });
}

function sendError(
    connection: Connection,
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

function removeConnection(
    connection: Connection,
    room: Room,
    actor: Actor,
) {
    switch (actor.type) {
        case "HOST":
            if (room.connections.host === connection) {
                room.connections.host = null;
            }
            break;

        case "PLAYER": {

            if (room.connections.players.get(actor.playerId) === connection) {
                room.connections.players.delete(actor.playerId);
            }

            break;
        }

        case "UNASSIGNED":
            room.connections.unassigned.delete(connection);
            break;
    }
}