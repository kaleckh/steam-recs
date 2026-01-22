import { pipeline, FeatureExtractionPipeline } from '@xenova/transformers';

// Singleton pattern for the transformer model
let embeddingPipeline: FeatureExtractionPipeline | null = null;
let initializationPromise: Promise<FeatureExtractionPipeline> | null = null;

/**
 * Initialize the embedding model (lazy loaded).
 * Uses all-MiniLM-L6-v2 which produces 384-dimensional embeddings.
 */
async function getEmbeddingPipeline(): Promise<FeatureExtractionPipeline> {
  if (embeddingPipeline) {
    return embeddingPipeline;
  }

  // If initialization is in progress, wait for it
  if (initializationPromise) {
    return initializationPromise;
  }

  // Start initialization
  initializationPromise = (async () => {
    try {
      console.log('Loading embedding model: Xenova/all-MiniLM-L6-v2...');
      const pipe = await pipeline(
        'feature-extraction',
        'Xenova/all-MiniLM-L6-v2'
      );
      embeddingPipeline = pipe;
      console.log('Embedding model loaded successfully');
      return pipe;
    } catch (error) {
      initializationPromise = null; // Reset on error so it can be retried
      throw new Error(`Failed to load embedding model: ${error instanceof Error ? error.message : String(error)}`);
    }
  })();

  return initializationPromise;
}

/**
 * Detect if game is multiplayer from categories.
 */
function isMultiplayer(categories?: string[]): boolean {
  if (!categories) return false;
  const multiplayerKeywords = [
    'multi-player',
    'multiplayer',
    'co-op',
    'online',
    'pvp',
    'mmo',
    'cross-platform multiplayer',
  ];
  return categories.some(cat => 
    multiplayerKeywords.some(keyword => 
      cat.toLowerCase().includes(keyword)
    )
  );
}

/**
 * Filter categories to most semantically meaningful ones.
 * Removes generic categories, keeps gameplay-defining features.
 */
function filterCategories(categories?: string[]): string[] {
  if (!categories || categories.length === 0) return [];
  
  // High-value categories that define gameplay experience
  const priorityKeywords = [
    'multi-player', 'co-op', 'pvp', 'mmo',
    'single-player', 'vr', 'cross-platform',
    'achievements', 'leaderboards', 'workshop',
    'controller', 'remote play', 'cloud',
    'trading cards', 'level editor', 'mods',
  ];
  
  // Low-value generic categories to skip
  const skipKeywords = [
    'steam achievements', 'full controller support',
    'partial controller support', 'steam cloud',
    'steam trading cards', 'stats',
  ];
  
  // Prioritize high-value categories
  const priority = categories.filter(cat => 
    priorityKeywords.some(kw => cat.toLowerCase().includes(kw)) &&
    !skipKeywords.some(skip => cat.toLowerCase() === skip.toLowerCase())
  );
  
  // Add remaining categories up to limit
  const remaining = categories.filter(cat => 
    !priority.includes(cat) &&
    !skipKeywords.some(skip => cat.toLowerCase() === skip.toLowerCase())
  );
  
  return [...priority, ...remaining].slice(0, 6);
}

/**
 * Generate embedding text from game metadata.
 * Prioritizes semantic signal for recommendations: story, mechanics, mood, era, quality.
 * Keeps output under ~2000 chars to avoid truncation.
 */
export function createEmbeddingText(params: {
  name: string;
  shortDescription?: string;
  detailedDescription?: string;
  aboutTheGame?: string;
  genres?: string[];
  categories?: string[];
  developers?: string[];
  publishers?: string[];
  releaseYear?: number;
  reviewCount?: number;
  reviewPositivePct?: number;
  metacriticScore?: number;
  isFree?: boolean;
  tags?: string[];
  contentDescriptors?: string;
}): string {
  const sections: string[] = [];
  let charCount = 0;
  const maxChars = 1950; // Leave buffer for safety
  
  // Helper to add section with length check
  const addSection = (text: string): boolean => {
    if (charCount + text.length > maxChars) return false;
    sections.push(text);
    charCount += text.length + 2; // +2 for ". " separator
    return true;
  };
  
  // 1. HEADER: Game name + release year (establishes era/context)
  const year = params.releaseYear || 'Unknown';
  addSection(`Game: ${params.name} (${year})`);
  
  // 2. GENRES: Critical for similarity matching
  if (params.genres && params.genres.length > 0) {
    addSection(`Genres: ${params.genres.join(', ')}`);
  }
  
  // 3. FEATURES: Gameplay-defining categories (filtered for quality)
  const meaningfulCategories = filterCategories(params.categories);
  if (meaningfulCategories.length > 0) {
    addSection(`Features: ${meaningfulCategories.join(', ')}`);
  }
  
  // 4. DEVELOPERS: Studio reputation (especially important for indie/AAA distinction)
  if (params.developers && params.developers.length > 0) {
    // Include up to 2 developers if co-developed
    const devs = params.developers.slice(0, 2).join(', ');
    addSection(`Developer: ${devs}`);
  }
  
  // 5. SUMMARY: Short description (highest density of semantic info)
  if (params.shortDescription) {
    addSection(`Summary: ${params.shortDescription}`);
  }
  
  // 6. TAGS: User-generated semantic labels (CRITICAL for accuracy)
  // Tags from SteamSpy are THE most valuable signal for similarity matching
  // They capture game "vibes" that genres miss (souls-like, cozy, roguelike, etc.)
  if (params.tags && params.tags.length > 0) {
    const topTags = params.tags.slice(0, 15).join(', '); // Increased from 10 to 15
    // Give tags high priority by adding early in the text
    if (addSection(`Player Tags: ${topTags}`)) {
      // Successfully added
    }
  }

  // 7. DETAILED DESCRIPTION: Core gameplay/story description
  // Use the most informative text available
  const detailedText = params.detailedDescription || params.aboutTheGame;
  if (detailedText) {
    // Calculate remaining space for description
    const remainingChars = maxChars - charCount - 200; // Reserve 200 for quality signals
    const descLength = Math.min(1200, Math.max(400, remainingChars));
    
    if (remainingChars > 300) {
      const truncated = detailedText.slice(0, descLength);
      addSection(`Description: ${truncated}`);
    }
  }
  
  // 8. MULTIPLAYER: Important gameplay distinction
  const hasMultiplayer = isMultiplayer(params.categories);
  if (hasMultiplayer) {
    addSection('Multiplayer: Yes');
  }
  
  // 9. QUALITY SIGNALS: Help with recommendation ranking
  const qualitySignals: string[] = [];
  
  if (params.reviewPositivePct !== undefined && params.reviewPositivePct > 0) {
    qualitySignals.push(`${params.reviewPositivePct}% positive reviews`);
  }
  
  if (params.metacriticScore && params.metacriticScore >= 70) {
    qualitySignals.push(`Metacritic ${params.metacriticScore}`);
  }
  
  if (params.reviewCount && params.reviewCount >= 5000) {
    const reviewK = Math.floor(params.reviewCount / 1000);
    qualitySignals.push(`${reviewK}k+ reviews`);
  }
  
  if (qualitySignals.length > 0) {
    addSection(`Community rating: ${qualitySignals.join(', ')}`);
  }
  
  // 10. FREE TO PLAY: Monetization model affects recommendations
  if (params.isFree === true) {
    addSection('Free to play');
  }
  
  // 11. CONTENT DESCRIPTORS: Mood/theme signals (violence, mature, etc.)
  if (params.contentDescriptors && charCount < maxChars - 100) {
    const descriptors = params.contentDescriptors.slice(0, 100);
    addSection(`Content: ${descriptors}`);
  }
  
  const finalText = sections.join('. ');
  
  // Fallback: If text is too short (<200 chars), duplicate key info
  if (finalText.length < 200 && params.shortDescription) {
    // Emphasize the description by repeating it
    return `${finalText}. ${params.shortDescription}`;
  }
  
  return finalText;
}

/**
 * Generate a 384-dimensional embedding vector for the given text.
 * @param text - The text to embed
 * @returns Array of 384 numbers representing the embedding
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  try {
    const pipe = await getEmbeddingPipeline();
    
    // Generate embedding
    const output = await pipe(text, { pooling: 'mean', normalize: true });
    
    // Extract the embedding array
    const embedding = Array.from(output.data as Float32Array);
    
    if (embedding.length !== 384) {
      throw new Error(`Expected 384-dimensional embedding, got ${embedding.length}`);
    }
    
    return embedding;
  } catch (error) {
    throw new Error(`Embedding generation failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Generate embedding from comprehensive game metadata.
 * 
 * This function accepts rich metadata from Steam API and constructs
 * an optimized text representation for semantic similarity matching.
 * 
 * @param params - Comprehensive game metadata
 * @returns 384-dimensional embedding vector (MiniLM-L6-v2)
 */
export async function generateGameEmbedding(params: {
  name: string;
  shortDescription?: string;
  detailedDescription?: string;
  aboutTheGame?: string;
  genres?: string[];
  categories?: string[];
  developers?: string[];
  publishers?: string[];
  releaseYear?: number;
  reviewCount?: number;
  reviewPositivePct?: number; // 0-100
  metacriticScore?: number; // 0-100
  isFree?: boolean;
  tags?: string[]; // User-generated tags (from Steam Spy if available)
  contentDescriptors?: string; // Content warnings/themes
}): Promise<number[]> {
  const text = createEmbeddingText(params);
  
  // Log embedding text length for monitoring
  if (text.length > 2000) {
    console.warn(`Embedding text for "${params.name}" is ${text.length} chars (may be truncated)`);
  }
  
  return generateEmbedding(text);
}

/**
 * Preload the embedding model (optional, for warming up).
 * Call this on server startup to avoid first-request latency.
 */
export async function preloadEmbeddingModel(): Promise<void> {
  await getEmbeddingPipeline();
}
