import type { Tokens } from 'marked';

export interface GitbookTagTokenBase extends Tokens.Generic {
  tag: string;
  params: Record<string, string>;
  text: string;
  raw: string;
  type: string;
  tokens: Tokens.Generic[];
}
export type RenderFun = (payload: { innerHtml: string; params: Record<string, string> }) => string;
