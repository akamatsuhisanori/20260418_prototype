<script setup lang="ts">
import { CONTENT } from "~/content/assessment";

const emit = defineEmits<{ (e: "back"): void; (e: "next"): void }>();

const { state, mutate } = useAssessmentState();

const orgList = computed(() => [
  ...state.value.orgs.past
    .filter(Boolean)
    .map((name) => ({ phase: "past" as const, name })),
  ...state.value.orgs.current
    .filter(Boolean)
    .map((name) => ({ phase: "current" as const, name })),
]);

const index = useState<number>("reroots-step2-index", () => 0);
const current = computed(() => orgList.value[index.value]);

const getDimValue = (dimKey: string) =>
  current.value &&
  state.value.dimensions[current.value.phase]?.[current.value.name]?.[dimKey] || 0;

const setDim = (dimKey: string, value: number) => {
  if (!current.value) return;
  mutate((s) => {
    const phaseMap = s.dimensions[current.value!.phase];
    if (!phaseMap[current.value!.name]) phaseMap[current.value!.name] = {};
    phaseMap[current.value!.name][dimKey] = value;
  });
};

const freqValue = computed(() =>
  current.value
    ? state.value.frequencies[current.value.phase][current.value.name] || 0
    : 0,
);
const setFreq = (value: number) => {
  if (!current.value) return;
  mutate((s) => {
    s.frequencies[current.value!.phase][current.value!.name] = value;
  });
};

const orgComplete = (o: { phase: "past" | "current"; name: string }) => {
  const dims = state.value.dimensions[o.phase]?.[o.name];
  if (!dims) return false;
  if (CONTENT.questions.dimensions.some((d) => !dims[d.id])) return false;
  if (!state.value.frequencies[o.phase][o.name]) return false;
  return true;
};

const allComplete = computed(() => orgList.value.every(orgComplete));

const next = () => {
  if (index.value < orgList.value.length - 1) {
    index.value += 1;
  } else {
    emit("next");
  }
};
const back = () => {
  if (index.value > 0) {
    index.value -= 1;
  } else {
    emit("back");
  }
};
</script>

<template>
  <AppCard>
    <h2>{{ CONTENT.step2.title }}</h2>
    <p class="muted">{{ CONTENT.step2.description }}</p>

    <div v-if="current" class="stack" style="margin-top: 24px">
      <div class="row">
        <span class="chip" :class="current.phase === 'current' ? 'chip--accepted' : ''">
          {{ current.phase === "current" ? CONTENT.step1.currentBadge : CONTENT.step1.pastBadge }}
        </span>
        <strong>{{ current.name }}</strong>
        <span class="small muted" style="margin-left: auto">
          {{ index + 1 }} / {{ orgList.length }}
        </span>
      </div>

      <div v-for="dim in CONTENT.questions.dimensions" :key="dim.id" class="field">
        <label>
          {{ dim.icon }} {{ dim.label }}
          <span class="small muted">（{{ dim.rbs }}）</span>
        </label>
        <p class="small muted" style="margin: 4px 0 8px">{{ dim.question }}</p>
        <div class="row">
          <span class="tiny muted">{{ CONTENT.step2.rangeLow }}</span>
          <input
            type="range"
            min="0"
            max="10"
            step="1"
            :value="getDimValue(dim.id)"
            @input="setDim(dim.id, Number(($event.target as HTMLInputElement).value))"
            style="flex: 1"
          />
          <span class="tiny muted">{{ CONTENT.step2.rangeHigh }}</span>
          <span style="width: 24px; text-align: right">
            <strong>{{ getDimValue(dim.id) }}</strong>
          </span>
        </div>
      </div>

      <div class="field">
        <label>{{ CONTENT.step2.frequencyLabel }}</label>
        <p class="small muted" style="margin: 4px 0 8px">
          {{ CONTENT.step2.frequencyDesc }}
        </p>
        <div class="row">
          <label
            v-for="opt in CONTENT.questions.frequency"
            :key="opt.value"
            class="row"
            style="gap: 4px; font-weight: 400"
          >
            <input
              type="radio"
              :checked="freqValue === opt.value"
              @change="setFreq(opt.value)"
            />
            <span>{{ opt.label }}</span>
          </label>
        </div>
      </div>
    </div>

    <NavButtons
      can-back
      can-next
      :next-disabled="!allComplete && index === orgList.length - 1"
      :back-label="index === 0 ? CONTENT.nav.back : CONTENT.step2.prevOrg"
      :next-label="index === orgList.length - 1 ? CONTENT.step2.nextLabel : CONTENT.step2.nextOrg"
      @back="back"
      @next="next"
    />
  </AppCard>
</template>
