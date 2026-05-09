<script setup lang="ts">
// ============================================================
// Step 1：過去の所属組織を洗い出し・特定（旧ブロック 1 + 2）
//   subStep:
//     0: 組織棚卸し（旧ブロック 1）
//     1: 自分との重なりの強さ測定（旧ブロック 2 ステップ 2-1）
//     2: 比較表示＋解釈コメント（旧ブロック 2 ステップ 2-2）
//     3: 重要組織の確定（旧ブロック 2 ステップ 2-3）
//
//   入力制約は無し：すべての画面で「次へ」を押せる。
// ============================================================
import { CONTENT } from "~/content/assessment";

const emit = defineEmits<{ (e: "back"): void; (e: "next"): void }>();
const { state, mutate, scoreAverage, topOrgByTag } = useAssessmentState();

const subStep = computed({
  get: () => state.value.meta.subStep,
  set: (v: number) =>
    mutate((s) => {
      s.meta.subStep = v;
    }),
});

const stepHeader = computed(() => {
  // subStep 0 = (1/2)、それ以外（測定／比較／確定）= (2/2)
  const sub = subStep.value === 0 ? CONTENT.step1.sub[0] : CONTENT.step1.sub[1];
  return `${CONTENT.step1.title} ${sub}`;
});

// =================================================
// subStep 0：組織棚卸し
// =================================================
const orgs = computed(() => state.value.organizations);

const nextOrgId = () => {
  const ids = orgs.value.map((o) => o.id);
  return ids.length === 0 ? 1 : Math.max(...ids) + 1;
};

const addOrg = () => {
  if (orgs.value.length >= CONTENT.block1.maxOrgs) return;
  mutate((s) => {
    s.organizations.push({ id: nextOrgId(), name: "", tag: "past" });
  });
};

onMounted(() => {
  if (orgs.value.length === 0) addOrg();
});

const setName = (id: number, name: string) =>
  mutate((s) => {
    const o = s.organizations.find((x) => x.id === id);
    if (o) o.name = name.slice(0, CONTENT.block1.nameMaxLength);
  });

const setTag = (id: number, tag: "past" | "current") =>
  mutate((s) => {
    const o = s.organizations.find((x) => x.id === id);
    if (o) o.tag = tag;
  });

const removeOrg = (id: number) =>
  mutate((s) => {
    s.organizations = s.organizations.filter((o) => o.id !== id);
    delete s.scores[String(id)];
    if (s.selectedOrgId === id) {
      s.selectedOrgId = null;
      s.selectedOrgManual = false;
    }
  });

// =================================================
// subStep 1：スコア測定
// =================================================
const orgList = computed(() =>
  state.value.organizations.filter((o) => o.name.trim().length > 0),
);
const orgIndex = useState<number>("reroots-step1-score-index", () => 0);
const currentOrg = computed(() => orgList.value[orgIndex.value]);

watch(subStep, (v) => {
  if (v === 1) orgIndex.value = 0;
});

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

const goPrevOrg = () => {
  if (orgIndex.value > 0) orgIndex.value -= 1;
  else subStep.value = 0;
};
const goNextOrg = () => {
  if (orgIndex.value < orgList.value.length - 1) {
    orgIndex.value += 1;
  } else {
    subStep.value = 2;
  }
};

// =================================================
// subStep 2：比較表示
// =================================================
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

// 解釈コメント：past - current の差で 3 分岐
//   どちらかが未測定（null / 0）なら表示しない
const interpretation = computed(() => {
  const p = pastScore.value;
  const c = currentScore.value;
  if (p == null || c == null) return null;
  if (p === 0 || c === 0) return null;
  const diff = p - c;
  if (diff >= 0.5) return CONTENT.block2.interpretPastStronger;
  if (diff <= -0.5) return CONTENT.block2.interpretCurrentStronger;
  return CONTENT.block2.interpretSimilar;
});

// =================================================
// subStep 3：重要組織の確定
// =================================================
const autoSelected = computed(
  () => topPast.value ?? topCurrent.value ?? null,
);

watch(subStep, (v) => {
  // 確定画面に入った時、未選定なら自動選定を反映
  if (v === 3 && state.value.selectedOrgId == null && autoSelected.value) {
    mutate((s) => {
      s.selectedOrgId = autoSelected.value!.id;
      s.selectedOrgManual = false;
    });
  }
});

const selectedOrg = computed(() =>
  state.value.organizations.find((o) => o.id === state.value.selectedOrgId) ??
    null,
);

const manualMode = ref(false);

const pickManual = (id: number) => {
  mutate((s) => {
    s.selectedOrgId = id;
    s.selectedOrgManual = true;
  });
  manualMode.value = false;
};
</script>

<template>
  <AppCard>
    <h2>{{ stepHeader }}</h2>

    <!-- ============ subStep 0: 組織棚卸し ============ -->
    <template v-if="subStep === 0">
      <div class="stack">
        <p v-for="(line, i) in CONTENT.block1.instruction" :key="i" class="muted">
          {{ line }}
        </p>
      </div>

      <div class="card card--soft" style="margin-top: 16px">
        <strong>{{ CONTENT.block1.hintTitle }}</strong>
        <div class="stack" style="margin-top: 12px">
          <div v-for="g in CONTENT.block1.hintGroups" :key="g.age">
            <div class="small"><strong>【{{ g.age }}】</strong></div>
            <div class="small muted">{{ g.examples }}</div>
          </div>
        </div>
      </div>

      <div class="card card--soft" style="margin-top: 12px">
        <strong>{{ CONTENT.block1.properNounNote.title }}</strong>
        <p class="small" style="margin-top: 8px">
          {{ CONTENT.block1.properNounNote.body }}
        </p>
        <ul class="small muted" style="margin: 4px 0 0 16px; padding: 0">
          <li v-for="(ex, i) in CONTENT.block1.properNounNote.examples" :key="i">
            {{ ex }}
          </li>
        </ul>
      </div>

      <h3 style="margin-top: 24px">{{ CONTENT.block1.inputHeader }}</h3>
      <p class="small muted">{{ CONTENT.block1.inputDescription }}</p>
      <p class="small muted" style="margin-top: 8px">
        {{ CONTENT.block1.requiredCurrentNote }}
      </p>

      <div class="stack">
        <div
          v-for="o in orgs"
          :key="o.id"
          class="card card--soft"
          style="padding: 16px"
        >
          <div class="field">
            <input
              type="text"
              :value="o.name"
              :placeholder="CONTENT.block1.namePlaceholder"
              :maxlength="CONTENT.block1.nameMaxLength"
              @input="setName(o.id, ($event.target as HTMLInputElement).value)"
            />
          </div>
          <div class="row" style="gap: 16px">
            <label class="row" style="gap: 4px; font-weight: 400">
              <input
                type="radio"
                :name="`tag-${o.id}`"
                :checked="o.tag === 'past'"
                @change="setTag(o.id, 'past')"
              />
              <span>{{ CONTENT.block1.pastLabel }}</span>
            </label>
            <label class="row" style="gap: 4px; font-weight: 400">
              <input
                type="radio"
                :name="`tag-${o.id}`"
                :checked="o.tag === 'current'"
                @change="setTag(o.id, 'current')"
              />
              <span>{{ CONTENT.block1.currentLabel }}</span>
            </label>
            <button
              type="button"
              class="btn btn--ghost small"
              style="margin-left: auto"
              @click="removeOrg(o.id)"
            >
              {{ CONTENT.block1.deleteButton }}
            </button>
          </div>
        </div>
      </div>

      <button
        type="button"
        class="btn"
        :disabled="orgs.length >= CONTENT.block1.maxOrgs"
        style="margin-top: 12px"
        @click="addOrg"
      >
        {{ CONTENT.block1.addButton }}
      </button>

      <p class="small muted" style="margin-top: 12px">
        {{ CONTENT.block1.countLabel(orgs.length, CONTENT.block1.maxOrgs) }}
      </p>

      <NavButtons
        can-back
        can-next
        :next-label="CONTENT.block1.nextLabel"
        @back="emit('back')"
        @next="subStep = 1"
      />
    </template>

    <!-- ============ subStep 1: スコア測定 ============ -->
    <template v-else-if="subStep === 1">
      <h3 style="margin-top: 0">{{ CONTENT.block2.subTitle }}</h3>
      <p class="muted">{{ CONTENT.block2.description }}</p>

      <div v-if="!currentOrg" class="card card--soft" style="margin-top: 12px">
        <p class="muted small">
          ブロック 1 で組織が入力されていないため、スコア測定をスキップします。
        </p>
        <NavButtons
          can-back
          can-next
          @back="subStep = 0"
          @next="subStep = 2"
        />
      </div>

      <div v-else class="stack" style="margin-top: 16px">
        <div class="row">
          <span
            class="chip"
            :class="currentOrg.tag === 'current' ? 'chip--accepted' : ''"
          >
            {{ currentOrg.tag === "current"
              ? CONTENT.block1.currentLabel
              : CONTENT.block1.pastLabel }}
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
          <p style="margin: 0 0 8px">
            <strong>質問 {{ i + 1 }}</strong>：{{ q }}
          </p>
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

        <NavButtons
          can-back
          can-next
          :back-label="orgIndex === 0 ? CONTENT.nav.back : CONTENT.block2.prevOrg"
          :next-label="
            orgIndex === orgList.length - 1
              ? CONTENT.block2.finishMeasurement
              : CONTENT.block2.nextOrg
          "
          @back="goPrevOrg"
          @next="goNextOrg"
        />
      </div>
    </template>

    <!-- ============ subStep 2: 比較表示 ============ -->
    <template v-else-if="subStep === 2">
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

        <!-- 解釈コメント -->
        <div v-if="interpretation" class="interpretation">
          <span class="interpretation__icon">{{ CONTENT.block2.interpretIcon }}</span>
          <p class="interpretation__body">{{ interpretation }}</p>
        </div>
      </div>

      <NavButtons can-back can-next @back="subStep = 1" @next="subStep = 3" />
    </template>

    <!-- ============ subStep 3: 重要組織の確定 ============ -->
    <template v-else>
      <template v-if="!manualMode">
        <p>
          {{ CONTENT.block2.confirmIntroPre }}<strong>{{ selectedOrg?.name ?? autoSelected?.name ?? "（未選定）" }}</strong>{{ CONTENT.block2.confirmIntroPost }}
        </p>
        <p>
          {{ CONTENT.block2.confirmBody(selectedOrg?.name ?? autoSelected?.name ?? "") }}
        </p>
        <p style="margin-top: 16px">
          <strong>{{ CONTENT.block2.confirmQuestion(selectedOrg?.name ?? autoSelected?.name ?? "") }}</strong>
        </p>

        <div class="stack" style="margin-top: 12px">
          <button
            type="button"
            class="btn"
            @click="manualMode = true"
          >
            {{ CONTENT.block2.confirmManual }}
          </button>
        </div>

        <NavButtons
          can-back
          can-next
          :next-label="CONTENT.block2.nextLabel"
          @back="subStep = 2"
          @next="emit('next')"
        />
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
            <span
              class="chip"
              :class="o.tag === 'current' ? 'chip--accepted' : ''"
            >
              {{ o.tag === "current"
                ? CONTENT.block1.currentLabel
                : CONTENT.block1.pastLabel }}
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
