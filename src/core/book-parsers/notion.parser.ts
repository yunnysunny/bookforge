import type { TreeNode } from '../../types';
import { MarkdownRelationManager } from '../../utils/markdown';
import { AbstractParser } from './abstract.parser';

export class NotionParser extends AbstractParser {
  private parsedNodes = new Set<string>();
  async doParse(input: string): Promise<TreeNode> {
    const rootNode: TreeNode = {
      title: 'Root',
      children: [],
    };
    const markdownUtils = new MarkdownRelationManager({
      inputPath: input,
      ignorePatterns: this.options.ignorePatterns,
    });
    const topEntities = await markdownUtils.parseRelations();
    for (const topEntity of topEntities) {
      // const children = await markdownUtils.getChildren(topEntity);
      if (this.parsedNodes.has(topEntity)) {
        continue;
      }

      const node = await this.markdownFileToTreeNode(topEntity);
      if (!node) {
        continue;
      }
      rootNode.children.push(node);
      this.parsedNodes.add(topEntity);
      await this.buildChildrenTree(node, markdownUtils);
    }
    return rootNode;
  }
  private async buildChildrenTree(
    parent: TreeNode,
    markdownUtils: MarkdownRelationManager,
  ): Promise<TreeNode> {
    const children = markdownUtils.getChildren(parent.path as string);
    for (const child of children) {
      if (this.parsedNodes.has(child)) {
        continue;
      }
      this.parsedNodes.add(child);
      const childNode = await this.markdownFileToTreeNode(child);
      if (!childNode) {
        continue;
      }
      parent.children.push(childNode as TreeNode);
      const subChildren = markdownUtils.getChildren(child);
      if (subChildren.length === 0) {
        continue;
      }
      await this.buildChildrenTree(childNode as TreeNode, markdownUtils);
    }
    return parent;
  }
  /**
   * 获取文件名
   */
  public getFileName(node: TreeNode): string {
    return (
      encodeURIComponent(node.title)
        .toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim()
    );
  }
}
