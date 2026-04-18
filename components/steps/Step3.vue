<script setup lang="ts">
import { CONTENT } from "~/content/assessment";

const emit = defineEmits<{ (e: "back"): void; (e: "next"): void }>();
const { state, gapScore, getTopOrg, identityScore } = useAssessmentState();

const topPast = computed(() => getTopOrg("past") ?? "");
const topCurrent = computed(() => getTopOrg("current") ?? "");

const gap = computed(() => {
  const p = topPast.value ? identityScore("past", topPast.value) : 0;
  const c = topCurrent.value ? identityScore("current", topCurrent.value) : 0;
  return p - c;
});

const gapMessage = computed(() => {
  const g = gap.value;
  if (g >= 3) return CONTENT.step3.gapTexts.high;
  if (g >= 1) return CONTENT.step3.gapTexts.mid;
  return CONTENT.step3.gapTexts.low;
});

const rows = computed(() => {
  const out: Array<{
    name: string;
    kind: string;
    identity: number;
    formation: number;
    freq: number;
  }> = [];
  (["past", "current"] as const).forEach((phase) => {
    state.value.orgs[phase].filter(Boolean).forEach((name) => {
      const dims = state.value.dimensions[phase]?.[name] ?? {};
      const formation =
        (CONTENT.questions.dimensions.reduce(
          (a, d) => a + (dims[d.id] ?? 0),
          0,
        ) /
          (CONTENT.questions.dimensions.length * 10)) *
        100;
      out.push({
        name,
        kind: phase === "past" ? "過去" : "現在",
        identity: identityScore(phase, name),
        formation,
        freq: state.value.frequencies[phase][name] ?? 0,
      });
    });
  });
  return out;
});
</script>

<template>
  <AppCard>
    <h2>{{ CONTENT.step3.title }}</h2>
    <p class="muted">{{ CONTENT.step3.description }}</p>

    <BubbleMap />

    <hr class="sep" />

    <h3>{{ CONTENT.step3.gapScoreLabel }}: {{ gap.toFixed(1) }}</h3>
    <p>
      <span class="small muted">{{ CONTENT.step3.gapTopPast }}</span>
      <strong>{{ topPast }}</strong>
      <span class="small muted" style="margin-left: 12px">{{ CONTENT.step3.gapTopCurrent }}</span>
      <strong>{{ topCurrent }}</strong>
    </p>
    <p>{{ gapMessage }}</p>

    <hr class="sep" />

    <table class="table">
      <thead>
        <tr>
          <th v-for="h in CONTENT.step3.tableHeaders" :key="h">{{ h }}</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="row in rows" :key="`${row.kind}-${row.name}`">
          <td>{{ row.name }}</td>
          <td>{{ row.kind }}</td>
          <td>{{ row.identity.toFixed(1) }}</td>
          <td>{{ row.formation.toFixed(0) }}%</td>
          <td>{{ row.freq }}</td>
        </tr>
      </tbody>
    </table>

    <p style="margin-top: 20px">
      {{ CONTENT.step3.transitionLead }}<strong>{{ topPast }}</strong>{{ CONTENT.step3.transitionBody1 }}
    </p>
    <p class="muted">
      {{ CONTENT.step3.transitionBody2A }}{{ topPast }}{{ CONTENT.step3.transitionBody2B }}
      {{ CONTENT.step3.transitionBody3 }}
      {{ CONTENT.step3.transitionBody4 }}
    </p>

    <NavButtons
      can-back
      can-next
      :next-label="CONTENT.step3.nextLabel"
      @back="emit('back')"
      @next="emit('next')"
    />
  </AppCard>
</template>
