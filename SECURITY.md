# Security Policy

## Supported Versions

We actively support the following versions with security updates:

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | :white_check_mark: |
| < 1.0   | :x:                |

## Reporting a Vulnerability

We take security vulnerabilities seriously. If you discover a security issue in xcfreader or ui-xcfimage, please report it responsibly.

### How to Report

**DO NOT** open a public GitHub issue for security vulnerabilities.

Instead, please report security vulnerabilities by emailing:

**[Your email here]** or use GitHub's private vulnerability reporting:

1. Go to the [Security tab](https://github.com/andimclean/xcfreader/security)
2. Click "Report a vulnerability"
3. Fill out the form with details about the vulnerability

### What to Include

Please include the following information in your report:

- Description of the vulnerability
- Steps to reproduce the issue
- Potential impact of the vulnerability
- Any suggested fixes (if available)
- Your contact information (optional)

### Response Timeline

- **Initial Response**: Within 48 hours of report
- **Status Update**: Within 7 days with our assessment
- **Fix Timeline**: Varies based on severity, but critical issues will be prioritized

### Disclosure Policy

- We will acknowledge your report within 48 hours
- We will provide a detailed response within 7 days
- We will work with you to understand and resolve the issue
- We will publicly disclose the vulnerability after a fix is released
- We will credit you in the disclosure (unless you prefer to remain anonymous)

### Security Best Practices

When using xcfreader in your application:

1. **Input Validation**: Always validate XCF files from untrusted sources
2. **File Size Limits**: Implement size limits to prevent DoS through large files
3. **Memory Management**: Monitor memory usage when processing large XCF files
4. **Error Handling**: Properly handle parsing errors to avoid exposing sensitive information
5. **Dependencies**: Keep xcfreader and its dependencies up to date

### Known Security Considerations

- **Large Files**: Very large XCF files may consume significant memory
- **Malformed Files**: While the parser includes error handling, malformed files should be treated with caution
- **Browser Context**: When using in browsers, be aware of CORS and same-origin policies

## Security Updates

Security updates will be released as patch versions and announced through:

- GitHub Security Advisories
- Release notes in CHANGELOG.md
- npm package updates

## Bug Bounty Program

We do not currently offer a bug bounty program, but we deeply appreciate responsible disclosure and will acknowledge all valid reports.
