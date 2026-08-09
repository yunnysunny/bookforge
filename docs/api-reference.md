# API 参考

## HtmlGenerator

HTML 网站生成器，用于生成完整的 HTML 网站。

### 构造函数

```typescript
new HtmlGenerator(config: BookForgeConfig)
```

**参数:**

- `config.input` - 输入目录或文件路径
- `config.output` - 输出目录路径
- `config.format` - 格式类型，必须为 `'html'`
- `config.mode` - 解析模式，`'gitbook'` 或 `'notion'`（可选，默认为 `'gitbook'`）
- `config.title` - 网站标题（可选）
- `config.author` - 作者（可选）
- `config.skip` - 要跳过的文件/目录模式数组（可选）
- `config.navLinks` - 顶部导航栏的自定义链接（可选），详见[配置说明](./configuration.md#navlinks---导航栏链接)

### 方法

#### generate(): Promise<void>

生成完整的 HTML 网站。该方法会：

- 解析输入目录中的 Markdown 文件
- 生成 HTML 页面
- 生成侧边栏导航
- 生成目录（TOC）
- 复制样式和脚本文件
- 生成全站搜索索引 `search-index.json`

## PdfGenerator

PDF 文件生成器，用于生成 PDF 文档。

### 构造函数

```typescript
new PdfGenerator(config: BookForgeConfig)
```

**参数:**

- `config.input` - 输入目录或文件路径
- `config.output` - 输出目录路径
- `config.format` - 格式类型，必须为 `'pdf'`
- `config.mode` - 解析模式，`'gitbook'` 或 `'notion'`（可选，默认为 `'gitbook'`）
- `config.title` - 文档标题（可选）
- `config.author` - 作者（可选）
- `config.skip` - 要跳过的文件/目录模式数组（可选）

### 方法

#### generate(): Promise<void>

生成 PDF 文件。该方法会：

- 解析输入目录中的 Markdown 文件
- 将所有内容合并为单个 HTML
- 使用 Puppeteer 将 HTML 转换为 PDF
- 生成目录页

## 类型定义

### MarkdownFile

```typescript
interface MarkdownFile {
  path: string;
  title: string;
  content: string;
  headings: Heading[];
}
```

### Heading

```typescript
interface Heading {
  level: number;
  text: string;
  id: string;
  children: Heading[];
}
```

### TreeNode

```typescript
interface TreeNode {
  title: string;
  path?: string;
  content?: string;
  headings?: Heading[];
  children: TreeNode[];
}
```

### BookForgeConfig

```typescript
interface BookForgeConfig {
  input: string;
  output: string;
  format: Env;
  mode?: ParserMode;
  title?: string;
  author?: string;
  skip?: string[];
  giscus?: GiscusConfig;
  navLinks?: NavLink[];
}
```

各字段含义详见[配置说明](./configuration.md#配置项)。

### NavLink

```typescript
interface NavLink {
  text: string;
  url: string;
}
```

### GiscusConfig

```typescript
interface GiscusConfig {
  repo: string;
  repoId: string;
  category: string;
  categoryId: string;
  mapping?: string;
  theme?: string;
  lang?: string;
}
```

> 当前版本仅解析该配置，尚未渲染评论区。

### ParserMode

```typescript
type ParserMode = "gitbook" | "notion";
```

### Env

```typescript
type Env = "html" | "pdf";
```

## loadConfigFile

加载 YAML 配置文件，返回 `Partial<BookForgeConfig>`。

```typescript
function loadConfigFile(configPath?: string): Promise<Partial<BookForgeConfig> | undefined>
```

**参数:**

- `configPath` - 配置文件路径（可选）。省略时按 `bookforge.yml` → `bookforge.yaml` → `.bookforge.yml` → `.bookforge.yaml` 的顺序在当前工作目录查找

**返回值:**

- 传入 `configPath` 时：文件不存在或解析失败会抛出异常
- 省略 `configPath` 时：一个候选文件都没找到则返回 `undefined`
- 只包含文件中出现且类型合法的字段，非法字段会被静默丢弃

```typescript
import { HtmlGenerator, loadConfigFile } from 'bookforge';

const fileConfig = await loadConfigFile();
const generator = new HtmlGenerator({
  input: './docs',
  output: './dist/html',
  format: 'html',
  ...fileConfig,
});
await generator.generate();
```

