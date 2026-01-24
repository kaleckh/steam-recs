// Plans config - safe for client-side import
export const PLANS = {
  free: {
    name: 'Free',
    price: 0,
    features: [
      'Basic recommendations',
      'AI Search (5/day)',
      'View your library',
    ],
  },
  premium: {
    name: 'Pro',
    monthlyPrice: 5,
    yearlyPrice: 40,
    features: [
      'Unlimited AI Search',
      'Advanced Analytics',
      'Personalized learning algorithm',
      'Priority recommendations',
      'Export capabilities',
    ],
  },
};
