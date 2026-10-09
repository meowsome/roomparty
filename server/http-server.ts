import { createServer } from "node:http";
import { readFile } from "node:fs";
import { join } from "node:path";
import { lookup } from "mime-types";

const webRoot = join(
    process.cwd(),
    "web",
    "dist",
);

export function createHttpServer() {
    return createServer((request, response) => {
        const path = new URL(
            request.url ?? "/",
            "http://localhost",
        ).pathname;

        // Serve index.html as the root file
        const filePath = join(
            webRoot,
            path === "/" ? "index.html" : path,
        );

        readFile(filePath, (error, data) => {
            if (error) {
                response.writeHead(404);
                response.end("Not found");
                return;
            }

            // Set the MIME type
            response.setHeader(
                "Content-Type",
                lookup(filePath) || "application/octet-stream",
            );

            // Send response with file data
            response.end(data);
        });
    });
}