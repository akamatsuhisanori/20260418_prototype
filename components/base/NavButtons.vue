<script setup lang="ts">
import { CONTENT } from "~/content/assessment";

const props = defineProps<{
  canBack?: boolean;
  canNext?: boolean;
  nextLabel?: string;
  backLabel?: string;
  nextDisabled?: boolean;
}>();

const emit = defineEmits<{
  (e: "back"): void;
  (e: "next"): void;
}>();
</script>

<template>
  <div class="btn-row">
    <button
      v-if="canBack"
      type="button"
      class="btn btn--ghost"
      @click="emit('back')"
    >
      {{ backLabel ?? CONTENT.nav.back }}
    </button>
    <span v-else />
    <div class="btn-right">
      <button
        v-if="canNext"
        type="button"
        class="btn btn--primary"
        :disabled="nextDisabled"
        @click="emit('next')"
      >
        {{ nextLabel ?? CONTENT.nav.next }}
      </button>
    </div>
  </div>
</template>
