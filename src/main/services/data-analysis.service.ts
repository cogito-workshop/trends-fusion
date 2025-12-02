import { logger } from '../utils/logger.js';

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
  created_at?: string;
}

export interface KeywordFrequency {
  keyword: string;
  count: number;
  frequency: number;
  trend: 'rising' | 'falling' | 'stable';
  sources: number[];
}

export interface TemporalPattern {
  period: string;
  itemCount: number;
  averagePerDay: number;
  trend: number; // percentage change
  peakHour?: number;
  peakDay?: string;
}

export interface Trend {
  id: string;
  name: string;
  score: number;
  category: string;
  strength: 'weak' | 'moderate' | 'strong' | 'very-strong';
  firstSeen: string;
  lastSeen: string;
  totalMentions: number;
  growthRate: number;
  sources: string[];
  keywords: string[];
}

export interface Anomaly {
  id: string;
  type: 'spike' | 'drop' | 'unusual-pattern';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  detectedAt: string;
  affectedPeriod: string;
  deviation: number; // percentage
  expected: number;
  actual: number;
}

export interface AnalysisResult {
  id: number;
  sourceId?: number;
  analysisType: 'keyword-frequency' | 'temporal-pattern' | 'trend-detection' | 'anomaly-detection';
  period: string;
  startDate: string;
  endDate: string;
  results: any;
  createdAt: string;
}

export class DataAnalysisService {
  private static instance: DataAnalysisService;
  private getCollectionDatabase: (() => any) | null = null;

  private constructor() {
    logger.info('DataAnalysisService initialized');
  }

  static getInstance(): DataAnalysisService {
    if (!DataAnalysisService.instance) {
      DataAnalysisService.instance = new DataAnalysisService();
    }
    return DataAnalysisService.instance;
  }

  setCollectionDatabase(getDb: () => any) {
    this.getCollectionDatabase = getDb;
  }

  /**
   * Analyze keyword frequency across collected items
   */
  async analyzeKeywordFrequency(sourceId?: number, days: number = 30): Promise<KeywordFrequency[]> {
    if (!this.getCollectionDatabase) {
      throw new Error('Collection database not available');
    }

    const db = this.getCollectionDatabase();
    const dao = db.getDataSourceDAO();

    // Calculate date range
    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - (days * 24 * 60 * 60 * 1000));

    // Get collected items
    const items = dao.getCollectedItems(sourceId, undefined, 10000, 0);
    const relevantItems = items.filter(item => {
      if (!item.created_at) return false;
      const itemDate = new Date(item.created_at);
      return itemDate >= startDate && itemDate <= endDate;
    });

    logger.info(`Analyzing ${relevantItems.length} items for keyword frequency`);

    // Extract and count keywords
    const keywordMap = new Map<string, { count: number; sources: Set<number>; titles: string[] }>();

    for (const item of relevantItems) {
      const text = `${item.title} ${item.content}`.toLowerCase();
      const words = this.extractKeywords(text);

      // Count unique occurrences per item
      const itemKeywords = new Set(words);

      for (const keyword of itemKeywords) {
        if (keyword.length < 3) continue; // Skip short words

        if (!keywordMap.has(keyword)) {
          keywordMap.set(keyword, {
            count: 0,
            sources: new Set(),
            titles: []
          });
        }

        const entry = keywordMap.get(keyword)!;
        entry.count++;
        if (item.source_id) {
          entry.sources.add(item.source_id);
        }
        if (item.title) {
          entry.titles.push(item.title);
        }
      }
    }

    // Convert to frequency analysis
    const totalItems = relevantItems.length;
    const frequencies: KeywordFrequency[] = [];

    for (const [keyword, data] of keywordMap.entries()) {
      // Determine trend (simplified)
      const trend = this.determineTrend(keyword, relevantItems);

      frequencies.push({
        keyword,
        count: data.count,
        frequency: Math.round((data.count / totalItems) * 10000) / 100, // percentage
        trend,
        sources: Array.from(data.sources)
      });
    }

    // Sort by count descending and take top 100
    frequencies.sort((a, b) => b.count - a.count);
    return frequencies.slice(0, 100);
  }

  /**
   * Analyze temporal patterns (hourly, daily, weekly)
   */
  async analyzeTemporalPatterns(sourceId?: number, days: number = 30): Promise<TemporalPattern[]> {
    if (!this.getCollectionDatabase) {
      throw new Error('Collection database not available');
    }

    const db = this.getCollectionDatabase();
    const dao = db.getDataSourceDAO();

    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - (days * 24 * 60 * 60 * 1000));

    const items = dao.getCollectedItems(sourceId, undefined, 10000, 0);
    const relevantItems = items.filter(item => {
      if (!item.created_at) return false;
      const itemDate = new Date(item.created_at);
      return itemDate >= startDate && itemDate <= endDate;
    });

    logger.info(`Analyzing temporal patterns for ${relevantItems.length} items`);

    const patterns: TemporalPattern[] = [];

    // Daily pattern
    const dailyMap = new Map<string, number>();
    for (const item of relevantItems) {
      if (!item.created_at) continue;
      const date = new Date(item.created_at);
      const dayKey = date.toISOString().split('T')[0]; // YYYY-MM-DD
      dailyMap.set(dayKey, (dailyMap.get(dayKey) || 0) + 1);
    }

    const dailyValues = Array.from(dailyMap.values());
    const avgPerDay = dailyValues.length > 0
      ? Math.round((dailyValues.reduce((a, b) => a + b, 0) / dailyValues.length) * 100) / 100
      : 0;

    // Calculate trend (first half vs second half)
    const firstHalf = dailyValues.slice(0, Math.floor(dailyValues.length / 2));
    const secondHalf = dailyValues.slice(Math.floor(dailyValues.length / 2));
    const firstAvg = firstHalf.length > 0 ? firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length : 0;
    const secondAvg = secondHalf.length > 0 ? secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length : 0;
    const trend = firstAvg > 0 ? Math.round(((secondAvg - firstAvg) / firstAvg) * 100) : 0;

    patterns.push({
      period: 'daily',
      itemCount: relevantItems.length,
      averagePerDay: avgPerDay,
      trend
    });

    // Hourly pattern
    const hourlyMap = new Map<number, number>();
    for (const item of relevantItems) {
      if (!item.created_at) continue;
      const date = new Date(item.created_at);
      const hour = date.getHours();
      hourlyMap.set(hour, (hourlyMap.get(hour) || 0) + 1);
    }

    let peakHour = 0;
    let maxHourCount = 0;
    hourlyMap.forEach((count, hour) => {
      if (count > maxHourCount) {
        maxHourCount = count;
        peakHour = hour;
      }
    });

    patterns.push({
      period: 'hourly',
      itemCount: relevantItems.length,
      averagePerDay: avgPerDay / 24,
      trend,
      peakHour
    });

    // Weekly pattern
    const weeklyMap = new Map<string, number>();
    const weekDays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    for (const item of relevantItems) {
      if (!item.created_at) continue;
      const date = new Date(item.created_at);
      const dayOfWeek = date.getDay();
      weeklyMap.set(weekDays[dayOfWeek], (weeklyMap.get(weekDays[dayOfWeek]) || 0) + 1);
    }

    let peakDay = 'Monday';
    let maxDayCount = 0;
    weeklyMap.forEach((count, day) => {
      if (count > maxDayCount) {
        maxDayCount = count;
        peakDay = day;
      }
    });

    patterns.push({
      period: 'weekly',
      itemCount: relevantItems.length,
      averagePerDay: avgPerDay / 7,
      trend,
      peakDay
    });

    return patterns;
  }

  /**
   * Detect trending topics
   */
  async detectTrends(sourceId?: number, days: number = 7): Promise<Trend[]> {
    if (!this.getCollectionDatabase) {
      throw new Error('Collection database not available');
    }

    const db = this.getCollectionDatabase();
    const dao = db.getDataSourceDAO();

    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - (days * 24 * 60 * 60 * 1000));

    const items = dao.getCollectedItems(sourceId, undefined, 10000, 0);
    const relevantItems = items.filter(item => {
      if (!item.created_at) return false;
      const itemDate = new Date(item.created_at);
      return itemDate >= startDate && itemDate <= endDate;
    });

    logger.info(`Detecting trends in ${relevantItems.length} items`);

    // Extract keywords and their frequency
    const keywordMap = new Map<string, { count: number; firstSeen: Date; lastSeen: Date; sources: Set<number> }>();

    for (const item of relevantItems) {
      if (!item.created_at) continue;
      const itemDate = new Date(item.created_at);
      const text = `${item.title} ${item.content}`.toLowerCase();
      const keywords = this.extractKeywords(text);

      for (const keyword of keywords) {
        if (keyword.length < 4) continue;

        if (!keywordMap.has(keyword)) {
          keywordMap.set(keyword, {
            count: 0,
            firstSeen: itemDate,
            lastSeen: itemDate,
            sources: new Set()
          });
        }

        const entry = keywordMap.get(keyword)!;
        entry.count++;
        if (itemDate < entry.firstSeen) entry.firstSeen = itemDate;
        if (itemDate > entry.lastSeen) entry.lastSeen = itemDate;
        if (item.source_id) entry.sources.add(item.source_id);
      }
    }

    // Calculate trends
    const trends: Trend[] = [];

    for (const [keyword, data] of keywordMap.entries()) {
      if (data.count < 3) continue; // Minimum threshold

      // Calculate growth rate (simplified)
      const totalDays = Math.max(1, Math.ceil((data.lastSeen.getTime() - data.firstSeen.getTime()) / (1000 * 60 * 60 * 24)));
      const dailyAverage = data.count / totalDays;
      const expectedGrowth = 0.1; // 10% growth expected
      const growthRate = Math.round((dailyAverage - expectedGrowth) * 100);

      // Determine strength
      let strength: 'weak' | 'moderate' | 'strong' | 'very-strong';
      if (data.count < 5) strength = 'weak';
      else if (data.count < 15) strength = 'moderate';
      else if (data.count < 50) strength = 'strong';
      else strength = 'very-strong';

      // Calculate score (combination of count, growth, and source diversity)
      const sourceScore = Math.min(100, data.sources.size * 20);
      const countScore = Math.min(100, data.count * 5);
      const growthScore = Math.max(0, Math.min(100, growthRate + 50));
      const score = Math.round((countScore * 0.5 + growthScore * 0.3 + sourceScore * 0.2));

      trends.push({
        id: `trend-${keyword}`,
        name: keyword,
        score,
        category: this.categorizeKeyword(keyword),
        strength,
        firstSeen: data.firstSeen.toISOString(),
        lastSeen: data.lastSeen.toISOString(),
        totalMentions: data.count,
        growthRate,
        sources: Array.from(data.sources).map(s => s.toString()),
        keywords: [keyword]
      });
    }

    // Sort by score descending
    trends.sort((a, b) => b.score - a.score);
    return trends.slice(0, 50);
  }

  /**
   * Detect anomalies in data collection
   */
  async detectAnomalies(sourceId?: number, days: number = 30): Promise<Anomaly[]> {
    if (!this.getCollectionDatabase) {
      throw new Error('Collection database not available');
    }

    const db = this.getCollectionDatabase();
    const dao = db.getDataSourceDAO();

    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - (days * 24 * 60 * 60 * 1000));

    const items = dao.getCollectedItems(sourceId, undefined, 10000, 0);
    const relevantItems = items.filter(item => {
      if (!item.created_at) return false;
      const itemDate = new Date(item.created_at);
      return itemDate >= startDate && itemDate <= endDate;
    });

    logger.info(`Detecting anomalies in ${relevantItems.length} items`);

    const anomalies: Anomaly[] = [];

    // Group by day
    const dailyMap = new Map<string, number>();
    for (const item of relevantItems) {
      if (!item.created_at) continue;
      const date = new Date(item.created_at);
      const dayKey = date.toISOString().split('T')[0];
      dailyMap.set(dayKey, (dailyMap.get(dayKey) || 0) + 1);
    }

    const dailyValues = Array.from(dailyMap.values());
    const avg = dailyValues.length > 0
      ? dailyValues.reduce((a, b) => a + b, 0) / dailyValues.length
      : 0;

    const stdDev = Math.sqrt(
      dailyValues.reduce((sum, val) => sum + Math.pow(val - avg, 2), 0) / dailyValues.length
    );

    // Detect spikes and drops
    dailyMap.forEach((count, day) => {
      const deviation = stdDev > 0 ? (count - avg) / stdDev : 0;
      const deviationPercent = avg > 0 ? ((count - avg) / avg) * 100 : 0;

      if (Math.abs(deviation) > 2) { // More than 2 standard deviations
        let severity: 'low' | 'medium' | 'high' | 'critical';
        let type: 'spike' | 'drop' | 'unusual-pattern';

        if (deviation > 3) severity = 'critical';
        else if (deviation > 2.5) severity = 'high';
        else if (deviation > 2) severity = 'medium';
        else severity = 'low';

        if (deviation > 0) type = 'spike';
        else type = 'drop';

        anomalies.push({
          id: `anomaly-${day}`,
          type,
          severity,
          description: `${type === 'spike' ? 'Spike' : 'Drop'} detected on ${day}: ${count} items (${Math.abs(Math.round(deviationPercent))}% ${deviation > 0 ? 'above' : 'below'} average)`,
          detectedAt: new Date().toISOString(),
          affectedPeriod: day,
          deviation: Math.round(deviationPercent),
          expected: Math.round(avg),
          actual: count
        });
      }
    });

    return anomalies;
  }

  /**
   * Perform comprehensive analysis
   */
  async performComprehensiveAnalysis(sourceId?: number, days: number = 30): Promise<{
    keywordFrequency: KeywordFrequency[];
    temporalPatterns: TemporalPattern[];
    trends: Trend[];
    anomalies: Anomaly[];
    summary: {
      totalItems: number;
      dateRange: string;
      averagePerDay: number;
      topKeyword: string;
      mostActiveHour: number;
      trendCount: number;
      anomalyCount: number;
    };
  }> {
    logger.info(`Starting comprehensive analysis for ${days} days`);

    const [keywordFrequency, temporalPatterns, trends, anomalies] = await Promise.all([
      this.analyzeKeywordFrequency(sourceId, days),
      this.analyzeTemporalPatterns(sourceId, days),
      this.detectTrends(sourceId, days),
      this.detectAnomalies(sourceId, days)
    ]);

    // Calculate summary
    const totalItems = keywordFrequency.reduce((sum, kf) => sum + kf.count, 0);
    const dateRange = `${days} days`;
    const averagePerDay = Math.round((totalItems / days) * 100) / 100;
    const topKeyword = keywordFrequency.length > 0 ? keywordFrequency[0].keyword : 'N/A';
    const mostActiveHour = temporalPatterns.find(p => p.period === 'hourly')?.peakHour || 0;
    const trendCount = trends.length;
    const anomalyCount = anomalies.length;

    const summary = {
      totalItems,
      dateRange,
      averagePerDay,
      topKeyword,
      mostActiveHour,
      trendCount,
      anomalyCount
    };

    logger.info('Comprehensive analysis completed: ' + JSON.stringify(summary));

    return {
      keywordFrequency,
      temporalPatterns,
      trends,
      anomalies,
      summary
    };
  }

  /**
   * Helper: Extract keywords from text
   */
  private extractKeywords(text: string): string[] {
    // Remove punctuation and split into words
    const words = text
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .map(word => word.trim().toLowerCase())
      .filter(word => word.length > 2);

    // Filter out common stop words
    const stopWords = new Set([
      'the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'can', 'had', 'her', 'was', 'one', 'our', 'out', 'day', 'get',
      'has', 'him', 'his', 'how', 'man', 'new', 'now', 'old', 'see', 'two', 'way', 'who', 'boy', 'did', 'its', 'let', 'put',
      'say', 'she', 'too', 'use', 'with', 'this', 'that', 'from', 'they', 'have', 'will', 'would', 'could', 'should'
    ]);

    return words.filter(word => !stopWords.has(word));
  }

  /**
   * Helper: Determine trend direction
   */
  private determineTrend(keyword: string, items: CollectedItem[]): 'rising' | 'falling' | 'stable' {
    // Simple implementation: compare first half vs second half
    const sortedItems = items
      .filter(item => `${item.title} ${item.content}`.toLowerCase().includes(keyword.toLowerCase()))
      .sort((a, b) => {
        const dateA = new Date(a.created_at || 0).getTime();
        const dateB = new Date(b.created_at || 0).getTime();
        return dateA - dateB;
      });

    if (sortedItems.length < 4) return 'stable';

    const midPoint = Math.floor(sortedItems.length / 2);
    const firstHalf = sortedItems.slice(0, midPoint);
    const secondHalf = sortedItems.slice(midPoint);

    const threshold = 0.3; // 30% change threshold
    const firstCount = firstHalf.length;
    const secondCount = secondHalf.length;

    if (firstCount === 0) return 'rising';
    if (secondCount === 0) return 'falling';

    const change = (secondCount - firstCount) / firstCount;

    if (change > threshold) return 'rising';
    if (change < -threshold) return 'falling';
    return 'stable';
  }

  /**
   * Helper: Categorize keyword
   */
  private categorizeKeyword(keyword: string): string {
    const categories: Record<string, string[]> = {
      'technology': ['ai', 'api', 'code', 'tech', 'software', 'data', 'cloud', 'dev', 'web', 'app'],
      'business': ['market', 'sales', 'revenue', 'company', 'business', 'growth', 'profit', 'stock'],
      'science': ['research', 'study', 'science', 'study', 'experiment', 'analysis', 'result'],
      'politics': ['government', 'policy', 'election', 'vote', 'political', 'senate', 'congress'],
      'entertainment': ['movie', 'music', 'game', 'show', 'film', 'actor', 'celebrity', 'star']
    };

    const lowerKeyword = keyword.toLowerCase();

    for (const [category, keywords] of Object.entries(categories)) {
      if (keywords.some(kw => lowerKeyword.includes(kw))) {
        return category;
      }
    }

    return 'general';
  }
}

export const dataAnalysisService = DataAnalysisService.getInstance();
