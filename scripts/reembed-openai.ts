/**
 * Re-embed All Games with OpenAI Embeddings (FAST)
 *
 * Uses OpenAI's text-embedding-3-small (1536 dimensions) for dramatically
 * better semantic understanding than the previous MiniLM model.
 *
 * Optimizations:
 * - Batch API: Up to 100 texts per OpenAI call (rate limit safe)
 * - Concurrent batches: Process multiple batches in parallel
 * - Bulk DB updates: Update multiple rows per transaction
 *
 * Usage:
 *   tsx scripts/reembed-openai.ts
 *   tsx scripts/reembed-openai.ts --batch-size=50 --concurrency=3
 *   tsx scripts/reembed-openai.ts --dry-run  # Test without updating DB
 *
 * Expected time for 22k games:
 * - ~3-5 minutes with default settings
 * - Cost: ~$0.20-0.30 total
 */

import 'dotenv/config';
import OpenAI from 'openai';
import { prisma } from '../lib/prisma';
import { Prisma } from '@prisma/client';
import { createEmbeddingText } from '../lib/embeddings';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface GameRow {
  app_id: bigint;
  name: string;
  metadata: any;
}

interface ReembedOptions {
  batchSize: number;       // Games per OpenAI API call
  concurrency: number;     // Concurrent API calls
  dryRun: boolean;         // Test without DB updates
  startFrom: number;       // Resume from specific offset
  limit: number;           // Max games to process (0 = all)
}

/**
 * Parse CLI arguments
 */
function parseArgs(): ReembedOptions {
  const args = process.argv.slice(2);
  const options: ReembedOptions = {
    batchSize: 50,       // Smaller batches to avoid rate limits
    concurrency: 2,      // Only 2 concurrent batches to stay under 1M TPM
    dryRun: false,
    startFrom: 0,
    limit: 0,
  };

  for (const arg of args) {
    if (arg.startsWith('--batch-size=')) {
      options.batchSize = parseInt(arg.split('=')[1], 10);
    } else if (arg.startsWith('--concurrency=')) {
      options.concurrency = parseInt(arg.split('=')[1], 10);
    } else if (arg === '--dry-run') {
      options.dryRun = true;
    } else if (arg.startsWith('--start-from=')) {
      options.startFrom = parseInt(arg.split('=')[1], 10);
    } else if (arg.startsWith('--limit=')) {
      options.limit = parseInt(arg.split('=')[1], 10);
    } else if (arg === '--help' || arg === '-h') {
      printUsage();
      process.exit(0);
    }
  }

  return options;
}

function printUsage() {
  console.log(`
Re-embed All Games with OpenAI Embeddings

Uses OpenAI's text-embedding-3-small for much better semantic search.

Usage:
  tsx scripts/reembed-openai.ts [OPTIONS]

Options:
  --batch-size=N    Games per OpenAI call (default: 100, max: 2048)
  --concurrency=N   Concurrent API calls (default: 5)
  --dry-run         Test without updating database
  --start-from=N    Resume from offset N
  --limit=N         Process only N games (0 = all)
  --help, -h        Show this help

Examples:
  tsx scripts/reembed-openai.ts
  tsx scripts/reembed-openai.ts --batch-size=50 --concurrency=3
  tsx scripts/reembed-openai.ts --dry-run --limit=100
`);
}

/**
 * Fetch all games that need re-embedding (skips already embedded)
 */
async function fetchGamesToEmbed(options: ReembedOptions): Promise<GameRow[]> {
  console.log('Fetching games from database (skipping already embedded)...');

  let query = Prisma.sql`
    SELECT app_id, name, metadata
    FROM games
    WHERE embedding IS NULL
    ORDER BY app_id
  `;

  if (options.limit > 0) {
    query = Prisma.sql`
      SELECT app_id, name, metadata
      FROM games
      WHERE embedding IS NULL
      ORDER BY app_id
      LIMIT ${options.limit}
    `;
  }

  const games = await prisma.$queryRaw<GameRow[]>(query);

  // Also get count of already embedded for reporting
  const alreadyDone = await prisma.$queryRaw<[{count: bigint}]>`
    SELECT COUNT(*) as count FROM games WHERE embedding IS NOT NULL
  `;
  const doneCount = Number(alreadyDone[0].count);

  console.log(`Already embedded: ${doneCount.toLocaleString()} games`);
  console.log(`Remaining: ${games.length.toLocaleString()} games to embed`);

  return games;
}

/**
 * Build embedding text from game metadata
 */
function buildEmbeddingText(game: GameRow): string {
  const m = game.metadata || {};

  return createEmbeddingText({
    name: game.name,
    shortDescription: m.short_description,
    detailedDescription: m.detailed_description,
    aboutTheGame: m.about_the_game,
    genres: m.genres,
    categories: m.categories,
    developers: m.developers,
    publishers: m.publishers,
    releaseYear: m.release_year,
    reviewCount: m.review_count,
    reviewPositivePct: m.steam_review_score || m.steamspy_review_score,
    metacriticScore: m.metacritic_score,
    isFree: m.is_free,
    tags: m.tags,
    contentDescriptors: m.content_descriptors,
  });
}

/**
 * Generate embeddings for a batch of texts using OpenAI with retry logic
 */
async function embedBatch(texts: string[], maxRetries = 5): Promise<number[][]> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: texts,
      });

      // Sort by index to maintain order
      const sorted = response.data.sort((a, b) => a.index - b.index);
      return sorted.map(d => d.embedding);
    } catch (error: any) {
      if (error?.status === 429) {
        // Rate limit - extract retry-after or use exponential backoff
        const retryAfterMs = error?.headers?.get?.('retry-after-ms') ||
                            (Math.pow(2, attempt) * 1000);
        const waitMs = Math.min(Number(retryAfterMs) + 500, 60000);
        console.log(`  Rate limit hit, waiting ${waitMs}ms before retry ${attempt + 1}/${maxRetries}...`);
        await new Promise(resolve => setTimeout(resolve, waitMs));
        continue;
      }
      throw error;
    }
  }
  throw new Error('Max retries exceeded for rate limit');
}

/**
 * Update embeddings in database (bulk update)
 */
async function updateEmbeddings(
  games: GameRow[],
  embeddings: number[][],
  dryRun: boolean
): Promise<void> {
  if (dryRun) {
    console.log(`  [DRY RUN] Would update ${games.length} games`);
    return;
  }

  // Build a single bulk update query using CASE WHEN
  // This is MUCH faster than individual updates
  const updates = games.map((game, i) => {
    const vectorStr = `[${embeddings[i].join(',')}]`;
    return {
      appId: game.app_id,
      vector: vectorStr,
    };
  });

  // Use a transaction with multiple updates
  // Postgres can handle ~100-500 updates efficiently in one transaction
  await prisma.$transaction(
    updates.map(u =>
      prisma.$executeRaw`
        UPDATE games
        SET embedding = ${Prisma.raw(`'${u.vector}'::vector(1536)`)},
            updated_at = NOW()
        WHERE app_id = ${u.appId}
      `
    )
  );
}

/**
 * Process a single batch of games
 */
async function processBatch(
  games: GameRow[],
  batchIndex: number,
  totalBatches: number,
  dryRun: boolean
): Promise<{ success: number; failed: number; tokens: number }> {
  try {
    // Build embedding texts
    const texts = games.map(g => buildEmbeddingText(g));

    // Generate embeddings
    const embeddings = await embedBatch(texts);

    // Update database
    await updateEmbeddings(games, embeddings, dryRun);

    // Estimate tokens (rough: ~500 tokens per game)
    const estimatedTokens = texts.reduce((sum, t) => sum + Math.ceil(t.length / 4), 0);

    return { success: games.length, failed: 0, tokens: estimatedTokens };
  } catch (error) {
    console.error(`  Batch ${batchIndex + 1}/${totalBatches} failed:`, error);
    return { success: 0, failed: games.length, tokens: 0 };
  }
}

/**
 * Process all games with controlled concurrency
 */
async function processAllGames(
  games: GameRow[],
  options: ReembedOptions
): Promise<{ success: number; failed: number; tokens: number }> {
  const { batchSize, concurrency, dryRun } = options;

  // Split into batches
  const batches: GameRow[][] = [];
  for (let i = 0; i < games.length; i += batchSize) {
    batches.push(games.slice(i, i + batchSize));
  }

  console.log(`\nProcessing ${batches.length} batches (${batchSize} games each)`);
  console.log(`Concurrency: ${concurrency} parallel batches`);
  if (dryRun) console.log('DRY RUN MODE - no database updates');
  console.log('');

  let totalSuccess = 0;
  let totalFailed = 0;
  let totalTokens = 0;
  let processed = 0;

  const startTime = Date.now();

  // Process batches with controlled concurrency
  for (let i = 0; i < batches.length; i += concurrency) {
    const concurrentBatches = batches.slice(i, i + concurrency);

    const results = await Promise.all(
      concurrentBatches.map((batch, j) =>
        processBatch(batch, i + j, batches.length, dryRun)
      )
    );

    for (const result of results) {
      totalSuccess += result.success;
      totalFailed += result.failed;
      totalTokens += result.tokens;
    }

    processed += concurrentBatches.length;
    const gamesProcessed = Math.min((i + concurrency) * batchSize, games.length);
    const elapsed = (Date.now() - startTime) / 1000;
    const rate = gamesProcessed / elapsed;
    const eta = (games.length - gamesProcessed) / rate;

    console.log(
      `[${processed}/${batches.length} batches] ` +
      `${gamesProcessed.toLocaleString()}/${games.length.toLocaleString()} games ` +
      `(${rate.toFixed(1)}/sec, ETA: ${eta.toFixed(0)}s)`
    );

    // Delay between batch groups to stay under 1M tokens/min rate limit
    // ~40k tokens per batch * 2 concurrent = ~80k tokens per group
    // Need to average ~16 groups per minute max, so ~4 seconds between groups
    if (i + concurrency < batches.length) {
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
  }

  return { success: totalSuccess, failed: totalFailed, tokens: totalTokens };
}

/**
 * Main execution
 */
async function main() {
  console.log('='.repeat(70));
  console.log('Re-embed All Games with OpenAI (text-embedding-3-small)');
  console.log('='.repeat(70));
  console.log('');

  const options = parseArgs();
  const startTime = Date.now();

  try {
    // Verify OpenAI API key
    if (!process.env.OPENAI_API_KEY) {
      console.error('ERROR: OPENAI_API_KEY environment variable not set');
      process.exit(1);
    }

    // Fetch games
    const games = await fetchGamesToEmbed(options);

    if (games.length === 0) {
      console.log('No games to process');
      process.exit(0);
    }

    // Process all games
    const result = await processAllGames(games, options);

    // Summary
    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    const durationMins = (parseFloat(duration) / 60).toFixed(1);
    const estimatedCost = (result.tokens / 1_000_000) * 0.02; // $0.02 per 1M tokens

    console.log('');
    console.log('='.repeat(70));
    console.log('Re-embedding Complete');
    console.log('='.repeat(70));
    console.log(`Total games:      ${games.length.toLocaleString()}`);
    console.log(`Successful:       ${result.success.toLocaleString()}`);
    console.log(`Failed:           ${result.failed.toLocaleString()}`);
    console.log(`Duration:         ${duration}s (${durationMins} min)`);
    console.log(`Estimated tokens: ${result.tokens.toLocaleString()}`);
    console.log(`Estimated cost:   $${estimatedCost.toFixed(3)}`);
    console.log('');

    if (options.dryRun) {
      console.log('This was a DRY RUN - no changes were made to the database.');
      console.log('Run without --dry-run to apply changes.');
    } else {
      console.log('✅ All games re-embedded with OpenAI embeddings!');
      console.log('Your semantic search is now much more accurate.');
    }
    console.log('');

    await prisma.$disconnect();
    process.exit(result.failed > 0 ? 1 : 0);
  } catch (error) {
    console.error('\nFatal error:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

main();
