// Markdown 解析器

import { copyFile } from 'fs/promises';
import { marked, type Token, type Tokens, Marked } from 'marked';
import { dirname, join } from 'path';
import type { Heading, MarkdownFile } from '../types/index.js';
import { generateIdFromText, mkdirAsync, readFile } from '../utils';
import { gitbookExtension } from './marked-plugins/gitbook.plugin.js';

const renderer = new marked.Renderer();
renderer.heading = ({ tokens, depth }: Tokens.Heading) => {
  const token = tokens[0] as unknown as Heading;
  token.id = generateIdFromText(token.text);
  return `<h${depth} id="${token.id}">
  <a href="#${token.id}" class="anchor"></a>
  ${token.text}
</h${depth}>`;
};
export class MarkdownParser {
  private marked: Marked;

  constructor() {
    this.marked = new Marked();
    this.marked.setOptions({
      gfm: true,
      breaks: true,
      renderer,
    });
    this.marked.use(gitbookExtension);
  }

  /**
   * 解析 markdown 文件
   */
  async parseFile(filePath: string): Promise<MarkdownFile> {
    const content = await readFile(filePath);
    const headings = this.extractHeadings(content);
    const title = this.extractTitle(content, headings);

    return {
      path: filePath,
      title,
      content,
      headings,
    };
  }

  /**
   * 提取标题结构
   */
  private extractHeadings(content: string): Heading[] {
    const normalizedStr = content.replace(/\r\n?/g, '\n');
    const lines = normalizedStr.split('\n');
    // logger.info('normalized', normalizedStr);
    const headings: Heading[] = [];
    const stack: Heading[] = [];

    for (const line of lines) {
      const match = line.trim().match(/^(#{1,6})\s+(.+)$/);
      if (match) {
        const level = match[1].length;
        const text = match[2].trim();
        const id = generateIdFromText(text);

        const heading: Heading = {
          level,
          text,
          id,
          children: [],
        };

        // 找到合适的父级标题
        while (stack.length > 0 && stack[stack.length - 1].level >= level) {
          stack.pop();
        }

        if (stack.length === 0) {
          headings.push(heading);
        } else {
          stack[stack.length - 1].children.push(heading);
        }

        stack.push(heading);
      }
    }

    return headings;
  }

  /**
   * 提取文档标题
   */
  private extractTitle(content: string, headings: Heading[]): string {
    // 优先使用第一个一级标题
    const firstH1 = headings.find((h) => h.level === 1);
    if (firstH1) {
      return firstH1.text;
    }

    // 如果没有一级标题，使用第一个标题
    if (headings.length > 0) {
      return headings[0].text;
    }

    // 如果没有任何标题，使用文件名
    return 'Untitled';
  }

  /**
   * 将 markdown 转换为 HTML
   */
  async toHtml(
    content: string,
    options: {
      contentPath: string;
      destDir: string;
    },
  ): Promise<string> {
    const html = await this.marked.parse(content, {
      walkTokens: async (token: Token) => {
        if (token.type === 'image') {
          const src = token.href;
          if (
            !src
            || src.startsWith('http')
            || src.startsWith('data:image/')
            || src.startsWith('blob:')
            || src.startsWith('//')
          ) {
            return;
          }
          const decodedSrc = decodeURIComponent(src);
          const imageFromPath = join(dirname(options.contentPath), decodedSrc);
          const imageToPath = join(options.destDir, decodedSrc);
          const imageToDir = dirname(imageToPath);
          await mkdirAsync(imageToDir);
          await copyFile(imageFromPath, imageToPath);
        }
      },
    });
    return html;
  }
}
