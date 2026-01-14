/** @type {import('dependency-cruiser').IConfiguration} */
module.exports = {
  forbidden: [
    /* -----------------------------------------------------------
         REGLA 1: Presentation Layer NO puede tocar Persistence Layer
         (El Controller no debe saltarse al Service para ir a la BD)
         ----------------------------------------------------------- */
    {
      name: 'no-presentation-to-persistence',
      comment:
        'Capa Presentación no debe acceder a Persistencia directamente. Debe pasar por Business.',
      severity: 'error',
      from: { path: '^src/([^/]+)/presentation' },
      to: { path: '^src/([^/]+)/persistence' },
    },

    /* -----------------------------------------------------------
         REGLA 2: Business Layer NO puede depender de Presentation
         (La lógica de negocio no debe saber nada de HTTP o Controllers)
         ----------------------------------------------------------- */
    {
      name: 'no-business-to-presentation',
      comment: 'Capa Negocio no debe depender de Presentación (Ciclo inverso).',
      severity: 'error',
      from: { path: '^src/([^/]+)/business' },
      to: { path: '^src/([^/]+)/presentation' },
    },

    /* -----------------------------------------------------------
         REGLA 3: Persistence Layer NO puede depender de Business
         (El repositorio es "tonto", solo guarda datos, no conoce reglas)
         ----------------------------------------------------------- */
    {
      name: 'no-persistence-to-business',
      comment: 'Capa Persistencia no debe depender de Negocio.',
      severity: 'error',
      from: { path: '^src/([^/]+)/persistence' },
      to: { path: '^src/([^/]+)/business' },
    },

    /* -----------------------------------------------------------
         REGLA 4: Aislamiento de Librería de DB (Prisma)
         Solo la capa de Persistencia puede importar '@prisma/client'
         ----------------------------------------------------------- */
    {
      name: 'restrict-prisma-access',
      comment:
        'Solo la capa de Persistencia puede tocar la librería de BD (Prisma).',
      severity: 'error',
      from: {
        pathNot: '^src/([^/]+)/persistence',
      },
      to: {
        path: 'prisma', // detecta imports de @prisma/client
      },
    },
  ],

  options: {
    doNotFollow: {
      path: 'node_modules',
    },
    tsPreCompilationDeps: true, // Importante para TypeScript
    tsConfig: {
      fileName: './tsconfig.json',
    },
    fileExtensions: ['.ts'],
  },
};
