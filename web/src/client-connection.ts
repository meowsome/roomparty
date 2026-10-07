import type { ClientConnection } from "../../shared/connection";
import type { ClientMessage, ServerMessage } from "../../shared/message";

export class ClientWebSocketConnection implements ClientConnection {

    private readonly socket: WebSocket;

    constructor(url: string) {
        this.socket = new WebSocket(url);
    }

    send(message: ClientMessage): void {
        this.socket.send(
            JSON.stringify(message),
        );
    }

    receive(
        callback: (message: ServerMessage) => void,
    ): void {
        this.socket.addEventListener(
            "message",
            event => {
                const message: ServerMessage =
                    JSON.parse(event.data);

                callback(message);
            },
        );
    }

    onClose(
        callback: () => void,
    ): void {
        this.socket.addEventListener(
            "close",
            callback,
        );
    }

    close(): void {
        this.socket.close();
    }
}