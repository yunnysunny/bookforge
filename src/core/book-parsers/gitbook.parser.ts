import { dirname, join, extname, basename } from 'path';
import type { TreeNode } from '../../types';
import { readdir, stat } from 'fs/promises';
import { isMarkdownFile, readFile } from '../../utils';
import { AbstractParser } from './abstract.parser';

export class GitbookParser extends AbstractParser {
  async doParse(input: string): Promise<TreeNode> {
    const rootNode: TreeNode = {
      title: 'Root',
      children: [],
    };
    // 查找入口文件
    const entryFile = await this.findEntryFile(input);
    if (entryFile) {
      await this.parseEntryFile(entryFile, rootNode);
    } else {
      // 如果没有找到入口文件，扫描所有 markdown 文件
      await this.scanMarkdownFiles(input, rootNode);
    }

    return rootNode;
  }

  /**
   * 查找入口文件（README.md, SUMMARY.md, index.md）
   */
  private async findEntryFile(inputPath: string): Promise<string | null> {
    const entryFiles = ['README.md', 'SUMMARY.md', 'index.md'];

    for (const fileName of entryFiles) {
      const filePath = join(inputPath, fileName);
      try {
        if ((await stat(filePath)).isFile()) {
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
  private async parseEntryFile(entryFilePath: string, rootNode: TreeNode): Promise<void> {
    const content = await readFile(entryFilePath, 'utf-8');
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
  private async scanMarkdownFiles(inputPath: string, rootNode: TreeNode): Promise<void> {
    const files = await this.getMarkdownFiles(inputPath);

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
  private async getMarkdownFiles(dirPath: string): Promise<string[]> {
    const files: string[] = [];

    try {
      const items = await readdir(dirPath);

      for (const item of items) {
        const itemPath = join(dirPath, item);
        const fileStat = await stat(itemPath);

        if (fileStat.isDirectory()) {
          // 跳过忽略的目录
          if (this.options.ignorePatterns?.some((pattern) => item.includes(pattern))) {
            continue;
          }
          files.push(...(await this.getMarkdownFiles(itemPath)));
        } else if (fileStat.isFile() && isMarkdownFile(item)) {
          files.push(itemPath);
        }
      }
    } catch (error) {
      console.warn(`无法读取目录: ${dirPath}`, error);
    }

    return files;
  }
  /**
   * 获取文件名
   */
  public getFileName(node: TreeNode): string {
    return basename(node.path as string, extname(node.path as string));
  }
}
