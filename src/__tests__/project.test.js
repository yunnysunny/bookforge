// 编译后代码的测试
const fs = require('fs');
const path = require('path');

// 测试编译后的工具函数
describe('编译后代码测试', () => {
  test('应该能够读取工具函数', () => {
    const utilsPath = path.join(__dirname, '../../dist/utils/index.js');
    expect(fs.existsSync(utilsPath)).toBe(true);
  });

  test('应该能够读取核心模块', () => {
    const corePath = path.join(__dirname, '../../dist/core/MarkdownParser.js');
    expect(fs.existsSync(corePath)).toBe(true);
  });

  test('应该能够读取生成器模块', () => {
    const htmlGenPath = path.join(__dirname, '../../dist/generators/HtmlGenerator.js');
    const pdfGenPath = path.join(__dirname, '../../dist/generators/PdfGenerator.js');
    expect(fs.existsSync(htmlGenPath)).toBe(true);
    expect(fs.existsSync(pdfGenPath)).toBe(true);
  });

  test('应该能够读取 CLI 模块', () => {
    const cliPath = path.join(__dirname, '../../dist/cli.js');
    expect(fs.existsSync(cliPath)).toBe(true);
  });

  test('应该能够读取主入口文件', () => {
    const indexPath = path.join(__dirname, '../../dist/index.js');
    expect(fs.existsSync(indexPath)).toBe(true);
  });
});

// 测试示例文档
describe('示例文档测试', () => {
  test('应该存在示例文档', () => {
    const docsPath = path.join(__dirname, '../../docs');
    expect(fs.existsSync(docsPath)).toBe(true);
  });

  test('应该存在 README.md', () => {
    const readmePath = path.join(__dirname, '../../docs/README.md');
    expect(fs.existsSync(readmePath)).toBe(true);
  });

  test('应该存在 SUMMARY.md', () => {
    const summaryPath = path.join(__dirname, '../../docs/SUMMARY.md');
    expect(fs.existsSync(summaryPath)).toBe(true);
  });

  test('应该存在所有文档文件', () => {
    const docsDir = path.join(__dirname, '../../docs');
    const files = fs.readdirSync(docsDir);
    const expectedFiles = ['README.md', 'SUMMARY.md', 'introduction.md', 'getting-started.md', 'api-reference.md', 'examples.md'];
    
    expectedFiles.forEach(file => {
      expect(files).toContain(file);
    });
  });
});

// 测试项目结构
describe('项目结构测试', () => {
  test('应该存在 src 目录', () => {
    const srcPath = path.join(__dirname, '../../src');
    expect(fs.existsSync(srcPath)).toBe(true);
  });

  test('应该存在 dist 目录', () => {
    const distPath = path.join(__dirname, '../../dist');
    expect(fs.existsSync(distPath)).toBe(true);
  });

  test('应该存在 package.json', () => {
    const packagePath = path.join(__dirname, '../../package.json');
    expect(fs.existsSync(packagePath)).toBe(true);
  });

  test('应该存在 tsconfig.json', () => {
    const tsconfigPath = path.join(__dirname, '../../tsconfig.json');
    expect(fs.existsSync(tsconfigPath)).toBe(true);
  });
});
