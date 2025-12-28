import { stat } from 'fs/promises';
import type { MarkdownFile, ParserOptions, TreeNode } from '../../types';
import { createTempDir, isZipFile, unzipFile } from '../../utils';
import { MarkdownParser } from '../MarkdownParser';
import type { IBookParser } from './interfaces';

export abstract class AbstractParser implements IBookParser {
  protected options: ParserOptions;
  protected markdownParser: MarkdownParser;
  private _realPath?: string;
  constructor(options: ParserOptions) {
    this.options = options;
    this.markdownParser = new MarkdownParser();
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
  protected abstract doParse(input: string): Promise<TreeNode>;
  public abstract getFileName(node: TreeNode): string;

  public async parse(input: string): Promise<TreeNode> {
    const realPath = await this.getRealPath(input);
    return await this.doParse(realPath);
  }
  /**
   * 解析单个 markdown 文件
   */
  protected async parseMarkdownFile(
    filePath: string,
  ): Promise<MarkdownFile | null> {
    try {
      return await this.markdownParser.parseFile(filePath);
    } catch (error) {
      console.warn(`解析文件失败: ${filePath}`, error);
      return null;
    }
  }
  protected async markdownFileToTreeNode(
    filePath: string,
  ): Promise<TreeNode | null> {
    const markdownFile = await this.parseMarkdownFile(filePath);
    if (!markdownFile) {
      return null;
    }
    return {
      title: markdownFile.title,
      path: markdownFile.path,
      content: markdownFile.content,
      headings: markdownFile.headings,
      children: [],
    };
  }
  public async toHtml(node: TreeNode): Promise<string> {
    return await this.markdownParser.toHtml(node.content as string, {
      contentPath: node.path as string,
      destDir: this.options.outputDir,
    });
  }
}
