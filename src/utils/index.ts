// 工具函数

import {
  access,
  constants,
  readFile as fsReadFile,
  mkdir,
  mkdtemp,
  unlink,
  readdir,
  stat,
} from 'fs/promises';
import { basename, extname, join } from 'path';
import os from 'os';
import unzipper from 'unzipper';
const NOTION_DB_FILENAME_SUFFIX = '_all.csv';

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

export function isSpecialCVSFile(filePath: string): boolean {
  return filePath.endsWith(NOTION_DB_FILENAME_SUFFIX);
}

export async function getNotionDBFile(filePath: string): Promise<string | undefined> {
  const name = basename(filePath);
  const dbName = name.split(' ')[0];
  return dbName;
  // try {
  //   const stats = await stat(join(basename(filePath), folder));
  //   if (stats.isDirectory()) {
  //     return name;
  //   }
  //   return;
  // } catch (error) {
  //   return;
  // }
}

export function isZipFile(filePath: string): boolean {
  const ext = extname(filePath).toLowerCase();
  return ext === '.zip';
}

/**
 * 生成标题 ID（用于锚点）
 */
export function generateIdFromText(text: string): string {
  let slug = text
    .toLowerCase()
    .trim()
    .replace(/<[!/a-z].*?>/gi, '') // 移除 HTML 标签
    .replace(/[\u2000-\u206F\u2E00-\u2E7F\\\\'!"#$%&()*+,./:;<=>?@[\\\]^`{|}~]/g, '')
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
export async function createTempDir(dirnamePrefix: string = 'bookforge-'): Promise<string> {
  const tempDir = await mkdtemp(join(os.tmpdir(), dirnamePrefix));
  return tempDir;
}
export async function removeDir(dir: string): Promise<void> {
  await unlink(dir);
}

export async function unzipFile(zipPath: string, destDir: string): Promise<void> {
  const directory = await unzipper.Open.file(zipPath);
  await directory.extract({ path: destDir });
  const files = await readdir(destDir);
  if (files.length === 0) {
    throw new TypeError(`Empty zip file: ${zipPath}`);
  }
  if (files.length === 1 && isZipFile(files[0])) {
    return await unzipFile(join(destDir, files[0]), destDir);
  }
}

export async function isExist(path: string): Promise<boolean> {
  try {
    await access(path, constants.F_OK);
    return true;
  } catch (error) {
    return false;
  }
}
