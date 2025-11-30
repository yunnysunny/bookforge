import { marked } from "marked";
import {readFile} from "fs/promises";
import path from "path";

// ========================
// 1. GitBook 标签渲染器
// ========================
const gitbookTagRenderers: Record<
  string,
  (text: string, params: Record<string, string>) => string | Promise<string>
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
    `<pre><code class="language-${params.lang || ""}">${text}</code></pre>`,

  // tabs / tab
  tab: (text, params) =>
    `<div class="gb-tab" data-title="${params.title || ""}">${marked.parse(
      text
    )}</div>`,
  tabs: (text) => `<div class="gb-tabs">${marked.parse(text)}</div>`,

  // include 文件内容
  include: async (text, params) => {
    const filePath = params.file;
    if (!filePath) return "<!-- include file not specified -->";
    try {
      const content = await readFile(path.resolve(filePath), "utf-8");
      return marked.parse(content); // 将文件内容解析为 markdown
    } catch (err) {
      return `<!-- include file error: ${err instanceof Error ? err.message : err?.toString()} -->`;
    }
  },

  // toc: 生成目录（h1~h6）
  toc: (text) => {
    const lines = text.split("\n");
    const items = lines
      .map((line) => {
        const match = /^(#{1,6})\s+(.*)/.exec(line);
        if (!match) return null;
        const level = match[1].length;
        const title = match[2];
        const id = title
          .toLowerCase()
          .replace(/[^\w]+/g, "-")
          .replace(/^-+|-+$/g, "");
        return `<li class="toc-level-${level}"><a href="#${id}">${title}</a></li>`;
      })
      .filter(Boolean)
      .join("\n");
    return `<ul class="gb-toc">\n${items}\n</ul>`;
  },
};

// ========================
// 2. 解析参数 key="value"
// ========================
/** 解析 GitBook 参数，如 style="info" lang="ts" */
function parseParams(str: string) {
  const params: Record<string, string> = {};
  const re = /(\w+)="(.*?)"/g;
  let m;
  while ((m = re.exec(str))) {
    params[m[1]] = m[2];
  }
  return params;
}

export const gitbookExtension = {
    extensions: [
        {
          name: "gb-tag",
          level: "block",
          start(src: string) {
            return src.match(/\{%/)?.index;
          },
          tokenizer(src: string) {
            const rule = /^\{% (\w+)(.*?) %\}([\s\S]*?)\{% end\1 %\}/;
            const match = rule.exec(src);
            if (!match) return;
    
            const [, tag, paramStr, content] = match;
            return {
              type: "gb-tag",
              raw: match[0],
              tag,
              params: parseParams(paramStr),
              text: content.trim(),
            };
          },
          renderer(token: any) {
            const fn = gitbookTagRenderers[token.tag];
            if (fn) return fn(token.text, token.params);
            return token.raw; // 未知标签原样输出
          },
        },
      ],
};




// 注册
// marked.use(gitbookExtension);
