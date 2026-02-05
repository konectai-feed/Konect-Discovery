'use strict'

module.exports = async function (fastify, opts) {
  fastify.post('/engagement', async (request, reply) => {
    if (!fastify.supabase) {
      return reply.status(503).send({ error: 'Database not configured' })
    }

    const { business_id, event_type, session_id, metadata } = request.body || {}

    if (!business_id || !event_type) {
      return reply.status(400).send({ error: 'Missing required fields: business_id, event_type' })
    }

    // Validate event_type
    const validEventTypes = ['view', 'click', 'call', 'website', 'book', 'share', 'save']
    if (!validEventTypes.includes(event_type)) {
      return reply.status(400).send({
        error: `Invalid event_type. Must be one of: ${validEventTypes.join(', ')}`
      })
    }

    try {
      const { data, error } = await fastify.supabase
        .from('engagement_events')
        .insert({
          business_id,
          event_type,
          session_id: session_id || null,
          metadata: metadata || null,
          created_at: new Date().toISOString()
        })
        .select()
        .single()

      if (error) {
        fastify.log.error(error)
        return reply.status(500).send({ error: 'Failed to record engagement' })
      }

      return { success: true, event_id: data?.id }
    } catch (err) {
      fastify.log.error(err)
      return reply.status(500).send({ error: 'Internal server error' })
    }
  })
}
