// GitBook 解析器
import { readdirSync, statSync } from 'fs';
import { stat } from 'fs/promises';
import { dirname, join } from 'path';
import type { MarkdownFile, ParserOptions, TreeNode } from '../types';
import { createTempDir, isMarkdownFile, isZipFile, readFile, unzipFile } from '../utils';
import { MarkdownParser } from './MarkdownParser';

export class GitBookParser {
  private markdownParser: MarkdownParser;
  private options: ParserOptions;
  private _realPath?: string;

  constructor(options: ParserOptions = {}) {
    this.markdownParser = new MarkdownParser();
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

  /**
   * 解析 GitBook 项目
   */
  async parseProject(inputPath: string): Promise<TreeNode> {
    const realPath = await this.getRealPath(inputPath);
    const rootNode: TreeNode = {
      title: 'Root',
      children: [],
    };

    // 查找入口文件
    const entryFile = this.findEntryFile(realPath);
    if (entryFile) {
      await this.parseEntryFile(entryFile, rootNode);
    } else {
      // 如果没有找到入口文件，扫描所有 markdown 文件
      await this.scanMarkdownFiles(realPath, rootNode);
    }

    return rootNode;
  }

  /**
   * 查找入口文件（README.md, SUMMARY.md, index.md）
   */
  private findEntryFile(inputPath: string): string | null {
    const entryFiles = ['README.md', 'SUMMARY.md', 'index.md'];

    for (const fileName of entryFiles) {
      const filePath = join(inputPath, fileName);
      try {
        if (statSync(filePath).isFile()) {
          return filePath;
        }
      } catch (error) {
        // 文件不存在，继续查找
      }
    }

    return null;
  }

  /**
   * 解析入口文件
   */
  private async parseEntryFile(
    entryFilePath: string,
    rootNode: TreeNode,
  ): Promise<void> {
    const content = await readFile(
      entryFilePath,
      this.options.encoding as BufferEncoding,
    );
    const lines = content.split('\n');

    for (const line of lines) {
      const trimmedLine = line.trim();
      if (trimmedLine.startsWith('*') || trimmedLine.startsWith('-')) {
        const linkMatch = trimmedLine.match(/\[([^\]]+)\]\(([^)]+)\)/);
        if (linkMatch) {
          const title = linkMatch[1];
          const link = linkMatch[2];

          // 解析链接的 markdown 文件
          const fullPath = join(dirname(entryFilePath), link);
          const markdownFile = await this.parseMarkdownFile(fullPath);
          if (markdownFile) {
            const node: TreeNode = {
              title: markdownFile.title,
              path: markdownFile.path,
              content: markdownFile.content,
              headings: markdownFile.headings,
              children: [],
            };
            rootNode.children.push(node);
          }
        }
      }
    }
  }

  /**
   * 扫描所有 markdown 文件
   */
  private async scanMarkdownFiles(
    inputPath: string,
    rootNode: TreeNode,
  ): Promise<void> {
    const files = this.getMarkdownFiles(inputPath);

    for (const filePath of files) {
      const markdownFile = await this.parseMarkdownFile(filePath);
      if (markdownFile) {
        const node: TreeNode = {
          title: markdownFile.title,
          path: markdownFile.path,
          content: markdownFile.content,
          headings: markdownFile.headings,
          children: [],
        };
        rootNode.children.push(node);
      }
    }
  }

  /**
   * 获取所有 markdown 文件
   */
  private getMarkdownFiles(dirPath: string): string[] {
    const files: string[] = [];

    try {
      const items = readdirSync(dirPath);

      for (const item of items) {
        const itemPath = join(dirPath, item);
        const stat = statSync(itemPath);

        if (stat.isDirectory()) {
          // 跳过忽略的目录
          if (
            this.options.ignorePatterns?.some((pattern) =>
              item.includes(pattern),
            )
          ) {
            continue;
          }
          files.push(...this.getMarkdownFiles(itemPath));
        } else if (stat.isFile() && isMarkdownFile(item)) {
          files.push(itemPath);
        }
      }
    } catch (error) {
      console.warn(`无法读取目录: ${dirPath}`, error);
    }

    return files;
  }

  /**
   * 解析单个 markdown 文件
   */
  private async parseMarkdownFile(
    filePath: string,
  ): Promise<MarkdownFile | null> {
    try {
      return await this.markdownParser.parseFile(filePath);
    } catch (error) {
      console.warn(`解析文件失败: ${filePath}`, error);
      return null;
    }
  }
}
