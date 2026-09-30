import { WebSocketServer } from "ws";

import { createRoom, type Room } from "./room";
import { handleConnection } from "./websocket";

function main() {
    const room = createRoom();

    const wss = new WebSocketServer({ port: 8080 });

    wss.on("connection", socket => {
        handleConnection(socket, room);
    });
}

main();