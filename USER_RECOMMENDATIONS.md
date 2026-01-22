# User-Based Recommendations

## Overview

This system generates **highly accurate, personalized game recommendations** by analyzing a user's Steam library and playtime patterns.

### Key Features

- **Playtime-Weighted Recommendations**: Games you've played more heavily influence your recommendations
- **Recency Awareness**: Recent games matter more than games from years ago
- **Quality Signals**: Completion rates and achievements improve accuracy
- **Genre Diversity**: Prevents single-genre dominance in recommendations
- **Privacy-Focused**: All processing happens on your server

---

## How It Works

### 1. Algorithm Breakdown

The system generates a **personalized 384-dimensional preference vector** by:

1. **Fetching your Steam library** via Steam Web API
2. **Calculating sophisticated weights** for each game based on:
   - **Playtime** (logarithmic scaling: 10-50 hours = sweet spot)
   - **Recency** (games played recently = current taste)
   - **Quality** (completion %, achievements earned)
   - **Genre diversity** (prevents FPS-only recommendations if you play 10 FPS games)

3. **Generating weighted average** of all game embeddings
4. **Finding similar games** using vector similarity search

### 2. Weighting Philosophy

| Playtime | Weight | Meaning |
|----------|--------|---------|
| < 2 hours | 0.1-0.5 | Minimal signal (tried it, didn't like) |
| 2-10 hours | 0.5-1.0 | Some interest |
| 10-50 hours | 1.0-1.8 | **Strong interest** (most important) |
| 50-200 hours | 2.0-2.5 | Deep engagement |
| 200+ hours | 2.5-2.8 | Obsessed (capped to prevent dominance) |

**Recency decay**: Games from 2 years ago have 50% weight of recent games.

---

## Setup

### 1. Get Steam API Key

1. Visit https://steamcommunity.com/dev/apikey
2. Register for a free API key
3. Add to `.env`:

```bash
STEAM_API_KEY=your_key_here
```

### 2. Run Database Migration

```bash
npx prisma migrate dev --name add_user_profiles
```

This creates:
- `user_profiles` table (stores preference vectors)
- `user_games` table (stores playtime data)

### 3. Enable pgvector Extension (if not already enabled)

```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

---

## API Usage

### Step 1: Import User's Steam Library

**Endpoint**: `POST /api/user/ingest`

```bash
curl -X POST http://localhost:3000/api/user/ingest \
  -H "Content-Type: application/json" \
  -d '{
    "steamInput": "76561197960287930",
    "options": {
      "fetchAchievements": false,
      "recencyDecayMonths": 24,
      "enableGenreDiversification": true,
      "minPlaytimeHours": 0.5
    }
  }'
```

**Steam Input Formats**:
- Steam ID: `76561197960287930`
- Profile URL: `https://steamcommunity.com/profiles/76561197960287930/`
- Vanity URL: `https://steamcommunity.com/id/gabelogannewell/`
- Just vanity name: `gabelogannewell`

**Options**:
- `fetchAchievements` (bool): Fetch achievement data for quality weighting (slower but more accurate)
- `recencyDecayMonths` (number): Half-life for recency decay (default: 24)
- `enableGenreDiversification` (bool): Normalize for genre diversity (default: true)
- `minPlaytimeHours` (number): Minimum playtime to include game (default: 0.5)

**Response**:
```json
{
  "success": true,
  "userId": "cm4abc123",
  "steamId": "76561197960287930",
  "gamesImported": 245,
  "gamesAnalyzed": 180,
  "totalPlaytimeHours": 3542,
  "message": "Successfully imported 245 games..."
}
```

---

### Step 2: Get Personalized Recommendations

**Endpoint**: `POST /api/user/recommend`

```bash
curl -X POST http://localhost:3000/api/user/recommend \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "cm4abc123",
    "limit": 20,
    "excludeOwned": true,
    "filters": {
      "minReviewScore": 80,
      "minReviewCount": 1000,
      "releaseYearMin": 2020,
      "genres": ["Action", "RPG"]
    }
  }'
```

**Parameters**:
- `userId` (required): User profile ID from ingest step
- `limit` (optional): Number of recommendations (default: 20, max: 100)
- `excludeOwned` (optional): Exclude games user already owns (default: true)
- `filters` (optional):
  - `minReviewScore`: Minimum review % (0-100)
  - `minReviewCount`: Minimum number of reviews
  - `releaseYearMin/Max`: Release year range
  - `isFree`: Filter for free-to-play games
  - `genres`: Array of genres to filter by

**Response**:
```json
{
  "success": true,
  "userId": "cm4abc123",
  "steamId": "76561197960287930",
  "gamesAnalyzed": 180,
  "lastUpdated": "2024-01-20T10:30:00Z",
  "recommendationCount": 20,
  "recommendations": [
    {
      "appId": "105600",
      "name": "Terraria",
      "similarity": 0.94,
      "distance": 0.12,
      "releaseYear": 2011,
      "reviewScore": 97,
      "reviewCount": 845000,
      "metacriticScore": 83,
      "isFree": false,
      "genres": ["Action", "Adventure", "Indie"],
      "shortDescription": "Dig, fight, explore, build!",
      "headerImage": "https://...",
      "developers": ["Re-Logic"]
    }
  ]
}
```

---

## Advanced Usage

### 1. Refresh User Profile

To update recommendations as user plays more games:

```bash
# Re-run ingest with same Steam ID
curl -X POST http://localhost:3000/api/user/ingest \
  -d '{"steamInput": "76561197960287930"}'
```

The system will:
- Update playtime for existing games
- Add newly purchased games
- Regenerate preference vector

### 2. Customize Weighting Algorithm

Edit [`lib/user-preference-vector.ts`](lib/user-preference-vector.ts) to adjust:

```typescript
// Increase recency importance (faster decay)
recencyDecayMonths: 12 // Games from 1 year ago = 50% weight

// Disable genre diversification (if you want genre-focused recs)
enableGenreDiversification: false

// Higher minimum playtime (only serious games)
minPlaytimeHours: 2.0

// Include more games in profile
maxGamesToInclude: 500
```

### 3. Quality Weighting with Achievement Data

For maximum accuracy, enable achievement fetching (slower):

```bash
curl -X POST http://localhost:3000/api/user/ingest \
  -d '{
    "steamInput": "76561197960287930",
    "options": {
      "fetchAchievements": true
    }
  }'
```

This improves accuracy by:
- Boosting completed games (1.3x weight)
- Penalizing abandoned games (0.7x weight)
- Rewarding achievement engagement (1.2x weight)

---

## Making It More Accurate

### 1. Add HowLongToBeat Completion Data

Integrate with HowLongToBeat API to get average completion times:

```typescript
// In user-preference-vector.ts
avgCompletionHours: 25 // From HLTB for this game
```

This allows the algorithm to detect:
- **Completed games** (playtime ≥ 80% of avg completion)
- **Abandoned games** (playtime < 20% of avg completion)

### 2. Upgrade to Better Embedding Model

Current: `all-MiniLM-L6-v2` (384-dim, fast but basic)

**Better options**:
- **gte-base** (768-dim): 2x better accuracy
- **e5-large-v2** (1024-dim): Best accuracy, slower

Update [`lib/embeddings.ts`](lib/embeddings.ts:27):
```typescript
const pipe = await pipeline('feature-extraction', 'Xenova/gte-base');
```

And update schema to `vector(768)`.

### 3. Add Genre/Tag Weighting

Allow users to boost specific genres:

```json
{
  "userId": "cm4abc123",
  "filters": {
    "genreBoosts": {
      "Indie": 1.5,
      "Horror": 0.5
    }
  }
}
```

### 4. Collaborative Filtering Hybrid

Combine:
- **Vector similarity** (semantic matching)
- **User-user similarity** (find users with similar playtime patterns)

---

## Performance Tips

### 1. Index Optimization

Ensure HNSW index exists on `games.embedding`:

```sql
CREATE INDEX IF NOT EXISTS games_embedding_idx
ON games USING hnsw (embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 64);
```

### 2. Caching User Vectors

User preference vectors are cached in `user_profiles.preference_vector`.

Only regenerate when:
- User adds significant playtime (>10 hours)
- User requests manual refresh
- More than 1 month has passed

### 3. Batch Processing

For multiple users, use transactions:

```typescript
await prisma.$transaction([...updates]);
```

---

## Marketing This as "AI-Powered"

### What Makes This AI?

1. **Deep Learning Embeddings**: 384-dimensional neural network representations
2. **Semantic Understanding**: AI understands game themes, not just keywords
3. **Intelligent Weighting**: Sophisticated playtime/recency algorithms
4. **Continuous Learning**: Updates as user's taste evolves

### Marketing Copy Examples

> "Our AI analyzes your 500+ hours in Dark Souls and understands you love challenging combat, dark fantasy themes, and intricate level design—not just 'action RPG'"

> "Advanced machine learning generates a unique 384-dimensional taste profile from your entire Steam library"

> "AI-powered recency weighting: Your gaming preferences from last month matter more than games from 5 years ago"

### Future AI Enhancements

1. **LLM Explanations**: Add Claude/GPT to explain WHY each game is recommended
2. **Natural Language Search**: "Show me cozy farming sims with romance"
3. **Multi-Modal**: Analyze game screenshots for visual similarity
4. **Sentiment Analysis**: Parse Steam reviews for preference signals

---

## Troubleshooting

### "Profile is private" Error

User must set Steam profile to Public:
1. Visit Steam → Profile → Edit Profile → Privacy Settings
2. Set "Game details" to Public

### "No games with embeddings found"

Your game database is missing embeddings. Run ingestion:

```bash
npx tsx scripts/ingest-games.ts
```

### Recommendations Seem Generic

Possible causes:
1. User has <10 hours in most games → increase `minPlaytimeHours`
2. Too much genre diversity → disable `enableGenreDiversification`
3. Need better embeddings → upgrade to `gte-base` (768-dim)

### Slow Performance

1. Check if HNSW index exists on embeddings
2. Reduce `limit` parameter (<50)
3. Disable `fetchAchievements` option
4. Add `maxGamesToInclude` limit (default: 200)

---

## Next Steps

1. **Run migration**: `npx prisma migrate dev`
2. **Add Steam API key** to `.env`
3. **Test with your Steam profile**:
   ```bash
   curl -X POST http://localhost:3000/api/user/ingest \
     -d '{"steamInput": "YOUR_STEAM_ID"}'
   ```
4. **Get recommendations**:
   ```bash
   curl -X POST http://localhost:3000/api/user/recommend \
     -d '{"userId": "USER_ID_FROM_PREVIOUS_STEP"}'
   ```

---

## Questions?

- Algorithm details: See [`lib/user-preference-vector.ts`](lib/user-preference-vector.ts)
- Steam API docs: https://developer.valvesoftware.com/wiki/Steam_Web_API
- pgvector docs: https://github.com/pgvector/pgvector
