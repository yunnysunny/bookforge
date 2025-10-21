// 工具函数测试
const { 
  readFile, 
  isMarkdownFile, 
  generateHeadingId, 
  getFileName, 
  normalizePath 
} = require('../utils/index.js');

// 模拟 fs 模块
const { readFileSync, existsSync } = require('fs');
jest.mock('fs');

describe('工具函数测试', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('readFile', () => {
    it('应该成功读取存在的文件', () => {
      const mockContent = '# 测试标题\n\n这是测试内容。';
      (existsSync as jest.Mock).mockReturnValue(true);
      (readFileSync as jest.Mock).mockReturnValue(mockContent);

      const result = readFile('test.md');
      
      expect(result).toBe(mockContent);
      expect(existsSync).toHaveBeenCalledWith('test.md');
      expect(readFileSync).toHaveBeenCalledWith('test.md', 'utf-8');
    });

    it('应该抛出错误当文件不存在时', () => {
      (existsSync as jest.Mock).mockReturnValue(false);

      expect(() => readFile('nonexistent.md')).toThrow('文件不存在: nonexistent.md');
    });

    it('应该使用自定义编码', () => {
      const mockContent = '测试内容';
      (existsSync as jest.Mock).mockReturnValue(true);
      (readFileSync as jest.Mock).mockReturnValue(mockContent);

      readFile('test.md', 'utf-8');
      
      expect(readFileSync).toHaveBeenCalledWith('test.md', 'utf-8');
    });
  });

  describe('isMarkdownFile', () => {
    it('应该识别 .md 文件', () => {
      expect(isMarkdownFile('test.md')).toBe(true);
      expect(isMarkdownFile('README.md')).toBe(true);
      expect(isMarkdownFile('path/to/file.md')).toBe(true);
    });

    it('应该识别 .markdown 文件', () => {
      expect(isMarkdownFile('test.markdown')).toBe(true);
      expect(isMarkdownFile('README.markdown')).toBe(true);
    });

    it('应该拒绝非 markdown 文件', () => {
      expect(isMarkdownFile('test.txt')).toBe(false);
      expect(isMarkdownFile('test.html')).toBe(false);
      expect(isMarkdownFile('test.js')).toBe(false);
      expect(isMarkdownFile('test')).toBe(false);
    });

    it('应该处理大小写不敏感', () => {
      expect(isMarkdownFile('test.MD')).toBe(true);
      expect(isMarkdownFile('test.MARKDOWN')).toBe(true);
    });
  });

  describe('generateHeadingId', () => {
    it('应该生成基本的标题 ID', () => {
      expect(generateHeadingId('Hello World')).toBe('hello-world');
      expect(generateHeadingId('测试标题')).toBe('测试标题');
    });

    it('应该处理特殊字符', () => {
      expect(generateHeadingId('Hello, World!')).toBe('hello-world');
      expect(generateHeadingId('Test & Example')).toBe('test-example');
      expect(generateHeadingId('Multiple   Spaces')).toBe('multiple-spaces');
    });

    it('应该处理多个连字符', () => {
      expect(generateHeadingId('Hello---World')).toBe('hello-world');
      expect(generateHeadingId('Test--Example')).toBe('test-example');
    });

    it('应该处理前后空格', () => {
      expect(generateHeadingId('  Hello World  ')).toBe('hello-world');
    });

    it('应该处理空字符串', () => {
      expect(generateHeadingId('')).toBe('');
    });
  });

  describe('getFileName', () => {
    it('应该提取文件名（不含扩展名）', () => {
      expect(getFileName('test.md')).toBe('test');
      expect(getFileName('README.markdown')).toBe('README');
      expect(getFileName('path/to/file.txt')).toBe('file');
    });

    it('应该处理没有扩展名的文件', () => {
      expect(getFileName('README')).toBe('README');
      expect(getFileName('test')).toBe('test');
    });

    it('应该处理多个点的文件名', () => {
      expect(getFileName('test.min.js')).toBe('test.min');
      expect(getFileName('file.backup.md')).toBe('file.backup');
    });
  });

  describe('normalizePath', () => {
    it('应该将反斜杠转换为正斜杠', () => {
      expect(normalizePath('path\\to\\file')).toBe('path/to/file');
      expect(normalizePath('C:\\Users\\test\\file.md')).toBe('C:/Users/test/file.md');
    });

    it('应该保持正斜杠不变', () => {
      expect(normalizePath('path/to/file')).toBe('path/to/file');
      expect(normalizePath('/absolute/path')).toBe('/absolute/path');
    });

    it('应该处理混合路径', () => {
      expect(normalizePath('path\\to/file\\test.md')).toBe('path/to/file/test.md');
    });
  });
});
