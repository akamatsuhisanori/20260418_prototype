<script setup lang="ts">
// Magic Link を踏んだ後の戻り先。
// @nuxtjs/supabase が cookie を自動セットするので、
// ここでは session を確認して / に飛ばすだけ。
definePageMeta({ layout: false });

const user = useSupabaseUser();

watch(
  user,
  (u) => {
    if (u) navigateTo("/");
  },
  { immediate: true },
);
</script>

<template>
  <div class="page page--narrow center">
    <AppCard>
      <p class="muted">ログイン処理中です...</p>
    </AppCard>
  </div>
</template>
