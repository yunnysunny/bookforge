import { readFile as fsReadFile, stat } from 'fs/promises';
import { resolve } from 'path';
import { parse as parseYaml } from 'yaml';
import type { BookForgeConfig, GiscusConfig, NavLink } from '../types';

const DEFAULT_CONFIG_FILES = [
  'bookforge.yml',
  'bookforge.yaml',
  '.bookforge.yml',
  '.bookforge.yaml',
];

/**
 * 从 YAML 文件加载配置，返回 Partial<BookForgeConfig>，
 * 未指定的字段由调用方填充默认值。
 */
export async function loadConfigFile(
  configPath?: string,
): Promise<Partial<BookForgeConfig> | undefined> {
  const cwd = process.cwd();

  if (configPath) {
    const absPath = resolve(cwd, configPath);
    return await readAndParseYaml(absPath);
  }

  for (const file of DEFAULT_CONFIG_FILES) {
    const configFile = resolve(cwd, file);
    try {
      const info = await stat(configFile);
      if (!info.isFile()) {
        continue;
      }
    } catch {
      continue;
    }

    return await readAndParseYaml(resolve(cwd, file));
  }

  return undefined;
}

async function readAndParseYaml(absPath: string): Promise<Partial<BookForgeConfig>> {
  const content = await fsReadFile(absPath, 'utf-8');
  const data = parseYaml(content);
  if (data == null || typeof data !== 'object') {
    throw new TypeError(`Invalid config file: ${absPath}`);
  }
  return validateConfig(data);
}

const VALID_FORMATS = new Set(['html', 'pdf']);
const VALID_MODES = new Set(['gitbook', 'notion']);

function validateConfig(raw: Record<string, unknown>): Partial<BookForgeConfig> {
  const config: Partial<BookForgeConfig> = {};

  if (typeof raw.input === 'string') config.input = raw.input;
  if (typeof raw.output === 'string') config.output = raw.output;
  if (typeof raw.title === 'string') config.title = raw.title;
  if (typeof raw.author === 'string') config.author = raw.author;

  if (typeof raw.format === 'string' && VALID_FORMATS.has(raw.format)) {
    config.format = raw.format as BookForgeConfig['format'];
  }

  if (typeof raw.mode === 'string' && VALID_MODES.has(raw.mode)) {
    config.mode = raw.mode as BookForgeConfig['mode'];
  }

  if (Array.isArray(raw.skip)) {
    config.skip = raw.skip.filter((item): item is string => typeof item === 'string');
  }

  if (raw.giscus != null && typeof raw.giscus === 'object') {
    const g = raw.giscus as Record<string, unknown>;
    if (
      typeof g.repo === 'string'
      && typeof g.repoId === 'string'
      && typeof g.category === 'string'
      && typeof g.categoryId === 'string'
    ) {
      const giscus: GiscusConfig = {
        repo: g.repo,
        repoId: g.repoId,
        category: g.category,
        categoryId: g.categoryId,
      };
      if (typeof g.mapping === 'string') giscus.mapping = g.mapping;
      if (typeof g.theme === 'string') giscus.theme = g.theme;
      if (typeof g.lang === 'string') giscus.lang = g.lang;
      config.giscus = giscus;
    }
  }

  if (Array.isArray(raw.navLinks)) {
    const links: NavLink[] = [];
    for (const item of raw.navLinks) {
      if (
        item != null
        && typeof item === 'object'
        && typeof (item as Record<string, unknown>).text === 'string'
        && typeof (item as Record<string, unknown>).url === 'string'
      ) {
        links.push({
          text: (item as Record<string, unknown>).text as string,
          url: (item as Record<string, unknown>).url as string,
        });
      }
    }
    if (links.length > 0) {
      config.navLinks = links;
    }
  }

  return config;
}
