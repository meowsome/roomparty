// A server-side implementation of the Connection interface, which wraps a WebSocket connection.

import type { WebSocket } from "ws";

import type { ServerConnection } from "../shared/connection.js";
import type { ClientMessage, ServerMessage } from "../shared/message.js";

export class ServerWebSocketConnection
    implements ServerConnection {

    private readonly socket: WebSocket;

    constructor(socket: WebSocket) {
        this.socket = socket;
    }

    send(message: ServerMessage): void {
        this.socket.send(JSON.stringify(message),);
    }

    // Registers a callback to receive our messages.
    receive(callback: (message: ClientMessage) => void): void {
        this.socket.on(
            "message",
            data => {
                const message: ClientMessage = JSON.parse(data.toString());
                callback(message);
            },
        );
    }

    onClose(
        callback: () => void,
    ): void {
        this.socket.on(
            "close",
            callback,
        );
    }

    close(): void {
        this.socket.close();
    }
}