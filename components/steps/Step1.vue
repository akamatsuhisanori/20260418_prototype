<script setup lang="ts">
import { CONTENT } from "~/content/assessment";

const emit = defineEmits<{ (e: "back"): void; (e: "next"): void }>();

const { state, mutate, isOrgComplete } = useAssessmentState();

const canProceed = computed(
  () => isOrgComplete("past") && isOrgComplete("current"),
);

const setOrg = (phase: "past" | "current", idx: number, value: string) => {
  mutate((s) => {
    s.orgs[phase][idx] = value;
  });
};
</script>

<template>
  <AppCard>
    <h2>{{ CONTENT.step1.title }}</h2>
    <p class="muted">{{ CONTENT.step1.description }}</p>
    <p class="small muted">{{ CONTENT.step1.hint }}</p>

    <div class="stack" style="margin-top: 24px">
      <div>
        <h3><span class="chip">{{ CONTENT.step1.pastBadge }}</span></h3>
        <div class="field" v-for="i in 3" :key="`p${i}`">
          <input
            type="text"
            :value="state.orgs.past[i - 1]"
            :placeholder="CONTENT.step1.placeholder"
            @input="setOrg('past', i - 1, ($event.target as HTMLInputElement).value)"
          />
        </div>
      </div>

      <hr class="sep" />

      <div>
        <h3>
          <span class="chip chip--accepted">{{ CONTENT.step1.currentBadge }}</span>
          <span style="margin-left: 8px" class="small muted">
            {{ CONTENT.step1.currentLabel }}
          </span>
        </h3>
        <div class="field" v-for="i in 3" :key="`c${i}`">
          <input
            type="text"
            :value="state.orgs.current[i - 1]"
            :placeholder="CONTENT.step1.placeholder"
            @input="setOrg('current', i - 1, ($event.target as HTMLInputElement).value)"
          />
        </div>
      </div>
    </div>

    <p v-if="!canProceed" class="small" style="color: var(--warn); margin-top: 20px">
      {{ CONTENT.step1.warning }}
    </p>

    <NavButtons
      can-back
      can-next
      :next-disabled="!canProceed"
      :next-label="CONTENT.step1.nextLabel"
      @back="emit('back')"
      @next="emit('next')"
    />
  </AppCard>
</template>
