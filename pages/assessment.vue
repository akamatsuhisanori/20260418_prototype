<script setup lang="ts">
// 5 ステップ（+ Step 0 イントロ）を 1 ページでステートフルに表示する。
// 保存は useAssessmentState の debounce で走る。
import { CONTENT } from "~/content/assessment";

const { state, load, mutate, submitted } = useAssessmentState();
await load();

// /assessment にアクセスするたびに開始画面 (Step 0) に戻す。
// 直接代入なので DB には書き込まず、ユーザーが「開始」を押した時点で保存される。
state.value.meta.step = 0;

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
    <header class="row" style="margin-bottom: 12px">
      <NuxtLink to="/" class="btn btn--ghost small">← ホーム</NuxtLink>
      <span class="small muted" style="margin-left: auto">
        {{ submitted ? "送信済み（閲覧のみ）" : "自動保存中" }}
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
  </div>
</template>
