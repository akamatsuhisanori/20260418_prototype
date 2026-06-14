<script setup lang="ts">
// ============================================================
// /emergency-login
//   PKCE 環境で action_link が使えない場合の救済ページ。
//   /api/admin/auth/emergency-link が返す email_otp を使い、
//   verifyOtp() で直接セッションを成立させる。
//
//   使い方:
//     /emergency-login?email=foo@example.com&otp=123456
// ============================================================
definePageMeta({ layout: false });

const route = useRoute();
const supabase = useSupabaseClient();

const email = computed(() =>
  typeof route.query.email === "string" ? route.query.email : "",
);
const otp = computed(() =>
  typeof route.query.otp === "string" ? route.query.otp : "",
);

const status = ref<"loading" | "needs-input" | "success" | "error">("loading");
const errorMsg = ref("");

const manualEmail = ref(email.value);
const manualOtp = ref(otp.value);

const tryLogin = async (e: string, o: string) => {
  status.value = "loading";
  errorMsg.value = "";
  try {
    const { error } = await supabase.auth.verifyOtp({
      email: e,
      token: o,
      type: "email",
    });
    if (error) {
      // type: "email" でダメなら "magiclink" でも試す
      const retry = await supabase.auth.verifyOtp({
        email: e,
        token: o,
        type: "magiclink",
      });
      if (retry.error) {
        status.value = "error";
        errorMsg.value = retry.error.message;
        return;
      }
    }
    status.value = "success";
    // 1.5 秒後に管理画面へ
    setTimeout(() => navigateTo("/admin"), 1500);
  } catch (err: any) {
    status.value = "error";
    errorMsg.value = err?.message || String(err);
  }
};

const submitManual = () => {
  if (!manualEmail.value || !manualOtp.value) return;
  tryLogin(manualEmail.value.trim(), manualOtp.value.trim());
};

onMounted(() => {
  if (email.value && otp.value) {
    tryLogin(email.value, otp.value);
  } else {
    status.value = "needs-input";
  }
});
</script>

<template>
  <div class="page page--narrow">
    <AppCard>
      <h1>緊急ログイン</h1>
      <p class="small muted">
        メール送信を経由せずに OTP コードでログインします。
      </p>

      <template v-if="status === 'loading'">
        <p style="margin-top: 24px">ログイン処理中...</p>
      </template>

      <template v-else-if="status === 'success'">
        <p style="margin-top: 24px; color: var(--accent); font-weight: 600">
          ✓ ログインに成功しました。管理画面に移動します...
        </p>
      </template>

      <template v-else-if="status === 'error'">
        <p class="small" style="margin-top: 16px; color: var(--danger)">
          {{ errorMsg }}
        </p>
        <p class="small muted" style="margin-top: 8px">
          OTP は 1 回限り有効です。失敗した場合は
          /api/admin/auth/emergency-link を再度叩いて新しい OTP を取得してください。
        </p>
        <button
          type="button"
          class="btn"
          style="margin-top: 12px"
          @click="status = 'needs-input'"
        >
          別の OTP を入力する
        </button>
      </template>

      <template v-else>
        <form @submit.prevent="submitManual" style="margin-top: 24px">
          <div class="field">
            <label>メールアドレス</label>
            <input
              v-model="manualEmail"
              type="email"
              required
              placeholder="name@example.com"
            />
          </div>
          <div class="field">
            <label>OTP（6 桁）</label>
            <input
              v-model="manualOtp"
              type="text"
              required
              placeholder="123456"
              inputmode="numeric"
              maxlength="10"
            />
          </div>
          <div class="btn-row">
            <span />
            <button
              type="submit"
              class="btn btn--primary"
              :disabled="!manualEmail || !manualOtp"
            >
              ログインする
            </button>
          </div>
        </form>
      </template>
    </AppCard>
  </div>
</template>
