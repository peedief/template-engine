import { describe, test, expect, beforeEach } from '@jest/globals';
import { render } from '../src/index';
import { escapeHtml } from '../src/utils';
import { Context } from '../src/evaluator';

describe('Security Tests', () => {

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('HTML Escaping', () => {
    test('should escape basic HTML entities', () => {
      const tests = [
        { input: '<', expected: '&lt;' },
        { input: '>', expected: '&gt;' },
        { input: '&', expected: '&amp;' },
        { input: '"', expected: '&quot;' },
        { input: '\'', expected: '&#x27;' },
        { input: '/', expected: '&#x2F;' }
      ];

      tests.forEach(({ input, expected }) => {
        expect(escapeHtml(input)).toBe(expected);
      });
    });

    test('should escape multiple entities in one string', () => {
      const input = '<script>alert("XSS");</script>';
      const expected = '&lt;script&gt;alert(&quot;XSS&quot;);&lt;&#x2F;script&gt;';
      expect(escapeHtml(input)).toBe(expected);
    });

    test('should handle empty strings and null values', () => {
      expect(escapeHtml('')).toBe('');
      expect(escapeHtml(null)).toBe('');
      expect(escapeHtml(undefined)).toBe('');
    });

    test('should handle non-string values', () => {
      expect(escapeHtml(123)).toBe('123');
      expect(escapeHtml(true)).toBe('true');
      expect(escapeHtml(false)).toBe('false');
      expect(escapeHtml({})).toBe('[object Object]');
      expect(escapeHtml([1, 2, 3])).toBe('1,2,3');
    });

    test('should preserve safe content', () => {
      const safeContent = 'Hello World! This is safe content.';
      expect(escapeHtml(safeContent)).toBe(safeContent);
    });
  });

  describe('XSS Prevention in Variables', () => {
    test('should escape script tags in variable output', () => {
      const template = '{{ userInput }}';
      const context = { userInput: '<script>alert("XSS")</script>' };
      const result = render(template, context);
      expect(result).toBe('&lt;script&gt;alert(&quot;XSS&quot;)&lt;&#x2F;script&gt;');
      expect(result).not.toContain('<script>');
    });

    test('should escape event handlers', () => {
      const template = '{{ maliciousHtml }}';
      const context = { maliciousHtml: '<img src="x" onerror="alert(1)">' };
      const result = render(template, context);
      expect(result).not.toContain('onerror=');
      expect(result).toContain('&quot;');
    });

    test('should escape javascript: URLs', () => {
      const template = '<a href="{{ link }}">Click me</a>';
      const context = { link: 'javascript:alert("XSS")' };
      const result = render(template, context);
      expect(result).not.toContain('javascript:');
      expect(result).not.toContain('javascript:alert');
    });

    test('should escape data: URLs with scripts', () => {
      const template = '{{ dataUrl }}';
      const context = { dataUrl: 'data:text/html,<script>alert(1)</script>' };
      const result = render(template, context);
      expect(result).not.toContain('<script>');
      expect(result).toContain('&lt;script&gt;');
    });

    test('should handle nested XSS attempts', () => {
      const template = '{{ nested }}';
      const context = { nested: '<div><script>alert("nested")</script></div>' };
      const result = render(template, context);
      expect(result).toBe('&lt;div&gt;&lt;script&gt;alert(&quot;nested&quot;)&lt;&#x2F;script&gt;&lt;&#x2F;div&gt;');
    });
  });

  describe('Expression Evaluation Security', () => {
    test('should prevent access to global objects', () => {
      const dangerousExpressions = [
        'global',
        'process',
        'require',
        'module',
        'exports',
        '__dirname',
        '__filename',
        'Buffer',
        'setTimeout',
        'setInterval',
        'eval',
        'Function'
      ];

      dangerousExpressions.forEach(expr => {
        const template = `{{ ${expr} }}`;
        const context = {};
        expect(() => render(template, context)).toThrow();
      });
    });

    test('should prevent prototype pollution attempts', () => {
      const template = '{{ __proto__.polluted }}';
      const context = {};
      expect(() => render(template, context)).toThrow();
    });

    test('should prevent constructor access', () => {
      const template = '{{ constructor }}';
      const context = {};
      expect(() => render(template, context)).toThrow();
    });

    test('should prevent access to dangerous methods', () => {
      const dangerousMethods = [
        'toString.constructor',
        'valueOf.constructor',
        'hasOwnProperty.constructor'
      ];

      dangerousMethods.forEach(method => {
        const template = `{{ ${method} }}`;
        const context = {};
        expect(() => render(template, context)).toThrow();
      });
    });

    test('should sandbox expression evaluation', () => {
      const template = '{{ this }}';
      const context = { value: 'safe' };
      expect(() => render(template, context)).toThrow();
    });
  });

  describe('Conditional Security', () => {
    test('should escape content in if blocks', () => {
      const template = '{% if showContent %}{{ content }}{% endif %}';
      const context = { 
        showContent: true, 
        content: '<script>alert("XSS")</script>' 
      };
      const result = render(template, context);
      expect(result).not.toContain('<script>');
      expect(result).toContain('&lt;script&gt;');
    });

    test('should escape content in else blocks', () => {
      const template = '{% if false %}Safe{% else %}{{ malicious }}{% endif %}';
      const context = { malicious: '<img src=x onerror=alert(1)>' };
      const result = render(template, context);
      expect(result).not.toContain('onerror=');
    });

    test('should prevent XSS in condition evaluation', () => {
      const template = '{% if userInput %}Content{% endif %}';
      const context = { userInput: '<script>alert(1)</script>' };
      const result = render(template, context);
      // The condition should be evaluated safely, content should show
      expect(result).toBe('Content');
    });
  });

  describe('Loop Security', () => {
    test('should escape content in for loops', () => {
      const template = '{% for item in items %}{{ item }}{% endfor %}';
      const context = { 
        items: ['<script>alert(1)</script>', '<img src=x onerror=alert(2)>'] 
      };
      const result = render(template, context);
      expect(result).not.toContain('<script>');
      expect(result).not.toContain('onerror=');
      expect(result).toContain('&lt;script&gt;');
    });

    test('should handle malicious array modification during iteration', () => {
      const maliciousArray = ['safe1', 'safe2'];
      Object.defineProperty(maliciousArray, '2', {
        get() {
          return '<script>alert("XSS")</script>';
        }
      });

      const template = '{% for item in items %}{{ item }}{% endfor %}';
      const context = { items: maliciousArray };
      const result = render(template, context);
      expect(result).not.toContain('<script>');
    });
  });

  describe('Edge Case Security', () => {
    test('should handle encoded script tags', () => {
      const encodedScript = '&lt;script&gt;alert(&quot;XSS&quot;)&lt;/script&gt;';
      const template = '{{ content }}';
      const context = { content: encodedScript };
      const result = render(template, context);
      // Should not double-encode already encoded content
      expect(result).toBe(encodedScript);
    });

    test('should handle mixed encoding attempts', () => {
      const template = '{{ mixed }}';
      const context = { mixed: '<script>alert("test")&lt;/script&gt;' };
      const result = render(template, context);
      expect(result).toContain('&lt;script&gt;');
      expect(result).not.toContain('<script>');
    });

    test('should handle unicode bypass attempts', () => {
      const unicodeScript = '<script>alert\\u0028"XSS"\\u0029</script>';
      const template = '{{ unicodeScript }}';
      const context = { unicodeScript };
      const result = render(template, context);
      expect(result).not.toContain('<script>');
    });

    test('should handle null byte injection', () => {
      const nullByteScript = '<script>alert("XSS")\\0</script>';
      const template = '{{ nullScript }}';
      const context = { nullScript: nullByteScript };
      const result = render(template, context);
      expect(result).not.toContain('<script>');
    });
  });

  describe('Content Security Policy Compliance', () => {
    test('should not generate inline event handlers', () => {
      const template = '{{ eventHandler }}';
      const context = { eventHandler: 'onclick="alert(1)"' };
      const result = render(template, context);
      expect(result).not.toContain('onclick="');
      expect(result).toContain('onclick=&quot;');
    });

    test('should escape style attributes', () => {
      const template = '{{ style }}';
      const context = { style: 'color: red; background: url(javascript:alert(1))' };
      const result = render(template, context);
      expect(result).not.toContain('javascript:');
    });

    test('should handle CSS injection attempts', () => {
      const template = '{{ cssInjection }}';
      const context = { cssInjection: 'expression(alert("XSS"))' };
      const result = render(template, context);
      expect(result).toContain('expression(');
      expect(result).not.toContain('expression(alert("XSS"))');
    });
  });

  describe('Template Injection Prevention', () => {
    test('should not evaluate template syntax in variables', () => {
      const template = '{{ maliciousTemplate }}';
      const context = { maliciousTemplate: '{{ secretData }}' };
      const secretContext = { ...context, secretData: 'SECRET_VALUE' };
      const result = render(template, secretContext);
      expect(result).toBe('{{ secretData }}');
      expect(result).not.toContain('SECRET_VALUE');
    });

    test('should not evaluate if statements in variables', () => {
      const template = '{{ maliciousIf }}';
      const context = { maliciousIf: '{% if true %}INJECTED{% endif %}' };
      const result = render(template, context);
      expect(result).toContain('{% if true %}');
      expect(result).not.toBe('INJECTED');
    });

    test('should not evaluate for loops in variables', () => {
      const template = '{{ maliciousFor }}';
      const context = { maliciousFor: '{% for x in [1,2,3] %}{{ x }}{% endfor %}' };
      const result = render(template, context);
      expect(result).toContain('{% for');
      expect(result).not.toBe('123');
    });
  });

  describe('DOS Prevention', () => {
    test('should handle extremely long strings safely', () => {
      const longString = 'A'.repeat(10000);
      const template = '{{ longContent }}';
      const context = { longContent: longString };
      
      const start = Date.now();
      const result = render(template, context);
      const end = Date.now();
      
      expect(result).toBe(longString);
      expect(end - start).toBeLessThan(1000); // Should complete in under 1 second
    });

    test('should handle deeply nested objects safely', () => {
      let deepObject: Context = { value: 'deep' };
      for (let i = 0; i < 100; i++) {
        deepObject = { next: deepObject };
      }
      
      const template = '{{ deep.value }}';
      const context = { deep: deepObject };
      expect(() => render(template, context)).not.toThrow();
    });

    test('should handle circular references without infinite loops', () => {
      const circular: Context = { name: 'circular' };
      circular.self = circular;
      
      const template = '{{ obj.name }}';
      const context = { obj: circular };
      const result = render(template, context);
      expect(result).toBe('circular');
    });
  });

  describe('Raw HTML Support (if implemented)', () => {
    test('should provide safe raw HTML syntax', () => {
      // This test assumes raw HTML syntax like {{{ content }}} might be implemented
      const template = '{{{ rawHtml }}}';
      const context = { rawHtml: '<b>Bold text</b>' };
      
      // This should either:
      // 1. Not be implemented (throw error)
      // 2. Be implemented with clear security warnings
      try {
        const result = render(template, context);
        // If implemented, it should have clear documentation about security risks
        expect(typeof result).toBe('string');
      } catch (error: any) {
        // Not implemented - this is the safer default
        expect(error.message).toContain('Raw HTML not supported');
      }
    });
  });
});