// HtmlGenerator 测试
import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { HtmlGenerator } from '../generators/HtmlGenerator.js';
import { TreeNode, Heading } from '../types/index.js';

// 模拟 fs 模块
jest.mock('fs');

describe('HtmlGenerator', () => {
  let generator: HtmlGenerator;
  const mockOutputDir = './dist/html';

  beforeEach(() => {
    generator = new HtmlGenerator(mockOutputDir);
    jest.clearAllMocks();
  });

  describe('generate', () => {
    it('应该生成完整的 HTML 网站', async () => {
      const mockTree: TreeNode = {
        title: 'Root',
        children: [
          {
            title: '介绍',
            path: './introduction.md',
            content: '# 介绍\n\n欢迎使用 GitBook 解析器！',
            headings: [
              {
                level: 1,
                text: '介绍',
                id: '介绍',
                children: []
              }
            ],
            children: []
          },
          {
            title: '快速开始',
            path: './getting-started.md',
            content: '# 快速开始\n\n让我们开始使用！',
            headings: [
              {
                level: 1,
                text: '快速开始',
                id: '快速开始',
                children: []
              }
            ],
            children: []
          }
        ]
      };

      (existsSync as jest.Mock).mockReturnValue(false);

      await generator.generate(mockTree, '测试文档');

      expect(mkdirSync).toHaveBeenCalledWith(mockOutputDir, { recursive: true });
      expect(writeFileSync).toHaveBeenCalledTimes(4); // index.html + 2个文档页面 + styles.css + script.js
    });

    it('应该处理空目录树', async () => {
      const mockTree: TreeNode = {
        title: 'Root',
        children: []
      };

      (existsSync as jest.Mock).mockReturnValue(false);

      await generator.generate(mockTree, '空文档');

      expect(writeFileSync).toHaveBeenCalledTimes(3); // index.html + styles.css + script.js
    });

    it('应该跳过没有内容的节点', async () => {
      const mockTree: TreeNode = {
        title: 'Root',
        children: [
          {
            title: '有内容的文档',
            path: './test.md',
            content: '# 测试\n\n内容',
            headings: [],
            children: []
          },
          {
            title: '无内容的文档',
            path: './empty.md',
            children: []
          }
        ]
      };

      (existsSync as jest.Mock).mockReturnValue(false);

      await generator.generate(mockTree, '测试文档');

      // 应该只生成有内容的文档页面
      const writeFileCalls = (writeFileSync as jest.Mock).mock.calls;
      const htmlFiles = writeFileCalls.filter(call => call[0].endsWith('.html'));
      expect(htmlFiles).toHaveLength(2); // index.html + 1个文档页面
    });
  });

  describe('generateHtmlTemplate', () => {
    it('应该生成正确的 HTML 模板', async () => {
      const mockTree: TreeNode = {
        title: 'Root',
        children: [
          {
            title: '测试文档',
            path: './test.md',
            content: '# 测试\n\n内容',
            headings: [],
            children: []
          }
        ]
      };

      const html = await (generator as any).generateHtmlTemplate('测试标题', mockTree, '# 测试\n\n内容');

      expect(html).toContain('<!DOCTYPE html>');
      expect(html).toContain('<title>测试标题</title>');
      expect(html).toContain('<h1>测试标题</h1>');
      expect(html).toContain('<link rel="stylesheet" href="styles.css">');
      expect(html).toContain('<script src="script.js"></script>');
    });

    it('应该包含侧边栏导航', async () => {
      const mockTree: TreeNode = {
        title: 'Root',
        children: [
          {
            title: '文档1',
            path: './doc1.md',
            content: '# 文档1',
            headings: [],
            children: []
          },
          {
            title: '文档2',
            path: './doc2.md',
            content: '# 文档2',
            headings: [],
            children: []
          }
        ]
      };

      const html = await (generator as any).generateHtmlTemplate('测试标题', mockTree, '# 内容');

      expect(html).toContain('<aside class="sidebar">');
      expect(html).toContain('<nav class="sidebar-nav">');
      expect(html).toContain('文档1');
      expect(html).toContain('文档2');
    });

    it('应该包含目录', async () => {
      const mockHeadings: Heading[] = [
        {
          level: 1,
          text: '主标题',
          id: '主标题',
          children: [
            {
              level: 2,
              text: '子标题',
              id: '子标题',
              children: []
            }
          ]
        }
      ];

      const mockTree: TreeNode = {
        title: 'Root',
        children: []
      };

      const html = await (generator as any).generateHtmlTemplate('测试标题', mockTree, '# 内容', mockHeadings);

      expect(html).toContain('<aside class="toc">');
      expect(html).toContain('<h3>目录</h3>');
      expect(html).toContain('主标题');
      expect(html).toContain('子标题');
    });
  });

  describe('generateSidebar', () => {
    it('应该生成正确的侧边栏结构', () => {
      const mockTree: TreeNode = {
        title: 'Root',
        children: [
          {
            title: '文档1',
            path: './doc1.md',
            content: '# 文档1',
            headings: [],
            children: [
              {
                title: '子文档1',
                path: './subdoc1.md',
                content: '# 子文档1',
                headings: [],
                children: []
              }
            ]
          },
          {
            title: '文档2',
            path: './doc2.md',
            content: '# 文档2',
            headings: [],
            children: []
          }
        ]
      };

      const sidebar = (generator as any).generateSidebar(mockTree);

      expect(sidebar).toContain('文档1');
      expect(sidebar).toContain('子文档1');
      expect(sidebar).toContain('文档2');
      expect(sidebar).toContain('sidebar-children');
    });
  });

  describe('generateTableOfContents', () => {
    it('应该生成正确的目录结构', () => {
      const mockHeadings: Heading[] = [
        {
          level: 1,
          text: '主标题',
          id: '主标题',
          children: [
            {
              level: 2,
              text: '子标题',
              id: '子标题',
              children: [
                {
                  level: 3,
                  text: '三级标题',
                  id: '三级标题',
                  children: []
                }
              ]
            }
          ]
        },
        {
          level: 1,
          text: '另一个主标题',
          id: '另一个主标题',
          children: []
        }
      ];

      const toc = (generator as any).generateTableOfContents(mockHeadings);

      expect(toc).toContain('<ul class="toc-list">');
      expect(toc).toContain('主标题');
      expect(toc).toContain('子标题');
      expect(toc).toContain('三级标题');
      expect(toc).toContain('另一个主标题');
      expect(toc).toContain('href="#主标题"');
      expect(toc).toContain('href="#子标题"');
      expect(toc).toContain('href="#三级标题"');
    });
  });

  describe('generateStyles', () => {
    it('应该生成样式文件', () => {
      (generator as any).generateStyles();

      expect(writeFileSync).toHaveBeenCalledWith(
        expect.stringContaining('styles.css'),
        expect.stringContaining('/* GitBook 样式 */'),
        'utf-8'
      );
    });

    it('应该包含响应式设计样式', () => {
      (generator as any).generateStyles();

      const stylesCall = (writeFileSync as jest.Mock).mock.calls.find(
        call => call[0].endsWith('styles.css')
      );
      const styles = stylesCall[1];

      expect(styles).toContain('@media (max-width: 768px)');
      expect(styles).toContain('.sidebar-toggle');
      expect(styles).toContain('.container');
      expect(styles).toContain('.sidebar');
      expect(styles).toContain('.main-content');
    });
  });

  describe('generateScripts', () => {
    it('应该生成脚本文件', () => {
      (generator as any).generateScripts();

      expect(writeFileSync).toHaveBeenCalledWith(
        expect.stringContaining('script.js'),
        expect.stringContaining('// GitBook 脚本'),
        'utf-8'
      );
    });

    it('应该包含平滑滚动功能', () => {
      (generator as any).generateScripts();

      const scriptCall = (writeFileSync as jest.Mock).mock.calls.find(
        call => call[0].endsWith('script.js')
      );
      const script = scriptCall[1];

      expect(script).toContain('scrollIntoView');
      expect(script).toContain('behavior: \'smooth\'');
      expect(script).toContain('sidebar-toggle');
    });
  });

  describe('getFileName', () => {
    it('应该生成正确的文件名', () => {
      const fileName1 = (generator as any).getFileName('Hello World');
      const fileName2 = (generator as any).getFileName('测试标题');
      const fileName3 = (generator as any).getFileName('Special & Characters!');

      expect(fileName1).toBe('hello-world');
      expect(fileName2).toBe('测试标题');
      expect(fileName3).toBe('special-characters');
    });
  });
});
