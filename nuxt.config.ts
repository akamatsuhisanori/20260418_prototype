// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: "2024-09-01",
  devtools: { enabled: true },
  ssr: true,
  typescript: { strict: true, shim: false },

  modules: ["@nuxtjs/supabase"],

  supabase: {
    // @nuxtjs/supabase picks up SUPABASE_URL / SUPABASE_KEY (anon) from env
    redirectOptions: {
      login: "/login",
      callback: "/confirm",
      exclude: ["/login", "/confirm"],
    },
    // Cookie-based SSR session — default
    cookieRedirect: false,
  },

  runtimeConfig: {
    // server-only; NEVER expose to client
    supabaseServiceRoleKey: "", // set via SUPABASE_SERVICE_ROLE_KEY in Vercel env
    adminEmail: "", // set via ADMIN_EMAIL — this account becomes admin on first login
    public: {
      appName: "Re:roots",
    },
  },

  app: {
    head: {
      title: "Re:roots",
      meta: [
        { charset: "utf-8" },
        { name: "viewport", content: "width=device-width, initial-scale=1" },
      ],
    },
  },

  css: ["~/assets/css/main.css"],
});
