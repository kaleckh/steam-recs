/**
 * Add a specific game by Steam App ID
 *
 * Usage:
 *   npx tsx scripts/add-game-by-id.ts 1808500
 *   npx tsx scripts/add-game-by-id.ts 1808500 570 730  # Multiple IDs
 */

import 'dotenv/config';
import OpenAI from 'openai';
import { fetchSteamAppDetails, stripHtml, extractReleaseYear, fetchSteamReviewScore } from '../lib/steam-api';
import { fetchSteamSpyData, createEnrichedMetadata } from '../lib/steamspy-api';
import { createEmbeddingText } from '../lib/embeddings';
import { prisma } from '../lib/prisma';
import { Prisma } from '@prisma/client';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function addGame(appId: number): Promise<{ success: boolean; name?: string; error?: string }> {
  try {
    // Check if already exists
    const existing = await prisma.game.findUnique({
      where: { appId: BigInt(appId) },
      select: { name: true },
    });

    if (existing) {
      return { success: true, name: `${existing.name} (already exists)` };
    }

    // Fetch Steam data
    const steamData = await fetchSteamAppDetails(appId);
    if (!steamData) {
      return { success: false, error: 'Steam API returned no data' };
    }

    // Fetch SteamSpy data for tags
    const steamSpyData = await fetchSteamSpyData(appId);
    const enriched = createEnrichedMetadata(steamSpyData);
    const tags = enriched.tags;

    // Get review score
    let reviewScore = enriched.reviewScore;
    if (!reviewScore) {
      const reviewData = await fetchSteamReviewScore(appId);
      reviewScore = reviewData?.reviewPositivePct || null;
    }

    // Build metadata
    const metadata: any = {
      steam_appid: steamData.steam_appid,
      type: steamData.type,
      name: steamData.name,
      short_description: stripHtml(steamData.short_description),
      detailed_description: stripHtml(steamData.detailed_description),
      about_the_game: stripHtml(steamData.about_the_game),
      genres: steamData.genres?.map((g: any) => g.description) || [],
      categories: steamData.categories?.map((c: any) => c.description) || [],
      developers: steamData.developers || [],
      publishers: steamData.publishers || [],
      release_date: steamData.release_date,
      release_year: extractReleaseYear(steamData.release_date),
      review_count: steamData.recommendations?.total || 0,
      metacritic_score: steamData.metacritic?.score || null,
      is_free: steamData.is_free,
      header_image: steamData.header_image,
      tags,
      steamspy_review_score: enriched.reviewScore,
      steam_review_score: reviewScore,
    };

    // Generate embedding
    const embeddingText = createEmbeddingText({
      name: steamData.name,
      shortDescription: metadata.short_description,
      detailedDescription: metadata.detailed_description,
      aboutTheGame: metadata.about_the_game,
      genres: metadata.genres,
      categories: metadata.categories,
      developers: metadata.developers,
      releaseYear: metadata.release_year,
      reviewCount: metadata.review_count,
      reviewPositivePct: reviewScore || undefined,
      metacriticScore: metadata.metacritic_score,
      isFree: metadata.is_free,
      tags,
    });

    const response = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: embeddingText,
    });
    const embedding = response.data[0].embedding;
    const vectorString = `[${embedding.join(',')}]`;

    // Insert into database
    await prisma.$executeRaw`
      INSERT INTO games (
        app_id, name, release_year, review_positive_pct, review_count,
        is_free, metacritic_score, type, metadata, embedding,
        created_at, updated_at
      )
      VALUES (
        ${BigInt(appId)},
        ${steamData.name},
        ${metadata.release_year || null},
        ${reviewScore || null},
        ${metadata.review_count || null},
        ${metadata.is_free !== undefined ? metadata.is_free : null},
        ${metadata.metacritic_score || null},
        ${metadata.type || null},
        ${JSON.stringify(metadata)}::jsonb,
        ${Prisma.raw(`'${vectorString}'::vector(1536)`)},
        NOW(),
        NOW()
      )
    `;

    return { success: true, name: steamData.name };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
}

async function main() {
  const appIds = process.argv.slice(2).map(id => parseInt(id, 10)).filter(id => !isNaN(id));

  if (appIds.length === 0) {
    console.log('Usage: npx tsx scripts/add-game-by-id.ts <appId> [appId2] [appId3]...');
    console.log('Example: npx tsx scripts/add-game-by-id.ts 1808500');
    process.exit(1);
  }

  console.log(`Adding ${appIds.length} game(s)...\n`);

  for (const appId of appIds) {
    const result = await addGame(appId);
    if (result.success) {
      console.log(`✓ ${appId}: ${result.name}`);
    } else {
      console.log(`✗ ${appId}: ${result.error}`);
    }
  }

  await prisma.$disconnect();
}

main();
