import type { ValidationError } from '@nestjs/common';

export interface FlatValidationError {
  readonly path: string;
  readonly message: string;
  readonly constraint: string;
}

/**
 * Achata a estrutura recursiva de `ValidationError[]` do class-validator
 * em uma lista plana RFC 9457-compatível com **dotted paths**.
 *
 * Cada constraint vira uma entrada `{ path, message, constraint }`.
 * Aninhamento (children) usa notação `parent.child.field`. Arrays
 * incluem índice no path (ex: `metadata.tags.0`).
 *
 * Usado pelo `exceptionFactory` do ValidationPipe global em main.ts
 * para construir o body `errors[]` do ProblemDetails (status 422).
 */
export const flattenValidationErrors = (
  errors: readonly ValidationError[],
  parentPath = '',
): FlatValidationError[] => {
  const flat: FlatValidationError[] = [];
  for (const error of errors) {
    const currentPath = parentPath ? `${parentPath}.${error.property}` : error.property;
    if (error.constraints) {
      for (const [constraint, message] of Object.entries(error.constraints)) {
        flat.push({ constraint, message, path: currentPath });
      }
    }
    if (error.children?.length) {
      flat.push(...flattenValidationErrors(error.children, currentPath));
    }
  }
  return flat;
};
