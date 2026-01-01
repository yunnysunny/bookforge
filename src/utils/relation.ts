export type ParentId = string;
export type ChildId = string;
export interface Child {
  childId: ChildId;
  relativePath: string;
}
export interface Relation extends Child {
  parentId: ParentId;
}
export class RelationManager {
  private parent2Children: Map<ParentId, Child[]>;
  // private child2Parent: Map<ChildId, ParentId>;
  constructor() {
    this.parent2Children = new Map();
    // this.child2Parent = new Map();
  }
  addRelation(relation: Relation) {
    const { parentId, ...rest } = relation;
    this.parent2Children.set(parentId, [
      ...(this.parent2Children.get(parentId) || []),
      rest,
    ]);
  }
  getTopEntities(): ParentId[] {
    const map = new Map(this.parent2Children);
    for (const [_, children] of map.entries()) {
      children.forEach(child => {
        map.delete(child.childId);
      });
    }
    return Array.from(map.keys());
  }
  getChildren(parentId: ParentId): Child[] {
    return this.parent2Children.get(parentId) || [];
  }
}

