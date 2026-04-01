// 类型定义文件
export interface MarkdownFile {
  path: string;
  title: string;
  content: string;
  headings: Heading[];
}

export interface Heading {
  level: number;
  text: string;
  id: string;
  children: Heading[];
}

export interface TreeNode {
  title: string;
  path?: string;
  content?: string;
  headings?: Heading[];
  children: TreeNode[];
}

export interface SearchIndexHeading {
  id: string;
  text: string;
  level: number;
}

export interface SearchIndexEntry {
  title: string;
  url: string;
  content: string;
  headings: SearchIndexHeading[];
}

export interface SearchIndexDocument {
  generatedAt: string;
  pages: SearchIndexEntry[];
}

export interface EmbeddingConfig {
  enabled?: boolean;
  provider?: 'onnx';
  model: string;
  output: string;
  quantized?: boolean;
  batchSize?: number;
}

export interface SearchEmbeddingEntry extends SearchIndexEntry {
  id: string;
  vector: number[];
}

export interface SearchEmbeddingDocument {
  generatedAt: string;
  model: string;
  dimensions: number;
  entries: SearchEmbeddingEntry[];
}

export interface GiscusConfig {
  repo: string;
  repoId: string;
  category: string;
  categoryId: string;
  mapping?: string;
  theme?: string;
  lang?: string;
}

export interface NavLink {
  text: string;
  url: string;
}

export type ParserMode = 'gitbook' | 'notion';
export type Env = 'html' | 'pdf';
export interface BookForgeConfig {
  input: string;
  output: string;
  format: Env;
  mode?: ParserMode;
  title?: string;
  author?: string;
  skip?: string[];
  embedding?: EmbeddingConfig;
  giscus?: GiscusConfig;
  navLinks?: NavLink[];
}

export interface ParserOptions {
  outputDir: string;
  ignorePatterns?: string[];
  parseMode?: ParserMode;
  env: Env;
}
