import type { RendererThis, MarkedExtension, Tokens } from 'marked';
import { parseParams } from '../../utils/gitbook';
import type { GitbookTagTokenBase, RenderFun } from './interfaces/gitbook.interface';

// ========================
// 1. GitBook 普通标签渲染器
// ========================
const gitbookTagRenderers: Record<string, RenderFun> = {
  // Callout
  hint: ({ innerHtml, params }) =>
    `<div class="gb-hint gb-${params.style || 'info'}">${innerHtml}</div>`,
  // tabs / tab
  // tab: ({innerHtml, params}) =>
  //   `<div class="gb-tab" data-title="${params.title || ''}">${innerHtml}</div>`,
  // tabs: ({innerHtml}) => `<div class="gb-tabs">${innerHtml}</div>`,
};

interface GitbookCommonTagToken extends GitbookTagTokenBase {
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
      tokenizer(this, src: string): GitbookCommonTagToken | undefined {
        const rule = /^\{%\s*(\w+)([\s\S]*?)%\}([\s\S]*?)\{%\s*end\1\s*%\}/;
        const match = rule.exec(src);
        if (!match) return;

        const [, tag, paramStr, content] = match;
        const tokens = this.lexer.blockTokens(content);
        return {
          type: 'gb-tag',
          raw: match[0],
          tag,
          params: parseParams(paramStr),
          text: content.trim(),
          tokens,
        };
      },
      renderer(this: RendererThis<string, string>, token: Tokens.Generic) {
        const _token = token as GitbookCommonTagToken;
        const fn = gitbookTagRenderers[_token.tag];
        if (!fn) {
          return _token.raw;
        }
        const innerHtml = this.parser.parse(_token.tokens);
        return fn({ innerHtml, params: _token.params });
      },
    },
  ],
};
