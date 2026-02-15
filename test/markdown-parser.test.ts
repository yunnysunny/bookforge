// MarkdownParser 测试

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MarkdownParser, type MarkdownParserOptions } from '../src/core/markdown-parser';
import * as utils from '../src/utils';
import type { Heading } from '../src/types';
interface MockMarkdownParser {
  extractHeadings(content: string): Heading[];
}
describe('MarkdownParser', () => {
  let parser: MarkdownParser;

  const defaultOptions: MarkdownParserOptions = {
    env: 'html',
  };
  beforeEach(() => {
    parser = new MarkdownParser(defaultOptions);
    vi.clearAllMocks();
  });

  describe('parseFile', () => {
    it('should parse markdown file with headings', async () => {
      const mockContent = `# 主标题

这是介绍内容。

## 子标题

这是子标题的内容。

### 三级标题

这是三级标题的内容。`;

      vi.spyOn(utils, 'readFile').mockResolvedValue(mockContent);

      const result = await parser.parseFile('test.md');

      expect(result).toEqual({
        path: 'test.md',
        title: '主标题',
        content: mockContent,
        headings: expect.arrayContaining([
          expect.objectContaining({
            level: 1,
            text: '主标题',
            // id: '主标题',
            children: expect.arrayContaining([
              expect.objectContaining({
                level: 2,
                text: '子标题',
                // id: '子标题',
                children: expect.arrayContaining([
                  expect.objectContaining({
                    level: 3,
                    text: '三级标题',
                    // id: '三级标题',
                    children: [],
                  }),
                ]),
              }),
            ]),
          }),
        ]),
      });
    });

    it('should handle file without headings', async () => {
      const mockContent = '这是没有标题的内容。\n\n只有普通文本。';
      vi.spyOn(utils, 'readFile').mockResolvedValue(mockContent);

      const result = await parser.parseFile('test.md');

      expect(result.title).toBe('Untitled');
      expect(result.headings).toHaveLength(0);
    });

    it('should handle multiple sibling headings', async () => {
      const mockContent = `# 标题1

内容1

# 标题2

内容2

## 标题2的子标题

子内容`;

      vi.spyOn(utils, 'readFile').mockResolvedValue(mockContent);

      const result = await parser.parseFile('test.md');

      expect(result.headings).toHaveLength(2);
      expect(result.headings[0].text).toBe('标题1');
      expect(result.headings[1].text).toBe('标题2');
      expect(result.headings[1].children).toHaveLength(1);
      expect(result.headings[1].children[0].text).toBe('标题2的子标题');
    });

    it('should handle title level jump', async () => {
      const mockContent = `# 一级标题

## 二级标题

#### 四级标题

内容`;

      vi.spyOn(utils, 'readFile').mockResolvedValue(mockContent);

      const result = await parser.parseFile('test.md');

      expect(result.headings).toHaveLength(1);
      expect(result.headings[0].children).toHaveLength(1);
      expect(result.headings[0].children[0].children).toHaveLength(1);
      expect(result.headings[0].children[0].children[0].level).toBe(4);
    });
  });

  describe('toHtml', () => {
    it('should convert markdown to HTML', async () => {
      const markdown = `# 标题

这是**粗体**文本和*斜体*文本。

- 列表项1
- 列表项2

\`\`\`javascript
console.log('Hello World');
\`\`\``;

      const html = await parser.toHtml(markdown, {
        contentPath: 'test.md',
        destDir: 'test.html',
      });

      expect(html).toContain('<h1 id="标题">');
      expect(html).toContain('<strong>粗体</strong>');
      expect(html).toContain('<em>斜体</em>');
      expect(html).toContain('<ul>');
      expect(html).toContain('<li>列表项1</li>');
      expect(html).toContain('<pre>');
      expect(html).toContain('<code class="language-javascript">');
    });

    it('should handle empty content', async () => {
      const html = await parser.toHtml('', {
        contentPath: 'test.md',
        destDir: 'test.html',
      });
      expect(html).toBe('');
    });

    it('should handle plain text', async () => {
      const html = await parser.toHtml('纯文本内容', {
        contentPath: 'test.md',
        destDir: 'test.html',
      });
      expect(html).toContain('纯文本内容');
    });
  });

  describe('标题提取', () => {
    it('应该正确提取标题层级', () => {
      const content = `# H1
## H2
### H3
#### H4
##### H5
###### H6`;

      const headings = (parser as unknown as MockMarkdownParser).extractHeadings(content);

      expect(headings).toHaveLength(1);
      expect(headings[0].level).toBe(1);
      expect(headings[0].text).toBe('H1');
      expect(headings[0].children).toHaveLength(1);
      expect(headings[0].children[0].level).toBe(2);
      expect(headings[0].children[0].text).toBe('H2');
    });

    it('应该处理标题前后的空格', () => {
      const content = `#   标题前后有空格   `;
      const headings = (parser as unknown as MockMarkdownParser).extractHeadings(content);

      expect(headings[0].text).toBe('标题前后有空格');
    });

    it('空标题会被跳过', () => {
      const content = `# 
## 
### `;
      const headings = (parser as unknown as MockMarkdownParser).extractHeadings(content);

      expect(headings).toHaveLength(0);
    });
  });
});
