const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log("Querying all users with name 'shayan'...");
    const users = await prisma.user.findMany({
        where: { fullName: { contains: 'shayan' } },
        include: { farmer: true }
    });

    console.log(`Found ${users.length} users:`);
    for (const u of users) {
        console.log(`- ID: ${u.id}, Email: ${u.email}, Role: ${u.role}, HasFarmer: ${!!u.farmer}`);
    }
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
