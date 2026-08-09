// HTML 生成器

import { copyFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
// import { fileURLToPath } from 'url';
import type {
  BookForgeConfig,
  Heading,
  NavLink,
  SearchIndexDocument,
  SearchIndexEntry,
  SearchIndexHeading,
  TreeNode,
} from '../types/index.js';
import { AbstractGenerator } from './abstract.generator.js';

export class HtmlGenerator extends AbstractGenerator {
  private sidebar: string = '';
  private readonly navLinks: NavLink[];
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

    // 生成全局搜索索引
    const pages = this.collectSearchIndexEntries(treeRoot);
    await this.generateSearchIndex(pages);
  }
  constructor(config: BookForgeConfig) {
    super(config);
    this.name = 'html';
    this.navLinks = config.navLinks || [];
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
    const toc = node.headings ? await this.generateTableOfContents(node.headings) : '';
    const htmlContent = await this.bookParser.toHtml(node);
    const html = await this.render('page.ejs', {
      bookTitle: this.title,
      title: node.title,
      sidebar: this.sidebar,
      toc,
      htmlContent,
      navLinks: this.navLinks,
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
  private async generateSidebarItems(nodes: TreeNode[], level: number): Promise<string> {
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
  private async generateTocItems(headings: Heading[], level: number): Promise<string> {
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
    await copyFile(join(__dirname, 'static/html', src), join(this.outputDir, dest));
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

  private async generateSearchIndex(pages: SearchIndexEntry[]): Promise<void> {
    const searchIndex: SearchIndexDocument = {
      generatedAt: new Date().toISOString(),
      pages,
    };
    await writeFile(
      join(this.outputDir, 'search-index.json'),
      JSON.stringify(searchIndex, null, 2),
      'utf-8',
    );
  }

  private collectSearchIndexEntries(treeRoot: TreeNode): SearchIndexEntry[] {
    const pages: SearchIndexEntry[] = [];
    let homeAssigned = false;
    const visit = (node: TreeNode) => {
      if (node.content) {
        pages.push({
          title: node.title,
          url: homeAssigned ? `${this.getFileName(node)}.html` : 'index.html',
          content: this.markdownToPlainText(node.content),
          headings: this.flattenHeadings(node.headings || []),
        });
        homeAssigned = true;
      }
      for (const child of node.children) {
        visit(child);
      }
    };

    for (const node of treeRoot.children) {
      visit(node);
    }

    return pages;
  }

  private flattenHeadings(headings: Heading[]): SearchIndexHeading[] {
    const items: SearchIndexHeading[] = [];
    const visit = (nodes: Heading[]) => {
      for (const heading of nodes) {
        items.push({
          id: heading.id,
          text: heading.text,
          level: heading.level,
        });
        visit(heading.children);
      }
    };
    visit(headings);
    return items;
  }

  private markdownToPlainText(markdown: string): string {
    return markdown
      .replace(/\r\n?/g, '\n')
      .replace(/^---[\s\S]*?\n---\n?/m, ' ')
      .replace(/```[\s\S]*?```/g, ' ')
      .replace(/`([^`]+)`/g, '$1')
      .replace(/!\[([^\]]*)\]\([^)]+\)/g, ' $1 ')
      .replace(/\[([^\]]+)\]\([^)]+\)/g, ' $1 ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/^\s{0,3}#{1,6}\s+/gm, '')
      .replace(/^\s{0,3}>\s?/gm, '')
      .replace(/^\s*[-*+]\s+/gm, '')
      .replace(/^\s*\d+\.\s+/gm, '')
      .replace(/[*_~|]/g, ' ')
      .replace(/\n+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }
}
