import { NODE_TYPES, ASTNode, TextNode, VariableNode, IfNode, ForNode } from './parser';
import { escapeHtml, get, evaluateExpression, isTruthy } from './utils';

export class EvaluationError extends Error {
  public node?: ASTNode;

  constructor(message: string, node?: ASTNode) {
    super(message);
    this.name = 'EvaluationError';
    this.node = node;
  }
}

export interface Context {
  [key: string]: any;
}

export function evaluate(nodes: ASTNode[] | ASTNode, context: Context = {}): string {
  if (!Array.isArray(nodes)) {
    return evaluateNode(nodes, context);
  }

  // Normalize context
  const normalizedContext = context == null ? {} : context;

  let result = '';

  for (const node of nodes) {
    result += evaluateNode(node, normalizedContext);
  }

  return result;
}

export function evaluateNode(node: ASTNode, context: Context): string {
  if (!node || typeof node !== 'object') {
    throw new EvaluationError('Invalid node', node);
  }

  switch (node.type) {
  case NODE_TYPES.TEXT:
    return evaluateTextNode(node, context);

  case NODE_TYPES.VARIABLE:
    return evaluateVariable(node, context);

  case NODE_TYPES.IF:
    return evaluateIfNode(node, context);

  case NODE_TYPES.FOR:
    return evaluateForNode(node, context);
  }
}

function evaluateTextNode(node: TextNode, context: Context): string {
  return node.value || '';
}

function evaluateVariable(node: VariableNode, context: Context): string {
  try {
    const value = evaluateExpression(node.expression, context);

    if (value == null) {
      return '';
    }

    return escapeHtml(value);
  } catch (error) {
    if (error instanceof Error) {
      if (error.message && error.message.includes('dangerous globals')) {
        throw new EvaluationError('Access to dangerous globals is not allowed', node);
      }
      if (error.message && error.message.includes('Invalid expression')) {
        throw new EvaluationError(`Invalid expression: ${node.expression}`, node);
      }
      // Let getter errors and other runtime errors propagate for proper error handling
      if (error.message && error.message.includes('Getter error')) {
        throw error;
      }
    }
    console.warn(`Failed to evaluate variable: ${node.expression}`, error);
    return '';
  }
}

function evaluateIfNode(node: IfNode, context: Context): string {
  try {
    const conditionResult = evaluateExpression(node.condition, context);

    if (isTruthy(conditionResult)) {
      return evaluate(node.body, context);
    } else if (node.elseBody && node.elseBody.length > 0) {
      return evaluate(node.elseBody, context);
    }

    return '';
  } catch (error) {
    if (error instanceof Error && error.message && error.message.includes('dangerous globals')) {
      throw new EvaluationError('Access to dangerous globals is not allowed', node);
    }
    throw new EvaluationError(`Failed to evaluate if condition: ${node.condition}`, node);
  }
}

function evaluateForNode(node: ForNode, context: Context): string {
  try {
    const iterable = evaluateExpression(node.iterable, context);

    // Handle null/undefined
    if (iterable == null) {
      return '';
    }

    // Handle arrays
    if (Array.isArray(iterable)) {
      return evaluateArrayLoop(node, context, iterable);
    }

    // Handle strings (iterate over characters)
    if (typeof iterable === 'string') {
      const chars = Array.from(iterable);
      return evaluateArrayLoop(node, context, chars);
    }

    // Handle array-like objects
    if (typeof iterable === 'object' && typeof iterable.length === 'number') {
      const array = Array.from(iterable);
      return evaluateArrayLoop(node, context, array);
    }

    // Handle non-iterable values
    throw new EvaluationError(`Value is not iterable: ${typeof iterable}`, node);

  } catch (error) {
    if (error instanceof EvaluationError) {
      throw error;
    }
    if (error instanceof Error && error.message && error.message.includes('dangerous globals')) {
      throw new EvaluationError('Access to dangerous globals is not allowed', node);
    }
    throw new EvaluationError(`Failed to evaluate for loop: ${node.iterable}`, node);
  }
}

interface LoopContext extends Context {
  loop: {
    index: number;
    index0: number;
    index1: number;
    first: boolean;
    last: boolean;
    length: number;
  };
}

function evaluateArrayLoop(node: ForNode, context: Context, array: any[]): string {
  let result = '';

  for (let i = 0; i < array.length; i++) {
    const item = array[i];
    const loopContext: LoopContext = {
      ...context,
      [node.item]: item,
      loop: {
        index: i,
        index0: i,
        index1: i + 1,
        first: i === 0,
        last: i === array.length - 1,
        length: array.length
      }
    };

    // Add index variable if specified
    if (node.index) {
      loopContext[node.index] = i;
    }

    result += evaluate(node.body, loopContext);
  }

  return result;
}