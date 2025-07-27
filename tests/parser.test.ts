import { describe, test, expect } from '@jest/globals';
import { IfNode, parse, TextNode, VariableNode } from '../src/parser';
import { Token } from '../src/tokenizer';

describe('Parser', () => {

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('TextNode parsing', () => {
    test('should parse simple text tokens into TextNode', () => {
      const tokens: Token[] = [
        { type: 'TEXT', value: 'Hello World', position: { start: 0, end: 11 } }
      ];
      const ast = parse(tokens);
      expect(ast).toEqual([
        { type: 'TextNode', value: 'Hello World' }
      ]);
    });

    test('should handle multiple consecutive text tokens', () => {
      const tokens: Token[] = [
        { type: 'TEXT', value: 'Hello ', position: { start: 0, end: 6 } },
        { type: 'TEXT', value: 'World', position: { start: 6, end: 11 } }
      ];
      const ast = parse(tokens);
      expect(ast).toEqual([
        { type: 'TextNode', value: 'Hello ' },
        { type: 'TextNode', value: 'World' }
      ]);
    });
  });

  describe('VariableNode parsing', () => {
    test('should parse simple variable into VariableNode', () => {
      const tokens: Token[] = [
        { type: 'VARIABLE', value: 'name', position: { start: 0, end: 10 } }
      ];
      const ast = parse(tokens);
      expect(ast).toEqual([
        { type: 'VariableNode', expression: 'name' }
      ]);
    });

    test('should parse nested property access', () => {
      const tokens: Token[] = [
        { type: 'VARIABLE', value: 'user.profile.name', position: { start: 0, end: 23 } }
      ];
      const ast = parse(tokens);
      expect(ast).toEqual([
        { type: 'VariableNode', expression: 'user.profile.name' }
      ]);
    });

    test('should parse variable expressions with operations', () => {
      const tokens: Token[] = [
        { type: 'VARIABLE', value: 'count + 1', position: { start: 0, end: 15 } }
      ];
      const ast = parse(tokens);
      expect(ast).toEqual([
        { type: 'VariableNode', expression: 'count + 1' }
      ]);
    });
  });

  describe('IfNode parsing', () => {
    test('should parse simple if statement', () => {
      const tokens: Token[] = [
        { type: 'IF_START', value: 'condition', position: { start: 0, end: 18 } },
        { type: 'TEXT', value: 'content', position: { start: 18, end: 25 } },
        { type: 'IF_END', value: '', position: { start: 25, end: 36 } }
      ];
      const ast = parse(tokens);
      expect(ast).toEqual([
        {
          type: 'IfNode',
          condition: 'condition',
          body: [{ type: 'TextNode', value: 'content' }],
          elseBody: []
        }
      ]);
    });

    test('should parse if-else statement', () => {
      const tokens: Token[] = [
        { type: 'IF_START', value: 'user.isAdmin', position: { start: 0, end: 21 } },
        { type: 'TEXT', value: 'Admin', position: { start: 21, end: 26 } },
        { type: 'ELSE', value: '', position: { start: 26, end: 35 } },
        { type: 'TEXT', value: 'User', position: { start: 35, end: 39 } },
        { type: 'IF_END', value: '', position: { start: 39, end: 50 } }
      ];
      const ast = parse(tokens);
      expect(ast).toEqual([
        {
          type: 'IfNode',
          condition: 'user.isAdmin',
          body: [{ type: 'TextNode', value: 'Admin' }],
          elseBody: [{ type: 'TextNode', value: 'User' }]
        }
      ]);
    });

    test('should parse nested if statements', () => {
      const tokens: Token[] = [
        { type: 'IF_START', value: 'outer', position: { start: 0, end: 13 } },
        { type: 'IF_START', value: 'inner', position: { start: 13, end: 26 } },
        { type: 'TEXT', value: 'content', position: { start: 26, end: 33 } },
        { type: 'IF_END', value: '', position: { start: 33, end: 44 } },
        { type: 'IF_END', value: '', position: { start: 44, end: 55 } }
      ];
      const ast = parse(tokens);
      expect(ast).toEqual([
        {
          type: 'IfNode',
          condition: 'outer',
          body: [
            {
              type: 'IfNode',
              condition: 'inner',
              body: [{ type: 'TextNode', value: 'content' }],
              elseBody: []
            }
          ],
          elseBody: []
        }
      ]);
    });

    test('should parse complex if conditions', () => {
      const tokens: Token[] = [
        { type: 'IF_START', value: 'user.age >= 18 && user.verified', position: { start: 0, end: 41 } },
        { type: 'TEXT', value: 'Access granted', position: { start: 41, end: 55 } },
        { type: 'IF_END', value: '', position: { start: 55, end: 66 } }
      ];
      const ast = parse(tokens);
      expect(ast).toHaveLength(1);
      expect(ast[0].type).toBe('IfNode');
      const ifNode = ast[0] as IfNode;
      expect(ifNode.condition).toBe('user.age >= 18 && user.verified');
    });
  });

  describe('ForNode parsing', () => {
    test('should parse simple for loop', () => {
      const tokens: Token[] = [
        { type: 'FOR_START', value: 'item in items', position: { start: 0, end: 23 } },
        { type: 'VARIABLE', value: 'item', position: { start: 23, end: 33 } },
        { type: 'FOR_END', value: '', position: { start: 33, end: 45 } }
      ];
      const ast = parse(tokens);
      expect(ast).toEqual([
        {
          type: 'ForNode',
          item: 'item',
          iterable: 'items',
          body: [{ type: 'VariableNode', expression: 'item' }]
        }
      ]);
    });

    test('should parse for loop with index', () => {
      const tokens: Token[] = [
        { type: 'FOR_START', value: 'item, index in items', position: { start: 0, end: 30 } },
        { type: 'VARIABLE', value: 'index', position: { start: 30, end: 41 } },
        { type: 'FOR_END', value: '', position: { start: 41, end: 53 } }
      ];
      const ast = parse(tokens);
      expect(ast).toEqual([
        {
          type: 'ForNode',
          item: 'item',
          index: 'index',
          iterable: 'items',
          body: [{ type: 'VariableNode', expression: 'index' }]
        }
      ]);
    });

    test('should parse nested for loops', () => {
      const tokens: Token[] = [
        { type: 'FOR_START', value: 'category in categories', position: { start: 0, end: 32 } },
        { type: 'FOR_START', value: 'item in category.items', position: { start: 32, end: 64 } },
        { type: 'VARIABLE', value: 'item', position: { start: 64, end: 74 } },
        { type: 'FOR_END', value: '', position: { start: 74, end: 86 } },
        { type: 'FOR_END', value: '', position: { start: 86, end: 98 } }
      ];
      const ast = parse(tokens);
      expect(ast).toEqual([
        {
          type: 'ForNode',
          item: 'category',
          iterable: 'categories',
          body: [
            {
              type: 'ForNode',
              item: 'item',
              iterable: 'category.items',
              body: [{ type: 'VariableNode', expression: 'item' }]
            }
          ]
        }
      ]);
    });
  });

  describe('Complex template parsing', () => {
    test('should parse mixed content template', () => {
      const tokens: Token[] = [
        { type: 'TEXT', value: '<h1>', position: { start: 0, end: 4 } },
        { type: 'VARIABLE', value: 'title', position: { start: 4, end: 15 } },
        { type: 'TEXT', value: '</h1>', position: { start: 15, end: 20 } },
        { type: 'IF_START', value: 'users', position: { start: 20, end: 33 } },
        { type: 'FOR_START', value: 'user in users', position: { start: 33, end: 56 } },
        { type: 'VARIABLE', value: 'user.name', position: { start: 56, end: 71 } },
        { type: 'FOR_END', value: '', position: { start: 71, end: 83 } },
        { type: 'IF_END', value: '', position: { start: 83, end: 94 } }
      ];
      const ast = parse(tokens);
      
      expect(ast).toHaveLength(4);
      expect(ast[0].type).toBe('TextNode');
      expect(ast[1].type).toBe('VariableNode');
      expect(ast[2].type).toBe('TextNode');
      expect(ast[3].type).toBe('IfNode');
      const ifNode = ast[3] as IfNode;
      expect(ifNode.body[0].type).toBe('ForNode');
    });
  });

  describe('Error handling', () => {
    test('should throw error for unmatched if statement', () => {
      const tokens: Token[] = [
        { type: 'IF_START', value: 'condition', position: { start: 0, end: 18 } },
        { type: 'TEXT', value: 'content', position: { start: 18, end: 25 } }
      ];
      expect(() => parse(tokens)).toThrow('Unmatched if statement');
    });

    test('should throw error for unmatched for loop', () => {
      const tokens: Token[] = [
        { type: 'FOR_START', value: 'item in items', position: { start: 0, end: 23 } },
        { type: 'VARIABLE', value: 'item', position: { start: 23, end: 33 } }
      ];
      expect(() => parse(tokens)).toThrow('Unmatched for loop');
    });

    test('should throw error for unexpected else', () => {
      const tokens: Token[] = [
        { type: 'TEXT', value: 'content', position: { start: 0, end: 7 } },
        { type: 'ELSE', value: '', position: { start: 7, end: 16 } }
      ];
      expect(() => parse(tokens)).toThrow('Unexpected else statement');
    });

    test('should throw error for unexpected endif', () => {
      const tokens: Token[] = [
        { type: 'TEXT', value: 'content', position: { start: 0, end: 7 } },
        { type: 'IF_END', value: '', position: { start: 7, end: 18 } }
      ];
      expect(() => parse(tokens)).toThrow('Unexpected endif statement');
    });

    test('should throw error for unexpected endfor', () => {
      const tokens: Token[] = [
        { type: 'TEXT', value: 'content', position: { start: 0, end: 7 } },
        { type: 'FOR_END', value: '', position: { start: 7, end: 19 } }
      ];
      expect(() => parse(tokens)).toThrow('Unexpected endfor statement');
    });

    test('should throw error for invalid for loop syntax', () => {
      const tokens: Token[] = [
        { type: 'FOR_START', value: 'invalid syntax', position: { start: 0, end: 24 } },
        { type: 'FOR_END', value: '', position: { start: 24, end: 36 } }
      ];
      expect(() => parse(tokens)).toThrow('Invalid for loop syntax');
    });

    test('should throw error for empty if condition', () => {
      const tokens: Token[] = [
        { type: 'IF_START', value: '', position: { start: 0, end: 8 } },
        { type: 'IF_END', value: '', position: { start: 8, end: 19 } }
      ];
      expect(() => parse(tokens)).toThrow('Empty if condition');
    });
  });

  describe('Edge cases', () => {
    test('should handle empty token array', () => {
      const tokens: Token[] = [];
      const ast = parse(tokens);
      expect(ast).toEqual([]);
    });

    test('should handle whitespace-only text nodes', () => {
      const tokens: Token[] = [
        { type: 'TEXT', value: '   \n\t  ', position: { start: 0, end: 7 } }
      ];
      const ast = parse(tokens);
      expect(ast).toEqual([
        { type: 'TextNode', value: '   \n\t  ' }
      ]);
    });

    test('should preserve order of nodes', () => {
      const tokens: Token[] = [
        { type: 'TEXT', value: 'Before', position: { start: 0, end: 6 } },
        { type: 'VARIABLE', value: 'middle', position: { start: 6, end: 18 } },
        { type: 'TEXT', value: 'After', position: { start: 18, end: 23 } }
      ];
      const ast = parse(tokens);
      expect((ast[0] as TextNode).value).toBe('Before');
      expect((ast[1] as VariableNode).expression).toBe('middle');
      expect((ast[2] as TextNode).value).toBe('After');
    });
  });
});