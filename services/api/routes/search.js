'use strict'

module.exports = async function (fastify, opts) {
  fastify.get('/search', async (request, reply) => {
    const { q, category, limit = 20, offset = 0 } = request.query

    if (!fastify.supabase) {
      return reply.status(503).send({ error: 'Database not configured' })
    }

    try {
      let query = fastify.supabase
        .from('v_business_search')
        .select('*', { count: 'exact' })

      // Apply text search filter if query provided
      if (q && q.trim()) {
        const searchTerm = q.trim().toLowerCase()
        query = query.or(`name.ilike.%${searchTerm}%,category.ilike.%${searchTerm}%,city.ilike.%${searchTerm}%`)
      }

      // Apply category filter if provided
      if (category && category.trim()) {
        query = query.ilike('category', `%${category.trim()}%`)
      }

      // Order by konect_rank DESC, trust_score DESC, name ASC
      query = query
        .order('konect_rank', { ascending: false, nullsFirst: false })
        .order('trust_score', { ascending: false, nullsFirst: false })
        .order('name', { ascending: true })

      // Apply pagination
      const limitNum = Math.min(Math.max(1, parseInt(limit) || 20), 100)
      const offsetNum = Math.max(0, parseInt(offset) || 0)
      query = query.range(offsetNum, offsetNum + limitNum - 1)

      const { data, error, count } = await query

      if (error) {
        fastify.log.error(error)
        return reply.status(500).send({ error: 'Search failed' })
      }

      return {
        results: data || [],
        meta: {
          total: count || 0,
          limit: limitNum,
          offset: offsetNum
        }
      }
    } catch (err) {
      fastify.log.error(err)
      return reply.status(500).send({ error: 'Internal server error' })
    }
  })
}
