import { describe, expect, test, beforeEach, afterEach } from 'vitest';
import { writeFile, mkdir, rm } from 'fs/promises';
import { join } from 'path';
import { loadConfigFile } from '../src/utils/config';

const TEMP_DIR = join(__dirname, '.tmp-config-test');

beforeEach(async () => {
  await mkdir(TEMP_DIR, { recursive: true });
});

afterEach(async () => {
  await rm(TEMP_DIR, { recursive: true, force: true });
});

describe('loadConfigFile', () => {
  test('应该从指定路径加载 YAML 配置', async () => {
    const configPath = join(TEMP_DIR, 'bookforge.yml');
    await writeFile(
      configPath,
      `input: ./my-docs
output: ./my-output
format: html
mode: notion
title: My Book
author: Test Author
skip:
  - node_modules
  - .git
`,
    );

    const config = await loadConfigFile(configPath);
    expect(config).toEqual({
      input: './my-docs',
      output: './my-output',
      format: 'html',
      mode: 'notion',
      title: 'My Book',
      author: 'Test Author',
      skip: ['node_modules', '.git'],
    });
  });

  test('应该忽略无效的字段值', async () => {
    const configPath = join(TEMP_DIR, 'bad-fields.yml');
    await writeFile(
      configPath,
      `input: ./docs
format: unknown_format
mode: invalid_mode
skip: not-an-array
`,
    );

    const config = await loadConfigFile(configPath);
    expect(config).toEqual({
      input: './docs',
    });
  });

  test('应该支持仅包含部分配置项', async () => {
    const configPath = join(TEMP_DIR, 'partial.yml');
    await writeFile(configPath, 'title: Partial Config\n');

    const config = await loadConfigFile(configPath);
    expect(config).toEqual({ title: 'Partial Config' });
  });

  test('不存在配置文件且未指定路径时应返回 undefined', async () => {
    const originalCwd = process.cwd();
    process.chdir(TEMP_DIR);
    try {
      const config = await loadConfigFile();
      expect(config).toBeUndefined();
    } finally {
      process.chdir(originalCwd);
    }
  });

  test('指定路径的文件不存在时应抛出异常', async () => {
    await expect(loadConfigFile(join(TEMP_DIR, 'nonexistent.yml'))).rejects.toThrow();
  });

  test('配置文件内容无效时应抛出异常', async () => {
    const configPath = join(TEMP_DIR, 'invalid.yml');
    await writeFile(configPath, 'just a string');

    await expect(loadConfigFile(configPath)).rejects.toThrow('Invalid config file');
  });

  test('应该正确解析完整的 giscus 配置', async () => {
    const configPath = join(TEMP_DIR, 'giscus-full.yml');
    await writeFile(
      configPath,
      `giscus:
  repo: "user/repo"
  repoId: "R_12345"
  category: "Announcements"
  categoryId: "DIC_67890"
  mapping: "title"
  theme: "dark"
  lang: "en"
`,
    );

    const config = await loadConfigFile(configPath);
    expect(config).toEqual({
      giscus: {
        repo: 'user/repo',
        repoId: 'R_12345',
        category: 'Announcements',
        categoryId: 'DIC_67890',
        mapping: 'title',
        theme: 'dark',
        lang: 'en',
      },
    });
  });

  test('应该解析仅包含必填字段的 giscus 配置', async () => {
    const configPath = join(TEMP_DIR, 'giscus-minimal.yml');
    await writeFile(
      configPath,
      `giscus:
  repo: "user/repo"
  repoId: "R_12345"
  category: "General"
  categoryId: "DIC_abc"
`,
    );

    const config = await loadConfigFile(configPath);
    expect(config).toEqual({
      giscus: {
        repo: 'user/repo',
        repoId: 'R_12345',
        category: 'General',
        categoryId: 'DIC_abc',
      },
    });
  });

  test('应该忽略缺少必填字段的 giscus 配置', async () => {
    const configPath = join(TEMP_DIR, 'giscus-incomplete.yml');
    await writeFile(
      configPath,
      `title: Test
giscus:
  repo: "user/repo"
`,
    );

    const config = await loadConfigFile(configPath);
    expect(config).toEqual({ title: 'Test' });
    expect(config?.giscus).toBeUndefined();
  });

  test('应该正确解析 navLinks 配置', async () => {
    const configPath = join(TEMP_DIR, 'navlinks.yml');
    await writeFile(
      configPath,
      `navLinks:
  - text: GitHub
    url: https://github.com
  - text: Blog
    url: https://blog.example.com
`,
    );

    const config = await loadConfigFile(configPath);
    expect(config).toEqual({
      navLinks: [
        { text: 'GitHub', url: 'https://github.com' },
        { text: 'Blog', url: 'https://blog.example.com' },
      ],
    });
  });

  test('应该忽略 navLinks 中缺少必填字段的项', async () => {
    const configPath = join(TEMP_DIR, 'navlinks-bad.yml');
    await writeFile(
      configPath,
      `navLinks:
  - text: Valid
    url: https://example.com
  - text: MissingUrl
  - url: https://missing-text.com
`,
    );

    const config = await loadConfigFile(configPath);
    expect(config).toEqual({
      navLinks: [{ text: 'Valid', url: 'https://example.com' }],
    });
  });

  test('navLinks 全部无效时不应设置该字段', async () => {
    const configPath = join(TEMP_DIR, 'navlinks-empty.yml');
    await writeFile(
      configPath,
      `title: Test
navLinks:
  - text: NoUrl
`,
    );

    const config = await loadConfigFile(configPath);
    expect(config).toEqual({ title: 'Test' });
    expect(config?.navLinks).toBeUndefined();
  });

  test('应该自动发现默认配置文件', async () => {
    const configPath = join(TEMP_DIR, 'bookforge.yaml');
    await writeFile(configPath, 'title: Auto Discovered\n');

    const originalCwd = process.cwd();
    process.chdir(TEMP_DIR);
    try {
      const config = await loadConfigFile();
      expect(config).toEqual({ title: 'Auto Discovered' });
    } finally {
      process.chdir(originalCwd);
    }
  });
});
