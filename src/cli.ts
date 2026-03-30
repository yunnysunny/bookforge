#!/usr/bin/env node
// 命令行接口

import chalk from 'chalk';
import { Command } from 'commander';
import { join } from 'node:path';
import { HtmlGenerator } from './generators/html.generator.js';
import { PdfGenerator } from './generators/pdf.generator.js';
import type { BookForgeConfig, EmbeddingConfig } from './types/index.js';

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
    .option('-t, --title <title>', '文档标题', 'BookForge');

const addEmbeddingOpts = (cmd: Command) =>
  cmd
    .option('--embedding', '开启 embedding 生成')
    .option('--embedding-model <model>', 'ONNX embedding 模型', 'Xenova/all-MiniLM-L6-v2')
    .option('--embedding-output <file>', 'embedding 输出文件名', 'embedding-index.json')
    .option('--embedding-batch-size <size>', 'embedding 批大小', '8');

function createEmbeddingConfig(options: Record<string, unknown>): EmbeddingConfig | undefined {
  if (!options.embedding) {
    return undefined;
  }

  const batchSizeRaw = Number(options.embeddingBatchSize);
  const batchSize = Number.isFinite(batchSizeRaw) && batchSizeRaw > 0 ? batchSizeRaw : 8;

  return {
    enabled: true,
    provider: 'onnx',
    model: String(options.embeddingModel || 'Xenova/all-MiniLM-L6-v2'),
    output: String(options.embeddingOutput || 'embedding-index.json'),
    batchSize,
  };
}

addEmbeddingOpts(addCommonOpts(program.command('html'), './dist/html'))
  .description('生成 HTML 网站')
  .action(async (options) => {
    try {
      const config: BookForgeConfig = {
        input: options.input,
        mode: options.mode,
        skip: options.skip?.split(','),
        output: options.output,
        format: 'html',
        title: options.title,
        embedding: createEmbeddingConfig(options),
      };
      await generateHtml(config);
    } catch (error) {
      console.error(chalk.red('❌ 生成失败:'), error);
      process.exit(1);
    }
  });

addCommonOpts(program.command('pdf'), './dist/pdf')
  .description('生成 PDF 文件')
  .action(async (options) => {
    try {
      const config: BookForgeConfig = {
        input: options.input,
        mode: options.mode,
        skip: options.skip?.split(','),
        output: options.output,
        format: 'pdf',
        title: options.title,
      };
      await generatePdf(config);
    } catch (error) {
      console.error(chalk.red('❌ 生成失败:'), error);
      process.exit(1);
    }
  });

addEmbeddingOpts(addCommonOpts(program.command('all'), './dist'))
  .description('同时生成 HTML 网站和 PDF 文件')
  .action(async (options) => {
    try {
      const htmlConfig: BookForgeConfig = {
        input: options.input,
        mode: options.mode,
        skip: options.skip?.split(','),
        output: `${options.output}/html`,
        format: 'html',
        title: options.title,
        embedding: createEmbeddingConfig(options),
      };

      const pdfConfig: BookForgeConfig = {
        input: options.input,
        mode: options.mode,
        skip: options.skip?.split(','),
        output: `${options.output}/pdf`,
        format: 'pdf',
        title: options.title,
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
    input: join(currentWorkingDir, config.input),
    output: join(currentWorkingDir, config.output),
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
