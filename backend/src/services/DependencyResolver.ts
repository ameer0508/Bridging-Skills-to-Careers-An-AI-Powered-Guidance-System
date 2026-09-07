export interface DependencyItem {
  targetSkill?: string;
  dependencies?: string[];
  [key: string]: unknown;
}

export class DependencyResolver {
  /**
   * Sorts recommendations into tiers based on their dependencies using a topological sort approach.
   * Prevents cyclic dependencies and impossible learning sequences.
   */
  public static resolveTiers(items: DependencyItem[]): DependencyItem[][] {
    const tiers: DependencyItem[][] = [];
    const remainingItems = [...items];
    const resolvedSkillNames = new Set<string>();

    // Safety fallback for maximum iterations to prevent infinite loops from cyclic deps
    let iterations = 0;
    const maxIterations = items.length + 5;

    while (remainingItems.length > 0 && iterations < maxIterations) {
      iterations++;

      // Find items whose dependencies are all resolved
      const currentTier = remainingItems.filter(item => {
        if (!item.dependencies || item.dependencies.length === 0) return true;
        return item.dependencies.every((dep: string) => {
          const normalizedDep = dep.toLowerCase();
          for (const resolved of resolvedSkillNames) {
            if (resolved.includes(normalizedDep) || normalizedDep.includes(resolved)) {
              return true;
            }
          }
          return false;
        });
      });

      // If we can't find any items without unresolved dependencies, force add remaining items
      if (currentTier.length === 0) {
        tiers.push([...remainingItems]);
        break;
      }

      tiers.push(currentTier);

      // Mark these items' skills as resolved for the next tier
      currentTier.forEach(item => {
        if (item.targetSkill) {
          resolvedSkillNames.add(item.targetSkill.toLowerCase());
        }
      });

      // Remove currentTier items from remainingItems
      for (const item of currentTier) {
        const index = remainingItems.findIndex(r => r === item);
        if (index > -1) remainingItems.splice(index, 1);
      }
    }

    return tiers;
  }
}

export default DependencyResolver;
