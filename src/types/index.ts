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
export const HTML_THEMES = ['default', 'paper', 'night', 'workspace'] as const;
export type HtmlTheme = (typeof HTML_THEMES)[number];
export type Env = 'html' | 'pdf';
export interface BookForgeConfig {
  input: string;
  output: string;
  format: Env;
  mode?: ParserMode;
  title?: string;
  author?: string;
  skip?: string[];
  giscus?: GiscusConfig;
  navLinks?: NavLink[];
  /** HTML 站点主题，默认 default */
  theme?: HtmlTheme;
  /** 自定义主题样式文件（CSS）路径，在主题样式之后加载，仅 HTML 输出生效 */
  customCss?: string;
}

export interface ParserOptions {
  outputDir: string;
  ignorePatterns?: string[];
  parseMode?: ParserMode;
  env: Env;
}
