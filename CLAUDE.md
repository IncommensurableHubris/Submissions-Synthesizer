# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is the "Submissions Synthesizer" project - a sophisticated legal document prompt generator that transforms bullet-point outlines into comprehensive legal submissions. The application is fully functional with a complete testing and debugging infrastructure.

**Current Status**: Production-ready with comprehensive test suite, security validation, and debugging systems.

## Critical: Always Run Tests Before Changes

**MANDATORY**: Before making ANY code changes, always run:
```bash
npm run test:quick-check
```

If that command doesn't exist, run:
```bash
npm test && npm run lint
```

## Development Setup

The project is fully established with:

✅ **Technology Stack**:
- Frontend: Pure HTML5, CSS3, JavaScript (ES6+)
- Libraries: PDF.js, Mammoth.js for document processing
- Testing: Jest (unit/integration), Playwright (E2E)
- Security: ESLint security plugins, OWASP ZAP scanning
- CI/CD: GitHub Actions with comprehensive testing

✅ **Project Structure**:
```
├── index.html              # Main application (single-page app)
├── src/                    # Source utilities
│   ├── debug/              # Debugging and logging system
│   └── utils/              # Error handling utilities
├── tests/                  # Comprehensive test suite
│   ├── unit/               # Core function tests
│   ├── integration/        # UI workflow tests
│   ├── e2e/                # End-to-end browser tests
│   ├── security/           # Security validation tests
│   └── performance/        # Performance and accessibility tests
└── .github/workflows/      # CI/CD automation
```

## Commands

### Testing Commands (Use These Frequently!)

**Quick Health Check** (Run before any changes):
```bash
npm test                    # Unit tests (30 seconds)
npm run lint               # Code quality check
```

**Comprehensive Testing** (Run before major changes):
```bash
npm run test:all           # Complete test suite (5-10 minutes)
npm run test:security      # Security validation
npm run test:e2e           # Browser testing
```

**Development Commands**:
```bash
npm run serve              # Start development server (port 8080)
npm run lint:fix           # Auto-fix code issues
npm run validate           # HTML validation
```

**Debugging Commands**:
```bash
# Open app with debug mode
http://localhost:8080?debug

# Enable advanced debugging
window.debugLogger.enable()
```

### When to Run Tests

**ALWAYS run tests**:
- ✅ Before committing code changes
- ✅ After modifying core functions (generatePrompts, handleFileUpload, etc.)
- ✅ Before updating documentation
- ✅ After adding new features

**Run comprehensive tests**:
- ✅ Before releasing updates
- ✅ After security-related changes
- ✅ Weekly for maintenance

## Architecture

### High-Level System Design

**Core Application** (`index.html`):
- Single-page application with no external dependencies
- Client-side only (no server required)
- Offline-capable with localStorage persistence

**Key Components**:
1. **State Management** (`appState` object)
2. **UI Controllers** (event listeners, form handlers)
3. **File Processing** (PDF.js, Mammoth.js integration)
4. **Prompt Generation** (Claude/Gemini prompt builders)
5. **Session Management** (save/load workflows)
6. **Validation System** (real-time form validation)

**Debug Infrastructure**:
- **Logger** (`src/debug/logger.js`): Multi-level logging with performance tracking
- **Error Handler** (`src/utils/errorHandler.js`): Recovery strategies and user notifications
- **Debug Integration** (`src/debug/debug-integration.js`): Function enhancement and monitoring

### Data Flow

```
User Input → Validation → State Update → UI Refresh → Prompt Generation → Output Display
    ↓                                                          ↓
Session Save/Load ←→ localStorage ←→ Debug Logging ←→ Error Handling
```

### Security Architecture

- **Input Sanitization**: All user inputs are validated and escaped
- **XSS Prevention**: Content Security Policy + output encoding
- **File Upload Security**: Type validation, size limits, content scanning
- **Session Security**: Encrypted localStorage, integrity checks

## Quality Standards

### Before Making Changes

1. **Read the code context** - Understand what the function does
2. **Check existing tests** - Look at `tests/` to see how features are tested
3. **Run tests** - Always run `npm test` before changes
4. **Follow patterns** - Match existing code style and architecture

### Code Quality Requirements

**Security**:
- ❌ Never use `innerHTML` with unsanitized content
- ❌ Never use `eval()` or similar dynamic execution
- ✅ Always validate file uploads
- ✅ Always escape user input in UI updates

**Performance**:
- ✅ Test with large inputs (use mock data from `enhanced_mock_data.md`)
- ✅ Monitor memory usage with `window.debugLogger.memory()`
- ✅ Keep UI updates under 100ms

**User Experience**:
- ✅ Provide clear error messages
- ✅ Show loading states for slow operations
- ✅ Maintain keyboard accessibility
- ✅ Support mobile browsers

### Testing Requirements

**For any function changes**:
```bash
npm run test:unit          # Must pass
npm run lint              # Must pass
```

**For UI changes**:
```bash
npm run test:integration   # Must pass
npm run accessibility     # Must pass
```

**For security-related changes**:
```bash
npm run test:security     # Must pass
```

## Emergency Procedures

### If Tests Fail

1. **Don't ignore test failures** - They indicate real problems
2. **Check the error message** - Tests are designed to be helpful
3. **Run individual test files** to isolate issues:
   ```bash
   npm test tests/unit/core-functions.test.js
   ```
4. **Check debug logs**:
   ```bash
   window.debugLogger.export()
   ```

### If App Crashes

1. **Check browser console** for errors
2. **Enable debug mode**: Add `?debug` to URL
3. **Check emergency state**: `localStorage.getItem('emergency-state')`
4. **Run memory check**: `window.debugLogger.memory()`

### Common Issues

**"File upload not working"**:
- Check file size (limit: 25MB)
- Verify file type (PDF, DOCX, TXT only)
- Check browser console for errors

**"Tests failing on Windows"**:
- Use `npm run test:unit` instead of `npm test`
- Check that paths use forward slashes

**"Memory issues"**:
- Clear browser cache
- Run `window.debugLogger.clear()`
- Restart browser

## Best Practices for AI Assistants

### Before Making Changes

1. **Always run health check**: `npm test && npm run lint`
2. **Read existing code** to understand patterns
3. **Check if similar functionality exists**
4. **Review security implications**

### During Development

1. **Follow existing patterns** - Don't reinvent unless necessary
2. **Add appropriate logging** - Use `logger.info()` for important events
3. **Handle errors gracefully** - Use `errorHandler.handleError()`
4. **Test as you go** - Run relevant tests frequently

### After Changes

1. **Run comprehensive tests**: `npm run test:all`
2. **Check performance impact**: Monitor memory usage
3. **Verify accessibility**: Ensure keyboard navigation works
4. **Test error scenarios**: Try invalid inputs

### Documentation Updates

When updating this file or other docs:
1. **Test all commands** mentioned in documentation
2. **Verify links and references** are correct
3. **Keep language clear** for non-technical users
4. **Update version-specific information**

## Notes for Ongoing Development

- **User Base**: Legal professionals, not software engineers
- **Priority**: Reliability and security over new features
- **Offline-First**: Must work without internet connection
- **Privacy-Critical**: No data should leave the user's browser
- **Cross-Platform**: Must work on Windows, Mac, mobile browsers

### Feature Development Guidelines

1. **Security First**: Every new feature must pass security tests
2. **Performance Conscious**: Large document processing is common
3. **Error Recovery**: Users often work with imperfect inputs
4. **Session Persistence**: Users need to save/resume work frequently
5. **Professional Output**: Generated prompts must be publication-ready

This project serves legal professionals who depend on it for critical work. Maintain the highest standards of quality, security, and reliability.