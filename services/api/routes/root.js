export default async function routes (fastify) {
  fastify.register(async function (instance) {
    instance.get('/', async () => {
      return { status: 'ok' }
    })
  }, { prefix: '/api' })
}
