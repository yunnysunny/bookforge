// marked-katex-extension.ts
import katex from 'katex';
import { marked, type MarkedExtension, type Tokens } from 'marked';

// 扩展 marked 的默认选项
// interface MarkedKatexOptions extends marked.MarkedOptions {
//   katex?: {
//     throwOnError?: boolean;
//     errorColor?: string;
//     displayMode?: boolean;
//     macros?: Record<string, string>;
//   };
// }
interface KatexToken extends Tokens.Generic {
  type: 'katex-inline' | 'katex-block';
  raw: string;
  formula: string;
  displayMode: boolean;
}
// 优化后的行内正则：匹配 $公式$，确保不匹配空公式 $$
const inlineRule = /^\$((?:[^$\n\\]|\\.)+?)\$/;
// 优化后的块级正则：匹配被 $$ 包围的内容
const blockRule = /^(\s*)\$\$([\s\S]+?)\$\$(\s*)/;
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
    // 块级公式 $$...$$
    // {
    //   name: 'katex-block',
    //   level: 'block',
    //   start(src: string) {
    //     const i = src.indexOf('$$');
    //     return i === -1 ? undefined : i;
    //   },
    //   tokenizer(src: string) {
    //     const m = src.match(blockRule);
    //     if (m) {
    //       return {
    //         type: 'katex-block',
    //         raw: m[0],
    //         formula: m[2].trim(),
    //         displayMode: true,
    //       };
    //     }
    //   },
    //   renderer(token: Tokens.Generic) {
    //     return renderKatex((token as KatexToken).formula, true);
    //   },
    // },
    // 行内公式 $...$
    {
      name: 'katex',
      level: 'inline',
      start(src: string) {
        const idx = src.indexOf('$');
        return idx === -1 ? undefined : idx;
      },
      tokenizer(src: string) {
        // const m = src.match(inlineRule);
        // if (m) {
        //   return {
        //     type: 'katex-inline',
        //     raw: m[0],
        //     formula: m[1].trim(),
        //     displayMode: false,
        //   };
        // }
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
        return renderKatex((token as KatexToken).formula, false);
      },
    },
  ],
};

// // 扩展 marked 的配置类型
// declare module 'marked' {
//   interface MarkedOptions {
//     katex?: {
//       throwOnError?: boolean;
//       errorColor?: string;
//       displayMode?: boolean;
//       macros?: Record<string, string>;
//     };
//   }
// }
