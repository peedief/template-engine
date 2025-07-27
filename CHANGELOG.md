# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2025-07-27

### Added
- Initial release of @peedief/template-engine
- Core template engine with tokenizer, parser, and evaluator
- Variable interpolation with `{{ variable }}` syntax
- Nested property access support (`{{ object.property }}`)
- Conditional logic with `{% if %}...{% else %}...{% endif %}`
- Loop support with `{% for item in array %}...{% endfor %}`
- Automatic HTML escaping for XSS protection
- Secure sandboxed expression evaluation
- TypeScript support with full type definitions
- Pre-compilation API for performance optimization
- Comprehensive error handling with position information
- Zero runtime dependencies
- Support for Node.js 16.x, 18.x, 20.x, 22.x+
- 80%+ test coverage with integration, security, and performance tests
- GitHub Actions CI/CD pipeline
- Automated NPM publishing on tag creation
- ESLint configuration with TypeScript rules
- Complete API documentation and usage examples

### Security
- Built-in XSS prevention through automatic HTML escaping
- Sandboxed expression evaluation prevents code injection
- Safe property access for missing/undefined values
- Input validation for templates and contexts

### Performance
- Efficient tokenization and AST generation
- Template pre-compilation support
- Optimized for large datasets (1000+ items in <1 second)
- Memory-efficient AST representation
- Low memory footprint

### Documentation
- Comprehensive README with installation and usage guide
- TypeScript API documentation
- Real-world code examples (blog posts, e-commerce, dashboards)
- Security best practices
- Performance benchmarks
- Contributing guidelines

[0.1.0]: https://github.com/peedief/template-engine/releases/tag/v0.1.0