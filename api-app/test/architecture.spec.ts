import { cruise, ICruiseResult } from 'dependency-cruiser';
import * as path from 'path';

describe('Architecture Fitness Functions (Dependency Cruiser)', () => {
  const architectureRules: any = [
    {
      name: 'no-presentation-to-persistence',
      severity: 'error',
      comment: 'El Controlador no debe llamar al Repositorio directamente.',
      from: { path: '^src/health/presentation' },
      to: { path: '^src/health/persistence' },
    },
    {
      name: 'no-business-to-prisma',
      severity: 'error',
      comment:
        'La lógica de negocio no debe conocer la librería de BD (Prisma).',
      from: { path: '^src/health/business' },
      to: { path: '@prisma/client' },
    },
  ];

  it('should pass all architecture rules', async () => {
    const result = await cruise(['src'], {
      includeOnly: '^src',
      ruleSet: {
        forbidden: architectureRules,
      },
    });

    // SOLUCIÓN: Hacemos un cast explícito a ICruiseResult
    // Esto le asegura a TS que result.output es el objeto con los datos, no un string.
    const output = result.output as ICruiseResult;

    // Ahora ya podemos acceder a summary sin error
    const violations = output.summary.violations;

    if (violations.length > 0) {
      const messages = violations
        .map((v) => `\n[Rule: ${v.rule.name}] ${v.from} -> ${v.to}`)
        .join('');
      throw new Error(`Architecture violations found:${messages}`);
    }

    expect(violations).toHaveLength(0);
  });
});
