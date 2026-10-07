<script lang="ts">
    import type { ClientMessage } from "../../shared/message";
    import type { ClientGameStateView } from "../../shared/model/game-state-view";
    import { getPlayerId } from "../../shared/model/player";

    import { ClientWebSocketConnection } from "./client-connection";

    import { countWords } from "./word-cloud";

    import WordCloud from "./WordCloud.svelte";

    const protocol = window.location.protocol === "https:"
        ? "wss:"
        : "ws:";

    const connection = new ClientWebSocketConnection(
        `${protocol}//${window.location.host}/ws`,
    );

    let view: ClientGameStateView | null = null;
    let revision: number = -1;

    let name = "";
    let selectedOptionId: string | null = null; 
    let freeformText = "";
    let error = ""

    connection.receive(message => {
        if (message.type === "VIEW") {
            // Only update the state if the revision is newer than the current state
            if (message.revision > revision) {
                view = message.view;
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
            type: "DESTROY_SELF",
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

{#if view}

    {#if error}
        <div class="error">
            {error}
        </div>
    {/if}

    <h1>Room Party</h1>

    {#if view.actor.type === "UNASSIGNED"}
        
        <!-- View when not in a game -->
        <input bind:value={name} placeholder="Name" />

        <button onclick={becomePlayer}>
            Become Player
        </button>

        {#if view.host === false}
            <button onclick={becomeHost}>
                Become Host
            </button>
        {/if}

    {:else}

        <!-- View when in a game -->
        <button onclick={leave}>
            Leave
        </button>

        {#if view.actor.type === "PLAYER" && "currentOptions" in view}

            <h2>Round {view.currentRound + 1}</h2>

            {#if view.phase === "VOTING"}
                {#each view.currentOptions as option}
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
            
            {:else if view.phase === "RESULTS"}
                <p1> RESULTS PHASE </p1>
            {:else}
                <p1> WORDCLOUD </p1>
            {/if}

        {/if}

        {#if view.actor.type === "HOST" && "currentVotes" in view}

            <h2>Round {view.currentRound + 1}</h2>

        
            {#if view.phase === "VOTING"}
                {#each view.currentOptions as option}
                    <div>
                        <img src={option.imageLink} alt="" />
                        <p>
                            {Object.values(view.currentVotes)
                                .filter(vote => vote.optionId === option.id)
                                .length}
                            votes
                        </p>
                    </div>
                {/each}
            {:else if view.phase === "RESULTS"}
                <p1> RESULTS PHASE </p1>
            {:else}
                    
                    <WordCloud
                    words={countWords(
                        Object.values(view.currentVotes)
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

    {#each Object.values(view.players) as player}
            <div class="flexbox">
                <p>{player.displayName}</p>
                {#if view.actor.type === "HOST"}
                    <button onclick={() => send({ type: "DESTROY_PLAYER", playerId: getPlayerId(player.displayName) })}>
                        Kick
                    </button>
                {/if}
            </div>
        
    {/each}
{/if}