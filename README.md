# Steam Recommendations

A personalized game recommendation engine that analyzes your Steam library to discover your next favorite game.

## Features

- **Personalized Recommendations**: Uses vector embeddings and AI to understand your gaming preferences based on your Steam library
- **Daily Discovery**: Get a new curated game pick every day tailored to your taste
- **Unplayed Gems**: Find hidden gems in your own library - games you own but haven't played that match your preferences
- **Taste DNA**: See a breakdown of your gaming personality with genre analysis and play patterns
- **Mood Quick-Match**: Filter recommendations by mood (Chill, Action, Story-Rich, etc.)
- **Deep Cuts Filter**: Toggle between popular titles and hidden indie gems

## Tech Stack

- **Frontend**: Next.js 16, React 19, TypeScript, Tailwind CSS
- **Backend**: Next.js API routes
- **Database**: PostgreSQL with pgvector extension
- **Auth**: Supabase (email/password + Google OAuth)
- **AI/ML**: OpenAI embeddings for semantic game matching
- **Payments**: Stripe (for premium features)

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL with pgvector extension
- Steam API key
- Supabase project
- (Optional) Stripe account for premium features

### Environment Variables

Create a `.env` file with:

```env
DATABASE_URL=postgresql://...
STEAM_API_KEY=your_steam_api_key
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
OPENAI_API_KEY=your_openai_key
STRIPE_SECRET_KEY=sk_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

### Installation

```bash
npm install
npx prisma migrate dev
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

## How It Works

1. **Connect Steam**: Link your Steam account (must be public)
2. **Analyze Library**: We analyze your played games to build a preference vector
3. **Get Recommendations**: Our AI finds games similar to what you love
4. **Refine Taste**: Like/dislike recommendations to improve accuracy (Premium)

## License

MIT
