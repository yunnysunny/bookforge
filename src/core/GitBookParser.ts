// GitBook 解析器
import { readdirSync, statSync, readFileSync } from 'fs';
import { join, extname, dirname } from 'path';
import { MarkdownFile, TreeNode, ParserOptions } from '../types/index.js';
import { MarkdownParser } from './MarkdownParser.js';
import { isMarkdownFile, normalizePath } from '../utils/index.js';

export class GitBookParser {
  private markdownParser: MarkdownParser;
  private options: ParserOptions;

  constructor(options: ParserOptions = {}) {
    this.markdownParser = new MarkdownParser();
    this.options = {
      encoding: 'utf-8',
      ignorePatterns: ['node_modules', '.git', 'dist', 'build'],
      ...options
    };
  }

  /**
   * 解析 GitBook 项目
   */
  async parseProject(inputPath: string): Promise<TreeNode> {
    const rootNode: TreeNode = {
      title: 'Root',
      children: []
    };

    // 查找入口文件
    const entryFile = this.findEntryFile(inputPath);
    if (entryFile) {
      await this.parseEntryFile(entryFile, rootNode);
    } else {
      // 如果没有找到入口文件，扫描所有 markdown 文件
      await this.scanMarkdownFiles(inputPath, rootNode);
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
  private async parseEntryFile(entryFilePath: string, rootNode: TreeNode): Promise<void> {
    const content = readFileSync(entryFilePath, { encoding: this.options.encoding as BufferEncoding });
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
              children: []
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
    const files = this.getMarkdownFiles(inputPath);
    
    for (const filePath of files) {
      const markdownFile = await this.parseMarkdownFile(filePath);
      if (markdownFile) {
        const node: TreeNode = {
          title: markdownFile.title,
          path: markdownFile.path,
          content: markdownFile.content,
          headings: markdownFile.headings,
          children: []
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
          if (this.options.ignorePatterns?.some(pattern => item.includes(pattern))) {
            continue;
          }
          files.push(...this.getMarkdownFiles(itemPath));
        } else if (stat.isFile() && isMarkdownFile(item)) {
          files.push(itemPath);
        }
      }
    } catch (error) {
      console.warn(`无法读取目录: ${dirPath}`);
    }
    
    return files;
  }

  /**
   * 解析单个 markdown 文件
   */
  private async parseMarkdownFile(filePath: string): Promise<MarkdownFile | null> {
    try {
      return this.markdownParser.parseFile(filePath);
    } catch (error) {
      console.warn(`解析文件失败: ${filePath}`, error);
      return null;
    }
  }
}
