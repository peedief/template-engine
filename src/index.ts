import { tokenize } from './tokenizer';
import { parse, ASTNode } from './parser';
import { evaluate, Context } from './evaluator';

export interface TemplateError extends Error {
  position?: {
    start: number;
    end: number;
  };
}

export interface CompiledTemplate {
  (context?: Context): string;
}

export function render(template: string, context: Context | undefined | null = {}): string {
  if (typeof template !== 'string') {
    throw new Error('Template must be a string');
  }
  
  // Allow null/undefined contexts, normalize to empty object
  const normalizedContext = context == null ? {} : context;
  
  if (typeof normalizedContext !== 'object') {
    throw new Error('Context must be an object');
  }
  
  try {
    const tokens = tokenize(template);
    const ast = parse(tokens);
    const result = evaluate(ast, normalizedContext);
    
    return result;
  } catch (error) {
    // If the error has position information, include it in the message
    if (error && typeof error === 'object' && 'position' in error) {
      const templateError = error as TemplateError;
      if (templateError.position) {
        const newError: TemplateError = new Error(`${templateError.message} at position ${templateError.position.start}-${templateError.position.end}`);
        newError.position = templateError.position;
        throw newError;
      }
    }
    // If the error already has position keywords in message, preserve it
    if (error instanceof Error && error.message.match(/position|line|column/i)) {
      throw error;
    }
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`Template rendering failed: ${errorMessage}`);
  }
}

export function compile(template: string): CompiledTemplate {
  if (typeof template !== 'string') {
    throw new Error('Template must be a string');
  }
  
  const tokens = tokenize(template);
  const ast = parse(tokens);
  
  return function(context: Context = {}): string {
    // Allow null/undefined contexts, normalize to empty object
    const normalizedContext = context == null ? {} : context;
    
    if (typeof normalizedContext !== 'object') {
      throw new Error('Context must be an object');
    }
    
    try {
      return evaluate(ast, normalizedContext);
    } catch (error) {
      // If the error has position information, include it in the message
      if (error && typeof error === 'object' && 'position' in error) {
        const templateError = error as TemplateError;
        if (templateError.position) {
          const newError: TemplateError = new Error(`${templateError.message} at position ${templateError.position.start}-${templateError.position.end}`);
          newError.position = templateError.position;
          throw newError;
        }
      }
      // If the error already has position keywords in message, preserve it
      if (error instanceof Error && error.message.match(/position|line|column/i)) {
        throw error;
      }
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`Template rendering failed: ${errorMessage}`);
    }
  };
}

// Export everything for compatibility
export { tokenize } from './tokenizer';
export { parse } from './parser';
export { evaluate } from './evaluator';