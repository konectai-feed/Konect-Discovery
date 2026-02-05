'use strict'

module.exports = async function (fastify, opts) {
  fastify.get('/health', async (request, reply) => {
    return { ok: true }
  })
}
