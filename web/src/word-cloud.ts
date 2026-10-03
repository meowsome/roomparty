export type WordFrequency  = {
    text: string;
    value: number;
};

const stopWords = new Set([
    "a",
    "an",
    "and",
    "are",
    "as",
    "at",
    "be",
    "but",
    "by",
    "for",
    "from",
    "had",
    "has",
    "have",
    "he",
    "her",
    "his",
    "i",
    "if",
    "in",
    "is",
    "it",
    "its",
    "me",
    "my",
    "of",
    "on",
    "or",
    "our",
    "she",
    "that",
    "the",
    "their",
    "them",
    "there",
    "they",
    "this",
    "to",
    "was",
    "we",
    "were",
    "what",
    "when",
    "which",
    "who",
    "with",
    "you",
    "your",
]);

export function countWords(texts: string[]): WordFrequency[] {
    const counts: Record<string, number> = {};

    for (const text of texts) {
        const words = text
            .toLowerCase()
            .replace(/[^\p{L}\p{N}'-]+/gu, " ")
            .split(/\s+/)
            .filter(word => word.length >= 3)
            .filter(word => !stopWords.has(word));

        for (const word of words) {
            counts[word] = (counts[word] ?? 0) + 1;
        }
    }

    return Object.entries(counts).map(([text, value]) => ({
        text,
        value,
    }));
}