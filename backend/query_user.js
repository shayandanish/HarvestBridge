const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log("Querying database...");
    const users = await prisma.user.findMany({
        where: {
            fullName: { contains: 'shayan' }
        },
        include: {
            farmer: true
        }
    });

    console.log(JSON.stringify(users, null, 2));
}

main()
    .catch(console.error)
    .finally(async () => {
        await prisma.$disconnect();
    });
