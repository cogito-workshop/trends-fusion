import { logger } from '../../src/utils/logger.js';

describe('Logger', () => {
  it('should log info messages', () => {
    expect(() => {
      logger.info('Test info message', { key: 'value' });
    }).not.toThrow();
  });

  it('should log error messages', () => {
    expect(() => {
      logger.error('Test error message', { error: 'test' });
    }).not.toThrow();
  });

  it('should log warn messages', () => {
    expect(() => {
      logger.warn('Test warn message');
    }).not.toThrow();
  });

  it('should log debug messages', () => {
    expect(() => {
      logger.debug('Test debug message');
    }).not.toThrow();
  });
});
