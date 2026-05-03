<script setup lang="ts">
// ============================================================
// ブロック 3：写真を選ぶ
//   - 写真のアップロードは求めない
//   - 「写真を選び終わったら次へ」のシンプルな 1 画面
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
      <p style="font-size: 18px; line-height: 1.8">
        {{ CONTENT.block3.instruction(orgName) }}
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
