import type { ClientMessage, ServerMessage } from "./message.js";

export interface Connection<SendMessage, ReceiveMessage>  {

    send(message: SendMessage): void;

    receive(
        callback: (message: ReceiveMessage) => void,
    ): void;

    onClose(
        callback: () => void,
    ): void;

    close(): void;
}

export type ServerConnection =
    Connection<ServerMessage, ClientMessage>;

export type ClientConnection =
    Connection<ClientMessage, ServerMessage>;