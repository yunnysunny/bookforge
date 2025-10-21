// PDF 生成器
import puppeteer from 'puppeteer';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';
import { TreeNode } from '../types/index.js';
import { MarkdownParser } from '../core/MarkdownParser.js';

export class PdfGenerator {
  private markdownParser: MarkdownParser;
  private outputDir: string;

  constructor(outputDir: string) {
    this.markdownParser = new MarkdownParser();
    this.outputDir = outputDir;
  }

  /**
   * 生成 PDF 文件
   */
  async generate(tree: TreeNode, title: string = 'GitBook'): Promise<void> {
    // 确保输出目录存在
    if (!existsSync(this.outputDir)) {
      mkdirSync(this.outputDir, { recursive: true });
    }

    // 生成 HTML 内容
    const htmlContent = await this.generateHtmlContent(tree, title);
    
    // 使用 Puppeteer 生成 PDF
    await this.generatePdfFromHtml(htmlContent, title);
  }

  /**
   * 生成 HTML 内容
   */
  private async generateHtmlContent(tree: TreeNode, title: string): Promise<string> {
    const toc = this.generateTableOfContents(tree);
    const content = await this.generateContent(tree);

    return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #333;
            margin: 0;
            padding: 40px;
            background: white;
        }
        
        .cover {
            text-align: center;
            page-break-after: always;
            padding: 100px 0;
        }
        
        .cover h1 {
            font-size: 3rem;
            margin-bottom: 20px;
            color: #2c3e50;
        }
        
        .cover .subtitle {
            font-size: 1.2rem;
            color: #666;
        }
        
        .toc {
            page-break-after: always;
        }
        
        .toc h2 {
            font-size: 2rem;
            margin-bottom: 30px;
            color: #2c3e50;
            border-bottom: 2px solid #3498db;
            padding-bottom: 10px;
        }
        
        .toc-list {
            list-style: none;
            padding: 0;
        }
        
        .toc-item {
            margin-bottom: 10px;
        }
        
        .toc-link {
            text-decoration: none;
            color: #2c3e50;
            font-size: 1.1rem;
        }
        
        .toc-children {
            margin-left: 30px;
            margin-top: 10px;
        }
        
        .toc-children .toc-link {
            font-size: 1rem;
            color: #666;
        }
        
        .content {
            page-break-before: always;
        }
        
        .content h1 {
            font-size: 2.5rem;
            margin-top: 0;
            margin-bottom: 30px;
            color: #2c3e50;
            border-bottom: 2px solid #3498db;
            padding-bottom: 10px;
        }
        
        .content h2 {
            font-size: 2rem;
            margin-top: 40px;
            margin-bottom: 20px;
            color: #2c3e50;
        }
        
        .content h3 {
            font-size: 1.5rem;
            margin-top: 30px;
            margin-bottom: 15px;
            color: #2c3e50;
        }
        
        .content h4 {
            font-size: 1.25rem;
            margin-top: 25px;
            margin-bottom: 10px;
            color: #2c3e50;
        }
        
        .content p {
            margin-bottom: 15px;
            text-align: justify;
        }
        
        .content ul, .content ol {
            margin-bottom: 15px;
            padding-left: 30px;
        }
        
        .content li {
            margin-bottom: 5px;
        }
        
        .content code {
            background-color: #f8f9fa;
            padding: 2px 6px;
            border-radius: 3px;
            font-family: 'Monaco', 'Consolas', monospace;
            font-size: 0.9rem;
        }
        
        .content pre {
            background-color: #2c3e50;
            color: #ecf0f1;
            padding: 20px;
            border-radius: 5px;
            overflow-x: auto;
            margin-bottom: 20px;
            page-break-inside: avoid;
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
            background-color: #f8f9fa;
            padding: 15px 20px;
        }
        
        .content table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
            page-break-inside: avoid;
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
        
        .content img {
            max-width: 100%;
            height: auto;
            margin: 20px 0;
            page-break-inside: avoid;
        }
        
        .page-break {
            page-break-before: always;
        }
        
        @media print {
            body {
                margin: 0;
                padding: 20px;
            }
            
            .cover {
                padding: 50px 0;
            }
            
            .content {
                padding-top: 0;
            }
        }
    </style>
</head>
<body>
    <div class="cover">
        <h1>${title}</h1>
        <div class="subtitle">GitBook 文档</div>
    </div>
    
    <div class="toc">
        <h2>目录</h2>
        ${toc}
    </div>
    
    ${content}
</body>
</html>`;
  }

  /**
   * 生成目录
   */
  private generateTableOfContents(tree: TreeNode): string {
    return this.generateTocItems(tree.children, 0);
  }

  /**
   * 生成目录项目
   */
  private generateTocItems(nodes: TreeNode[], level: number): string {
    let html = '<ul class="toc-list">';
    
    for (const node of nodes) {
      html += `<li class="toc-item">
        <a href="#${this.getAnchorId(node.title)}" class="toc-link">${node.title}</a>
`;
      
      if (node.children.length > 0) {
        html += `<div class="toc-children">
          ${this.generateTocItems(node.children, level + 1)}
        </div>
`;
      }
      
      html += '</li>';
    }
    
    html += '</ul>';
    return html;
  }

  /**
   * 生成内容
   */
  private async generateContent(tree: TreeNode): Promise<string> {
    let html = '';
    
    for (const node of tree.children) {
      if (node.content) {
        html += `<div class="content">
          <h1 id="${this.getAnchorId(node.title)}">${node.title}</h1>
          ${await this.markdownParser.toHtml(node.content)}
        </div>
`;
        
        // 添加分页符（除了最后一个）
        if (node !== tree.children[tree.children.length - 1]) {
          html += '<div class="page-break"></div>';
        }
      }
    }
    
    return html;
  }

  /**
   * 使用 Puppeteer 生成 PDF
   */
  private async generatePdfFromHtml(htmlContent: string, title: string): Promise<void> {
    const browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    try {
      const page = await browser.newPage();
      
      await page.setContent(htmlContent, {
        waitUntil: 'networkidle0'
      });

      const pdfPath = join(this.outputDir, `${this.getFileName(title)}.pdf`);
      
      await page.pdf({
        path: pdfPath,
        format: 'A4',
        printBackground: true,
        margin: {
          top: '20mm',
          right: '20mm',
          bottom: '20mm',
          left: '20mm'
        },
        displayHeaderFooter: true,
        headerTemplate: '<div></div>',
        footerTemplate: `
          <div style="font-size: 10px; text-align: center; width: 100%; color: #666;">
            <span class="pageNumber"></span> / <span class="totalPages"></span>
          </div>
        `
      });

      console.log(`PDF 已生成: ${pdfPath}`);
    } finally {
      await browser.close();
    }
  }

  /**
   * 获取锚点 ID
   */
  private getAnchorId(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
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
