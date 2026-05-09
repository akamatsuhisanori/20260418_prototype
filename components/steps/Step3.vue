<script setup lang="ts">
// ============================================================
// Step 3：写真をもとに重要な経験を詳細に想起（旧ブロック 3 後半）
//   3 つの問い：
//     1. 何が映っている写真を選択しましたか？
//     2. なぜその写真を選択しましたか？
//     3. 写真を選ぶプロセスで迷った度合い（1-7）
//   入力制約なし：未入力でも次へ進める。
// ============================================================
import { CONTENT } from "~/content/assessment";

const emit = defineEmits<{ (e: "back"): void; (e: "next"): void }>();
const { state, mutate } = useAssessmentState();

const setDescription = (v: string) =>
  mutate((s) => {
    s.block3.photoDescription = v.slice(0, CONTENT.block3.describeMaxLength);
  });
const setReason = (v: string) =>
  mutate((s) => {
    s.block3.photoReason = v.slice(0, CONTENT.block3.reasonMaxLength);
  });
const setHesitation = (v: number) =>
  mutate((s) => {
    s.block3.photoHesitation = v;
  });
</script>

<template>
  <AppCard>
    <h2>{{ CONTENT.step3.title }}</h2>
    <p class="muted">{{ CONTENT.block3.describeIntro }}</p>

    <!-- Q1: 何が映っているか -->
    <div class="card card--soft" style="margin-top: 16px">
      <p style="margin: 0 0 4px"><strong>{{ CONTENT.block3.describeQuestion }}</strong></p>
      <p class="small muted" style="margin: 0 0 12px">
        {{ CONTENT.block3.describeHint }}
      </p>
      <textarea
        :value="state.block3.photoDescription"
        :placeholder="CONTENT.block3.describePlaceholder"
        :maxlength="CONTENT.block3.describeMaxLength"
        style="min-height: 140px"
        @input="setDescription(($event.target as HTMLTextAreaElement).value)"
      />
      <p class="tiny muted">
        {{ state.block3.photoDescription.length }} / {{ CONTENT.block3.describeMaxLength }} 字
      </p>
    </div>

    <!-- Q2: なぜ選んだか -->
    <div class="card card--soft" style="margin-top: 16px">
      <p style="margin: 0 0 12px">
        <strong>{{ CONTENT.block3.reasonQuestion }}</strong>
      </p>
      <textarea
        :value="state.block3.photoReason"
        :placeholder="CONTENT.block3.reasonPlaceholder"
        :maxlength="CONTENT.block3.reasonMaxLength"
        style="min-height: 140px"
        @input="setReason(($event.target as HTMLTextAreaElement).value)"
      />
      <p class="tiny muted">
        {{ state.block3.photoReason.length }} / {{ CONTENT.block3.reasonMaxLength }} 字
      </p>
    </div>

    <!-- Q3: 迷った度合い 1-7 -->
    <div class="card card--soft" style="margin-top: 16px">
      <p style="margin: 0 0 12px">
        <strong>{{ CONTENT.block3.hesitationQuestion }}</strong>
      </p>
      <div class="row" style="gap: 12px; flex-wrap: nowrap">
        <span class="tiny muted" style="white-space: nowrap">
          {{ CONTENT.block3.hesitationLow }}
        </span>
        <div class="row" style="gap: 8px; flex: 1; justify-content: center">
          <label
            v-for="v in 7"
            :key="v"
            class="row"
            style="flex-direction: column; gap: 2px; font-weight: 400; align-items: center"
          >
            <input
              type="radio"
              name="block3-hesitation"
              :checked="state.block3.photoHesitation === v"
              @change="setHesitation(v)"
            />
            <span class="tiny">{{ v }}</span>
          </label>
        </div>
        <span class="tiny muted" style="white-space: nowrap">
          {{ CONTENT.block3.hesitationHigh }}
        </span>
      </div>
    </div>

    <NavButtons
      can-back
      can-next
      :next-label="CONTENT.block3.describeNextLabel"
      @back="emit('back')"
      @next="emit('next')"
    />
  </AppCard>
</template>
