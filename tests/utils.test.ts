import { describe, test, expect } from '@jest/globals';
import { escapeHtml, get, evaluateExpression, safeEvaluate } from '../src/utils';
import { Context } from '../src/evaluator';

describe('Utils', () => {

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('escapeHtml', () => {
    test('should escape HTML entities', () => {
      const tests = [
        { input: '<script>', expected: '&lt;script&gt;' },
        { input: '"hello"', expected: '&quot;hello&quot;' },
        { input: '\'world\'', expected: '&#x27;world&#x27;' },
        { input: 'a & b', expected: 'a &amp; b' },
        { input: 'path/to/file', expected: 'path&#x2F;to&#x2F;file' }
      ];

      tests.forEach(({ input, expected }) => {
        expect(escapeHtml(input)).toBe(expected);
      });
    });

    test('should handle edge cases', () => {
      expect(escapeHtml('')).toBe('');
      expect(escapeHtml(null)).toBe('');
      expect(escapeHtml(undefined)).toBe('');
      expect(escapeHtml(123)).toBe('123');
      expect(escapeHtml(true)).toBe('true');
    });

    test('should handle complex HTML structures', () => {
      const input = '<div class="test" onclick="alert(\'xss\')">Content</div>';
      const result = escapeHtml(input);
      expect(result).not.toContain('<div');
      expect(result).not.toContain('onclick=');
      expect(result).toContain('&lt;div');
      expect(result).toContain('&#x27;xss&#x27;');
    });
  });

  describe('get - Safe Property Access', () => {
    test('should access simple properties', () => {
      const obj = { name: 'John', age: 30 };
      expect(get(obj, 'name')).toBe('John');
      expect(get(obj, 'age')).toBe(30);
    });

    test('should access nested properties', () => {
      const obj = {
        user: {
          profile: {
            name: 'John Doe',
            settings: {
              theme: 'dark'
            }
          }
        }
      };
      
      expect(get(obj, 'user.profile.name')).toBe('John Doe');
      expect(get(obj, 'user.profile.settings.theme')).toBe('dark');
    });

    test('should handle missing properties gracefully', () => {
      const obj = { user: { name: 'John' } };
      expect(get(obj, 'user.missing')).toBeUndefined();
      expect(get(obj, 'missing.property')).toBeUndefined();
      expect(get(obj, 'user.profile.name')).toBeUndefined();
    });

    test('should handle null and undefined objects', () => {
      expect(get(null, 'property')).toBeUndefined();
      expect(get(undefined, 'property')).toBeUndefined();
      expect(get({}, 'property')).toBeUndefined();
    });

    test('should handle array access', () => {
      const obj = {
        items: ['apple', 'banana', 'cherry'],
        users: [
          { name: 'John' },
          { name: 'Jane' }
        ]
      };
      
      expect(get(obj, 'items.0')).toBe('apple');
      expect(get(obj, 'items.2')).toBe('cherry');
      expect(get(obj, 'users.1.name')).toBe('Jane');
    });

    test('should handle special characters in property names', () => {
      const obj = {
        'user-name': 'John',
        'user$id': 123,
        'user.email': 'john@example.com'
      };
      
      expect(get(obj, 'user-name')).toBe('John');
      expect(get(obj, 'user$id')).toBe(123);
      // Note: dots in property names would need special escaping
    });

    test('should handle edge cases', () => {
      const obj = {
        0: 'zero',
        '': 'empty',
        'null': 'null-value',
        'undefined': 'undefined-value'
      };
      
      expect(get(obj, '0')).toBe('zero');
      expect(get(obj, '')).toBe('empty');
      expect(get(obj, 'null')).toBe('null-value');
      expect(get(obj, 'undefined')).toBe('undefined-value');
    });
  });

  describe('safeEvaluate - Expression Evaluation', () => {
    test('should evaluate simple expressions', () => {
      const context = { a: 5, b: 3 };
      expect(safeEvaluate('a + b', context)).toBe(8);
      expect(safeEvaluate('a * b', context)).toBe(15);
      expect(safeEvaluate('a > b', context)).toBe(true);
    });

    test('should evaluate string operations', () => {
      const context = { firstName: 'John', lastName: 'Doe' };
      expect(safeEvaluate('firstName + " " + lastName', context)).toBe('John Doe');
    });

    test('should evaluate boolean logic', () => {
      const context = { isAdmin: true, isActive: false, age: 25 };
      expect(safeEvaluate('isAdmin && isActive', context)).toBe(false);
      expect(safeEvaluate('isAdmin || isActive', context)).toBe(true);
      expect(safeEvaluate('age >= 18 && isAdmin', context)).toBe(true);
    });

    test('should handle nested property access', () => {
      const context = {
        user: {
          profile: {
            age: 30,
            verified: true
          }
        }
      };
      
      expect(safeEvaluate('user.profile.age', context)).toBe(30);
      expect(safeEvaluate('user.profile.age >= 18', context)).toBe(true);
      expect(safeEvaluate('user.profile.verified', context)).toBe(true);
    });

    test('should prevent access to dangerous globals', () => {
      const context = {};
      const dangerousExpressions = [
        'process.exit()',
        'require("fs")',
        'global.something',
        'Function("return process")()',
        'eval("alert(1)")',
        'setTimeout',
        'console.log',
        '__dirname',
        '__filename'
      ];

      dangerousExpressions.forEach(expr => {
        expect(() => safeEvaluate(expr, context)).toThrow();
      });
    });

    test('should prevent prototype pollution', () => {
      const context = {};
      const maliciousExpressions = [
        '__proto__.polluted = true',
        'constructor.prototype.hacked = true',
        'Object.prototype.evil = "bad"'
      ];

      maliciousExpressions.forEach(expr => {
        expect(() => safeEvaluate(expr, context)).toThrow();
      });
    });

    test('should handle missing variables gracefully', () => {
      const context = { a: 5 };
      expect(safeEvaluate('missing', context)).toBeUndefined();
      expect(safeEvaluate('missing.property', context)).toBeUndefined();
    });

    test('should handle array operations', () => {
      const context = {
        numbers: [1, 2, 3, 4, 5],
        users: [{ name: 'John' }, { name: 'Jane' }]
      };
      
      expect(safeEvaluate('numbers.length', context)).toBe(5);
      expect(safeEvaluate('users.length', context)).toBe(2);
      expect(safeEvaluate('numbers[0]', context)).toBe(1);
    });

    test('should handle complex conditional logic', () => {
      const context = {
        user: { age: 25, isVerified: true, role: 'admin' },
        settings: { allowAccess: true }
      };
      
      const expression = 'user.age >= 18 && user.isVerified && (user.role === "admin" || settings.allowAccess)';
      expect(safeEvaluate(expression, context)).toBe(true);
    });

    test('should handle type coercion safely', () => {
      const context = { str: '5', num: 5, bool: true };
      expect(safeEvaluate('str == num', context)).toBe(true);
      expect(safeEvaluate('str === num', context)).toBe(false);
      expect(safeEvaluate('bool + num', context)).toBe(6);
    });

    test('should handle null and undefined safely', () => {
      const context = { nullValue: null, undefinedValue: undefined };
      expect(safeEvaluate('nullValue', context)).toBe(null);
      expect(safeEvaluate('undefinedValue', context)).toBe(undefined);
      expect(safeEvaluate('nullValue == undefinedValue', context)).toBe(true);
      expect(safeEvaluate('nullValue === undefinedValue', context)).toBe(false);
    });

    test('should throw on invalid syntax', () => {
      const context = {};
      const invalidExpressions = [
        'invalid syntax[',
        'function() { return "bad"; }',
        '() => "arrow function"',
        'var x = 5',
        'let y = 10',
        'const z = 15'
      ];

      invalidExpressions.forEach(expr => {
        expect(() => safeEvaluate(expr, context)).toThrow();
      });
    });
  });

  describe('Performance', () => {
    test('should handle large objects efficiently', () => {
      const largeObject: any = {};
      for (let i = 0; i < 1000; i++) {
        largeObject[`prop${i}`] = `value${i}`;
      }
      
      const start = Date.now();
      const result = get(largeObject, 'prop500');
      const end = Date.now();
      
      expect(result).toBe('value500');
      expect(end - start).toBeLessThan(10); // Should be very fast
    });

    test('should handle deep nesting efficiently', () => {
      let deepObject: Context = { value: 'deep' };
      for (let i = 0; i < 50; i++) {
        deepObject = { level: deepObject };
      }
      
      const start = Date.now();
      const result = get(deepObject, 'level.'.repeat(50) + 'value');
      const end = Date.now();
      
      expect(result).toBe('deep');
      expect(end - start).toBeLessThan(50);
    });

    test('should evaluate complex expressions efficiently', () => {
      const context = {
        items: Array.from({ length: 100 }, (_, i) => ({ id: i, active: i % 2 === 0 }))
      };
      
      const start = Date.now();
      const result = safeEvaluate('items.length > 50', context);
      const end = Date.now();
      
      expect(result).toBe(true);
      expect(end - start).toBeLessThan(10);
    });
  });

  describe('Security Edge Cases', () => {
    test('should prevent indirect access to dangerous objects', () => {
      const context = {
        obj: {
          constructor: Object,
          toString: Object.prototype.toString
        }
      };
      
      expect(() => safeEvaluate('obj.constructor("return process")', context)).toThrow();
      expect(() => safeEvaluate('obj.toString.constructor', context)).toThrow();
    });

    test('should handle circular references safely', () => {
      const context: Context = { circular: {} };
      context.circular.self = context.circular;
      
      expect(() => get(context, 'circular.self.self.self')).not.toThrow();
      expect(() => safeEvaluate('circular.self === circular', context)).not.toThrow();
    });

    test('should prevent access through computed properties', () => {
      const context = { 
        key: 'constructor',
        obj: {}
      };
      
      expect(() => safeEvaluate('obj[key]', context)).toThrow();
      expect(() => safeEvaluate('this[key]', context)).toThrow();
    });
  });
});