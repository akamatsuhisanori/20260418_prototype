<script setup lang="ts">
// ============================================================
// Step 4：自分らしさを言語化（旧ブロック 4 + 5）
//   subStep 0：3 軸（Why / What / Who/Where）の詳細＋一言
//   subStep 1：3 軸を統合した「あなたは何を大切にしている人間なのか」を一文に
//
//   入力制約なし：未入力でも次へ進める。
// ============================================================
import { CONTENT, AXIS_KEYS, type AxisKey } from "~/content/assessment";

const emit = defineEmits<{ (e: "back"): void; (e: "next"): void }>();
const { state, mutate } = useAssessmentState();

const subStep = computed({
  get: () => state.value.meta.subStep,
  set: (v: number) =>
    mutate((s) => {
      s.meta.subStep = v;
    }),
});

const stepHeader = computed(() => {
  const sub = subStep.value === 0 ? CONTENT.step4.sub[0] : CONTENT.step4.sub[1];
  return `${CONTENT.step4.title} ${sub}`;
});

// =================================================
// subStep 0：3 軸入力
// =================================================
const setDetail = (key: AxisKey, v: string) =>
  mutate((s) => {
    s.block4[key].detail = v.slice(0, CONTENT.block4.detailMaxLength);
  });
const setSummary = (key: AxisKey, v: string) =>
  mutate((s) => {
    s.block4[key].summary = v.slice(0, CONTENT.block4.summaryMaxLength);
  });

// =================================================
// subStep 1：核（コア）の一文化
// =================================================
const expanded = reactive<Record<AxisKey, boolean>>({
  who: false,
  why: false,
  what: false,
});

const setCore = (v: string) =>
  mutate((s) => {
    s.coreStatement = v.slice(0, CONTENT.block5.maxLength);
  });

const truncate = (s: string, n: number) =>
  s.length > n ? s.slice(0, n) + "..." : s;
</script>

<template>
  <AppCard>
    <h2>{{ stepHeader }}</h2>

    <!-- ============ subStep 0: 3 軸入力 ============ -->
    <template v-if="subStep === 0">
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

      <NavButtons
        can-back
        can-next
        :next-label="CONTENT.block4.nextLabel"
        @back="emit('back')"
        @next="subStep = 1"
      />
    </template>

    <!-- ============ subStep 1: コア（核）の一文化 ============ -->
    <template v-else>
      <h3 style="margin-top: 16px">{{ CONTENT.block5.cardsHeading }}</h3>
      <div class="stack">
        <div
          v-for="key in AXIS_KEYS"
          :key="key"
          class="card card--soft"
        >
          <h3 style="margin: 0 0 4px">{{ CONTENT.block4.axes[key].label }}</h3>
          <p style="margin: 0; font-size: 17px">
            <strong>「{{ state.block4[key].summary || "（未入力）" }}」</strong>
          </p>
          <p
            v-if="!expanded[key] && state.block4[key].detail"
            class="small muted"
            style="margin-top: 8px"
          >
            {{ truncate(state.block4[key].detail, 80) }}
          </p>
          <p
            v-if="expanded[key] && state.block4[key].detail"
            class="small"
            style="margin-top: 8px; white-space: pre-wrap"
          >
            {{ state.block4[key].detail }}
          </p>
          <button
            v-if="state.block4[key].detail"
            type="button"
            class="btn btn--ghost small"
            style="margin-top: 8px"
            @click="expanded[key] = !expanded[key]"
          >
            {{ expanded[key] ? CONTENT.block5.detailToggleClose : CONTENT.block5.detailToggle }}
          </button>
        </div>
      </div>

      <div class="card card--soft" style="margin-top: 24px">
        <p
          v-for="(line, i) in CONTENT.block5.instructionLines"
          :key="i"
        >
          {{ line }}
        </p>

        <p class="small muted" style="margin-top: 12px">
          <strong>{{ CONTENT.block5.examplesHeading }}</strong>
        </p>
        <ul class="small muted">
          <li v-for="(ex, i) in CONTENT.block5.examples" :key="i">{{ ex }}</li>
        </ul>

        <p class="small" style="margin-top: 12px; color: var(--text-soft)">
          {{ CONTENT.block5.hint }}
        </p>
      </div>

      <div class="field" style="margin-top: 16px">
        <label>{{ CONTENT.block5.inputLabel }}</label>
        <textarea
          :value="state.coreStatement"
          :placeholder="CONTENT.block5.placeholder"
          :maxlength="CONTENT.block5.maxLength"
          style="min-height: 120px"
          @input="setCore(($event.target as HTMLTextAreaElement).value)"
        />
        <p class="tiny muted">
          {{ state.coreStatement.length }} / {{ CONTENT.block5.maxLength }} 字
        </p>
      </div>

      <NavButtons
        can-back
        can-next
        :next-label="CONTENT.block5.nextLabel"
        @back="subStep = 0"
        @next="emit('next')"
      />
    </template>
  </AppCard>
</template>
