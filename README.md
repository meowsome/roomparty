# roomparty
A lightweight jackbox-esque online room party framework

## Setup and run

In the root directory, `npm i`

Then, `npm run dev` to start the Vite dev frontend

and `npm run server` to run the backend.

## Architecture

The frontend is Svelte. All communications happen through a websocket. You have a list of commands you can send in `/shared/command.ts`. Each command will return both an Actor (which is either the game host, a player, or unassigned) as well as the full game state. You are that Actor. If the command is invalid, it will return an error instead.

The backend is Node. A "Room" is an instance of a game, which has game state and a list of players. Clients connect and interact with this room in logic managed in `handle-connection.ts`. Clients send commands, which are fed through a command transformation pipeline in `executeCommand()`. 

First, the command is validated in `authorizeCommand()` where it checks against room rules (ie. you cannot join as a player with an active connection). If it passes, the command gets fed into `resolveCommand()` which turns the commands into events based on the game rules. The returned list of events are fed through `applyGameEvent()`, which actually updates the game state. This is the only place where game state is touched. 

That is then broadcast back out to all users, through a ClientGameStateView whose values are derived from the full game state in `view.ts`. 