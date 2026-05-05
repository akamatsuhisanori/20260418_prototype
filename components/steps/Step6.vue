<script setup lang="ts">
// ============================================================
// ブロック 6：9 マスを完成させる → ギャップ判定 → 行動設計
//   subStep:
//     0: 9 マス入力（過去はブロック 4 の一言を読み取り専用、
//                    現在・未来は各セルに直接ナラティブを入力）
//     1: ギャップ判定
//     2: 行動設計（ギャップ「ある」のみ）
//
//   過去：ブロック 4 で書いた「一言」を 9 マスに表示
//   現在・未来：ナラティブ（詳細記述）のみを入力
// ============================================================
import { CONTENT, AXIS_KEYS, type AxisKey } from "~/content/assessment";

const emit = defineEmits<{ (e: "back"): void; (e: "next"): void }>();
const { state, mutate, submit } = useAssessmentState();

const subStep = computed({
  get: () => state.value.meta.subStep,
  set: (v: number) =>
    mutate((s) => {
      s.meta.subStep = v;
    }),
});

const setDetail = (
  phase: "current" | "future",
  key: AxisKey,
  v: string,
) =>
  mutate((s) => {
    s.block6[phase][key].detail = v.slice(0, CONTENT.block6.detailMaxLength);
  });

const setGap = (key: AxisKey, hasGap: boolean) =>
  mutate((s) => {
    s.block6.gaps[key].hasGap = hasGap;
    if (!hasGap) s.block6.gaps[key].action = "";
  });
const setAction = (key: AxisKey, v: string) =>
  mutate((s) => {
    s.block6.gaps[key].action = v.slice(0, CONTENT.block6.actionMaxLength);
  });

const matrixFilled = computed(() =>
  AXIS_KEYS.every(
    (k) =>
      state.value.block6.current[k].detail.trim().length > 0 &&
      state.value.block6.future[k].detail.trim().length > 0,
  ),
);
const gapsAnswered = computed(() =>
  AXIS_KEYS.every((k) => state.value.block6.gaps[k].hasGap !== null),
);
const actionsFilled = computed(() =>
  AXIS_KEYS.every((k) => {
    const g = state.value.block6.gaps[k];
    if (g.hasGap) return g.action.trim().length > 0;
    return true;
  }),
);

const submitting = ref(false);

const finish = async () => {
  submitting.value = true;
  const ok = await submit();
  submitting.value = false;
  if (ok) emit("next");
  else alert("送信に失敗しました。もう一度お試しください。");
};
</script>

<template>
  <AppCard>
    <h2>{{ CONTENT.block6.title }}</h2>

    <!-- ============ subStep 0: 9 マス入力 ============ -->
    <template v-if="subStep === 0">
      <h3>{{ CONTENT.block6.matrixTitle }}</h3>
      <p class="muted">{{ CONTENT.block6.matrixIntro }}</p>

      <!-- ブロック 5 のおさらい：3 軸の一言 + 統合した核 -->
      <div class="card card--soft" style="margin-top: 12px">
        <strong>{{ CONTENT.block6.block5RecallTitle }}</strong>
        <ul style="margin: 8px 0 0 16px; padding: 0">
          <li v-for="key in AXIS_KEYS" :key="`recall-${key}`">
            <span class="small muted">{{ CONTENT.block6.axisLabels[key] }}：</span>
            <strong>「{{ state.block4[key].summary || "（未入力）" }}」</strong>
          </li>
        </ul>
        <p style="margin-top: 12px">
          <span class="small muted">{{ CONTENT.block6.coreLabel }}：</span><br />
          <strong>{{ state.coreStatement || "（未入力）" }}</strong>
        </p>
      </div>

      <!-- 9 マスグリッド -->
      <div class="matrix">
        <!-- ヘッダ行 -->
        <div class="matrix__head"></div>
        <div
          v-for="key in AXIS_KEYS"
          :key="`h-${key}`"
          class="matrix__head"
        >
          {{ CONTENT.block6.axisLabels[key] }}
        </div>

        <!-- 過去 -->
        <div class="matrix__rowhead">{{ CONTENT.block6.rowLabels.past }}</div>
        <div
          v-for="key in AXIS_KEYS"
          :key="`past-${key}`"
          class="matrix__cell matrix__cell--past"
        >
          {{ state.block4[key].summary || "（未入力）" }}
        </div>

        <!-- 現在 -->
        <div class="matrix__rowhead">{{ CONTENT.block6.rowLabels.current }}</div>
        <div
          v-for="key in AXIS_KEYS"
          :key="`cur-${key}`"
          class="matrix__cell"
        >
          <p class="tiny muted" style="margin: 0 0 4px">
            {{ CONTENT.block6.currentQuestions[key] }}
          </p>
          <textarea
            :value="state.block6.current[key].detail"
            :placeholder="CONTENT.block6.detailPlaceholder"
            :maxlength="CONTENT.block6.detailMaxLength"
            @input="setDetail('current', key, ($event.target as HTMLTextAreaElement).value)"
          />
        </div>

        <!-- 未来 -->
        <div class="matrix__rowhead" style="white-space: pre-line">{{ CONTENT.block6.rowLabels.future }}</div>
        <div
          v-for="key in AXIS_KEYS"
          :key="`fut-${key}`"
          class="matrix__cell"
        >
          <p class="tiny muted" style="margin: 0 0 4px">
            {{ CONTENT.block6.futureQuestions[key] }}
          </p>
          <textarea
            :value="state.block6.future[key].detail"
            :placeholder="CONTENT.block6.detailPlaceholder"
            :maxlength="CONTENT.block6.detailMaxLength"
            @input="setDetail('future', key, ($event.target as HTMLTextAreaElement).value)"
          />
        </div>
      </div>

      <NavButtons
        can-back
        can-next
        :next-disabled="!matrixFilled"
        @back="emit('back')"
        @next="subStep = 1"
      />
    </template>

    <!-- ============ subStep 1: ギャップ判定 ============ -->
    <template v-else-if="subStep === 1">
      <h3>{{ CONTENT.block6.gapTitle }}</h3>

      <!-- 9 マスの結果を読み取り専用で再掲 -->
      <div class="matrix" style="margin-top: 12px">
        <div class="matrix__head"></div>
        <div
          v-for="key in AXIS_KEYS"
          :key="`gap-h-${key}`"
          class="matrix__head"
        >
          {{ CONTENT.block6.axisLabels[key] }}
        </div>

        <div class="matrix__rowhead">{{ CONTENT.block6.rowLabels.past }}</div>
        <div
          v-for="key in AXIS_KEYS"
          :key="`gap-past-${key}`"
          class="matrix__cell matrix__cell--past"
        >
          {{ state.block4[key].summary || "（未入力）" }}
        </div>

        <div class="matrix__rowhead">{{ CONTENT.block6.rowLabels.current }}</div>
        <div
          v-for="key in AXIS_KEYS"
          :key="`gap-cur-${key}`"
          class="matrix__cell"
          style="white-space: pre-wrap"
        >
          {{ state.block6.current[key].detail || "（未入力）" }}
        </div>

        <div class="matrix__rowhead" style="white-space: pre-line">{{ CONTENT.block6.rowLabels.future }}</div>
        <div
          v-for="key in AXIS_KEYS"
          :key="`gap-fut-${key}`"
          class="matrix__cell"
          style="white-space: pre-wrap"
        >
          {{ state.block6.future[key].detail || "（未入力）" }}
        </div>
      </div>

      <div class="card card--soft" style="margin-top: 16px">
        <p
          v-for="(line, i) in CONTENT.block6.gapInstruction"
          :key="i"
          style="margin: 0 0 4px"
        >
          {{ line }}
        </p>
      </div>

      <div
        v-for="key in AXIS_KEYS"
        :key="`gap-${key}`"
        class="card card--soft"
        style="margin-top: 12px"
      >
        <h3>{{ CONTENT.block6.axisLabels[key] }} のギャップ</h3>
        <p class="small">
          現在：<span style="white-space: pre-wrap">{{ state.block6.current[key].detail || "（未入力）" }}</span>
        </p>
        <p class="small">
          未来：<span style="white-space: pre-wrap">{{ state.block6.future[key].detail || "（未入力）" }}</span>
        </p>
        <div class="stack" style="gap: 4px; margin-top: 8px">
          <label class="row" style="gap: 6px; font-weight: 400">
            <input
              type="radio"
              :name="`gap-${key}`"
              :checked="state.block6.gaps[key].hasGap === true"
              @change="setGap(key, true)"
            />
            <span>{{ CONTENT.block6.gapHasGap }}</span>
          </label>
          <label class="row" style="gap: 6px; font-weight: 400">
            <input
              type="radio"
              :name="`gap-${key}`"
              :checked="state.block6.gaps[key].hasGap === false"
              @change="setGap(key, false)"
            />
            <span>{{ CONTENT.block6.gapNoGap }}</span>
          </label>
        </div>
      </div>

      <NavButtons
        can-back
        can-next
        :next-disabled="!gapsAnswered"
        @back="subStep = 0"
        @next="subStep = 2"
      />
    </template>

    <!-- ============ subStep 2: 行動設計 ============ -->
    <template v-else>
      <h3>{{ CONTENT.block6.actionTitle }}</h3>

      <div
        v-for="key in AXIS_KEYS"
        :key="`act-${key}`"
        class="card card--soft"
        style="margin-top: 16px"
      >
        <h3>{{ CONTENT.block6.axisLabels[key] }}</h3>
        <p class="small">
          現在：<span style="white-space: pre-wrap">{{ state.block6.current[key].detail || "（未入力）" }}</span>
        </p>
        <p class="small">
          未来：<span style="white-space: pre-wrap">{{ state.block6.future[key].detail || "（未入力）" }}</span>
        </p>

        <template v-if="state.block6.gaps[key].hasGap === true">
          <p style="margin-top: 12px; white-space: pre-wrap">
            {{ CONTENT.block6.actionInstruction }}
          </p>
          <textarea
            :value="state.block6.gaps[key].action"
            :placeholder="CONTENT.block6.actionPlaceholder"
            :maxlength="CONTENT.block6.actionMaxLength"
            @input="setAction(key, ($event.target as HTMLTextAreaElement).value)"
          />
          <p class="tiny muted">
            {{ state.block6.gaps[key].action.length }} / {{ CONTENT.block6.actionMaxLength }} 字
          </p>
        </template>

        <template v-else>
          <p class="muted small" style="margin-top: 12px">
            {{ CONTENT.block6.gapNoGapMessage }}
          </p>
        </template>
      </div>

      <NavButtons
        can-back
        can-next
        :next-disabled="!actionsFilled || submitting"
        :next-label="submitting ? CONTENT.block6.submitting : CONTENT.block6.nextLabel"
        @back="subStep = 1"
        @next="finish"
      />
    </template>
  </AppCard>
</template>
