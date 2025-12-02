import { VectorService } from '../../src/services/vector.service.js';

describe('VectorService', () => {
  let vectorService: VectorService;

  beforeEach(() => {
    vectorService = new VectorService();
  });

  describe('indexDocument', () => {
    it('should throw error when embedding fails', async () => {
      jest
        .spyOn(vectorService as any, 'embedText')
        .mockRejectedValue(new Error('Embedding failed'));

      await expect(vectorService.indexDocument({ content: 'test content' })).rejects.toThrow(
        'Failed to generate embeddings'
      );
    });
  });

  describe('indexDocuments', () => {
    it('should batch index multiple documents', async () => {
      const docs = [
        { content: 'First document' },
        { content: 'Second document' },
        { content: 'Third document' },
      ];

      jest.spyOn(vectorService as any, 'embedText').mockResolvedValue({
        embeddings: [[1, 2, 3]],
        model: 'test-model',
      });

      const ids = await vectorService.indexDocuments(docs);

      expect(ids).toHaveLength(3);
    });
  });

  describe('getStats', () => {
    it('should return vector statistics', async () => {
      const stats = await vectorService.getStats();

      expect(stats).toHaveProperty('totalVectors');
      expect(stats).toHaveProperty('sampleDimensions');
      expect(stats).toHaveProperty('sampleType');
    });
  });
});
