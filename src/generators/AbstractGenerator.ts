import { existsSync, mkdirSync } from 'fs';
import { Slogger } from 'node-slogger';
import { join } from 'path';
// import { fileURLToPath } from 'url';
// import { MarkdownParser } from '../core/MarkdownParser';
import type { GitBookConfig, TreeNode } from '../types';
import { Tpl } from '../utils/tpl';
import type { IBookParser } from '../core/book-parsers/interfaces';
import { getInstance } from '../core/book-parsers/BookParser';

// const __filename = fileURLToPath(import.meta.url);
// const __dirname = dirname(__filename);

export abstract class AbstractGenerator {
  protected outputDir: string;
  protected input: string;
  protected name: string = '';
  protected logger: Slogger;
  protected bookParser: IBookParser;
  protected title = 'BookForge';
  constructor(config: GitBookConfig) {
    this.outputDir = config.output;
    this.input = config.input;
    this.title = config.title || this.title;
    this.bookParser = getInstance({
      parseMode: config.mode,
      ignorePatterns: config.skip,
      outputDir: this.outputDir,
    });
    this.logger = new Slogger();
  }
  protected abstract doGenerate(tree: TreeNode, title: string): Promise<void>;
  protected async render(filename: string, data: any): Promise<string> {
    return await Tpl.renderFileAsync(
      join(__dirname, 'tpls', this.name, filename),
      data,
    );
  }

  public async generate(): Promise<void> {
    // 确保输出目录存在
    if (!existsSync(this.outputDir)) {
      mkdirSync(this.outputDir, { recursive: true });
    }
    const tree = await this.bookParser.parse(this.input);
    await this.doGenerate(tree, this.title);
  }
  /**
   * 获取文件名
   */
  protected getFileName(node: TreeNode): string {
    return this.bookParser.getFileName(node);
  }
}
