import { readdir, stat, readFile } from 'fs/promises';
import { join, dirname } from 'path';
import { getNotionDBFile, isExist, isMarkdownFile, isSpecialCVSFile } from '.';
import { type Child, RelationManager } from './relation';
import { parseFile } from '@fast-csv/parse';
export type NotionDBRow = object;
export interface NotionDBRecord extends NotionDBRow {
  relativePath: string;
}
export interface NotionDB {
  filePath: string;
  name: string;
  rows: NotionDBRecord[];
}
export interface MarkdownUtilsOptions {
  ignorePatterns?: string[];
  inputPath: string;
}
export class MarkdownRelationManager {
  private readonly relationManager: RelationManager = new RelationManager();
  private readonly notionDBs: Map<string, NotionDB> = new Map();
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
  public getNotionDB(notionDBFilePath: string): NotionDB | undefined {
    return this.notionDBs.get(notionDBFilePath);
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
        } else if (fileStat.isFile()) {
          if (isMarkdownFile(itemPath)) {
            await this.parseInnerLinks(itemPath);
          } else if (isSpecialCVSFile(itemPath)) {
            const name = await getNotionDBFile(itemPath);
            if (!name) {
              continue;
            }
            await this.parseNotionDBFile(itemPath, name);
          }
        }
      }
    } catch (error) {
      console.warn(`无法读取目录: ${dirPath}`, error);
    }
  }

  private async parseNotionDBFile(notionDBFilePath: string, name: string): Promise<void> {
    const rows: NotionDBRow[] = [];
    await new Promise((resolve, reject) => {
      parseFile(notionDBFilePath, { headers: true })
        .on('data', (row: NotionDBRow) => {
          // const childLink = join(name, row.Name);
          // const childPath = join(dirname(notionDBFilePath), childLink);
          rows.push(row);
          // this.relationManager.addRelation({
          //   parentId: notionDBFilePath,
          //   childId: childPath,
          //   relativePath: childLink,
          // });
        })
        .on('end', () => {
          resolve(undefined);
        })
        .on('error', (error) => {
          reject(error);
        });
    });
    if (rows.length === 0) {
      return;
    }
    const firstRow = rows[0] as Record<string, string>;
    const keys = Object.keys(firstRow);
    const firstKey = keys[0];

    const names = rows.map((row: any) => {
      const rowData = row as Record<string, string>;
      return rowData[firstKey];
    });
    const baseDir = dirname(notionDBFilePath);
    let dbDir = join(baseDir, name);
    const handle = await stat(dbDir);
    const hasDbDir = handle.isDirectory();
    if (!hasDbDir) {
      dbDir = baseDir;
    }
    const files = await readdir(dbDir);
    if (files.length === 0) {
      return;
    }
    const records: NotionDBRecord[] = [];
    files.forEach(file => {
      const path = join(dbDir, file);
      if (!isMarkdownFile(path)) {
        return;
      }
      const dbName = file.split(' ')[0];
      const index = names.indexOf(dbName);
      if (index === -1) {
        return;
      }
      const row = rows[index];
      // const name = (row as any)[firstKey];
      const relativePath = hasDbDir ? join(name, file) : file;
      const childId = path;

      this.relationManager.addRelation({
        parentId: notionDBFilePath,
        childId,
        relativePath,
      });
      records.push({
        ...row,
        relativePath,
      });
    });

    this.notionDBs.set(notionDBFilePath, {
      rows: records,
      name,
      filePath: notionDBFilePath,
    });
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
      const childPath = join(dirname(markdownFilePath), decodeURIComponent(link));
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
