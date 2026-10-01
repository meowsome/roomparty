<script lang="ts">
    const host = window.location.hostname; 
    let socket = new WebSocket(`ws://${host}:8080`);

    let state;

    let actor = {
        type: "UNASSIGNED",
    };

    let name = "";

    socket.onmessage = (event) => {
        const message = JSON.parse(event.data);

        if (message.type === "STATE") {
            state = message.state;
            actor = message.actor;
        }

        if (message.type === "ERROR") {
            console.log(message.error);
        }
    };

    function send(command: object) {
        socket.send(JSON.stringify(command));
    }

    function becomePlayer() {
        send({
            type: "BECOME",
            role: "PLAYER",
            desiredName: name,
        });
    }

    function becomeHost() {
        send({
            type: "BECOME",
            role: "HOST",
        });
    }

    function leave(){
        send({
            type: "DESTROY",
        });
    }
</script>

{#if state}
    <h1>Room Party</h1>

    {#if actor.type !== "UNASSIGNED"}
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
