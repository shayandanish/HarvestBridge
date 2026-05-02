const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const user = await prisma.user.findFirst({
        where: { fullName: { contains: 'shayan' } },
        select: { id: true, fullName: true, profilePhotoUrl: true }
    });
    console.log(JSON.stringify(user, null, 2));
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
