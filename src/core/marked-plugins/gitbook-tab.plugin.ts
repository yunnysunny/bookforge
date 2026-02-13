import type { RendererThis, MarkedExtension, Tokens } from 'marked';

interface TabItem {
  title: string;
  content: string;
  tokens: Tokens.Generic[];
}
interface GitbookTabsToken extends Tokens.Generic {
  type: 'gb-tabs';
  tag: 'tabs';
  tabItems: TabItem[];
}
export const gitbookTabExtension: MarkedExtension = {
  extensions: [
    {
      name: 'gb-tabs',
      level: 'block',
      start(src: string) {
        return src.indexOf('{%');
      },
      tokenizer(this, src: string): GitbookTabsToken | undefined {
        const rule = /^\{%\s*tabs\s*%\}([\s\S]*?)\{%\s*endtabs\s*%\}/;
        const match = rule.exec(src);
        if (!match) return;

        const [, content] = match;

        const tabRegex = /\{%\s*tab\s+title="([^"]+)"\s*%\}([\s\S]*?)\{%\s*endtab\s*%\}/g;
        const tabItems: TabItem[] = [];
        let matchTab: RegExpExecArray | null = tabRegex.exec(content);
        while (matchTab !== null) {
          tabItems.push({
            title: matchTab[1],
            content: matchTab[2],
            tokens: this.lexer.blockTokens(matchTab[2]),
          });
          matchTab = tabRegex.exec(content);
        }

        return {
          type: 'gb-tabs',
          tag: 'tabs',
          raw: match[0],
          tabItems,
        };
      },
      renderer(this: RendererThis<string, string>, token: Tokens.Generic) {
        const { tag, tabItems, raw } = token as GitbookTabsToken;
        if (!tag || !tabItems || tabItems.length === 0) {
          return raw;
        }
        return `<div class="gb-tabs">
          <div class="tabs-header">
          ${tabItems
            .map((item, index) => {
              return `<div class="tab${index === 0 ? ' active' : ''}">${item.title}</div>`;
            })
            .join('\n')}
          </div>
          <div class="tabs-body">
          ${tabItems
            .map((item, index) => {
              return `<div class="tab-panel${index === 0 ? ' active' : ''}">${this.parser.parse(item.tokens)}</div>`;
            })
            .join('\n')}
          </div>
        </div>`;
      },
    },
  ],
};
