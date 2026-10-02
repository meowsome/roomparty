import { WebSocketServer } from "ws";

import { ServerWebSocketConnection } from "./server-connection";
import { handleConnection } from "./handle-connection";
import { createRoom } from "./room";

const room = createRoom();

const server = new WebSocketServer({
    port: 8080,
});

server.on("connection", socket => {
    const connection = new ServerWebSocketConnection(socket);

    handleConnection(
        connection,
        room,
    );
});