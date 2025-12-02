import * as fs from 'fs/promises';
import * as path from 'path';
import { logger } from '../utils/logger.js';

export interface ExportOptions {
  format: 'json' | 'csv';
  sourceId?: number;
  startDate?: string;
  endDate?: string;
  includeFiltered?: boolean;
  includeMetadata?: boolean;
}

export interface ExportResult {
  success: boolean;
  filePath?: string;
  recordCount: number;
  format: string;
  exportedAt: string;
  error?: string;
}

export class ExportService {
  private static instance: ExportService;
  private getCollectionDatabase: (() => any) | null = null;
  private exportDirectory: string;

  private constructor() {
    this.exportDirectory = path.join(process.cwd(), 'exports');
    this.ensureExportDirectory();
  }

  static getInstance(): ExportService {
    if (!ExportService.instance) {
      ExportService.instance = new ExportService();
    }
    return ExportService.instance;
  }

  setCollectionDatabase(getDb: () => any) {
    this.getCollectionDatabase = getDb;
  }

  private async ensureExportDirectory(): Promise<void> {
    try {
      await fs.access(this.exportDirectory);
    } catch {
      await fs.mkdir(this.exportDirectory, { recursive: true });
      logger.info('Created export directory: ' + this.exportDirectory);
    }
  }

  /**
   * Export collected items to JSON or CSV
   */
  async exportCollectedItems(options: ExportOptions): Promise<ExportResult> {
    if (!this.getCollectionDatabase) {
      throw new Error('Collection database not available');
    }

    try {
      const db = this.getCollectionDatabase();
      const dao = db.getDataSourceDAO();

      logger.info('Starting export of collected items: ' + JSON.stringify(options));

      // Get collected items
      const items = dao.getCollectedItems(options.sourceId, undefined, 100000, 0);

      // Filter by date range if specified
      let filteredItems = items;
      if (options.startDate || options.endDate) {
        filteredItems = items.filter(item => {
          if (!item.created_at) return false;
          const itemDate = new Date(item.created_at);

          if (options.startDate) {
            const startDate = new Date(options.startDate);
            if (itemDate < startDate) return false;
          }

          if (options.endDate) {
            const endDate = new Date(options.endDate);
            if (itemDate > endDate) return false;
          }

          return true;
        });
      }

      // Filter by status if specified
      if (!options.includeFiltered) {
        filteredItems = filteredItems.filter(item => item.status !== 'filtered');
      }

      logger.info('Filtered ' + filteredItems.length + ' items for export');

      // Generate filename
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const sourcePrefix = options.sourceId ? 'source-' + options.sourceId : 'all-sources';
      const filename = `collected-items-${sourcePrefix}-${timestamp}.${options.format}`;
      const filePath = path.join(this.exportDirectory, filename);

      // Export based on format
      let recordCount = 0;
      if (options.format === 'json') {
        recordCount = await this.exportToJSON(filteredItems, filePath, options);
      } else if (options.format === 'csv') {
        recordCount = await this.exportToCSV(filteredItems, filePath, options);
      }

      logger.info('Export completed: ' + recordCount + ' records to ' + filePath);

      return {
        success: true,
        filePath,
        recordCount,
        format: options.format,
        exportedAt: new Date().toISOString()
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Export failed: ' + errorMessage);
      return {
        success: false,
        recordCount: 0,
        format: options.format,
        exportedAt: new Date().toISOString(),
        error: errorMessage
      };
    }
  }

  /**
   * Export collection history to JSON or CSV
   */
  async exportCollectionHistory(options: ExportOptions): Promise<ExportResult> {
    if (!this.getCollectionDatabase) {
      throw new Error('Collection database not available');
    }

    try {
      const db = this.getCollectionDatabase();
      const dao = db.getDataSourceDAO();

      logger.info('Starting export of collection history: ' + JSON.stringify(options));

      const history = dao.getCollectionHistory(options.sourceId, 10000);

      // Filter by date range
      let filteredHistory = history;
      if (options.startDate || options.endDate) {
        filteredHistory = history.filter(record => {
          if (!record.start_time) return false;
          const recordDate = new Date(record.start_time);

          if (options.startDate) {
            const startDate = new Date(options.startDate);
            if (recordDate < startDate) return false;
          }

          if (options.endDate) {
            const endDate = new Date(options.endDate);
            if (recordDate > endDate) return false;
          }

          return true;
        });
      }

      logger.info('Filtered ' + filteredHistory.length + ' history records for export');

      // Generate filename
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const sourcePrefix = options.sourceId ? 'source-' + options.sourceId : 'all-sources';
      const filename = `collection-history-${sourcePrefix}-${timestamp}.${options.format}`;
      const filePath = path.join(this.exportDirectory, filename);

      // Export based on format
      let recordCount = 0;
      if (options.format === 'json') {
        recordCount = await this.exportToJSON(filteredHistory, filePath, options);
      } else if (options.format === 'csv') {
        recordCount = await this.exportToCSV(filteredHistory, filePath, options);
      }

      logger.info('Export completed: ' + recordCount + ' records to ' + filePath);

      return {
        success: true,
        filePath,
        recordCount,
        format: options.format,
        exportedAt: new Date().toISOString()
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Export failed: ' + errorMessage);
      return {
        success: false,
        recordCount: 0,
        format: options.format,
        exportedAt: new Date().toISOString(),
        error: errorMessage
      };
    }
  }

  /**
   * Export analysis results to JSON or CSV
   */
  async exportAnalysisResults(
    analysisType: 'keyword-frequency' | 'temporal-patterns' | 'trends' | 'anomalies',
    data: any,
    options: ExportOptions
  ): Promise<ExportResult> {
    try {
      logger.info('Starting export of ' + analysisType + ' analysis results');

      // Generate filename
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `analysis-${analysisType}-${timestamp}.${options.format}`;
      const filePath = path.join(this.exportDirectory, filename);

      // Export based on format
      let recordCount = 0;
      const dataArray = Array.isArray(data) ? data : [data];

      if (options.format === 'json') {
        recordCount = await this.exportToJSON(dataArray, filePath, options);
      } else if (options.format === 'csv') {
        recordCount = await this.exportToCSV(dataArray, filePath, options);
      }

      logger.info('Export completed: ' + recordCount + ' records to ' + filePath);

      return {
        success: true,
        filePath,
        recordCount,
        format: options.format,
        exportedAt: new Date().toISOString()
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Export failed: ' + errorMessage);
      return {
        success: false,
        recordCount: 0,
        format: options.format,
        exportedAt: new Date().toISOString(),
        error: errorMessage
      };
    }
  }

  /**
   * Export data source statistics
   */
  async exportStatistics(options: ExportOptions): Promise<ExportResult> {
    if (!this.getCollectionDatabase) {
      throw new Error('Collection database not available');
    }

    try {
      const db = this.getCollectionDatabase();
      const dao = db.getDataSourceDAO();

      logger.info('Starting export of statistics');

      const sources = dao.getAllDataSources();

      const stats = sources.map(source => {
        const sourceStats = dao.getDataSourceStats(source.id!);
        return {
          id: source.id,
          name: source.name,
          type: source.type,
          status: source.status,
          totalItems: sourceStats.totalItems,
          newItems: sourceStats.newItems,
          processedItems: sourceStats.processedItems,
          totalRuns: sourceStats.totalRuns,
          successfulRuns: sourceStats.successfulRuns,
          successRate: sourceStats.successRate,
          created_at: source.created_at,
          updated_at: source.updated_at
        };
      });

      logger.info('Generated statistics for ' + stats.length + ' sources');

      // Generate filename
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `statistics-${timestamp}.${options.format}`;
      const filePath = path.join(this.exportDirectory, filename);

      // Export based on format
      let recordCount = 0;
      if (options.format === 'json') {
        recordCount = await this.exportToJSON(stats, filePath, options);
      } else if (options.format === 'csv') {
        recordCount = await this.exportToCSV(stats, filePath, options);
      }

      logger.info('Export completed: ' + recordCount + ' records to ' + filePath);

      return {
        success: true,
        filePath,
        recordCount,
        format: options.format,
        exportedAt: new Date().toISOString()
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Export failed: ' + errorMessage);
      return {
        success: false,
        recordCount: 0,
        format: options.format,
        exportedAt: new Date().toISOString(),
        error: errorMessage
      };
    }
  }

  /**
   * Export to JSON format
   */
  private async exportToJSON(data: any[], filePath: string, options: ExportOptions): Promise<number> {
    const exportData = {
      exportedAt: new Date().toISOString(),
      format: 'json',
      totalRecords: data.length,
      includeMetadata: options.includeMetadata,
      data: data
    };

    const jsonContent = JSON.stringify(exportData, null, 2);
    await fs.writeFile(filePath, jsonContent, 'utf-8');

    return data.length;
  }

  /**
   * Export to CSV format
   */
  private async exportToCSV(data: any[], filePath: string, _options: ExportOptions): Promise<number> {
    if (data.length === 0) {
      await fs.writeFile(filePath, '', 'utf-8');
      return 0;
    }

    // Get all unique keys from all objects
    const headersSet = new Set<string>();
    data.forEach(item => {
      Object.keys(item).forEach(key => headersSet.add(key));
    });

    const headers = Array.from(headersSet);

    // Create CSV content
    let csvContent = headers.join(',') + '\n';

    data.forEach(item => {
      const row = headers.map(header => {
        const value = item[header];
        if (value === null || value === undefined) {
          return '';
        }
        if (typeof value === 'object') {
          // JSON.stringify but escape quotes
          const str = JSON.stringify(value);
          return '"' + str.replace(/"/g, '""') + '"';
        }
        if (typeof value === 'string' && value.includes(',')) {
          // Escape quotes and wrap in quotes
          return '"' + value.replace(/"/g, '""') + '"';
        }
        return value;
      });
      csvContent += row.join(',') + '\n';
    });

    await fs.writeFile(filePath, csvContent, 'utf-8');

    return data.length;
  }

  /**
   * Get list of exported files
   */
  async listExportedFiles(): Promise<{ name: string; path: string; size: number; createdAt: string }[]> {
    await this.ensureExportDirectory();

    const files = await fs.readdir(this.exportDirectory);
    const fileStats = await Promise.all(
      files.map(async (filename) => {
        const filePath = path.join(this.exportDirectory, filename);
        const stats = await fs.stat(filePath);
        return {
          name: filename,
          path: filePath,
          size: stats.size,
          createdAt: stats.birthtime.toISOString()
        };
      })
    );

    // Sort by creation date (newest first)
    fileStats.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return fileStats;
  }

  /**
   * Delete exported file
   */
  async deleteExportedFile(filePath: string): Promise<boolean> {
    try {
      await fs.unlink(filePath);
      logger.info('Deleted exported file: ' + filePath);
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Failed to delete exported file: ' + filePath + ' - ' + errorMessage);
      return false;
    }
  }

  /**
   * Get export directory path
   */
  getExportDirectory(): string {
    return this.exportDirectory;
  }
}

export const exportService = ExportService.getInstance();
