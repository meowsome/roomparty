import type { WebSocket } from "ws";

import type { Connection } from "../shared/connection";

export class ServerConnection implements Connection {
    constructor(
        private socket: WebSocket,
    ) {}

    send(message: object): void {
        this.socket.send(JSON.stringify(message));
    }

    receive(callback: (message: object) => void): void {
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