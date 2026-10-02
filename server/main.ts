import { WebSocketServer } from "ws";

import { ServerWebSocketConnection } from "./server-connection";
import { handleConnection } from "./handle-connection";
import { createRoom } from "../game/room";

import { readFileSync } from "node:fs";



const rounds = JSON.parse(
    readFileSync("./game/rounds.json", "utf8")
);

const room = createRoom(rounds, "password123");

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