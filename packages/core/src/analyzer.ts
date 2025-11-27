import { Story, NodeId, KnotId } from './types';

/**
 * Represents an issue found during story analysis.
 */
export interface AnalysisIssue {
  /** The type of issue detected */
  code: 'INESCAPABLE_LOOP' | 'DEAD_END' | 'UNREACHABLE';
  /** Example path showing where the issue occurs */
  pathExample: NodeId[];
  /** For loop issues, the strongly connected component nodes */
  scc?: NodeId[];
  /** Human-readable description of the issue */
  message: string;
}

/**
 * Result of analyzing a story for structural issues.
 */
export interface AnalysisResult {
  /** List of issues found in the story */
  issues: AnalysisIssue[];
}

/**
 * Analyzes a story definition for common structural issues.
 *
 * This function checks for:
 * - **Unreachable nodes**: Nodes that cannot be reached from the entry point
 * - **Dead ends**: Nodes with no choices and no ending marker
 * - **Inescapable loops**: Loops that cannot be exited (no ending, no way out)
 *
 * @example
 * ```typescript
 * const result = analyzeStory(myStory);
 * if (result.issues.length > 0) {
 *   console.warn('Story has issues:', result.issues);
 * }
 * ```
 *
 * @typeParam TEffect - The type of effects used in the story
 * @param story - The story definition to analyze
 * @returns Analysis result containing any issues found
 */
export function analyzeStory<TEffect>(story: Story<TEffect>): AnalysisResult {
  const issues: AnalysisIssue[] = [];

  // Build graph of all nodes
  // Map internal unique ID "knotId:nodeId" -> list of outgoing IDs
  const adjacency = new Map<string, string[]>();
  const allNodes = new Set<string>();
  const terminalNodes = new Set<string>();

  // Helper to make unique ID
  const uId = (k: KnotId, n: NodeId) => `${k}:${n}`;
  const parseUid = (u: string) => {
    const parts = u.split(':');
    return { knotId: parts[0], nodeId: parts[1] };
  };

  // 1. Build directed graph
  for (const [knotId, knot] of Object.entries(story.knots)) {
    for (const [nodeId, node] of Object.entries(knot.nodes)) {
      const u = uId(knotId, nodeId);
      allNodes.add(u);

      const outgoing: string[] = [];

      if (node.choices) {
        for (const choice of node.choices) {
          const targetKnot = choice.target.knot || knotId;
          const targetNode = choice.target.node;
          outgoing.push(uId(targetKnot, targetNode));
        }
      }

      adjacency.set(u, outgoing);

      if (node.ending) {
        terminalNodes.add(u);
      }
    }
  }

  // 2. Unreachable content
  // BFS from entryKnot.entryNode
  const visited = new Set<string>();
  const queue: string[] = [];

  const entryUid = uId(story.entryKnot, story.knots[story.entryKnot].entryNode);
  if (allNodes.has(entryUid)) {
    queue.push(entryUid);
    visited.add(entryUid);
  } else {
    issues.push({
      code: 'UNREACHABLE',
      pathExample: [],
      message: `Entry node ${entryUid} does not exist.`,
    });
  }

  while (queue.length > 0) {
    const curr = queue.shift()!;
    const neighbors = adjacency.get(curr) || [];
    for (const next of neighbors) {
      // Note: next might point to a non-existent node, we should probably check that somewhere?
      // But for reachability, if it's in allNodes, we mark it.
      if (allNodes.has(next) && !visited.has(next)) {
        visited.add(next);
        queue.push(next);
      }
    }
  }

  for (const u of allNodes) {
    if (!visited.has(u)) {
      const { knotId, nodeId } = parseUid(u);
      issues.push({
        code: 'UNREACHABLE',
        pathExample: [nodeId], // Just the node itself as example
        message: `Node ${knotId}.${nodeId} is unreachable from start.`,
      });
    }
  }

  // 3. Dead ends
  // Nodes with no outgoing edges, not marked as ending.
  for (const u of allNodes) {
    if (visited.has(u)) {
      // Only care about reachable nodes
      const outgoing = adjacency.get(u) || [];
      if (outgoing.length === 0 && !terminalNodes.has(u)) {
        const { knotId, nodeId } = parseUid(u);
        issues.push({
          code: 'DEAD_END',
          pathExample: [nodeId],
          message: `Node ${knotId}.${nodeId} is a dead end (no choices and not an ending).`,
        });
      }
    }
  }

  // 4. Inescapable loops
  // Strongly connected components (Tarjan's algorithm)
  // We only care about SCCs reachable from start.

  // Only analyze visited nodes
  const reachableNodes = Array.from(visited);

  let index = 0;
  const indices = new Map<string, number>();
  const lowLink = new Map<string, number>();
  const stack: string[] = [];
  const onStack = new Set<string>();
  const sccs: string[][] = [];

  function strongConnect(v: string) {
    indices.set(v, index);
    lowLink.set(v, index);
    index++;
    stack.push(v);
    onStack.add(v);

    const neighbors = adjacency.get(v) || [];
    for (const w of neighbors) {
      if (!visited.has(w)) continue; // Ignore edges to unreachable nodes (though strictly if v is reachable w should be too if edge exists)

      if (!indices.has(w)) {
        strongConnect(w);
        lowLink.set(v, Math.min(lowLink.get(v)!, lowLink.get(w)!));
      } else if (onStack.has(w)) {
        lowLink.set(v, Math.min(lowLink.get(v)!, indices.get(w)!));
      }
    }

    if (lowLink.get(v) === indices.get(v)) {
      const scc: string[] = [];
      let w: string;
      do {
        w = stack.pop()!;
        onStack.delete(w);
        scc.push(w);
      } while (w !== v);
      sccs.push(scc);
    }
  }

  for (const v of reachableNodes) {
    if (!indices.has(v)) {
      strongConnect(v);
    }
  }

  // Analyze SCCs
  for (const scc of sccs) {
    // If SCC has more than one node, OR (one node with self edge)
    // AND no node in SCC has ending
    // AND every outgoing edge from the SCC stays within the SCC

    let isLoop = false;
    if (scc.length > 1) {
      isLoop = true;
    } else {
      // Single node, check for self edge
      const u = scc[0];
      const neighbors = adjacency.get(u) || [];
      if (neighbors.includes(u)) {
        isLoop = true;
      }
    }

    if (!isLoop) continue;

    // Check if any node in SCC is an ending
    const hasEnding = scc.some((u) => terminalNodes.has(u));
    if (hasEnding) continue; // Can escape via ending

    // Check if any edge leaves the SCC
    let canEscape = false;
    const sccSet = new Set(scc);
    for (const u of scc) {
      const neighbors = adjacency.get(u) || [];
      for (const w of neighbors) {
        if (!sccSet.has(w)) {
          canEscape = true;
          break;
        }
      }
      if (canEscape) break;
    }

    if (!canEscape) {
      issues.push({
        code: 'INESCAPABLE_LOOP',
        pathExample: scc.map((u) => parseUid(u).nodeId),
        scc: scc.map((u) => parseUid(u).nodeId),
        message: `Inescapable loop detected involving nodes: ${scc
          .map((u) => {
            const p = parseUid(u);
            return `${p.knotId}.${p.nodeId}`;
          })
          .join(', ')}`,
      });
    }
  }

  return { issues };
}
