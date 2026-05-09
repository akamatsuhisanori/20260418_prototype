// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: "2024-09-01",
  devtools: { enabled: true },
  ssr: true,
  typescript: { strict: true, shim: false },

  modules: ["@nuxtjs/supabase"],

  // Flatten component auto-import so <Step0 /> / <ProgressBar /> work
  // without the folder-name prefix (StepsStep0 / BaseProgressBar).
  components: [{ path: "~/components", pathPrefix: false }],

  supabase: {
    // @nuxtjs/supabase picks up SUPABASE_URL / SUPABASE_KEY (anon) from env
    redirectOptions: {
      login: "/login",
      callback: "/confirm",
      exclude: ["/login", "/confirm", "/assessment/*", "/assessment/**"],
    },
    // Cookie-based SSR session — default
    cookieRedirect: false,
  },

  runtimeConfig: {
    // server-only; NEVER expose to client
    supabaseServiceRoleKey: "", // set via SUPABASE_SERVICE_ROLE_KEY in Vercel env
    adminEmail: "", // set via ADMIN_EMAIL — this account becomes admin on first login
    public: {
      appName: "過去組織での経験を用いた自己理解支援ワーク",
      // 完了画面で誘導する振り返りアンケート（Google フォーム）の URL。
      // Vercel 側で NUXT_PUBLIC_SURVEY_URL を設定。
      surveyUrl: "",
    },
  },

  app: {
    head: {
      title: "過去組織での経験を用いた自己理解支援ワーク",
      meta: [
        { charset: "utf-8" },
        { name: "viewport", content: "width=device-width, initial-scale=1" },
      ],
    },
  },

  css: ["~/assets/css/main.css"],
});
