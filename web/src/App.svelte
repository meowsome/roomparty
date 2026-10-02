<script lang="ts">
    import type { Actor } from "../../shared/actor";
    import type { ClientMessage } from "../../shared/message";
    import type { ClientGameStateView } from "../../shared/model/game-state-view";

    import { ClientWebSocketConnection } from "./client-connection";

    const host = window.location.hostname;
    const connection = new ClientWebSocketConnection(
        `ws://${host}:8080`
    );

    let state: ClientGameStateView | null = null;

    let actor: Actor = {
        type: "UNASSIGNED",
    };

    let name = "";

    connection.receive(message => {
        if (message.type === "STATE") {
            // Only update the state if the revision is newer than the current state
            if (message.state.revision > (state?.revision ?? -1)) {
                state = message.state;
                actor = message.actor;
            }
        }

        if (message.type === "ERROR") {
            console.log(message.error);
        }
    });

    function send(command: ClientMessage): void {
        connection.send(command);
    }

    function becomePlayer(): void {
        send({
            type: "BECOME",
            role: "PLAYER",
            desiredName: name,
        });
    }

    function becomeHost(): void {
        send({
            type: "BECOME",
            role: "HOST",
        });
    }

    function leave(): void {
        send({
            type: "DESTROY",
        });
    }
</script>

{#if state}
    <h1>Room Party</h1>

    {#if "counter" in state}
        <h2>Counter: {state.counter}</h2>
    {/if}

    {#if actor.type === "PLAYER"}
        <button onclick={() => send({ type: "INCREMENT" })}> + </button>

        <button onclick={() => send({ type: "DECREMENT" })}> - </button>
    {/if}

    {#if actor.type === "HOST"}
        <button onclick={() => send({ type: "RESET_COUNTER" })}> Reset </button>
    {/if}

    {#if actor.type === "UNASSIGNED"}

        <input bind:value={name} placeholder="Name" />

        <button onclick={becomePlayer}> Become Player </button>

        {#if state.host === false}
            <button onclick={becomeHost}> Become Host </button>
        {/if}
    {:else}
        <button onclick={leave}> Leave </button>
    {/if}

    <h2>Players</h2>

    {#each Object.values(state.players) as player}
        <p>{player.displayName}</p>
    {/each}

{/if}
