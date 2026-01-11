// marked-katex-extension.ts
import katex from 'katex';
import { marked, type MarkedExtension, type Tokens } from 'marked';

interface KatexToken extends Tokens.Generic {
  type: 'katex';
  raw: string;
  formula: string;
  displayMode: boolean;
}

// KaTeX 渲染函数
function renderKatex(expression: string, displayMode: boolean = false): string {
  try {
    return katex.renderToString(expression, {
      throwOnError: true,
      displayMode,
      ...(marked.defaults as any).katex?.options,
    });
  } catch (error: any) {
    return `<span class="katex-error" style="color: red;">${error?.message}</span>`;
  }
}

// 创建扩展
export const katexExtension: MarkedExtension = {
  extensions: [
    {
      name: 'katex',
      level: 'inline',
      start(src: string) {
        const idx = src.indexOf('$');
        return idx === -1 ? undefined : idx;
      },
      tokenizer(src: string): KatexToken | undefined {
        // 1. 优先匹配块级公式 $$ ... $$
        const blockMatch = src.match(/^\s*\$\$([\s\S]+?)\$\$/);
        if (blockMatch) {
          return {
            type: 'katex',
            raw: blockMatch[0],
            formula: blockMatch[1].trim(),
            displayMode: true,
          };
        }

        // 2. 匹配行内公式 $ ... $
        // 使用更严谨的正则，防止匹配到空内容或由于零宽字符导致的失败
        const inlineMatch = src.match(/^\$((?:[^$\n\\]|\\.)+?)\$/);
        if (inlineMatch) {
          return {
            type: 'katex',
            raw: inlineMatch[0],
            formula: inlineMatch[1].trim(),
            displayMode: false,
          };
        }
      },
      renderer(token: Tokens.Generic) {
        const _token = token as KatexToken;
        return renderKatex(_token.formula, _token.displayMode);
      },
    },
  ],
};
