<script setup lang="ts">
// ============================================================
// ブロック 1：過去・現在の所属組織を棚卸し
//   - 最大 8 個まで追加
//   - 名前 + 過去/現在タグを必須入力
//   - 年代ヒントは折りたたみ可能（デフォルト展開）
// ============================================================
import { CONTENT } from "~/content/assessment";
import type { Organization } from "~/types/database.types";

const emit = defineEmits<{ (e: "back"): void; (e: "next"): void }>();
const { state, mutate } = useAssessmentState();

const hintOpen = ref(true);

const orgs = computed(() => state.value.organizations);

// 新規 ID は max(id)+1
const nextId = () => {
  const ids = orgs.value.map((o) => o.id);
  return ids.length === 0 ? 1 : Math.max(...ids) + 1;
};

const addOrg = () => {
  if (orgs.value.length >= CONTENT.block1.maxOrgs) return;
  mutate((s) => {
    s.organizations.push({ id: nextId(), name: "", tag: "past" });
  });
};

// 初期表示時、空なら 1 行追加しておく
onMounted(() => {
  if (orgs.value.length === 0) addOrg();
});

const setName = (id: number, name: string) =>
  mutate((s) => {
    const o = s.organizations.find((x) => x.id === id);
    if (o) o.name = name.slice(0, CONTENT.block1.nameMaxLength);
  });

const setTag = (id: number, tag: "past" | "current") =>
  mutate((s) => {
    const o = s.organizations.find((x) => x.id === id);
    if (o) o.tag = tag;
  });

const removeOrg = (id: number) =>
  mutate((s) => {
    s.organizations = s.organizations.filter((o) => o.id !== id);
    // 関連する scores も消す
    delete s.scores[String(id)];
    if (s.selectedOrgId === id) {
      s.selectedOrgId = null;
      s.selectedOrgManual = false;
    }
  });

const filledOrgs = computed(() =>
  orgs.value.filter((o) => o.name.trim().length > 0),
);
const tagMissing = computed(() =>
  filledOrgs.value.some((o) => o.tag !== "past" && o.tag !== "current"),
);
const currentCount = computed(
  () => filledOrgs.value.filter((o) => o.tag === "current").length,
);
const pastCount = computed(
  () => filledOrgs.value.filter((o) => o.tag === "past").length,
);

const canProceed = computed(
  () => filledOrgs.value.length >= 1 && !tagMissing.value,
);

const tryNext = () => {
  if (!canProceed.value) return;
  if (currentCount.value === 0) {
    if (!confirm(CONTENT.block1.warningCurrentZero)) return;
  }
  emit("next");
};
</script>

<template>
  <AppCard>
    <h2>{{ CONTENT.block1.title }}</h2>
    <div class="stack">
      <p v-for="(line, i) in CONTENT.block1.instruction" :key="i" class="muted">
        {{ line }}
      </p>
    </div>

    <!-- 年代ヒント -->
    <div class="card card--soft" style="margin-top: 16px">
      <div class="row" style="cursor: pointer" @click="hintOpen = !hintOpen">
        <strong>{{ CONTENT.block1.hintTitle }}</strong>
        <span style="margin-left: auto">{{ hintOpen ? "▲" : "▼" }}</span>
      </div>
      <div v-if="hintOpen" class="stack" style="margin-top: 12px">
        <div v-for="g in CONTENT.block1.hintGroups" :key="g.age">
          <div class="small"><strong>【{{ g.age }}】</strong></div>
          <div class="small muted">{{ g.examples }}</div>
        </div>
      </div>
    </div>

    <!-- 入力欄 -->
    <h3 style="margin-top: 24px">{{ CONTENT.block1.inputHeader }}</h3>
    <p class="small muted">{{ CONTENT.block1.inputDescription }}</p>

    <div class="stack">
      <div
        v-for="o in orgs"
        :key="o.id"
        class="card card--soft"
        style="padding: 16px"
      >
        <div class="field">
          <input
            type="text"
            :value="o.name"
            :placeholder="CONTENT.block1.namePlaceholder"
            :maxlength="CONTENT.block1.nameMaxLength"
            @input="setName(o.id, ($event.target as HTMLInputElement).value)"
          />
        </div>
        <div class="row" style="gap: 16px">
          <label class="row" style="gap: 4px; font-weight: 400">
            <input
              type="radio"
              :name="`tag-${o.id}`"
              :checked="o.tag === 'past'"
              @change="setTag(o.id, 'past')"
            />
            <span>{{ CONTENT.block1.pastLabel }}</span>
          </label>
          <label class="row" style="gap: 4px; font-weight: 400">
            <input
              type="radio"
              :name="`tag-${o.id}`"
              :checked="o.tag === 'current'"
              @change="setTag(o.id, 'current')"
            />
            <span>{{ CONTENT.block1.currentLabel }}</span>
          </label>
          <button
            type="button"
            class="btn btn--ghost small"
            style="margin-left: auto"
            @click="removeOrg(o.id)"
          >
            {{ CONTENT.block1.deleteButton }}
          </button>
        </div>
      </div>
    </div>

    <button
      type="button"
      class="btn"
      :disabled="orgs.length >= CONTENT.block1.maxOrgs"
      style="margin-top: 12px"
      @click="addOrg"
    >
      {{ CONTENT.block1.addButton }}
    </button>

    <p class="small muted" style="margin-top: 12px">
      {{ CONTENT.block1.countLabel(orgs.length, CONTENT.block1.maxOrgs) }}
    </p>

    <p
      v-if="tagMissing"
      class="small"
      style="color: var(--warn); margin-top: 12px"
    >
      {{ CONTENT.block1.warningTagMissing }}
    </p>
    <p
      v-if="filledOrgs.length > 0 && pastCount === 0"
      class="small muted"
      style="margin-top: 8px"
    >
      {{ CONTENT.block1.warningPastZero }}
    </p>

    <NavButtons
      can-back
      can-next
      :next-disabled="!canProceed"
      :next-label="CONTENT.block1.nextLabel"
      @back="emit('back')"
      @next="tryNext"
    />
  </AppCard>
</template>
