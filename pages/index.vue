<script setup lang="ts">
// 管理者向けトップページ。回答者はトークン URL から /assessment/[token] に直接アクセス。
import { CONTENT } from "~/content/assessment";

const user = useSupabaseUser();
const supabase = useSupabaseClient();

const signOut = async () => {
  await supabase.auth.signOut();
  await navigateTo("/login");
};
</script>

<template>
  <div class="page page--narrow">
    <header class="row" style="margin-bottom: 24px">
      <h1 style="margin: 0">{{ CONTENT.app.name }}</h1>
      <span class="small muted" style="margin-left: auto">{{ user?.email }}</span>
    </header>

    <AppCard soft>
      <h3>{{ CONTENT.admin.dashboardTitle }}</h3>
      <div class="row">
        <NuxtLink to="/admin" class="btn">管理ダッシュボード</NuxtLink>
        <NuxtLink to="/admin/respondents" class="btn">{{ CONTENT.admin.respondentsLink }}</NuxtLink>
        <NuxtLink to="/admin/export" class="btn">{{ CONTENT.admin.exportLink }}</NuxtLink>
      </div>
    </AppCard>

    <div class="row row--end" style="margin-top: 24px">
      <button type="button" class="btn btn--ghost small" @click="signOut">
        ログアウト
      </button>
    </div>
  </div>
</template>
