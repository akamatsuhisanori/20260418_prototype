<script setup lang="ts">
// ============================================================
// Step 2：重要な組織での自分を表す写真を選定（旧ブロック 3 前半）
//   - アップロードは求めない
//   - 入力制約なし：写真未選定でも次へ進める
//   - ページ滞在時間（秒）を計測し、「次へ」クリック時に
//     state.block3.photoSelectionSeconds に累積で加算する
// ============================================================
import { CONTENT } from "~/content/assessment";

const emit = defineEmits<{ (e: "back"): void; (e: "next"): void }>();
const { mutate, importantOrg } = useAssessmentState();

const orgName = computed(() => importantOrg.value?.name ?? "重要組織");

// クライアント側でのみ計測。SSR では時刻が異なるため触らない。
let startedAt = 0;

onMounted(() => {
  startedAt = Date.now();
});

const recordElapsed = () => {
  if (startedAt === 0) return;
  const elapsedSec = Math.round((Date.now() - startedAt) / 1000);
  if (elapsedSec <= 0) return;
  mutate((s) => {
    const cur = s.block3.photoSelectionSeconds || 0;
    s.block3.photoSelectionSeconds = cur + elapsedSec;
  });
  startedAt = 0; // 二重計上を防ぐ
};

const onNext = () => {
  recordElapsed();
  emit("next");
};

const onBack = () => {
  // 戻る場合は計測時間を保存しない（仕様：次へ遷移時のみ記録）
  startedAt = 0;
  emit("back");
};
</script>

<template>
  <AppCard>
    <h2>{{ CONTENT.step2.title }}</h2>
    <div style="padding: 64px 8px; text-align: center">
      <p style="font-size: 18px; line-height: 1.9">
        {{ CONTENT.block3.instructionLead }}<span class="accent">{{ orgName }}{{ CONTENT.block3.instructionOrgYouSuffix }}</span>{{ CONTENT.block3.instructionMid }}<span class="accent">{{ CONTENT.block3.instructionPhotoEmph }}</span>{{ CONTENT.block3.instructionTail }}
      </p>
    </div>

    <NavButtons
      can-back
      can-next
      :next-label="CONTENT.block3.nextLabel"
      @back="onBack"
      @next="onNext"
    />
  </AppCard>
</template>
