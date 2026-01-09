'use strict'

module.exports = async function (fastify, opts) {
  fastify.get('/search', async (request, reply) => {
    const { q } = request.query

    if (!q) {
      return []
    }

    // Mock data - in production this would come from a database
    const results = [
      {
        name: 'Reflections Med Spa',
        category: 'Med Spa',
        city: 'Dallas, TX',
        rating: 4.8,
        reviews: 312,
        score: 98,
        sponsoredBoost: 1.2, // optional sponsored boost
        vertical: 'healthcare'
      },
      {
        name: 'Elite Tax Advisors',
        category: 'Accounting',
        city: 'Plano, TX',
        rating: 4.6,
        reviews: 198,
        score: 87,
        vertical: 'professional-services'
      },
      {
        name: 'Prime HVAC Services',
        category: 'HVAC',
        city: 'Frisco, TX',
        rating: 4.9,
        reviews: 421,
        score: 92,
        vertical: 'home-services'
      }
    ]

    // Normalize query
    const queryLower = q.toLowerCase().trim()
    
    // ===== V3 Intent Detection =====
    const detectIntentV3 = (query) => {
      const intentPatterns = {
        healthcare: ['med', 'spa', 'medical', 'clinic', 'doctor', 'health', 'wellness', 'therapy', 'massage', 'cosmetic'],
        'professional-services': ['tax', 'accounting', 'lawyer', 'attorney', 'consultant', 'advisor', 'cpa', 'legal', 'financial'],
        'home-services': ['hvac', 'plumbing', 'electrical', 'repair', 'renovation', 'contractor', 'heating', 'cooling', 'ac'],
        'food-beverage': ['restaurant', 'cafe', 'bar', 'food', 'dining', 'catering', 'pizza', 'sushi'],
        retail: ['shop', 'store', 'boutique', 'market', 'mall', 'outlet']
      }
      
      const detectedIntents = []
      const queryTokens = query.split(/\s+/)
      
      for (const [vertical, keywords] of Object.entries(intentPatterns)) {
        for (const keyword of keywords) {
          // Check both full query and individual tokens for better matching
          if (query.includes(keyword) || queryTokens.some(token => token === keyword)) {
            if (!detectedIntents.includes(vertical)) {
              detectedIntents.push(vertical)
            }
          }
        }
      }
      
      return detectedIntents
    }
    
    const detectedIntents = detectIntentV3(queryLower)
    
    // Calculate weighted score for each result
    const scoredResults = results.map(result => {
      // 1. Keyword match score (0-1)
      const nameLower = result.name.toLowerCase()
      const categoryLower = result.category.toLowerCase()
      
      const nameMatch = nameLower.includes(queryLower) ? 1 : 0
      const categoryMatch = categoryLower.includes(queryLower) ? 1 : 0
      
      // Weighted: name match is more important than category
      const keywordScore = nameMatch * 0.7 + categoryMatch * 0.3
      
      // 2. Rating score (0-1, normalized from 0-5 scale)
      const ratingScore = result.rating / 5
      
      // 3. Review count score (log scale, normalized)
      // Log10: 1 review -> 0, 10 -> 0.33, 100 -> 0.67, 1000+ -> 1.0
      const reviewScore = Math.min(1, Math.log10(Math.max(1, result.reviews)) / 3)
      
      // 4. Sponsored boost multiplier (default 1.0)
      const sponsoredBoost = result.sponsoredBoost || 1.0
      
      // Calculate final weighted score
      const baseScore = (
        keywordScore * 0.4 +    // 40% keyword relevance
        ratingScore * 0.3 +      // 30% rating quality
        reviewScore * 0.3        // 30% review popularity
      )
      
      // 5. Category intent boost (V2 - PRESERVED)
      let intentBoost = 1.0
      if (queryLower.includes('med') && result.category.toLowerCase().includes('med')) {
        intentBoost += 0.15
      }
      if (queryLower.includes('spa') && result.category.toLowerCase().includes('spa')) {
        intentBoost += 0.1
      }

      // 6. City relevance boost (V2 - PRESERVED)
      let geoBoost = 1.0
      if (result.city.toLowerCase().includes('dallas')) {
        geoBoost += 0.1
      }

      // ===== 7. V3 Intent Boost (NEW) =====
      let v3IntentBoost = 1.0
      if (detectedIntents.length > 0 && result.vertical) {
        if (detectedIntents.includes(result.vertical)) {
          v3IntentBoost += 0.25 // Strong boost for vertical match
        }
      }
      
      // ===== 8. Vertical Relevance Boost (NEW) =====
      let verticalBoost = 1.0
      if (result.vertical) {
        // Vertical-specific query signals that indicate strong intent
        const verticalSignals = {
          healthcare: ['near me', 'best', 'top rated', 'appointment', 'booking', 'open now'],
          'professional-services': ['certified', 'licensed', 'expert', 'consultation', 'free quote'],
          'home-services': ['emergency', '24/7', 'repair', 'service', 'same day', 'available']
        }
        
        if (verticalSignals[result.vertical]) {
          for (const signal of verticalSignals[result.vertical]) {
            if (queryLower.includes(signal)) {
              verticalBoost += 0.15
              break // Only apply once per result
            }
          }
        }
        // ===== 9. LLM Relevance Placeholder (NO API CALL YET) =====
let llmRelevanceBoost = 1.0

// Placeholder: future semantic / intent confidence
// Example signals the LLM will later provide:
// - transactional intent
// - service urgency
// - comparison intent
// - booking likelihood

// TEMP: soft boost for strong intent words
const llmIntentSignals = ['best', 'top', 'near me', 'open now', 'book', 'appointment']

for (const signal of llmIntentSignals) {
  if (queryLower.includes(signal)) {
    llmRelevanceBoost += 0.1
    break
  }
}

        // Additional vertical relevance: exact vertical keyword match
        const verticalKeywords = {
          healthcare: ['healthcare', 'medical', 'health'],
          'professional-services': ['professional', 'services', 'business'],
          'home-services': ['home', 'house', 'residential']
        }
        
        if (verticalKeywords[result.vertical]) {
          for (const keyword of verticalKeywords[result.vertical]) {
            if (queryLower.includes(keyword)) {
              verticalBoost += 0.1
              break
            }
          }
        }
      }

      // Final weighted score (V2 + V3)
      const finalScore = baseScore * sponsoredBoost * intentBoost * geoBoost * v3IntentBoost * verticalBoost
      
      return {
        ...result,
        finalScore,
        _rank: {
          keywordScore,
          ratingScore,
          reviewScore,
          sponsoredBoost,
          intentBoost, // V2
          geoBoost, // V2
          v3IntentBoost, // V3 NEW
          verticalBoost // V3 NEW
        },
        _debug: {
          detectedIntents: detectedIntents.length > 0 ? detectedIntents : undefined
        }
      }
    })
    
    // Sort by final score descending
    scoredResults.sort((a, b) => b.finalScore - a.finalScore)
    
    return scoredResults
  })
}
