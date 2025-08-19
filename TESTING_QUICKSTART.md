# Testing Quick Start Guide

This guide helps you quickly set up and run the comprehensive test suite for the Subs Prompt Generator.

## Prerequisites

1. **Node.js 18+** installed
2. **npm** or **yarn** package manager
3. **Git** for version control

## Quick Setup

```bash
# 1. Install dependencies
npm install

# 2. Install Playwright browsers
npx playwright install

# 3. Verify setup
npm run test:unit
```

## Run All Tests

```bash
# Complete test suite (takes 5-10 minutes)
npm run test:all

# Quick smoke tests (takes 1-2 minutes)
npm test
npm run test:e2e -- --project=chromium
```

## Individual Test Types

### Unit Tests
```bash
npm run test:unit                # All unit tests
npm run test:unit -- --watch     # Watch mode
npm run test:coverage            # With coverage report
```

### Integration Tests
```bash
npm run test:integration         # UI workflow tests
```

### End-to-End Tests
```bash
npm run test:e2e                 # All browsers
npx playwright test --project=chromium  # Chrome only
npx playwright test --headed     # With visible browser
npx playwright test --debug      # Debug mode
```

### Security Tests
```bash
npm run test:security            # All security tests
npm run test:security:audit      # Dependency vulnerabilities
npm run test:security:lint       # Code security issues
npx playwright test --project=security-tests  # E2E security
```

### Performance Tests
```bash
npm run test:performance         # Unit performance tests
npx playwright test --project=performance-tests  # E2E performance
npm run lighthouse              # Lighthouse audit
```

### Accessibility Tests
```bash
npm run accessibility           # Pa11y accessibility scan
npx playwright test tests/e2e/accessibility/  # E2E accessibility
```

## Debug Mode

### Enable Debug Logging
```bash
# Via URL parameter
http://localhost:8080?debug

# Via localStorage (in browser console)
localStorage.setItem('debug-log-level', 'DEBUG');

# Via debug console
window.debugLogger.enable();
```

### Debug Console Commands
```javascript
window.debugLogger.enable()     // Enable debug mode
window.debugLogger.export()     // Export logs as JSON
window.debugLogger.metrics()    // Get performance metrics
window.debugLogger.memory()     // Check memory usage
window.debugLogger.clear()      // Clear all logs
```

### Debug Panel
Add `?debug` to URL to show debug panel with:
- Real-time logs
- Performance metrics  
- Memory usage
- Error tracking

## Common Issues

### Test Failures

**Playwright browser not found**:
```bash
npx playwright install
```

**Port already in use**:
```bash
# Kill process on port 8080
npx kill-port 8080
# Or use different port
npm run serve -- -p 8081
```

**Memory errors during tests**:
```bash
# Increase Node.js memory
export NODE_OPTIONS="--max-old-space-size=4096"
npm test
```

### Security Test Issues

**OWASP ZAP not working**:
- Ensure Docker is installed for ZAP container
- Or install ZAP locally and update config

**Semgrep API rate limits**:
- Create free Semgrep account for higher limits
- Or run without Semgrep: `npm run test:security:audit`

### Performance Test Issues

**Lighthouse fails**:
```bash
# Install Chrome if missing
npm install -g lighthouse
# Ensure server is running
npm run serve &
```

## Continuous Integration

### GitHub Actions
Tests run automatically on:
- Push to main/develop branches
- Pull requests to main
- Daily at 2 AM UTC (dependency scans)

### Local CI Simulation
```bash
# Run same tests as CI
npm run lint
npm run validate
npm run test:all
npm run test:security
npm run accessibility
```

## Test Writing Guidelines

### Unit Test Template
```javascript
describe('Feature Name', () => {
  beforeEach(() => {
    // Setup
  });

  test('should do something specific', () => {
    // Arrange
    const input = 'test data';
    
    // Act
    const result = functionUnderTest(input);
    
    // Assert
    expect(result).toBe('expected output');
  });
});
```

### E2E Test Template
```javascript
test('should complete user workflow', async ({ page }) => {
  await page.goto('/');
  
  // Fill form
  await page.fill('#chronology', 'test content');
  
  // Submit
  await page.click('#generateBtn');
  
  // Verify result
  await expect(page.locator('#outputSection')).toBeVisible();
});
```

### Security Test Template
```javascript
test('should prevent XSS attack', async ({ page }) => {
  const xssPayload = '<script>alert("XSS")</script>';
  
  await page.fill('#input', xssPayload);
  await page.click('#submit');
  
  // Verify XSS did not execute
  const xssExecuted = await page.evaluate(() => window.xssExecuted);
  expect(xssExecuted).toBeUndefined();
});
```

## Performance Monitoring

### Browser Performance
```javascript
// Measure execution time
const startTime = performance.now();
await someOperation();
const duration = performance.now() - startTime;
expect(duration).toBeLessThan(1000); // 1 second
```

### Memory Usage
```javascript
// Check memory usage
const memoryInfo = performance.memory;
expect(memoryInfo.usedJSHeapSize).toBeLessThan(50 * 1024 * 1024); // 50MB
```

## Coverage Reports

### View Coverage
```bash
npm run test:coverage
open coverage/lcov-report/index.html
```

### Coverage Requirements
- **Lines**: 70% minimum
- **Functions**: 70% minimum  
- **Branches**: 70% minimum
- **Statements**: 70% minimum

## Best Practices

### Test Organization
- Keep tests close to code they test
- Use descriptive test names
- One assertion per test when possible
- Test both success and error cases

### Performance Tests
- Use realistic data sizes
- Test on various devices/connections
- Monitor memory usage
- Set performance budgets

### Security Tests
- Test all input vectors
- Use real attack payloads
- Verify output encoding
- Test authentication/authorization

### Accessibility Tests
- Test with keyboard only
- Verify screen reader compatibility
- Check color contrast
- Test on mobile devices

## Useful Commands

```bash
# Development
npm run serve                    # Start dev server
npm run lint                     # Check code style
npm run lint:fix                 # Fix auto-fixable issues

# Testing
npm test                         # Quick unit tests
npm run test:watch               # Watch mode
npm run test:e2e:headed          # Visual E2E testing
npm run test:debug               # Debug failing tests

# Security
npm audit                        # Check dependencies
npm run test:security:quick      # Quick security scan

# Performance
npm run lighthouse               # Performance audit
npm run test:performance:quick   # Quick performance check

# Clean up
npm run clean                    # Clear test artifacts
rm -rf node_modules && npm install  # Fresh install
```

## Getting Help

### Debug Information
When reporting issues, include:
- Node.js version: `node --version`
- npm version: `npm --version` 
- OS and browser versions
- Test command that failed
- Full error message and stack trace

### Debug Export
```javascript
// Export debug information
const debugInfo = {
  logs: window.debugLogger.export(),
  metrics: window.debugLogger.metrics(),
  memory: window.debugLogger.memory(),
  userAgent: navigator.userAgent,
  timestamp: new Date().toISOString()
};
console.log(JSON.stringify(debugInfo, null, 2));
```

### Common Debug Steps
1. Clear browser cache and localStorage
2. Restart development server
3. Reinstall dependencies: `rm -rf node_modules && npm install`
4. Check for port conflicts
5. Verify file permissions
6. Enable debug mode for detailed logging

This quick start guide should get you up and running with the comprehensive test suite quickly. For detailed information, see the full [TESTING.md](./TESTING.md) documentation.