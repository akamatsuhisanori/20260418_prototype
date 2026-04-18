<script setup lang="ts">
defineProps<{ soft?: boolean }>();
</script>

<template>
  <section class="card" :class="{ 'card--soft': soft }">
    <slot />
  </section>
</template>
