import { loadEnv, defineConfig } from '@medusajs/framework/utils'

loadEnv(process.env.NODE_ENV || 'development', process.cwd())

module.exports = defineConfig({
  projectConfig: {
    databaseUrl: process.env.DATABASE_URL,
    http: {
      storeCors: process.env.STORE_CORS!,
      adminCors: process.env.ADMIN_CORS!,
      authCors: process.env.AUTH_CORS!,
      jwtSecret: process.env.JWT_SECRET || "supersecret",
      cookieSecret: process.env.COOKIE_SECRET || "supersecret",
    }
  },
  // CI braucht das Admin-SPA nicht — E2E-Tests gehen direkt gegen die Store-API.
  // Lokal bleibt das Admin-UI per Default an. Sprint 5: ENV-Schalter aus dem
  // Medusa-Default-Pattern (siehe @medusajs/medusa start --no-admin).
  admin: {
    disable: process.env.MEDUSA_DISABLE_ADMIN === "true",
  },
})
