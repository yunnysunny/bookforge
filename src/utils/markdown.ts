import { readdir, stat, readFile } from 'fs/promises';
import { join, dirname } from 'path';
import { isMarkdownFile } from '.';
import { type Child, RelationManager } from './relation';
export interface MarkdownUtilsOptions {
  ignorePatterns?: string[];
  inputPath: string;
}
export class MarkdownRelationManager {
  private readonly relationManager: RelationManager = new RelationManager();
  public readonly inputPath: string;
  public readonly ignorePatterns?: string[];
  public constructor(options: MarkdownUtilsOptions) {
    this.inputPath = options.inputPath;
    this.ignorePatterns = options.ignorePatterns;
  }
  public async parseRelations(): Promise<string[]> {
    await this.visitAllMarkdownFiles(this.inputPath);
    return this.relationManager.getTopEntities();
  }
  public getChildren(parentId: string): Child[] {
    return this.relationManager.getChildren(parentId);
  }
  /**
   * 获取所有 markdown 文件
   */
  private async visitAllMarkdownFiles(dirPath: string): Promise<void> {
    const ignorePatterns = this.ignorePatterns;
    try {
      const items = await readdir(dirPath);

      for (const item of items) {
        const itemPath = join(dirPath, item);
        const fileStat = await stat(itemPath);

        if (fileStat.isDirectory()) {
          // 跳过忽略的目录
          if (ignorePatterns?.some((pattern) => item.includes(pattern))) {
            continue;
          }
          await this.visitAllMarkdownFiles(itemPath);
        } else if (fileStat.isFile() && isMarkdownFile(item)) {
          await this.parseInnerLinks(itemPath);
        }
      }
    } catch (error) {
      console.warn(`无法读取目录: ${dirPath}`, error);
    }
  }

  /**
   * 解析内部链接
   */
  private async parseInnerLinks(markdownFilePath: string): Promise<void> {
    const content = await readFile(markdownFilePath, 'utf-8');
    const lines = content.split('\n');

    for (const line of lines) {
      const trimmedLine = line.trim();
      const linkMatch = trimmedLine.match(/\[([^\]]+)\]\(([^)]+)\)/);
      if (!linkMatch) {
        continue;
      }
      const _title = linkMatch[1];
      const link = linkMatch[2];

      // 解析链接的 markdown 文件
      const childPath = join(
        dirname(markdownFilePath),
        decodeURIComponent(link),
      );
      if (!isMarkdownFile(childPath)) {
        continue;
      }
      try {
        const fileStat = await stat(childPath);
        if (!fileStat.isFile()) {
          continue;
        }
      } catch (error) {
        console.warn(`无法读取文件: ${childPath}`, error);
        continue;
      }
      this.relationManager.addRelation({
        parentId: markdownFilePath,
        childId: childPath,
        relativePath: link,
      });
    }
  }
}
