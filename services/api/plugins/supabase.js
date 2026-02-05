'use strict'

const fp = require('fastify-plugin')
const { createClient } = require('@supabase/supabase-js')

/**
 * Supabase client plugin
 * Requires SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY env vars
 */
module.exports = fp(async function (fastify, opts) {
  const supabaseUrl = process.env.SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    fastify.log.warn('Supabase credentials not configured - some features may not work')
    fastify.decorate('supabase', null)
    return
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })

  fastify.decorate('supabase', supabase)
})
