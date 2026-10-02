import type { ClientMessage, ServerMessage } from "./message";

export interface Connection<SendMessage, ReceiveMessage>  {

    // Send a message
    send(message: SendMessage): void;

    // Set up a callback to receive messages.
    receive(callback: (message: ReceiveMessage) => void): void;

    // Close the connection.
    close(): void;

    // Set up a callback to receive a close from the other side of the connection.
    receiveClose(callback: () => void): void;
}

export type ServerConnection =
    Connection<ServerMessage, ClientMessage>;

export type ClientConnection =
    Connection<ClientMessage, ServerMessage>;