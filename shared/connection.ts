export interface Connection {

    // Send a message
    send(message: object): void;

    // Set up a callback to receive messages.
    receive(callback: (message: object) => void): void;

    // Close the connection.
    close(): void;

    // Set up a callback to receive a close from the other side of the connection.
    receiveClose(callback: () => void): void;
}