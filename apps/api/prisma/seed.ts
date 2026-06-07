import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient()

async function main() {
  const [email, password] = process.argv.slice(2)

  if (!email || !password) {
    throw new Error('Usage: npm run prisma:seed -- <email> <password>')
  }

  const saltRounds = 10
  const hashedPassword = await bcrypt.hash(password, saltRounds)

  const userExists = await prisma.user.findFirst({
    where: { email, }
  })

  if (userExists) {
    await prisma.user.update({
      where: { id: userExists.id },
      data: { password: hashedPassword },
    })
    console.log(`Updated password for existing user: ${email}`)
  } else {
    await prisma.user.create({
      data: { email, password: hashedPassword },
    })
    console.log(`Created user: ${email}`)
  }
}

main()
  .then(async() => {
    await prisma.$disconnect()
  })
  .catch(async(error) => {
    console.error(error)
    await prisma.$disconnect()
    process.exit(1)
  })
