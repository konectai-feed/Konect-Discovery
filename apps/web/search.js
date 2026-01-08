const fastify = require('fastify')({ logger: true });

// Sample business data (replace with actual database query)
const businesses = [
  {
    id: 1,
    name: 'Joe\'s Plumbing',
    category: 'plumber',
    rating: 4.8,
    reviewCount: 127,
    boost: 0,
    location: 'Austin, TX',
    phone: '512-555-0123'
  },
  {
    id: 2,
    name: 'Premium Plumbing Services',
    category: 'plumber',
    rating: 4.9,
    reviewCount: 45,
    boost: 1.5,
    location: 'Austin, TX',
    phone: '512-555-0124'
  },
  {
    id: 3,
    name: 'Austin Electrician Co',
    category: 'electrician',
    rating: 4.5,
    reviewCount: 89,
    boost: 0,
    location: 'Austin, TX',
    phone: '512-555-0125'
  },
  {
    id: 4,
    name: 'Quick Fix Plumbing',
    category: 'plumber',
    rating: 4.2,
    reviewCount: 312,
    boost: 0,
    location: 'Austin, TX',
    phone: '512-555-0126'
  },
  {
    id: 5,
    name: 'Elite Plumbers',
    category: 'plumber',
    rating: 5.0,
    reviewCount: 8,
    boost: 2.0,
    location: 'Austin, TX',
    phone: '512-555-0127'
  }
];

/**
 * Calculate keyword match score for a business
 * Checks name and category for keyword presence
 * @param {object} business - Business object
 * @param {string} query - Search query
 * @returns {number} Score between 0 and 1
 */
function calculateKeywordScore(business, query) {
  if (!query) return 0;

  const queryLower = query.toLowerCase();
  const nameLower = business.name.toLowerCase();
  const categoryLower = business.category.toLowerCase();

  let score = 0;

  // Exact category match: highest weight
  if (categoryLower === queryLower) {
    score += 1.0;
  }
  // Category contains query
  else if (categoryLower.includes(queryLower)) {
    score += 0.7;
  }

  // Name exact match
  if (nameLower === queryLower) {
    score += 0.8;
  }
  // Name contains query
  else if (nameLower.includes(queryLower)) {
    score += 0.5;
  }

  // Normalize to 0-1 range (max possible is 1.8, so divide by 1.8)
  return Math.min(score / 1.8, 1.0);
}

/**
 * Normalize rating to 0-1 scale (ratings are 0-5)
 * @param {number} rating - Rating value
 * @returns {number} Normalized score between 0 and 1
 */
function normalizeRating(rating) {
  return rating / 5.0;
}

/**
 * Calculate review count score using log scale
 * More reviews = more trustworthy, but with diminishing returns
 * @param {number} reviewCount - Number of reviews
 * @returns {number} Score between 0 and 1
 */
function calculateReviewScore(reviewCount) {
  if (reviewCount <= 0) return 0;

  // Log scale with base 10
  // log10(1) = 0, log10(10) ≈ 1, log10(100) = 2, log10(1000) = 3
  // Normalize by dividing by 3 (assumes max ~1000 reviews)
  const logScore = Math.log10(reviewCount + 1) / 3;
  return Math.min(logScore, 1.0);
}

/**
 * Calculate final weighted score for a business
 *
 * Formula:
 * baseScore = (keywordMatch × 0.50) + (normalizedRating × 0.30) + (reviewScore × 0.20)
 * finalScore = baseScore × (1 + boost)
 *
 * Weights:
 * - Keyword match: 50% (most important for relevance)
 * - Rating: 30% (quality indicator)
 * - Review count: 20% (trust/popularity indicator, log scale)
 *
 * Boost multiplier:
 * - boost=0: no change
 * - boost=1.0: 100% increase (2x score)
 * - boost=2.0: 200% increase (3x score)
 *
 * @param {object} business - Business object
 * @param {string} query - Search query
 * @returns {number} Final weighted score
 */
function calculateScore(business, query) {
  const keywordScore = calculateKeywordScore(business, query);
  const ratingScore = normalizeRating(business.rating);
  const reviewScore = calculateReviewScore(business.reviewCount);

  // Weighted combination
  const baseScore = (
    keywordScore * 0.50 +
    ratingScore * 0.30 +
    reviewScore * 0.20
  );

  // Apply boost multiplier for sponsored results
  const boost = business.boost || 0;
  const finalScore = baseScore * (1 + boost);

  return finalScore;
}

// Register search route
fastify.get('/search', async (request, reply) => {
  const { q } = request.query;

  if (!q || typeof q !== 'string' || q.trim().length === 0) {
    return reply.code(400).send({
      error: 'Query parameter "q" is required'
    });
  }

  const query = q.trim();

  // Calculate scores and attach to each business
  const scoredResults = businesses.map(business => ({
    ...business,
    _score: calculateScore(business, query)
  }));

  // Sort by score descending
  const sortedResults = scoredResults.sort((a, b) => b._score - a._score);

  // Filter out results with zero score (no relevance)
  const relevantResults = sortedResults.filter(result => result._score > 0);

  // Remove internal _score field before returning
  const results = relevantResults.map(({ _score, ...business }) => business);

  return { results };
});

// Start server
const start = async () => {
  try {
    await fastify.listen({ port: 3001, host: '0.0.0.0' });
    console.log('Search API listening on port 3001');
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();

module.exports = fastify;
