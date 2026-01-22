# Premium Feedback System - Implementation Plan

## Overview
Dynamic recommendation learning system with freemium model. Free users get basic recommendations, Premium users get AI that learns from thumbs up/down feedback in real-time.

---

## Pricing Tiers

### Free Tier
- Basic recommendations from playtime only
- 20 results max
- Standard filters
- No feedback loop

### Premium Tier ($5/month or $50/year)
- **Unlimited results**
- **Thumbs up/down feedback** on every recommendation
- **Real-time learning** - your preference vector adapts as you vote
- **"Never show me this"** - exclude games/franchises permanently
- **Advanced filters** - all filter options unlocked
- **Custom preference profiles** - save different moods ("relaxing", "competitive")
- **Priority support**

---

## Technical Architecture

### Database Schema

**New Table: `user_feedback`**
```sql
CREATE TABLE user_feedback (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  app_id BIGINT NOT NULL,
  feedback_type TEXT CHECK (feedback_type IN ('like', 'dislike', 'not_interested', 'love')),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, app_id)
);
```

**Updated: `user_profiles`**
- `subscription_tier` - 'free' or 'premium'
- `subscription_expires_at` - expiration timestamp
- `learned_vector` - vector(384) - dynamically updated from feedback
- `feedback_likes_count` - total likes given
- `feedback_dislikes_count` - total dislikes given

### Vector Learning Algorithm

**How it works:**

1. **Initial Vector** (playtime-based):
   ```
   preferenceVector = weighted_average(played_games)
   ```

2. **Feedback Adjustment** (PREMIUM ONLY):
   ```typescript
   // When user likes a game
   likedGameEmbedding = getGameEmbedding(appId)
   learnedVector = learnedVector + (0.1 * likedGameEmbedding)

   // When user dislikes a game
   dislikedGameEmbedding = getGameEmbedding(appId)
   learnedVector = learnedVector - (0.2 * dislikedGameEmbedding)

   // Normalize to unit vector
   learnedVector = normalize(learnedVector)
   ```

3. **Hybrid Recommendation**:
   ```typescript
   // Free users: playtime vector only
   queryVector = preferenceVector

   // Premium users: blend playtime + learned
   queryVector = 0.6 * preferenceVector + 0.4 * learnedVector
   ```

**Key Insight**:
- Dislikes have 2x weight of likes (penalize more aggressively)
- Blends learned preferences with base playtime (prevents overfitting)
- Normalizes after each update (prevents vector drift)

---

## API Endpoints

### 1. Submit Feedback (Premium Only)

**POST /api/user/feedback**

Request:
```json
{
  "userId": "clxyz123...",
  "appId": 570,
  "feedbackType": "like" // or "dislike", "not_interested", "love"
}
```

Response:
```json
{
  "success": true,
  "vectorUpdated": true,
  "newRecommendations": [...] // Optional: return updated recs immediately
}
```

### 2. Get Recommendations (Updated)

**POST /api/user/recommend**

Free tier: max 20 results, uses `preferenceVector`
Premium tier: unlimited, uses hybrid `0.6*preferenceVector + 0.4*learnedVector`

### 3. Check Subscription Status

**GET /api/user/subscription/:userId**

Response:
```json
{
  "tier": "premium",
  "expiresAt": "2026-02-21T00:00:00Z",
  "daysRemaining": 30,
  "features": {
    "unlimitedResults": true,
    "feedbackLearning": true,
    "advancedFilters": true
  }
}
```

---

## Frontend Implementation

### 1. Game Card with Feedback Buttons

```tsx
// components/profile/GameCard.tsx
<div className="game-card">
  <img src={game.headerImage} />
  <h3>{game.name}</h3>
  <p>Similarity: {game.similarity}%</p>

  {/* PREMIUM ONLY */}
  {user.isPremium && (
    <div className="feedback-buttons">
      <button onClick={() => handleFeedback('love')}>
        ❤️ Love
      </button>
      <button onClick={() => handleFeedback('like')}>
        👍 Like
      </button>
      <button onClick={() => handleFeedback('dislike')}>
        👎 Dislike
      </button>
      <button onClick={() => handleFeedback('not_interested')}>
        🚫 Never
      </button>
    </div>
  )}

  {/* FREE TIER - UPSELL */}
  {!user.isPremium && (
    <div className="premium-cta">
      <LockIcon /> Upgrade to Premium to teach the AI your taste
    </div>
  )}
</div>
```

### 2. Real-time Learning Feedback

After user clicks thumbs up/down:
```tsx
const handleFeedback = async (type: FeedbackType) => {
  setIsLearning(true);

  await submitFeedback(userId, game.appId, type);

  // Show toast
  toast.success("✨ Learning from your feedback...");

  // Optionally re-fetch recommendations
  const newRecs = await getRecommendations(userId);
  setRecommendations(newRecs);

  setIsLearning(false);
};
```

### 3. Premium Paywall

```tsx
// components/premium/PremiumModal.tsx
<Modal>
  <h2>Unlock AI-Powered Learning</h2>
  <ul>
    <li>✅ Thumbs up/down on recommendations</li>
    <li>✅ AI learns your taste in real-time</li>
    <li>✅ Unlimited results</li>
    <li>✅ Advanced filters</li>
    <li>✅ Custom preference profiles</li>
  </ul>
  <button>Upgrade to Premium - $5/month</button>
</Modal>
```

---

## Vector Learning Example

**User Journey:**

1. **Initial State** (from playtime):
   - Plays Total War games → vector biased toward strategy
   - Gets 20 strategy recommendations

2. **User gives feedback** (Premium):
   - 👍 Likes: Civilization VI, Crusader Kings III
   - 👎 Dislikes: Total War: Warhammer III (fantasy)
   - 🚫 Never: Warhammer 40K

3. **Vector Updates:**
   ```
   learned_vector += 0.1 * embedding(Civ VI)
   learned_vector += 0.1 * embedding(CK III)
   learned_vector -= 0.2 * embedding(TW Warhammer)
   learned_vector -= 0.3 * embedding(Warhammer 40K) // stronger penalty for "never"
   ```

4. **New Recommendations**:
   - More: Europa Universalis, Hearts of Iron (grand strategy, not Warhammer)
   - Less: Warhammer games (penalized)

**Result**: AI learns user likes grand strategy but NOT fantasy settings.

---

## Implementation Steps

### Phase 1: Database (30 min)
1. Run migration: `npx prisma migrate dev`
2. Update Prisma client: `npx prisma generate`
3. Test schema changes

### Phase 2: Backend API (2 hours)
1. Create `app/api/user/feedback/route.ts`
   - Validate premium tier
   - Save feedback to database
   - Update `learned_vector` using vector math
   - Return success

2. Update `app/api/user/recommend/route.ts`
   - Check tier: free = 20 max, premium = unlimited
   - Use hybrid vector for premium users
   - Exclude "not_interested" games

3. Create `lib/vector-learning.ts`
   - `updateLearnedVector()` - applies feedback to vector
   - `calculateHybridVector()` - blends preference + learned
   - `normalize()` - prevents vector drift

### Phase 3: Frontend (3 hours)
1. Add subscription context: `contexts/SubscriptionContext.tsx`
2. Update GameCard with feedback buttons
3. Create Premium modal/paywall
4. Add real-time feedback toasts
5. Show feedback history

### Phase 4: Payment Integration (Stripe) (4 hours)
1. Setup Stripe
2. Create checkout session
3. Handle webhooks for subscription events
4. Update subscription status in database

---

## Subscription Management

### Stripe Integration

```typescript
// lib/stripe.ts
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function createCheckoutSession(userId: string) {
  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [{
      price: 'price_premium_monthly', // $5/month
      quantity: 1,
    }],
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/profile?upgrade=success`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/profile`,
    client_reference_id: userId,
  });

  return session.url;
}
```

### Webhook Handler

```typescript
// app/api/webhooks/stripe/route.ts
export async function POST(req: Request) {
  const event = await stripe.webhooks.constructEvent(
    await req.text(),
    req.headers.get('stripe-signature'),
    process.env.STRIPE_WEBHOOK_SECRET
  );

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const userId = session.client_reference_id;

    // Upgrade user to premium
    await prisma.userProfile.update({
      where: { id: userId },
      data: {
        subscriptionTier: 'premium',
        subscriptionExpiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    });
  }

  return new Response(JSON.stringify({ received: true }), { status: 200 });
}
```

---

## Monetization Strategy

### Pricing
- **Monthly**: $5/month (best for testing)
- **Annual**: $50/year (save $10, 17% discount)

### Value Proposition
- "Teach the AI your exact taste"
- "Get smarter recommendations every time you vote"
- "No more Warhammer games if you don't like fantasy"

### Conversion Funnels
1. Free user sees 20 recommendations
2. Clicks "Load More" → Premium paywall
3. Tries to thumbs up/down → Premium feature modal
4. Sees "✨ Premium users get 3x better recommendations" banner

### Target: 5% Conversion
- 1000 users → 50 premium subscribers
- 50 * $5 = $250/month recurring revenue

---

## Testing Plan

1. **Unit Tests**:
   - Vector math (normalize, add, subtract)
   - Feedback weighting (like = +0.1, dislike = -0.2)

2. **Integration Tests**:
   - Submit feedback → vector updates
   - Hybrid vector calculation
   - Free tier limits enforced

3. **User Testing**:
   - Does AI actually learn?
   - Are recommendations improving?
   - Is paywall clear but not annoying?

---

## Future Enhancements

1. **Explicit Genre Preferences**
   - "I love roguelikes" → boost all roguelike games
   - "I hate horror" → filter out horror

2. **Collaborative Filtering**
   - "Users who liked X also loved Y"
   - Blend with vector similarity

3. **Temporal Preferences**
   - "Show me relaxing games" (evening profile)
   - "Show me competitive games" (weekend profile)

4. **Social Features**
   - Share your taste profile
   - Compare with friends
   - "You'd love this game - 95% match"

---

## Summary

**What You're Building:**
- Free tier: Basic vector-based recommendations
- Premium tier: AI that learns from every thumbs up/down
- Real-time vector updates using feedback
- Stripe subscription management

**Revenue Model:**
- $5/month or $50/year
- Target 5% conversion
- Recurring revenue potential

**Key Differentiator:**
- "Netflix-style learning, but for games"
- "The more you vote, the smarter it gets"
- Solves the Warhammer problem: user can explicitly tell AI "no fantasy"

Ready to implement? Start with Phase 1 (database migration) and I'll guide you through each step!
