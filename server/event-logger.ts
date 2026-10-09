import { mkdirSync, openSync } from "node:fs";
import { write, fdatasync, close } from "node:fs";
import path from "node:path";
import type { GameEvent } from "../shared/event.js";

export class EventLog {
    private sequence = 0;
    private pending: Promise<void> = Promise.resolve();
    private failed = false;
    private closed = false;

    private readonly fd: number;

    constructor(filename: string) {
        mkdirSync(path.dirname(filename), { recursive: true });
        this.fd = openSync(filename, "a");
    }

    append(event: GameEvent): void {
        if (this.failed || this.closed) return;

        const line = JSON.stringify({
            timestamp: new Date().toISOString(),
            sequence: ++this.sequence,
            event,
        }) + "\n";

        // Create chain of promises for saving queue
        this.pending = this.pending.then(async () => {
            if (this.failed) return;

            try {
                // Write event
                await new Promise<void>((resolve, reject) => {
                    write(this.fd, line, null, "utf8", error => {
                        if (error) reject(error);
                        else resolve();
                    });
                });

                // Force it to immediately save to disk
                await new Promise<void>((resolve, reject) => {
                    fdatasync(this.fd, error => {
                        if (error) reject(error);
                        else resolve();
                    });
                });
            } catch (error) {
                // Stop writing in future calls
                this.failed = true;
                console.error("Event logging failed:", error);
            }
        });
    }

    close(): void {
        if (this.closed) return;
        this.closed = true;

        // Resolve all pending writes and then close file
        void this.pending.then(() => {
            close(this.fd, error => {
                if (error) console.error("Event log close failed:", error);
            });
        });
    }
}