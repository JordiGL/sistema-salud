// crear-admin.ts
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  const email = '-';
  const password = '-';

  // Encriptamos la contraseña (10 rondas de sal)
  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: {
      email: email,
      password: hashedPassword,
    },
  });

  console.log(`Usuario creado: ${user.email} con password encriptada.`);
}

main()
  .catch((e) => console.error(e))
  .finally(async () => await prisma.$disconnect());
