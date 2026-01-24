# Claude Project Context

## Project Overview
**my-steam-recs** is a Next.js application that provides Steam game recommendations using vector embeddings and semantic search. The app ingests Steam game data, generates embeddings using Xenova transformers, and stores them in a PostgreSQL database with pgvector for similarity-based recommendations.

## Tech Stack
- **Frontend**: Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS
- **Backend**: Next.js API routes
- **Database**: PostgreSQL with pgvector extension
- **ORM**: Prisma (with driver adapters for edge compatibility)
- **ML/AI**: OpenAI text-embedding-3-small for generating 1536-dimensional embeddings
- **Data Source**: Steam API

## Project Structure
```
my-steam-recs/
├── app/                 # Next.js app directory
│   ├── layout.tsx      # Root layout
│   └── page.tsx        # Main page
├── components/         # React components
├── lib/                # Core utilities and services
│   ├── steam-api.ts    # Steam API integration
│   ├── steam-ingest.ts # Game data ingestion logic
│   ├── embeddings.ts   # Embedding generation
│   ├── vector-db.ts    # Vector database operations
│   └── prisma.ts       # Prisma client setup
├── prisma/
│   └── schema.prisma   # Database schema
├── scripts/
│   └── ingest-games.ts # Data ingestion script
└── public/             # Static assets
```

## Database Schema
The `Game` model stores:
- Basic info: `appId`, `name`, `type`
- Metrics: `reviewPositivePct`, `reviewCount`, `metacriticScore`, `releaseYear`
- Filtering: `isFree`
- Full metadata: `metadata` (JSONB for flexibility)
- **Vector embedding**: 1536-dimensional vector for semantic search

Indexes on: `releaseYear`, `reviewPositivePct`, `isFree`, `type`

## Key Features & Architecture
1. **Data Ingestion**: Scripts fetch game data from Steam API and process it
2. **Embedding Generation**: Game descriptions/metadata converted to 1536-dim vectors using transformers
3. **Vector Search**: pgvector extension enables similarity search for recommendations
4. **Filtering**: Structured fields allow filtering by review score, release date, price, etc.

## Development Commands
```bash
npm run dev      # Start development server (port 3000)
npm run build    # Production build
npm run lint     # Run ESLint
npx tsx scripts/ingest-games.ts  # Ingest game data
npx prisma studio               # Open Prisma Studio
npx prisma migrate dev          # Run database migrations
```

## Environment Variables
Required in `.env`:
- `DATABASE_URL`: PostgreSQL connection string with pgvector support

## Important Considerations

### When Working on This Project:
1. **Vector Operations**: The `embedding` field is `vector(1536)` - ensure pgvector extension is enabled in Postgres
2. **Prisma Type Safety**: The `embedding` field is `Unsupported()` in Prisma, so raw SQL may be needed for vector operations
3. **Edge Compatibility**: Uses Prisma driver adapters for potential edge deployment
4. **Large Data**: Steam has thousands of games - pagination and efficient queries are important
5. **API Rate Limits**: Steam API has rate limits - implement backoff/retry logic
6. **Embedding Generation**: Running transformers can be CPU-intensive - consider batching

### Code Patterns to Follow:
- Use TypeScript strict mode
- Leverage Next.js 16 App Router patterns (Server Components by default)
- Keep database logic in `lib/` utilities
- Use Prisma for type-safe database access where possible
- Handle errors gracefully (API failures, missing data, etc.)

### Testing & Validation:
- Test vector similarity queries with various inputs
- Validate embedding dimensions (must be 1536)
- Check game data quality after ingestion
- Verify filters work correctly with indexed fields

## Common Tasks

### Adding New Game Metadata Fields:
1. Update `schema.prisma` (either as column or in JSONB `metadata`)
2. Run `npx prisma migrate dev`
3. Update ingestion logic in `lib/steam-ingest.ts`
4. Update TypeScript types as needed

### Modifying Recommendation Algorithm:
- Vector similarity logic likely in `lib/vector-db.ts`
- Consider hybrid approaches (vector + filtering)
- May need raw SQL for complex pgvector queries

### Performance Optimization:
- Add indexes for new query patterns
- Use database query explain plans
- Consider caching for popular searches
- Batch embedding generation

## Useful Context for AI Assistants

### When Debugging:
- Check database connection and pgvector extension
- Verify embedding dimensions match schema (1536)
- Look for Steam API rate limiting or malformed responses
- Check Prisma query logs for performance issues

### When Adding Features:
- Consider both vector similarity and metadata filtering
- Think about edge cases (games with no reviews, missing data, etc.)
- Maintain type safety through TypeScript
- Follow Next.js best practices for data fetching

### When Refactoring:
- Keep embedding generation and storage separate concerns
- Maintain clear boundaries between Steam API, database, and frontend
- Preserve type safety across the stack
- Document any changes to vector search logic
