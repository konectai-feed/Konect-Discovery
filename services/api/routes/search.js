'use strict'

const { randomUUID } = require('node:crypto')

module.exports = async function (fastify, opts) {
  fastify.get('/search', async (request, reply) => {
    const requestId = randomUUID()
    const { q, category, limit = 20, offset = 0 } = request.query

    if (!fastify.supabase) {
      return reply.status(503).send({
        error: 'Search failed',
        reason: 'Database not configured — SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY missing on Render',
        requestId
      })
    }

    try {
      let query = fastify.supabase
        .from('v_business_search')
        .select('*', { count: 'exact' })

      if (q && q.trim()) {
        const searchTerm = q.trim().toLowerCase()
        query = query.or(
          `name.ilike.%${searchTerm}%,category.ilike.%${searchTerm}%,city.ilike.%${searchTerm}%`
        )
      }

      if (category && category.trim()) {
        query = query.ilike('category', `%${category.trim()}%`)
      }

      query = query
        .order('konect_rank', { ascending: false, nullsFirst: false })
        .order('trust_score', { ascending: false, nullsFirst: false })
        .order('name', { ascending: true })

      const limitNum = Math.min(Math.max(1, parseInt(limit) || 20), 100)
      const offsetNum = Math.max(0, parseInt(offset) || 0)
      query = query.range(offsetNum, offsetNum + limitNum - 1)

      const { data, error, count } = await query

      if (error) {
        fastify.log.error({ err: error, requestId }, '[search] Supabase query error')

        const isNetworkError = Boolean(
          error.message && (
            error.message.includes('ENOTFOUND') ||
            error.message.includes('ECONNREFUSED') ||
            error.message.includes('fetch failed') ||
            error.message.includes('network')
          )
        )

        const status = isNetworkError ? 502 : 500
        const reason = isNetworkError
          ? `Supabase unreachable (${fastify.supabaseHost}) — DNS or network error. ` +
            'Verify SUPABASE_URL on Render matches your project ref in the Supabase dashboard.'
          : 'Supabase query returned an error'

        return reply.status(status).send({ error: 'Search failed', reason, requestId })
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
      fastify.log.error({ err, requestId }, '[search] Unexpected error')

      const isNetworkError = Boolean(
        err.message && (
          err.message.includes('ENOTFOUND') ||
          err.message.includes('ECONNREFUSED') ||
          err.message.includes('fetch failed')
        )
      )

      const status = isNetworkError ? 502 : 500
      const reason = isNetworkError
        ? `Supabase unreachable (${fastify.supabaseHost}) — DNS or network error. ` +
          'Verify SUPABASE_URL on Render matches your project ref in the Supabase dashboard.'
        : 'Unexpected internal error'

      return reply.status(status).send({ error: 'Search failed', reason, requestId })
    }
  })
}
