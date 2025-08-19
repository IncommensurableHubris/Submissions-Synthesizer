module.exports = {
  extends: ['./.eslintrc.js'],
  plugins: ['security'],
  rules: {
    // Enhanced security rules for security testing
    'security/detect-object-injection': 'error',
    'security/detect-non-literal-fs-filename': 'error',
    'security/detect-non-literal-regexp': 'error',
    'security/detect-non-literal-require': 'error',
    'security/detect-possible-timing-attacks': 'error',
    'security/detect-pseudoRandomBytes': 'error',
    'security/detect-unsafe-regex': 'error',
    'security/detect-buffer-noassert': 'error',
    'security/detect-child-process': 'error',
    'security/detect-disable-mustache-escape': 'error',
    'security/detect-eval-with-expression': 'error',
    'security/detect-new-buffer': 'error',
    'security/detect-no-csrf-before-method-override': 'error',
    
    // Additional strict security rules
    'no-eval': 'error',
    'no-implied-eval': 'error',
    'no-new-func': 'error',
    'no-script-url': 'error',
    'no-innerHTML': 'off', // Custom rule would be added here
    
    // Prevent dangerous DOM manipulation
    'no-unsanitized/method': 'off', // Would require plugin
    'no-unsanitized/property': 'off' // Would require plugin
  },
  env: {
    browser: true,
    node: true
  }
};