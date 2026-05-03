<script setup lang="ts">
// ============================================================
// ブロック 6：9 マス + ギャップ判定 + 行動設計
//   subStep:
//     0: 6-1a 現在の 3 軸を書く
//     1: 6-1b 未来の 3 軸を書く
//     2: 6-2 9 マス俯瞰 + ギャップ判定
//     3: 6-3 ギャップを近づける行動を入力（ギャップ「ある」のみ）
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
const setSummary = (
  phase: "current" | "future",
  key: AxisKey,
  v: string,
) =>
  mutate((s) => {
    s.block6[phase][key].summary = v.slice(0, CONTENT.block6.summaryMaxLength);
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

const phaseSummariesFilled = (phase: "current" | "future") =>
  AXIS_KEYS.every(
    (k) => state.value.block6[phase][k].summary.trim().length > 0,
  );

const currentFilled = computed(() => phaseSummariesFilled("current"));
const futureFilled = computed(() => phaseSummariesFilled("future"));
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

// 9 マス表示用
const cellSummary = (phase: "past" | "current" | "future", key: AxisKey) => {
  if (phase === "past") return state.value.block4[key].summary || "（未入力）";
  return state.value.block6[phase][key].summary || "（未入力）";
};
</script>

<template>
  <AppCard>
    <h2>{{ CONTENT.block6.title }}</h2>

    <!-- ============ subStep 0: 現在の 3 軸 ============ -->
    <template v-if="subStep === 0">
      <h3>{{ CONTENT.block6.currentTitle }}</h3>
      <p class="muted">{{ CONTENT.block6.currentIntro }}</p>

      <div
        v-for="key in AXIS_KEYS"
        :key="`cur-${key}`"
        class="card card--soft"
        style="margin-top: 16px"
      >
        <h3>{{ CONTENT.block6.axisLabels[key] }}</h3>
        <p class="small muted">{{ CONTENT.block6.currentQuestions[key] }}</p>
        <textarea
          :value="state.block6.current[key].detail"
          :placeholder="CONTENT.block6.detailPlaceholder"
          :maxlength="CONTENT.block6.detailMaxLength"
          @input="setDetail('current', key, ($event.target as HTMLTextAreaElement).value)"
        />
        <p class="tiny muted">
          {{ state.block6.current[key].detail.length }} / {{ CONTENT.block6.detailMaxLength }} 字
        </p>
        <input
          type="text"
          :value="state.block6.current[key].summary"
          :placeholder="CONTENT.block6.summaryPlaceholder"
          :maxlength="CONTENT.block6.summaryMaxLength"
          style="margin-top: 8px"
          @input="setSummary('current', key, ($event.target as HTMLInputElement).value)"
        />
        <p class="tiny muted">
          一言：{{ state.block6.current[key].summary.length }} / {{ CONTENT.block6.summaryMaxLength }} 字
        </p>
      </div>

      <NavButtons
        can-back
        can-next
        :next-disabled="!currentFilled"
        @back="emit('back')"
        @next="subStep = 1"
      />
    </template>

    <!-- ============ subStep 1: 未来の 3 軸 ============ -->
    <template v-else-if="subStep === 1">
      <h3>{{ CONTENT.block6.futureTitle }}</h3>
      <p class="muted">{{ CONTENT.block6.futureIntro }}</p>

      <div class="card card--soft" style="margin-top: 12px">
        <p class="small muted">あなたの核（ブロック 5）</p>
        <p style="margin: 0"><strong>{{ state.coreStatement || "（未入力）" }}</strong></p>
      </div>

      <div
        v-for="key in AXIS_KEYS"
        :key="`fut-${key}`"
        class="card card--soft"
        style="margin-top: 16px"
      >
        <h3>{{ CONTENT.block6.axisLabels[key] }}</h3>
        <p class="small muted">{{ CONTENT.block6.futureQuestions[key] }}</p>
        <textarea
          :value="state.block6.future[key].detail"
          :placeholder="CONTENT.block6.detailPlaceholder"
          :maxlength="CONTENT.block6.detailMaxLength"
          @input="setDetail('future', key, ($event.target as HTMLTextAreaElement).value)"
        />
        <p class="tiny muted">
          {{ state.block6.future[key].detail.length }} / {{ CONTENT.block6.detailMaxLength }} 字
        </p>
        <input
          type="text"
          :value="state.block6.future[key].summary"
          :placeholder="CONTENT.block6.summaryPlaceholder"
          :maxlength="CONTENT.block6.summaryMaxLength"
          style="margin-top: 8px"
          @input="setSummary('future', key, ($event.target as HTMLInputElement).value)"
        />
        <p class="tiny muted">
          一言：{{ state.block6.future[key].summary.length }} / {{ CONTENT.block6.summaryMaxLength }} 字
        </p>
      </div>

      <NavButtons
        can-back
        can-next
        :next-disabled="!futureFilled"
        @back="subStep = 0"
        @next="subStep = 2"
      />
    </template>

    <!-- ============ subStep 2: 9 マス + ギャップ判定 ============ -->
    <template v-else-if="subStep === 2">
      <h3>あなたの 9 マスが完成しました</h3>

      <table class="table" style="margin-top: 12px">
        <thead>
          <tr>
            <th></th>
            <th v-for="h in CONTENT.block6.matrixHeaders" :key="h">{{ h }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="key in AXIS_KEYS" :key="`row-${key}`">
            <th>{{ CONTENT.block6.axisLabels[key] }}</th>
            <td><strong>{{ cellSummary('past', key) }}</strong></td>
            <td><strong>{{ cellSummary('current', key) }}</strong></td>
            <td><strong>{{ cellSummary('future', key) }}</strong></td>
          </tr>
        </tbody>
      </table>

      <div class="card card--soft" style="margin-top: 16px">
        <p
          v-for="(line, i) in CONTENT.block6.gapInstruction"
          :key="i"
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
          現在：<strong>{{ cellSummary('current', key) }}</strong>
        </p>
        <p class="small">
          未来：<strong>{{ cellSummary('future', key) }}</strong>
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
        @back="subStep = 1"
        @next="subStep = 3"
      />
    </template>

    <!-- ============ subStep 3: 行動設計 ============ -->
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
          現在：<strong>{{ cellSummary('current', key) }}</strong>
        </p>
        <p class="small">
          未来：<strong>{{ cellSummary('future', key) }}</strong>
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
        @back="subStep = 2"
        @next="finish"
      />
    </template>
  </AppCard>
</template>
