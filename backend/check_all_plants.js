const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log("Checking all Plants in DB...");
    const plants = await prisma.plant.findMany({
        include: { farm: true, cropType: true }
    });
    console.log(`Total Plants: ${plants.length}`);
    plants.forEach(p => {
        console.log(`- ID: ${p.id}, Farm: ${p.farm?.farmName} (${p.farmId}), Status: ${p.status}, Growth: ${p.growthStatus}`);
    });

    console.log("\nChecking all Trees in DB...");
    // Find where Tree model is defined. Based on App.js and PlantationController, it exists.
    // Let's try to query it.
    try {
        const trees = await prisma.tree.findMany();
        console.log(`Total Trees: ${trees.length}`);
        trees.forEach(t => console.log(`- Tree: ${t.name}, ID: ${t.id}`));
    } catch (e) {
        console.log("Error querying trees:", e.message);
    }
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
