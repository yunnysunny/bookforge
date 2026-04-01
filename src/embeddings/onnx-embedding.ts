import type {
  EmbeddingConfig,
  SearchIndexEntry,
  SearchEmbeddingDocument,
  SearchEmbeddingEntry,
} from '../types/index.js';
import { createHash } from 'node:crypto';

interface OnnxPipelineModule {
  pipeline: (
    task: string,
    model: string,
    options?: Record<string, unknown>,
  ) => Promise<(input: string, options?: Record<string, unknown>) => Promise<unknown>>;
}

interface OnnxEmbeddingResult {
  data?: Float32Array | number[];
}

interface EmbeddingSourceEntry {
  title: string;
  url: string;
  content: string;
  headings: Array<{ id: string; text: string; level: number }>;
}

let extractorPromise:
  | Promise<(input: string, options?: Record<string, unknown>) => Promise<unknown>>
  | undefined;

export async function generateEmbeddingVectors(
  pages: SearchIndexEntry[],
  config: EmbeddingConfig,
): Promise<SearchEmbeddingEntry[]> {
  const extractor = await getFeatureExtractor(config);
  const entries: SearchEmbeddingEntry[] = [];

  for (const page of pages) {
    const input = buildEmbeddingInput(page);
    const result = (await extractor(input, {
      pooling: 'mean',
      normalize: true,
    })) as OnnxEmbeddingResult;
    const values = Array.from(result.data || []);
    entries.push({
      title: page.title,
      url: page.url,
      headings: page.headings,
      content: page.content,
      vector: values,
      id: createHash('sha256').update(`${page.url}\n${page.title}\n${page.content}`).digest('hex'),
    });
  }

  return entries;
}

export async function generateEmbeddingIndex(
  pages: SearchIndexEntry[],
  config: EmbeddingConfig,
): Promise<SearchEmbeddingDocument> {
  const entries = await generateEmbeddingVectors(pages, config);
  return buildEmbeddingDocument(entries, config);
}

async function getFeatureExtractor(config: EmbeddingConfig) {
  if (!extractorPromise) {
    extractorPromise = loadPipeline(config);
  }
  return await extractorPromise;
}

async function loadPipeline(config: EmbeddingConfig) {
  let mod: OnnxPipelineModule;
  try {
    mod = (await import('@xenova/transformers')) as OnnxPipelineModule;
  } catch (error) {
    throw new Error(
      'Embedding 已开启，但未检测到可选依赖 "@xenova/transformers"。请安装该依赖后重试。',
      {
        cause: error,
      },
    );
  }

  return await mod.pipeline('feature-extraction', config.model, {
    quantized: config.quantized ?? true,
  });
}

export function buildEmbeddingDocument(
  entries: SearchEmbeddingEntry[],
  config: EmbeddingConfig,
): SearchEmbeddingDocument {
  return {
    generatedAt: new Date().toISOString(),
    model: config.model || 'Xenova/all-MiniLM-L6-v2',
    dimensions: entries[0]?.vector.length || 0,
    entries,
  };
}

function buildEmbeddingInput(page: EmbeddingSourceEntry): string {
  const headingText = page.headings.map((heading) => heading.text).join(' ');
  return [page.title, headingText, page.content].filter(Boolean).join('\n');
}
