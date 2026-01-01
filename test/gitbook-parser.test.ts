// GitbookParser 测试

import path from 'path';
import { beforeEach, describe, expect, it, type Mock, vi } from 'vitest';
import type { MarkdownFile, ParserOptions, TreeNode } from '../src/types';
import * as utils from '../src/utils';
import { GitbookParser } from '../src/core/book-parsers/gitbook.parser';
import {readdir, stat} from 'fs/promises';

describe('GitbookParser', () => {
  let parser: GitbookParser;
  const defaultOptions: ParserOptions = {
    outputDir: './dist',
    env: 'html'
  };
  beforeEach(() => {
    parser = new GitbookParser({
      ...defaultOptions
    });
    vi.clearAllMocks();
  });

  async function getResult(folder: string, options: ParserOptions = defaultOptions) {
    const parser = new GitbookParser(options);
    const result = await parser.parse(path.join(__dirname, folder));
    return result;
  }

  describe('parseProject', () => {
    it('应该解析有入口文件的项目', async () => {
      const result = await getResult('./fixtures/docs');

      expect(result.title).toBe('Root');
      expect(result.children).toHaveLength(3);
      expect(result.children[0].title).toBe('介绍');
      expect(result.children[1].title).toBe('快速开始');
      expect(result.children[2].title).toBe('API 参考');
    });

    it('应该扫描目录中的 markdown 文件', async () => {
      const result = await getResult('./fixtures/mds');

      expect(result.children).toHaveLength(3);
    });

    it('应该忽略指定的目录', async () => {
      const parserWithOptions: ParserOptions = {
        ignorePatterns: ['skipped'],
        ...defaultOptions,
      };

      const result = await getResult('./fixtures/skip-test', parserWithOptions);

      // 应该只包含 test.md ，不包含 node_modules
      expect(result.children).toHaveLength(1);
    });

    it('应该处理解析失败的文件', async () => {
      const originalReadFile = utils.readFile;
      vi.spyOn(utils, 'readFile').mockImplementation(
        async (filename, options) => {
          if (filename.toString().endsWith('error.md')) {
            throw new Error('文件读取错误');
          }
          return await originalReadFile.call(utils, filename, options);
        },
      );

      const result = await getResult('./fixtures/with-error');

      // 应该只包含成功解析的文件
      expect(result.children).toHaveLength(1);
      expect(result.children[0].title).toBe('测试文档');
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
        headings: [],
      };

      vi.spyOn(utils, 'readFile').mockResolvedValue(mockContent);

      // 模拟 parseMarkdownFile 方法
      const parseMarkdownFileSpy = vi
        .spyOn(parser as any, 'parseMarkdownFile')
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
        headings: [],
      };

      vi.spyOn(utils, 'readFile').mockResolvedValue(mockContent);

      const parseMarkdownFileSpy = vi
        .spyOn(parser as any, 'parseMarkdownFile')
        .mockResolvedValue(mockMarkdownFile);

      const rootNode: TreeNode = { title: 'Root', children: [] };
      await (parser as any).parseEntryFile('./docs/README.md', rootNode);

      expect(rootNode.children).toHaveLength(2);
      expect(parseMarkdownFileSpy).toHaveBeenCalledTimes(2);
    });
  });

  describe('getMarkdownFiles', () => {
    it('应该递归获取所有 markdown 文件', async () => {
      vi.mock('fs/promises', () => ({
        readdir: vi.fn(),
        stat: vi.fn(),
      }));
      (stat as Mock)
        .mockResolvedValueOnce({ isFile: () => true, isDirectory: () => false }) // test.md 是文件
        .mockResolvedValueOnce({ isFile: () => true, isDirectory: () => true }) // subdir 是目录
        .mockResolvedValueOnce({ isFile: () => true, isDirectory: () => false }) // subtest.md 是文件
        .mockResolvedValueOnce({ isFile: () => true, isDirectory: () => false }); // README.md 是文件

      (readdir as Mock)
        .mockResolvedValueOnce(['test.md', 'subdir', 'README.md'])
        .mockResolvedValueOnce(['subtest.md']);

      const result = (await(parser as any).getMarkdownFiles('./docs')) as string[];

      expect(result.map(item => item.replace(/\\/g, '/'))).toEqual([
        expect.stringContaining('docs/test.md'),
        expect.stringContaining('docs/subdir/subtest.md'),
        expect.stringContaining('docs/README.md'),
      ]);
    });

    it('应该忽略非 markdown 文件', async () => {
      
      vi.mock('fs/promises', () => ({
        readdir: vi.fn(),
        stat: vi.fn(),
      }));

      (readdir as Mock).mockResolvedValue([
        'test.txt',
        'test.md',
        'test.html',
      ]);

      (stat as Mock).mockImplementation(() =>
        Promise.resolve({
          isFile: () => true,
          isDirectory: () => false,
        }),
      );


      const result = await (parser as any).getMarkdownFiles('./docs');

      expect(result).toHaveLength(1);
      expect(result[0]).toContain('test.md');
    });
  });
});
