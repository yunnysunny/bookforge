#!/usr/bin/env node
// 命令行接口

import chalk from 'chalk';
import { Command } from 'commander';
import { resolve } from 'node:path';
import { HtmlGenerator } from './generators/html.generator.js';
import { PdfGenerator } from './generators/pdf.generator.js';
import type { BookForgeConfig } from './types/index.js';
import { loadConfigFile } from './utils/config.js';

const program = new Command();
const currentWorkingDir = process.cwd();
program
  .name('BookForge')
  .description('BookForge - 将 markdown 文件转换为 HTML 网站或 PDF 文件')
  .version('1.0.0');

const addCommonOpts = (cmd: Command, outputDefault: string) =>
  cmd
    .option('-i, --input <path>', '输入目录路径', './docs')
    .option('-o, --output <path>', '输出目录路径', outputDefault)
    .option('-m, --mode [mode]', '解析模式(gitbook, notion)', 'gitbook')
    .option('-s, --skip [skip]', '忽略的目录')
    .option('-t, --title <title>', '文档标题', 'BookForge')
    .option('-c, --config <path>', '配置文件路径(默认自动查找 bookforge.yml)');

/**
 * 取值优先级：命令行显式传入 > 配置文件 > 选项默认值
 */
function pick<T>(cmd: Command, name: string, cliValue: T, fileValue: T | undefined): T {
  if (cmd.getOptionValueSource(name) === 'cli' || fileValue === undefined) {
    return cliValue;
  }
  return fileValue;
}

type ResolvedOptions = Omit<BookForgeConfig, 'format'>;

/**
 * 合并配置文件与命令行参数
 */
async function resolveOptions(
  options: Record<string, string | undefined>,
  cmd: Command,
): Promise<ResolvedOptions> {
  const fromFile = (await loadConfigFile(options.config)) || {};

  return {
    input: pick(cmd, 'input', options.input as string, fromFile.input),
    output: pick(cmd, 'output', options.output as string, fromFile.output),
    mode: pick(cmd, 'mode', options.mode as BookForgeConfig['mode'], fromFile.mode),
    skip: pick(cmd, 'skip', options.skip?.split(','), fromFile.skip),
    title: pick(cmd, 'title', options.title as string, fromFile.title),
    author: fromFile.author,
    giscus: fromFile.giscus,
    navLinks: fromFile.navLinks,
  };
}

addCommonOpts(program.command('html'), './dist/html')
  .description('生成 HTML 网站')
  .action(async (options, cmd) => {
    try {
      const resolved = await resolveOptions(options, cmd);
      await generateHtml({ ...resolved, format: 'html' });
    } catch (error) {
      console.error(chalk.red('❌ 生成失败:'), error);
      process.exit(1);
    }
  });

addCommonOpts(program.command('pdf'), './dist/pdf')
  .description('生成 PDF 文件')
  .action(async (options, cmd) => {
    try {
      const resolved = await resolveOptions(options, cmd);
      await generatePdf({ ...resolved, format: 'pdf' });
    } catch (error) {
      console.error(chalk.red('❌ 生成失败:'), error);
      process.exit(1);
    }
  });

addCommonOpts(program.command('all'), './dist')
  .description('同时生成 HTML 网站和 PDF 文件')
  .action(async (options, cmd) => {
    try {
      const resolved = await resolveOptions(options, cmd);
      const htmlConfig: BookForgeConfig = {
        ...resolved,
        output: `${resolved.output}/html`,
        format: 'html',
      };

      const pdfConfig: BookForgeConfig = {
        ...resolved,
        output: `${resolved.output}/pdf`,
        format: 'pdf',
      };

      await Promise.all([generateHtml(htmlConfig), generatePdf(pdfConfig)]);
    } catch (error) {
      console.error(chalk.red('❌ 生成失败:'), error);
      process.exit(1);
    }
  });
function decorateConfig(config: BookForgeConfig): BookForgeConfig {
  return {
    ...config,
    input: resolve(currentWorkingDir, config.input),
    output: resolve(currentWorkingDir, config.output),
  };
}
/**
 * 生成 HTML 网站
 */
async function generateHtml(config: BookForgeConfig): Promise<void> {
  console.log(chalk.blue('🚀 开始生成 HTML 网站...'), config);
  const generator = new HtmlGenerator(decorateConfig(config));
  await generator.generate();
  console.log(chalk.green('✅ HTML 网站生成完成!'));
  console.log(chalk.yellow(`📁 输出目录: ${config.output}`));
}

/**
 * 生成 PDF 文件
 */
async function generatePdf(config: BookForgeConfig): Promise<void> {
  console.log(chalk.blue('🚀 开始生成 PDF 文件...'), config);
  const generator = new PdfGenerator(decorateConfig(config));
  await generator.generate();
  console.log(chalk.green('✅ PDF 文件生成完成!'));
  console.log(chalk.yellow(`📁 输出目录: ${config.output}`));
}

// 解析命令行参数
program.parse();
