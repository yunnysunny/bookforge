// MarkdownParser 测试
import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { readFileSync } from 'fs';
import { MarkdownParser } from '../core/MarkdownParser.js';
import { MarkdownFile, Heading } from '../types/index.js';

// 模拟 fs 模块
jest.mock('fs');

describe('MarkdownParser', () => {
  let parser: MarkdownParser;

  beforeEach(() => {
    parser = new MarkdownParser();
    jest.clearAllMocks();
  });

  describe('parseFile', () => {
    it('应该解析包含标题的 markdown 文件', () => {
      const mockContent = `# 主标题

这是介绍内容。

## 子标题

这是子标题的内容。

### 三级标题

这是三级标题的内容。`;

      (readFileSync as jest.Mock).mockReturnValue(mockContent);

      const result = parser.parseFile('test.md');

      expect(result).toEqual({
        path: 'test.md',
        title: '主标题',
        content: mockContent,
        headings: expect.arrayContaining([
          expect.objectContaining({
            level: 1,
            text: '主标题',
            id: '主标题',
            children: expect.arrayContaining([
              expect.objectContaining({
                level: 2,
                text: '子标题',
                id: '子标题',
                children: expect.arrayContaining([
                  expect.objectContaining({
                    level: 3,
                    text: '三级标题',
                    id: '三级标题',
                    children: []
                  })
                ])
              })
            ])
          })
        ])
      });
    });

    it('应该处理没有标题的文件', () => {
      const mockContent = '这是没有标题的内容。\n\n只有普通文本。';
      (readFileSync as jest.Mock).mockReturnValue(mockContent);

      const result = parser.parseFile('test.md');

      expect(result.title).toBe('Untitled');
      expect(result.headings).toEqual([]);
    });

    it('应该处理多个同级标题', () => {
      const mockContent = `# 标题1

内容1

# 标题2

内容2

## 标题2的子标题

子内容`;

      (readFileSync as jest.Mock).mockReturnValue(mockContent);

      const result = parser.parseFile('test.md');

      expect(result.headings).toHaveLength(2);
      expect(result.headings[0].text).toBe('标题1');
      expect(result.headings[1].text).toBe('标题2');
      expect(result.headings[1].children).toHaveLength(1);
      expect(result.headings[1].children[0].text).toBe('标题2的子标题');
    });

    it('应该处理标题层级跳跃', () => {
      const mockContent = `# 一级标题

## 二级标题

#### 四级标题

内容`;

      (readFileSync as jest.Mock).mockReturnValue(mockContent);

      const result = parser.parseFile('test.md');

      expect(result.headings).toHaveLength(1);
      expect(result.headings[0].children).toHaveLength(1);
      expect(result.headings[0].children[0].children).toHaveLength(1);
      expect(result.headings[0].children[0].children[0].level).toBe(4);
    });
  });

  describe('toHtml', () => {
    it('应该将 markdown 转换为 HTML', async () => {
      const markdown = `# 标题

这是**粗体**文本和*斜体*文本。

- 列表项1
- 列表项2

\`\`\`javascript
console.log('Hello World');
\`\`\``;

      const html = await parser.toHtml(markdown);

      expect(html).toContain('<h1>标题</h1>');
      expect(html).toContain('<strong>粗体</strong>');
      expect(html).toContain('<em>斜体</em>');
      expect(html).toContain('<ul>');
      expect(html).toContain('<li>列表项1</li>');
      expect(html).toContain('<pre>');
      expect(html).toContain('<code class="language-javascript">');
    });

    it('应该处理空内容', async () => {
      const html = await parser.toHtml('');
      expect(html).toBe('');
    });

    it('应该处理纯文本', async () => {
      const html = await parser.toHtml('纯文本内容');
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

      const headings = (parser as any).extractHeadings(content);

      expect(headings).toHaveLength(1);
      expect(headings[0].level).toBe(1);
      expect(headings[0].text).toBe('H1');
      expect(headings[0].children).toHaveLength(1);
      expect(headings[0].children[0].level).toBe(2);
      expect(headings[0].children[0].text).toBe('H2');
    });

    it('应该处理标题前后的空格', () => {
      const content = `#   标题前后有空格   `;
      const headings = (parser as any).extractHeadings(content);

      expect(headings[0].text).toBe('标题前后有空格');
    });

    it('应该处理空标题', () => {
      const content = `# 
## 
### `;
      const headings = (parser as any).extractHeadings(content);

      expect(headings).toHaveLength(1);
      expect(headings[0].text).toBe('');
    });
  });

  describe('标题 ID 生成', () => {
    it('应该为标题生成正确的 ID', () => {
      const content = `# Hello World
## Test & Example
### Multiple   Spaces`;

      const headings = (parser as any).extractHeadings(content);

      expect(headings[0].id).toBe('hello-world');
      expect(headings[0].children[0].id).toBe('test-example');
      expect(headings[0].children[0].children[0].id).toBe('multiple-spaces');
    });
  });
});
