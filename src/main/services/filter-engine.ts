import { logger } from '../utils/logger';

export interface FilterRule {
  id?: number;
  sourceId?: number;
  name: string;
  type: 'keyword' | 'regex' | 'category' | 'time' | 'tag';
  conditions: string[];
  action: 'include' | 'exclude';
  enabled: boolean;
  priority?: number;
}

export interface CollectedItem {
  id?: number;
  source_id?: number;
  title: string;
  content: string;
  url?: string;
  author?: string;
  published_at?: string;
  category?: string;
  tags?: string;
  status?: string;
}

export class FilterEngine {
  /**
   * Apply filter rules to a collection of items
   */
  static applyFilters(items: CollectedItem[], rules: FilterRule[]): CollectedItem[] {
    if (!items || items.length === 0) return [];
    if (!rules || rules.length === 0) return items;

    logger.info(`Applying ${rules.length} filter rules to ${items.length} items`);

    // Sort rules by priority (higher priority first)
    const sortedRules = [...rules]
      .filter(rule => rule.enabled)
      .sort((a, b) => (b.priority || 0) - (a.priority || 0));

    const filteredItems = items.filter(item => {
      // Apply each rule until one matches
      for (const rule of sortedRules) {
        const matches = this.evaluateRule(item, rule);

        if (matches && rule.action === 'exclude') {
          // Excluded by this rule
          return false;
        }
        if (matches && rule.action === 'include') {
          // Explicitly included, skip remaining rules
          return true;
        }
      }

      // If no explicit include rule matched, keep the item
      return true;
    });

    logger.info(`Filtered down to ${filteredItems.length} items (${items.length - filteredItems.length} filtered out)`);
    return filteredItems;
  }

  /**
   * Evaluate a single filter rule against an item
   */
  private static evaluateRule(item: CollectedItem, rule: FilterRule): boolean {
    switch (rule.type) {
      case 'keyword':
        return this.matchKeyword(item, rule.conditions);

      case 'regex':
        return this.matchRegex(item, rule.conditions);

      case 'category':
        return this.matchCategory(item, rule.conditions);

      case 'time':
        return this.matchTime(item, rule.conditions);

      case 'tag':
        return this.matchTag(item, rule.conditions);

      default:
        logger.warn(`Unknown filter type: ${rule.type}`);
        return false;
    }
  }

  /**
   * Match keyword conditions (all keywords must be present)
   */
  private static matchKeyword(item: CollectedItem, conditions: string[]): boolean {
    if (!conditions || conditions.length === 0) return false;

    const text = `${item.title} ${item.content}`.toLowerCase();

    // All conditions must match (AND logic)
    return conditions.every(keyword =>
      text.includes(keyword.toLowerCase())
    );
  }

  /**
   * Match regex conditions (at least one regex must match)
   */
  private static matchRegex(item: CollectedItem, conditions: string[]): boolean {
    if (!conditions || conditions.length === 0) return false;

    const text = `${item.title} ${item.content}`;

    // At least one regex must match (OR logic)
    return conditions.some(pattern => {
      try {
        const regex = new RegExp(pattern, 'i');
        return regex.test(text);
      } catch (error) {
        logger.error('Invalid regex pattern: ' + pattern);
        return false;
      }
    });
  }

  /**
   * Match category conditions
   */
  private static matchCategory(item: CollectedItem, conditions: string[]): boolean {
    if (!item.category) return false;

    const category = item.category.toLowerCase();
    return conditions.some(condition =>
      category.includes(condition.toLowerCase())
    );
  }

  /**
   * Match time conditions (e.g., "last hour", "today", "last week")
   */
  private static matchTime(item: CollectedItem, conditions: string[]): boolean {
    if (!item.published_at) return false;

    const itemDate = new Date(item.published_at);
    const now = new Date();

    return conditions.some(condition => {
      switch (condition.toLowerCase()) {
        case 'last hour':
          const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
          return itemDate >= oneHourAgo;

        case 'today':
          const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          return itemDate >= today;

        case 'last 24 hours':
          const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
          return itemDate >= twentyFourHoursAgo;

        case 'last week':
          const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          return itemDate >= oneWeekAgo;

        case 'last month':
          const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          return itemDate >= oneMonthAgo;

        default:
          return false;
      }
    });
  }

  /**
   * Match tag conditions
   */
  private static matchTag(item: CollectedItem, conditions: string[]): boolean {
    if (!item.tags) return false;

    try {
      const tags = JSON.parse(item.tags);
      if (!Array.isArray(tags)) return false;

      return conditions.some(condition =>
        tags.some((tag: string) =>
          tag.toLowerCase().includes(condition.toLowerCase())
        )
      );
    } catch (error) {
      logger.error('Failed to parse tags: ' + (error as Error).message);
      return false;
    }
  }

  /**
   * Test a filter rule against sample items
   */
  static testRule(rule: FilterRule, items: CollectedItem[]): {
    matched: number;
    total: number;
    examples: CollectedItem[];
  } {
    const matched = this.applyFilters(items, [rule]);
    return {
      matched: matched.length,
      total: items.length,
      examples: matched.slice(0, 5), // First 5 examples
    };
  }
}
