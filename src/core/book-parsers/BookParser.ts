// GitBook 解析器
import type { ParserOptions } from '../../types';
import { GitbookParser } from './gitbook.parser';
import { NotionParser } from './notion.parser';
import type { IBookParser } from './interfaces';

export function getInstance(options: ParserOptions): IBookParser {
  const mode = options.parseMode;
  if (mode === 'notion') {
    return new NotionParser(options);
  }
  return new GitbookParser(options);
}
