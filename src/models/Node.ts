export class Node {
  label: string;
  parents: Array<Node>;
  children: Array<Node>;
  id: string;
  color?: string;
  depth?: number;
  value?: number;
  isLeaf: boolean;

  constructor (label: string, parents: Array<Node>, children: Array<Node>, id: string, depth?: number, color?: string) {
    this.color = color
    this.depth = depth
    this.label = label
    this.parents = parents
    this.children = children
    this.id = id
    this.isLeaf = false
  }
}
