// ===== 基本型 =====

export type AnalysisType = 'preliminary' | 'confirmed';

export type StudentAttribute = 'all' | 'student' | 'corporate' | 'invited' | 'faculty' | 'other';

export type Sentiment = 'positive' | 'neutral' | 'negative';

export type CommentCategory = 'content' | 'material' | 'instructor' | 'operation' | 'other';

export type Priority = 'high' | 'medium' | 'low';

export type FixDifficulty = 'easy' | 'hard' | 'none';

export type RiskLevel = 'flag' | 'safe';

export type QuestionType =
  | 'learned'              // 学んだこと
  | 'good_points'          // 良かった点
  | 'improvements'         // 改善点
  | 'instructor_feedback'  // 講師へのフィードバック
  | 'future_requests'      // 今後の要望
  | 'free_comment';        // 自由コメント

// ===== UI表示用マッピング =====

export const AnalysisTypeLabels: Record<AnalysisType, string> = {
  preliminary: '速報版',
  confirmed: '確定版',
};

export const AnalysisTypeFromLabel: Record<string, AnalysisType> = {
  '速報版': 'preliminary',
  '確定版': 'confirmed',
};

export const StudentAttributeLabels: Record<StudentAttribute, string> = {
  all: '全体',
  student: '学生',
  corporate: '会員企業',
  invited: '招待枠',
  faculty: '教職員',
  other: 'その他/不明',
};

export const StudentAttributeFromLabel: Record<string, StudentAttribute> = {
  '全体': 'all',
  '学生': 'student',
  '会員企業': 'corporate',
  '招待枠': 'invited',
  '教職員': 'faculty',
  'その他/不明': 'other',
  '不明': 'other',
};

export const SentimentLabels: Record<Sentiment, string> = {
  positive: 'ポジティブ',
  neutral: 'ニュートラル',
  negative: 'ネガティブ',
};

export const CommentCategoryLabels: Record<CommentCategory, string> = {
  content: '講義内容',
  material: '講義資料',
  instructor: '講師',
  operation: '運営',
  other: 'その他',
};

export const PriorityLabels: Record<Priority, string> = {
  high: '高',
  medium: '中',
  low: '低',
};

export const FixDifficultyLabels: Record<FixDifficulty, string> = {
  easy: '容易',
  hard: '困難',
  none: 'なし',
};

export const RiskLevelLabels: Record<RiskLevel, string> = {
  flag: '要注意',
  safe: '安全',
};

export const QuestionTypeLabels: Record<QuestionType, string> = {
  learned: '学んだこと',
  good_points: '良かった点',
  improvements: '改善点',
  instructor_feedback: '講師フィードバック',
  future_requests: '今後の要望',
  free_comment: '自由コメント',
};

// ===== スコアカテゴリのマッピング =====

export const ScoreCategoryKeys = {
  overall_satisfaction: '総合満足度',
  learning_amount: '学習量',
  comprehension: '理解度',
  operations: '運営',
  instructor_satisfaction: '講師満足度',
  time_management: '時間使い方',
  question_handling: '質問対応',
  speaking_style: '話し方',
  preparation: '予習',
  motivation: '意欲',
  future_application: '今後活用',
} as const;

export type ScoreCategoryKey = keyof typeof ScoreCategoryKeys;

// ===== エラーレスポンス =====

export interface ErrorResponse {
  error: {
    code: string;
    message: string;
    details?: Record<string, string>;
  };
}

// ===== 1. 講座関連API =====

// 1.1 講座一覧取得 GET /courses
export interface CourseListResponse {
  courses: CourseItem[];
}

export interface CourseItem {
  name: string;                    // 講座名
  academic_year: number;           // 年度（例: 2024）
  term: string;                    // 期間（例: "10月～12月"）
  sessions: SessionSummary[];      // 講義回サマリー
}

export interface SessionSummary {
  lecture_id: number;              // lectures.id
  session: string;                 // 講義回（例: "第1回", "特別回"）
  lecture_date: string;            // 講義日（YYYY-MM-DD）
  analysis_types: AnalysisType[];  // 利用可能な分析タイプ
}

// 1.2 講座詳細取得 GET /courses/detail
export interface CourseDetailResponse {
  name: string;
  academic_year: number;
  term: string;
  lectures: LectureInfo[];
}

export interface LectureInfo {
  id: number;                      // lectures.id
  session: string;                 // 講義回（例: "第1回", "特別回"）
  lecture_date: string;            // 講義日
  instructor_name: string;         // 講師名
  description: string | null;      // 講義内容
  batches: BatchInfo[];            // バッチ情報
}

export interface BatchInfo {
  id: number;                      // survey_batches.id
  batch_type: AnalysisType;        // preliminary / confirmed
  zoom_participants: number | null;
  recording_views: number | null;
  uploaded_at: string;
}

// ===== 2. ダッシュボードAPI =====

// 2.1 全体傾向データ取得 GET /courses/trends
export interface OverallTrendsResponse {
  lecture_info: LectureInfoItem[];                // 講義回情報一覧
  response_trends: ResponseTrendItem[];           // 回答数・継続率推移
  participation_trends: ParticipationTrendItem[]; // Zoom参加者数 / 録画視聴回数推移
  nps_summary: NPSSummary;                        // NPS全体サマリー
  nps_trends: NPSTrendItem[];                     // NPS推移
  score_trends: ScoreTrendItem[];                 // 評価項目別平均点推移
  overall_averages: OverallAverages;              // 全体を通しての平均点
  sentiment_summary: SentimentSummaryItem[];      // コメント感情分析
  category_summary: CategorySummaryItem[];        // カテゴリ別コメント数
}

export interface LectureInfoItem {
  lecture_id: number;           // lectures.id
  session: string;              // 講義回（例: "第1回", "特別回"）
  lecture_date: string;         // 講義日（YYYY-MM-DD）
  instructor_name: string;      // 講師名
  description: string | null;   // 講義内容
}

export interface ResponseTrendItem {
  session: string;              // 講義回（例: "第1回"）
  response_count: number;       // 回答数
  retention_rate: number;       // 継続率（%）- 第1回を100%として計算
  breakdown?: {
    student: number;            // 学生の回答数
    corporate: number;          // 会員企業の回答数
    invited: number;            // 招待枠の回答数
    faculty: number;            // 教職員の回答数
    other: number;              // その他/不明の回答数
  };
}

export interface ParticipationTrendItem {
  session: string;              // 講義回
  zoom_participants: number | null;  // Zoom参加者数（速報版で使用）
  recording_views: number | null;    // 録画視聴回数（確定版で使用）
}

export interface NPSSummary {
  score: number;                // NPSスコア（-100〜100）
  promoters_count: number;      // 推奨者数（9-10点）
  promoters_percentage: number; // 推奨者割合（%）
  neutrals_count: number;       // 中立者数（7-8点）
  neutrals_percentage: number;  // 中立者割合（%）
  detractors_count: number;     // 批判者数（0-6点）
  detractors_percentage: number;// 批判者割合（%）
  total_responses: number;      // 総回答数
}

export interface NPSTrendItem {
  session: string;              // 講義回
  nps_score: number;            // NPSスコア
}

export interface ScoreTrendItem {
  session: string;              // 講義回
  scores: {
    overall_satisfaction: number;     // 総合満足度
    learning_amount: number;          // 学習量
    comprehension: number;            // 理解度
    operations: number;               // 運営アナウンス
    instructor_satisfaction: number;  // 講師の総合満足度
    time_management: number;          // 講師の時間の使い方
    question_handling: number;        // 講師の質問対応
    speaking_style: number;           // 講師の話し方
    preparation: number;              // 自身の予習
    motivation: number;               // 自身の意欲
    future_application: number;       // 自身の今後への活用
  };
}

export interface OverallAverages {
  overall: {
    label: string;              // "総合満足度"
    items: ScoreItem[];
  };
  content: {
    label: string;              // "講義内容"
    items: ScoreItem[];
  };
  instructor: {
    label: string;              // "講師評価"
    items: ScoreItem[];
  };
  self_evaluation: {
    label: string;              // "受講生の自己評価"
    items: ScoreItem[];
  };
}

export interface ScoreItem {
  name: string;                 // 項目名（例: "本日の総合的な満足度"）
  score: number;                // 平均点（1.00〜5.00）
}

export interface SentimentSummaryItem {
  sentiment: Sentiment;         // positive / neutral / negative
  count: number;                // コメント数
  percentage: number;           // 割合（%）
}

export interface CategorySummaryItem {
  category: CommentCategory;    // content / material / instructor / operation / other
  count: number;                // コメント数
}

// 2.2 講義回別分析データ取得 GET /lectures/:lectureId/analysis
export interface SessionAnalysisResponse {
  lecture_info: SessionLectureInfo;           // 講義情報
  nps: SessionNPS;                            // NPS
  average_scores: AverageScoreItem[];         // レーダーチャート用平均点
  score_distributions: ScoreDistributions;    // 評価分布（ヒストグラム用）
  priority_comments: CommentItem[];          // 重要コメント（priority=high）
  comments: CommentItem[];                    // 全コメント
}

export interface SessionLectureInfo {
  lecture_id: number;
  session: string;              // 講義回（例: "第1回"）
  lecture_date: string;         // 講義日（YYYY-MM-DD）
  instructor_name: string;      // 講師名
  description: string | null;   // 講義内容
  response_count: number;       // 回答数
}

export interface SessionNPS {
  score: number;                // NPSスコア
  promoters_count: number;      // 推奨者数
  promoters_percentage: number; // 推奨者割合
  neutrals_count: number;       // 中立者数
  neutrals_percentage: number;  // 中立者割合
  detractors_count: number;     // 批判者数
  detractors_percentage: number;// 批判者割合
}

export interface AverageScoreItem {
  category: string;             // カテゴリ名（日本語）
  category_key: string;         // カテゴリキー（英語）
  score: number | null;         // 平均点（1.00〜5.00）
  full_mark: number;            // 満点（常に5）
}

export interface ScoreDistributions {
  overall_satisfaction: RatingDistribution[];     // 総合満足度
  learning_amount: RatingDistribution[];          // 学習量
  comprehension: RatingDistribution[];            // 理解度
  operations: RatingDistribution[];               // 運営アナウンス
  instructor_satisfaction: RatingDistribution[];  // 講師の総合満足度
  time_management: RatingDistribution[];          // 講師の時間の使い方
  question_handling: RatingDistribution[];        // 講師の質問対応
  speaking_style: RatingDistribution[];           // 講師の話し方
  preparation: RatingDistribution[];              // 自身の予習
  motivation: RatingDistribution[];               // 自身の意欲
  future_application: RatingDistribution[];       // 自身の今後への活用
}

export interface RatingDistribution {
  rating: number;               // 評価点（1〜5）
  count: number;                // 回答数
}

export interface CommentItem {
  id: string;                   // コメントID
  text: string;                 // コメント本文
  sentiment: Sentiment | null;  // 感情分析結果（null=未分析）
  category: CommentCategory | null;  // カテゴリ（null=未分類）
  priority: Priority | null;    // 重要度（null=未判定）
  fix_difficulty: FixDifficulty | null;  // 修正難易度（null=未判定）
  risk_level: RiskLevel | null;  // リスクレベル（null=未判定）
  is_analysis_target: boolean;   // 会議に挙げるべきかどうか
  question_type: QuestionType;  // 質問タイプ
}

// 2.3 年度比較データ取得 GET /courses/compare
export interface YearComparisonResponse {
  current: YearMetrics;
  comparison: YearMetrics;
  nps_trends: {
    current: NPSTrendItem[];
    comparison: NPSTrendItem[];
  };
  score_comparison: ScoreComparisonItem[];
}

export interface YearMetrics {
  academic_year: number;        // 年度
  term: string;                 // 期間
  total_responses: number;      // 総回答数
  session_count: number;        // 講義回数
  average_nps: number;          // 平均NPSスコア
  average_scores: {
    overall_satisfaction: number;
    learning_amount: number;
    comprehension: number;
    operations: number;
    instructor_satisfaction: number;
    time_management: number;
    question_handling: number;
    speaking_style: number;
    preparation: number;
    motivation: number;
    future_application: number;
  };
}

export interface ScoreComparisonItem {
  category: string;             // カテゴリ名
  category_key: string;         // カテゴリキー
  current_score: number;        // 比較元スコア
  comparison_score: number;     // 比較先スコア
  difference: number;           // 差分（current - comparison）
}

// ===== 3. データアップロードAPI =====

// 3.1 アンケートデータアップロード POST /surveys/upload
export interface UploadResponse {
  success: true;
  job_id: string;        // ジョブ識別子（batch_id）
  status_url: string;    // 状態確認用URL
  message: string;
}

export interface ConflictResponse {
  error: {
    code: 'CONFLICT';
    message: string;
    existing_data: {
      lecture_id: number;
      batch_id: number;
      uploaded_at: string;
    };
  };
}

// ===== 4. データ削除API =====

// 4.1 削除対象バッチ検索 GET /surveys/batches/search
export interface BatchSearchResponse {
  batches: BatchSearchItem[];
}

export interface BatchSearchItem {
  batch_id: number;             // survey_batches.id
  lecture_id: number;           // lectures.id
  session: string;              // 講義回
  lecture_date: string;         // 講義日
  batch_type: AnalysisType;     // preliminary / confirmed
  uploaded_at: string;          // アップロード日時
}

// 4.2 アンケートバッチ削除 DELETE /surveys/batches/:batchId
export interface DeleteResponse {
  success: true;
  deleted_batch_id: number;
  deleted_response_count: number;
  message: string;
}

// ===== 5. 受講生属性API =====

// 5.1 受講生属性一覧取得 GET /attributes
export interface AttributesResponse {
  attributes: AttributeItem[];
}

export interface AttributeItem {
  key: StudentAttribute;        // 属性キー（英語）
  label: string;                // 表示名（日本語）
}

// ===== 5.5 非同期ジョブ管理API =====

// 5.5.1 ジョブ状態確認 GET /jobs/:jobId
export type JobStatus = 'queued' | 'processing' | 'completed' | 'failed';

export interface JobStatusResponse {
  job_id: string;
  status: JobStatus;
  created_at: string;
  // status='completed' の場合のみ
  result?: {
    lecture_id: number;
    batch_id: number;
    response_count: number;
  };
  // status='failed' の場合のみ
  error?: {
    code: string;
    message: string;
  };
}

// ===== 6. ユーザー情報API =====

// 6.1 ログインユーザー情報取得 GET /me
export interface UserInfoResponse {
  sub: string;           // ユーザーID (x-amzn-oidc-identity)
  username: string;      // ユーザー名
  email: string;         // メールアドレス
  role: string;          // 権限ロール（Cognitoグループ等から判定）
}
