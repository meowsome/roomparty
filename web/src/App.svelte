<script lang="ts">
    import type { ClientMessage } from "../../shared/message";
    import type { ClientGameStateView } from "../../shared/model/game-state-view";

    import { countWords } from "./word-cloud";
    import { ClientWebSocketConnection } from "./client-connection";

    import WordCloud from "./WordCloud.svelte";

    const protocol = window.location.protocol === "https:"
        ? "wss:"
        : "ws:";

    const connection = new ClientWebSocketConnection(
        `${protocol}//${window.location.host}/ws`,
    );

    let state: ClientGameStateView | null = null;

    let name = "";
    let selectedOptionId: string | null = null; 
    let freeformText = "";
    let error = ""

    connection.receive(message => {
        if (message.type === "STATE") {
            // Only update the state if the revision is newer than the current state
            if (message.state.revision > (state?.revision ?? -1)) {
                state = message.state;
                error = ""
            }
        }

        if (message.type === "ERROR") {
            error = message.error.message;
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
            desiredName: name,
        });
    }

    function leave(): void {
        send({
            type: "DESTROY",
        });
    }



    function submitVote(): void { 
        send({ 
            type: "CAST_VOTE", 
            vote: 
            { 
                optionId: selectedOptionId, 
                freeformText: freeformText, 
            }, 
        }); 
    }
</script>

{#if state}

    {#if error}
        <div class="error">
            {error}
        </div>
    {/if}

    <h1>Room Party</h1>

    {#if state.actor.type === "UNASSIGNED"}
        
        <!-- View when not in a game -->
        <input bind:value={name} placeholder="Name" />

        <button onclick={becomePlayer}>
            Become Player
        </button>

        {#if state.host === false}
            <button onclick={becomeHost}>
                Become Host
            </button>
        {/if}

    {:else}

        <!-- View when in a game -->
        <button onclick={leave}>
            Leave
        </button>

        {#if state.actor.type === "PLAYER" && "currentOptions" in state}

            <h2>Round {state.currentRound + 1}</h2>

            {#if state.phase === "VOTING"}
                {#each state.currentOptions as option}
                    <button onclick={() => selectedOptionId = option.id}>
                        <img src={option.imageLink} alt="" />
                    </button>
                {/each}

                <textarea
                    bind:value={freeformText}
                    placeholder="Your answer..."
                ></textarea>

                <button onclick={submitVote}>
                    Submit
                </button>
            
            {:else if state.phase === "RESULTS"}
                <p1> RESULTS PHASE </p1>
            {:else}
                <p1> WORDCLOUD </p1>
            {/if}

        {/if}

        {#if state.actor.type === "HOST" && "currentVotes" in state}

            <h2>Round {state.currentRound + 1}</h2>

        
            {#if state.phase === "VOTING"}
                {#each state.currentOptions as option}
                    <div>
                        <img src={option.imageLink} alt="" />
                        <p>
                            {Object.values(state.currentVotes)
                                .filter(vote => vote.optionId === option.id)
                                .length}
                            votes
                        </p>
                    </div>
                {/each}
            {:else if state.phase === "RESULTS"}
                <p1> RESULTS PHASE </p1>
            {:else}
                    
                    <WordCloud
                    words={countWords(
                        Object.values(state.currentVotes)
                            .map(vote => vote.freeformText)
                            .filter(text => text.trim().length > 0)
                        )}
                    />
            {/if}

            <button onclick={() => send({ type: "ADVANCE_GAME" })}>
                Advance
            </button>

        {/if}

    {/if}

    <h2>Players</h2>

    {#each Object.values(state.players) as player}
        <p>{player.displayName}</p>
    {/each}
{/if}