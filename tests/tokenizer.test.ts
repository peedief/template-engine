import { describe, test, expect } from '@jest/globals';
import { tokenize } from '../src/tokenizer';

describe('Tokenizer', () => {

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('TEXT tokens', () => {
    test('should tokenize plain text', () => {
      const template = 'Hello World';
      const tokens = tokenize(template);
      expect(tokens).toEqual([
        { type: 'TEXT', value: 'Hello World', position: { start: 0, end: 11 } }
      ]);
    });

    test('should handle empty string', () => {
      const template = '';
      const tokens = tokenize(template);
      expect(tokens).toEqual([]);
    });

    test('should handle whitespace-only text', () => {
      const template = '   \n\t  ';
      const tokens = tokenize(template);
      expect(tokens).toEqual([
        { type: 'TEXT', value: '   \n\t  ', position: { start: 0, end: 7 } }
      ]);
    });
  });

  describe('VARIABLE tokens', () => {
    test('should tokenize simple variable', () => {
      const template = '{{ name }}';
      const tokens = tokenize(template);
      expect(tokens).toEqual([
        { type: 'VARIABLE', value: 'name', position: { start: 0, end: 10 } }
      ]);
    });

    test('should tokenize variable with nested properties', () => {
      const template = '{{ user.profile.name }}';
      const tokens = tokenize(template);
      expect(tokens).toEqual([
        { type: 'VARIABLE', value: 'user.profile.name', position: { start: 0, end: 23 } }
      ]);
    });

    test('should handle variables with extra whitespace', () => {
      const template = '{{   name   }}';
      const tokens = tokenize(template);
      expect(tokens).toEqual([
        { type: 'VARIABLE', value: 'name', position: { start: 0, end: 14 } }
      ]);
    });

    test('should tokenize multiple variables', () => {
      const template = '{{ first }} and {{ second }}';
      const tokens = tokenize(template);
      expect(tokens).toHaveLength(3);
      expect(tokens[0]).toEqual({ type: 'VARIABLE', value: 'first', position: { start: 0, end: 11 } });
      expect(tokens[1]).toEqual({ type: 'TEXT', value: ' and ', position: { start: 11, end: 16 } });
      expect(tokens[2]).toEqual({ type: 'VARIABLE', value: 'second', position: { start: 16, end: 28 } });
    });

    test('should handle variable expressions with operators', () => {
      const template = '{{ count + 1 }}';
      const tokens = tokenize(template);
      expect(tokens).toEqual([
        { type: 'VARIABLE', value: 'count + 1', position: { start: 0, end: 15 } }
      ]);
    });
  });

  describe('IF tokens', () => {
    test('should tokenize simple if statement', () => {
      const template = '{% if condition %}content{% endif %}';
      const tokens = tokenize(template);
      expect(tokens).toEqual([
        { type: 'IF_START', value: 'condition', position: { start: 0, end: 18 } },
        { type: 'TEXT', value: 'content', position: { start: 18, end: 25 } },
        { type: 'IF_END', value: '', position: { start: 25, end: 36 } }
      ]);
    });

    test('should tokenize if-else statement', () => {
      const template = '{% if user.isAdmin %}Admin{% else %}User{% endif %}';
      const tokens = tokenize(template);
      expect(tokens).toEqual([
        { type: 'IF_START', value: 'user.isAdmin', position: { start: 0, end: 21 } },
        { type: 'TEXT', value: 'Admin', position: { start: 21, end: 26 } },
        { type: 'ELSE', value: '', position: { start: 26, end: 36 } },
        { type: 'TEXT', value: 'User', position: { start: 36, end: 40 } },
        { type: 'IF_END', value: '', position: { start: 40, end: 51 } }
      ]);
    });

    test('should handle complex conditions', () => {
      const template = '{% if user.age >= 18 && user.verified %}';
      const tokens = tokenize(template);
      expect(tokens).toEqual([
        { type: 'IF_START', value: 'user.age >= 18 && user.verified', position: { start: 0, end: 40 } }
      ]);
    });

    test('should handle nested if statements', () => {
      const template = '{% if outer %}{% if inner %}content{% endif %}{% endif %}';
      const tokens = tokenize(template);
      expect(tokens).toHaveLength(5);
      expect(tokens[0].type).toBe('IF_START');
      expect(tokens[1].type).toBe('IF_START');
      expect(tokens[2].type).toBe('TEXT');
      expect(tokens[3].type).toBe('IF_END');
      expect(tokens[4].type).toBe('IF_END');
    });
  });

  describe('FOR tokens', () => {
    test('should tokenize simple for loop', () => {
      const template = '{% for item in items %}{{ item }}{% endfor %}';
      const tokens = tokenize(template);
      expect(tokens).toEqual([
        { type: 'FOR_START', value: 'item in items', position: { start: 0, end: 23 } },
        { type: 'VARIABLE', value: 'item', position: { start: 23, end: 33 } },
        { type: 'FOR_END', value: '', position: { start: 33, end: 45 } }
      ]);
    });

    test('should handle for loop with index', () => {
      const template = '{% for item, index in items %}{{ index }}: {{ item }}{% endfor %}';
      const tokens = tokenize(template);
      expect(tokens[0]).toEqual({
        type: 'FOR_START',
        value: 'item, index in items',
        position: { start: 0, end: 30 }
      });
    });

    test('should handle nested for loops', () => {
      const template = '{% for category in categories %}{% for item in category.items %}{{ item }}{% endfor %}{% endfor %}';
      const tokens = tokenize(template);
      expect(tokens).toHaveLength(5);
      expect(tokens[0].type).toBe('FOR_START');
      expect(tokens[1].type).toBe('FOR_START');
      expect(tokens[2].type).toBe('VARIABLE');
      expect(tokens[3].type).toBe('FOR_END');
      expect(tokens[4].type).toBe('FOR_END');
    });
  });

  describe('Mixed content', () => {
    test('should tokenize complex template with all elements', () => {
      const template = `
        <h1>{{ title }}</h1>
        {% if users %}
          <ul>
            {% for user in users %}
              <li>{{ user.name }}
                {% if user.isAdmin %}
                  (Admin)
                {% endif %}
              </li>
            {% endfor %}
          </ul>
        {% else %}
          <p>No users found</p>
        {% endif %}
      `;
      const tokens = tokenize(template);
      expect(tokens.length).toBeGreaterThan(10);
      expect(tokens.some(t => t.type === 'VARIABLE')).toBe(true);
      expect(tokens.some(t => t.type === 'IF_START')).toBe(true);
      expect(tokens.some(t => t.type === 'FOR_START')).toBe(true);
      expect(tokens.some(t => t.type === 'TEXT')).toBe(true);
    });
  });

  describe('Error handling', () => {
    test('should handle malformed variable syntax', () => {
      const template = '{{ unclosed variable';
      expect(() => tokenize(template)).toThrow('Unclosed variable expression');
    });

    test('should handle malformed if syntax', () => {
      const template = '{% if condition';
      expect(() => tokenize(template)).toThrow('Unclosed block expression');
    });

    test('should handle mismatched block tags', () => {
      const template = '{% if condition %}{% endfor %}';
      expect(() => tokenize(template)).toThrow('Mismatched block tags');
    });

    test('should handle empty variable expression', () => {
      const template = '{{ }}';
      expect(() => tokenize(template)).toThrow('Empty variable expression');
    });

    test('should handle empty block expression', () => {
      const template = '{% %}';
      expect(() => tokenize(template)).toThrow('Empty block expression');
    });
  });

  describe('Edge cases', () => {
    test('should handle escaped braces in text', () => {
      const template = 'Use \\{\\{ and \\}\\} for literal braces';
      const tokens = tokenize(template);
      expect(tokens).toEqual([
        { type: 'TEXT', value: 'Use {{ and }} for literal braces', position: { start: 0, end: 32 } }
      ]);
    });

    test('should handle special characters in variables', () => {
      const template = '{{ user_name }}{{ user-id }}{{ user$value }}';
      const tokens = tokenize(template);
      expect(tokens).toHaveLength(3);
      expect(tokens[0].value).toBe('user_name');
      expect(tokens[1].value).toBe('user-id');
      expect(tokens[2].value).toBe('user$value');
    });

    test('should preserve position information accurately', () => {
      const template = 'Hello {{ name }}, welcome!';
      const tokens = tokenize(template);
      expect(tokens[0].position).toEqual({ start: 0, end: 6 });
      expect(tokens[1].position).toEqual({ start: 6, end: 16 });
      expect(tokens[2].position).toEqual({ start: 16, end: 26 });
    });
  });
});