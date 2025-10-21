// 集成测试
import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { writeFileSync, mkdirSync, existsSync, readdirSync, statSync, readFileSync } from 'fs';
import puppeteer from 'puppeteer';
import { GitBookParser } from '../core/GitBookParser.js';
import { HtmlGenerator } from '../generators/HtmlGenerator.js';
import { PdfGenerator } from '../generators/PdfGenerator.js';

// 模拟 fs 模块
jest.mock('fs');

// 模拟 puppeteer
jest.mock('puppeteer');

describe('集成测试', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('完整的 GitBook 解析和生成流程', () => {
    it('应该从入口文件解析并生成 HTML 网站', async () => {
      // 模拟文件系统
      const mockSummaryContent = `# GitBook 文档

## 目录

* [介绍](./introduction.md)
* [快速开始](./getting-started.md)`;

      const mockIntroductionContent = `# 介绍

欢迎使用 GitBook 解析器！

## 特性

- 解析 markdown 文件
- 生成 HTML 网站
- 生成 PDF 文件`;

      const mockGettingStartedContent = `# 快速开始

## 安装

\`\`\`bash
pnpm install
\`\`\`

## 使用

\`\`\`bash
pnpm start html --input ./docs --output ./dist/html
\`\`\``;

      // 模拟文件系统调用
      (statSync as jest.Mock)
        .mockReturnValueOnce({ isFile: () => true }) // README.md 存在
        .mockReturnValueOnce({ isFile: () => true }) // introduction.md 存在
        .mockReturnValueOnce({ isFile: () => true }); // getting-started.md 存在

      (readFileSync as jest.Mock)
        .mockReturnValueOnce(mockSummaryContent)
        .mockReturnValueOnce(mockIntroductionContent)
        .mockReturnValueOnce(mockGettingStartedContent);

      (existsSync as jest.Mock).mockReturnValue(false);

      // 执行解析
      const parser = new GitBookParser();
      const tree = await parser.parseProject('./docs');

      // 验证解析结果
      expect(tree.title).toBe('Root');
      expect(tree.children).toHaveLength(2);
      expect(tree.children[0].title).toBe('介绍');
      expect(tree.children[1].title).toBe('快速开始');

      // 执行 HTML 生成
      const htmlGenerator = new HtmlGenerator('./dist/html');
      await htmlGenerator.generate(tree, 'GitBook 文档');

      // 验证 HTML 生成
      expect(mkdirSync).toHaveBeenCalledWith('./dist/html', { recursive: true });
      expect(writeFileSync).toHaveBeenCalledWith(
        './dist/html/index.html',
        expect.stringContaining('<!DOCTYPE html>'),
        'utf-8'
      );
      expect(writeFileSync).toHaveBeenCalledWith(
        './dist/html/styles.css',
        expect.stringContaining('/* GitBook 样式 */'),
        'utf-8'
      );
      expect(writeFileSync).toHaveBeenCalledWith(
        './dist/html/script.js',
        expect.stringContaining('// GitBook 脚本'),
        'utf-8'
      );
    });

    it('应该从目录扫描解析并生成 PDF 文件', async () => {
      const mockFileContent = `# 测试文档

## 介绍

这是测试文档的内容。

### 特性

- 功能1
- 功能2

## 使用

\`\`\`javascript
console.log('Hello World');
\`\`\``;

      // 模拟文件系统
      (statSync as jest.Mock)
        .mockReturnValueOnce({ isFile: () => false }) // README.md 不存在
        .mockReturnValueOnce({ isFile: () => false }) // SUMMARY.md 不存在
        .mockReturnValueOnce({ isFile: () => false }) // index.md 不存在
        .mockReturnValueOnce({ isDirectory: () => true }) // docs 是目录
        .mockReturnValueOnce({ isFile: () => true }); // test.md 是文件

      (readdirSync as jest.Mock).mockReturnValue(['test.md']);

      (readFileSync as jest.Mock).mockReturnValue(mockFileContent);

      (existsSync as jest.Mock).mockReturnValue(false);

      // 模拟 puppeteer
      const mockBrowser = {
        newPage: jest.fn(),
        close: jest.fn()
      };

      const mockPage = {
        setContent: jest.fn(),
        pdf: jest.fn()
      };

      (puppeteer.launch as jest.Mock).mockResolvedValue(mockBrowser);
      (mockBrowser.newPage as jest.Mock).mockResolvedValue(mockPage);
      (mockPage.setContent as jest.Mock).mockResolvedValue(undefined);
      (mockPage.pdf as jest.Mock).mockResolvedValue(Buffer.from('PDF content'));

      // 执行解析
      const parser = new GitBookParser();
      const tree = await parser.parseProject('./docs');

      // 验证解析结果
      expect(tree.children).toHaveLength(1);
      expect(tree.children[0].title).toBe('测试文档');
      expect(tree.children[0].headings).toHaveLength(1);
      expect(tree.children[0].headings![0].text).toBe('测试文档');
      expect(tree.children[0].headings![0].children).toHaveLength(2);

      // 执行 PDF 生成
      const pdfGenerator = new PdfGenerator('./dist/pdf');
      await pdfGenerator.generate(tree, '测试文档');

      // 验证 PDF 生成
      expect(mkdirSync).toHaveBeenCalledWith('./dist/pdf', { recursive: true });
      expect(puppeteer.launch).toHaveBeenCalled();
      expect(mockPage.setContent).toHaveBeenCalled();
      expect(mockPage.pdf).toHaveBeenCalledWith({
        path: expect.stringContaining('gitbook-.pdf'),
        format: 'A4',
        printBackground: true,
        margin: {
          top: '20mm',
          right: '20mm',
          bottom: '20mm',
          left: '20mm'
        },
        displayHeaderFooter: true,
        headerTemplate: '<div></div>',
        footerTemplate: expect.stringContaining('pageNumber')
      });
      expect(mockBrowser.close).toHaveBeenCalled();
    });

    it('应该处理复杂的文档结构', async () => {
      const mockSummaryContent = `# GitBook 文档

## 目录

* [介绍](./introduction.md)
  * [特性](./features.md)
  * [安装](./installation.md)
* [API 参考](./api-reference.md)
  * [GitBookParser](./api/gitbook-parser.md)
  * [HtmlGenerator](./api/html-generator.md)
* [示例](./examples.md)`;

      const mockIntroductionContent = `# 介绍

欢迎使用 GitBook 解析器！

## 什么是 GitBook 解析器？

GitBook 解析器是一个强大的工具。

### 主要功能

1. 解析 markdown 文件
2. 生成 HTML 网站
3. 生成 PDF 文件`;

      const mockFeaturesContent = `# 特性

## 核心特性

- 智能解析
- 美观界面
- 高质量输出

## 技术特性

- TypeScript 支持
- 模块化设计
- 可扩展架构`;

      const mockApiReferenceContent = `# API 参考

## GitBookParser

主要的解析器类。

### 方法

#### parseProject(inputPath: string): Promise<TreeNode>

解析 GitBook 项目。`;

      const mockExamplesContent = `# 示例

## 基本示例

\`\`\`typescript
import { GitBookParser } from 'gitbook-parser';

const parser = new GitBookParser();
const tree = await parser.parseProject('./docs');
\`\`\``;

      // 模拟文件系统
      (statSync as jest.Mock)
        .mockReturnValueOnce({ isFile: () => true }) // README.md 存在
        .mockReturnValueOnce({ isFile: () => true }) // introduction.md 存在
        .mockReturnValueOnce({ isFile: () => true }) // features.md 存在
        .mockReturnValueOnce({ isFile: () => true }) // installation.md 存在
        .mockReturnValueOnce({ isFile: () => true }) // api-reference.md 存在
        .mockReturnValueOnce({ isFile: () => true }) // api/gitbook-parser.md 存在
        .mockReturnValueOnce({ isFile: () => true }) // api/html-generator.md 存在
        .mockReturnValueOnce({ isFile: () => true }); // examples.md 存在

      (readFileSync as jest.Mock)
        .mockReturnValueOnce(mockSummaryContent)
        .mockReturnValueOnce(mockIntroductionContent)
        .mockReturnValueOnce(mockFeaturesContent)
        .mockReturnValueOnce(mockApiReferenceContent)
        .mockReturnValueOnce(mockExamplesContent);

      (existsSync as jest.Mock).mockReturnValue(false);

      // 执行解析
      const parser = new GitBookParser();
      const tree = await parser.parseProject('./docs');

      // 验证解析结果
      expect(tree.children).toHaveLength(3);
      expect(tree.children[0].title).toBe('介绍');
      expect(tree.children[1].title).toBe('API 参考');
      expect(tree.children[2].title).toBe('示例');

      // 验证标题结构
      expect(tree.children[0].headings![0].text).toBe('介绍');
      expect(tree.children[0].headings![0].children).toHaveLength(2);
      expect(tree.children[0].headings![0].children[0].text).toBe('什么是 GitBook 解析器？');
      expect(tree.children[0].headings![0].children[1].text).toBe('主要功能');

      // 执行 HTML 生成
      const htmlGenerator = new HtmlGenerator('./dist/html');
      await htmlGenerator.generate(tree, 'GitBook 文档');

      // 验证生成的文件
      const writeFileCalls = (writeFileSync as jest.Mock).mock.calls;
      const htmlFiles = writeFileCalls.filter(call => call[0].endsWith('.html'));
      expect(htmlFiles.length).toBeGreaterThan(0);

      // 验证样式和脚本文件
      expect(writeFileSync).toHaveBeenCalledWith(
        './dist/html/styles.css',
        expect.stringContaining('/* GitBook 样式 */'),
        'utf-8'
      );
      expect(writeFileSync).toHaveBeenCalledWith(
        './dist/html/script.js',
        expect.stringContaining('// GitBook 脚本'),
        'utf-8'
      );
    });

    it('应该处理错误情况', async () => {
      // 模拟文件系统错误
      (statSync as jest.Mock).mockImplementation(() => {
        throw new Error('文件系统错误');
      });

      const parser = new GitBookParser();

      // 应该优雅地处理错误
      const tree = await parser.parseProject('./docs');
      expect(tree.title).toBe('Root');
      expect(tree.children).toHaveLength(0);
    });
  });

  describe('性能测试', () => {
    it('应该能够处理大量文档', async () => {
      const mockFileContent = `# 文档

## 内容

这是文档内容。`;

      // 模拟大量文件
      const fileNames = Array.from({ length: 100 }, (_, i) => `doc${i}.md`);

      (statSync as jest.Mock)
        .mockReturnValueOnce({ isFile: () => false }) // README.md 不存在
        .mockReturnValueOnce({ isFile: () => false }) // SUMMARY.md 不存在
        .mockReturnValueOnce({ isFile: () => false }) // index.md 不存在
        .mockReturnValueOnce({ isDirectory: () => true }) // docs 是目录
        .mockReturnValue({ isFile: () => true }); // 所有文件都存在

      (readdirSync as jest.Mock).mockReturnValue(fileNames);
      (readFileSync as jest.Mock).mockReturnValue(mockFileContent);
      (existsSync as jest.Mock).mockReturnValue(false);

      const startTime = Date.now();

      // 执行解析
      const parser = new GitBookParser();
      const tree = await parser.parseProject('./docs');

      const parseTime = Date.now() - startTime;

      // 验证结果
      expect(tree.children).toHaveLength(100);
      expect(parseTime).toBeLessThan(5000); // 应该在5秒内完成

      // 执行 HTML 生成
      const htmlGenerator = new HtmlGenerator('./dist/html');
      await htmlGenerator.generate(tree, '大量文档测试');

      // 验证生成的文件数量
      const writeFileCalls = (writeFileSync as jest.Mock).mock.calls;
      const htmlFiles = writeFileCalls.filter(call => call[0].endsWith('.html'));
      expect(htmlFiles.length).toBeGreaterThan(100);
    });
  });
});
