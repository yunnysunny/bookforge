// HtmlGenerator 测试
import { existsSync, mkdirSync, writeFileSync } from 'fs';
import path from 'path';
import { HtmlGenerator } from '../src/generators/HtmlGenerator';
import type { Heading, TreeNode } from '../src/types';

// 模拟 fs 模块
// jest.mock('fs');

describe('HtmlGenerator', () => {
  let generator: HtmlGenerator;
  const mockOutputDir = path.join(__dirname, './dist/html');

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
                children: [],
              },
            ],
            children: [],
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
                children: [],
              },
            ],
            children: [],
          },
        ],
      };

      // (existsSync as jest.Mock).mockReturnValue(false);

      await generator.generate(mockTree, '测试文档');

      // expect(mkdirSync).toHaveBeenCalledWith(mockOutputDir, { recursive: true });
      // expect(writeFileSync).toHaveBeenCalledTimes(4); // index.html + 2个文档页面 + styles.css + script.js
    });

    it.skip('应该处理空目录树', async () => {
      const mockTree: TreeNode = {
        title: 'Root',
        children: [],
      };

      // (existsSync as jest.Mock).mockReturnValue(false);

      await generator.generate(mockTree, '空文档');

      expect(writeFileSync).toHaveBeenCalledTimes(3); // index.html + styles.css + script.js
    });


  });

  describe('generateHtmlTemplate', () => {
    it('应该生成正确的 HTML 模板', async () => {
      const page: TreeNode = {
        title: '测试文档',
        path: './test.md',
        content: '# 测试\n\n内容',
        headings: [],
        children: [],
      };
      const mockTree: TreeNode = {
        title: 'Root',
        children: [
          page,
        ],
      };

      const html = await (generator as any).generateHtmlTemplate(
        page,
        mockTree,
      );

      expect(html).toContain('<!DOCTYPE html>');
      expect(html).toContain('<title>测试文档</title>');
      expect(html).toContain('<h1>测试文档</h1>');
      expect(html).toContain('<link rel="stylesheet" href="styles.css">');
      expect(html).toContain('<script src="script.js"></script>');
    });

    it('应该包含侧边栏导航', async () => {
      const page1: TreeNode = {
        title: '文档1',
        path: './doc1.md',
        content: '# 文档1',
        headings: [],
        children: [],
      };
      const page2: TreeNode = {
        title: '文档2',
        path: './doc2.md',
        content: '# 文档2',
        headings: [],
        children: [],
      };
      const mockTree: TreeNode = {
        title: 'Root',
        children: [
          page1,
          page2,
        ],
      };

      const html = await (generator as any).generateHtmlTemplate(
        page1,
        mockTree,
      );

      expect(html).toContain('<aside class="sidebar">');
      expect(html).toContain('<nav class="sidebar-nav">');
      expect(html).toContain('文档1');
      expect(html).toContain('文档2');
    });

    // it('应该包含目录', async () => {
    //   const mockHeadings: Heading[] = [
    //     {
    //       level: 1,
    //       text: '主标题',
    //       id: '主标题',
    //       children: [
    //         {
    //           level: 2,
    //           text: '子标题',
    //           id: '子标题',
    //           children: [],
    //         },
    //       ],
    //     },
    //   ];

    //   const mockTree: TreeNode = {
    //     title: 'Root',
    //     children: [],
    //   };

    //   const html = await (generator as any).generateHtmlTemplate(
    //     '测试标题',
    //     mockTree,
    //     '# 内容',
    //     mockHeadings,
    //   );

    //   expect(html).toContain('<aside class="toc">');
    //   expect(html).toContain('<h3>目录</h3>');
    //   expect(html).toContain('主标题');
    //   expect(html).toContain('子标题');
    // });
  });

  describe('generateSidebar', () => {
    it('应该生成正确的侧边栏结构', async () => {
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
                children: [],
              },
            ],
          },
          {
            title: '文档2',
            path: './doc2.md',
            content: '# 文档2',
            headings: [],
            children: [],
          },
        ],
      };

      const sidebar = await (generator as any).generateSidebar(mockTree, 0);

      expect(sidebar).toContain('文档1');
      expect(sidebar).toContain('子文档1');
      expect(sidebar).toContain('文档2');
      expect(sidebar).toContain('sidebar-children');
    });
  });

  describe('generateTableOfContents', () => {
    it('应该生成正确的目录结构', async () => {
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
                  children: [],
                },
              ],
            },
          ],
        },
        {
          level: 1,
          text: '另一个主标题',
          id: '另一个主标题',
          children: [],
        },
      ];

      const toc = await (generator as any).generateTableOfContents(mockHeadings);

      expect(toc).toContain('<ul class="toc-list">');
      expect(toc).toContain('主标题');
      expect(toc).toContain('子标题');
      expect(toc).toContain('三级标题');
      expect(toc).toContain('另一个主标题');
    });
  });

  describe.skip('getFileName', () => {
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
