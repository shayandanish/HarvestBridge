
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function removeTransaction() {
  try {
    // Find payments around 14/03/2026
    const payments = await prisma.payment.findMany({
      where: {
        createdAt: {
          gte: new Date('2026-03-13T00:00:00Z'),
          lte: new Date('2026-03-15T23:59:59Z')
        },
        amount: 500
      },
      include: {
        farm: true,
        investment: true
      }
    });

    console.log('Found payments:', JSON.stringify(payments, null, 2));

    if (payments.length === 1) {
      const p = payments[0];
      console.log('Deleting payment:', p.id);
      await prisma.payment.delete({ where: { id: p.id } });
      console.log('Successfully deleted.');
    } else if (payments.length > 1) {
      console.log('Multiple payments found. Please specify which one to delete.');
    } else {
      console.log('No matching payment found.');
    }

  } catch (err) {
    console.error(err);
  } finally {
    await prisma.$disconnect();
  }
}

removeTransaction();
