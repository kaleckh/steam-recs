import { prisma } from '../lib/prisma';

async function checkGame() {
  const game = await prisma.game.findFirst({
    where: {
      reviewCount: { gte: 10000 }
    },
    orderBy: {
      reviewCount: 'desc'
    },
    select: {
      appId: true,
      name: true,
      reviewCount: true,
      metadata: true
    }
  });

  if (game) {
    console.log('Game:', game.name);
    console.log('App ID:', game.appId.toString());
    console.log('Review count:', game.reviewCount);
    const metadata = game.metadata as any;
    console.log('Has header_image:', metadata?.header_image ? 'YES' : 'NO');
    console.log('Screenshots count:', metadata?.screenshots?.length || 0);
    console.log('Movies count:', metadata?.movies?.length || 0);
    console.log('\nMetadata keys:', Object.keys(metadata || {}).sort().join(', '));

    if (metadata?.screenshots && metadata.screenshots.length > 0) {
      console.log('\nFirst screenshot:', JSON.stringify(metadata.screenshots[0], null, 2));
    }
    if (metadata?.movies && metadata.movies.length > 0) {
      console.log('\nFirst movie:', JSON.stringify(metadata.movies[0], null, 2));
    }
  } else {
    console.log('No games found in database');
  }

  await prisma.$disconnect();
}

checkGame().catch(console.error);
