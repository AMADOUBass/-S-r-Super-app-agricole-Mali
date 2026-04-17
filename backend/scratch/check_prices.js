const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const count = await prisma.prixMarche.count();
  console.log('Total Price entries:', count);

  const groups = await prisma.prixMarche.groupBy({
    by: ['produit', 'region'],
    _count: {
      id: true
    }
  });

  console.log('Entries per Product/Region:');
  groups.forEach(g => {
    console.log(`- ${g.produit} in ${g.region}: ${g._count.id} entries`);
  });

  const latest = await prisma.prixMarche.findMany({
    take: 5,
    orderBy: { date: 'desc' }
  });
  console.log('Latest 5 entries:', JSON.stringify(latest, null, 2));
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
