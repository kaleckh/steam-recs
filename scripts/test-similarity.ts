import { generateEmbedding } from '../lib/embeddings';
import { prisma } from '../lib/prisma';

async function testSimilarity() {
  // Test query: "lonely cyberpunk atmosphere with stealth"
  const query = "moody cyberpunk game with tactical squad-based gameplay and multiple strategies";

  console.log('Query:', query);
  console.log('\nGenerating embedding...');

  const queryEmbedding = await generateEmbedding(query);
  const vectorString = `[${queryEmbedding.join(',')}]`;

  console.log('Searching for similar games...\n');

  // Find top 5 similar games
  const results = await prisma.$queryRaw<Array<{
    app_id: bigint;
    name: string;
    distance: number;
    tags: any;
  }>>`
    SELECT
      app_id,
      name,
      (embedding <=> ${vectorString}::vector(384)) as distance,
      metadata->'tags' as tags
    FROM games
    WHERE embedding IS NOT NULL
    ORDER BY embedding <=> ${vectorString}::vector(384) ASC
    LIMIT 5
  `;

  console.log('Top 5 matches:\n');
  results.forEach((game, i) => {
    const similarity = (1 - Number(game.distance) / 2) * 100;
    const tags = Array.isArray(game.tags) ? game.tags : [];
    console.log(`${i + 1}. ${game.name}`);
    console.log(`   Similarity: ${similarity.toFixed(1)}%`);
    console.log(`   Tags: ${tags.slice(0, 5).join(', ')}`);
    console.log('');
  });

  await prisma.$disconnect();
}

testSimilarity();
