<script lang="ts">

    import type { ClientMessage } from "../../shared/message";
    import type { ClientGameStateView } from "../../shared/model/game-state-view";
    import { getPlayerId } from "../../shared/model/player";
    import type { CommandError } from "../../shared/command"

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
    let error: CommandError | null = null;

    
    let name = "";
    let selectedOptionId: string | null = null; 
    let freeformText = "";
    let smellRating = 50;

    connection.receive(message => {
        if (message.type === "VIEW") {
            // Only update the state if the revision is newer than the current state
            if (message.revision > revision) {
                view = message.view;
                error = null;
            }
        }

        if (message.type === "ERROR") {
            error = message.error;
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
                rating: smellRating
            }, 
        }); 
    }
</script>

<div class="w-full min-h-screen text-white p-2 flex flex-col items-center justify-center">
    {#if view}

        <!-- Error Banner-->
        {#if error}
            <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
                <strong class="font-bold">{error.code}</strong>
                <span class="block sm:inline">{error.message}</span>
            </div>
        {/if}

        <!-- Logo-->
        <div class="mx-auto w-full text-4xl text-center my-4">
            <p>room party</p>
        </div>

        <!-- Name + Joining -->
        {#if view.actor.type === "UNASSIGNED"}
            <div class="frutiger-card w-full md:w-1/2">
                <div class="mx-auto flex max-w-md items-center justify-center gap-4 p-2">
                    <input bind:value={name} 
                    class="w-full resize-none rounded-lg bg-gray-700 p-3 text-white placeholder-gray-400 outline-none focus:ring-2 focus:ring-yellow-500"
                    placeholder="Name" />
                </div>
                <div class="mx-auto flex max-w-md items-center justify-center gap-4 p-2">
                    <button class="frutiger-aero-button" onclick={becomePlayer}>
                        Become Player
                    </button>

                    {#if view.host === false}
                        <button class="frutiger-aero-button" onclick={becomeHost}>
                            Become Host
                        </button>
                    {/if}
                </div>
            </div>

        {:else}

            <button class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded" onclick={leave}>
                Leave
            </button>


            <!-- User View -->
            {#if view.actor.type === "PLAYER" && "currentOptions" in view}
                <div class="frutiger-card w-full md:w-3/4">
                    <p class="text-2xl"> Scent #{view.currentRound + 1}</p>

                    {#if view.phase === "VOTING"}
                        <div class="mx-auto w-1/2">
                            <textarea
                                class="w-full resize-none rounded-lg bg-gray-700 p-3 text-white placeholder-gray-400 outline-none focus:ring-2 focus:ring-yellow-500"
                                bind:value={freeformText}
                                placeholder="Type literally anything that comes to mind"
                                rows="4"
                            ></textarea>
                        </div>

                        <button onclick={submitVote} class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
                            Submit
                        </button>

                        <div class = "mx-auto w-1/2">
                            <div class="w-full flex items-center justify-between text-sm text-gray-400">
                                <span>Smells Horrendous</span>
                                <span>Smells Amazing</span>
                            </div>

                            <input
                                class="w-full accent-yellow-500"
                                type="range"
                                min="0"
                                max="100"
                                bind:value={smellRating}
                            />
                        </div>

                        <div class="grid grid-cols-3 gap-2 p-4">
                            {#each view.currentOptions as option}
                                <button
                                    class="rounded font-bold text-white
                                        {option.id === selectedOptionId
                                            ? 'bg-yellow-500 hover:bg-yellow-700'
                                            : 'bg-gray-500 hover:bg-gray-700'}"
                                    onclick={() => selectedOptionId = option.id}
                                >
                                    <img class = "p-1" src={option.imageLink} alt="" />
                                </button>
                            {/each}
                        </div>
                    
                    {:else if view.phase === "RESULTS"}
                        <p1> RESULTS PHASE </p1>
                    {:else}
                        <p1> WORDCLOUD </p1>
                    {/if}

                </div>
            {/if}


            <!-- Host View -->
            {#if view.actor.type === "HOST" && "currentVotes" in view}

                <h2>Scent {view.currentRound + 1}</h2>

            
                
                {#if view.phase === "VOTING"}
                    <div class="frutiger-card w-full md:w-3/4">
                        <div class="grid grid-cols-6 gap-2 p-4">
                            {#each view.currentOptions as option}
                                <div class="overflow-hidden rounded-xl border border-gray-700 bg-gray-800">

                                    <!-- Image -->
                                    <img
                                        class="block w-full p-2"
                                        src={option.imageLink}
                                        alt=""
                                    />

                                    <!-- Voters -->
                                    <div class="px-3 py-2">
                                        {#each Object.entries(view.currentVotes) as [playerId, vote]}
                                            {#if vote.optionId === option.id}
                                                <div class="text-sm font-medium text-white">
                                                    {view.players[playerId]?.displayName}
                                                </div>
                                            {/if}
                                        {/each}
                                    </div>

                                </div>
                            {/each}
                        </div>
                    </div>
                {:else if view.phase === "RESULTS"}
                    <p1> RESULTS PHASE </p1>
                {:else}
                    <div class="frutiger-card w-full md:w-3/4">
                        <WordCloud
                        words={countWords(
                            Object.values(view.currentVotes)
                                .map(vote => vote.freeformText)
                                .filter(text => text.trim().length > 0)
                            )}
                        />
                    </div>
                {/if}

                <button class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded" onclick={() => send({ type: "ADVANCE_GAME" })}>
                    Advance
                </button>

            {/if}

        {/if}


        <!-- Players List -->
        <div class="frutiger-card w-1/4 mt-5">
            <h1 class="mb-3 text-xl font-bold text-white">Players</h1>

            <div class="space-y-2">
                {#each Object.values(view.players) as player}
                    <div class="flex items-center rounded-lg bg-gray-700 px-4 py-3">
                        <p class="flex-1 font-medium text-white">
                            {player.displayName}
                        </p>

                        {#if view.actor.type === "HOST"}
                            <button
                                class="rounded bg-red-400 px-3 py-1.5 text-sm font-bold text-white hover:bg-red-600"
                                onclick={() => send({
                                    type: "DESTROY_PLAYER",
                                    playerId: getPlayerId(player.displayName)
                                })}
                            >
                                Kick
                            </button>
                        {/if}
                    </div>
                {/each}
            </div>
        </div>
    {/if}
</div>
