'use strict'

module.exports = async function (fastify, opts) {
  // Admin authentication hook
  fastify.addHook('preHandler', async (request, reply) => {
    const adminToken = process.env.ADMIN_TOKEN
    const providedToken = request.headers['x-admin-token'] || request.headers['admin-token']

    if (!adminToken) {
      return reply.status(503).send({ error: 'Admin endpoint not configured' })
    }

    if (!providedToken || providedToken !== adminToken) {
      return reply.status(401).send({ error: 'Unauthorized' })
    }
  })

  fastify.post('/recalculate', async (request, reply) => {
    if (!fastify.supabase) {
      return reply.status(503).send({ error: 'Database not configured' })
    }

    const { business_id } = request.body || {}

    try {
      let result

      if (business_id) {
        // Recalculate for specific business
        const { data, error } = await fastify.supabase
          .rpc('recalculate_rank_for_business', { p_business_id: business_id })

        if (error) {
          fastify.log.error(error)
          return reply.status(500).send({ error: 'Recalculation failed' })
        }

        result = { recalculated: 1, business_id }
      } else {
        // Recalculate all ranks
        const { data, error } = await fastify.supabase
          .rpc('recalculate_all_ranks')

        if (error) {
          fastify.log.error(error)
          return reply.status(500).send({ error: 'Recalculation failed' })
        }

        result = { recalculated: 'all', message: 'All ranks recalculated' }
      }

      return { success: true, ...result }
    } catch (err) {
      fastify.log.error(err)
      return reply.status(500).send({ error: 'Internal server error' })
    }
  })
}
