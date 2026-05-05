<script setup lang="ts">
// ============================================================
// ブロック 3：写真を選ぶ
//   - アップロードは求めない
//   - 「○○のあなた」と「最も表現する写真」を強調表示
// ============================================================
import { CONTENT } from "~/content/assessment";

const emit = defineEmits<{ (e: "back"): void; (e: "next"): void }>();
const { importantOrg } = useAssessmentState();

const orgName = computed(() => importantOrg.value?.name ?? "重要組織");
</script>

<template>
  <AppCard>
    <h2>{{ CONTENT.block3.title }}</h2>
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
      @next="emit('next')"
    />
  </AppCard>
</template>
