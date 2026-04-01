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
}

export interface ParserOptions {
  outputDir: string;
  ignorePatterns?: string[];
  parseMode?: ParserMode;
  env: Env;
}
