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
 * Generate embedding text from game metadata.
 */
export function createEmbeddingText(params: {
  name: string;
  description?: string;
  genres?: string[];
}): string {
  const { name, description, genres } = params;
  
  const parts = [name];
  
  if (description) {
    parts.push(description);
  }
  
  if (genres && genres.length > 0) {
    parts.push(`Genres: ${genres.join(', ')}`);
  }
  
  return parts.join('. ');
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
 * Generate embedding from game metadata.
 */
export async function generateGameEmbedding(params: {
  name: string;
  description?: string;
  genres?: string[];
}): Promise<number[]> {
  const text = createEmbeddingText(params);
  return generateEmbedding(text);
}

/**
 * Preload the embedding model (optional, for warming up).
 * Call this on server startup to avoid first-request latency.
 */
export async function preloadEmbeddingModel(): Promise<void> {
  await getEmbeddingPipeline();
}
