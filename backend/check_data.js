const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const UNIT_CONVERSIONS = {
    'KANAL': 1,
    'MARLA': 20,
    'SQ FT': 5445,
    'SQ YD': 605,
    'ACRE': 0.125
};

const convertArea = (amount, fromUnit, toUnit) => {
    if (amount === undefined || amount === null || !fromUnit || !toUnit) return amount;
    const normalizedFrom = fromUnit.toUpperCase().trim();
    const normalizedTo = toUnit.toUpperCase().trim();
    if (normalizedFrom === normalizedTo) return Number(amount);
    if (!UNIT_CONVERSIONS[normalizedFrom] || !UNIT_CONVERSIONS[normalizedTo]) return Number(amount);
    const kanalAmount = Number(amount) / UNIT_CONVERSIONS[normalizedFrom];
    const result = kanalAmount * UNIT_CONVERSIONS[normalizedTo];
    return parseFloat(result.toFixed(4));
};

async function checkData() {
    try {
        const lands = await prisma.land.findMany({
            include: {
                farms: true,
                landowner: {
                    include: {
                        user: true
                    }
                }
            }
        });

        console.log('--- LANDS ---');
        lands.forEach(l => {
            console.log(`ID: ${l.id}, Name: ${l.landName}, Verified: ${l.isVerified}, Active: ${l.isActive}, Total Area: ${l.totalArea}, Units: ${l.areaUnit}`);
            const totalLeased = l.farms.reduce((sum, f) => {
                const farmAreaInBaseUnit = convertArea(f.totalArea, f.areaUnit || l.areaUnit, l.areaUnit);
                return sum + Number(farmAreaInBaseUnit || 0);
            }, 0);
            const remaining = Number(l.totalArea) - totalLeased;
            console.log(`  Total Leased (Base Unit): ${totalLeased}, Remaining (Base Unit): ${remaining} ${l.areaUnit}`);
            
            const remainingInMarla = convertArea(remaining, l.areaUnit, 'MARLA');
            console.log(`  Remaining in MARLA: ${remainingInMarla}`);
        });

        const farms = await prisma.farm.findMany({
            include: {
                investor: true,
                land: true
            }
        });

        console.log('\n--- FARMS ---');
        farms.forEach(f => {
            console.log(`ID: ${f.id}, Name: ${f.farmName}, Investor: ${f.investor?.fullName || 'None'}, Active: ${f.isActive}, Approved: ${f.isApproved}, Land: ${f.land?.landName}, Area: ${f.totalArea}, Unit: ${f.areaUnit}`);
        });

        const users = await prisma.user.findMany({
            where: { role: 'investor' }
        });
        console.log('\n--- INVESTOR USERS ---');
        users.forEach(u => {
            console.log(`ID: ${u.id}, Name: ${u.fullName}, Email: ${u.email}`);
        });

    } catch (error) {
        console.error(error);
    } finally {
        await prisma.$disconnect();
    }
}

checkData();
