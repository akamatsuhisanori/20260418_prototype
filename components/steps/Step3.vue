<script setup lang="ts">
// ============================================================
// ブロック 3：写真を選ぶ → 選んだ写真について書き出す
//   subStep 0: 写真選択（アップロードは求めない）
//   subStep 1: 写真の説明（1 問の自由記述）
// ============================================================
import { CONTENT } from "~/content/assessment";

const emit = defineEmits<{ (e: "back"): void; (e: "next"): void }>();
const { state, mutate, importantOrg } = useAssessmentState();

const orgName = computed(() => importantOrg.value?.name ?? "重要組織");

const subStep = computed({
  get: () => state.value.meta.subStep,
  set: (v: number) =>
    mutate((s) => {
      s.meta.subStep = v;
    }),
});

const setDescription = (v: string) =>
  mutate((s) => {
    s.block3.photoDescription = v.slice(0, CONTENT.block3.describeMaxLength);
  });

const describeFilled = computed(
  () => state.value.block3.photoDescription.trim().length > 0,
);
</script>

<template>
  <AppCard>
    <h2>{{ CONTENT.block3.title }}</h2>

    <!-- ============ subStep 0: 写真選択 ============ -->
    <template v-if="subStep === 0">
      <div style="padding: 64px 8px; text-align: center">
        <p style="font-size: 18px; line-height: 1.9">
          {{ CONTENT.block3.instructionLead }}<span class="accent">{{ orgName }}{{ CONTENT.block3.instructionOrgYouSuffix }}</span>{{ CONTENT.block3.instructionMid }}<span class="accent">{{ CONTENT.block3.instructionPhotoEmph }}</span>{{ CONTENT.block3.instructionTail }}
        </p>
      </div>

      <NavButtons
        can-back
        can-next
        :next-label="CONTENT.block3.nextLabel"
        @back="emit('back')"
        @next="subStep = 1"
      />
    </template>

    <!-- ============ subStep 1: 写真の説明 ============ -->
    <template v-else>
      <h3>{{ CONTENT.block3.describeTitle }}</h3>
      <p class="muted">{{ CONTENT.block3.describeIntro }}</p>

      <div class="card card--soft" style="margin-top: 16px">
        <p style="margin: 0 0 4px"><strong>{{ CONTENT.block3.describeQuestion }}</strong></p>
        <p class="small muted" style="margin: 0 0 12px">
          {{ CONTENT.block3.describeHint }}
        </p>
        <textarea
          :value="state.block3.photoDescription"
          :placeholder="CONTENT.block3.describePlaceholder"
          :maxlength="CONTENT.block3.describeMaxLength"
          style="min-height: 160px"
          @input="setDescription(($event.target as HTMLTextAreaElement).value)"
        />
        <p class="tiny muted">
          {{ state.block3.photoDescription.length }} / {{ CONTENT.block3.describeMaxLength }} 字
        </p>
      </div>

      <NavButtons
        can-back
        can-next
        :next-disabled="!describeFilled"
        :next-label="CONTENT.block3.describeNextLabel"
        @back="subStep = 0"
        @next="emit('next')"
      />
    </template>
  </AppCard>
</template>
