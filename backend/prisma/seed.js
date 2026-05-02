const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('Start seeding...');

    // Create Crop Types
    const cropTypes = [
        {
            name: 'Apple',
            category: 'fruit_tree',
            typicalGrowthDurationDays: 1095, // 3 years
            typicalYieldPerPlant: 50,
            yieldUnit: 'kg',
            description: 'Standard apple tree, produces fruit after 3-4 years.',
            careInstructions: 'Requires regular pruning and pest control.',
        },
        {
            name: 'Mango',
            category: 'fruit_tree',
            typicalGrowthDurationDays: 1460, // 4 years
            typicalYieldPerPlant: 100,
            yieldUnit: 'kg',
            description: 'Tropical fruit tree, requires warm climate.',
            careInstructions: 'Water regularly during dry periods.',
        },
        {
            name: 'Tomato',
            category: 'vegetable',
            typicalGrowthDurationDays: 90, // 3 months
            typicalYieldPerPlant: 5,
            yieldUnit: 'kg',
            description: 'Common vegetable crop.',
            careInstructions: 'Support with stakes as they grow.',
        },
        {
            name: 'Strawberry',
            category: 'berry',
            typicalGrowthDurationDays: 120, // 4 months
            typicalYieldPerPlant: 0.5,
            yieldUnit: 'kg',
            description: 'Low-growing fruit plant.',
            careInstructions: 'Mulch to keep berries clean.',
        },
        {
            name: 'Basil',
            category: 'herb',
            typicalGrowthDurationDays: 60, // 2 months
            typicalYieldPerPlant: 0.2,
            yieldUnit: 'kg',
            description: 'Aromatic herb used in cooking.',
            careInstructions: 'Harvest frequently to encourage growth.',
        }
    ];

    for (const crop of cropTypes) {
        const existing = await prisma.cropType.findUnique({
            where: { name: crop.name },
        });

        if (!existing) {
            await prisma.cropType.create({
                data: crop,
            });
        }
    }

    // Create Trees
    const trees = [
        { name: 'Apple Tree', price: 1500, spaceRequired: 100, spaceUnit: 'SQ FT' },
        { name: 'Mango Tree', price: 2000, spaceRequired: 400, spaceUnit: 'SQ FT' }, // Mangos need more space
        { name: 'Orange Tree', price: 1200, spaceRequired: 100, spaceUnit: 'SQ FT' },
        { name: 'Lemon Tree', price: 1000, spaceRequired: 80, spaceUnit: 'SQ FT' }
    ];

    for (const tree of trees) {
        const existing = await prisma.tree.findFirst({
            where: { name: tree.name },
        });

        if (!existing) {
            await prisma.tree.create({
                data: tree,
            });
            console.log(`Created tree: ${tree.name}`);
        }
    }

    console.log('Seeding finished.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
