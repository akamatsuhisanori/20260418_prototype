<script setup lang="ts">
import { CONTENT } from "~/content/assessment";

const emit = defineEmits<{ (e: "back"): void; (e: "next"): void }>();
const { state, mutate, getTopOrg } = useAssessmentState();

const orgName = computed(() => getTopOrg("past") || CONTENT.step4.orgNameFallback);

const keyFor = (dimId: string, kind: "episode" | "keyword") =>
  `step4:${dimId}:${kind}`;

const getDialogue = (dimId: string, kind: "episode" | "keyword") =>
  state.value.dialogue[keyFor(dimId, kind)] ?? "";

const setDialogue = (dimId: string, kind: "episode" | "keyword", v: string) => {
  mutate((s) => {
    s.dialogue[keyFor(dimId, kind)] = v;
  });
};

const allKeywordsFilled = computed(() =>
  CONTENT.questions.dimensions.every(
    (d) => getDialogue(d.id, "keyword").trim().length > 0,
  ),
);
</script>

<template>
  <AppCard>
    <h2>{{ CONTENT.step4.title }}</h2>
    <p>
      {{ CONTENT.step4.introA }}<strong>{{ orgName }}</strong>{{ CONTENT.step4.introB }}
    </p>
    <p class="muted">{{ CONTENT.step4.introC }}</p>

    <div
      v-for="dim in CONTENT.questions.dimensions"
      :key="dim.id"
      class="card card--soft"
      style="margin-top: 16px"
    >
      <h3>
        <span :class="`color-${dim.id}`">{{ dim.icon }}</span>
        {{ dim.label }}
        <span class="small muted">（{{ dim.rbs }}）</span>
      </h3>
      <p class="small muted">{{ dim.rbsDesc }}</p>
      <p>
        {{ CONTENT.step4.keywordPromptBefore }}{{ orgName
        }}{{ CONTENT.step4.keywordPromptAfter }}{{ dim.question }}
      </p>
      <p class="small muted">{{ dim.hint }}</p>

      <textarea
        :value="getDialogue(dim.id, 'episode')"
        :placeholder="CONTENT.step4.episodePlaceholder"
        @input="setDialogue(dim.id, 'episode', ($event.target as HTMLTextAreaElement).value)"
      />

      <p class="small muted" style="margin-top: 12px">
        {{ CONTENT.step4.keywordCta }}
      </p>
      <p class="small muted">{{ dim.keywordHint }}</p>
      <input
        type="text"
        :value="getDialogue(dim.id, 'keyword')"
        :placeholder="CONTENT.step4.keywordPlaceholder"
        @input="setDialogue(dim.id, 'keyword', ($event.target as HTMLInputElement).value)"
      />
    </div>

    <div v-if="allKeywordsFilled" class="card" style="margin-top: 20px">
      <h3>{{ CONTENT.step4.cardTitle }}</h3>
      <p>
        {{ CONTENT.step4.cardSubA }}{{ orgName }}{{ CONTENT.step4.cardSubB }}
      </p>
      <ul>
        <li
          v-for="dim in CONTENT.questions.dimensions"
          :key="dim.id"
        >
          <strong :class="`color-${dim.id}`">{{ dim.icon }} {{ getDialogue(dim.id, "keyword") }}</strong>
        </li>
      </ul>
      <p class="small muted">{{ CONTENT.step4.cardFooter1 }}</p>
      <p class="small muted">{{ CONTENT.step4.cardFooter2 }}</p>
    </div>

    <NavButtons
      can-back
      can-next
      :next-disabled="!allKeywordsFilled"
      :next-label="CONTENT.step4.nextLabel"
      @back="emit('back')"
      @next="emit('next')"
    />
  </AppCard>
</template>
