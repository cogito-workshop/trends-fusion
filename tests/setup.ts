import '@testing-library/jest-dom';

// Mock electron modules
vi.mock('electron', () => ({
  ipcRenderer: {
    invoke: vi.fn(),
    send: vi.fn(),
    on: vi.fn(),
    off: vi.fn(),
  },
}));

// Mock better-sqlite3 for tests
vi.mock('better-sqlite3', () => {
  return {
    default: vi.fn().mockImplementation(() => ({
      prepare: vi.fn().mockReturnValue({
        get: vi.fn(),
        all: vi.fn().mockReturnValue([]),
        run: vi.fn().mockReturnValue({ lastInsertRowid: 1, changes: 1 }),
      }),
      exec: vi.fn(),
      pragma: vi.fn().mockReturnValue('wal'),
      close: vi.fn(),
    })),
  };
});

// Mock logger
vi.mock('../src/main/utils/logger.js', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock fs
vi.mock('fs', () => ({
  readFileSync: vi.fn().mockReturnValue('CREATE TABLE test (id INTEGER);'),
}));

// Mock path
vi.mock('path', () => ({
  default: {
    join: vi.fn().mockReturnValue('/test/path'),
    dirname: vi.fn().mockReturnValue('/test'),
  },
}));

// Mock axios
vi.mock('axios', () => ({
  default: {
    get: vi.fn().mockResolvedValue({
      data: '<html><title>Test</title><body>Test content</body></html>',
    }),
  },
}));

// Mock cheerio
vi.mock('cheerio', () => ({
  load: vi.fn().mockReturnValue(vi.fn().mockReturnValue({
    text: vi.fn().mockReturnValue('test'),
    attr: vi.fn().mockReturnValue('test'),
    find: vi.fn().mockReturnValue({
      text: vi.fn().mockReturnValue('test'),
      first: vi.fn().mockReturnValue({
        text: vi.fn().mockReturnValue('Test Title'),
        attr: vi.fn().mockReturnValue('http://example.com'),
      }),
      each: vi.fn().mockImplementation(function(cb) {
        // Mock iteration for tests
        cb.call({ attr: () => 'test-id' }, 0);
      }),
    }),
    first: vi.fn().mockReturnValue({
      text: vi.fn().mockReturnValue('Test Title'),
    }),
    each: vi.fn().mockImplementation(function(cb) {
      // Mock iteration for tests
      [0, 1].forEach((i) => cb.call({}, i));
    }),
  })),
}));

// Mock firecrawl
vi.mock('firecrawl', () => {
  return {
    default: vi.fn().mockImplementation(() => ({
      scrapeUrl: vi.fn().mockResolvedValue({
        data: {
          title: 'Test Article',
          markdown: 'This is test content',
          description: 'Test description',
        },
      }),
    })),
  };
});

// Global test utilities
global.window = {
  electron: {
    ipcRenderer: {
      invoke: vi.fn(),
      send: vi.fn(),
    },
  },
} as any;

// Cleanup after each test
afterEach(() => {
  vi.clearAllMocks();
});
