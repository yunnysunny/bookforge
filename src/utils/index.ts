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

export { loadConfigFile } from './config';

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

/**
 * 判断链接是否指向外部资源（带协议或协议相对），这类链接不需要改写或复制文件
 * 例如 https://、mailto:、tel:、data:、//cdn.example.com
 */
export function isExternalHref(href: string): boolean {
  return href.startsWith('//') || /^[a-z][a-z\d+.-]*:/i.test(href);
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
 * GitHub 生成锚点时会移除的标点（与 github-slugger 保持一致，只保留 BMP 中与标点相关的区间）：
 * ASCII 标点、Latin-1 符号、常用标点，以及中日韩标点和全角标点。
 * 汉字、假名、全角字母数字、下划线、连字符都会保留。
 * 参考 https://github.com/Flet/github-slugger/blob/main/regex.js
 */
const GITHUB_PUNCTUATION_REGEX = new RegExp(
  '['
    + '\\0-\\x1F' // 控制字符
    + '!-,./' // ! " # $ % & ' ( ) * + , . /
    + ':-@' // : ; < = > ? @
    + '\\[-\\^' // [ \ ] ^
    + '`'
    + '{-\\xA9' // { | } ~ 及向后兼容区符号
    + '\\xAB-\\xB4\\xB6-\\xB9\\xBB-\\xBF\\xD7\\xF7'
    + '\\u2000-\\u206F' // 破折号、省略号、全角前后引号等
    + '\\u2E00-\\u2E2E\\u2E30-\\u3004' // 补充标点、顿号 、、句号 。
    + '\\u3008-\\u3020\\u3030\\u3036\\u3037\\u303D-\\u3040' // 《》「」『』【】〔〕等
    + '\\u3097\\u3098\\u309B\\u309C\\u30A0\\u30FB' // ゛゜・等
    + '\\u3200-\\u33FF\\u4DC0-\\u4DFF\\u9FFD-\\u9FFF'
    + '\\uFE10-\\uFE1F\\uFE30-\\uFE32\\uFE35-\\uFE4C\\uFE50-\\uFE6F\\uFE75'
    + '\\uFEFD-\\uFF0F\\uFF1A-\\uFF20\\uFF3B-\\uFF3E\\uFF40\\uFF5B-\\uFF65' // ！？（）：；、等全角标点
    + ']',
  'g',
);

/**
 * 生成标题 ID（用于锚点），规则与 GitHub 一致：
 * 转小写，去掉标点（包括中文标点）和 HTML 标签，空白替换为 -。
 */
export function generateIdFromText(text: string): string {
  let slug = text
    .toLowerCase()
    .trim()
    .replace(/<[!/a-z].*?>/gi, '') // 移除 HTML 标签
    .replace(GITHUB_PUNCTUATION_REGEX, '')
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
