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

    function becomePlayer(event: any): void {
        event.preventDefault();
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

    <header>
        <nav class="bg-gray-800 border-gray-200 px-4 lg:px-6 py-2.5">
            <div class="flex flex-wrap justify-between items-center mx-auto max-w-screen-xl">
                <h2>Room Party</h2>
            </div>
        </nav>
    </header>

    <div class="justify-center items-center flex flex-col">
        {#if error}
            <div class="error">
                {error}
            </div>
        {/if}


        {#if view.actor.type === "UNASSIGNED"}
            <!-- View when not in a game -->
            <h1>Join Game</h1>

            <div class="w-1/2">
                <form class="bg-gray-800 border-gray-200 shadow-md rounded px-8 pt-6 pb-8 mb-4" onsubmit={becomePlayer}>
                    <div class="mb-4">
                        <label class="text-left block text-gray-500 text-sm font-bold mb-2" for="name">Name</label>
                        <input class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-900 bg-gray-500 leading-tight focus:outline-none focus:shadow-outline" bind:value={name} id="name"/>

                        <div class="flex flex-row pt-5">
                            <button class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded cursor-pointer" onclick={becomePlayer} type="button">
                                Become Player
                            </button>
                            {#if view.host === false}
                                &nbsp;&nbsp;
                                <button class="bg-yellow-700 hover:bg-yellow-800 text-white font-bold py-2 px-4 rounded cursor-pointer" onclick={becomeHost} type="button">
                                    Become Host
                                </button>
                            {/if}
                        </div>
                    </div>
                </form>
            </div>

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
    </div>

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