import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const user = await prisma.user.update({


    where:  { id: 1 }
  , data:   { password: '$2a$10$sSb5A0fWuUbPRI37wrXYf.Xac//0YZDTAk4l4IM/3AsqkqkgLULMi' }
      

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