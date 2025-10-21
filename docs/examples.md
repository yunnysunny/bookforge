# 示例

这里是一些使用 GitBook 解析器的示例。

## 基本示例

```typescript
import { GitBookParser, HtmlGenerator, PdfGenerator } from 'gitbook-parser';

async function example() {
  // 解析项目
  const parser = new GitBookParser();
  const tree = await parser.parseProject('./docs');
  
  // 生成 HTML
  const htmlGenerator = new HtmlGenerator('./dist/html');
  await htmlGenerator.generate(tree, '我的文档');
  
  // 生成 PDF
  const pdfGenerator = new PdfGenerator('./dist/pdf');
  await pdfGenerator.generate(tree, '我的文档');
}
```

## 自定义选项

```typescript
import { GitBookParser } from 'gitbook-parser';

const parser = new GitBookParser({
  encoding: 'utf-8',
  ignorePatterns: ['node_modules', '.git', 'temp']
});

const tree = await parser.parseProject('./docs');
```

## 命令行使用

### 生成 HTML 网站

```bash
gitbook-parser html -i ./docs -o ./dist/html -t "我的文档"
```

### 生成 PDF 文件

```bash
gitbook-parser pdf -i ./docs -o ./dist/pdf -t "我的文档"
```

### 同时生成两种格式

```bash
gitbook-parser all -i ./docs -o ./dist -t "我的文档"
```

## 高级用法

### 自定义样式

生成的 HTML 文件包含 `styles.css`，你可以修改它来自定义样式。

### 自定义脚本

生成的 HTML 文件包含 `script.js`，你可以修改它来添加自定义功能。

### 响应式设计

生成的网站支持响应式设计，在移动设备上会自动调整布局。
