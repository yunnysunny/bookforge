# API 参考

## GitBookParser

主要的解析器类。

### 构造函数

```typescript
new GitBookParser(options?: ParserOptions)
```

### 方法

#### parseProject(inputPath: string): Promise<TreeNode>

解析 GitBook 项目并返回目录树。

**参数:**
- `inputPath` - 输入目录路径

**返回值:**
- `Promise<TreeNode>` - 解析后的目录树

## HtmlGenerator

HTML 网站生成器。

### 构造函数

```typescript
new HtmlGenerator(outputDir: string)
```

### 方法

#### generate(tree: TreeNode, title?: string): Promise<void>

生成 HTML 网站。

**参数:**
- `tree` - 目录树
- `title` - 网站标题（可选）

## PdfGenerator

PDF 文件生成器。

### 构造函数

```typescript
new PdfGenerator(outputDir: string)
```

### 方法

#### generate(tree: TreeNode, title?: string): Promise<void>

生成 PDF 文件。

**参数:**
- `tree` - 目录树
- `title` - 文档标题（可选）
