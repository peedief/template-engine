export const TOKEN_TYPES = {
  TEXT: 'TEXT',
  VARIABLE: 'VARIABLE',
  IF_START: 'IF_START',
  ELSE: 'ELSE',
  IF_END: 'IF_END',
  FOR_START: 'FOR_START',
  FOR_END: 'FOR_END'
} as const;

export type TokenType = typeof TOKEN_TYPES[keyof typeof TOKEN_TYPES];

export interface Position {
  start: number;
  end: number;
}

export interface Token {
  type: TokenType;
  value: string;
  position: Position;
}

export class TokenizerError extends Error {
  public position?: Position;

  constructor(message: string, position?: Position) {
    super(message);
    this.name = 'TokenizerError';
    this.position = position;
  }
}

interface Pattern {
  type: TokenType | 'RAW_HTML' | 'INVALID_BLOCK';
  regex: RegExp;
}

export function tokenize(template: string): Token[] {
  if (typeof template !== 'string') {
    throw new TokenizerError('Template must be a string');
  }
  
  // Handle escaped braces by replacing them with placeholders that won't be matched by our patterns
  const processedTemplate = template.replace(/\\(\{|\})/g, (match, char) => {
    return char === '{' ? '\x00ESCAPED_OPEN_BRACE\x00' : '\x00ESCAPED_CLOSE_BRACE\x00';
  });
  
  const tokens: Token[] = [];
  let position = 0;
  
  // Check for unclosed expressions first
  validateUnclosedExpressions(processedTemplate);
  
  const patterns: Pattern[] = [
    // Pattern to catch raw HTML syntax {{{ }}} and reject it - must come first
    { type: 'RAW_HTML', regex: /\{\{\{[^}]*\}\}\}/g },
    { type: TOKEN_TYPES.VARIABLE, regex: /\{\{\s*([^}]*)\s*\}\}/g },
    { type: TOKEN_TYPES.IF_START, regex: /\{\%\s*if\s+([^%]*)\s*\%\}/g },
    { type: TOKEN_TYPES.ELSE, regex: /\{\%\s*else\s*\%\}/g },
    { type: TOKEN_TYPES.IF_END, regex: /\{\%\s*endif\s*\%\}/g },
    { type: TOKEN_TYPES.FOR_START, regex: /\{\%\s*for\s+([^%]*)\s*\%\}/g },
    { type: TOKEN_TYPES.FOR_END, regex: /\{\%\s*endfor\s*\%\}/g },
    // Pattern to catch invalid empty blocks like {% %}
    { type: 'INVALID_BLOCK', regex: /\{\%\s*\%\}/g }
  ];
  
  while (position < processedTemplate.length) {
    let foundMatch = false;
    let earliestMatch: RegExpExecArray | null = null;
    let earliestPattern: Pattern | null = null;
    
    for (const pattern of patterns) {
      pattern.regex.lastIndex = position;
      const match = pattern.regex.exec(processedTemplate);
      
      if (match && match.index >= position) {
        if (!earliestMatch || match.index < earliestMatch.index) {
          earliestMatch = match;
          earliestPattern = pattern;
        }
      }
    }
    
    if (earliestMatch && earliestPattern) {
      if (earliestMatch.index > position) {
        const textValue = processedTemplate.slice(position, earliestMatch.index);
        if (textValue) {
          // Restore escaped braces in text
          const restoredText = textValue
            .replace(/\x00ESCAPED_OPEN_BRACE\x00/g, '{')
            .replace(/\x00ESCAPED_CLOSE_BRACE\x00/g, '}');
          
          tokens.push({
            type: TOKEN_TYPES.TEXT,
            value: restoredText,
            position: { start: position, end: earliestMatch.index }
          });
        }
      }
      
      let value = '';
      if (earliestPattern.type === 'INVALID_BLOCK') {
        throw new TokenizerError('Empty block expression', { 
          start: earliestMatch.index, 
          end: earliestMatch.index + earliestMatch[0].length 
        });
      } else if (earliestPattern.type === 'RAW_HTML') {
        throw new TokenizerError('Raw HTML not supported', { 
          start: earliestMatch.index, 
          end: earliestMatch.index + earliestMatch[0].length 
        });
      } else if (earliestPattern.type === TOKEN_TYPES.VARIABLE) {
        value = earliestMatch[1].trim();
        if (!value) {
          throw new TokenizerError('Empty variable expression', { 
            start: earliestMatch.index, 
            end: earliestMatch.index + earliestMatch[0].length 
          });
        }
      } else if (earliestPattern.type === TOKEN_TYPES.IF_START) {
        value = earliestMatch[1].trim();
        if (!value) {
          throw new TokenizerError('Empty block expression', { 
            start: earliestMatch.index, 
            end: earliestMatch.index + earliestMatch[0].length 
          });
        }
      } else if (earliestPattern.type === TOKEN_TYPES.FOR_START) {
        value = earliestMatch[1].trim();
        if (!value) {
          throw new TokenizerError('Empty block expression', { 
            start: earliestMatch.index, 
            end: earliestMatch.index + earliestMatch[0].length 
          });
        }
      }
      
      tokens.push({
        type: earliestPattern.type as TokenType,
        value: value,
        position: { 
          start: earliestMatch.index, 
          end: earliestMatch.index + earliestMatch[0].length 
        }
      });
      
      position = earliestMatch.index + earliestMatch[0].length;
      foundMatch = true;
    } else {
      const remainingText = processedTemplate.slice(position);
      if (remainingText) {
        // Restore escaped braces in text
        const restoredText = remainingText
          .replace(/\x00ESCAPED_OPEN_BRACE\x00/g, '{')
          .replace(/\x00ESCAPED_CLOSE_BRACE\x00/g, '}');
        
        // Calculate the correct end position based on the restored text length
        const startPos = position;
        const endPos = startPos + restoredText.length;
        
        tokens.push({
          type: TOKEN_TYPES.TEXT,
          value: restoredText,
          position: { start: startPos, end: endPos }
        });
      }
      break;
    }
  }
  
  // Validate for obvious mismatches (different block types closing each other)
  validateMismatchedBlocks(tokens);
  
  return tokens;
}

function validateUnclosedExpressions(template: string): void {
  // Check for unclosed variable expressions
  const variableRegex = /\{\{(?![^}]*\}\})/g;
  let match;
  while ((match = variableRegex.exec(template)) !== null) {
    throw new TokenizerError('Unclosed variable expression', { 
      start: match.index, 
      end: match.index + 2 
    });
  }
  
  // Check for unclosed block expressions
  const blockRegex = /\{\%(?![^%]*\%\})/g;
  while ((match = blockRegex.exec(template)) !== null) {
    throw new TokenizerError('Unclosed block expression', { 
      start: match.index, 
      end: match.index + 2 
    });
  }
}

function validateMismatchedBlocks(tokens: Token[]): void {
  const stack: Token[] = [];
  const blockPairs = {
    [TOKEN_TYPES.IF_START]: TOKEN_TYPES.IF_END,
    [TOKEN_TYPES.FOR_START]: TOKEN_TYPES.FOR_END
  };
  
  for (const token of tokens) {
    if (token.type === TOKEN_TYPES.IF_START || token.type === TOKEN_TYPES.FOR_START) {
      stack.push(token);
    } else if (token.type === TOKEN_TYPES.IF_END || token.type === TOKEN_TYPES.FOR_END) {
      if (stack.length > 0) {
        const lastBlock = stack[stack.length - 1];
        const expectedEnd = blockPairs[lastBlock.type as keyof typeof blockPairs];
        
        if (token.type !== expectedEnd) {
          throw new TokenizerError('Mismatched block tags', token.position);
        }
        stack.pop();
      }
    }
  }
}