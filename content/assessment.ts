// ============================================================
// Re:roots アセスメント定義
// ============================================================
//
// 【編集ガイド】
// 質問文・選択肢・ボタンラベル・説明文などは全てここに集約。
// ロジック（スコア計算・バブル配置）は utils/assessment.ts 側。
//
// 例：「帰属感の質問文を変えて」→ CONTENT.questions.org[0].desc
// 例：「新しい次元を追加して」  → CONTENT.questions.dimensions に追加
// 例：「Excel のシート名を変えて」→ CONTENT.excel.sheets
// ============================================================

export type OrgQuestion = { id: string; label: string; desc: string };
export type FrequencyOption = { value: number; label: string };
export type Dimension = {
  id: string;
  icon: string;
  label: string;
  rbs: string;
  rbsDesc: string;
  question: string;
  hint: string;
  keywordHint: string;
};
export type DialogueQuestion = {
  id: string;
  label: string;
  past: string;
  present: string;
  future: string;
  strategy: string;
  strategyKey: "craftExperiments" | "shiftConnections" | "makeSense";
};

export const CONTENT = {
  app: {
    name: "Re:roots",
    tagline1: "過去の組織経験から「自分らしさ」を解体し、",
    tagline2: "3人の自分との対話で行動の選択肢を見つける",
    headerSubtitle: "自分らしさを解体し、3人の自分との対話で行動の選択肢を見つける",
  },
  nav: {
    back: "← 戻る",
    next: "次へ →",
    progressLabels: ["棚卸し", "測定", "可視化", "解体", "行動"],
  },
  auth: {
    loginTitle: "ログイン",
    loginDescription: "登録したメールアドレスを入力してください。確認用のリンクをお送りします。",
    emailPlaceholder: "name@example.com",
    sendLink: "リンクを送る",
    sentHeader: "メールを確認してください",
    sentBody: "届いたリンクをクリックするとログインが完了します。",
    sendError: "送信に失敗しました。もう一度お試しください（未招待のメールアドレスは送信できません）",
    notInvited: "このメールアドレスは招待されていません。管理者に連絡してください。",
  },
  step0: {
    heading: "このアプリでできること",
    overview: [
      ["🏢", "Step 1", "過去・現在の所属組織を棚卸し"],
      ["📊", "Step 2", "各組織とのアイデンティティの強さを測定"],
      ["🗺️", "Step 3", "アイデンティティマップで隔たりを可視化"],
      ["🔍", "Step 4", "「自分らしさ」をポータブルな要素に解体する"],
      ["💬", "Step 5", "3人の自分との対話で行動の選択肢を発見"],
    ] as const,
    startButton: "はじめる →",
    continueButton: "続きから →",
  },
  step1: {
    title: "Step 1：組織の棚卸し",
    description: "これまで所属した組織・チーム・コミュニティを思いつく限り書き出してください。",
    hint: "（例：高校の部活、大学のゼミ、研究室、1社目の会社、サークルなど）",
    placeholder: "組織名を入力...",
    currentLabel: "現在所属中",
    addButton: "追加",
    emptyState: "組織をまだ追加していません",
    currentBadge: "現在",
    pastBadge: "過去",
    completeBadge: "✓ 測定済",
    warning: "※ 過去の組織と現在の組織がそれぞれ最低1つ必要です",
    nextLabel: "次へ：アイデンティティ測定 →",
  },
  step2: {
    title: "Step 2：アイデンティティ測定",
    description: "各組織について、あなたとの心理的なつながりを測定します。",
    rangeLow: "全く感じない",
    rangeHigh: "強く感じる",
    formationLabel: "人格形成度",
    formationDesc: "今の自分の性格・価値観・考え方を、この組織での経験がどのくらい形作っていると思いますか？",
    frequencyLabel: "現在の関わり頻度",
    frequencyDesc: "現在、この組織のメンバーとどのくらい関わっていますか？",
    prevOrg: "← 前の組織",
    nextOrg: "次の組織 →",
    nextLabel: "次へ：隔たりを可視化 →",
  },
  step3: {
    title: "Step 3：隔たりの可視化",
    description: "バブルの大きさ = アイデンティティの強さ、中心からの距離 = 現在の関わりの少なさ",
    gapScoreLabel: "隔たりスコア",
    gapTopPast: "アイデンティティ形成度トップ：",
    gapTopCurrent: "現在：",
    gapTexts: {
      high: "あなたが最も「自分らしい」と感じた環境と今の環境には大きな距離があります。次のステップで「自分らしさ」を具体的に解体し、今の環境や別の場でも発揮できる形に変換しましょう。",
      mid: "過去の経験と今の環境には一定の距離があるようです。次のステップで「自分らしさ」の具体的な要素を紐解いてみましょう。",
      low: "あなたの過去の経験と今の環境は比較的つながっています。次のステップでさらに深掘りし、自分らしさをより鮮明にしましょう。",
    },
    tableHeaders: ["組織", "種別", "IDスコア", "人格形成度", "関わり頻度"],
    transitionLead: "次のステップでは",
    transitionBody1: "での経験の中にある「自分らしさ」を具体的に紐解いていきます。",
    transitionBody2A: "「自分は【",
    transitionBody2B: "】の人間だ」という捉え方から、",
    transitionBody3: "「自分はこういう要素を大事にする人間だ」という捉え方に変えることで、",
    transitionBody4: "自分らしさを今の環境でも、別の場でも発揮できるようになります。",
    nextLabel: "次へ：自分らしさを紐解く →",
  },
  step4: {
    title: "Step 4：自分らしさを紐解く",
    introA: "「自分は【",
    introB: "】の人間だ」",
    introC: "という大きなかたまりを、特定の組織に依存しないポータブルな要素に分解していきます。",
    orgNameFallback: "その組織",
    episodePlaceholder: "具体的な場面・エピソードを自由に書いてください...",
    keywordPromptBefore: "【",
    keywordPromptAfter: "】にいた頃、",
    keywordCta: "→ これを一言で言うと？（組織名を使わずに）",
    keywordPlaceholder: "一言キーワード",
    cardTitle: "✨ あなたの「自分らしさ」カード",
    cardSubA: "「自分は【",
    cardSubB: "】の人間だ」ではなく——",
    cardFooter1: "——こういう要素を大事にする人間です。",
    cardFooter2: "これらは特定の組織に紐づくものではなく、今の環境でも別の場でも発揮できます。",
    nextLabel: "次へ：3人の自分と対話する →",
  },
  step5: {
    title: "Step 5：3人の自分と対話する",
    selectLead: "「自分らしさ」カードの中から、",
    selectLeadStrong: "今最も取り戻したい・深めたい要素を1つ",
    selectLeadTail: "選んでください。",
    selectHint: "（エピソードが長かったものが自動選択されています。変更可能です）",
    selectedState: "✓ 1つ選択中",
    notSelectedState: "1つ選んでください",
    selectNext: "次へ：対話を始める →",
    dialogueTitle: "Step 5：3人の自分の対話",
    dialogueDescription: "選んだ要素について、3人の自分が同じ問いに答えます。思いつくままに書いてください。",
    dialoguePlaceholder: "思いつくままに...",
    dialogueNext: "次へ：行動を考える →",
    actionTitle: "Step 5：行動の選択肢を考える",
    actionDescription1: "3人の自分の対話から見えてきたことをもとに、今後できる行動を考えてみましょう。",
    actionDescription2Pre: "3つの方向性のうち、",
    actionDescription2Strong: "どれか1つだけでも書けば十分",
    actionDescription2Post: "です。",
    actionSummaryTitle: "3人の自分の回答（振り返り）",
    actionPlaceholder: "自由に書いてください...",
    actionNext: "次へ：今週のプランを決める →",
    directions: [
      { key: "craftExperiments", label: "方向性A：今の環境で自分らしさを発揮する", strategy: "Craft Experiments（実験を作る）",        paletteKey: "primary", desc: "新しい活動や役割を、小さく安全に試してみる",            hint: "例：社内有志の勉強会を企画、副業で小さく試す、社内プロジェクトに手を挙げる" },
      { key: "shiftConnections", label: "方向性B：別の場で自分らしさを発揮する",   strategy: "Shift Connections（つながりを変える）", paletteKey: "accent",  desc: "新しい人間関係や環境に入る",                      hint: "例：過去の仲間に連絡を取り直す、同じ価値観のコミュニティを探す、転職を検討する" },
      { key: "makeSense",        label: "方向性C：自分のストーリーを紡ぎ直す",     strategy: "Make Sense（意味づけをする）",          paletteKey: "step5",   desc: "過去・現在・未来を振り返り、自分の物語を語り直す", hint: "例：3人の自分の回答を読み返して気づきをノートに書く、信頼できる人に話してみる" },
    ] as const,
    weekTitle: "Step 5：今週のプラン",
    weekLead: "ここまでの気づきを踏まえて、",
    weekLeadStrong: "今週1つだけ試してみること",
    weekLeadTail: "を書いてください。小さなことで構いません。",
    weekCardTitle: "あなたの「自分らしさ」カード（振り返り）",
    weekPlaceholder: "例：今週中に、前職の同期の○○さんにLINEしてランチの予定を立てる\n例：社内で有志の勉強会を企画するためのメンバーに声をかける",
    weekNote: "※ 行動するかどうかはあなた次第です。このアプリは、あなたが自分で考え、動き出すきっかけを提供するものです。",
    completeButton: "完了 ✓",
    submitSuccess: "回答を送信しました。お疲れさまでした！",
    backToEdit: "← 編集に戻る",
    done: {
      icon: "🌱",
      title: "お疲れさまでした！",
      body1: "あなたの「自分らしさ」の輪郭が少しクリアになったはずです。",
      body2: "小さな一歩が、自分らしさを取り戻す最初の起点になります。",
      cardTitle: "あなたの「自分らしさ」カード",
      weekTitle: "今週のプラン",
      ideasTitle: "行動アイデア",
      ideaLabels: {
        craftExperiments: "▶ 現職内で発揮（Craft Experiments）",
        shiftConnections: "▶ 別の場で発揮（Shift Connections）",
        makeSense: "▶ 意味づけをする（Make Sense）",
      },
    },
    personLabels: {
      past: (orgName: string) => `過去の自分（【${orgName}】頃）`,
      present: () => "今の自分",
      future: () => "未来の理想の自分（5年後）",
    },
    personShort: { past: "過去", present: "今", future: "未来" },
  },
  questions: {
    org: [
      { id: "belonging", label: "帰属感",        desc: "この組織のトラブルは、自分のトラブルでもあると感じる" },
      { id: "emotion",   label: "感情的結びつき", desc: "この組織が褒められると、自分も褒められたように感じる" },
      { id: "defense",   label: "防衛反応",       desc: "この組織が批判されると、自分も侮辱されたように感じる" },
      { id: "interest",  label: "関心度",         desc: "この組織に対して、今も大きな関心がある" },
    ] as OrgQuestion[],
    frequency: [
      { value: 5, label: "ほぼ毎日" },
      { value: 4, label: "週1回程度" },
      { value: 3, label: "月1回程度" },
      { value: 2, label: "年数回" },
      { value: 1, label: "ほとんどない" },
    ] as FrequencyOption[],
    dimensions: [
      {
        id: "affective",
        icon: "🔥", label: "没頭と意味", rbs: "情動的資源（Affective Resources）",
        rbsDesc: "ポジティブな感情・自己肯定感・仕事への充実感",
        question: "時間を忘れるほど没頭でき、心から意味を感じていた活動や瞬間はどんなものでしたか？",
        hint: "どんな仕事・プロジェクト・場面か。「これには意味がある」と感じた理由も含めて",
        keywordHint: "例：「目的志向のチームでの議論と成果物づくり」",
      },
      {
        id: "relational",
        icon: "🤝", label: "つながりと居場所", rbs: "関係的資源（Relational Resources）",
        rbsDesc: "信頼関係・承認・所属感・つながりの質",
        question: "周囲から認められ、「ここが自分の場所だ」と感じていた理由は何でしたか？",
        hint: "どんな人間関係・文化・環境の中にいたか。どう見られていたか",
        keywordHint: "例：「対等に意見を出し合える文化と深い信頼関係」",
      },
      {
        id: "agentic",
        icon: "⚡", label: "主体性と手応え", rbs: "エージェンシー資源（Agentic Resources）",
        rbsDesc: "自律性・自己効力感・行動が成果に結びつく感覚",
        question: "自分の意志で主体的に動き、行動が成果に結びついて手応えを感じていた場面はどんな時でしたか？",
        hint: "任されていた役割・裁量の範囲・どんな成果・貢献があったか",
        keywordHint: "例：「裁量を持ってプロジェクトを動かし、チームの成果に直接貢献する」",
      },
    ] as Dimension[],
    dialogue: [
      {
        id: "activity", label: "どんな活動をしていますか？",
        past:    "その頃、この要素を発揮するために、どんな活動をしていましたか？",
        present: "今、この要素を発揮するために、どんな活動をしていますか？",
        future:  "未来の理想の状態では、どんな活動をしていたいですか？",
        strategy: "Craft Experiments（実験を作る）", strategyKey: "craftExperiments",
      },
      {
        id: "people", label: "支えてくれる人は誰ですか？",
        past:    "その頃、この要素を理解し、支えてくれていた人は誰でしたか？",
        present: "今、この要素を理解し、支えてくれている人は誰ですか？",
        future:  "未来の理想の状態では、どんな人に囲まれていたいですか？",
        strategy: "Shift Connections（つながりを変える）", strategyKey: "shiftConnections",
      },
      {
        id: "meaning_q", label: "どんな意味を持っていますか？",
        past:    "その頃、この要素はあなたの人生でどんな意味を持っていましたか？",
        present: "今、この要素はあなたの人生でどんな意味を持っていますか？",
        future:  "未来、この要素にどんな意味を持たせたいですか？",
        strategy: "Make Sense（意味づけをする）", strategyKey: "makeSense",
      },
    ] as DialogueQuestion[],
  },
  bubble: {
    rings: [
      { scale: 0.30, label: "深い関わり", op: 0.25 },
      { scale: 0.55, label: "中程度",     op: 0.18 },
      { scale: 0.80, label: "薄い関わり", op: 0.12 },
    ],
    selfLabel: "自分",
    legend: [
      { paletteKey: "pastBubble", label: "過去の組織" },
      { paletteKey: "currentBubble", label: "現在の組織" },
    ],
    legendCaption: "円の大きさ = アイデンティティの強さ",
    tooltipLabels: {
      identity: "IDスコア",
      formation: "人格形成度",
      frequency: "関わり頻度",
    },
  },
  admin: {
    dashboardTitle: "管理画面",
    invitationsLink: "招待管理",
    exportLink: "CSV / Excel ダウンロード",
    importLabel: "Excel から回答をインポート（管理者のみ）",
    inviteEmailPlaceholder: "招待するメールアドレス",
    inviteAdd: "招待を追加",
    inviteSend: "リンク送信",
    inviteResend: "再送",
    inviteRevoke: "失効",
    csvDownload: "CSV でダウンロード（wide）",
    xlsxDownload: "Excel でダウンロード（4シート）",
    inviteStatus: { invited: "招待済", sent: "送信済", accepted: "ログイン済", submitted: "提出済", revoked: "失効" },
  },
  excel: {
    fileName: "reroots_v2_回答データ.xlsx",
    sheets: { orgs: "組織データ", identity: "自分らしさの解体", dialogue: "3人の対話", action: "行動プラン" },
    orgHeaders: [
      "回答者メール", "組織名", "種別(現在/過去)",
      "帰属感(1-10)", "感情的結びつき(1-10)", "防衛反応(1-10)", "関心度(1-10)",
      "人格形成度(0-100%)", "関わり頻度(1-5)",
    ],
    identityHeaders: ["回答者メール", "対象組織", "次元", "RBS資源", "エピソード記述", "一言キーワード"],
    dialogueHeaders: ["回答者メール", "次元", "質問", "過去の自分", "今の自分", "未来の自分"],
    actionHeaders: ["回答者メール", "戦略/項目", "内容"],
    actionRows: {
      craftExperiments: "Craft Experiments（現職内で発揮）",
      shiftConnections: "Shift Connections（別の場で発揮）",
      makeSense: "Make Sense（意味づけ）",
    },
    weeklyRowLabel: "今週のプラン",
  },
} as const;

// カラーパレット（CSS 変数相当）
export const COLORS = {
  primary: "#4F46E5", pl: "#818CF8", pbg: "#EEF2FF",
  accent: "#10B981", al: "#6EE7B7", abg: "#ECFDF5",
  warn: "#F59E0B", wbg: "#FFFBEB",
  danger: "#EF4444",
  bg: "#F9FAFB", card: "#FFFFFF",
  text: "#111827", sub: "#6B7280", border: "#E5E7EB",
  step4: "#7C3AED", step4bg: "#F5F3FF", step4l: "#C4B5FD",
  step5: "#0891B2", step5bg: "#ECFEFF", step5l: "#A5F3FC",
  pastBubble: "#6366F1", pastBubbleMid: "#4F46E5", pastBubbleDark: "#3730A3",
  currentBubble: "#10B981", currentBubbleMid: "#059669", currentBubbleDark: "#047857",
} as const;

export type Palette = typeof COLORS;
