<script lang="ts">
    let socket = new WebSocket("ws://localhost:8080");

    let state;

    let actor = {
        type: "UNASSIGNED"
    };

    let name = "";

    socket.onmessage = event => {
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
            type: "BECOME_PLAYER",
            desiredName: name
        });
    }

    function becomeHost() {
        send({
            type: "BECOME_HOST"
        });
    }
</script>

{#if state}
    <h1>Room Party</h1>

    <h2>Players</h2>

    {#each Object.values(state.players) as player}
        <p>{player.name}</p>
    {/each}

    {#if actor.type !== "UNASSIGNED"}
      <h2>Counter: {state.counter}</h2>
      <button onclick={() => send({ type: "INCREMENT" })}>
          +
      </button>

      <button onclick={() => send({ type: "DECREMENT" })}>
          -
      </button>

      <button onclick={() => send({ type: "RESET_COUNTER" })}>
          Reset
      </button>
    {/if}

    {#if actor.type === "UNASSIGNED"}
        <hr />

        <input
            bind:value={name}
            placeholder="Name"
        />

        <button onclick={becomePlayer}>
            Become Player
        </button>

      {#if state.host === false}
          <button onclick={becomeHost}>
              Become Host
          </button>
      {/if}

    {/if}
{/if}