// PDF 生成器
import { join } from 'path';
import puppeteer from 'puppeteer';
import type { BookForgeConfig, TreeNode } from '../types';
import { AbstractGenerator } from './abstract.generator';
import { writeFile } from 'fs/promises';
export interface HtmlData {
  title: string;
  content: string;
}
export class PdfGenerator extends AbstractGenerator {
  constructor(config: BookForgeConfig) {
    super(config);
    this.name = 'pdf';
  }

  protected async doGenerate(treeRoot: TreeNode): Promise<void> {
    const htmlContent = await this.generateHtmlContent(treeRoot);
    await this.generatePdfFromHtml(htmlContent);
  }

  /**
   * 生成 HTML 内容
   */
  protected async generateHtmlContent(tree: TreeNode): Promise<string> {
    const toc = await this.generateTableOfContents(tree);
    const htmlData: HtmlData[] = [];
    await this.generateHtmlData(tree, htmlData);
    const content = await this.generateContent(htmlData);
    const html = await this.render('page.ejs', {
      title: this.title,
      toc,
      content,
    });
    return html;
  }

  /**
   * 生成目录
   */
  private async generateTableOfContents(tree: TreeNode): Promise<string> {
    return await this.generateTocItems(tree.children, 0);
  }

  /**
   * 生成目录项目
   */
  private async generateTocItems(
    nodes: TreeNode[],
    level: number,
  ): Promise<string> {
    //     let html = '<ul class="toc-list">';

    //     for (const node of nodes) {
    //       html += `<li class="toc-item">
    //         <a href="#${this.getAnchorId(node.title)}" class="toc-link">${node.title}</a>
    // `;

    //       if (node.children.length > 0) {
    //         html += `<div class="toc-children">
    //           ${this.generateTocItems(node.children, level + 1)}
    //         </div>
    // `;
    //       }

    //       html += '</li>';
    //     }

    //     html += '</ul>';
    const html = await this.render('toc.ejs', {
      nodes,
      level,
    });
    return html;
  }

  private async generateHtmlData(
    tree: TreeNode,
    data: HtmlData[],
  ): Promise<void> {
    for (const child of tree.children) {
      if (child.content) {
        data.push({
          title: child.title,
          content: (await this.bookParser.toHtml(child)) as string,
        });
      }
      await this.generateHtmlData(child, data);
    }
  }

  /**
   * 生成内容
   */
  private async generateContent(data: HtmlData[]): Promise<string> {
    // let html = '';

    //     for (const node of tree.children) {
    //       if (node.content) {
    //         html += `<div class="content-body">
    //           <h1 id="${this.getAnchorId(node.title)}">${node.title}</h1>
    //           ${await this.markdownParser.toHtml(node.content)}
    //         </div>
    // `;

    //         // 添加分页符（除了最后一个）
    //         if (node !== tree.children[tree.children.length - 1]) {
    //           html += '<div class="page-break"></div>';
    //         }
    //       }
    //     }

    const html = await this.render('content.ejs', {
      data,
    });
    return html;
  }

  /**
   * 使用 Puppeteer 生成 PDF
   */
  private async generatePdfFromHtml(htmlContent: string): Promise<void> {
    const browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--allow-file-access-from-files',
        '--disable-web-security',
      ],
    });

    try {
      const page = await browser.newPage();

      await page.setContent(htmlContent, {
        waitUntil: 'networkidle0',
      });

      const pdfPath = join(this.outputDir, `${this.title}.pdf`);

      await page.pdf({
        path: pdfPath,
        format: 'A4',
        printBackground: true,
        outline: true,
        margin: {
          top: '20mm',
          right: '20mm',
          bottom: '20mm',
          left: '20mm',
        },
        displayHeaderFooter: true,
        headerTemplate: '<div></div>',
        footerTemplate: `
          <div style="font-size: 10px; text-align: center; width: 100%; color: #666;">
            <span class="pageNumber"></span> / <span class="totalPages"></span>
          </div>
        `,
      });

      console.log(`PDF 已生成: ${pdfPath}`);
      const debugPath = join(this.outputDir, `${this.title}.html`);
      await writeFile(debugPath, htmlContent);
    } finally {
      await browser.close();
    }
  }
}
