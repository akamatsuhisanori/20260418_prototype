<script setup lang="ts">
// ============================================================
// BubbleMap.vue
//   中心（＝自分）からの距離 = 現在の関わりの少なさ
//   バブルの大きさ = identityScore
//   色 = past or current
// ============================================================
import { CONTENT, COLORS } from "~/content/assessment";

const { state, identityScore } = useAssessmentState();

type Bubble = {
  phase: "past" | "current";
  name: string;
  identity: number;
  formation: number;
  freq: number;
};

const bubbles = computed<Bubble[]>(() => {
  const out: Bubble[] = [];
  const collect = (phase: "past" | "current") => {
    state.value.orgs[phase].filter(Boolean).forEach((name) => {
      const dims = state.value.dimensions[phase]?.[name];
      const freq = state.value.frequencies[phase][name] || 0;
      if (!dims) return;
      out.push({
        phase,
        name,
        identity: identityScore(phase, name),
        formation:
          (CONTENT.questions.dimensions.reduce(
            (a, d) => a + (dims[d.id] ?? 0),
            0,
          ) /
            (CONTENT.questions.dimensions.length * 10)) *
          100,
        freq,
      });
    });
  };
  collect("past");
  collect("current");
  return out;
});

const SIZE = 420;
const CX = SIZE / 2;
const CY = SIZE / 2;

// 関わり頻度が少ない (=1) ほど中心から遠ざける
const distanceFor = (freq: number) => {
  const base = Math.max(1, 6 - freq); // 5→1, 4→2, ... 1→5
  return (base / 5) * (SIZE * 0.42);
};
const radiusFor = (identity: number) => 8 + identity * 2.4;

const layout = computed(() => {
  // 各 phase ごとに円周上に均等配置
  const n = bubbles.value.length;
  return bubbles.value.map((b, i) => {
    const angle = (i / Math.max(n, 1)) * Math.PI * 2;
    const d = distanceFor(b.freq);
    return {
      ...b,
      x: CX + Math.cos(angle) * d,
      y: CY + Math.sin(angle) * d,
      r: radiusFor(b.identity),
    };
  });
});

const colorFor = (phase: "past" | "current") =>
  phase === "past" ? COLORS.pastBubble : COLORS.currentBubble;
</script>

<template>
  <div class="center">
    <svg :viewBox="`0 0 ${SIZE} ${SIZE}`" style="max-width: 100%; height: auto">
      <!-- rings -->
      <circle
        v-for="(ring, i) in CONTENT.bubble.rings"
        :key="i"
        :cx="CX"
        :cy="CY"
        :r="SIZE * 0.42 * ring.scale"
        fill="none"
        stroke="#CBD5E1"
        :stroke-opacity="ring.op"
        stroke-dasharray="4 4"
      />
      <!-- self -->
      <circle :cx="CX" :cy="CY" r="10" fill="#1f2937" />
      <text :x="CX" :y="CY + 22" text-anchor="middle" font-size="11" fill="#1f2937">
        {{ CONTENT.bubble.selfLabel }}
      </text>
      <!-- bubbles -->
      <g v-for="b in layout" :key="`${b.phase}-${b.name}`">
        <title>
          {{ b.name }} ({{ b.phase === "past" ? "過去" : "現在" }})
          — {{ CONTENT.bubble.tooltipLabels.identity }}: {{ b.identity.toFixed(1) }},
          {{ CONTENT.bubble.tooltipLabels.formation }}: {{ b.formation.toFixed(0) }}%,
          {{ CONTENT.bubble.tooltipLabels.frequency }}: {{ b.freq }}
        </title>
        <circle :cx="b.x" :cy="b.y" :r="b.r" :fill="colorFor(b.phase)" fill-opacity="0.7" />
        <text :x="b.x" :y="b.y + b.r + 12" text-anchor="middle" font-size="11" fill="#334155">
          {{ b.name }}
        </text>
      </g>
    </svg>
    <div class="row" style="justify-content: center; gap: 16px; margin-top: 8px">
      <span v-for="lg in CONTENT.bubble.legend" :key="lg.label" class="row" style="gap: 4px">
        <span
          style="width: 12px; height: 12px; border-radius: 50%; display: inline-block"
          :style="{ background: COLORS[lg.paletteKey as keyof typeof COLORS] as string }"
        />
        <span class="small">{{ lg.label }}</span>
      </span>
    </div>
    <p class="tiny muted">{{ CONTENT.bubble.legendCaption }}</p>
  </div>
</template>
