import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // const message = await prisma.message.deleteMany({

  //   where:  {}

  // })
  // console.log( message )
  const user = await prisma.user.deleteMany({

    where:  { id: { gt: 1 }}

  })
  console.log( user )
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async(e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })