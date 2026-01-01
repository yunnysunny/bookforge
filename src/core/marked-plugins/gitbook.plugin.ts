import { marked, type MarkedExtension, type Tokens } from 'marked';

// ========================
// 1. GitBook 标签渲染器
// ========================
const gitbookTagRenderers: Record<
  string,
  (text: string, params: Record<string, string>) => string
> = {
  // Callout
  note: (text) => `<div class="gb-note">${marked.parse(text)}</div>`,
  warning: (text) => `<div class="gb-warning">${marked.parse(text)}</div>`,
  tip: (text) => `<div class="gb-tip">${marked.parse(text)}</div>`,
  info: (text) => `<div class="gb-info">${marked.parse(text)}</div>`,
  danger: (text) => `<div class="gb-danger">${marked.parse(text)}</div>`,
  success: (text) => `<div class="gb-success">${marked.parse(text)}</div>`,

  // code block
  codeblock: (text, params) =>
    `<pre><code class="language-${params.lang || ''}">${text}</code></pre>`,

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
        return src.match(/\{%/)?.index;
      },
      tokenizer(src: string): GitbookTagToken | undefined {
        const rule = /^\{% (\w+)(.*?) %\}([\s\S]*?)\{% end\1 %\}/;
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
