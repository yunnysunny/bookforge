import type { MarkdownFile, ParserOptions, TreeNode } from '../../types';
import { MarkdownParser } from '../MarkdownParser';
import type { IBookParser } from './interfaces';

export abstract class AbstractParser implements IBookParser {
  protected options: ParserOptions;
  protected markdownParser: MarkdownParser;
  constructor(options: ParserOptions) {
    this.options = options;
    this.markdownParser = new MarkdownParser();
  }
  abstract parse(input: string): Promise<TreeNode>;
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
  protected async markdownFileToTreeNode(filePath: string,): Promise<TreeNode | null> {
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
}
