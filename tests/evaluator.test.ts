import { describe, test, expect } from '@jest/globals';
import { Context, evaluate } from '../src/evaluator';
import { ASTNode } from '../src/parser';

describe('Evaluator', () => {

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('TextNode evaluation', () => {
    test('should return text content as-is', () => {
      const node: ASTNode = { type: 'TextNode', value: 'Hello World' };
      const context = {};
      const result = evaluate(node, context);
      expect(result).toBe('Hello World');
    });

    test('should handle empty text content', () => {
      const node: ASTNode = { type: 'TextNode', value: '' };
      const context = {};
      const result = evaluate(node, context);
      expect(result).toBe('');
    });

    test('should handle text with special characters', () => {
      const node: ASTNode = { type: 'TextNode', value: '<script>alert("test")</script>' };
      const context = {};
      const result = evaluate(node, context);
      expect(result).toBe('<script>alert("test")</script>');
    });
  });

  describe('VariableNode evaluation', () => {
    test('should resolve simple variable from context', () => {
      const node: ASTNode = { type: 'VariableNode', expression: 'name' };
      const context = { name: 'John' };
      const result = evaluate(node, context);
      expect(result).toBe('John');
    });

    test('should resolve nested property access', () => {
      const node: ASTNode = { type: 'VariableNode', expression: 'user.profile.name' };
      const context = {
        user: {
          profile: {
            name: 'John Doe'
          }
        }
      };
      const result = evaluate(node, context);
      expect(result).toBe('John Doe');
    });

    test('should handle missing variables gracefully', () => {
      const node: ASTNode = { type: 'VariableNode', expression: 'missing' };
      const context = {};
      const result = evaluate(node, context);
      expect(result).toBe('');
    });

    test('should handle nested property access with missing properties', () => {
      const node: ASTNode = { type: 'VariableNode', expression: 'user.profile.name' };
      const context = { user: {} };
      const result = evaluate(node, context);
      expect(result).toBe('');
    });

    test('should evaluate expressions with operators', () => {
      const node: ASTNode = { type: 'VariableNode', expression: 'count + 1' };
      const context = { count: 5 };
      const result = evaluate(node, context);
      expect(result).toBe('6');
    });

    test('should handle string concatenation', () => {
      const node: ASTNode = { type: 'VariableNode', expression: 'firstName + " " + lastName' };
      const context = { firstName: 'John', lastName: 'Doe' };
      const result = evaluate(node, context);
      expect(result).toBe('John Doe');
    });

    test('should HTML escape output by default', () => {
      const node: ASTNode = { type: 'VariableNode', expression: 'html' };
      const context = { html: '<script>alert("xss")</script>' };
      const result = evaluate(node, context);
      expect(result).toBe('&lt;script&gt;alert(&quot;xss&quot;)&lt;&#x2F;script&gt;');
    });

    test('should handle various data types', () => {
      const tests = [
        { expression: 'number', context: { number: 42 }, expected: '42' },
        { expression: 'boolean', context: { boolean: true }, expected: 'true' },
        { expression: 'null_val', context: { null_val: null }, expected: '' },
        { expression: 'undefined_val', context: { undefined_val: undefined }, expected: '' },
        { expression: 'array', context: { array: [1, 2, 3] }, expected: '1,2,3' }
      ];

      tests.forEach(({ expression, context, expected }) => {
        const node: ASTNode = { type: 'VariableNode', expression };
        const result = evaluate(node, context);
        expect(result).toBe(expected);
      });
    });
  });

  describe('IfNode evaluation', () => {
    test('should render body when condition is true', () => {
      const node: ASTNode = {
        type: 'IfNode',
        condition: 'isVisible',
        body: [{ type: 'TextNode', value: 'Visible content' }],
        elseBody: []
      };
      const context = { isVisible: true };
      const result = evaluate(node, context);
      expect(result).toBe('Visible content');
    });

    test('should render else body when condition is false', () => {
      const node: ASTNode = {
        type: 'IfNode',
        condition: 'isVisible',
        body: [{ type: 'TextNode', value: 'Visible content' }],
        elseBody: [{ type: 'TextNode', value: 'Hidden content' }]
      };
      const context = { isVisible: false };
      const result = evaluate(node, context);
      expect(result).toBe('Hidden content');
    });

    test('should handle complex conditions', () => {
      const node: ASTNode = {
        type: 'IfNode',
        condition: 'user.age >= 18 && user.verified',
        body: [{ type: 'TextNode', value: 'Access granted' }],
        elseBody: [{ type: 'TextNode', value: 'Access denied' }]
      };
      
      const context1 = { user: { age: 20, verified: true } };
      expect(evaluate(node, context1)).toBe('Access granted');

      const context2 = { user: { age: 16, verified: true } };
      expect(evaluate(node, context2)).toBe('Access denied');

      const context3 = { user: { age: 20, verified: false } };
      expect(evaluate(node, context3)).toBe('Access denied');
    });

    test('should handle nested if statements', () => {
      const node: ASTNode = {
        type: 'IfNode',
        condition: 'user',
        body: [
          {
            type: 'IfNode',
            condition: 'user.isAdmin',
            body: [{ type: 'TextNode', value: 'Admin panel' }],
            elseBody: [{ type: 'TextNode', value: 'User panel' }]
          }
        ],
        elseBody: [{ type: 'TextNode', value: 'Login required' }]
      };

      const context1 = { user: { isAdmin: true } };
      expect(evaluate(node, context1)).toBe('Admin panel');

      const context2 = { user: { isAdmin: false } };
      expect(evaluate(node, context2)).toBe('User panel');

      const context3 = {};
      expect(evaluate(node, context3)).toBe('Login required');
    });

    test('should handle empty bodies', () => {
      const node: ASTNode = {
        type: 'IfNode',
        condition: 'condition',
        body: [],
        elseBody: []
      };
      const context = { condition: true };
      const result = evaluate(node, context);
      expect(result).toBe('');
    });

    test('should handle multiple nodes in body', () => {
      const node: ASTNode = {
        type: 'IfNode',
        condition: 'show',
        body: [
          { type: 'TextNode', value: 'Hello ' },
          { type: 'VariableNode', expression: 'name' },
          { type: 'TextNode', value: '!' }
        ],
        elseBody: []
      };
      const context = { show: true, name: 'John' };
      const result = evaluate(node, context);
      expect(result).toBe('Hello John!');
    });
  });

  describe('ForNode evaluation', () => {
    test('should iterate over array and render body for each item', () => {
      const node: ASTNode = {
        type: 'ForNode',
        item: 'user',
        iterable: 'users',
        body: [
          { type: 'TextNode', value: 'Hello ' },
          { type: 'VariableNode', expression: 'user' },
          { type: 'TextNode', value: '! ' }
        ]
      };
      const context = { users: ['John', 'Jane', 'Bob'] };
      const result = evaluate(node, context);
      expect(result).toBe('Hello John! Hello Jane! Hello Bob! ');
    });

    test('should handle object iteration', () => {
      const node: ASTNode = {
        type: 'ForNode',
        item: 'user',
        iterable: 'users',
        body: [
          { type: 'VariableNode', expression: 'user.name' },
          { type: 'TextNode', value: ' ' }
        ]
      };
      const context = {
        users: [
          { name: 'John' },
          { name: 'Jane' }
        ]
      };
      const result = evaluate(node, context);
      expect(result).toBe('John Jane ');
    });

    test('should handle for loop with index', () => {
      const node: ASTNode = {
        type: 'ForNode',
        item: 'user',
        index: 'i',
        iterable: 'users',
        body: [
          { type: 'VariableNode', expression: 'i' },
          { type: 'TextNode', value: ': ' },
          { type: 'VariableNode', expression: 'user' },
          { type: 'TextNode', value: ' ' }
        ]
      };
      const context = { users: ['John', 'Jane'] };
      const result = evaluate(node, context);
      expect(result).toBe('0: John 1: Jane ');
    });

    test('should handle empty arrays', () => {
      const node: ASTNode = {
        type: 'ForNode',
        item: 'item',
        iterable: 'items',
        body: [{ type: 'TextNode', value: 'Item' }]
      };
      const context = { items: [] };
      const result = evaluate(node, context);
      expect(result).toBe('');
    });

    test('should handle missing iterable', () => {
      const node: ASTNode = {
        type: 'ForNode',
        item: 'item',
        iterable: 'missing',
        body: [{ type: 'TextNode', value: 'Item' }]
      };
      const context = {};
      const result = evaluate(node, context);
      expect(result).toBe('');
    });

    test('should handle nested for loops', () => {
      const node: ASTNode = {
        type: 'ForNode',
        item: 'category',
        iterable: 'categories',
        body: [
          { type: 'VariableNode', expression: 'category.name' },
          { type: 'TextNode', value: ': ' },
          {
            type: 'ForNode',
            item: 'item',
            iterable: 'category.items',
            body: [
              { type: 'VariableNode', expression: 'item' },
              { type: 'TextNode', value: ' ' }
            ]
          },
          { type: 'TextNode', value: '\n' }
        ]
      };
      const context = {
        categories: [
          { name: 'Fruits', items: ['Apple', 'Banana'] },
          { name: 'Colors', items: ['Red', 'Blue'] }
        ]
      };
      const result = evaluate(node, context);
      expect(result).toBe('Fruits: Apple Banana \nColors: Red Blue \n');
    });

    test('should handle context scoping correctly', () => {
      const node: ASTNode = {
        type: 'ForNode',
        item: 'item',
        iterable: 'items',
        body: [
          { type: 'VariableNode', expression: 'item' },
          { type: 'TextNode', value: '-' },
          { type: 'VariableNode', expression: 'global' },
          { type: 'TextNode', value: ' ' }
        ]
      };
      const context = { items: ['A', 'B'], global: 'GLOBAL' };
      const result = evaluate(node, context);
      expect(result).toBe('A-GLOBAL B-GLOBAL ');
    });
  });

  describe('Complex template evaluation', () => {
    test('should evaluate complex nested structure', () => {
      const ast: ASTNode[] = [
        { type: 'TextNode', value: '<ul>' },
        {
          type: 'ForNode',
          item: 'user',
          iterable: 'users',
          body: [
            { type: 'TextNode', value: '<li>' },
            { type: 'VariableNode', expression: 'user.name' },
            {
              type: 'IfNode',
              condition: 'user.isAdmin',
              body: [{ type: 'TextNode', value: ' (Admin)' }],
              elseBody: [{ type: 'TextNode', value: ' (User)' }]
            },
            { type: 'TextNode', value: '</li>' }
          ]
        },
        { type: 'TextNode', value: '</ul>' }
      ];

      const context = {
        users: [
          { name: 'John', isAdmin: true },
          { name: 'Jane', isAdmin: false }
        ]
      };

      const result = ast.map(node => evaluate(node, context)).join('');
      expect(result).toBe('<ul><li>John (Admin)</li><li>Jane (User)</li></ul>');
    });
  });

  describe('Error handling', () => {
    test('should handle invalid expressions gracefully', () => {
      const node: ASTNode = { type: 'VariableNode', expression: 'invalid.syntax[' };
      const context = {};
      expect(() => evaluate(node, context)).toThrow('Invalid expression');
    });

    test('should prevent access to dangerous globals', () => {
      const node: ASTNode = { type: 'VariableNode', expression: 'process.exit()' };
      const context = {};
      expect(() => evaluate(node, context)).toThrow('Access to dangerous globals is not allowed');
    });

    test('should handle circular references in context', () => {
      const context: Context = { self: null };
      context.self = context;
      
      const node: ASTNode = { type: 'VariableNode', expression: 'self' };
      expect(() => evaluate(node, context)).not.toThrow();
    });
  });

  describe('Security features', () => {
    test('should escape HTML by default', () => {
      const node: ASTNode = { type: 'VariableNode', expression: 'html' };
      const context = { html: '<script>alert("xss")</script>' };
      const result = evaluate(node, context);
      expect(result).toBe('&lt;script&gt;alert(&quot;xss&quot;)&lt;&#x2F;script&gt;');
    });

    test('should escape various HTML entities', () => {
      const tests = [
        { input: '<', expected: '&lt;' },
        { input: '>', expected: '&gt;' },
        { input: '&', expected: '&amp;' },
        { input: '"', expected: '&quot;' },
        { input: '\'', expected: '&#x27;' },
        { input: '/', expected: '&#x2F;' }
      ];

      tests.forEach(({ input, expected }) => {
        const node: ASTNode = { type: 'VariableNode', expression: 'value' };
        const context = { value: input };
        const result = evaluate(node, context);
        expect(result).toBe(expected);
      });
    });

    test('should handle mixed content escaping', () => {
      const node: ASTNode = { type: 'VariableNode', expression: 'content' };
      const context = { content: 'Hello <b>"World"</b> & friends' };
      const result = evaluate(node, context);
      expect(result).toBe('Hello &lt;b&gt;&quot;World&quot;&lt;&#x2F;b&gt; &amp; friends');
    });
  });

  describe('Performance considerations', () => {
    test('should handle large arrays efficiently', () => {
      const largeArray = Array.from({ length: 1000 }, (_, i) => `Item ${i}`);
      const node: ASTNode = {
        type: 'ForNode',
        item: 'item',
        iterable: 'items',
        body: [
          { type: 'VariableNode', expression: 'item' },
          { type: 'TextNode', value: ' ' }
        ]
      };
      const context = { items: largeArray };
      
      const start = Date.now();
      const result = evaluate(node, context);
      const end = Date.now();
      
      expect(result).toContain('Item 0');
      expect(result).toContain('Item 999');
      expect(end - start).toBeLessThan(100); // Should complete in under 100ms
    });

    test('should handle deep nesting efficiently', () => {
      const deepObject = { level1: { level2: { level3: { value: 'deep' } } } };
      const node: ASTNode = { type: 'VariableNode', expression: 'obj.level1.level2.level3.value' };
      const context = { obj: deepObject };
      
      const result = evaluate(node, context);
      expect(result).toBe('deep');
    });
  });
});