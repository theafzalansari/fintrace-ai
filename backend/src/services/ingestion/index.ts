/**
 * Data Ingestion Service
 * Responsible for ingesting transaction batches, ledger feeds, and entity records.
 */
export class IngestionService {
  async processBatch(batch: unknown[]) {
    return { status: 'received', count: batch.length };
  }
}

export const ingestionService = new IngestionService();
