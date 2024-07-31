import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient()

async function main() {
  const email = "griffin.mahoney@gmail.com"
  const userExists = await prisma.user.findFirst({
    where: { email, }
  })

  if (!userExists) {
    await prisma.user.create({
      data: { email },
    })
  }
}

main()
  .then(async() => {
    await prisma.$disconnect;
  })
  .catch(async() => {
    await prisma.$disconnect;
  })