<script setup lang="ts">
import { CONTENT } from "~/content/assessment";

const emit = defineEmits<{ (e: "back"): void; (e: "next"): void }>();

const { state, mutate, getTopOrg, submit } = useAssessmentState();

// step5 は内部で 5 サブステップ持つ:
//  0: 要素選択, 1: 3人の対話, 2: 行動アイデア, 3: 今週のプラン, 4: 完了表示
const subStep = computed({
  get: () => state.value.meta.subStep,
  set: (v: number) =>
    mutate((s) => {
      s.meta.subStep = v;
    }),
});

// ============ 選択された要素（dimensionId） ============
const selectedKey = "step5:selectedDim";

const episodeLength = (dimId: string) =>
  (state.value.dialogue[`step4:${dimId}:episode`] ?? "").length;

const autoSelected = computed(() => {
  let best = CONTENT.questions.dimensions[0].id;
  let max = -1;
  for (const d of CONTENT.questions.dimensions) {
    const l = episodeLength(d.id);
    if (l > max) {
      max = l;
      best = d.id;
    }
  }
  return best;
});

const selectedDim = computed({
  get: () => state.value.dialogue[selectedKey] || autoSelected.value,
  set: (v: string) =>
    mutate((s) => {
      s.dialogue[selectedKey] = v;
    }),
});

const selectedDimObj = computed(() =>
  CONTENT.questions.dimensions.find((d) => d.id === selectedDim.value),
);

const pastOrg = computed(() => getTopOrg("past") || CONTENT.step4.orgNameFallback);

// ============ dialogue answers ============
const dialogueKey = (qid: string, tense: "past" | "present" | "future") =>
  `step5:dialogue:${selectedDim.value}:${qid}:${tense}`;

const getDialogue = (qid: string, tense: "past" | "present" | "future") =>
  state.value.dialogue[dialogueKey(qid, tense)] ?? "";

const setDialogue = (
  qid: string,
  tense: "past" | "present" | "future",
  v: string,
) =>
  mutate((s) => {
    s.dialogue[dialogueKey(qid, tense)] = v;
  });

// ============ actions ============
const setAction = (key: keyof typeof state.value.actions, v: string) =>
  mutate((s) => {
    s.actions[key] = v;
  });

// ============ week plan ============
const weekKey = "step5:week";
const weekPlan = computed({
  get: () => state.value.dialogue[weekKey] ?? "",
  set: (v: string) =>
    mutate((s) => {
      s.dialogue[weekKey] = v;
    }),
});

const finish = async () => {
  const ok = await submit();
  if (ok) subStep.value = 4;
};
</script>

<template>
  <AppCard>
    <!-- subStep 0: 要素選択 -->
    <template v-if="subStep === 0">
      <h2>{{ CONTENT.step5.title }}</h2>
      <p>
        {{ CONTENT.step5.selectLead }}<strong>{{ CONTENT.step5.selectLeadStrong }}</strong>{{ CONTENT.step5.selectLeadTail }}
      </p>
      <p class="small muted">{{ CONTENT.step5.selectHint }}</p>
      <div class="stack">
        <label
          v-for="dim in CONTENT.questions.dimensions"
          :key="dim.id"
          class="card card--soft"
          style="cursor: pointer"
        >
          <input
            type="radio"
            name="selectedDim"
            :checked="selectedDim === dim.id"
            @change="selectedDim = dim.id"
          />
          <strong :class="`color-${dim.id}`" style="margin-left: 8px">
            {{ dim.icon }} {{ state.dialogue[`step4:${dim.id}:keyword`] || dim.label }}
          </strong>
          <div class="small muted">
            {{ state.dialogue[`step4:${dim.id}:episode`] || "（Step 4 のエピソード未記入）" }}
          </div>
        </label>
      </div>
      <p class="small">
        <span class="chip chip--accepted">{{ CONTENT.step5.selectedState }}</span>
      </p>
      <NavButtons
        can-back
        can-next
        :next-label="CONTENT.step5.selectNext"
        @back="emit('back')"
        @next="subStep = 1"
      />
    </template>

    <!-- subStep 1: 3人の対話 -->
    <template v-else-if="subStep === 1">
      <h2>{{ CONTENT.step5.dialogueTitle }}</h2>
      <p class="muted">{{ CONTENT.step5.dialogueDescription }}</p>

      <div
        v-for="q in CONTENT.questions.dialogue"
        :key="q.id"
        class="card card--soft"
      >
        <h3>{{ q.label }}</h3>
        <p class="small muted">戦略: {{ q.strategy }}</p>

        <div class="field">
          <label>{{ CONTENT.step5.personLabels.past(pastOrg) }}</label>
          <p class="small muted">{{ q.past }}</p>
          <textarea
            :value="getDialogue(q.id, 'past')"
            :placeholder="CONTENT.step5.dialoguePlaceholder"
            @input="setDialogue(q.id, 'past', ($event.target as HTMLTextAreaElement).value)"
          />
        </div>
        <div class="field">
          <label>{{ CONTENT.step5.personLabels.present() }}</label>
          <p class="small muted">{{ q.present }}</p>
          <textarea
            :value="getDialogue(q.id, 'present')"
            :placeholder="CONTENT.step5.dialoguePlaceholder"
            @input="setDialogue(q.id, 'present', ($event.target as HTMLTextAreaElement).value)"
          />
        </div>
        <div class="field">
          <label>{{ CONTENT.step5.personLabels.future() }}</label>
          <p class="small muted">{{ q.future }}</p>
          <textarea
            :value="getDialogue(q.id, 'future')"
            :placeholder="CONTENT.step5.dialoguePlaceholder"
            @input="setDialogue(q.id, 'future', ($event.target as HTMLTextAreaElement).value)"
          />
        </div>
      </div>

      <NavButtons
        can-back
        can-next
        :next-label="CONTENT.step5.dialogueNext"
        @back="subStep = 0"
        @next="subStep = 2"
      />
    </template>

    <!-- subStep 2: 行動アイデア -->
    <template v-else-if="subStep === 2">
      <h2>{{ CONTENT.step5.actionTitle }}</h2>
      <p>{{ CONTENT.step5.actionDescription1 }}</p>
      <p>
        {{ CONTENT.step5.actionDescription2Pre }}<strong>{{ CONTENT.step5.actionDescription2Strong }}</strong>{{ CONTENT.step5.actionDescription2Post }}
      </p>

      <div
        v-for="dir in CONTENT.step5.directions"
        :key="dir.key"
        class="card card--soft"
      >
        <h3>{{ dir.label }}</h3>
        <p class="small muted">{{ dir.strategy }}</p>
        <p>{{ dir.desc }}</p>
        <p class="small muted">{{ dir.hint }}</p>
        <textarea
          :value="state.actions[dir.key]"
          :placeholder="CONTENT.step5.actionPlaceholder"
          @input="setAction(dir.key, ($event.target as HTMLTextAreaElement).value)"
        />
      </div>

      <NavButtons
        can-back
        can-next
        :next-label="CONTENT.step5.actionNext"
        @back="subStep = 1"
        @next="subStep = 3"
      />
    </template>

    <!-- subStep 3: 今週のプラン -->
    <template v-else-if="subStep === 3">
      <h2>{{ CONTENT.step5.weekTitle }}</h2>
      <p>
        {{ CONTENT.step5.weekLead }}<strong>{{ CONTENT.step5.weekLeadStrong }}</strong>{{ CONTENT.step5.weekLeadTail }}
      </p>
      <textarea
        v-model="weekPlan"
        :placeholder="CONTENT.step5.weekPlaceholder"
        style="min-height: 140px"
      />
      <p class="tiny muted">{{ CONTENT.step5.weekNote }}</p>
      <NavButtons
        can-back
        can-next
        :next-label="CONTENT.step5.completeButton"
        :next-disabled="!weekPlan.trim()"
        @back="subStep = 2"
        @next="finish"
      />
    </template>

    <!-- subStep 4: 完了 -->
    <template v-else>
      <h2 class="center">{{ CONTENT.step5.done.icon }} {{ CONTENT.step5.done.title }}</h2>
      <p class="center">{{ CONTENT.step5.done.body1 }}</p>
      <p class="center muted">{{ CONTENT.step5.done.body2 }}</p>

      <hr class="sep" />

      <h3>{{ CONTENT.step5.done.cardTitle }}</h3>
      <ul>
        <li v-for="dim in CONTENT.questions.dimensions" :key="dim.id">
          <strong :class="`color-${dim.id}`">{{ dim.icon }} {{ state.dialogue[`step4:${dim.id}:keyword`] || dim.label }}</strong>
        </li>
      </ul>

      <h3>{{ CONTENT.step5.done.weekTitle }}</h3>
      <p style="white-space: pre-wrap">{{ weekPlan }}</p>

      <h3>{{ CONTENT.step5.done.ideasTitle }}</h3>
      <p>
        <strong>{{ CONTENT.step5.done.ideaLabels.craftExperiments }}</strong><br />
        <span style="white-space: pre-wrap">{{ state.actions.craftExperiments }}</span>
      </p>
      <p>
        <strong>{{ CONTENT.step5.done.ideaLabels.shiftConnections }}</strong><br />
        <span style="white-space: pre-wrap">{{ state.actions.shiftConnections }}</span>
      </p>
      <p>
        <strong>{{ CONTENT.step5.done.ideaLabels.makeSense }}</strong><br />
        <span style="white-space: pre-wrap">{{ state.actions.makeSense }}</span>
      </p>
    </template>
  </AppCard>
</template>
