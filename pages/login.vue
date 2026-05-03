<script setup lang="ts">
// 管理者ログインページ。回答者はログイン不要。
import { CONTENT } from "~/content/assessment";

definePageMeta({ layout: false });

const supabase = useSupabaseClient();
const email = ref("");
const sent = ref(false);
const errorMsg = ref("");
const loading = ref(false);

const send = async () => {
  errorMsg.value = "";
  if (!email.value.trim()) return;
  loading.value = true;
  try {
    const { error } = await supabase.auth.signInWithOtp({
      email: email.value.trim(),
      options: {
        emailRedirectTo: `${window.location.origin}/confirm`,
      },
    });
    if (error) {
      errorMsg.value = CONTENT.auth.sendError;
    } else {
      sent.value = true;
    }
  } catch (e) {
    errorMsg.value = CONTENT.auth.sendError;
  } finally {
    loading.value = false;
  }
};
</script>

<template>
  <div class="page page--narrow">
    <AppCard v-if="!sent">
      <h1>{{ CONTENT.auth.loginTitle }}</h1>
      <p class="muted">{{ CONTENT.auth.loginDescription }}</p>
      <form @submit.prevent="send">
        <input
          v-model="email"
          type="email"
          required
          :placeholder="CONTENT.auth.emailPlaceholder"
        />
        <p v-if="errorMsg" class="small" style="color: var(--danger); margin-top: 8px">
          {{ errorMsg }}
        </p>
        <div class="btn-row">
          <span />
          <button
            type="submit"
            class="btn btn--primary"
            :disabled="loading || !email"
          >
            {{ CONTENT.auth.sendLink }}
          </button>
        </div>
      </form>
    </AppCard>

    <AppCard v-else soft>
      <h2>{{ CONTENT.auth.sentHeader }}</h2>
      <p>{{ CONTENT.auth.sentBody }}</p>
    </AppCard>
  </div>
</template>
