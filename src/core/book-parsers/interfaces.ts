import type { TreeNode } from '../../types';

export interface IBookParser {
  parse(input: string): Promise<TreeNode>;
  toHtml(node: TreeNode): Promise<string>;
  getFileName(node: TreeNode): string;
}
