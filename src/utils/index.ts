// 工具函数

import { access, constants, readFile as fsReadFile, mkdir } from 'fs/promises';
import { basename, extname } from 'path';

export async function mkdirAsync(path: string): Promise<string | undefined> {
  return await mkdir(path, { recursive: true });
}
/**
 * 读取文件内容
 */
export async function readFile(
  filePath: string,
  encoding: BufferEncoding = 'utf-8',
): Promise<string> {
  await access(filePath, constants.F_OK);
  return await fsReadFile(filePath, encoding);
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
export function generateIdFromText(text: string): string {
  let slug = text
    .toLowerCase()
    .trim()
    .replace(/<[!/a-z].*?>/gi, '') // 移除 HTML 标签
    .replace(
      /[\u2000-\u206F\u2E00-\u2E7F\\\\'!"#$%&()*+,./:;<=>?@[\\\]^`{|}~]/g,
      '',
    )
    .replace(/\s+/g, '-'); // 空白替换为 -

  // 去掉前后 -
  slug = slug.replace(/^-+|-+$/g, '');
  return slug;
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
