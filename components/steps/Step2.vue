<script setup lang="ts">
// ============================================================
// ブロック 2：同一化スコア測定 → 比較 → 重要組織の確定
//   subStep:
//     0: 各組織への 6 項目スコア入力
//     1: 比較表示
//     2: 重要組織の確定（auto / manual 切替）
// ============================================================
import { CONTENT } from "~/content/assessment";

const emit = defineEmits<{ (e: "back"): void; (e: "next"): void }>();
const { state, mutate, scoreAverage, allScoresComplete, topOrgByTag } =
  useAssessmentState();

const subStep = computed({
  get: () => state.value.meta.subStep,
  set: (v: number) =>
    mutate((s) => {
      s.meta.subStep = v;
    }),
});

// 入力対象の組織（名前があるもののみ、過去→現在の順）
const orgList = computed(() =>
  state.value.organizations.filter((o) => o.name.trim().length > 0),
);

const orgIndex = useState<number>("reroots-block2-index", () => 0);
const currentOrg = computed(() => orgList.value[orgIndex.value]);

// 質問は 6 項目。past/current でテンプレートが違う。
const questions = computed(() => {
  if (!currentOrg.value) return [] as string[];
  const tmpl =
    currentOrg.value.tag === "past"
      ? CONTENT.block2.questionsPast
      : CONTENT.block2.questionsCurrent;
  return tmpl.map((t) => t.replaceAll("[組織名]", currentOrg.value!.name));
});
const scaleLabels = computed(() =>
  currentOrg.value?.tag === "past"
    ? CONTENT.block2.scaleLabelsPast
    : CONTENT.block2.scaleLabelsCurrent,
);
const instruction = computed(() => {
  if (!currentOrg.value) return "";
  const tmpl =
    currentOrg.value.tag === "past"
      ? CONTENT.block2.instructionPast
      : CONTENT.block2.instructionCurrent;
  return tmpl.replace("[組織名]", currentOrg.value.name);
});

// 現在組織の現在のスコア配列（length 6, 未回答=0）
const currentScores = computed(() => {
  const o = currentOrg.value;
  if (!o) return [0, 0, 0, 0, 0, 0];
  return state.value.scores[String(o.id)] ?? [0, 0, 0, 0, 0, 0];
});

const setScore = (qIndex: number, value: number) => {
  const o = currentOrg.value;
  if (!o) return;
  mutate((s) => {
    const key = String(o.id);
    const arr = s.scores[key]?.slice() ?? [0, 0, 0, 0, 0, 0];
    while (arr.length < 6) arr.push(0);
    arr[qIndex] = value;
    s.scores[key] = arr;
  });
};

const currentOrgComplete = computed(() =>
  currentOrg.value ? allScoresComplete(currentOrg.value.id) : false,
);

const allOrgsComplete = computed(() =>
  orgList.value.every((o) => allScoresComplete(o.id)),
);

const goPrevOrg = () => {
  if (orgIndex.value > 0) orgIndex.value -= 1;
  else emit("back");
};
const goNextOrg = () => {
  if (orgIndex.value < orgList.value.length - 1) {
    orgIndex.value += 1;
  } else if (allOrgsComplete.value) {
    subStep.value = 1;
    orgIndex.value = 0;
  }
};

// ----------------- 2-2 比較 -----------------
const topPast = computed(() => topOrgByTag("past"));
const topCurrent = computed(() => topOrgByTag("current"));
const pastScore = computed(() =>
  topPast.value ? scoreAverage(topPast.value.id) : null,
);
const currentScore = computed(() =>
  topCurrent.value ? scoreAverage(topCurrent.value.id) : null,
);
const scoreGap = computed(() => {
  if (pastScore.value == null || currentScore.value == null) return null;
  return Math.abs(pastScore.value - currentScore.value);
});

// ----------------- 2-3 確定 -----------------
const autoSelected = computed(() => {
  // 過去組織の最高スコアがあればそれ。無ければ現在組織の最高スコア。
  return topPast.value ?? topCurrent.value ?? null;
});

// 確定ステップに入った瞬間、既に selectedOrgId があれば尊重。
// 無ければ auto を初期値として書き込む。
const ensureAutoSelected = () => {
  if (state.value.selectedOrgId == null && autoSelected.value) {
    mutate((s) => {
      s.selectedOrgId = autoSelected.value!.id;
      s.selectedOrgManual = false;
    });
  }
};

watch(subStep, (v) => {
  if (v === 2) ensureAutoSelected();
});

const selectedOrg = computed(() =>
  state.value.organizations.find(
    (o) => o.id === state.value.selectedOrgId,
  ) ?? null,
);

const manualMode = ref(false);

const confirmYes = () => {
  ensureAutoSelected();
  mutate((s) => {
    s.selectedOrgManual = false;
  });
  emit("next");
};

const pickManual = (id: number) => {
  mutate((s) => {
    s.selectedOrgId = id;
    s.selectedOrgManual = true;
  });
  manualMode.value = false;
  emit("next");
};
</script>

<template>
  <AppCard>
    <h2>{{ CONTENT.block2.title }}</h2>

    <!-- ============ subStep 0: 測定 ============ -->
    <template v-if="subStep === 0">
      <p class="muted">{{ CONTENT.block2.description }}</p>

      <div v-if="!currentOrg" class="muted small">
        ブロック 1 で組織を入力してください。
      </div>

      <div v-else class="stack" style="margin-top: 16px">
        <div class="row">
          <span class="chip" :class="currentOrg.tag === 'current' ? 'chip--accepted' : ''">
            {{ currentOrg.tag === "current" ? CONTENT.block1.currentLabel : CONTENT.block1.pastLabel }}
          </span>
          <strong>{{ currentOrg.name }}</strong>
          <span class="small muted" style="margin-left: auto">
            {{ CONTENT.block2.progressLabel(orgIndex + 1, orgList.length) }}
          </span>
        </div>

        <p class="small muted">{{ instruction }}</p>

        <div
          v-for="(q, i) in questions"
          :key="i"
          class="card card--soft"
          style="padding: 16px"
        >
          <p style="margin: 0 0 8px"><strong>質問 {{ i + 1 }}</strong>：{{ q }}</p>
          <div class="stack" style="gap: 4px">
            <label
              v-for="(label, v) in scaleLabels"
              :key="v"
              class="row"
              style="gap: 6px; font-weight: 400"
            >
              <input
                type="radio"
                :name="`q-${currentOrg.id}-${i}`"
                :checked="currentScores[i] === v + 1"
                @change="setScore(i, v + 1)"
              />
              <span class="small">{{ label }}</span>
            </label>
          </div>
        </div>
      </div>

      <NavButtons
        can-back
        can-next
        :next-disabled="!currentOrgComplete"
        :back-label="orgIndex === 0 ? CONTENT.nav.back : CONTENT.block2.prevOrg"
        :next-label="
          orgIndex === orgList.length - 1
            ? CONTENT.block2.finishMeasurement
            : CONTENT.block2.nextOrg
        "
        @back="goPrevOrg"
        @next="goNextOrg"
      />
    </template>

    <!-- ============ subStep 1: 比較 ============ -->
    <template v-else-if="subStep === 1">
      <h3>{{ CONTENT.block2.comparisonTitle }}</h3>

      <div class="stack" style="margin-top: 16px">
        <div class="card card--soft">
          <div class="small muted">{{ CONTENT.block2.comparisonPastTitle }}</div>
          <template v-if="topPast">
            <div style="font-size: 18px"><strong>{{ topPast.name }}</strong></div>
            <div>
              {{ CONTENT.block2.comparisonScoreLabel }}：
              <strong>{{ pastScore!.toFixed(2) }}</strong> / 5
            </div>
          </template>
          <template v-else>
            <div class="muted">{{ CONTENT.block2.comparisonNoPast }}</div>
          </template>
        </div>

        <div class="card card--soft">
          <div class="small muted">{{ CONTENT.block2.comparisonCurrentTitle }}</div>
          <template v-if="topCurrent">
            <div style="font-size: 18px"><strong>{{ topCurrent.name }}</strong></div>
            <div>
              {{ CONTENT.block2.comparisonScoreLabel }}：
              <strong>{{ currentScore!.toFixed(2) }}</strong> / 5
            </div>
          </template>
          <template v-else>
            <div class="muted">{{ CONTENT.block2.comparisonNoCurrent }}</div>
          </template>
        </div>

        <p v-if="scoreGap != null">
          {{ CONTENT.block2.comparisonGapLabel }}<strong>{{ scoreGap.toFixed(2) }}</strong>
        </p>
      </div>

      <NavButtons
        can-back
        can-next
        @back="subStep = 0"
        @next="subStep = 2"
      />
    </template>

    <!-- ============ subStep 2: 確定 ============ -->
    <template v-else>
      <template v-if="!manualMode">
        <p>
          {{ CONTENT.block2.confirmIntroPre }}<strong>{{ selectedOrg?.name ?? autoSelected?.name }}</strong>{{ CONTENT.block2.confirmIntroPost }}
        </p>
        <p>
          {{ CONTENT.block2.confirmBody(selectedOrg?.name ?? autoSelected?.name ?? "") }}
        </p>
        <p style="margin-top: 16px">
          <strong>{{ CONTENT.block2.confirmQuestion(selectedOrg?.name ?? autoSelected?.name ?? "") }}</strong>
        </p>

        <div class="stack" style="margin-top: 12px">
          <button type="button" class="btn btn--primary" @click="confirmYes">
            {{ CONTENT.block2.confirmYes }}
          </button>
          <button type="button" class="btn" @click="manualMode = true">
            {{ CONTENT.block2.confirmManual }}
          </button>
        </div>

        <NavButtons can-back @back="subStep = 1" />
      </template>

      <template v-else>
        <h3>{{ CONTENT.block2.manualSelectTitle }}</h3>
        <p class="small muted">{{ CONTENT.block2.manualSelectDescription }}</p>
        <div class="stack" style="margin-top: 12px">
          <button
            v-for="o in orgList"
            :key="o.id"
            type="button"
            class="card card--soft"
            style="text-align: left; cursor: pointer"
            @click="pickManual(o.id)"
          >
            <span class="chip" :class="o.tag === 'current' ? 'chip--accepted' : ''">
              {{ o.tag === "current" ? CONTENT.block1.currentLabel : CONTENT.block1.pastLabel }}
            </span>
            <strong style="margin-left: 8px">{{ o.name }}</strong>
            <span class="small muted" style="margin-left: 8px">
              （スコア {{ scoreAverage(o.id).toFixed(2) }}）
            </span>
          </button>
        </div>
        <NavButtons can-back @back="manualMode = false" />
      </template>
    </template>
  </AppCard>
</template>
