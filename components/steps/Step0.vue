<script setup lang="ts">
import { CONTENT } from "~/content/assessment";

const emit = defineEmits<{ (e: "start"): void }>();
const { submitted, state } = useAssessmentState();

const hasProgress = computed(
  () =>
    state.value.meta.step > 0 ||
    state.value.organizations.length > 0,
);
</script>

<template>
  <AppCard>
    <h1>{{ CONTENT.app.name }}</h1>
    <p class="muted">{{ CONTENT.app.tagline1 }}</p>
    <p class="muted">{{ CONTENT.app.tagline2 }}</p>

    <h2 style="margin-top: 32px">{{ CONTENT.step0.heading }}</h2>
    <div class="stack">
      <div
        v-for="(row, i) in CONTENT.step0.overview"
        :key="i"
        class="row"
        style="align-items: flex-start"
      >
        <div style="font-size: 24px; width: 40px">{{ row[0] }}</div>
        <div class="grow">
          <strong>{{ row[1] }}</strong>
          <div class="small muted">{{ row[2] }}</div>
        </div>
      </div>
    </div>

    <div class="btn-row">
      <span />
      <div class="btn-right">
        <button type="button" class="btn btn--primary" @click="emit('start')">
          {{ hasProgress && !submitted ? CONTENT.step0.continueButton : CONTENT.step0.startButton }}
        </button>
      </div>
    </div>
  </AppCard>
</template>
