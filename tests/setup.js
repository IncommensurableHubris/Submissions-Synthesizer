/**
 * Jest Test Setup
 * Configures the testing environment for the Subs Prompt Generator
 */

// Mock browser APIs that aren't available in jsdom
global.URL.createObjectURL = jest.fn(() => 'mocked-url');
global.URL.revokeObjectURL = jest.fn();

// Mock File API
global.File = class File {
  constructor(bits, name, options = {}) {
    this.bits = bits;
    this.name = name;
    this.type = options.type || '';
    this.size = bits.reduce((acc, bit) => acc + bit.length, 0);
    this.lastModified = options.lastModified || Date.now();
  }
};

global.FileReader = class FileReader {
  constructor() {
    this.readyState = 0;
    this.result = null;
    this.error = null;
  }

  readAsText(file) {
    setTimeout(() => {
      this.readyState = 2;
      this.result = file.bits.join('');
      if (this.onload) {this.onload({ target: this });}
    }, 0);
  }

  readAsArrayBuffer(file) {
    setTimeout(() => {
      this.readyState = 2;
      this.result = new ArrayBuffer(file.size);
      if (this.onload) {this.onload({ target: this });}
    }, 0);
  }
};

// Mock PDF.js
global.pdfjsLib = {
  GlobalWorkerOptions: {
    workerSrc: ''
  },
  getDocument: jest.fn(() => Promise.resolve({
    promise: Promise.resolve({
      numPages: 1,
      getPage: jest.fn(() => Promise.resolve({
        getTextContent: jest.fn(() => Promise.resolve({
          items: [{ str: 'Mock PDF content' }]
        }))
      }))
    })
  }))
};

// Mock Mammoth.js
global.mammoth = {
  extractRawText: jest.fn(() => Promise.resolve({
    value: 'Mock Word document content',
    messages: []
  }))
};

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
global.localStorage = localStorageMock;

// Mock clipboard API
global.navigator.clipboard = {
  writeText: jest.fn(() => Promise.resolve()),
  readText: jest.fn(() => Promise.resolve(''))
};

// Mock drag and drop API
global.DataTransfer = class DataTransfer {
  constructor() {
    this.files = [];
    this.items = [];
  }
};

global.DragEvent = class DragEvent extends Event {
  constructor(type, options = {}) {
    super(type, options);
    this.dataTransfer = options.dataTransfer || new DataTransfer();
  }
};

// Security testing utilities
global.securityTestUtils = {
  createXSSPayload: (type = 'script') => {
    const payloads = {
      script: '<script>alert("XSS")</script>',
      img: '<img src="x" onerror="alert(\'XSS\')">',
      svg: '<svg onload="alert(\'XSS\')">',
      iframe: '<iframe src="javascript:alert(\'XSS\')"></iframe>'
    };
    return payloads[type] || payloads.script;
  },

  createLargePayload: (size = 1000000) => {
    return 'A'.repeat(size);
  },

  createMaliciousFile: (type = 'script') => {
    const content = type === 'script' ?
      '<script>alert("malicious")</script>' :
      'malicious content';
    return new File([content], `malicious.${type}`, { type: `text/${type}` });
  }
};

// Performance testing utilities
global.performanceTestUtils = {
  measureExecutionTime: async (fn) => {
    const start = performance.now();
    await fn();
    return performance.now() - start;
  },

  measureMemoryUsage: () => {
    if (performance.memory) {
      return {
        used: performance.memory.usedJSHeapSize,
        total: performance.memory.totalJSHeapSize,
        limit: performance.memory.jsHeapSizeLimit
      };
    }
    return null;
  }
};

// Test timeout helpers
jest.setTimeout(10000);

// Console spy for testing logging
global.consoleSpy = {
  log: jest.spyOn(console, 'log').mockImplementation(() => {}),
  error: jest.spyOn(console, 'error').mockImplementation(() => {}),
  warn: jest.spyOn(console, 'warn').mockImplementation(() => {}),
  debug: jest.spyOn(console, 'debug').mockImplementation(() => {})
};

// Cleanup after each test
afterEach(() => {
  jest.clearAllMocks();
  localStorage.clear();
  document.body.innerHTML = '';
});

// Global test configuration
global.testConfig = {
  timeout: 5000,
  retries: 2,
  slowTestThreshold: 1000
};