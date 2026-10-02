import type { ClientConnection } from "../../shared/connection";
import type { ClientMessage, ServerMessage } from "../../shared/message";

export class ClientWebSocketConnection implements ClientConnection {
    private socket: WebSocket;

    constructor(url: string) {
        this.socket = new WebSocket(url);
    }

    send(message: ClientMessage): void {
        this.socket.send(JSON.stringify(message));
    }

    receive(callback: (message: ServerMessage) => void): void {
        this.socket.onmessage = event => {
            const message: ServerMessage = JSON.parse(event.data);
            callback(message);
        };
    }

    close(): void {
        this.socket.close();
    }

    receiveClose(callback: () => void): void {
        this.socket.onclose = callback;
    }
}