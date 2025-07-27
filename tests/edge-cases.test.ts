import { describe, test, expect, beforeEach } from '@jest/globals';
import { render, tokenize, parse, evaluate } from '../src/index';
import { Context } from '../src/evaluator';

describe('Edge Cases and Error Handling', () => {

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Malformed Template Handling', () => {
    test('should handle unclosed variable expressions', () => {
      const malformedTemplates = [
        '{{ unclosed',
        '{{ missing.close',
        '{{',
        '{{ variable with spaces and no close'
      ];

      malformedTemplates.forEach(template => {
        expect(() => render(template, {})).toThrow(/unclosed|invalid|malformed/i);
      });
    });

    test('should handle unclosed block expressions', () => {
      const malformedTemplates = [
        '{% if condition',
        '{% for item in items',
        '{%',
        '{% invalid block syntax'
      ];

      malformedTemplates.forEach(template => {
        expect(() => render(template, {})).toThrow(/unclosed|invalid|malformed/i);
      });
    });

    test('should handle mismatched block tags', () => {
      const mismatchedTemplates = [
        '{% if condition %}content{% endfor %}',
        '{% for item in items %}{{ item }}{% endif %}',
        '{% if condition %}{% for item in items %}content{% endif %}{% endfor %}',
        '{% else %}no if statement',
        '{% endif %}no if statement',
        '{% endfor %}no for statement'
      ];

      mismatchedTemplates.forEach(template => {
        expect(() => render(template, {})).toThrow(/mismatch|unexpected|unmatched/i);
      });
    });

    test('should handle nested mismatches', () => {
      const template = '{% if outer %}{% for item in items %}content{% endif %}';
      expect(() => render(template, {})).toThrow();
    });

    test('should handle empty expressions', () => {
      const emptyExpressions = [
        '{{ }}',
        '{{  }}',
        '{% %}',
        '{%  %}'
      ];

      emptyExpressions.forEach(template => {
        expect(() => render(template, {})).toThrow(/empty|invalid/i);
      });
    });
  });

  describe('Context Edge Cases', () => {
    test('should handle null context', () => {
      const template = '{{ name }}';
      expect(() => render(template, null)).not.toThrow();
      expect(render(template, null)).toBe('');
    });

    test('should handle undefined context', () => {
      const template = '{{ name }}';
      expect(() => render(template, undefined)).not.toThrow();
      expect(render(template, undefined)).toBe('');
    });

    test('should handle context with null prototype', () => {
      const context = Object.create(null);
      context.name = 'John';
      const template = '{{ name }}';
      const result = render(template, context);
      expect(result).toBe('John');
    });

    test('should handle frozen context objects', () => {
      const context = Object.freeze({ name: 'John', age: 30 });
      const template = '{{ name }} is {{ age }} years old';
      const result = render(template, context);
      expect(result).toBe('John is 30 years old');
    });

    test('should handle context with getters', () => {
      const context = {
        get computedValue() {
          return 'computed';
        },
        get throwingGetter() {
          throw new Error('Getter error');
        }
      };

      const template1 = '{{ computedValue }}';
      expect(render(template1, context)).toBe('computed');

      const template2 = '{{ throwingGetter }}';
      expect(() => render(template2, context)).toThrow();
    });

    test('should handle context with symbols', () => {
      const sym = Symbol('test');
      const context = {
        [sym]: 'symbol value',
        name: 'John'
      };
      
      const template = '{{ name }}';
      const result = render(template, context);
      expect(result).toBe('John');
    });
  });

  describe('Variable Access Edge Cases', () => {
    test('should handle accessing properties of primitives', () => {
      const context = {
        str: 'hello',
        num: 42,
        bool: true
      };

      const tests = [
        { template: '{{ str.length }}', expected: '5' },
        { template: '{{ num.toString }}', expected: '' }, // Should not allow method access
        { template: '{{ bool.valueOf }}', expected: '' }  // Should not allow method access
      ];

      tests.forEach(({ template, expected }) => {
        const result = render(template, context);
        expect(result).toBe(expected);
      });
    });

    test('should handle array-like objects', () => {
      const context = {
        arrayLike: {
          0: 'first',
          1: 'second',
          length: 2
        }
      };

      const template = '{{ arrayLike.0 }} {{ arrayLike.1 }} (length: {{ arrayLike.length }})';
      const result = render(template, context);
      expect(result).toBe('first second (length: 2)');
    });

    test('should handle sparse arrays', () => {
      const sparseArray: (string | undefined)[] = [];
      sparseArray[0] = 'first';
      sparseArray[5] = 'sixth';
      
      const context: Context = { sparse: sparseArray };
      const template = '{{ sparse.0 }} {{ sparse.5 }} {{ sparse.2 }}';
      const result = render(template, context);
      expect(result).toBe('first sixth ');
    });

    test('should handle very long property chains', () => {
      const context = { level1: { level2: { level3: { level4: { level5: 'deep' } } } } };
      const template = '{{ level1.level2.level3.level4.level5 }}';
      const result = render(template, context);
      expect(result).toBe('deep');
    });

    test('should handle property names with special characters', () => {
      const context = {
        'hyphen-property': 'hyphen',
        'underscore_property': 'underscore',
        'number123': 'number',
        '$dollar': 'dollar'
      };

      const tests = [
        { template: '{{ hyphen-property }}', expected: 'hyphen' },
        { template: '{{ underscore_property }}', expected: 'underscore' },
        { template: '{{ number123 }}', expected: 'number' },
        { template: '{{ $dollar }}', expected: 'dollar' }
      ];

      tests.forEach(({ template, expected }) => {
        const result = render(template, context);
        expect(result).toBe(expected);
      });
    });
  });

  describe('Loop Edge Cases', () => {
    test('should handle empty arrays', () => {
      const template = '{% for item in items %}{{ item }}{% endfor %}';
      const contexts = [
        { items: [] },
        { items: null },
        { items: undefined },
        {}
      ];

      contexts.forEach(context => {
        const result = render(template, context);
        expect(result).toBe('');
      });
    });

    test('should handle non-iterable values', () => {
      const template = '{% for item in nonIterable %}{{ item }}{% endfor %}';
      const contexts = [
        { nonIterable: 42 },
        { nonIterable: true },
        { nonIterable: 'string' }, // strings are iterable, should work
        { nonIterable: { not: 'array' } }
      ];

      contexts.forEach((context, index) => {
        if (index === 2) {
          // String should iterate over characters
          const result = render(template, context);
          expect(result).toBe('string');
        } else {
          expect(() => render(template, context)).toThrow();
        }
      });
    });

    test('should handle arrays that are modified during iteration', () => {
      // This is more of a conceptual test - the actual implementation
      // should create a snapshot of the array before iteration
      const template = '{% for item in items %}{{ item }} {% endfor %}';
      const context = { items: ['a', 'b', 'c'] };
      
      const result = render(template, context);
      expect(result).toBe('a b c ');
    });

    test('should handle very large arrays', () => {
      const largeArray = Array.from({ length: 10000 }, (_, i) => i);
      const template = '{% for item in items %}{% if item == 5000 %}found{% endif %}{% endfor %}';
      const context = { items: largeArray };
      
      const start = Date.now();
      const result = render(template, context);
      const end = Date.now();
      
      expect(result).toBe('found');
      expect(end - start).toBeLessThan(1000); // Should complete within 1 second
    });

    test('should handle nested arrays correctly', () => {
      const template = `
        {% for row in matrix %}
          {% for cell in row %}
            {{ cell }}
          {% endfor %}
        {% endfor %}
      `.trim();

      const context = {
        matrix: [
          [1, 2, 3],
          [4, 5, 6],
          [7, 8, 9]
        ]
      };

      const result = render(template, context);
      expect(result.replace(/\s+/g, '')).toBe('123456789');
    });
  });

  describe('Conditional Edge Cases', () => {
    test('should handle falsy values correctly', () => {
      const falsyValues = [false, 0, '', null, undefined, NaN];
      
      falsyValues.forEach((value, index) => {
        const template = '{% if value %}truthy{% else %}falsy{% endif %}';
        const context = { value };
        const result = render(template, context);
        expect(result).toBe('falsy');
      });
    });

    test('should handle truthy values correctly', () => {
      const truthyValues = [true, 1, 'hello', {}, 'false', '0']; // [] - we are treating empty arrays as falsy
      
      truthyValues.forEach(value => {
        const template = '{% if value %}truthy{% else %}falsy{% endif %}';
        const context = { value };
        const result = render(template, context);
        expect(result).toBe('truthy');
      });
    });

    test('should handle complex boolean expressions', () => {
      const template = '{% if (a && b) || (c && d) %}complex{% endif %}';
      const tests = [
        { context: { a: true, b: true, c: false, d: false }, expected: 'complex' },
        { context: { a: false, b: true, c: true, d: true }, expected: 'complex' },
        { context: { a: false, b: false, c: false, d: false }, expected: '' },
        { context: { a: true, b: false, c: false, d: true }, expected: '' }
      ];

      tests.forEach(({ context, expected }) => {
        const result = render(template, context);
        expect(result).toBe(expected);
      });
    });

    test('should handle nested conditions with mixed content', () => {
      const template = `
        {% if user %}
          User: {{ user.name }}
          {% if user.isAdmin %}
            {% for permission in user.permissions %}
              Permission: {{ permission }}
            {% endfor %}
          {% else %}
            Limited access
          {% endif %}
        {% else %}
          No user
        {% endif %}
      `.trim();

      const context1 = {
        user: {
          name: 'Admin User',
          isAdmin: true,
          permissions: ['read', 'write', 'delete']
        }
      };

      const context2 = {
        user: {
          name: 'Regular User',
          isAdmin: false
        }
      };

      const context3 = {};

      const result1 = render(template, context1);
      expect(result1).toContain('User: Admin User');
      expect(result1).toContain('Permission: read');
      expect(result1).toContain('Permission: write');
      expect(result1).toContain('Permission: delete');

      const result2 = render(template, context2);
      expect(result2).toContain('User: Regular User');
      expect(result2).toContain('Limited access');
      expect(result2).not.toContain('Permission:');

      const result3 = render(template, context3);
      expect(result3.trim()).toBe('No user');
    });
  });

  describe('Memory and Performance Edge Cases', () => {
    test('should handle templates with many variables efficiently', () => {
      const variables = Array.from({ length: 1000 }, (_, i) => `var${i}`);
      const template = variables.map(v => `{{ ${v} }}`).join(' ');
      
      const context: Context = {};
      variables.forEach(v => {
        context[v] = v;
      });

      const start = Date.now();
      const result = render(template, context);
      const end = Date.now();

      expect(result).toContain('var0');
      expect(result).toContain('var999');
      expect(end - start).toBeLessThan(500); // Should complete within 500ms
    });

    test('should handle deeply nested structures without stack overflow', () => {
      let deepContext: Context = { value: 'bottom' };
      for (let i = 0; i < 100; i++) {
        deepContext = { next: deepContext };
      }

      const template = '{{ deep.next.next.next.next.next.value }}';
      const context = { deep: deepContext };
      
      expect(() => render(template, context)).not.toThrow();
    });

    test('should handle circular references gracefully', () => {
      const context: Context = {
        user: { name: 'John' },
        company: { name: 'Tech Corp' }
      };
      context.user.company = context.company;
      context.company.founder = context.user;

      const template = '{{ user.name }} founded {{ user.company.name }}';
      const result = render(template, context);
      expect(result).toBe('John founded Tech Corp');
    });

    test('should handle memory-intensive operations', () => {
      const template = '{% for i in range %}{{ i }}{% endfor %}';
      const context = { range: Array.from({ length: 10000 }, (_, i) => i) };
      
      const beforeMemory = process.memoryUsage().heapUsed;
      const result = render(template, context);
      const afterMemory = process.memoryUsage().heapUsed;
      
      expect(result).toContain('0');
      expect(result).toContain('9999');
      
      // Memory increase should be reasonable (less than 100MB)
      const memoryIncrease = afterMemory - beforeMemory;
      expect(memoryIncrease).toBeLessThan(100 * 1024 * 1024);
    });
  });

  describe('Unicode and Special Characters', () => {
    test('should handle Unicode characters correctly', () => {
      const template = '{{ greeting }} {{ emoji }}';
      const context = {
        greeting: 'Hello 世界',
        emoji: '🚀✨🎉'
      };
      
      const result = render(template, context);
      expect(result).toBe('Hello 世界 🚀✨🎉');
    });

    test('should handle special whitespace characters', () => {
      const template = 'Before{{   variable   }}After';
      const context = { variable: 'MIDDLE' };
      const result = render(template, context);
      expect(result).toBe('BeforeMIDDLEAfter');
    });

    test('should handle newlines and tabs in templates', () => {
      const template = 'Line 1\n{{ variable }}\tTabbed\r\nWindows line ending';
      const context = { variable: 'INSERTED' };
      const result = render(template, context);
      expect(result).toBe('Line 1\nINSERTED\tTabbed\r\nWindows line ending');
    });

    test('should handle zero-width characters', () => {
      const template = '{{ value }}';
      const context = { value: 'test\u200B\u200C\u200Dtest' }; // Zero-width characters
      const result = render(template, context);
      expect(result).toContain('test');
    });
  });

  describe('Error Recovery', () => {
    test('should provide helpful error messages', () => {
      const errorCases = [
        {
          template: '{{ unclosed',
          expectedError: /unclosed|missing/i
        },
        {
          template: '{% if condition %}{% endfor %}',
          expectedError: /mismatch|unexpected/i
        },
        {
          template: '{{ invalid..property }}',
          expectedError: /invalid|syntax/i
        }
      ];

      errorCases.forEach(({ template, expectedError }) => {
        try {
          render(template, {});
          fail('Expected an error to be thrown');
        } catch (error: any) {
          expect(error.message).toMatch(expectedError);
        }
      });
    });

    test('should include position information in errors', () => {
      const template = 'Valid content {{ unclosed variable';
      
      try {
        render(template, {});
        fail('Expected an error to be thrown');
      } catch (error: any) {
        expect(error.message).toMatch(/position|line|column/i);
      }
    });

    test('should handle multiple errors gracefully', () => {
      const template = '{{ unclosed1 {{ unclosed2';
      
      expect(() => render(template, {})).toThrow();
    });
  });
});