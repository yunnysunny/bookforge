import type { RendererThis, MarkedExtension, Tokens } from 'marked';

interface StepperItem {
  title: string;
  content: string;
  tokens: Tokens.Generic[];
}
interface GitbookStepperToken extends Tokens.Generic {
  type: 'gb-stepper';
  tag: 'stepper';
  items: StepperItem[];
}
export const gitbookStepperExtension: MarkedExtension = {
  extensions: [
    {
      name: 'gb-stepper',
      level: 'block',
      start(src: string) {
        return src.indexOf('{%');
      },
      tokenizer(this, src: string): GitbookStepperToken | undefined {
        const rule = /^\{%\s*stepper\s*%\}([\s\S]*?)\{%\s*endstepper\s*%\}/;
        const match = rule.exec(src);
        if (!match) return;

        const [, content] = match;

        const stepRegex = /\{%\s*step\s*%\}([\s\S]*?)\{%\s*endstep\s*%\}/g;
        const stepItems: StepperItem[] = [];
        let matchStep: RegExpExecArray | null = stepRegex.exec(content);
        while (matchStep !== null) {
          stepItems.push({
            title: matchStep[1],
            content: matchStep[2],
            tokens: this.lexer.blockTokens(matchStep[1]),
          });
          matchStep = stepRegex.exec(content);
        }

        return {
          type: 'gb-stepper',
          tag: 'stepper',
          raw: match[0],
          items: stepItems,
        };
      },
      renderer(this: RendererThis<string, string>, token: Tokens.Generic) {
        const { tag, items: stepItems, raw } = token as GitbookStepperToken;
        if (!tag || !stepItems || stepItems.length === 0) {
          return raw;
        }
        return `<div class="gb-stepper">
          ${stepItems
            .map((item, index) => {
              return `
              <div class="step">
                <div class="step-marker">
                  <span class="step-number">${index + 1}</span>
                  <span class="step-line"></span>
                </div>
                <div class="step-content">${this.parser.parse(item.tokens)}</div>
              </div>
              `;
            })
            .join('\n')}
        </div>`;
      },
    },
  ],
};
