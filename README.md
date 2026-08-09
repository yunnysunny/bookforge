# GitBook 解析器

一个用于解析 markdown 文件并生成 HTML 网站或 PDF 文件的工具。

![preview](./docs/images/preview.png)

## 功能特性

- 📚 解析 gitbook 的 markdown 文件结构
- 📚 解析 notion 导出压缩包的 markdown 文件结构
- 🌳 构建目录树结构
- 🎯 支持标题锚点跳转
- 🌐 生成 HTML 网站（左侧目录树，右侧内容）
- 📄 生成 PDF 文件
- 🔍 支持 gitbook 标签
- 💡 支持语法高亮
- 📈 支持 mermaid 图形
- 🧮 支持 latex 公式


## 安装

```bash
# 安装命令支持 html
pnpm install bookforge -g
# 配置 puppeteer 支持pdf
pnpm approve-builds -g
```

## 构建

```bash
pnpm build
```

## 使用

```bash
# 生成 HTML 网站
bookforge html --input ./docs --output ./dist/html

# 生成 PDF 文件
bookforge pdf --input ./docs --output ./dist/pdf

# 同时生成 HTML 和 PDF
bookforge all --input ./docs --output ./dist
```

## 配置文件

常用参数可以写进项目根目录的 `bookforge.yml`，运行时自动读取（也可用 `-c` 指定路径）：

```yaml
input: ./docs
output: ./dist/html
title: 我的技术手册
skip:
  - drafts
navLinks:
  - text: GitHub
    url: https://github.com/yunnysunny/bookforge
```

```bash
bookforge html
```

命令行显式传入的参数优先于配置文件。完整字段说明见 [docs/configuration.md](./docs/configuration.md)。

## 开发

```bash
# 运行测试
pnpm test
```

## 示例

项目包含了一个完整的示例文档在 `docs/` 目录中，你可以直接使用它来测试功能。

## TODO
- [x] 支持notion导出压缩包解析
- [x] 支持 notion database 解析
- [x] 支持 mermaid 语法

## 已知问题
### notion database 标题重名问题
在 notion database 中，如果多个页面有相同的标题，则相同的标题的页面会展示成同一个。所以如果想导出的 database 正常渲染，请确保每个页面的标题都是唯一的。

## 许可证

[MIT](LICENSE)