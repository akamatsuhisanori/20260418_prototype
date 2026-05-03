<script setup lang="ts">
// ============================================================
// ブロック 4：写真を見ながら 3 軸（Who / Why / What）で書き出す
//   - 各軸：詳細記述（最大 400 字）+ 一言表現（最大 30 字、必須）
//   - 一言表現がすべて入力されたら次へ進める
// ============================================================
import { CONTENT, AXIS_KEYS, type AxisKey } from "~/content/assessment";

const emit = defineEmits<{ (e: "back"): void; (e: "next"): void }>();
const { state, mutate } = useAssessmentState();

const setDetail = (key: AxisKey, v: string) =>
  mutate((s) => {
    s.block4[key].detail = v.slice(0, CONTENT.block4.detailMaxLength);
  });
const setSummary = (key: AxisKey, v: string) =>
  mutate((s) => {
    s.block4[key].summary = v.slice(0, CONTENT.block4.summaryMaxLength);
  });

const allSummariesFilled = computed(() =>
  AXIS_KEYS.every((k) => state.value.block4[k].summary.trim().length > 0),
);
</script>

<template>
  <AppCard>
    <h2>{{ CONTENT.block4.title }}</h2>
    <p class="muted">{{ CONTENT.block4.introduction }}</p>

    <div
      v-for="key in AXIS_KEYS"
      :key="key"
      class="card card--soft"
      style="margin-top: 16px"
    >
      <h3>{{ CONTENT.block4.axes[key].label }}</h3>
      <p>{{ CONTENT.block4.axes[key].question }}</p>

      <textarea
        :value="state.block4[key].detail"
        :placeholder="CONTENT.block4.detailPlaceholder"
        :maxlength="CONTENT.block4.detailMaxLength"
        @input="setDetail(key, ($event.target as HTMLTextAreaElement).value)"
      />
      <p class="tiny muted">
        {{ state.block4[key].detail.length }} / {{ CONTENT.block4.detailMaxLength }} 字
        {{ CONTENT.block4.detailHint }}
      </p>

      <p class="small" style="margin-top: 12px">
        <strong>{{ CONTENT.block4.summaryCta }}</strong>
      </p>
      <p class="small muted">{{ CONTENT.block4.axes[key].examples }}</p>
      <input
        type="text"
        :value="state.block4[key].summary"
        :placeholder="CONTENT.block4.summaryPlaceholder"
        :maxlength="CONTENT.block4.summaryMaxLength"
        @input="setSummary(key, ($event.target as HTMLInputElement).value)"
      />
      <p class="tiny muted">
        {{ state.block4[key].summary.length }} / {{ CONTENT.block4.summaryMaxLength }} 字
      </p>
    </div>

    <p
      v-if="!allSummariesFilled"
      class="small"
      style="color: var(--warn); margin-top: 16px"
    >
      {{ CONTENT.block4.summaryRequiredWarning }}
    </p>

    <NavButtons
      can-back
      can-next
      :next-disabled="!allSummariesFilled"
      :next-label="CONTENT.block4.nextLabel"
      @back="emit('back')"
      @next="emit('next')"
    />
  </AppCard>
</template>
