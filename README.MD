# @peedief/template-engine

[![CI/CD Pipeline](https://github.com/peedief/template-engine/actions/workflows/ci.yml/badge.svg)](https://github.com/peedief/template-engine/actions/workflows/ci.yml)
[![npm version](https://badge.fury.io/js/@peedief%2Ftemplate-engine.svg)](https://badge.fury.io/js/@peedief%2Ftemplate-engine)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://typescript.org)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A fast, secure, and lightweight template engine for JavaScript/TypeScript that supports variable interpolation, conditional logic, and loops. Perfect for generating dynamic HTML, emails, configuration files, and more.

## Features

- 🚀 **Fast & Lightweight** - Minimal dependencies, optimized for performance
- 🔒 **Secure by Default** - Built-in XSS protection with automatic HTML escaping
- 📝 **Simple Syntax** - Familiar `{{ variable }}`, `{% if %}`, and `{% for %}` patterns
- 🎯 **TypeScript First** - Full TypeScript support with comprehensive type definitions
- 🧪 **Battle Tested** - 80%+ test coverage with comprehensive edge case handling
- 🌐 **Zero Dependencies** - No external runtime dependencies

## Installation

```bash
npm install @peedief/template-engine
```

```bash
yarn add @peedief/template-engine
```

```bash
pnpm add @peedief/template-engine
```

## Quick Start

```typescript
import { render } from '@peedief/template-engine';

// Simple variable interpolation
const template = 'Hello {{ name }}!';
const result = render(template, { name: 'World' });
console.log(result); // "Hello World!"

// Conditional rendering
const conditional = '{% if user.isAdmin %}Admin Panel{% else %}User Dashboard{% endif %}';
const adminResult = render(conditional, { user: { isAdmin: true } });
console.log(adminResult); // "Admin Panel"

// Loop through arrays
const list = '{% for item in items %}{{ item }} {% endfor %}';
const listResult = render(list, { items: ['apple', 'banana', 'cherry'] });
console.log(listResult); // "apple banana cherry "
```

## Usage

### Basic Variable Interpolation

```typescript
import { render } from '@peedief/template-engine';

const template = `
  <h1>{{ post.title }}</h1>
  <p>By {{ post.author.name }} on {{ post.date }}</p>
  <div>{{ post.content }}</div>
`;

const context = {
  post: {
    title: 'Getting Started',
    author: { name: 'John Doe' },
    date: '2024-01-15',
    content: 'This is a sample blog post...'
  }
};

const html = render(template, context);
```

### Nested Property Access

```typescript
const template = 'Welcome {{ user.profile.firstName }} {{ user.profile.lastName }}';
const context = {
  user: {
    profile: {
      firstName: 'Jane',
      lastName: 'Smith'
    }
  }
};

const result = render(template, context); // "Welcome Jane Smith"
```

### Conditional Logic

```typescript
const template = `
  {% if user.isPremium %}
    <div class="premium-content">Premium features available!</div>
  {% else %}
    <div class="upgrade-prompt">Upgrade to premium</div>
  {% endif %}
`;

const context = { user: { isPremium: false } };
const result = render(template, context);
```

### Loops and Arrays

```typescript
const template = `
  <ul class="product-list">
    {% for product in products %}
      <li class="product">
        <h3>{{ product.name }}</h3>
        <span class="price">\${{ product.price }}</span>
        {% if product.inStock %}
          <button>Add to Cart</button>
        {% else %}
          <span class="out-of-stock">Out of Stock</span>
        {% endif %}
      </li>
    {% endfor %}
  </ul>
`;

const context = {
  products: [
    { name: 'Laptop', price: 999, inStock: true },
    { name: 'Mouse', price: 29, inStock: false },
    { name: 'Keyboard', price: 79, inStock: true }
  ]
};

const html = render(template, context);
```

### Complex Nested Templates

```typescript
const template = `
  <div class="user-profile">
    <h1>{{ user.name }}</h1>
    
    {% if user.skills %}
      <div class="skills">
        <h3>Skills:</h3>
        {% for skill in user.skills %}
          <span class="skill">
            {{ skill.name }} 
            {% if skill.level %}({{ skill.level }}){% endif %}
          </span>
        {% endfor %}
      </div>
    {% endif %}
    
    {% if user.projects %}
      <div class="projects">
        <h3>Recent Projects:</h3>
        {% for project in user.projects %}
          <div class="project">
            <h4>{{ project.title }}</h4>
            <p>{{ project.description }}</p>
            {% if project.technologies %}
              <div class="technologies">
                {% for tech in project.technologies %}
                  <span class="tech-tag">{{ tech }}</span>
                {% endfor %}
              </div>
            {% endif %}
          </div>
        {% endfor %}
      </div>
    {% endif %}
  </div>
`;
```

### Pre-compiled Templates

For better performance when rendering the same template multiple times:

```typescript
import { compile } from '@peedief/template-engine';

// Compile once
const template = compile('Hello {{ name }}, you have {{ notifications.count }} notifications');

// Render multiple times with different contexts
const result1 = template({ name: 'Alice', notifications: { count: 5 } });
const result2 = template({ name: 'Bob', notifications: { count: 0 } });
```

## Security

The template engine includes built-in XSS protection:

```typescript
const template = '<div>{{ userInput }}</div>';
const context = { userInput: '<script>alert("XSS")</script>Safe content' };
const result = render(template, context);
// Result: "<div>&lt;script&gt;alert(&quot;XSS&quot;)&lt;/script&gt;Safe content</div>"
```

All variable interpolations are automatically HTML-escaped. The engine uses a secure sandboxed evaluation approach to prevent code injection attacks.

## Error Handling

The template engine provides detailed error information for debugging:

```typescript
try {
  const result = render('{{ unclosed', {});
} catch (error) {
  console.error(error.message); // Detailed error with position information
}
```

## API Reference

### `render(template: string, context?: Context): string`

Renders a template string with the provided context.

- **template**: The template string to render
- **context**: Object containing variables for interpolation (optional)
- **Returns**: Rendered string

### `compile(template: string): CompiledTemplate`

Pre-compiles a template for better performance when rendering multiple times.

- **template**: The template string to compile
- **Returns**: Compiled template function that accepts a context and returns a rendered string

### `Context`

TypeScript interface for template context:

```typescript
interface Context {
  [key: string]: any;
}
```

## Template Syntax

### Variables
- `{{ variable }}` - Simple variable interpolation
- `{{ object.property }}` - Nested property access
- `{{ array.0 }}` - Array index access

### Conditionals
- `{% if condition %}...{% endif %}` - Simple conditional
- `{% if condition %}...{% else %}...{% endif %}` - If-else conditional

### Loops
- `{% for item in array %}...{% endfor %}` - Iterate over arrays
- Access current item with `{{ item }}`
- Access nested properties with `{{ item.property }}`

## Performance

The template engine is optimized for performance:

- ⚡ **Fast Parsing**: Efficient tokenization and AST generation
- 🔄 **Compilation Caching**: Pre-compile templates for repeated use
- 📦 **Minimal Memory**: Low memory footprint
- 🚀 **Large Datasets**: Handles 1000+ items efficiently (tested up to 1000 items in <1 second)

## Browser Support

- ✅ **Node.js**: 16.x, 18.x, 20.x, 22.x+
- ✅ **Modern Browsers**: Chrome, Firefox, Safari, Edge
- ✅ **TypeScript**: 5.0+

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes and add tests
4. Run tests: `npm test`
5. Run linting: `npm run lint`
6. Commit changes: `git commit -m 'Add amazing feature'`
7. Push to the branch: `git push origin feature/amazing-feature`
8. Open a Pull Request

## Development

```bash
# Install dependencies
npm install

# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Run linting
npm run lint

# Build TypeScript
npm run build

# Run type checking
npm run typecheck
```

## License

MIT License - see the [LICENSE](LICENSE) file for details.

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for version history and breaking changes.
