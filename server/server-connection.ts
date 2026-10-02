// A server-side implementation of the Connection interface, which wraps a WebSocket connection.

import type { WebSocket } from "ws";

import type { ServerConnection } from "../shared/connection";
import type { ClientMessage, ServerMessage } from "../shared/message";

export class ServerWebSocketConnection implements ServerConnection {
    constructor(private socket: WebSocket) {}

    send(message: ServerMessage): void {
        this.socket.send(JSON.stringify(message));
    }

    receive(callback: (message: ClientMessage) => void): void {
        this.socket.on("message", raw => {
            const message = JSON.parse(raw.toString());
            callback(message);
        });
    }

    close(): void {
        this.socket.close();
    }

    receiveClose(callback: () => void): void {
        this.socket.on("close", callback);
    }
}