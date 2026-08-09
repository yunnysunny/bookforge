// HtmlGenerator 测试

import { writeFileSync } from 'node:fs';
import { readFile, rm } from 'node:fs/promises';
import path from 'node:path';
import * as cheerio from 'cheerio';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { HtmlGenerator } from '../src/generators/html.generator';
import type { BookForgeConfig, Heading, SearchIndexDocument, TreeNode } from '../src/types';
import { GitbookParser } from '../src/core/book-parsers/gitbook.parser';

// 模拟 fs 模块
// jest.mock('fs');
interface MockHtmlGenerator {
  sidebar: string;
  generateSinglePageHtml(node: TreeNode): Promise<string>;
  generateSidebar(tree: TreeNode): Promise<string>;
  generateDocumentPages(treeRoot: TreeNode): Promise<void>;
  generateTableOfContents(headings: Heading[]): Promise<string>;
}
describe('HtmlGenerator', () => {
  let generator: HtmlGenerator;
  const mockOutputDir = path.join(__dirname, './dist/html');
  const defaultOptions: BookForgeConfig = {
    input: './docs',
    output: mockOutputDir,
    format: 'html',
  };

  beforeEach(() => {
    generator = new HtmlGenerator(defaultOptions);
    vi.clearAllMocks();
  });

  describe('generate', () => {
    it('应该生成完整的 HTML 网站', async () => {
      const mockTree: TreeNode = {
        title: 'Root',
        children: [
          {
            title: '介绍',
            path: './introduction.md',
            content: '# 介绍\n\n欢迎使用 GitBook 解析器！\n\n## 安装\n\n开始之前请先安装。',
            headings: [
              {
                level: 1,
                text: '介绍',
                id: '介绍',
                children: [],
              },
              {
                level: 2,
                text: '安装',
                id: '安装',
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

      vi.spyOn(GitbookParser.prototype, 'parse').mockResolvedValue(mockTree);
      await generator.generate();
      const _generator = generator as unknown as MockHtmlGenerator;
      expect(_generator.sidebar).toContain('介绍');
      expect(_generator.sidebar).toContain('快速开始');

      const searchIndex = JSON.parse(
        await readFile(path.join(mockOutputDir, 'search-index.json'), 'utf-8'),
      ) as SearchIndexDocument;
      expect(searchIndex.pages).toHaveLength(2);
      expect(searchIndex.pages[0]).toMatchObject({
        title: '介绍',
        url: 'index.html',
      });
      expect(searchIndex.pages[0].content).toContain('欢迎使用 GitBook 解析器');
      expect(searchIndex.pages[0].headings).toContainEqual({
        id: '安装',
        level: 2,
        text: '安装',
      });
    });

    it('应该把 navLinks 渲染到顶部导航栏', async () => {
      const navGenerator = new HtmlGenerator({
        ...defaultOptions,
        navLinks: [
          { text: 'GitHub', url: 'https://github.com/yunnysunny/bookforge' },
          { text: '关于', url: 'about.html' },
        ],
      });
      const mockTree: TreeNode = {
        title: 'Root',
        children: [
          {
            title: '介绍',
            path: './introduction.md',
            content: '# 介绍\n\n欢迎使用 GitBook 解析器！',
            headings: [],
            children: [],
          },
        ],
      };

      vi.spyOn(GitbookParser.prototype, 'parse').mockResolvedValue(mockTree);
      await navGenerator.generate();

      const html = await readFile(path.join(mockOutputDir, 'index.html'), 'utf-8');
      const $ = cheerio.load(html);
      const links = $('.navbar-nav .nav-link');
      expect(links).toHaveLength(3); // 首页 + 2 个自定义链接

      const github = links.filter((_, el) => $(el).text().trim() === 'GitHub');
      expect(github.attr('href')).toBe('https://github.com/yunnysunny/bookforge');
      expect(github.attr('target')).toBe('_blank');
      expect(github.attr('rel')).toBe('noopener noreferrer');

      // 站内链接不应该在新窗口打开
      const about = links.filter((_, el) => $(el).text().trim() === '关于');
      expect(about.attr('href')).toBe('about.html');
      expect(about.attr('target')).toBeUndefined();
    });

    it.skip('应该处理空目录树', async () => {
      const mockTree: TreeNode = {
        title: 'Root',
        children: [],
      };

      // (existsSync as jest.Mock).mockReturnValue(false);

      vi.spyOn(GitbookParser.prototype, 'parse').mockResolvedValue(mockTree);
      await generator.generate();

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

      const html = await (generator as unknown as MockHtmlGenerator).generateSinglePageHtml(page);
      const $ = cheerio.load(html);
      expect(html).toContain('<!DOCTYPE html>');
      expect(html).toContain('<title>测试文档</title>');
      expect($('h1').text().trim()).toBe('测试');
      expect(html).toContain('<link rel="stylesheet" href="styles.css">');
      expect(html).toContain('<script type="module" src="script.js"></script>');
      expect(html).toContain('class="search-results"');
      expect($('#aiEntryButton').text().trim()).toBe('AI');
      expect($('#aiChatPanel').attr('aria-hidden')).toBe('true');
      expect($('.ai-chat-subtitle').text()).toContain('优先基于当前页面');
      expect($('#aiBaseUrlInput').attr('placeholder')).toContain('https://api.openai.com/v1');
      expect($('#aiApiKeyInput').attr('type')).toBe('password');
      expect($('#aiModelInput').attr('placeholder')).toContain('gpt-4o-mini');
      expect($('.ai-chat-context-tip').text()).toContain('当前页优先');
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
              children: [],
            },
          ],
        },
      ];

      const html = await (generator as unknown as MockHtmlGenerator).generateTableOfContents(
        mockHeadings,
      );

      expect(html).toContain('<ul class="toc-list">');
      expect(html).toContain('主标题');
      expect(html).toContain('子标题');
    });
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

      const sidebar = await (generator as unknown as MockHtmlGenerator).generateSidebar(mockTree);

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

      const toc = await (generator as unknown as MockHtmlGenerator).generateTableOfContents(
        mockHeadings,
      );

      expect(toc).toContain('<ul class="toc-list">');
      expect(toc).toContain('主标题');
      expect(toc).toContain('子标题');
      expect(toc).toContain('三级标题');
      expect(toc).toContain('另一个主标题');
    });
  });

  afterEach(async () => {
    await rm(mockOutputDir, { recursive: true, force: true });
  });
});
