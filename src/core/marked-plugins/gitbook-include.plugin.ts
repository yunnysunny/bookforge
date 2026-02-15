import type { MarkedExtension, Tokens } from 'marked';

export const IncludeTokenType = 'gb-include';
export interface GitbookIncludeToken extends Tokens.Generic {
  type: typeof IncludeTokenType;
  tag: 'include';
  path: string;
}
export const gitbookIncludeExtension: MarkedExtension = {
  extensions: [
    {
      name: IncludeTokenType,
      level: 'block',
      start(src: string) {
        return src.indexOf('{%');
      },
      tokenizer(this, src: string): GitbookIncludeToken | undefined {
        const rule = /^\{%\s*include\s+"([\S]+)"\s*%\}/;
        const match = rule.exec(src);
        if (!match) return;

        const [, path] = match;

        return {
          type: 'gb-include',
          tag: 'include',
          raw: match[0],
          path,
        };
      },
    },
  ],
};
