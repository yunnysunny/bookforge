// PdfGenerator 测试
import puppeteer from 'puppeteer';
import { beforeEach, describe, expect, it, type Mock, vi } from 'vitest';
import { type HtmlData, PdfGenerator } from '../src/generators/pdf.generator';
import type { BookForgeConfig, TreeNode } from '../src/types';
import { GitbookParser } from '../src/core/book-parsers/gitbook.parser';

// 模拟 fs 模块
vi.mock('fs/promises');

// 模拟 puppeteer
vi.mock('puppeteer');
interface MockPdfGenerator {
  title: string;
  generateHtmlContent: (tree: TreeNode) => Promise<string>;
  generateTableOfContents: (tree: TreeNode) => Promise<string>;
  generateHtmlData(tree: TreeNode, data: HtmlData[]): Promise<void>;
  generateContent(data: HtmlData[]): Promise<string>;
}
describe('PdfGenerator', () => {
  let generator: PdfGenerator;

  const defaultConfig: BookForgeConfig = {
    input: './docs',
    output: './dist/pdf',
    format: 'pdf',
  };
  beforeEach(() => {
    generator = new PdfGenerator(defaultConfig);
    vi.clearAllMocks();
  });

  describe('generate', () => {
    it('应该生成 PDF 文件', async () => {
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
        ],
      };

      const mockBrowser = {
        newPage: vi.fn(),
        close: vi.fn(),
      };

      const mockPage = {
        setContent: vi.fn(),
        pdf: vi.fn(),
      };

      // (existsSync as jest.Mock).mockReturnValue(false);
      (puppeteer.launch as Mock).mockResolvedValue(mockBrowser);
      (mockBrowser.newPage as Mock).mockResolvedValue(mockPage);
      (mockPage.setContent as Mock).mockResolvedValue(undefined);
      (mockPage.pdf as Mock).mockResolvedValue(Buffer.from('PDF content'));
      vi.spyOn(GitbookParser.prototype, 'parse').mockResolvedValue(mockTree);
      await generator.generate();

      // expect(mkdirSync).toHaveBeenCalledWith(mockOutputDir, {
      //   recursive: true,
      // });
      expect(puppeteer.launch).toHaveBeenCalledWith({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--allow-file-access-from-files',
          '--disable-web-security',
        ],
      });
      expect(mockPage.setContent).toHaveBeenCalled();
      expect(mockPage.pdf).toHaveBeenCalledWith(
        expect.objectContaining({
          path: expect.stringContaining('.pdf'),
          format: 'A4',
          printBackground: true,
          margin: {
            top: '20mm',
            right: '20mm',
            bottom: '20mm',
            left: '20mm',
          },
          displayHeaderFooter: true,
          headerTemplate: '<div></div>',
          footerTemplate: expect.stringContaining('pageNumber'),
        }),
      );
      expect(mockBrowser.close).toHaveBeenCalled();
    });

    it('应该处理空目录树', async () => {
      const mockTree: TreeNode = {
        title: 'Root',
        children: [],
      };

      const mockBrowser = {
        newPage: vi.fn(),
        close: vi.fn(),
      };

      const mockPage = {
        setContent: vi.fn(),
        pdf: vi.fn(),
      };

      // (existsSync as jest.Mock).mockReturnValue(false);
      (puppeteer.launch as Mock).mockResolvedValue(mockBrowser);
      (mockBrowser.newPage as Mock).mockResolvedValue(mockPage);
      (mockPage.setContent as Mock).mockResolvedValue(undefined);
      (mockPage.pdf as Mock).mockResolvedValue(Buffer.from('PDF content'));

      vi.spyOn(GitbookParser.prototype, 'parse').mockResolvedValue(mockTree);
      await generator.generate();

      expect(mockPage.setContent).toHaveBeenCalled();
      expect(mockPage.pdf).toHaveBeenCalled();
    });

    it('应该处理多个文档', async () => {
      const mockTree: TreeNode = {
        title: 'Root',
        children: [
          {
            title: '文档1',
            path: './doc1.md',
            content: '# 文档1\n\n内容1',
            headings: [],
            children: [],
          },
          {
            title: '文档2',
            path: './doc2.md',
            content: '# 文档2\n\n内容2',
            headings: [],
            children: [],
          },
        ],
      };

      const mockBrowser = {
        newPage: vi.fn(),
        close: vi.fn(),
      };

      const mockPage = {
        setContent: vi.fn(),
        pdf: vi.fn(),
      };

      // (existsSync as jest.Mock).mockReturnValue(false);
      (puppeteer.launch as Mock).mockResolvedValue(mockBrowser);
      (mockBrowser.newPage as Mock).mockResolvedValue(mockPage);
      (mockPage.setContent as Mock).mockResolvedValue(undefined);
      (mockPage.pdf as Mock).mockResolvedValue(Buffer.from('PDF content'));

      vi.spyOn(GitbookParser.prototype, 'parse').mockResolvedValue(mockTree);
      await generator.generate();

      expect(mockPage.setContent).toHaveBeenCalled();
      expect(mockPage.pdf).toHaveBeenCalled();
    });
  });

  describe('generateHtmlContent', () => {
    it('应该生成正确的 HTML 内容', async () => {
      const mockTree: TreeNode = {
        title: 'Root',
        children: [
          {
            title: '测试文档',
            path: './test.md',
            content: '# 测试\n\n内容',
            headings: [],
            children: [],
          },
        ],
      };
      const _generator = generator as unknown as MockPdfGenerator;
      const html = await _generator.generateHtmlContent(mockTree);

      expect(html).toContain('<!DOCTYPE html>');
      expect(html).toContain(`<title>${_generator.title}</title>`);
      expect(html).toContain('<div class="cover">');
      expect(html).toContain(`<h1>${_generator.title}</h1>`);
      expect(html).toContain('<div class="toc">');
      expect(html).toContain('<h2>目录</h2>');
      expect(html).toContain('<div class="content-body">');
    });

    it('应该包含目录结构', async () => {
      const mockTree: TreeNode = {
        title: 'Root',
        children: [
          {
            title: '文档1',
            path: './doc1.md',
            content: '# 文档1',
            headings: [],
            children: [],
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

      const html = await (
        generator as unknown as MockPdfGenerator
      ).generateHtmlContent(mockTree);

      expect(html).toContain('文档1');
      expect(html).toContain('文档2');
    });

    it('应该包含分页符', async () => {
      const mockTree: TreeNode = {
        title: 'Root',
        children: [
          {
            title: '文档1',
            path: './doc1.md',
            content: '# 文档1',
            headings: [],
            children: [],
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

      const html = await (
        generator as unknown as MockPdfGenerator
      ).generateHtmlContent(mockTree);

      expect(html).toContain('<div class="page-break"></div>');
    });
  });

  describe('generateTableOfContents', () => {
    it('应该生成正确的目录结构', async () => {
      const mockTree: TreeNode = {
        title: 'Root',
        children: [
          {
            title: '文档1',
            path: './doc1.md',
            content: '# 文档1',
            headings: [],
            children: [],
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

      const toc = await (
        generator as unknown as MockPdfGenerator
      ).generateTableOfContents(mockTree);

      expect(toc).toContain('<ul class="toc-list">');
      expect(toc).toContain('文档1');
      expect(toc).toContain('文档2');
    });

    it('应该处理嵌套文档', async () => {
      const mockTree: TreeNode = {
        title: 'Root',
        children: [
          {
            title: '主文档',
            path: './main.md',
            content: '# 主文档',
            headings: [],
            children: [
              {
                title: '子文档',
                path: './sub.md',
                content: '# 子文档',
                headings: [],
                children: [],
              },
            ],
          },
        ],
      };

      const toc = await (
        generator as unknown as MockPdfGenerator
      ).generateTableOfContents(mockTree);

      expect(toc).toContain('主文档');
      expect(toc).toContain('子文档');
      expect(toc).toContain('<div class="toc-children">');
    });
  });

  describe('generateContent', () => {
    it('应该生成文档内容', async () => {
      const mockTree: TreeNode = {
        title: 'Root',
        children: [
          {
            title: '测试文档',
            path: './test.md',
            content: '# 测试\n\n这是测试内容。',
            headings: [],
            children: [],
          },
        ],
      };

      const htmlData: HtmlData[] = [];
      const _generator = generator as unknown as MockPdfGenerator;
      await _generator.generateHtmlData(mockTree, htmlData);
      const content = await _generator.generateContent(htmlData);

      expect(content).toContain('<div class="content-body">');
      expect(content).toContain('<h1>测试文档</h1>');
      expect(content).toContain('<h1 id="测试">');
      expect(content).toContain('这是测试内容。');
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
            children: [],
          },
          {
            title: '无内容的文档',
            path: './empty.md',
            children: [],
          },
        ],
      };

      const htmlData: HtmlData[] = [];
      const _generator = generator as unknown as MockPdfGenerator;
      await _generator.generateHtmlData(mockTree, htmlData);
      const content = await _generator.generateContent(htmlData);

      expect(content).toContain('有内容的文档');
      expect(content).not.toContain('无内容的文档');
    });
  });
});
