import { describe, test, expect } from '@jest/globals';
import { render } from '../src/index';
import { Context } from '../src/evaluator';

describe('Integration Tests', () => {

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('End-to-End Template Rendering', () => {
    test('should render simple variable template', () => {
      const template = 'Hello {{ name }}!';
      const context = { name: 'World' };
      const result = render(template, context);
      expect(result).toBe('Hello World!');
    });

    test('should render template with nested properties', () => {
      const template = 'Welcome {{ user.profile.firstName }} {{ user.profile.lastName }}';
      const context = {
        user: {
          profile: {
            firstName: 'John',
            lastName: 'Doe'
          }
        }
      };
      const result = render(template, context);
      expect(result).toBe('Welcome John Doe');
    });

    test('should render simple if statement', () => {
      const template = '{% if isLoggedIn %}Welcome back!{% else %}Please log in{% endif %}';
      
      const loggedInContext = { isLoggedIn: true };
      const loggedOutContext = { isLoggedIn: false };
      
      expect(render(template, loggedInContext)).toBe('Welcome back!');
      expect(render(template, loggedOutContext)).toBe('Please log in');
    });

    test('should render simple for loop', () => {
      const template = '{% for item in items %}{{ item }} {% endfor %}';
      const context = { items: ['apple', 'banana', 'cherry'] };
      const result = render(template, context);
      expect(result).toBe('apple banana cherry ');
    });

    test('should render complex nested template', () => {
      const template = `
        <div class="user-profile">
          <h1>{{ user.name }}</h1>
          {% if user.email %}
            <p>Email: {{ user.email }}</p>
          {% endif %}
          
          {% if user.skills %}
            <h3>Skills:</h3>
            <ul>
              {% for skill in user.skills %}
                <li>{{ skill.name }} - {{ skill.level }}</li>
              {% endfor %}
            </ul>
          {% else %}
            <p>No skills listed</p>
          {% endif %}
          
          {% if user.isAdmin %}
            <div class="admin-panel">
              <h3>Admin Functions</h3>
              {% for action in adminActions %}
                <button>{{ action }}</button>
              {% endfor %}
            </div>
          {% endif %}
        </div>
      `.trim();

      const context = {
        user: {
          name: 'Jane Smith',
          email: 'jane@example.com',
          skills: [
            { name: 'JavaScript', level: 'Expert' },
            { name: 'Python', level: 'Intermediate' }
          ],
          isAdmin: true
        },
        adminActions: ['Manage Users', 'System Settings', 'Reports']
      };

      const result = render(template, context);
      
      expect(result).toContain('<h1>Jane Smith</h1>');
      expect(result).toContain('Email: jane@example.com');
      expect(result).toContain('JavaScript - Expert');
      expect(result).toContain('Python - Intermediate');
      expect(result).toContain('Admin Functions');
      expect(result).toContain('<button>Manage Users</button>');
      expect(result).not.toContain('No skills listed');
    });

    test('should render blog post template', () => {
      const template = `
        <article>
          <header>
            <h1>{{ post.title }}</h1>
            <p>By {{ post.author.name }} on {{ post.publishDate }}</p>
            {% if post.tags %}
              <div class="tags">
                {% for tag in post.tags %}
                  <span class="tag">{{ tag }}</span>
                {% endfor %}
              </div>
            {% endif %}
          </header>
          
          <div class="content">
            {{ post.content }}
          </div>
          
          {% if post.comments %}
            <section class="comments">
              <h3>Comments ({{ post.comments.length }})</h3>
              {% for comment in post.comments %}
                <div class="comment">
                  <strong>{{ comment.author }}</strong>: {{ comment.text }}
                  {% if comment.isApproved %}
                    <span class="approved">✓</span>
                  {% else %}
                    <span class="pending">Pending approval</span>
                  {% endif %}
                </div>
              {% endfor %}
            </section>
          {% endif %}
        </article>
      `.trim();

      const context = {
        post: {
          title: 'Getting Started with Template Engines',
          author: { name: 'John Developer' },
          publishDate: '2024-01-15',
          tags: ['JavaScript', 'Templates', 'Web Development'],
          content: 'Template engines make it easy to generate dynamic HTML...',
          comments: [
            { author: 'Alice', text: 'Great article!', isApproved: true },
            { author: 'Bob', text: 'Very helpful, thanks!', isApproved: true },
            { author: 'Charlie', text: 'Spam comment', isApproved: false }
          ]
        }
      };

      const result = render(template, context);
      
      expect(result).toContain('<h1>Getting Started with Template Engines</h1>');
      expect(result).toContain('By John Developer on 2024-01-15');
      expect(result).toContain('<span class="tag">JavaScript</span>');
      expect(result).toContain('<span class="tag">Templates</span>');
      expect(result).toContain('Comments (3)');
      expect(result).toContain('<strong>Alice</strong>: Great article!');
      expect(result).toContain('<span class="approved">✓</span>');
      expect(result).toContain('<span class="pending">Pending approval</span>');
    });

    test('should render e-commerce product listing', () => {
      const template = `
        <div class="product-grid">
          {% if products %}
            {% for product in products %}
              <div class="product-card">
                <h3>{{ product.name }}</h3>
                <p class="price">
                  {% if product.salePrice %}
                    <span class="original-price">\${{ product.originalPrice }}</span>
                    <span class="sale-price">\${{ product.salePrice }}</span>
                  {% else %}
                    \${{ product.price }}
                  {% endif %}
                </p>
                
                {% if product.inStock %}
                  <button class="add-to-cart">Add to Cart</button>
                {% else %}
                  <button class="out-of-stock" disabled>Out of Stock</button>
                {% endif %}
                
                {% if product.rating %}
                  <div class="rating">
                    Rating: {{ product.rating }}/5
                    {% if product.reviewCount %}
                      ({{ product.reviewCount }} reviews)
                    {% endif %}
                  </div>
                {% endif %}
              </div>
            {% endfor %}
          {% else %}
            <p class="no-products">No products available</p>
          {% endif %}
        </div>
      `.trim();

      const context = {
        products: [
          {
            name: 'Laptop Pro',
            originalPrice: 1299,
            salePrice: 999,
            inStock: true,
            rating: 4.5,
            reviewCount: 128
          },
          {
            name: 'Wireless Mouse',
            price: 29.99,
            inStock: false,
            rating: 4.2,
            reviewCount: 45
          },
          {
            name: 'USB Cable',
            price: 9.99,
            inStock: true
          }
        ]
      };

      const result = render(template, context);
      
      expect(result).toContain('<h3>Laptop Pro</h3>');
      expect(result).toContain('<span class="original-price">$1299</span>');
      expect(result).toContain('<span class="sale-price">$999</span>');
      expect(result).toContain('<button class="add-to-cart">Add to Cart</button>');
      expect(result).toContain('<h3>Wireless Mouse</h3>');
      expect(result).toContain('$29.99');
      expect(result).toContain('<button class="out-of-stock" disabled>Out of Stock</button>');
      expect(result).toContain('Rating: 4.5/5');
      expect(result).toContain('(128 reviews)');
      expect(result).toContain('<h3>USB Cable</h3>');
      expect(result).not.toContain('No products available');
    });

    test('should handle empty data gracefully', () => {
      const template = `
        {% if users %}
          <ul>
            {% for user in users %}
              <li>{{ user.name }}</li>
            {% endfor %}
          </ul>
        {% else %}
          <p>No users found</p>
        {% endif %}
      `.trim();

      const emptyContext = { users: [] };
      const nullContext = { users: null };
      const undefinedContext = {};

      expect(render(template, emptyContext)).toContain('No users found');
      expect(render(template, nullContext)).toContain('No users found');
      expect(render(template, undefinedContext)).toContain('No users found');
    });

    test('should render dashboard with statistics', () => {
      const template = `
        <div class="dashboard">
          <h1>Dashboard</h1>
          
          <div class="stats">
            {% for stat in statistics %}
              <div class="stat-card">
                <h3>{{ stat.label }}</h3>
                <div class="value">{{ stat.value }}</div>
                {% if stat.change %}
                  <div class="change {{ stat.change.direction }}">
                    {{ stat.change.percentage }}% {{ stat.change.direction }}
                  </div>
                {% endif %}
              </div>
            {% endfor %}
          </div>
          
          {% if recentActivity %}
            <div class="recent-activity">
              <h2>Recent Activity</h2>
              {% for activity in recentActivity %}
                <div class="activity-item">
                  <span class="time">{{ activity.time }}</span>
                  <span class="action">{{ activity.action }}</span>
                  {% if activity.user %}
                    <span class="user">by {{ activity.user }}</span>
                  {% endif %}
                </div>
              {% endfor %}
            </div>
          {% endif %}
        </div>
      `.trim();

      const context = {
        statistics: [
          {
            label: 'Total Users',
            value: 1234,
            change: { percentage: 12, direction: 'up' }
          },
          {
            label: 'Revenue',
            value: '$45,678',
            change: { percentage: 8, direction: 'up' }
          },
          {
            label: 'Bounce Rate',
            value: '23%',
            change: { percentage: 5, direction: 'down' }
          }
        ],
        recentActivity: [
          { time: '2 hours ago', action: 'New user registered', user: 'System' },
          { time: '3 hours ago', action: 'Payment processed', user: 'John Doe' },
          { time: '5 hours ago', action: 'Report generated' }
        ]
      };

      const result = render(template, context);
      
      expect(result).toContain('<h1>Dashboard</h1>');
      expect(result).toContain('<h3>Total Users</h3>');
      expect(result).toContain('<div class="value">1234</div>');
      expect(result).toContain('12% up');
      expect(result).toContain('<h3>Revenue</h3>');
      expect(result).toContain('$45,678');
      expect(result).toContain('<h2>Recent Activity</h2>');
      expect(result).toContain('New user registered');
      expect(result).toContain('by John Doe');
    });
  });

  describe('Performance Tests', () => {
    test('should handle large datasets efficiently', () => {
      const template = `
        <div class="data-list">
          {% for item in items %}
            <div class="item">
              <h4>{{ item.title }}</h4>
              <p>{{ item.description }}</p>
              {% if item.tags %}
                {% for tag in item.tags %}
                  <span class="tag">{{ tag }}</span>
                {% endfor %}
              {% endif %}
            </div>
          {% endfor %}
        </div>
      `.trim();

      // Generate large dataset
      const items = Array.from({ length: 1000 }, (_, i) => ({
        title: `Item ${i + 1}`,
        description: `Description for item ${i + 1}`,
        tags: [`tag${i % 5}`, `category${i % 3}`]
      }));

      const context = { items };
      
      const start = Date.now();
      const result = render(template, context);
      const end = Date.now();
      
      expect(result).toContain('Item 1');
      expect(result).toContain('Item 1000');
      expect(result).toContain('Description for item 500');
      expect(end - start).toBeLessThan(1000); // Should complete within 1 second
      expect(result.length).toBeGreaterThan(50000); // Should generate substantial output
    });

    test('should handle deeply nested structures', () => {
      const template = `
        {% for level1 in data %}
          <div class="level1">
            {{ level1.name }}
            {% for level2 in level1.children %}
              <div class="level2">
                {{ level2.name }}
                {% for level3 in level2.children %}
                  <div class="level3">
                    {{ level3.name }}
                    {% if level3.items %}
                      {% for item in level3.items %}
                        <span>{{ item }}</span>
                      {% endfor %}
                    {% endif %}
                  </div>
                {% endfor %}
              </div>
            {% endfor %}
          </div>
        {% endfor %}
      `.trim();

      const context = {
        data: [
          {
            name: 'Category A',
            children: [
              {
                name: 'Subcategory A1',
                children: [
                  { name: 'Item A1a', items: ['x', 'y', 'z'] },
                  { name: 'Item A1b', items: ['a', 'b'] }
                ]
              }
            ]
          },
          {
            name: 'Category B',
            children: [
              {
                name: 'Subcategory B1',
                children: [
                  { name: 'Item B1a', items: ['1', '2', '3'] }
                ]
              }
            ]
          }
        ]
      };

      const result = render(template, context);
      
      expect(result).toContain('Category A');
      expect(result).toContain('Subcategory A1');
      expect(result).toContain('Item A1a');
      expect(result).toContain('<span>x</span>');
      expect(result).toContain('Category B');
    });
  });

  describe('Error Handling in Integration', () => {
    test('should handle malformed templates gracefully', () => {
      const malformedTemplates = [
        '{{ unclosed',
        '{% if condition %}no endif',
        '{% for item in items %}no endfor',
        '{% endif %}unexpected endif',
        '{% endfor %}unexpected endfor'
      ];

      malformedTemplates.forEach(template => {
        expect(() => render(template, {})).toThrow();
      });
    });

    test('should handle missing context gracefully', () => {
      const template = 'Hello {{ user.name }}, you have {{ notifications.count }} notifications';
      const context = {}; // Empty context
      
      const result = render(template, context);
      expect(result).toBe('Hello , you have  notifications');
    });

    test('should handle circular references in context', () => {
      const template = '{{ user.name }} works at {{ user.company.name }}';
      
      const context: Context = {
        user: { name: 'John' },
        company: { name: 'Tech Corp' }
      };
      context.user.company = context.company;
      context.company.founder = context.user;
      
      const result = render(template, context);
      expect(result).toBe('John works at Tech Corp');
    });
  });

  describe('Security Integration Tests', () => {
    test('should prevent XSS in complex templates', () => {
      const template = `
        <div class="user-content">
          <h2>{{ post.title }}</h2>
          <div class="content">{{ post.content }}</div>
          {% if post.comments %}
            <div class="comments">
              {% for comment in post.comments %}
                <div class="comment">
                  <strong>{{ comment.author }}</strong>: {{ comment.text }}
                </div>
              {% endfor %}
            </div>
          {% endif %}
        </div>
      `.trim();

      const context = {
        post: {
          title: '<script>alert("XSS in title")</script>Safe Title',
          content: 'Safe content <img src="x" onerror="alert(1)">',
          comments: [
            {
              author: '<script>alert("XSS")</script>John',
              text: 'Comment with <b>HTML</b> content'
            }
          ]
        }
      };

      const result = render(template, context);
      
      expect(result).not.toContain('<script>');
      expect(result).not.toContain('onerror=');
      expect(result).toContain('&lt;script&gt;');
      expect(result).toContain('Safe Title');
      expect(result).toContain('&lt;b&gt;HTML&lt;&#x2F;b&gt;');
    });

    test('should maintain security with nested loops and conditions', () => {
      const template = `
        {% for category in categories %}
          <div class="category">
            <h3>{{ category.name }}</h3>
            {% if category.items %}
              {% for item in category.items %}
                <div class="item">
                  {{ item.title }}: {{ item.description }}
                  {% if item.isPromoted %}
                    <span class="promo">{{ item.promoText }}</span>
                  {% endif %}
                </div>
              {% endfor %}
            {% endif %}
          </div>
        {% endfor %}
      `.trim();

      const context = {
        categories: [
          {
            name: '<script>alert("category")</script>Electronics',
            items: [
              {
                title: 'Laptop<img src=x onerror=alert(1)>',
                description: 'High-performance laptop',
                isPromoted: true,
                promoText: '<b>50% OFF!</b><script>steal_data()</script>'
              }
            ]
          }
        ]
      };

      const result = render(template, context);
      
      expect(result).not.toContain('<script>');
      expect(result).not.toContain('onerror=');
      expect(result).toContain('&lt;script&gt;');
      expect(result).toContain('Electronics');
      expect(result).toContain('High-performance laptop');
      expect(result).toContain('&lt;b&gt;50% OFF!&lt;&#x2F;b&gt;');
    });
  });
});