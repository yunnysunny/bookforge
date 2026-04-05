const EMBEDDING_INDEX_URL = './embedding-index.json';
const CDN_TRANSFORMERS = 'https://cdn.jsdelivr.net/npm/@xenova/transformers@2.17.2';

let embeddingData = null;
let extractorPromise = null;

function cosineSimilarity(a, b) {
    let dot = 0;
    let normA = 0;
    let normB = 0;
    for (let i = 0; i < a.length; i++) {
        dot += a[i] * b[i];
        normA += a[i] * a[i];
        normB += b[i] * b[i];
    }
    return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

async function getExtractor() {
    if (!extractorPromise) {
        extractorPromise = import(CDN_TRANSFORMERS).then(({ pipeline }) =>
            pipeline('feature-extraction', embeddingData.model, { quantized: true }),
        );
    }
    return extractorPromise;
}

export async function init() {
    try {
        const res = await fetch(EMBEDDING_INDEX_URL);
        if (!res.ok) {
            return false;
        }
        embeddingData = await res.json();
        return embeddingData?.entries?.length > 0;
    } catch {
        return false;
    }
}

export function isAvailable() {
    return embeddingData?.entries?.length > 0;
}

export async function search(query, topK = 8) {
    if (!embeddingData?.entries?.length) {
        return null;
    }

    const extractor = await getExtractor();
    const output = await extractor(query, { pooling: 'mean', normalize: true });
    const queryVector = Array.from(output.data);

    return embeddingData.entries
        .map(entry => ({
            title: entry.title,
            url: entry.url,
            content: entry.content,
            headings: entry.headings || [],
            score: cosineSimilarity(queryVector, entry.vector),
        }))
        .filter(entry => entry.score > 0.85)
        .sort((a, b) => b.score - a.score)
        .slice(0, topK);
}
