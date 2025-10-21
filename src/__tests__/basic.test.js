// 基本测试
const fs = require('fs');
const path = require('path');

// 简单的工具函数测试
function isMarkdownFile(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  return ext === '.md' || ext === '.markdown';
}

function generateHeadingId(text) {
  return text
    .toLowerCase()
    .replace(/[^\w\s\u4e00-\u9fff-]/g, '') // 保留中文字符
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

describe('基本功能测试', () => {
  test('应该识别 markdown 文件', () => {
    expect(isMarkdownFile('test.md')).toBe(true);
    expect(isMarkdownFile('test.markdown')).toBe(true);
    expect(isMarkdownFile('test.txt')).toBe(false);
  });

  test('应该生成正确的标题 ID', () => {
    expect(generateHeadingId('Hello World')).toBe('hello-world');
    expect(generateHeadingId('测试标题')).toBe('测试标题');
    expect(generateHeadingId('Special & Characters!')).toBe('special-characters');
  });

  test('应该处理空字符串', () => {
    expect(generateHeadingId('')).toBe('');
  });

  test('应该处理特殊字符', () => {
    expect(generateHeadingId('Hello, World!')).toBe('hello-world');
    expect(generateHeadingId('Test & Example')).toBe('test-example');
    expect(generateHeadingId('Multiple   Spaces')).toBe('multiple-spaces');
  });
});
