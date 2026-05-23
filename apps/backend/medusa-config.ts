import { loadEnv, defineConfig } from '@medusajs/framework/utils'

loadEnv(process.env.NODE_ENV || 'development', process.cwd())

module.exports = defineConfig({
  projectConfig: {
    databaseUrl: process.env.DATABASE_URL,
    // Sprint 6 (D1): REDIS_URL wurde bislang im Code (.env, ci.yml) gesetzt,
    // aber NICHT an Medusa durchgereicht — Backend lief mit "fake redis"
    // (siehe Sprint-5-Backend-Log "redisUrl not found"). Damit Event-Bus +
    // Locking + Workflow-Engine real ueber Redis laufen und unser /health
    // tatsaechlich Redis prueft, muss redisUrl hier explizit gemappt sein.
    redisUrl: process.env.REDIS_URL,
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
