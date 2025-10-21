# 快速开始

让我们开始使用 GitBook 解析器！

## 安装

```bash
pnpm install
```

## 构建项目

```bash
pnpm build
```

## 基本使用

### 生成 HTML 网站

```bash
pnpm start html --input ./docs --output ./dist/html --title "我的文档"
```

### 生成 PDF 文件

```bash
pnpm start pdf --input ./docs --output ./dist/pdf --title "我的文档"
```

### 同时生成 HTML 和 PDF

```bash
pnpm start all --input ./docs --output ./dist --title "我的文档"
```

## 项目结构

确保你的文档目录结构如下：

```
docs/
├── README.md          # 入口文件
├── introduction.md    # 介绍
├── getting-started.md # 快速开始
└── api-reference.md   # API 参考
```
