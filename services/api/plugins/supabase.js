'use strict'

const fp = require('fastify-plugin')
const { createClient } = require('@supabase/supabase-js')

/**
 * Supabase client plugin
 * Requires SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY env vars.
 * Decorates fastify with `supabase` (client or null) and `supabaseHost` (string or null).
 */
module.exports = fp(async function (fastify, opts) {
  const supabaseUrl = process.env.SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    const missing = [
      !supabaseUrl && 'SUPABASE_URL',
      !supabaseServiceKey && 'SUPABASE_SERVICE_ROLE_KEY'
    ].filter(Boolean).join(', ')
    fastify.log.error(
      `[supabase] FATAL: Missing required env vars: ${missing}. ` +
      '/search and /engagement will return 503 until these are set on Render.'
    )
    fastify.decorate('supabase', null)
    fastify.decorate('supabaseHost', null)
    return
  }

  let supabaseHost
  try {
    supabaseHost = new URL(supabaseUrl).host
  } catch {
    fastify.log.error(
      `[supabase] FATAL: SUPABASE_URL is not a valid URL: "${supabaseUrl}". ` +
      'Check for typos or missing https:// prefix.'
    )
    fastify.decorate('supabase', null)
    fastify.decorate('supabaseHost', null)
    return
  }

  const keyTail = supabaseServiceKey.slice(-6)
  fastify.log.info(
    `[supabase] Initializing client — host: ${supabaseHost}, key tail: ...${keyTail}`
  )

  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })

  fastify.decorate('supabase', supabase)
  fastify.decorate('supabaseHost', supabaseHost)
})
