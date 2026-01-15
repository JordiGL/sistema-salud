import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database options...');

  // 1. Opciones de Contexto
  const contexts = [
    { key: 'exercise', value: 'Post-Ejercicio' },
    { key: 'drainage', value: 'Post-Drenaje' },
    { key: 'chemo', value: 'Post-Quimioterapia' },
    { key: 'stress', value: 'Momento de estrés' },
    // Aquí podrías añadir nuevos en el futuro fácilmente
  ];

  for (const ctx of contexts) {
    await prisma.contextOption.upsert({
      where: { key: ctx.key },
      update: {}, // Si existe, no hace nada
      create: ctx,
    });
  }

  // 2. Opciones de Lugar
  const locations = [
    { key: 'home', value: 'Casa' },
    { key: 'pharmacy', value: 'Farmacia' },
    { key: 'cap', value: 'CAP' },
    { key: 'ico', value: 'ICO' },
  ];

  for (const loc of locations) {
    await prisma.locationOption.upsert({
      where: { key: loc.key },
      update: {},
      create: loc,
    });
  }

  console.log('✅ Seeding completed.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
