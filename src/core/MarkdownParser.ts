// Markdown 解析器
import { marked } from 'marked';
import { MarkdownFile, Heading } from '../types/index.js';
import { readFile, generateHeadingId } from '../utils/index.js';

export class MarkdownParser {
  private marked: typeof marked;

  constructor() {
    this.marked = marked;
    this.marked.setOptions({
      gfm: true,
      breaks: true
    });
  }

  /**
   * 解析 markdown 文件
   */
  parseFile(filePath: string): MarkdownFile {
    const content = readFile(filePath);
    const headings = this.extractHeadings(content);
    const title = this.extractTitle(content, headings);
    
    return {
      path: filePath,
      title,
      content,
      headings
    };
  }

  /**
   * 提取标题结构
   */
  private extractHeadings(content: string): Heading[] {
    const normalized = content.replace(/\r\n?/g, '\n');
    const lines = normalized.split('\n');
    const headings: Heading[] = [];
    const stack: Heading[] = [];

    for (const line of lines) {
      const match = line.match(/^(#{1,6})\s+(.+)$/);
      if (match) {
        const level = match[1].length;
        const text = match[2].trim();
        const id = generateHeadingId(text);
        
        const heading: Heading = {
          level,
          text,
          id,
          children: []
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
    const firstH1 = headings.find(h => h.level === 1);
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
  async toHtml(content: string): Promise<string> {
    return await this.marked(content);
  }
}
