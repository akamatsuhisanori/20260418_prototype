<script setup lang="ts">
// ============================================================
// /assessment/[token]
//   トークン付き URL でアクセスできる回答画面（ログイン不要）。
//   トークンが不正/失効していると 404 風メッセージを表示。
// ============================================================
import { CONTENT } from "~/content/assessment";

definePageMeta({ layout: false });

const route = useRoute();
const token = computed(() =>
  Array.isArray(route.params.token) ? route.params.token[0] : (route.params.token as string),
);

const {
  state,
  load,
  mutate,
  saving,
  submitted,
  notFound,
  setToken,
} = useAssessmentState();

setToken(token.value);
await load();

// アクセスのたびに開始画面 (Step 0) に戻す。
// 直接代入なので DB には書き込まず、ユーザーが「開始」を押した時点で保存される。
if (!notFound.value) {
  state.value.meta.step = 0;
}

const step = computed({
  get: () => state.value.meta.step,
  set: (v: number) =>
    mutate((s) => {
      s.meta.step = v;
    }),
});

const goTo = (n: number) => {
  step.value = Math.max(0, Math.min(5, n));
};
</script>

<template>
  <div class="page">
    <template v-if="notFound">
      <AppCard>
        <h2>このリンクは無効です</h2>
        <p class="muted">
          URL が間違っているか、回答が無効化されている可能性があります。
          管理者に新しいリンクを発行してもらってください。
        </p>
      </AppCard>
    </template>

    <template v-else>
      <header class="row" style="margin-bottom: 12px">
        <h1 style="margin: 0; font-size: 18px">{{ CONTENT.app.name }}</h1>
        <span class="small muted" style="margin-left: auto">
          {{ submitted ? "送信済み（閲覧のみ）" : saving ? "保存中..." : "自動保存" }}
        </span>
      </header>

      <ProgressBar
        v-if="step > 0"
        :total="CONTENT.nav.progressLabels.length"
        :current="step - 1"
      />

      <Step0 v-if="step === 0" @start="goTo(1)" />
      <Step1 v-else-if="step === 1" @back="goTo(0)" @next="goTo(2)" />
      <Step2 v-else-if="step === 2" @back="goTo(1)" @next="goTo(3)" />
      <Step3 v-else-if="step === 3" @back="goTo(2)" @next="goTo(4)" />
      <Step4 v-else-if="step === 4" @back="goTo(3)" @next="goTo(5)" />
      <Step5 v-else @back="goTo(4)" @next="goTo(5)" />
    </template>
  </div>
</template>
