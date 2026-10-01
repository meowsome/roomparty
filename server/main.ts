import { WebSocketServer } from "ws";

import { ServerConnection } from "./server-connection";
import { startSession } from "./session";
import { createRoom } from "./room";

const room = createRoom();

const server = new WebSocketServer({
    port: 8080,
});

server.on("connection", socket => {
    const connection = new ServerConnection(socket);

    startSession(
        connection,
        room,
    );
});