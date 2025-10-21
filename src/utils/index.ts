// 工具函数
import { readFileSync, existsSync } from 'fs';
import { join, extname, basename } from 'path';

/**
 * 读取文件内容
 */
export function readFile(filePath: string, encoding: BufferEncoding = 'utf-8'): string {
  if (!existsSync(filePath)) {
    throw new Error(`文件不存在: ${filePath}`);
  }
  return readFileSync(filePath, encoding);
}

/**
 * 检查文件是否为 markdown 文件
 */
export function isMarkdownFile(filePath: string): boolean {
  const ext = extname(filePath).toLowerCase();
  return ext === '.md' || ext === '.markdown';
}

/**
 * 生成标题 ID（用于锚点）
 */
export function generateHeadingId(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '') // 移除特殊字符
    .replace(/\s+/g, '-') // 空格替换为连字符
    .replace(/-+/g, '-') // 多个连字符合并为一个
    .trim();
}

/**
 * 获取文件名（不含扩展名）
 */
export function getFileName(filePath: string): string {
  return basename(filePath, extname(filePath));
}

/**
 * 规范化路径
 */
export function normalizePath(path: string): string {
  return path.replace(/\\/g, '/');
}
