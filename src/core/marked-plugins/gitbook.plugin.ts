import { marked, type MarkedExtension, type Tokens } from 'marked';

// ========================
// 1. GitBook 标签渲染器
// ========================
const gitbookTagRenderers: Record<
  string,
  (text: string, params: Record<string, string>) => string
> = {
  // Callout
  hint: (text, params) => `<div class="gb-hint gb-${params.style || 'info'}">${marked.parse(text)}</div>`,
  // tabs / tab
  tab: (text, params) =>
    `<div class="gb-tab" data-title="${params.title || ''}">${marked.parse(
      text,
    )}</div>`,
  tabs: (text) => `<div class="gb-tabs">${marked.parse(text)}</div>`,
};

// ========================
// 2. 解析参数 key="value"
// ========================
/** 解析 GitBook 参数，如 style="info" lang="ts" */
function parseParams(str: string) {
  const params: Record<string, string> = {};
  const re = /(\w+)="(.*?)"/g;
  let m: RegExpExecArray | null = null;
  while (true) {
    m = re.exec(str);
    if (!m) break;
    params[m[1]] = m[2];
  }
  return params;
}
interface GitbookTagToken extends Tokens.Generic {
  tag: string;
  params: Record<string, string>;
  text: string;
  raw: string;
  type: 'gb-tag';
}
export const gitbookExtension: MarkedExtension = {
  extensions: [
    {
      name: 'gb-tag',
      level: 'block',
      start(src: string) {
        return src.indexOf('{%');
      },
      tokenizer(src: string): GitbookTagToken | undefined {
        const rule = /^\{%\s*(\w+)([\s\S]*?)%\}([\s\S]*?)\{%\s*end\1\s*%\}/;
        const match = rule.exec(src);
        if (!match) return;

        const [, tag, paramStr, content] = match;
        return {
          type: 'gb-tag',
          raw: match[0],
          tag,
          params: parseParams(paramStr),
          text: content.trim(),
        };
      },
      renderer(token: Tokens.Generic) {
        const _token = token as GitbookTagToken;
        const fn = gitbookTagRenderers[_token.tag];
        if (fn) return fn(_token.text, _token.params);
        return _token.raw; // 未知标签原样输出
      },
    },
  ],
};
