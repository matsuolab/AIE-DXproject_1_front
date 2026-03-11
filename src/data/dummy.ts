/**
 * ダミーデータ定義
 * API未接続時のフォールバック表示用
 */
import type {
  CourseItem,
  OverallTrendsResponse,
  SessionAnalysisResponse,
  YearComparisonResponse,
} from '../types/api';

// ===== ヘルパー =====

function ratingDistribution(counts: number[]) {
  return counts.map((count, i) => ({ rating: i + 1, count }));
}

// ===== 講座一覧 =====

export const dummyCourses: CourseItem[] = [
  {
    name: 'サンプル講座A（デモ用）',
    academic_year: 2024,
    term: '10月～12月',
    sessions: [
      { lecture_id: 9001, session: '第1回', lecture_date: '2024-10-05', analysis_types: ['preliminary', 'confirmed'] },
      { lecture_id: 9002, session: '第2回', lecture_date: '2024-10-19', analysis_types: ['preliminary', 'confirmed'] },
      { lecture_id: 9003, session: '第3回', lecture_date: '2024-11-02', analysis_types: ['preliminary', 'confirmed'] },
      { lecture_id: 9004, session: '第4回', lecture_date: '2024-11-16', analysis_types: ['preliminary', 'confirmed'] },
      { lecture_id: 9005, session: '第5回', lecture_date: '2024-11-30', analysis_types: ['preliminary', 'confirmed'] },
      { lecture_id: 9006, session: '特別回', lecture_date: '2024-12-14', analysis_types: ['confirmed'] },
    ],
  },
  {
    name: 'サンプル講座A（デモ用）',
    academic_year: 2023,
    term: '10月～12月',
    sessions: [
      { lecture_id: 8001, session: '第1回', lecture_date: '2023-10-07', analysis_types: ['confirmed'] },
      { lecture_id: 8002, session: '第2回', lecture_date: '2023-10-21', analysis_types: ['confirmed'] },
      { lecture_id: 8003, session: '第3回', lecture_date: '2023-11-04', analysis_types: ['confirmed'] },
      { lecture_id: 8004, session: '第4回', lecture_date: '2023-11-18', analysis_types: ['confirmed'] },
      { lecture_id: 8005, session: '第5回', lecture_date: '2023-12-02', analysis_types: ['confirmed'] },
    ],
  },
  {
    name: 'サンプル講座B（デモ用）',
    academic_year: 2024,
    term: '4月～6月',
    sessions: [
      { lecture_id: 9101, session: '第1回', lecture_date: '2024-04-13', analysis_types: ['preliminary', 'confirmed'] },
      { lecture_id: 9102, session: '第2回', lecture_date: '2024-04-27', analysis_types: ['preliminary', 'confirmed'] },
      { lecture_id: 9103, session: '第3回', lecture_date: '2024-05-11', analysis_types: ['preliminary', 'confirmed'] },
    ],
  },
];

// ===== 全体傾向 =====

export const dummyOverallTrends: OverallTrendsResponse = {
  lecture_info: [
    { lecture_id: 9001, session: '第1回', lecture_date: '2024-10-05', instructor_name: '山田 太郎', description: 'イントロダクション・講座概要' },
    { lecture_id: 9002, session: '第2回', lecture_date: '2024-10-19', instructor_name: '山田 太郎', description: '基礎理論と実践' },
    { lecture_id: 9003, session: '第3回', lecture_date: '2024-11-02', instructor_name: '佐藤 花子', description: 'ケーススタディ分析' },
    { lecture_id: 9004, session: '第4回', lecture_date: '2024-11-16', instructor_name: '佐藤 花子', description: '応用演習' },
    { lecture_id: 9005, session: '第5回', lecture_date: '2024-11-30', instructor_name: '山田 太郎', description: '総合ディスカッション' },
    { lecture_id: 9006, session: '特別回', lecture_date: '2024-12-14', instructor_name: '鈴木 一郎', description: '特別講演：業界動向' },
  ],
  response_trends: [
    { session: '第1回', response_count: 45, retention_rate: 100 },
    { session: '第2回', response_count: 42, retention_rate: 93.3 },
    { session: '第3回', response_count: 40, retention_rate: 88.9 },
    { session: '第4回', response_count: 38, retention_rate: 84.4 },
    { session: '第5回', response_count: 36, retention_rate: 80.0 },
    { session: '特別回', response_count: 30, retention_rate: 66.7 },
  ],
  participation_trends: [
    { session: '第1回', zoom_participants: 52, recording_views: 15 },
    { session: '第2回', zoom_participants: 48, recording_views: 20 },
    { session: '第3回', zoom_participants: 46, recording_views: 18 },
    { session: '第4回', zoom_participants: 44, recording_views: 22 },
    { session: '第5回', zoom_participants: 42, recording_views: 25 },
    { session: '特別回', zoom_participants: 35, recording_views: 30 },
  ],
  nps_summary: {
    score: 28.5,
    promoters_count: 18,
    promoters_percentage: 47.4,
    neutrals_count: 13,
    neutrals_percentage: 34.2,
    detractors_count: 7,
    detractors_percentage: 18.4,
    total_responses: 38,
  },
  nps_trends: [
    { session: '第1回', nps_score: 20.0 },
    { session: '第2回', nps_score: 22.5 },
    { session: '第3回', nps_score: 30.0 },
    { session: '第4回', nps_score: 25.0 },
    { session: '第5回', nps_score: 35.0 },
    { session: '特別回', nps_score: 40.0 },
  ],
  score_trends: [
    { session: '第1回', scores: { overall_satisfaction: 3.8, learning_amount: 3.5, comprehension: 3.6, operations: 4.0, instructor_satisfaction: 4.1, time_management: 3.9, question_handling: 3.7, speaking_style: 4.0, preparation: 3.2, motivation: 3.8, future_application: 3.5 } },
    { session: '第2回', scores: { overall_satisfaction: 4.0, learning_amount: 3.7, comprehension: 3.8, operations: 4.1, instructor_satisfaction: 4.2, time_management: 4.0, question_handling: 3.9, speaking_style: 4.1, preparation: 3.3, motivation: 4.0, future_application: 3.7 } },
    { session: '第3回', scores: { overall_satisfaction: 4.2, learning_amount: 3.9, comprehension: 4.0, operations: 4.2, instructor_satisfaction: 4.4, time_management: 4.1, question_handling: 4.0, speaking_style: 4.3, preparation: 3.5, motivation: 4.2, future_application: 3.9 } },
    { session: '第4回', scores: { overall_satisfaction: 4.1, learning_amount: 3.8, comprehension: 3.9, operations: 4.0, instructor_satisfaction: 4.3, time_management: 4.0, question_handling: 4.1, speaking_style: 4.2, preparation: 3.4, motivation: 4.1, future_application: 3.8 } },
    { session: '第5回', scores: { overall_satisfaction: 4.3, learning_amount: 4.0, comprehension: 4.1, operations: 4.3, instructor_satisfaction: 4.5, time_management: 4.2, question_handling: 4.2, speaking_style: 4.4, preparation: 3.6, motivation: 4.3, future_application: 4.0 } },
    { session: '特別回', scores: { overall_satisfaction: 4.5, learning_amount: 4.2, comprehension: 4.3, operations: 4.4, instructor_satisfaction: 4.6, time_management: 4.3, question_handling: 4.3, speaking_style: 4.5, preparation: 3.5, motivation: 4.4, future_application: 4.2 } },
  ],
  overall_averages: {
    overall: {
      label: '総合満足度',
      items: [{ name: '総合的な満足度', score: 4.15 }],
    },
    content: {
      label: '講義内容',
      items: [
        { name: '講義内容の学習量', score: 3.85 },
        { name: '講義内容の理解度', score: 3.95 },
        { name: '講義中の運営アナウンス', score: 4.17 },
      ],
    },
    instructor: {
      label: '講師評価',
      items: [
        { name: '講師の総合的な満足度', score: 4.35 },
        { name: '講師の授業時間の使い方', score: 4.08 },
        { name: '講師の質問対応', score: 4.03 },
        { name: '講師の話し方', score: 4.25 },
      ],
    },
    self_evaluation: {
      label: '受講生の自己評価',
      items: [
        { name: '自身の予習', score: 3.42 },
        { name: '自身の意欲', score: 4.13 },
        { name: '自身の今後への活用', score: 3.85 },
      ],
    },
  },
  sentiment_summary: [
    { sentiment: 'positive', count: 85, percentage: 56.7 },
    { sentiment: 'neutral', count: 40, percentage: 26.7 },
    { sentiment: 'negative', count: 25, percentage: 16.6 },
  ],
  category_summary: [
    { category: 'content', count: 52 },
    { category: 'instructor', count: 38 },
    { category: 'material', count: 25 },
    { category: 'operation', count: 20 },
    { category: 'other', count: 15 },
  ],
};

// ===== 講義回別分析 =====

export function getDummySessionAnalysis(lectureId: number): SessionAnalysisResponse {
  const sessionMap: Record<number, { session: string; date: string; instructor: string; desc: string }> = {
    9001: { session: '第1回', date: '2024-10-05', instructor: '山田 太郎', desc: 'イントロダクション・講座概要' },
    9002: { session: '第2回', date: '2024-10-19', instructor: '山田 太郎', desc: '基礎理論と実践' },
    9003: { session: '第3回', date: '2024-11-02', instructor: '佐藤 花子', desc: 'ケーススタディ分析' },
    9004: { session: '第4回', date: '2024-11-16', instructor: '佐藤 花子', desc: '応用演習' },
    9005: { session: '第5回', date: '2024-11-30', instructor: '山田 太郎', desc: '総合ディスカッション' },
    9006: { session: '特別回', date: '2024-12-14', instructor: '鈴木 一郎', desc: '特別講演：業界動向' },
    // 講座B用
    9101: { session: '第1回', date: '2024-04-13', instructor: '田中 次郎', desc: 'ガイダンス' },
    9102: { session: '第2回', date: '2024-04-27', instructor: '田中 次郎', desc: '基礎編' },
    9103: { session: '第3回', date: '2024-05-11', instructor: '田中 次郎', desc: '実践編' },
  };

  const info = sessionMap[lectureId] || { session: '第1回', date: '2024-01-01', instructor: '講師名', desc: '講義内容' };

  return {
    lecture_info: {
      lecture_id: lectureId,
      session: info.session,
      lecture_date: info.date,
      instructor_name: info.instructor,
      description: info.desc,
      response_count: 42,
    },
    nps: {
      score: 25.0,
      promoters_count: 15,
      promoters_percentage: 35.7,
      neutrals_count: 18,
      neutrals_percentage: 42.9,
      detractors_count: 9,
      detractors_percentage: 21.4,
    },
    average_scores: [
      { category: '総合的な満足度', category_key: 'overall_satisfaction', score: 4.1, full_mark: 5 },
      { category: '学習量', category_key: 'learning_amount', score: 3.8, full_mark: 5 },
      { category: '理解度', category_key: 'comprehension', score: 3.9, full_mark: 5 },
      { category: '運営アナウンス', category_key: 'operations', score: 4.2, full_mark: 5 },
      { category: '講師満足度', category_key: 'instructor_satisfaction', score: 4.3, full_mark: 5 },
      { category: '時間の使い方', category_key: 'time_management', score: 4.0, full_mark: 5 },
      { category: '質問対応', category_key: 'question_handling', score: 3.9, full_mark: 5 },
      { category: '話し方', category_key: 'speaking_style', score: 4.2, full_mark: 5 },
      { category: '予習', category_key: 'preparation', score: 3.3, full_mark: 5 },
      { category: '意欲', category_key: 'motivation', score: 4.1, full_mark: 5 },
      { category: '今後への活用', category_key: 'future_application', score: 3.8, full_mark: 5 },
    ],
    score_distributions: {
      overall_satisfaction: ratingDistribution([0, 2, 5, 20, 15]),
      learning_amount: ratingDistribution([1, 3, 8, 18, 12]),
      comprehension: ratingDistribution([0, 2, 7, 19, 14]),
      operations: ratingDistribution([0, 1, 4, 18, 19]),
      instructor_satisfaction: ratingDistribution([0, 1, 3, 16, 22]),
      time_management: ratingDistribution([0, 2, 6, 18, 16]),
      question_handling: ratingDistribution([1, 2, 6, 19, 14]),
      speaking_style: ratingDistribution([0, 1, 4, 17, 20]),
      preparation: ratingDistribution([2, 5, 12, 15, 8]),
      motivation: ratingDistribution([0, 1, 5, 18, 18]),
      future_application: ratingDistribution([0, 3, 8, 17, 14]),
    },
    fix_difficulty: { easy: 8, hard: 3 },
    priority_comments: [
      {
        id: 'demo-c2',
        text: '配布資料のフォントが小さくて見づらい部分がありました。',
        sentiment: 'negative',
        category: 'material',
        importance: 'high',
        fix_difficulty: 'easy',
        meeting_priority: 9,
        is_abusive: false,
        question_type: 'improvements',
      },
      {
        id: 'demo-c6',
        text: 'オンライン接続が不安定な回があり、音声が途切れることがありました。',
        sentiment: 'negative',
        category: 'operation',
        importance: 'high',
        fix_difficulty: 'easy',
        meeting_priority: 9,
        is_abusive: false,
        question_type: 'improvements',
      },
      {
        id: 'demo-c7',
        text: '資料内のグラフに軸ラベルがなく、何を示しているのか分かりにくかったです。',
        sentiment: 'negative',
        category: 'material',
        importance: 'high',
        fix_difficulty: 'easy',
        meeting_priority: 8,
        is_abusive: false,
        question_type: 'improvements',
      },
      {
        id: 'demo-c8',
        text: '講義開始時のZoomリンクの案内メールが直前すぎて焦りました。前日には送ってほしいです。',
        sentiment: 'negative',
        category: 'operation',
        importance: 'high',
        fix_difficulty: 'easy',
        meeting_priority: 8,
        is_abusive: false,
        question_type: 'improvements',
      },
    ],
    comments: [
      {
        id: 'demo-c1',
        text: '講義内容が充実していて、毎回新しい知見を得ることができました。',
        sentiment: 'positive',
        category: 'content',
        importance: 'medium',
        fix_difficulty: 'none',
        meeting_priority: 5,
        is_abusive: false,
        question_type: 'good_points',
      },
      {
        id: 'demo-c2',
        text: '配布資料のフォントが小さくて見づらい部分がありました。',
        sentiment: 'negative',
        category: 'material',
        importance: 'high',
        fix_difficulty: 'easy',
        meeting_priority: 9,
        is_abusive: false,
        question_type: 'improvements',
      },
      {
        id: 'demo-c3',
        text: '質疑応答の時間が丁寧で、的確な回答をいただけました。',
        sentiment: 'positive',
        category: 'instructor',
        importance: 'low',
        fix_difficulty: 'none',
        meeting_priority: 3,
        is_abusive: false,
        question_type: 'instructor_feedback',
      },
      {
        id: 'demo-c4',
        text: '次回以降も実務事例を多く取り入れてほしいです。',
        sentiment: 'neutral',
        category: 'content',
        importance: 'medium',
        fix_difficulty: 'hard',
        meeting_priority: 5,
        is_abusive: false,
        question_type: 'future_requests',
      },
      {
        id: 'demo-c5',
        text: '受講前と比べてデータ分析の基礎が身についた実感があります。',
        sentiment: 'positive',
        category: 'content',
        importance: 'low',
        fix_difficulty: 'none',
        meeting_priority: 2,
        is_abusive: false,
        question_type: 'free_comment',
      },
      {
        id: 'demo-c6',
        text: 'オンライン接続が不安定な回があり、音声が途切れることがありました。',
        sentiment: 'negative',
        category: 'operation',
        importance: 'high',
        fix_difficulty: 'easy',
        meeting_priority: 9,
        is_abusive: false,
        question_type: 'improvements',
      },
      {
        id: 'demo-c7',
        text: '資料内のグラフに軸ラベルがなく、何を示しているのか分かりにくかったです。',
        sentiment: 'negative',
        category: 'material',
        importance: 'high',
        fix_difficulty: 'easy',
        meeting_priority: 8,
        is_abusive: false,
        question_type: 'improvements',
      },
      {
        id: 'demo-c8',
        text: '講義開始時のZoomリンクの案内メールが直前すぎて焦りました。前日には送ってほしいです。',
        sentiment: 'negative',
        category: 'operation',
        importance: 'high',
        fix_difficulty: 'easy',
        meeting_priority: 8,
        is_abusive: false,
        question_type: 'improvements',
      },
      {
        id: 'demo-c9',
        text: '全体的に良い講座だと思いますが、もう少し休憩時間があると集中力が持続しやすいです。',
        sentiment: 'neutral',
        category: 'other',
        importance: 'low',
        fix_difficulty: 'easy',
        meeting_priority: 4,
        is_abusive: false,
        question_type: 'free_comment',
      },
    ],
  };
}

// ===== 年度比較 =====

// 属性ごとのスコア補正値
const attributeOffsets: Record<string, { responses: number; nps: number; score: number }> = {
  '全体':       { responses: 0,    nps: 0,    score: 0 },
  '学生':       { responses: -80,  nps: 5.0,  score: 0.10 },
  '会員企業':   { responses: -100, nps: -3.0, score: -0.05 },
  '招待枠':     { responses: -170, nps: 8.0,  score: 0.15 },
  '教員':       { responses: -210, nps: 12.0, score: 0.20 },
  'その他/不明': { responses: -215, nps: -5.0, score: -0.10 },
};

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function applyOffset(
  scores: YearComparisonResponse['current']['average_scores'],
  offset: number,
): YearComparisonResponse['current']['average_scores'] {
  return {
    overall_satisfaction: round2(scores.overall_satisfaction + offset),
    learning_amount: round2(scores.learning_amount + offset),
    comprehension: round2(scores.comprehension + offset),
    operations: round2(scores.operations + offset),
    instructor_satisfaction: round2(scores.instructor_satisfaction + offset),
    time_management: round2(scores.time_management + offset),
    question_handling: round2(scores.question_handling + offset),
    speaking_style: round2(scores.speaking_style + offset),
    preparation: round2(scores.preparation + offset),
    motivation: round2(scores.motivation + offset),
    future_application: round2(scores.future_application + offset),
  };
}

export function getDummyYearComparison(
  studentAttribute: string = '全体',
): YearComparisonResponse {
  const offset = attributeOffsets[studentAttribute] || attributeOffsets['全体'];

  const baseCurrentScores = {
    overall_satisfaction: 4.15,
    learning_amount: 3.85,
    comprehension: 3.95,
    operations: 4.17,
    instructor_satisfaction: 4.35,
    time_management: 4.08,
    question_handling: 4.03,
    speaking_style: 4.25,
    preparation: 3.42,
    motivation: 4.13,
    future_application: 3.85,
  };

  const baseComparisonScores = {
    overall_satisfaction: 3.85,
    learning_amount: 3.60,
    comprehension: 3.70,
    operations: 3.90,
    instructor_satisfaction: 4.10,
    time_management: 3.80,
    question_handling: 3.75,
    speaking_style: 4.00,
    preparation: 3.30,
    motivation: 3.90,
    future_application: 3.60,
  };

  const currentScores = applyOffset(baseCurrentScores, offset.score);
  const comparisonScores = applyOffset(baseComparisonScores, offset.score);

  const currentNps = round2(28.5 + offset.nps);
  const comparisonNps = round2(18.2 + offset.nps);
  const npsOffset = offset.nps;

  return {
    current: {
      academic_year: 2024,
      term: '10月～12月',
      total_responses: Math.max(10, 231 + offset.responses),
      session_count: 6,
      average_nps: currentNps,
      average_scores: currentScores,
    },
    comparison: {
      academic_year: 2023,
      term: '10月～12月',
      total_responses: Math.max(8, 198 + offset.responses),
      session_count: 5,
      average_nps: comparisonNps,
      average_scores: comparisonScores,
    },
    nps_trends: {
      current: [
        { session: '第1回', nps_score: round2(20.0 + npsOffset) },
        { session: '第2回', nps_score: round2(22.5 + npsOffset) },
        { session: '第3回', nps_score: round2(30.0 + npsOffset) },
        { session: '第4回', nps_score: round2(25.0 + npsOffset) },
        { session: '第5回', nps_score: round2(35.0 + npsOffset) },
      ],
      comparison: [
        { session: '第1回', nps_score: round2(15.0 + npsOffset) },
        { session: '第2回', nps_score: round2(12.0 + npsOffset) },
        { session: '第3回', nps_score: round2(18.0 + npsOffset) },
        { session: '第4回', nps_score: round2(20.0 + npsOffset) },
        { session: '第5回', nps_score: round2(25.0 + npsOffset) },
      ],
    },
    score_comparison: Object.keys(currentScores).map(key => {
      const k = key as keyof typeof currentScores;
      const labels: Record<string, string> = {
        overall_satisfaction: '総合満足度',
        learning_amount: '学習量',
        comprehension: '理解度',
        operations: '運営',
        instructor_satisfaction: '講師満足度',
        time_management: '時間の使い方',
        question_handling: '質問対応',
        speaking_style: '話し方',
        preparation: '予習',
        motivation: '意欲',
        future_application: '今後への活用',
      };
      return {
        category: labels[k] || k,
        category_key: k,
        current_score: currentScores[k],
        comparison_score: comparisonScores[k],
        difference: round2(currentScores[k] - comparisonScores[k]),
      };
    }),
  };
}
