// NotionParser 测试

import path from 'path';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ParserOptions } from '../src/types';
import { NotionParser } from '../src/core/book-parsers/notion.parser';

describe('NotionParser', () => {
  let parser: NotionParser;
  const defaultOptions: ParserOptions = {
    outputDir: './dist',
    env: 'html',
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    parser = new NotionParser({
      ...defaultOptions,
    });
  });

  async function getResult(folder: string, options: ParserOptions = defaultOptions) {
    const parser = new NotionParser(options);
    const result = await parser.parse(path.join(__dirname, folder));
    return result;
  }

  describe('parseProject', () => {
    it('应该解析有入口文件的项目', async () => {
      const result = await getResult('./fixtures/database/with-folder');

      expect(result).toBeDefined();
      expect(result.children).toHaveLength(1);
      expect(result.children[0].title).toBe('无标题');
      const subChildren = result.children[0].children;
      expect(subChildren).toHaveLength(3);
      expect(subChildren[0].title).toBe('ai避免紫蓝渐变');
      expect(subChildren[1].title).toBe('联想笔记本');
      expect(subChildren[2].title).toBe(
        '小霸王当年死磕8位6502，而不上16位68K，真是因为技术全依赖联电，自己完全没能力设计新架构吗？',
      );
    });
  });
});
