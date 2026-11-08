// 基本测试
import { describe, expect, test } from 'vitest';
import { generateIdFromText, isMarkdownFile } from '../src/utils';

describe('基本功能测试', () => {
  test('应该识别 markdown 文件', () => {
    expect(isMarkdownFile('test.md')).toBe(true);
    expect(isMarkdownFile('test.markdown')).toBe(true);
    expect(isMarkdownFile('test.txt')).toBe(false);
  });

  test('应该生成正确的标题 ID', () => {
    expect(generateIdFromText('Hello World')).toBe('hello-world');
    expect(generateIdFromText('测试标题')).toBe('测试标题');
  });

  test('中文标点应该被去掉，与 GitHub 保持一致', () => {
    expect(generateIdFromText('安装与使用（快速开始）')).toBe('安装与使用快速开始');
    expect(generateIdFromText('中文标点，测试。')).toBe('中文标点测试');
    expect(generateIdFromText('“引号”与《书名》')).toBe('引号与书名');
    expect(generateIdFromText('配置项：theme（主题）')).toBe('配置项theme主题');
    expect(generateIdFromText('引言 —— 概述…')).toBe('引言-概述');
  });

  test('全角字母数字、下划线、连字符应该保留', () => {
    expect(generateIdFromText('全角ＡＢＣ１２３')).toBe('全角ａｂｃ１２３');
    expect(generateIdFromText('A-B 测试')).toBe('a-b-测试');
    expect(generateIdFromText('a_b')).toBe('a_b');
  });

  test('应该处理空字符串', () => {
    expect(generateIdFromText('')).toBe('');
  });
});
