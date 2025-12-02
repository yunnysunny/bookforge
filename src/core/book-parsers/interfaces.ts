import type { TreeNode } from '../../types';

export interface IBookParser {
  parse(input: string): Promise<TreeNode>;
}
