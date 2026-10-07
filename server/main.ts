import { WebSocketServer } from "ws";

import { ServerWebSocketConnection } from "./server-connection.js";
import { createHttpServer } from "./http-server.js"

import { Room } from "../game/room.js"

import { readFileSync } from "node:fs";

const production = process.argv.includes("--production");

const hostPassword = production
    ? process.env.ROOMPARTY_HOST_PASSWORD
    : "dev";

if (!hostPassword) {
    throw new Error("ROOMPARTY_HOST_PASSWORD is not set");
}

// Create room
const rounds = JSON.parse(
    readFileSync("./game/rounds.json", "utf8")
);

const room = new Room(rounds, hostPassword);

if (production) {
    // Set up both http server and websocket server for prod.
    const httpServer = createHttpServer();

    const websocketServer = new WebSocketServer({
        server: httpServer,
    });

    websocketServer.on("connection", socket => {
        const connection = new ServerWebSocketConnection(socket);
        
        room.addConnection(connection);
    });

    httpServer.listen(8080);
} else {
    // Set up websocket server only. Vite serves in dev mode.
    const websocketServer = new WebSocketServer({
        port: 8080,
    });

    websocketServer.on("connection", socket => {
        const connection = new ServerWebSocketConnection(socket);
        
        room.addConnection(connection);
    });
}