// HTML 生成器
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { TreeNode, Heading } from '../types/index.js';
import { MarkdownParser } from '../core/MarkdownParser.js';

export class HtmlGenerator {
  private markdownParser: MarkdownParser;
  private outputDir: string;

  constructor(outputDir: string) {
    this.markdownParser = new MarkdownParser();
    this.outputDir = outputDir;
  }

  /**
   * 生成 HTML 网站
   */
  async generate(tree: TreeNode, title: string = 'GitBook'): Promise<void> {
    // 确保输出目录存在
    if (!existsSync(this.outputDir)) {
      mkdirSync(this.outputDir, { recursive: true });
    }

    // 生成主页面
    await this.generateIndexPage(tree, title);
    
    // 生成各个文档页面
    await this.generateDocumentPages(tree);
    
    // 生成样式文件
    this.generateStyles();
    
    // 生成脚本文件
    this.generateScripts();
  }

  /**
   * 生成主页面
   */
  private async generateIndexPage(tree: TreeNode, title: string): Promise<void> {
    const html = await this.generateHtmlTemplate(title, tree, tree.children[0]?.content || '');
    const indexPath = join(this.outputDir, 'index.html');
    writeFileSync(indexPath, html, 'utf-8');
  }

  /**
   * 生成文档页面
   */
  private async generateDocumentPages(tree: TreeNode): Promise<void> {
    for (const node of tree.children) {
      if (node.content) {
        const html = await this.generateHtmlTemplate(node.title, tree, node.content, node.headings);
        const fileName = this.getFileName(node.title) + '.html';
        const filePath = join(this.outputDir, fileName);
        writeFileSync(filePath, html, 'utf-8');
      }
    }
  }

  /**
   * 生成 HTML 模板
   */
  private async generateHtmlTemplate(title: string, tree: TreeNode, content: string, headings?: Heading[]): Promise<string> {
    const sidebar = this.generateSidebar(tree);
    const toc = headings ? this.generateTableOfContents(headings) : '';
    const htmlContent = await this.markdownParser.toHtml(content);

    return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <link rel="stylesheet" href="styles.css">
</head>
<body>
    <div class="container">
        <aside class="sidebar">
            <div class="sidebar-header">
                <h1>${title}</h1>
            </div>
            <nav class="sidebar-nav">
                ${sidebar}
            </nav>
        </aside>
        
        <main class="main-content">
            <div class="content-wrapper">
                <article class="content">
                    ${htmlContent}
                </article>
                
                ${toc ? `<aside class="toc">
                    <h3>目录</h3>
                    ${toc}
                </aside>` : ''}
            </div>
        </main>
    </div>
    
    <script src="script.js"></script>
</body>
</html>`;
  }

  /**
   * 生成侧边栏
   */
  private generateSidebar(tree: TreeNode): string {
    return this.generateSidebarItems(tree.children, 0);
  }

  /**
   * 生成侧边栏项目
   */
  private generateSidebarItems(nodes: TreeNode[], level: number): string {
    let html = '';
    
    for (const node of nodes) {
      const indent = '  '.repeat(level);
      const fileName = node.path ? this.getFileName(node.title) + '.html' : 'index.html';
      
      html += `${indent}<div class="sidebar-item level-${level}">
${indent}  <a href="${fileName}" class="sidebar-link">${node.title}</a>
`;
      
      if (node.children.length > 0) {
        html += `${indent}  <div class="sidebar-children">
${this.generateSidebarItems(node.children, level + 1)}
${indent}  </div>
`;
      }
      
      html += `${indent}</div>
`;
    }
    
    return html;
  }

  /**
   * 生成目录
   */
  private generateTableOfContents(headings: Heading[]): string {
    return this.generateTocItems(headings, 0);
  }

  /**
   * 生成目录项目
   */
  private generateTocItems(headings: Heading[], level: number): string {
    let html = '<ul class="toc-list">';
    
    for (const heading of headings) {
      html += `<li class="toc-item level-${heading.level}">
        <a href="#${heading.id}" class="toc-link">${heading.text}</a>
`;
      
      if (heading.children.length > 0) {
        html += this.generateTocItems(heading.children, level + 1);
      }
      
      html += '</li>';
    }
    
    html += '</ul>';
    return html;
  }

  /**
   * 生成样式文件
   */
  private generateStyles(): void {
    const css = `/* GitBook 样式 */
* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    line-height: 1.6;
    color: #333;
    background-color: #f8f9fa;
}

.container {
    display: flex;
    min-height: 100vh;
}

.sidebar {
    width: 300px;
    background-color: #2c3e50;
    color: white;
    overflow-y: auto;
    position: fixed;
    height: 100vh;
    left: 0;
    top: 0;
}

.sidebar-header {
    padding: 20px;
    border-bottom: 1px solid #34495e;
}

.sidebar-header h1 {
    font-size: 1.5rem;
    font-weight: 600;
}

.sidebar-nav {
    padding: 20px 0;
}

.sidebar-item {
    margin-bottom: 5px;
}

.sidebar-link {
    display: block;
    padding: 10px 20px;
    color: #ecf0f1;
    text-decoration: none;
    transition: background-color 0.3s;
}

.sidebar-link:hover {
    background-color: #34495e;
}

.sidebar-children {
    margin-left: 20px;
}

.level-1 .sidebar-link { padding-left: 20px; }
.level-2 .sidebar-link { padding-left: 40px; }
.level-3 .sidebar-link { padding-left: 60px; }

.main-content {
    margin-left: 300px;
    flex: 1;
    padding: 40px;
}

.content-wrapper {
    max-width: 1200px;
    margin: 0 auto;
    display: flex;
    gap: 40px;
}

.content {
    flex: 1;
    background: white;
    padding: 40px;
    border-radius: 8px;
    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
}

.toc {
    width: 250px;
    background: white;
    padding: 20px;
    border-radius: 8px;
    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    height: fit-content;
    position: sticky;
    top: 20px;
}

.toc h3 {
    margin-bottom: 15px;
    color: #2c3e50;
}

.toc-list {
    list-style: none;
}

.toc-item {
    margin-bottom: 5px;
}

.toc-link {
    display: block;
    padding: 5px 0;
    color: #666;
    text-decoration: none;
    font-size: 0.9rem;
    transition: color 0.3s;
}

.toc-link:hover {
    color: #2c3e50;
}

.level-1 .toc-link { padding-left: 0; }
.level-2 .toc-link { padding-left: 15px; }
.level-3 .toc-link { padding-left: 30px; }

/* Markdown 内容样式 */
.content h1, .content h2, .content h3, .content h4, .content h5, .content h6 {
    margin-top: 30px;
    margin-bottom: 15px;
    color: #2c3e50;
}

.content h1 { font-size: 2rem; }
.content h2 { font-size: 1.5rem; }
.content h3 { font-size: 1.25rem; }

.content p {
    margin-bottom: 15px;
}

.content ul, .content ol {
    margin-bottom: 15px;
    padding-left: 30px;
}

.content li {
    margin-bottom: 5px;
}

.content code {
    background-color: #f1f2f6;
    padding: 2px 6px;
    border-radius: 3px;
    font-family: 'Monaco', 'Consolas', monospace;
}

.content pre {
    background-color: #2c3e50;
    color: #ecf0f1;
    padding: 20px;
    border-radius: 5px;
    overflow-x: auto;
    margin-bottom: 20px;
}

.content pre code {
    background: none;
    padding: 0;
    color: inherit;
}

.content blockquote {
    border-left: 4px solid #3498db;
    padding-left: 20px;
    margin: 20px 0;
    color: #666;
    font-style: italic;
}

.content table {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 20px;
}

.content th, .content td {
    border: 1px solid #ddd;
    padding: 12px;
    text-align: left;
}

.content th {
    background-color: #f8f9fa;
    font-weight: 600;
}

/* 响应式设计 */
@media (max-width: 768px) {
    .sidebar {
        transform: translateX(-100%);
        transition: transform 0.3s;
    }
    
    .sidebar.open {
        transform: translateX(0);
    }
    
    .main-content {
        margin-left: 0;
        padding: 20px;
    }
    
    .content-wrapper {
        flex-direction: column;
    }
    
    .toc {
        width: 100%;
        position: static;
    }
}`;

    const stylesPath = join(this.outputDir, 'styles.css');
    writeFileSync(stylesPath, css, 'utf-8');
  }

  /**
   * 生成脚本文件
   */
  private generateScripts(): void {
    const js = `// GitBook 脚本
document.addEventListener('DOMContentLoaded', function() {
    // 平滑滚动到锚点
    const links = document.querySelectorAll('a[href^="#"]');
    links.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href').substring(1);
            const targetElement = document.getElementById(targetId);
            if (targetElement) {
                targetElement.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });

    // 移动端侧边栏切换
    const sidebarToggle = document.createElement('button');
    sidebarToggle.innerHTML = '☰';
    sidebarToggle.className = 'sidebar-toggle';
    sidebarToggle.style.cssText = \`
        position: fixed;
        top: 20px;
        left: 20px;
        z-index: 1000;
        background: #2c3e50;
        color: white;
        border: none;
        padding: 10px;
        border-radius: 5px;
        font-size: 18px;
        cursor: pointer;
        display: none;
    \`;
    
    document.body.appendChild(sidebarToggle);
    
    const sidebar = document.querySelector('.sidebar');
    
    sidebarToggle.addEventListener('click', function() {
        sidebar.classList.toggle('open');
    });
    
    // 响应式检测
    function checkScreenSize() {
        if (window.innerWidth <= 768) {
            sidebarToggle.style.display = 'block';
        } else {
            sidebarToggle.style.display = 'none';
            sidebar.classList.remove('open');
        }
    }
    
    window.addEventListener('resize', checkScreenSize);
    checkScreenSize();
});`;

    const scriptPath = join(this.outputDir, 'script.js');
    writeFileSync(scriptPath, js, 'utf-8');
  }

  /**
   * 获取文件名
   */
  private getFileName(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  }
}
