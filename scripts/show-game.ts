import { prisma } from '../lib/prisma';

async function main() {
  const game = await prisma.game.findFirst({
    select: {
      appId: true,
      name: true,
      metadata: true,
      releaseYear: true,
      reviewPositivePct: true,
      reviewCount: true,
      isFree: true,
    },
  });

  if (game) {
    console.log('App ID:', game.appId.toString());
    console.log('Name:', game.name);
    console.log('Release Year:', game.releaseYear);
    console.log('Review Score:', game.reviewPositivePct);
    console.log('Review Count:', game.reviewCount);
    console.log('Is Free:', game.isFree);

    const metadata = game.metadata as any;
    console.log('\nPrice Info:');
    console.log('price_overview:', JSON.stringify(metadata?.price_overview, null, 2));

    console.log('\nFull Metadata Keys:', Object.keys(metadata || {}).join(', '));
  } else {
    console.log('No games found in database');
  }

  await prisma.$disconnect();
}

main();
