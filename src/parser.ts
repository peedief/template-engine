import { TOKEN_TYPES, Token, TokenType } from './tokenizer';

export const NODE_TYPES = {
  TEXT: 'TextNode',
  VARIABLE: 'VariableNode',
  IF: 'IfNode',
  FOR: 'ForNode'
} as const;

export type NodeType = typeof NODE_TYPES[keyof typeof NODE_TYPES];

export interface BaseNode {
  type: NodeType;
}

export interface TextNode extends BaseNode {
  type: typeof NODE_TYPES.TEXT;
  value: string;
}

export interface VariableNode extends BaseNode {
  type: typeof NODE_TYPES.VARIABLE;
  expression: string;
}

export interface IfNode extends BaseNode {
  type: typeof NODE_TYPES.IF;
  condition: string;
  body: ASTNode[];
  elseBody: ASTNode[];
}

export interface ForNode extends BaseNode {
  type: typeof NODE_TYPES.FOR;
  item: string;
  iterable: string;
  body: ASTNode[];
  index?: string;
}

export type ASTNode = TextNode | VariableNode | IfNode | ForNode;

export class ParseError extends Error {
  public token?: Token;

  constructor(message: string, token?: Token) {
    super(message);
    this.name = 'ParseError';
    this.token = token;
  }
}

export function parse(tokens: Token[]): ASTNode[] {
  let current = 0;
  
  function parseNodes(): ASTNode[] {
    const nodes: ASTNode[] = [];
    
    while (current < tokens.length) {
      const token = tokens[current];
      
      switch (token.type) {
      case TOKEN_TYPES.TEXT:
        nodes.push({
          type: NODE_TYPES.TEXT,
          value: token.value
        });
        current++;
        break;
          
      case TOKEN_TYPES.VARIABLE:
        nodes.push({
          type: NODE_TYPES.VARIABLE,
          expression: token.value
        });
        current++;
        break;
          
      case TOKEN_TYPES.IF_START:
        nodes.push(parseIfStatement());
        break;
          
      case TOKEN_TYPES.FOR_START:
        nodes.push(parseForLoop());
        break;
          
      case TOKEN_TYPES.IF_END:
      case TOKEN_TYPES.FOR_END:
      case TOKEN_TYPES.ELSE:
        return nodes;
          
      default:
        throw new ParseError(`Unexpected token: ${token.type}`, token);
      }
    }
    
    return nodes;
  }
  
  function parseIfStatement(): IfNode {
    const ifToken = tokens[current];
    current++;
    
    const condition = ifToken.value.trim();
    
    if (!condition) {
      throw new ParseError('Empty if condition', ifToken);
    }
    
    const body = parseNodes();
    
    let elseBody: ASTNode[] = [];
    
    if (current < tokens.length && tokens[current].type === TOKEN_TYPES.ELSE) {
      current++;
      elseBody = parseNodes();
    }
    
    if (current >= tokens.length || tokens[current].type !== TOKEN_TYPES.IF_END) {
      throw new ParseError('Unmatched if statement', ifToken);
    }
    current++;
    
    return {
      type: NODE_TYPES.IF,
      condition: condition,
      body: body,
      elseBody: elseBody
    };
  }
  
  function parseForLoop(): ForNode {
    const forToken = tokens[current];
    current++;
    
    const forExpression = forToken.value;
    
    // Support both "item in items" and "item, index in items" syntax
    let match = forExpression.match(/^(\w+),\s*(\w+)\s+in\s+(.+)$/);
    let item: string, index: string | undefined, iterable: string;
    
    if (match) {
      // "item, index in items" syntax
      [, item, index, iterable] = match;
    } else {
      // "item in items" syntax
      const simpleMatch = forExpression.match(/^(\w+)\s+in\s+(.+)$/);
      if (!simpleMatch) {
        throw new ParseError('Invalid for loop syntax', forToken);
      }
      [, item, iterable] = simpleMatch;
      index = undefined;
    }
    
    const body = parseNodes();
    
    if (current >= tokens.length || tokens[current].type !== TOKEN_TYPES.FOR_END) {
      throw new ParseError('Unmatched for loop', forToken);
    }
    current++;
    
    const forNode: ForNode = {
      type: NODE_TYPES.FOR,
      item: item.trim(),
      iterable: iterable.trim(),
      body: body
    };
    
    if (index) {
      forNode.index = index.trim();
    }
    
    return forNode;
  }
  
  const nodes = parseNodes();
  
  // Check for any remaining unexpected tokens
  if (current < tokens.length) {
    const token = tokens[current];
    if (token.type === TOKEN_TYPES.IF_END) {
      throw new ParseError('Unexpected endif statement', token);
    } else if (token.type === TOKEN_TYPES.FOR_END) {
      throw new ParseError('Unexpected endfor statement', token);
    } else if (token.type === TOKEN_TYPES.ELSE) {
      throw new ParseError('Unexpected else statement', token);
    }
  }
  
  return nodes;
}