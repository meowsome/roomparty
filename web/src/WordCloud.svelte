<script lang="ts">
    import cloud, { type Word as CloudWord } from "d3-cloud";
    import type { WordFrequency } from "./word-cloud";

    let {
        words,
    }: {
        words: WordFrequency[];
    } = $props();

    type LayoutWord = CloudWord & {
        value: number;
    };

    let layoutWords = $state<LayoutWord[]>([]);

    const width = 640;
    const height = 400;
    const fontScale = 30;

    function wordHash(text: string): number {
        let hash = 0;

        for (const character of text) {
            hash = (hash * 31 + character.charCodeAt(0)) >>> 0;
        }

        return hash;
    }

    function wordColor(text: string): string {
        const colors = [
            "#355070",
            "#6D597A",
            "#B56576",
            "#E56B6F",
            "#EAAC8B",
        ];

        return colors[wordHash(text) % colors.length];
    }

    function wordTilt(text: string): number {
        const hash = wordHash(text);

        return ((hash % 3) - 1)*90;
    }

    $effect(() => {
        const inputWords: LayoutWord[] = words.map(word => ({
            text: word.text,
            value: word.value,
        }));

        cloud<LayoutWord>()
            .size([width, height])
            .words(inputWords)
            .padding(0)
            .random(() => 0.5)
            .rotate(word => wordTilt(word.text ?? ""))
            .font("Arial")
            .fontSize(word => Math.sqrt(word.value) * fontScale)
            .on("end", result => {
                layoutWords = result;
            })
            .start();
    });
</script>

<svg
    width={width}
    height={height}
    viewBox={`0 0 ${width} ${height}`}
>
    <g transform={`translate(${width / 2}, ${height / 2})`}>
        {#each layoutWords as word}
            <text
                x={word.x}
                y={word.y}
                text-anchor="middle"
                font-family="Arial"
                font-size={word.size}
                transform={`rotate(${word.rotate}, ${word.x}, ${word.y})`}
                fill={wordColor(word.text ?? "")}
            >
                {word.text}
            </text>
        {/each}
    </g>
</svg>