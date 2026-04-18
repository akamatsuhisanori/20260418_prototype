<script setup lang="ts">
const props = defineProps<{
  total: number;
  current: number; // 0-based
}>();
</script>

<template>
  <div class="progress" :aria-label="`step ${current + 1} / ${total}`">
    <div
      v-for="i in total"
      :key="i"
      class="progress__seg"
      :class="{
        'progress__seg--active': i - 1 === current,
        'progress__seg--done': i - 1 < current,
      }"
    />
  </div>
</template>
