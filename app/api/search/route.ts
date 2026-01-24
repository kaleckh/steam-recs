import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { generateOpenAIEmbedding } from '@/lib/embeddings';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface GameCandidate {
  appId: string;
  name: string;
  similarity: number;
  releaseYear: number | null;
  reviewScore: number | null;
  reviewCount: number | null;
  isFree: boolean | null;
  price: string | undefined;
  genres: string[];
  categories: string[]; // Steam categories (Co-op, Multi-player, etc.)
  tags: string[];
  shortDescription: string | undefined;
  headerImage: string | undefined;
  developers: string[] | undefined;
}

interface AISelectedGame {
  appId: string;
  reason: string;
}

interface FollowUpQuestion {
  question: string;
  suggestedAnswers: string[];
}

interface QueryAnalysis {
  type: 'specific_game' | 'clear_intent' | 'vague';
  gameName: string | null;
  searchDescription: string;
  confidence: number;
  followUpQuestions: FollowUpQuestion[]; // 3 follow-up questions to refine results
}

interface ConversationContext {
  originalQuery: string;
  refinements: string[]; // User's answers to follow-up questions
  round: number; // Current round (1-3)
}

/**
 * Analyze the search query and ALWAYS generate a follow-up question to refine results.
 * This enables conversational search where each answer improves accuracy.
 */
async function analyzeQuery(query: string, previousRefinements: string[] = []): Promise<QueryAnalysis> {
  const contextNote = previousRefinements.length > 0
    ? `\n\nUser has already specified: ${previousRefinements.join(', ')}`
    : '';

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: `Analyze this game search query and extract the user's intent.${contextNote}

If the query references a specific game (e.g., "games like Hades", "similar to Stardew Valley"):
- type: "specific_game"
- gameName: the exact game name mentioned
- searchDescription: describe that game's core appeal in 2-3 sentences

If the query describes what they want (e.g., "cozy farming games", "roguelike with good combat"):
- type: "clear_intent"
- gameName: null
- searchDescription: rephrase their request as a description of the ideal game

If the query is vague (e.g., "fun games", "something good"):
- type: "vague"
- gameName: null
- searchDescription: your best interpretation

IMPORTANT: Generate 3 follow-up questions to help narrow down results. Each question should be different and help eliminate irrelevant games.

NEVER ask about platform/console preference - this is a Steam-only recommendation service, all games are PC/Steam games.

For each question:
- question: SHORT clarifying question (5-10 words max)
  Good examples: "Online or local co-op?", "Prefer challenging or relaxing?", "Story-driven or gameplay-focused?"
  BAD examples (never use): "What platform?", "PC or console?", "Any platform preference?"
- suggestedAnswers: 2-4 SHORT answer options (1-3 words each)
  Example: {"question": "Solo or with friends?", "suggestedAnswers": ["Solo", "With friends", "Either"]}

Return JSON only:
{"type": "...", "gameName": "..." or null, "searchDescription": "...", "confidence": 0-100, "followUpQuestions": [{"question": "...", "suggestedAnswers": ["...", "..."]}, {"question": "...", "suggestedAnswers": ["...", "..."]}, {"question": "...", "suggestedAnswers": ["...", "..."]}]}`
      },
      {
        role: 'user',
        content: query
      }
    ],
    response_format: { type: 'json_object' },
    temperature: 0.3,
    max_tokens: 500,
  });

  const content = response.choices[0]?.message?.content || '{}';
  try {
    const parsed = JSON.parse(content);
    return {
      type: parsed.type || 'clear_intent',
      gameName: parsed.gameName || null,
      searchDescription: parsed.searchDescription || query,
      confidence: parsed.confidence || 50,
      followUpQuestions: parsed.followUpQuestions || [
        { question: 'What mood are you in?', suggestedAnswers: ['Relaxing', 'Challenging', 'Either'] },
        { question: 'Solo or with friends?', suggestedAnswers: ['Solo', 'Multiplayer', 'Either'] },
        { question: 'Long sessions or quick plays?', suggestedAnswers: ['Long', 'Short', 'Either'] },
      ],
    };
  } catch {
    return {
      type: 'clear_intent',
      gameName: null,
      searchDescription: query,
      confidence: 50,
      followUpQuestions: [
        { question: 'What genre interests you most?', suggestedAnswers: ['Action', 'RPG', 'Strategy', 'Indie'] },
        { question: 'Prefer story or gameplay?', suggestedAnswers: ['Story', 'Gameplay', 'Both'] },
        { question: 'Challenging or relaxing?', suggestedAnswers: ['Challenging', 'Relaxing', 'Either'] },
      ],
    };
  }
}

/**
 * Get a game's embedding from the database by name (fuzzy match)
 */
async function findGameByName(gameName: string): Promise<{
  appId: bigint;
  name: string;
  embedding: number[];
} | null> {
  const results = await prisma.$queryRaw<
    Array<{
      app_id: bigint;
      name: string;
      embedding: string;
    }>
  >`
    SELECT app_id, name, embedding::text as embedding
    FROM games
    WHERE embedding IS NOT NULL
      AND (
        name ILIKE ${gameName}
        OR name ILIKE ${`${gameName}%`}
        OR name ILIKE ${`%${gameName}%`}
      )
    ORDER BY
      CASE
        WHEN name ILIKE ${gameName} THEN 1
        WHEN name ILIKE ${`${gameName}%`} THEN 2
        ELSE 3
      END,
      review_count DESC NULLS LAST
    LIMIT 1
  `;

  if (results.length === 0 || !results[0].embedding) return null;

  const game = results[0];
  const embeddingArray = game.embedding
    .replace(/[\[\]]/g, '')
    .split(',')
    .map(Number);

  return {
    appId: game.app_id,
    name: game.name,
    embedding: embeddingArray,
  };
}

/**
 * Get GPT to describe a game's characteristics for embedding
 */
async function describeGameForEmbedding(gameName: string): Promise<string> {
  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: `You are a game expert. Describe the given game's key characteristics for finding similar games.

Include:
- Primary genres (e.g., roguelike, RPG, shooter)
- Core gameplay mechanics (e.g., deck-building, extraction, base-building)
- Game feel/vibes (e.g., cozy, intense, atmospheric, challenging)
- Setting/theme (e.g., sci-fi, fantasy, post-apocalyptic)
- Multiplayer aspects if relevant (co-op, PvP, PvEvP, solo)
- Similar games it's often compared to

Write 2-3 dense sentences. Focus on what makes it unique and what players enjoy about it.
If you don't know the game, say "UNKNOWN" and nothing else.`
      },
      {
        role: 'user',
        content: gameName
      }
    ],
    temperature: 0.3,
    max_tokens: 200,
  });

  return response.choices[0]?.message?.content || gameName;
}

/**
 * GET /api/search?q=query&type=basic|semantic|ai&userId=xxx&context=...&round=1
 *
 * Search for games with conversational refinement.
 *
 * Parameters:
 * - q: Search query (required)
 * - type: basic|semantic|ai (default: ai)
 * - limit: Max results (default: 20)
 * - userId: User ID for personalization
 * - context: JSON-encoded conversation context (previous refinements)
 * - round: Current refinement round (1-3, default: 1)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    const searchType = searchParams.get('type') || 'ai'; // Default to AI search
    const limit = parseInt(searchParams.get('limit') || '20');
    const userId = searchParams.get('userId') || undefined;

    // Conversation context for multi-turn refinement
    const contextParam = searchParams.get('context');
    const round = parseInt(searchParams.get('round') || '1');
    const refinement = searchParams.get('refinement'); // User's answer to follow-up
    const maxRounds = 3;

    let conversationContext: ConversationContext = {
      originalQuery: query || '',
      refinements: [],
      round: round,
    };

    // Parse existing context if provided
    if (contextParam) {
      try {
        const parsed = JSON.parse(decodeURIComponent(contextParam));
        conversationContext = {
          originalQuery: parsed.originalQuery || query || '',
          refinements: parsed.refinements || [],
          round: round,
        };
      } catch {
        // Invalid context, start fresh
      }
    }

    // Add current refinement to context if provided
    if (refinement && refinement.trim()) {
      conversationContext.refinements.push(refinement.trim());
    }

    if (!query || query.trim().length === 0) {
      return NextResponse.json(
        { error: 'Query parameter "q" is required' },
        { status: 400 }
      );
    }

    // Basic search - fuzzy title matching
    if (searchType === 'basic') {
      const games = await prisma.$queryRaw<
        Array<{
          app_id: bigint;
          name: string;
          release_year: number | null;
          review_positive_pct: number | null;
          review_count: number | null;
          is_free: boolean | null;
          metadata: any;
        }>
      >`
        SELECT
          app_id,
          name,
          release_year,
          review_positive_pct,
          review_count,
          is_free,
          metadata
        FROM games
        WHERE name ILIKE ${`%${query}%`}
        ORDER BY review_count DESC NULLS LAST
        LIMIT ${limit}
      `;

      const formattedGames = games.map((game) => {
        const metadata = game.metadata as any;
        return {
          appId: game.app_id.toString(),
          name: game.name,
          releaseYear: game.release_year,
          reviewScore: game.review_positive_pct,
          reviewCount: game.review_count,
          isFree: game.is_free,
          headerImage: metadata?.header_image || null,
          genres: metadata?.genres || [],
          shortDescription: metadata?.short_description || null,
          price: metadata?.price_overview?.final_formatted || (game.is_free ? 'Free' : null),
        };
      });

      return NextResponse.json({
        success: true,
        type: 'basic',
        query,
        count: formattedGames.length,
        games: formattedGames,
      });
    }

    // Semantic search - vector similarity only
    if (searchType === 'semantic') {
      const queryEmbedding = await generateOpenAIEmbedding(query);
      const vectorString = `[${queryEmbedding.join(',')}]`;

      const games = await prisma.$queryRaw<
        Array<{
          app_id: bigint;
          name: string;
          distance: number;
          release_year: number | null;
          review_positive_pct: number | null;
          review_count: number | null;
          is_free: boolean | null;
          metadata: any;
        }>
      >`
        SELECT
          app_id,
          name,
          (embedding <=> ${Prisma.raw(`'${vectorString}'::vector(1536)`)}) as distance,
          release_year,
          review_positive_pct,
          review_count,
          is_free,
          metadata
        FROM games
        WHERE embedding IS NOT NULL
        ORDER BY embedding <=> ${Prisma.raw(`'${vectorString}'::vector(1536)`)} ASC
        LIMIT ${limit}
      `;

      const formattedGames = games.map((game) => {
        const metadata = game.metadata as any;
        const similarity = 1 - Number(game.distance) / 2;

        return {
          appId: game.app_id.toString(),
          name: game.name,
          similarity,
          distance: Number(game.distance),
          releaseYear: game.release_year,
          reviewScore: game.review_positive_pct,
          reviewCount: game.review_count,
          isFree: game.is_free,
          headerImage: metadata?.header_image || null,
          genres: metadata?.genres || [],
          shortDescription: metadata?.short_description || null,
          price: metadata?.price_overview?.final_formatted || (game.is_free ? 'Free' : null),
        };
      });

      return NextResponse.json({
        success: true,
        type: 'semantic',
        query,
        count: formattedGames.length,
        games: formattedGames,
      });
    }

    // AI-powered search - RAG with GPT-4o-mini (with conversational refinement)
    if (searchType === 'ai') {
      // Build the full search query from original + refinements
      const fullQuery = conversationContext.refinements.length > 0
        ? `${conversationContext.originalQuery} | ${conversationContext.refinements.join(' | ')}`
        : query;

      console.log(`[AI Search] Query: "${query}"`);
      console.log(`[AI Search] Full query with refinements: "${fullQuery}"`);
      console.log(`[AI Search] Round: ${conversationContext.round}/${maxRounds}`);

      // Step 1: Analyze the query to extract game name and intent
      const analysis = await analyzeQuery(fullQuery, conversationContext.refinements);
      console.log(`[AI Search] Analysis:`, analysis);

      let queryEmbedding: number[];
      let matchedGame: { appId: bigint; name: string } | null = null;

      if (analysis.type === 'specific_game' && analysis.gameName) {
        // Try to find the game in our database
        const dbGame = await findGameByName(analysis.gameName);

        if (dbGame) {
          // Game found in DB - use its embedding directly
          console.log(`[AI Search] Found "${analysis.gameName}" in DB as "${dbGame.name}"`);
          queryEmbedding = dbGame.embedding;
          matchedGame = { appId: dbGame.appId, name: dbGame.name };
        } else {
          // Game not in DB - ask GPT to describe it
          console.log(`[AI Search] "${analysis.gameName}" not in DB, getting GPT description`);
          const gameDescription = await describeGameForEmbedding(analysis.gameName);

          if (gameDescription === 'UNKNOWN') {
            // GPT doesn't know the game either, fall back to search description
            console.log(`[AI Search] GPT doesn't know "${analysis.gameName}", using search description`);
            queryEmbedding = await generateOpenAIEmbedding(analysis.searchDescription);
          } else {
            console.log(`[AI Search] GPT description: ${gameDescription}`);
            queryEmbedding = await generateOpenAIEmbedding(gameDescription);
          }
        }
      } else {
        // Not a specific game query - embed the search description
        console.log(`[AI Search] Using search description: ${analysis.searchDescription}`);
        queryEmbedding = await generateOpenAIEmbedding(analysis.searchDescription);
      }

      const vectorString = `[${queryEmbedding.join(',')}]`;

      // Step 2: Get user's owned games to exclude (if userId provided)
      let excludeAppIds: bigint[] = [];
      if (userId) {
        const ownedGames = await prisma.userGame.findMany({
          where: { userId },
          select: { appId: true },
        });
        excludeAppIds = ownedGames.map(g => g.appId);
      }

      // Also exclude the matched game itself (don't recommend the same game back)
      if (matchedGame) {
        excludeAppIds.push(matchedGame.appId);
      }

      // Build filter conditions
      const filterConditions: Prisma.Sql[] = [
        Prisma.sql`embedding IS NOT NULL`,
      ];

      if (excludeAppIds.length > 0) {
        filterConditions.push(
          Prisma.sql`app_id != ALL(ARRAY[${Prisma.join(
            excludeAppIds.map(id => Prisma.sql`${id}`),
            ','
          )}]::bigint[])`
        );
      }

      const whereClause = Prisma.sql`WHERE ${Prisma.join(filterConditions, ' AND ')}`;

      // Step 3: Retrieve top 50 candidates from pgvector
      const candidateLimit = 50;
      const candidates = await prisma.$queryRaw<
        Array<{
          app_id: bigint;
          name: string;
          distance: number;
          release_year: number | null;
          review_positive_pct: number | null;
          review_count: number | null;
          is_free: boolean | null;
          metadata: any;
        }>
      >`
        SELECT
          app_id,
          name,
          (embedding <=> ${Prisma.raw(`'${vectorString}'::vector(1536)`)}) as distance,
          release_year,
          review_positive_pct,
          review_count,
          is_free,
          metadata
        FROM games
        ${whereClause}
        ORDER BY embedding <=> ${Prisma.raw(`'${vectorString}'::vector(1536)`)} ASC
        LIMIT ${candidateLimit}
      `;

      // Transform candidates for LLM
      const gameCandidates: GameCandidate[] = candidates.map(game => {
        const metadata = game.metadata || {};
        const priceOverview = metadata.price_overview as any;

        let genres: string[] = [];
        if (metadata.genres && Array.isArray(metadata.genres)) {
          genres = metadata.genres.map((g: any) =>
            typeof g === 'string' ? g : (g.description || g.name || String(g))
          );
        }

        let tags: string[] = [];
        if (metadata.tags && Array.isArray(metadata.tags)) {
          tags = metadata.tags.slice(0, 10);
        }

        let categories: string[] = [];
        if (metadata.categories && Array.isArray(metadata.categories)) {
          categories = metadata.categories.map((c: any) =>
            typeof c === 'string' ? c : (c.description || c.name || String(c))
          );
        }

        return {
          appId: game.app_id.toString(),
          name: game.name,
          similarity: 1 - Number(game.distance) / 2,
          releaseYear: game.release_year,
          reviewScore: game.review_positive_pct,
          reviewCount: game.review_count,
          isFree: game.is_free,
          price: priceOverview?.final_formatted as string | undefined,
          genres,
          categories,
          tags,
          shortDescription: metadata.short_description as string | undefined,
          headerImage: metadata.header_image as string | undefined,
          developers: metadata.developers as string[] | undefined,
        };
      });

      console.log(`[AI Search] Retrieved ${gameCandidates.length} candidates`);

      // Step 4: Use GPT-4o-mini to filter and rank
      const gameList = gameCandidates.map((g, i) => {
        const info = [
          `${i + 1}. "${g.name}" (ID: ${g.appId})`,
          g.genres?.length ? `   Genres: ${g.genres.join(', ')}` : null,
          g.categories?.length ? `   Features: ${g.categories.join(', ')}` : null,
          g.tags?.length ? `   Tags: ${g.tags.join(', ')}` : null,
          g.reviewScore ? `   Reviews: ${g.reviewScore}% positive` : null,
          g.releaseYear ? `   Year: ${g.releaseYear}` : null,
          g.shortDescription ? `   Desc: ${g.shortDescription.slice(0, 150)}...` : null,
        ].filter(Boolean).join('\n');
        return info;
      }).join('\n\n');

      const resultLimit = Math.min(limit, 15);

      const systemPrompt = `You are a game recommendation expert. Given a user's search query and a list of candidate games, select UP TO ${resultLimit} games that match what the user is looking for.

Consider:
- Gameplay style, mechanics, and "vibes" the user is describing
- Genre preferences (explicit or implied)
- Quality indicators (review scores)
- Any specific requirements mentioned in the query
- The "Features" field contains Steam categories like "Co-op", "Multi-player", "Online Co-op", "4-player local", etc.

Return a JSON object with a "results" array containing objects with:
- "appId": the game's ID (string)
- "reason": a brief (1 sentence) explanation of why this game matches

Example response:
{"results": [{"appId": "123456", "reason": "Cozy farming sim with light combat mechanics"}, ...]}

IMPORTANT: For broad queries (like "co-op games" or "relaxing games"), include many results - aim for ${resultLimit} games. Only return fewer results for very specific queries where few games truly match.`;

      const userPrompt = `User's search: "${query}"

Candidate games:
${gameList}

Select the best matches and explain why each fits the user's request.`;

      console.log(`[AI Search] Calling GPT-4o-mini...`);

      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.3,
        max_tokens: 1500,
      });

      const responseText = completion.choices[0]?.message?.content || '{"results": []}';

      let selectedGames: AISelectedGame[] = [];
      try {
        const parsed = JSON.parse(responseText);
        selectedGames = Array.isArray(parsed) ? parsed : (parsed.results || parsed.games || []);
      } catch (e) {
        console.error('[AI Search] Failed to parse LLM response:', responseText);
        // Fallback to top similarity matches
        selectedGames = gameCandidates.slice(0, resultLimit).map(g => ({
          appId: g.appId,
          reason: 'Matched based on game description similarity',
        }));
      }

      // Step 5: Build final response with full game data
      const selectedAppIds = new Set(selectedGames.map(g => g.appId));
      const reasonMap = new Map(selectedGames.map(g => [g.appId, g.reason]));

      const results = gameCandidates
        .filter(g => selectedAppIds.has(g.appId))
        .map(g => ({
          ...g,
          aiReason: reasonMap.get(g.appId) || null,
        }))
        // Maintain the order from GPT's selection
        .sort((a, b) => {
          const aIdx = selectedGames.findIndex(s => s.appId === a.appId);
          const bIdx = selectedGames.findIndex(s => s.appId === b.appId);
          return aIdx - bIdx;
        });

      console.log(`[AI Search] Returning ${results.length} results`);

      // Build context for next round (frontend sends this back)
      const nextContext: ConversationContext = {
        originalQuery: conversationContext.originalQuery || query,
        refinements: [...conversationContext.refinements], // Include all refinements so far
        round: conversationContext.round,
      };

      // Should we ask a follow-up question?
      const canAskMore = conversationContext.round < maxRounds;

      return NextResponse.json({
        success: true,
        type: 'ai',
        query,
        count: results.length,
        games: results,
        // Include analysis info for transparency
        analysis: {
          type: analysis.type,
          gameName: analysis.gameName,
          matchedInDb: matchedGame ? {
            appId: matchedGame.appId.toString(),
            name: matchedGame.name,
          } : null,
          searchDescription: analysis.searchDescription,
        },
        // Conversational refinement - send all questions upfront
        conversation: {
          round: conversationContext.round,
          maxRounds,
          canRefine: canAskMore,
          // All follow-up questions to collect answers before searching
          followUpQuestions: analysis.followUpQuestions || [],
          // Context to send back with next request
          context: nextContext,
        },
        usage: {
          promptTokens: completion.usage?.prompt_tokens,
          completionTokens: completion.usage?.completion_tokens,
          totalTokens: completion.usage?.total_tokens,
        },
      });
    }

    return NextResponse.json(
      { error: 'Invalid search type. Use "basic", "semantic", or "ai"' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json(
      {
        error: 'Failed to perform search',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
