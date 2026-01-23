import { prisma } from '../lib/prisma';

async function getTopGames(limit: number = 100) {
  const games = await prisma.game.findMany({
    where: {
      reviewCount: { gte: 1000 }
    },
    orderBy: {
      reviewCount: 'desc'
    },
    take: limit,
    select: {
      appId: true,
      name: true,
      reviewCount: true
    }
  });

  console.log(`Found ${games.length} top games to re-ingest`);
  return games;
}

async function reingestViaAPI(games: Array<{ appId: bigint; name: string }>) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  console.log(`\nRe-ingesting ${games.length} games via ${baseUrl}/api/games/ingest`);
  console.log('This will take a while due to Steam API rate limiting...\n');

  const batch = games.map(g => ({
    appId: Number(g.appId),
    name: g.name
  }));

  try {
    const response = await fetch(`${baseUrl}/api/games/ingest`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ games: batch })
    });

    const result = await response.json();
    console.log('\nResult:', result);
    return result;
  } catch (error) {
    console.error('Failed to re-ingest:', error);
    throw error;
  }
}

async function main() {
  const limit = process.argv[2] ? parseInt(process.argv[2]) : 100;

  console.log('='.repeat(60));
  console.log(`Re-ingesting Top ${limit} Games (by review count)`);
  console.log('='.repeat(60));

  const games = await getTopGames(limit);

  if (games.length === 0) {
    console.log('No games found to re-ingest');
    await prisma.$disconnect();
    return;
  }

  await reingestViaAPI(games);
  await prisma.$disconnect();
}

main().catch(console.error);
