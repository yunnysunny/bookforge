# 配置说明

BookForge 支持两种配置方式：**命令行参数** 和 **YAML 配置文件**。像 `navLinks` 这类结构化配置只能写在配置文件里。

## 配置文件

### 文件位置

不指定 `--config` 时，BookForge 会在**当前工作目录**下按顺序查找，使用第一个存在的文件：

1. `bookforge.yml`
2. `bookforge.yaml`
3. `.bookforge.yml`
4. `.bookforge.yaml`

一个都找不到时不会报错，全部使用命令行参数和默认值。

### 指定配置文件

```bash
bookforge html --config ./config/bookforge.yml
# 简写
bookforge html -c ./config/bookforge.yml
```

用 `-c` 显式指定的文件如果不存在，会直接报错退出，而不是回退到自动查找。

### 优先级

同一个配置项在多处出现时，按以下优先级取值：

```
命令行显式传入  >  配置文件  >  选项默认值
```

注意是**显式传入**才算数。例如 `--input` 的默认值是 `./docs`，只要你没在命令行里写 `--input`，配置文件里的 `input` 就会生效。

```bash
# bookforge.yml 里写了 title: 我的手册

bookforge html                    # 标题为「我的手册」（来自配置文件）
bookforge html --title "临时标题"  # 标题为「临时标题」（命令行覆盖配置文件）
```

## 配置项

### 基础配置

| 字段 | 类型 | 默认值 | 对应命令行参数 | 说明 |
|------|------|--------|----------------|------|
| `input` | string | `./docs` | `-i, --input` | 输入目录路径，或 notion 导出的 zip 包路径 |
| `output` | string | 随命令而定 | `-o, --output` | 输出目录路径 |
| `format` | string | 随命令而定 | — | `html` 或 `pdf`，由子命令决定，配置文件中设置无效 |
| `mode` | string | `gitbook` | `-m, --mode` | 解析模式，`gitbook` 或 `notion` |
| `title` | string | `BookForge` | `-t, --title` | 文档标题，显示在导航栏和 PDF 封面 |
| `author` | string | — | — | 作者。仅配置文件支持，HTML 输出会渲染为 `<meta name="author">` |
| `skip` | string[] | — | `-s, --skip` | 忽略的目录。命令行用逗号分隔，配置文件用数组 |

`output` 的默认值取决于子命令：`html` 为 `./dist/html`，`pdf` 为 `./dist/pdf`，`all` 为 `./dist`（并在其下再分出 `html/` 和 `pdf/` 两个子目录）。

`input` 和 `output` 中的相对路径都相对于当前工作目录解析，也可以直接写绝对路径。

`skip` 只作用于**目录**，且是**子串匹配**而非 glob：写 `draft` 会跳过 `draft`、`drafts`、`my-draft` 等所有目录名包含 `draft` 的目录，但不会跳过 `draft.md` 这类文件。

### navLinks - 导航栏链接

在顶部导航栏「首页」后面追加自定义链接，常用于放 GitHub 仓库地址。**仅 HTML 输出生效。**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `text` | string | 是 | 链接文字 |
| `url` | string | 是 | 链接地址 |

```yaml
navLinks:
  - text: GitHub
    url: https://github.com/yunnysunny/bookforge
  - text: 更新日志
    url: changelog.html
```

行为说明：

- 绝对地址（`http://`、`https://`、`//` 开头）会自动加上 `target="_blank" rel="noopener noreferrer"`，在新标签页打开
- 相对地址视为站内链接，在当前页跳转
- `text` 和 `url` 都会做 HTML 转义
- 缺少 `text` 或 `url` 的条目会被静默忽略；整个数组都无效时相当于没有配置

### giscus - 评论区

在每个页面文章内容下方嵌入 [giscus](https://giscus.app) 评论区，基于 GitHub Discussions 实现。**仅 HTML 输出生效。**

使用前需要：

1. 在 GitHub 仓库设置里开启 **Discussions**
2. 前往 [github.com/apps/giscus](https://github.com/apps/giscus) 安装 giscus App 并授权目标仓库
3. 前往 [giscus.app](https://giscus.app) 填入仓库信息，获取 `repoId` 和 `categoryId`

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `repo` | string | 是 | GitHub 仓库，格式 `owner/repo` |
| `repoId` | string | 是 | 仓库的 Node ID，从 giscus.app 获取 |
| `category` | string | 是 | Discussion 分类名称 |
| `categoryId` | string | 是 | 分类的 Node ID，从 giscus.app 获取 |
| `mapping` | string | 否 | 页面与 Discussion 的关联方式，默认 `pathname` |
| `theme` | string | 否 | 主题，默认 `preferred_color_scheme` |
| `lang` | string | 否 | 语言，默认 `zh-CN` |

```yaml
giscus:
  repo: yunnysunny/bookforge
  repoId: R_kgDOQHuwBw
  category: Announcements
  categoryId: DIC_xxxxxxxx
  mapping: pathname                   # 可选：url | title | og:title | specific | number | pathname
  theme: preferred_color_scheme       # 可选：light | dark | preferred_color_scheme 等
  lang: zh-CN                         # 可选
```

四个必填字段缺任意一个，整段 `giscus` 配置都会被忽略。

## 完整示例

```yaml
# bookforge.yml
input: ./docs
output: ./dist/html
mode: gitbook
title: 我的技术手册
author: yunnysunny
skip:
  - drafts
  - .obsidian

navLinks:
  - text: GitHub
    url: https://github.com/yunnysunny/bookforge
  - text: 关于
    url: about.html
```

配好之后直接运行即可，不需要再带参数：

```bash
bookforge html
```

## 在代码中使用

配置文件加载器也可以单独调用，返回值是 `Partial<BookForgeConfig>`，未在文件中出现的字段不会有值：

```typescript
import { HtmlGenerator, loadConfigFile } from 'bookforge';

const fileConfig = await loadConfigFile(); // 也可传入路径：loadConfigFile('./my.yml')

const generator = new HtmlGenerator({
  input: './docs',
  output: './dist/html',
  format: 'html',
  ...fileConfig,
});
await generator.generate();
```

不读配置文件，直接传对象也可以：

```typescript
const generator = new HtmlGenerator({
  input: './docs',
  output: './dist/html',
  format: 'html',
  title: '我的技术手册',
  navLinks: [{ text: 'GitHub', url: 'https://github.com/yunnysunny/bookforge' }],
});
```

## 校验规则

配置文件采取「宽松校验」策略：**类型不合法的字段会被丢弃，而不是报错**。

- `format` 只接受 `html` / `pdf`，`mode` 只接受 `gitbook` / `notion`，其他值按未设置处理
- `skip` 数组中的非字符串项会被过滤掉
- 文件本身不存在（自动查找时）或解析结果不是对象，都按未配置处理

所以配置项拼错时不会有报错提示，只是不生效——发现某项没起作用，先检查字段名拼写。
