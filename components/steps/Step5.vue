<script setup lang="ts">
// ============================================================
// ブロック 5：3 軸を統合した「核」を一文にまとめる
//   - ブロック 4 の 3 軸カードを表示（詳細展開可能）
//   - 100 字以内のテキストエリアに核を入力
// ============================================================
import { CONTENT, AXIS_KEYS, type AxisKey } from "~/content/assessment";

const emit = defineEmits<{ (e: "back"): void; (e: "next"): void }>();
const { state, mutate } = useAssessmentState();

const expanded = reactive<Record<AxisKey, boolean>>({
  who: false,
  why: false,
  what: false,
});

const setCore = (v: string) =>
  mutate((s) => {
    s.coreStatement = v.slice(0, CONTENT.block5.maxLength);
  });

const canProceed = computed(
  () => state.value.coreStatement.trim().length > 0,
);

const truncate = (s: string, n: number) =>
  s.length > n ? s.slice(0, n) + "..." : s;
</script>

<template>
  <AppCard>
    <h2>{{ CONTENT.block5.title }}</h2>

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
      :next-disabled="!canProceed"
      :next-label="CONTENT.block5.nextLabel"
      @back="emit('back')"
      @next="emit('next')"
    />
  </AppCard>
</template>
