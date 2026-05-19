// src/utils/pathfinding.ts

interface GridNode {
  x: number;
  y: number;
  g: number;
  h: number;
  f: number;
  parent: GridNode | null;
}

/**
 * A* pathfinding on a grid.
 * @param grid - 2D array of cost values (higher = more expensive)
 * @param start - { x, y } start coordinates (column, row)
 * @param goal - { x, y } goal coordinates
 * @param diagonal - whether to allow diagonal movement (default false)
 * @returns { path: GridNode[], cost: number } - path nodes from start to goal inclusive, and total cost
 */
export function aStar(
  grid: number[][],
  start: { x: number; y: number },
  goal: { x: number; y: number },
  diagonal: boolean = false
): { path: { x: number; y: number }[]; cost: number } {
  const rows = grid.length;
  const cols = grid[0].length;

  // Heuristic: Manhattan distance (admissible)
  const heuristic = (a: { x: number; y: number }, b: { x: number; y: number }) => {
    return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
  };

  // Directions: 4‑way or 8‑way
  const directions = diagonal
    ? [
        [-1, -1], [-1, 0], [-1, 1],
        [0, -1],           [0, 1],
        [1, -1],  [1, 0],  [1, 1]
      ]
    : [
        [-1, 0], [1, 0], [0, -1], [0, 1]
      ];

  const openSet: GridNode[] = [];
  const closedSet: Set<string> = new Set();
  const startNode: GridNode = {
    x: start.x,
    y: start.y,
    g: 0,
    h: heuristic(start, goal),
    f: heuristic(start, goal),
    parent: null,
  };
  openSet.push(startNode);

  const nodeMap = new Map<string, GridNode>();
  nodeMap.set(`${start.x},${start.y}`, startNode);

  while (openSet.length > 0) {
    // Find node with lowest f in openSet
    let current = openSet.reduce((a, b) => (a.f < b.f ? a : b));
    if (current.x === goal.x && current.y === goal.y) {
      // Reconstruct path
      const path: { x: number; y: number }[] = [];
      let node: GridNode | null = current;
      while (node) {
        path.unshift({ x: node.x, y: node.y });
        node = node.parent;
      }
      return { path, cost: current.g };
    }

    // Move current from openSet to closedSet
    const idx = openSet.indexOf(current);
    openSet.splice(idx, 1);
    closedSet.add(`${current.x},${current.y}`);

    // Explore neighbors
    for (const [dx, dy] of directions) {
      const nx = current.x + dx;
      const ny = current.y + dy;
      if (nx < 0 || nx >= cols || ny < 0 || ny >= rows) continue;
      if (closedSet.has(`${nx},${ny}`)) continue;

      // Movement cost: use grid cost at neighbor cell (or average? we'll use neighbor's cost)
      let moveCost = grid[ny][nx];
      // If diagonal, add extra cost (√2 ≈ 1.414) but we keep it simple for now
      if (diagonal && dx !== 0 && dy !== 0) {
        moveCost *= Math.SQRT2;
      }
      const tentativeG = current.g + moveCost;

      const neighborKey = `${nx},${ny}`;
      let neighbor = nodeMap.get(neighborKey);
      if (!neighbor) {
        neighbor = {
          x: nx,
          y: ny,
          g: tentativeG,
          h: heuristic({ x: nx, y: ny }, goal),
          f: tentativeG + heuristic({ x: nx, y: ny }, goal),
          parent: current,
        };
        nodeMap.set(neighborKey, neighbor);
        openSet.push(neighbor);
      } else if (tentativeG < neighbor.g) {
        neighbor.g = tentativeG;
        neighbor.f = tentativeG + neighbor.h;
        neighbor.parent = current;
        // Update position in openSet if needed (no need to re-sort, we just find min each iteration)
      }
    }
  }

  // No path found
  return { path: [], cost: Infinity };
}