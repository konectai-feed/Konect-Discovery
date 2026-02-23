'use strict'

/**
 * GET /debug/env
 * Requires header: x-admin-token: <ADMIN_TOKEN>
 * Returns only booleans and safe non-secret values — never leaks credentials.
 */
module.exports = async function (fastify, opts) {
  fastify.get('/env', async (request, reply) => {
    const adminToken = process.env.ADMIN_TOKEN
    const providedToken = request.headers['x-admin-token']

    if (!adminToken) {
      return reply.status(503).send({
        error: 'Debug endpoint not configured',
        reason: 'Set ADMIN_TOKEN env var on Render to enable this endpoint'
      })
    }

    if (!providedToken || providedToken !== adminToken) {
      return reply.status(401).send({ error: 'Unauthorized — provide x-admin-token header' })
    }

    return {
      hasSupabaseUrl: Boolean(process.env.SUPABASE_URL),
      hasServiceRoleKey: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
      hasAdminToken: Boolean(process.env.ADMIN_TOKEN),
      supabaseHost: fastify.supabaseHost || null
    }
  })
}
