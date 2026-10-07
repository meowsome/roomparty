// A room is a single instance of a game, with its own game state and associated sessions.

import type { ServerConnection } from "../shared/connection.js";
import type { GameState } from "../shared/model/game-state.js";
import type { ClientMessage } from "../shared/message.js"
import type { Actor } from "../shared/actor.js"
import type { Command, CommandError } from "../shared/command.js"
import { GameEvent } from "../shared/event.js";

import { getPlayerId } from "../shared/model/player.js";

import { resolveCommand } from "./resolve-command.js";
import { applyGameEvent } from "./apply-event.js";
import { getGameStateView } from "./view.js";
import { ClientGameStateView } from "../shared/model/game-state-view.js";

export class Room {
    gameState: GameState;
    hostPassword: string;

    private hostConnection: ServerConnection | null = null;
    private unassignedConnections = new Set<ServerConnection>();
    private playerConnections = new Map<string, ServerConnection>();

    private lastViewKey = new Map<ServerConnection, string>(); // for deduplication

    constructor(rounds: any, hostPassword: string)
    {
        // Initialize game state
        this.gameState = {
            revision: 0,
            players: {},
            host: false,
            phase: "VOTING",
            currentRound: 0,

            // Just dump it right in we can do validation later
            rounds: rounds,
        };

        this.hostPassword = hostPassword;
    }

    // Handles the actual message from a connection.
    private receive(
        connection: ServerConnection,
        message: ClientMessage,
    ): void {
        const actor = this.getActor(connection);

        console.log("[ACTOR]\t\t", actor);
        console.log("[MESSAGE]\t", message);
        console.log();
       
        // Future expansion would probably see a switch on this
        const command = message as Command;

        // Check if a command is authorized against the room's rules.
        const error = this.authorizeCommand(
            actor,
            command,
        );

        if (error !== null) {
            connection.send({
                type: "ERROR",
                error,
            });

            return;
        }

        // Turn the command into an actual set of events that can effect state.
        const result = resolveCommand(
            this.gameState,
            actor,
            command,
        );

        if (result.type === "ERROR") {
            connection.send({
                type: "ERROR",
                error: result.error,
            });

            return;
        }

        // Apply the event to the game state, as well as the current connections.
        this.applyEvents(connection, result.events);
    }

    // Take the events, mutate game state + room connection state,
    // and broadcast the new resulting game state.
    private applyEvents(
        connection: ServerConnection,
        events: GameEvent[],
    ): void {
        for (const event of events) {
            // Purely functional game state update
            this.gameState = applyGameEvent(this.gameState, event);

            // Imperative room update
            this.applyRoomEvent(connection, event)
        }

        this.broadcastState();
    }

    private broadcastState(): void {
        if (this.hostConnection !== null) {
            this.sendState(this.hostConnection);
        }

        for (const connection of this.playerConnections.values()) {
            this.sendState(connection);
        }

        for (const connection of this.unassignedConnections) {
            this.sendState(connection);
        }
    }

    private sendState(
        connection: ServerConnection,
    ): void {
        const actor = this.getActor(connection);
        const view = getGameStateView(this.gameState, actor);

        const key = JSON.stringify(view);

        if (key === this.lastViewKey.get(connection)) {
            // Prevent sending a duplicate state
            return;
        }

        connection.send({
            type: "VIEW",
            revision: this.gameState.revision,
            view: view
        });

        this.lastViewKey.set(connection, key);
    }

    addConnection(
        connection: ServerConnection,
    ): void {
        this.unassignedConnections.add(connection);

        connection.receive(message => {
            this.receive(connection, message);
        });

        connection.onClose(() => {
            this.removeConnection(connection);
        });

        this.sendState(connection);
    }

    removeConnection(connection: ServerConnection): void {
        this.unassignedConnections.delete(connection);

        if (this.hostConnection === connection) {
            this.hostConnection = null;
        }

        for (const [playerId, playerConnection] of this.playerConnections) {
            if (playerConnection === connection) {
                this.playerConnections.delete(playerId);
            }
        }
    }

    private getActor(
        connection: ServerConnection,
    ): Actor {
        if (this.hostConnection === connection) {
            return {
                type: "HOST",
            };
        }

        for (const [playerId, playerConnection] of this.playerConnections) {
            if (playerConnection === connection) {
                return {
                    type: "PLAYER",
                    playerId,
                };
            }
        }

        return {
            type: "UNASSIGNED",
        };
    }

    private authorizeCommand(
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

                    // The name of the host must match the super secret password.
                if (command.desiredName !== this.hostPassword) {
                        return {
                            code: "HOST_PASSWORD_INCORRECT",
                            message: "The host password is incorrect.",
                        };
                    }

                    // A host identity can only be taken if 
                    // there is no host already connected.
                    if (this.hostConnection !== null) {
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
                    if (this.playerConnections.has(playerId)) {
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

    // Handle the effects of events on the current state of connections in a room
    private applyRoomEvent(
        connection: ServerConnection,
        event: GameEvent,
    ): void {
        switch (event.type) {
            case "HOST_BECAME":
                this.unassignedConnections.delete(connection);
                this.hostConnection = connection;
                return;

            case "PLAYER_BECAME": {
                const playerId = getPlayerId(event.player.displayName);

                this.unassignedConnections.delete(connection);
                this.playerConnections.set(playerId, connection);

                return;
            }

            case "HOST_DESTROYED":
                if (this.hostConnection !== null) {
                    this.unassignedConnections.add(this.hostConnection);
                    this.hostConnection = null;
                }

                return;

            case "PLAYER_DESTROYED": {
                const playerConnection = this.playerConnections.get(event.playerId);

                if (playerConnection !== undefined) {
                    this.playerConnections.delete(event.playerId);
                    this.unassignedConnections.add(playerConnection);
                }

                return;
            }

            default:
                return;
        }
    }
}