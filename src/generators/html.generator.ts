// HTML 生成器

import { copyFile, writeFile } from 'fs/promises';
import { join } from 'path';
// import { fileURLToPath } from 'url';
import type { BookForgeConfig, Heading, TreeNode } from '../types/index.js';
import { AbstractGenerator } from './abstract.generator.js';

export class HtmlGenerator extends AbstractGenerator {
  private sidebar: string = '';
  protected async doGenerate(treeRoot: TreeNode): Promise<void> {
    this.sidebar = await this.generateSidebar(treeRoot);
    // 生成主页面
    await this.generateIndexPage(treeRoot);

    // 生成各个文档页面
    await this.generateDocumentPages(treeRoot);

    // 生成样式文件
    await this.copyStyles();

    // 生成脚本文件
    await this.copyScripts();
  }
  constructor(config: BookForgeConfig) {
    super(config);
    this.name = 'html';
  }

  /**
   * 生成主页面
   */
  private async generateIndexPage(tree: TreeNode): Promise<void> {
    const html = await this.generateSinglePageHtml({
      title: this.title,
      path: tree.children[0]?.path as string,
      content: tree.children[0]?.content || '',
      headings: tree.children[0]?.headings || [],
      children: tree.children[0]?.children || [],
    });
    const indexPath = join(this.outputDir, 'index.html');
    await writeFile(indexPath, html, 'utf-8');
  }

  /**
   * 生成文档页面
   */
  private async generateDocumentPages(treeRoot: TreeNode): Promise<void> {
    await Promise.all(
      treeRoot.children.map(async (node) => {
        if (node.content) {
          const html = await this.generateSinglePageHtml(node);
          const fileName = `${this.getFileName(node)}.html`;
          const filePath = join(this.outputDir, fileName);
          await writeFile(filePath, html, 'utf-8');
          this.logger.info(`Generated document page: ${fileName}`);
        }
        if (node.children.length > 0) {
          await this.generateDocumentPages(node);
        }
      }),
    );
  }

  /**
   * 生成 HTML 模板
   */
  private async generateSinglePageHtml(node: TreeNode): Promise<string> {
    const toc = node.headings
      ? await this.generateTableOfContents(node.headings)
      : '';
    const htmlContent = await this.bookParser.toHtml(node);
    const html = await this.render('page.ejs', {
      title: node.title,
      sidebar: this.sidebar,
      toc,
      htmlContent,
    });

    return html;
  }

  /**
   * 生成侧边栏
   */
  private async generateSidebar(tree: TreeNode): Promise<string> {
    return await this.generateSidebarItems(tree.children, 0);
  }

  /**
   * 生成侧边栏项目
   */
  private async generateSidebarItems(
    nodes: TreeNode[],
    level: number,
  ): Promise<string> {
    //     let html = '';

    //     for (const node of nodes) {
    //       const indent = '  '.repeat(level);
    //       const fileName = node.path ? this.getFileName(node.title) + '.html' : 'index.html';

    //       html += `${indent}<div class="sidebar-item level-${level}">
    // ${indent}  <a href="${fileName}" class="sidebar-link">${node.title}</a>
    // `;

    //       if (node.children.length > 0) {
    //         html += `${indent}  <div class="sidebar-children">
    // ${this.generateSidebarItems(node.children, level + 1)}
    // ${indent}  </div>
    // `;
    //       }

    //       html += `${indent}</div>
    // `;
    //     }
    const html = await this.render('left-side.ejs', {
      nodes,
      level,
      getFileName: this.getFileName.bind(this),
    });
    // console.log(nodes.map(node => node.title), '-->', html);
    return html;
  }

  /**
   * 生成目录
   */
  private async generateTableOfContents(headings: Heading[]): Promise<string> {
    return await this.generateTocItems(headings, 0);
  }

  /**
   * 生成目录项目
   */
  private async generateTocItems(
    headings: Heading[],
    level: number,
  ): Promise<string> {
    //     let html = '<ul class="toc-list">';

    //     for (const heading of headings) {
    //       html += `<li class="toc-item level-${heading.level}">
    //         <a href="#${heading.id}" class="toc-link">${heading.text}</a>
    // `;

    //       if (heading.children.length > 0) {
    //         html += this.generateTocItems(heading.children, level + 1);
    //       }

    //       html += '</li>';
    //     }

    //     html += '</ul>';
    const html = await this.render('toc.ejs', {
      headings,
      level,
    });
    return html;
  }
  private async copyFile(src: string, dest: string): Promise<void> {
    await copyFile(
      join(__dirname, 'static/html', src),
      join(this.outputDir, dest),
    );
  }

  /**
   * 生成样式文件
   */
  private async copyStyles(): Promise<void> {
    await this.copyFile('styles.css', 'styles.css');
  }

  /**
   * 生成脚本文件
   */
  private async copyScripts(): Promise<void> {
    await this.copyFile('script.js', 'script.js');
  }
}
