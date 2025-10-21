// GitBookParser 测试
import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { readdirSync, statSync, readFileSync } from 'fs';
import { GitBookParser } from '../core/GitBookParser.js';
import { TreeNode, MarkdownFile } from '../types/index.js';

// 模拟 fs 模块
jest.mock('fs');

describe('GitBookParser', () => {
  let parser: GitBookParser;

  beforeEach(() => {
    parser = new GitBookParser();
    jest.clearAllMocks();
  });

  describe('parseProject', () => {
    it('应该解析有入口文件的项目', async () => {
      const mockSummaryContent = `# GitBook 文档

## 目录

* [介绍](./introduction.md)
* [快速开始](./getting-started.md)
* [API 参考](./api-reference.md)`;

      const mockIntroductionContent = `# 介绍

欢迎使用 GitBook 解析器！`;

      const mockGettingStartedContent = `# 快速开始

让我们开始使用 GitBook 解析器！`;

      const mockApiReferenceContent = `# API 参考

## GitBookParser

主要的解析器类。`;

      // 模拟文件系统
      (statSync as jest.Mock)
        .mockReturnValueOnce({ isFile: () => true }) // README.md 存在
        .mockReturnValueOnce({ isFile: () => true }) // introduction.md 存在
        .mockReturnValueOnce({ isFile: () => true }) // getting-started.md 存在
        .mockReturnValueOnce({ isFile: () => true }); // api-reference.md 存在

      (readFileSync as jest.Mock)
        .mockReturnValueOnce(mockSummaryContent)
        .mockReturnValueOnce(mockIntroductionContent)
        .mockReturnValueOnce(mockGettingStartedContent)
        .mockReturnValueOnce(mockApiReferenceContent);

      const result = await parser.parseProject('./docs');

      expect(result.title).toBe('Root');
      expect(result.children).toHaveLength(3);
      expect(result.children[0].title).toBe('介绍');
      expect(result.children[1].title).toBe('快速开始');
      expect(result.children[2].title).toBe('API 参考');
    });

    it('应该扫描目录中的 markdown 文件', async () => {
      const mockFileContent = `# 测试文档

这是测试内容。`;

      // 模拟文件系统
      (statSync as jest.Mock)
        .mockReturnValueOnce({ isFile: () => false }) // README.md 不存在
        .mockReturnValueOnce({ isFile: () => false }) // SUMMARY.md 不存在
        .mockReturnValueOnce({ isFile: () => false }) // index.md 不存在
        .mockReturnValueOnce({ isDirectory: () => true }) // docs 是目录
        .mockReturnValueOnce({ isFile: () => true }) // test.md 是文件
        .mockReturnValueOnce({ isFile: () => true }); // README.md 是文件

      (readdirSync as jest.Mock).mockReturnValue(['test.md', 'README.md', 'node_modules']);

      (readFileSync as jest.Mock).mockReturnValue(mockFileContent);

      const result = await parser.parseProject('./docs');

      expect(result.children).toHaveLength(2);
      expect(result.children[0].title).toBe('测试文档');
      expect(result.children[1].title).toBe('测试文档');
    });

    it('应该忽略指定的目录', async () => {
      const parserWithOptions = new GitBookParser({
        ignorePatterns: ['node_modules', '.git']
      });

      const mockFileContent = `# 测试文档

这是测试内容。`;

      // 模拟文件系统
      (statSync as jest.Mock)
        .mockReturnValueOnce({ isFile: () => false }) // README.md 不存在
        .mockReturnValueOnce({ isFile: () => false }) // SUMMARY.md 不存在
        .mockReturnValueOnce({ isFile: () => false }) // index.md 不存在
        .mockReturnValueOnce({ isDirectory: () => true }) // docs 是目录
        .mockReturnValueOnce({ isFile: () => true }) // test.md 是文件
        .mockReturnValueOnce({ isDirectory: () => true }) // node_modules 是目录
        .mockReturnValueOnce({ isFile: () => true }); // README.md 是文件

      (readdirSync as jest.Mock).mockReturnValue(['test.md', 'node_modules', 'README.md']);

      (readFileSync as jest.Mock).mockReturnValue(mockFileContent);

      const result = await parserWithOptions.parseProject('./docs');

      // 应该只包含 test.md 和 README.md，不包含 node_modules
      expect(result.children).toHaveLength(2);
    });

    it('应该处理解析失败的文件', async () => {
      const mockFileContent = `# 测试文档

这是测试内容。`;

      // 模拟文件系统
      (statSync as jest.Mock)
        .mockReturnValueOnce({ isFile: () => false }) // README.md 不存在
        .mockReturnValueOnce({ isFile: () => false }) // SUMMARY.md 不存在
        .mockReturnValueOnce({ isFile: () => false }) // index.md 不存在
        .mockReturnValueOnce({ isDirectory: () => true }) // docs 是目录
        .mockReturnValueOnce({ isFile: () => true }) // test.md 是文件
        .mockReturnValueOnce({ isFile: () => true }); // error.md 是文件

      (readdirSync as jest.Mock).mockReturnValue(['test.md', 'error.md']);

      (readFileSync as jest.Mock)
        .mockReturnValueOnce(mockFileContent)
        .mockImplementationOnce(() => { throw new Error('文件读取错误'); });

      const result = await parser.parseProject('./docs');

      // 应该只包含成功解析的文件
      expect(result.children).toHaveLength(1);
      expect(result.children[0].title).toBe('测试文档');
    });
  });

  describe('findEntryFile', () => {
    it('应该找到 README.md', () => {
      (statSync as jest.Mock)
        .mockReturnValueOnce({ isFile: () => true });

      const result = (parser as any).findEntryFile('./docs');

      expect(result).toBe('./docs/README.md');
    });

    it('应该找到 SUMMARY.md 当 README.md 不存在时', () => {
      (statSync as jest.Mock)
        .mockReturnValueOnce({ isFile: () => false }) // README.md 不存在
        .mockReturnValueOnce({ isFile: () => true }); // SUMMARY.md 存在

      const result = (parser as any).findEntryFile('./docs');

      expect(result).toBe('./docs/SUMMARY.md');
    });

    it('应该找到 index.md 当前两个都不存在时', () => {
      (statSync as jest.Mock)
        .mockReturnValueOnce({ isFile: () => false }) // README.md 不存在
        .mockReturnValueOnce({ isFile: () => false }) // SUMMARY.md 不存在
        .mockReturnValueOnce({ isFile: () => true }); // index.md 存在

      const result = (parser as any).findEntryFile('./docs');

      expect(result).toBe('./docs/index.md');
    });

    it('应该返回 null 当没有入口文件时', () => {
      (statSync as jest.Mock)
        .mockReturnValue({ isFile: () => false });

      const result = (parser as any).findEntryFile('./docs');

      expect(result).toBeNull();
    });
  });

  describe('parseEntryFile', () => {
    it('应该解析入口文件中的链接', async () => {
      const mockContent = `# GitBook 文档

## 目录

* [介绍](./introduction.md)
* [快速开始](./getting-started.md)
- [API 参考](./api-reference.md)`;

      const mockMarkdownFile: MarkdownFile = {
        path: './introduction.md',
        title: '介绍',
        content: '# 介绍\n\n欢迎使用 GitBook 解析器！',
        headings: []
      };

      (readFileSync as jest.Mock).mockReturnValue(mockContent);

      // 模拟 parseMarkdownFile 方法
      const parseMarkdownFileSpy = jest.spyOn(parser as any, 'parseMarkdownFile')
        .mockResolvedValue(mockMarkdownFile);

      const rootNode: TreeNode = { title: 'Root', children: [] };
      await (parser as any).parseEntryFile('./docs/README.md', rootNode);

      expect(rootNode.children).toHaveLength(3);
      expect(rootNode.children[0].title).toBe('介绍');
      expect(rootNode.children[1].title).toBe('介绍');
      expect(rootNode.children[2].title).toBe('介绍');

      expect(parseMarkdownFileSpy).toHaveBeenCalledTimes(3);
    });

    it('应该忽略非链接行', async () => {
      const mockContent = `# GitBook 文档

## 目录

这是普通文本
* [介绍](./introduction.md)
- 这是普通列表项
* [快速开始](./getting-started.md)`;

      const mockMarkdownFile: MarkdownFile = {
        path: './introduction.md',
        title: '介绍',
        content: '# 介绍',
        headings: []
      };

      (readFileSync as jest.Mock).mockReturnValue(mockContent);

      const parseMarkdownFileSpy = jest.spyOn(parser as any, 'parseMarkdownFile')
        .mockResolvedValue(mockMarkdownFile);

      const rootNode: TreeNode = { title: 'Root', children: [] };
      await (parser as any).parseEntryFile('./docs/README.md', rootNode);

      expect(rootNode.children).toHaveLength(2);
      expect(parseMarkdownFileSpy).toHaveBeenCalledTimes(2);
    });
  });

  describe('getMarkdownFiles', () => {
    it('应该递归获取所有 markdown 文件', () => {
      (statSync as jest.Mock)
        .mockReturnValueOnce({ isDirectory: () => true }) // docs 是目录
        .mockReturnValueOnce({ isFile: () => true }) // test.md 是文件
        .mockReturnValueOnce({ isDirectory: () => true }) // subdir 是目录
        .mockReturnValueOnce({ isFile: () => true }) // subtest.md 是文件
        .mockReturnValueOnce({ isFile: () => true }); // README.md 是文件

      (readdirSync as jest.Mock)
        .mockReturnValueOnce(['test.md', 'subdir', 'README.md'])
        .mockReturnValueOnce(['subtest.md']);

      const result = (parser as any).getMarkdownFiles('./docs');

      expect(result).toEqual([
        './docs/test.md',
        './docs/subdir/subtest.md',
        './docs/README.md'
      ]);
    });

    it('应该忽略非 markdown 文件', () => {
      (statSync as jest.Mock)
        .mockReturnValueOnce({ isDirectory: () => true }) // docs 是目录
        .mockReturnValueOnce({ isFile: () => true }) // test.txt 是文件
        .mockReturnValueOnce({ isFile: () => true }) // test.md 是文件
        .mockReturnValueOnce({ isFile: () => true }); // test.html 是文件

      (readdirSync as jest.Mock).mockReturnValue(['test.txt', 'test.md', 'test.html']);

      const result = (parser as any).getMarkdownFiles('./docs');

      expect(result).toEqual(['./docs/test.md']);
    });
  });
});
