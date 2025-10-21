// 命令行接口
import { Command } from 'commander';
import chalk from 'chalk';
import { GitBookParser } from './core/GitBookParser.js';
import { HtmlGenerator } from './generators/HtmlGenerator.js';
import { PdfGenerator } from './generators/PdfGenerator.js';
import { GitBookConfig } from './types/index.js';

const program = new Command();

program
  .name('gitbook-parser')
  .description('GitBook 解析器 - 将 markdown 文件转换为 HTML 网站或 PDF 文件')
  .version('1.0.0');

program
  .command('html')
  .description('生成 HTML 网站')
  .option('-i, --input <path>', '输入目录路径', './docs')
  .option('-o, --output <path>', '输出目录路径', './dist/html')
  .option('-t, --title <title>', '网站标题', 'GitBook')
  .action(async (options) => {
    try {
      console.log(chalk.blue('🚀 开始生成 HTML 网站...'));
      
      const config: GitBookConfig = {
        input: options.input,
        output: options.output,
        format: 'html',
        title: options.title
      };
      
      await generateHtml(config);
      
      console.log(chalk.green('✅ HTML 网站生成完成!'));
      console.log(chalk.yellow(`📁 输出目录: ${options.output}`));
    } catch (error) {
      console.error(chalk.red('❌ 生成失败:'), error);
      process.exit(1);
    }
  });

program
  .command('pdf')
  .description('生成 PDF 文件')
  .option('-i, --input <path>', '输入目录路径', './docs')
  .option('-o, --output <path>', '输出目录路径', './dist/pdf')
  .option('-t, --title <title>', '文档标题', 'GitBook')
  .action(async (options) => {
    try {
      console.log(chalk.blue('🚀 开始生成 PDF 文件...'));
      
      const config: GitBookConfig = {
        input: options.input,
        output: options.output,
        format: 'pdf',
        title: options.title
      };
      
      await generatePdf(config);
      
      console.log(chalk.green('✅ PDF 文件生成完成!'));
      console.log(chalk.yellow(`📁 输出目录: ${options.output}`));
    } catch (error) {
      console.error(chalk.red('❌ 生成失败:'), error);
      process.exit(1);
    }
  });

program
  .command('all')
  .description('同时生成 HTML 网站和 PDF 文件')
  .option('-i, --input <path>', '输入目录路径', './docs')
  .option('-o, --output <path>', '输出目录路径', './dist')
  .option('-t, --title <title>', '文档标题', 'GitBook')
  .action(async (options) => {
    try {
      console.log(chalk.blue('🚀 开始生成 HTML 网站和 PDF 文件...'));
      
      const htmlConfig: GitBookConfig = {
        input: options.input,
        output: `${options.output}/html`,
        format: 'html',
        title: options.title
      };
      
      const pdfConfig: GitBookConfig = {
        input: options.input,
        output: `${options.output}/pdf`,
        format: 'pdf',
        title: options.title
      };
      
      await Promise.all([
        generateHtml(htmlConfig),
        generatePdf(pdfConfig)
      ]);
      
      console.log(chalk.green('✅ HTML 网站和 PDF 文件生成完成!'));
      console.log(chalk.yellow(`📁 HTML 输出目录: ${htmlConfig.output}`));
      console.log(chalk.yellow(`📁 PDF 输出目录: ${pdfConfig.output}`));
    } catch (error) {
      console.error(chalk.red('❌ 生成失败:'), error);
      process.exit(1);
    }
  });

/**
 * 生成 HTML 网站
 */
async function generateHtml(config: GitBookConfig): Promise<void> {
  const parser = new GitBookParser();
  const tree = await parser.parseProject(config.input);
  
  const generator = new HtmlGenerator(config.output);
  await generator.generate(tree, config.title);
}

/**
 * 生成 PDF 文件
 */
async function generatePdf(config: GitBookConfig): Promise<void> {
  const parser = new GitBookParser();
  const tree = await parser.parseProject(config.input);
  
  const generator = new PdfGenerator(config.output);
  await generator.generate(tree, config.title);
}

// 解析命令行参数
program.parse();
