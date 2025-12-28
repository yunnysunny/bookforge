export type ParentId = string;
export type ChildId = string;
export interface Relation {
  parentId: ParentId;
  childId: ChildId;
  relativePath: string;
}
export class RelationManager {
  private parent2Children: Map<ParentId, ChildId[]>;
  // private child2Parent: Map<ChildId, ParentId>;
  constructor() {
    this.parent2Children = new Map();
    // this.child2Parent = new Map();
  }
  addRelation(relation: Relation) {
    this.parent2Children.set(relation.parentId, [
      ...(this.parent2Children.get(relation.parentId) || []),
      relation.childId,
    ]);
  }
  getTopEntities(): ParentId[] {
    const map = new Map(this.parent2Children);
    for (const [_, children] of map.entries()) {
      children.forEach(childId => {
        map.delete(childId);
      });
    }
    return Array.from(map.keys());
  }
  getChildren(parentId: ParentId): ChildId[] {
    return this.parent2Children.get(parentId) || [];
  }
}

