// GitBook 解析器
import { stat } from 'fs/promises';
import type { ParserMode, ParserOptions, TreeNode } from '../types';
import { createTempDir, isZipFile, unzipFile } from '../utils';
import { GitbookParser } from './book-parsers/gitbook.parser';
import { NotionParser } from './book-parsers/notion.parser';
import type { IBookParser } from './book-parsers/interfaces';

export class BookParser {
  private options: ParserOptions;
  private _realPath?: string;

  constructor(options: ParserOptions = {}) {
    this.options = {
      encoding: 'utf-8',
      ignorePatterns: ['node_modules', '.git', 'dist', 'build'],
      ...options,
    };
  }
  public get realPath(): string | undefined {
    return this._realPath;
  }
  private async getRealPath(path: string): Promise<string> {
    const stats = await stat(path);
    if (stats.isDirectory()) {
      return path;
    }
    if (isZipFile(path)) {
      const realPath = await createTempDir();
      await unzipFile(path, realPath);
      this._realPath = realPath;
      return realPath;
    }
    throw new TypeError(`Not supported file: ${path}`);
  }
  private getParser(mode?: ParserMode): IBookParser {
    if (mode === 'gitbook') {
      return new GitbookParser(this.options);
    }
    return new NotionParser(this.options);
  }

  /**
   * 解析 GitBook 项目
   */
  async parseProject(inputPath: string): Promise<TreeNode> {
    const realPath = await this.getRealPath(inputPath);
    const gitbookParser = this.getParser(this.options.parseMode);
    return await gitbookParser.parse(realPath);
  }
}
