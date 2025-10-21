// Jest 测试设置

// 设置测试超时时间
jest.setTimeout(30000);

// 模拟文件系统操作
jest.mock('fs', () => ({
  ...jest.requireActual('fs'),
  writeFileSync: jest.fn(),
  readFileSync: jest.fn(),
  mkdirSync: jest.fn(),
  existsSync: jest.fn(),
  readdirSync: jest.fn(),
  statSync: jest.fn(),
}));

// 模拟 puppeteer
jest.mock('puppeteer', () => ({
  launch: jest.fn(),
}));

// 清理模拟
afterEach(() => {
  jest.clearAllMocks();
});
