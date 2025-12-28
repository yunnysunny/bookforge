// PDF 生成器
import { join } from 'path';
import puppeteer from 'puppeteer';
import type { TreeNode } from '../types';
import { AbstractGenerator } from './AbstractGenerator';

export class PdfGenerator extends AbstractGenerator {
  constructor(outputDir: string) {
    super(outputDir);
    this.name = 'pdf';
  }

  protected async doGenerate(tree: TreeNode, title: string): Promise<void> {
    const htmlContent = await this.generateHtmlContent(tree, title);
    await this.generatePdfFromHtml(htmlContent, title);
  }

  /**
   * 生成 HTML 内容
   */
  private async generateHtmlContent(
    tree: TreeNode,
    title: string,
  ): Promise<string> {
    const toc = await this.generateTableOfContents(tree);
    const content = await this.generateContent(tree);
    const html = await this.render('page.ejs', {
      title,
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

  /**
   * 生成内容
   */
  private async generateContent(tree: TreeNode): Promise<string> {
    // let html = '';

    //     for (const node of tree.children) {
    //       if (node.content) {
    //         html += `<div class="content">
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
    const data: { title: string; content: string }[] = [];
    for (const node of tree.children) {
      if (node.content) {
        data.push({
          title: node.title,
          content: await this.markdownParser.toHtml(node.content, {
            contentPath: node.path as string,
            destDir: this.outputDir,
          }),
        });
      }
    }
    const html = await this.render('content.ejs', {
      data,
    });
    return html;
  }

  /**
   * 使用 Puppeteer 生成 PDF
   */
  private async generatePdfFromHtml(
    htmlContent: string,
    title: string,
  ): Promise<void> {
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    try {
      const page = await browser.newPage();

      await page.setContent(htmlContent, {
        waitUntil: 'networkidle0',
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
    } finally {
      await browser.close();
    }
  }
}
