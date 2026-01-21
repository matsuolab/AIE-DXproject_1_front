# 1. 概要

本ドキュメントは、講義アンケート分析ダッシュボードのAPI仕様を定義する。

- **バージョン**: 1.0.0
- **ベースURL**: `/api/v1`
- **プロトコル**: HTTPS
- **レスポンス形式**: JSON
- **文字コード**: UTF-8

**データフォーマット仕様**

| **項目** | **フォーマット** | **例** |
| --- | --- | --- |
| **日付** | ISO 8601 (`YYYY-MM-DD`) | `2024-10-07` |
| **日時** | ISO 8601 (`YYYY-MM-DDTHH:mm:ssZ`) | `2024-10-07T09:00:00Z` |

---

# 2. 認証（AWS ALB + Amazon Cognito）

本システムは、AWS Application Load Balancer (ALB) の組み込み認証機能を利用する。

リクエストがバックエンドサーバーに到達した時点で、ユーザーは既に認証済みであることが保証される。

## 2.1 認証フロー

1. クライアント（ブラウザ）がAPIにアクセス
2. ALBがセッションCookieを確認
3. 未認証の場合、ALBがCognitoのログイン画面へリダイレクト
4. 認証成功後、ALBがリクエストヘッダーにユーザー情報を付与してバックエンドへ転送

## 2.2 リクエストヘッダー（ALBが付与）

バックエンドサーバーは、ALBが付与した以下のヘッダーからユーザー情報を取得する。

フロントエンドがこれらのヘッダーを付与する必要はない。

| **ヘッダー名** | **説明** | **サンプル値** |
| --- | --- | --- |
| `x-amzn-oidc-identity` | ユーザー識別子 (Cognito Sub) | `abcd-1234-efgh-5678` |
| `x-amzn-oidc-data` | ユーザー情報（JWTクレーム）
※Base64エンコード済み | `eyJraW...` |
| `x-amzn-oidc-accesstoken` | アクセストークン（JWT） | `eyJraW...` |

## 2.3 ローカル開発時の注意

ローカル環境（localhost）にはALBが存在しないため、認証ヘッダーが付与されない。

開発時は、バックエンドのミドルウェア等で上記のヘッダーをモック（偽装）して開発を行う。

## 2.4 フロントエンド実装例

認証はCookie（HttpOnly）で管理されるため、フロントエンドでトークンをヘッダーにセットする必要はない。

```tsx
// src/api/client.ts

async function fetchCourses() {
  // Authorizationヘッダーは不要
  const response = await fetch('/api/v1/courses');

  // 401が返るケースは「セッション切れ」など
  if (response.status === 401) {
    // 画面をリロードするとALBが再ログインフローを開始する
    window.location.reload();
    return;
  }

  return response.json();
}
```

---

# 3. 共通エラーレスポンス

HTTPステータスコードに加え、以下のJSONボディを返却する。

```json
{
  "error": {
    "code": "INVALID_REQUEST",
    "message": "パラメータが不正です",
    "details": {
      "field_name": "Error description"
    }
  }
}
```

| **HTTPステータス** | **エラーコード** | **説明** |
| --- | --- | --- |
| **400** | `INVALID_REQUEST` | リクエストパラメータが不正 |
| **401** | `UNAUTHORIZED` | **セッション無効** - ALBの設定により、通常はアプリに到達する前にCognitoへリダイレクトされるため、このエラーが発生するのは稀（AJAX通信中のセッション切れ等） |
| **403** | `FORBIDDEN` | **アクセス権限なし** - ログインはしているが、リソースへのアクセス権がない場合 |
| **404** | `NOT_FOUND` | リソース未検出 |
| **409** | `CONFLICT` | データ重複・競合 |
| **500** | `INTERNAL_ERROR` | サーバー内部エラー |

---

# 4. エンドポイント詳細

## 4.1 講座関連 (Courses)

> Note: 講座は name + academic_year + term の複合キーで識別される。
> 

### 4.1.1 講座一覧取得

講座一覧を取得する。`LECTURES`テーブルを`name, academic_year, term`でグループ化して返します。

**エンドポイント**: `GET /courses`

**リクエストパラメータ (Query)**

| パラメータ | **型** | **必須** | **説明** |
| --- | --- | --- | --- |
| `name` | string | - | 講座名（部分一致） |
| `academic_year` | number | - | 年度（例: 2024） |
| `term` | string | - | 期間 |

**レスポンス**

```tsx
interface CourseListResponse {
  courses: CourseItem[];
}

interface CourseItem {
  // 講座識別キー（name + academic_year + term の複合キー）
  name: string;                    // 講座名
  academic_year: number;           // 年度（例: 2024）
  term: string;                    // 期間（例: "10月～12月"）
  sessions: SessionSummary[];      // 講義回サマリー
}

interface SessionSummary {
  lecture_id: number;              // lectures.id
  session: string;                 // 講義回（例: "第1回", "特別回"）
  lecture_date: string;            // 講義日（YYYY-MM-DD）
  analysis_types: AnalysisType[];  // 利用可能な分析タイプ
}
```

**レスポンス例**

```json
{
  "courses": [
    {
      "name": "大規模言語モデル",
      "academic_year": 2024,
      "term": "10月～12月",
      "sessions": [
        {
          "lecture_id": 1,
          "session": "第1回",
          "lecture_date": "2024-10-07",
          "analysis_types": ["preliminary", "confirmed"]
        },
        {
          "lecture_id": 2,
          "session": "第2回",
          "lecture_date": "2024-10-14",
          "analysis_types": ["preliminary", "confirmed"]
        },
        {
          "lecture_id": 5,
          "session": "特別回",
          "lecture_date": "2024-11-04",
          "analysis_types": ["preliminary"]
        }
      ]
    }
  ]
}
```

### 4.1.2 講座詳細取得

特定の講座（講座名・年度・期間の組み合わせ）の詳細情報を取得する。

**エンドポイント**: `GET /courses/detail`

**リクエストパラメータ (Query)**

| パラメータ | **型** | **必須** | **説明** |
| --- | --- | --- | --- |
| `name` | string | ○ | 講座名 |
| `academic_year` | number | ○ | 年度 |
| `term` | string | ○ | 期間 |

**レスポンス**

```tsx
interface CourseDetailResponse {
  name: string;
  academic_year: number;
  term: string;
  lectures: LectureInfo[];
}

interface LectureInfo {
  id: number;                      // lectures.id
  session: string;                 // 講義回（例: "第1回", "特別回"）
  lecture_date: string;            // 講義日
  instructor_name: string;         // 講師名
  description: string | null;      // 講義内容
  batches: BatchInfo[];            // バッチ情報
}

interface BatchInfo {
  id: number;                      // survey_batches.id
  batch_type: AnalysisType;        // preliminary / confirmed
  zoom_participants: number | null;
  recording_views: number | null;
  uploaded_at: string;
}
```

**レスポンス例**

```json
{
  "name": "大規模言語モデル",
  "academic_year": 2024,
  "term": "10月～12月",
  "lectures": [
    {
      "id": 1,
      "session": "第1回",
      "lecture_date": "2024-10-07",
      "instructor_name": "山田 太郎",
      "description": "イントロダクション：大規模言語モデルの概要と歴史",
      "batches": [
        {
          "id": 1,
          "batch_type": "preliminary",
          "zoom_participants": 320,
          "recording_views": null,
          "uploaded_at": "2024-10-08T09:00:00Z"
        },
        {
          "id": 2,
          "batch_type": "confirmed",
          "zoom_participants": null,
          "recording_views": 520,
          "uploaded_at": "2024-10-15T10:00:00Z"
        }
      ]
    },
    {
      "id": 2,
      "session": "第2回",
      "lecture_date": "2024-10-14",
      "instructor_name": "山田 太郎",
      "description": "Transformerアーキテクチャの基礎",
      "batches": [
        {
          "id": 3,
          "batch_type": "preliminary",
          "zoom_participants": 305,
          "recording_views": null,
          "uploaded_at": "2024-10-15T09:00:00Z"
        },
        {
          "id": 4,
          "batch_type": "confirmed",
          "zoom_participants": null,
          "recording_views": 485,
          "uploaded_at": "2024-10-22T10:00:00Z"
        }
      ]
    },
    {
      "id": 3,
      "session": "第3回",
      "lecture_date": "2024-10-21",
      "instructor_name": "鈴木 花子",
      "description": "事前学習とファインチューニング",
      "batches": [
        {
          "id": 5,
          "batch_type": "preliminary",
          "zoom_participants": 298,
          "recording_views": null,
          "uploaded_at": "2024-10-22T09:00:00Z"
        }
      ]
    },
    {
      "id": 4,
      "session": "第4回",
      "lecture_date": "2024-10-28",
      "instructor_name": "鈴木 花子",
      "description": "プロンプトエンジニアリング",
      "batches": []
    },
    {
      "id": 5,
      "session": "特別回",
      "lecture_date": "2024-11-04",
      "instructor_name": "田中 健一",
      "description": "特別講演：企業におけるLLM活用事例",
      "batches": [
        {
          "id": 6,
          "batch_type": "preliminary",
          "zoom_participants": 350,
          "recording_views": null,
          "uploaded_at": "2024-11-05T09:00:00Z"
        }
      ]
    },
    {
      "id": 6,
      "session": "第5回",
      "lecture_date": "2024-11-11",
      "instructor_name": "佐藤 一郎",
      "description": "RAGと外部知識の活用",
      "batches": []
    },
    {
      "id": 7,
      "session": "第6回",
      "lecture_date": "2024-11-18",
      "instructor_name": "山田 太郎",
      "description": "LLMの応用事例と今後の展望",
      "batches": []
    }
  ]
}
```

---

## 4.2 ダッシュボード (Dashboard)

### 4.2.1 全体傾向データ取得

講座全体を通しての傾向データを取得する。

**エンドポイント**: `GET /courses/trends`

**リクエストパラメータ (Query)**

| パラメータ | **型** | **必須** | **説明** |
| --- | --- | --- | --- |
| `name` | string | ○ | 講座名 |
| `academic_year` | number | ○ | 年度 |
| `term` | string | ○ | 期間 |
| `batch_type` | string | ○ | `preliminary`(速報) / `confirmed`(確定) |
| `student_attribute` | string | - | 属性フィルタ（デフォルト: `all`） |

**レスポンス**

```tsx
interface OverallTrendsResponse {
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

// 講義回情報
interface LectureInfoItem {
  lecture_id: number;           // lectures.id
  session: string;              // 講義回（例: "第1回", "特別回"）
  lecture_date: string;         // 講義日（YYYY-MM-DD）
  instructor_name: string;      // 講師名
  description: string | null;   // 講義内容
}

// 回答数・継続率推移
interface ResponseTrendItem {
  session: string;              // 講義回（例: "第1回"）
  response_count: number;       // 回答数
  retention_rate: number;       // 継続率（%）- 第1回を100%として計算
  // 属性別内訳（student_attribute=all の場合のみ返却）
  breakdown?: {
    student: number;            // 学生の回答数
    corporate: number;          // 会員企業の回答数
    invited: number;            // 招待枠の回答数
    faculty: number;            // 教員の回答数
    other: number;              // その他/不明の回答数
  };
}

// Zoom参加者数 / 録画視聴回数推移
interface ParticipationTrendItem {
  session: string;              // 講義回
  zoom_participants: number | null;  // Zoom参加者数（速報版で使用）
  recording_views: number | null;    // 録画視聴回数（確定版で使用）
}

// NPS全体サマリー
interface NPSSummary {
  score: number;                // NPSスコア（-100〜100）
  promoters_count: number;      // 推奨者数（9-10点）
  promoters_percentage: number; // 推奨者割合（%）
  neutrals_count: number;       // 中立者数（7-8点）
  neutrals_percentage: number;  // 中立者割合（%）
  detractors_count: number;     // 批判者数（0-6点）
  detractors_percentage: number;// 批判者割合（%）
  total_responses: number;      // 総回答数
}

// NPS推移
interface NPSTrendItem {
  session: string;              // 講義回
  nps_score: number;            // NPSスコア
}

// 評価項目別平均点推移
interface ScoreTrendItem {
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

// 全体を通しての平均点
interface OverallAverages {
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

interface ScoreItem {
  name: string;                 // 項目名（例: "本日の総合的な満足度"）
  score: number;                // 平均点（1.00〜5.00）
}

// コメント感情分析サマリー
interface SentimentSummaryItem {
  sentiment: Sentiment;         // positive / neutral / negative
  count: number;                // コメント数
  percentage: number;           // 割合（%）
}

// カテゴリ別コメント数
interface CategorySummaryItem {
  category: CommentCategory;    // content / material / instructor / operation / other
  count: number;                // コメント数
}
```

**レスポンス例**

```json
{
  "lecture_info": [
    {
      "lecture_id": 1,
      "session": "第1回",
      "lecture_date": "2024-10-07",
      "instructor_name": "山田 太郎",
      "description": "イントロダクション：大規模言語モデルの概要と歴史"
    }
  ],
  "response_trends": [
    {
      "session": "第1回",
      "response_count": 450,
      "retention_rate": 100.0,
      "breakdown": {
        "student": 180,
        "corporate": 200,
        "invited": 50,
        "faculty": 10,
        "other": 10
      }
    },
    {
      "session": "第2回",
      "response_count": 432,
      "retention_rate": 96.0,
      "breakdown": {
        "student": 175,
        "corporate": 190,
        "invited": 48,
        "faculty": 10,
        "other": 9
      }
    }
  ],
  "participation_trends": [
    {
      "session": "第1回",
      "zoom_participants": 320,
      "recording_views": 520
    }
  ],
  "nps_summary": {
    "score": 25.2,
    "promoters_count": 180,
    "promoters_percentage": 45.0,
    "neutrals_count": 140,
    "neutrals_percentage": 35.0,
    "detractors_count": 80,
    "detractors_percentage": 20.0,
    "total_responses": 400
  },
  "nps_trends": [
    { "session": "第1回", "nps_score": 15.5 },
    { "session": "第2回", "nps_score": 22.3 }
  ],
  "score_trends": [
    {
      "session": "第1回",
      "scores": {
        "overall_satisfaction": 4.2,
        "learning_amount": 4.1,
        "comprehension": 4.0,
        "operations": 4.3,
        "instructor_satisfaction": 4.5,
        "time_management": 4.4,
        "question_handling": 4.6,
        "speaking_style": 4.5,
        "preparation": 3.7,
        "motivation": 3.9,
        "future_application": 3.8
      }
    }
  ],
  "overall_averages": {
    "overall": {
      "label": "総合満足度",
      "items": [
        { "name": "本日の総合的な満足度", "score": 4.35 }
      ]
    },
    "content": {
      "label": "講義内容",
      "items": [
        { "name": "講義内容の学習量", "score": 4.28 },
        { "name": "講義内容の理解度", "score": 4.15 },
        { "name": "講義中の運営アナウンス", "score": 4.32 }
      ]
    },
    "instructor": {
      "label": "講師評価",
      "items": [
        { "name": "講師の総合的な満足度", "score": 4.62 },
        { "name": "講師の授業時間の使い方", "score": 4.58 },
        { "name": "講師の質問対応", "score": 4.65 },
        { "name": "講師の話し方", "score": 4.55 }
      ]
    },
    "self_evaluation": {
      "label": "受講生の自己評価",
      "items": [
        { "name": "自身の予習", "score": 3.85 },
        { "name": "自身の意欲", "score": 4.12 },
        { "name": "自身の今後への活用", "score": 4.05 }
      ]
    }
  },
  "sentiment_summary": [
    { "sentiment": "positive", "count": 260, "percentage": 65.0 },
    { "sentiment": "neutral", "count": 100, "percentage": 25.0 },
    { "sentiment": "negative", "count": 40, "percentage": 10.0 }
  ],
  "category_summary": [
    { "category": "content", "count": 125 },
    { "category": "material", "count": 67 },
    { "category": "instructor", "count": 30 },
    { "category": "operation", "count": 45 },
    { "category": "other", "count": 35 }
  ]
}
```

### 4.2.2 講義回別分析データ取得

特定の講義回の詳細分析データを取得する。

**エンドポイント**: `GET /lectures/:lectureId/analysis`

**パスパラメータ**

| パラメータ | 型 | 説明 |
| --- | --- | --- |
| `lectureId` | number | [lectures.id](http://lectures.id/) |

**リクエストパラメータ（Query）**

| パラメータ | 型 | 必須 | 説明 |
| --- | --- | --- | --- |
| `batch_type` | string | ○ | `preliminary` または `confirmed` |
| `student_attribute` | string | - | 受講生属性フィルタ（デフォルト: `all`） |

**レスポンス**

```tsx
interface SessionAnalysisResponse {
  lecture_info: SessionLectureInfo;           // 講義情報
  nps: SessionNPS;                            // NPS
  average_scores: AverageScoreItem[];         // レーダーチャート用平均点
  score_distributions: ScoreDistributions;    // 評価分布（ヒストグラム用）
  priority_comments: CommentItem[];           // 重要コメント（priority=high）
  comments: CommentItem[];                    // 全コメント
}

// 講義情報
interface SessionLectureInfo {
  lecture_id: number;
  session: string;              // 講義回（例: "第1回"）
  lecture_date: string;         // 講義日（YYYY-MM-DD）
  instructor_name: string;      // 講師名
  description: string | null;   // 講義内容
  response_count: number;       // 回答数
}

// 当該回のNPS
interface SessionNPS {
  score: number;                // NPSスコア
  promoters_count: number;      // 推奨者数
  promoters_percentage: number; // 推奨者割合
  neutrals_count: number;       // 中立者数
  neutrals_percentage: number;  // 中立者割合
  detractors_count: number;     // 批判者数
  detractors_percentage: number;// 批判者割合
}

// レーダーチャート用平均点
interface AverageScoreItem {
  category: string;             // カテゴリ名（日本語）
  category_key: string;         // カテゴリキー（英語）
  score: number;                // 平均点（1.00〜5.00）
  full_mark: number;            // 満点（常に5）
}

// 評価分布（各項目のヒストグラムデータ）
interface ScoreDistributions {
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

interface RatingDistribution {
  rating: number;               // 評価点（1〜5）
  count: number;                // 回答数
}

// コメント
interface CommentItem {
  id: string;                   // コメントID
  text: string;                 // コメント本文
  sentiment: Sentiment | null;  // 感情分析結果（null=未分析）
  category: CommentCategory | null;  // カテゴリ（null=未分類）
  priority: Priority | null;    // 優先度（null=未判定）
  fix_difficulty: FixDifficulty | null;  // 修正難易度（null=未判定）
  is_analysis_target: boolean;  // 会議に挙げるべきかどうか
  question_type: QuestionType;  // 質問タイプ
}
```

**レスポンス例**

```json
{
  "lecture_info": {
    "lecture_id": 1,
    "session": "第1回",
    "lecture_date": "2024-10-07",
    "instructor_name": "山田 太郎",
    "description": "イントロダクション：大規模言語モデルの概要と歴史",
    "response_count": 50
  },
  "nps": {
    "score": 15.5,
    "promoters_count": 25,
    "promoters_percentage": 50.0,
    "neutrals_count": 18,
    "neutrals_percentage": 36.0,
    "detractors_count": 7,
    "detractors_percentage": 14.0
  },
  "average_scores": [
    { "category": "総合満足度", "category_key": "overall_satisfaction", "score": 4.2, "full_mark": 5 },
    { "category": "学習量", "category_key": "learning_amount", "score": 4.1, "full_mark": 5 },
    { "category": "理解度", "category_key": "comprehension", "score": 4.0, "full_mark": 5 },
    { "category": "運営", "category_key": "operations", "score": 4.3, "full_mark": 5 },
    { "category": "講師満足度", "category_key": "instructor_satisfaction", "score": 4.5, "full_mark": 5 },
    { "category": "時間使い方", "category_key": "time_management", "score": 4.4, "full_mark": 5 },
    { "category": "質問対応", "category_key": "question_handling", "score": 4.6, "full_mark": 5 },
    { "category": "話し方", "category_key": "speaking_style", "score": 4.5, "full_mark": 5 },
    { "category": "予習", "category_key": "preparation", "score": 3.7, "full_mark": 5 },
    { "category": "意欲", "category_key": "motivation", "score": 3.9, "full_mark": 5 },
    { "category": "今後活用", "category_key": "future_application", "score": 3.8, "full_mark": 5 }
  ],
  "score_distributions": {
    "overall_satisfaction": [
      { "rating": 5, "count": 18 },
      { "rating": 4, "count": 22 },
      { "rating": 3, "count": 8 },
      { "rating": 2, "count": 2 },
      { "rating": 1, "count": 0 }
    ],
    "learning_amount": [
      { "rating": 5, "count": 17 },
      { "rating": 4, "count": 21 },
      { "rating": 3, "count": 9 },
      { "rating": 2, "count": 3 },
      { "rating": 1, "count": 0 }
    ]
  },
  "priority_comments": [
    {
      "id": "comment-001",
      "text": "非常にわかりやすい説明で、大規模言語モデルの基礎がよく理解できました。",
      "sentiment": "positive",
      "category": "content",
      "priority": "high",
      "fix_difficulty": null,
      "is_analysis_target": true,
      "question_type": "good_points"
    }
  ],
  "comments": [
    {
      "id": "comment-001",
      "text": "非常にわかりやすい説明で、大規模言語モデルの基礎がよく理解できました。",
      "sentiment": "positive",
      "category": "content",
      "priority": "high",
      "fix_difficulty": null,
      "is_analysis_target": true,
      "question_type": "good_points"
    },
    {
      "id": "comment-002",
      "text": "配布資料のPDFが一部文字化けしていました。",
      "sentiment": "negative",
      "category": "material",
      "priority": "high",
      "fix_difficulty": "medium",
      "is_analysis_target": true,
      "question_type": "improvements"
    }
  ]
}
```

### 4.2.3 年度比較データ取得

同一講座名の異なる年度・期間のデータを比較する。

**エンドポイント**: `GET /courses/compare`

**リクエストパラメータ (Query)**

| **名前** | **型** | **必須** | **説明** |
| --- | --- | --- | --- |
| `name` | string | ○ | 講座名 |
| `current_year` | number | ○ | 比較元の年度 |
| `current_term` | string | ○ | 比較元の期間 |
| `compare_year` | number | ○ | 比較先の年度 |
| `compare_term` | string | ○ | 比較先の期間 |
| `batch_type` | string | ○ | 分析タイプ |

**レスポンス**

```tsx
interface YearComparisonResponse {
  current: YearMetrics;
  comparison: YearMetrics;
  nps_trends: {
    current: NPSTrendItem[];
    comparison: NPSTrendItem[];
  };
  score_comparison: ScoreComparisonItem[];
}

// 年度メトリクス
interface YearMetrics {
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

// スコア比較
interface ScoreComparisonItem {
  category: string;             // カテゴリ名
  category_key: string;         // カテゴリキー
  current_score: number;        // 比較元スコア
  comparison_score: number;     // 比較先スコア
  difference: number;           // 差分（current - comparison）
}
```

**レスポンス例**

```json
{
  "current": {
    "academic_year": 2024,
    "term": "10月～12月",
    "total_responses": 2500,
    "session_count": 7,
    "average_nps": 25.2,
    "average_scores": {
      "overall_satisfaction": 4.35,
      "learning_amount": 4.28,
      "comprehension": 4.15,
      "operations": 4.32,
      "instructor_satisfaction": 4.62,
      "time_management": 4.58,
      "question_handling": 4.65,
      "speaking_style": 4.55,
      "preparation": 3.85,
      "motivation": 4.12,
      "future_application": 4.05
    }
  },
  "comparison": {
    "academic_year": 2023,
    "term": "10月～12月",
    "total_responses": 2200,
    "session_count": 6,
    "average_nps": 22.8,
    "average_scores": {
      "overall_satisfaction": 4.20,
      "learning_amount": 4.15,
      "comprehension": 4.00,
      "operations": 4.18,
      "instructor_satisfaction": 4.48,
      "time_management": 4.42,
      "question_handling": 4.50,
      "speaking_style": 4.40,
      "preparation": 3.70,
      "motivation": 3.98,
      "future_application": 3.90
    }
  },
  "nps_trends": {
    "current": [
      { "session": "第1回", "nps_score": 15.5 },
      { "session": "第2回", "nps_score": 22.3 }
    ],
    "comparison": [
      { "session": "第1回", "nps_score": 12.0 },
      { "session": "第2回", "nps_score": 18.5 }
    ]
  },
  "score_comparison": [
    {
      "category": "総合満足度",
      "category_key": "overall_satisfaction",
      "current_score": 4.35,
      "comparison_score": 4.20,
      "difference": 0.15
    }
  ]
}
```

---

## 4.3 データ管理 (Data Management)

### 4.3.1 アンケートデータアップロード

Excelファイルをアップロードし、アンケートデータを登録する。

**エンドポイント**: `POST /surveys/upload`

**Content-Type**: `multipart/form-data`

**リクエストボディ**

| フィールド | **型** | **必須** | **説明** |
| --- | --- | --- | --- |
| `file` | File | ○ | Excelファイル（.xlsx, .xls, .csv） |
| `course_name` | string | ○ | 講座名 |
| `academic_year` | number | ○ | 年度（例: 2024） |
| `term` | string | ○ | 期間 |
| `session` | string | ○ | 講義回（例: "第1回", "特別回"） |
| `lecture_date` | string | ○ | 講義日（YYYY-MM-DD） |
| `instructor_name` | string | ○ | 講師名 |
| `description`  | string | - | 講義内容 |
| `batch_type` | string | ○ | `preliminary` または `confirmed` |
| `zoom_participants` | number | ※ | Zoom参加者数（速報版時は必須） |
| `recording_views` | number | ※ | 録画視聴回数（確定版時は必須） |

**レスポンス（受付成功時: 202 Accepted）**

```tsx
interface UploadResponse {
  success: true;
  job_id: string;        // ジョブ識別子
  status_url: string;    // 状態確認用URL
  message: string;
}
```

**レスポンス例**

```tsx
{
  "success": true,
  "job_id": "job_abc12345",
  "status_url": "/api/v1/jobs/job_abc12345",
  "message": "アップロードを受け付けました。処理状況を確認してください。"
}
```

### 4.3.2 削除対象バッチ検索

削除対象のバッチを検索する。

> 注意: このAPIは講座単位（講座名・年度・期間）で検索し、該当講座の全バッチを返す。講義回（session）、講義日（lecture_date）、分析タイプ（batch_type）による絞り込みは、フロントエンドでレスポンスをフィルタリングして行う。これにより、削除画面でユーザーが講座を選択した時点でバッチ一覧を取得し、batch_id を含む情報を使って削除対象を特定できる。
> 

**エンドポイント**: `GET /surveys/batches/search`

**リクエストパラメータ (Query)**

| パラメータ | 型 | 必須 | 説明 |
| --- | --- | --- | --- |
| `course_name` | string | ○ | 講座名 |
| `academic_year` | number | ○ | 年度 |
| `term` | string | ○ | 期間 |

**レスポンス**

```tsx
interface BatchSearchResponse {
  batches: BatchSearchItem[];
}

interface BatchSearchItem {
  batch_id: number;             // survey_batches.id
  lecture_id: number;           // lectures.id
  session: string;              // 講義回
  lecture_date: string;         // 講義日
  batch_type: AnalysisType;     // preliminary / confirmed
  uploaded_at: string;          // アップロード日時
}
```

**レスポンス例**

```json
{
  "batches": [
    {
      "batch_id": 1,
      "lecture_id": 1,
      "session": "第1回",
      "lecture_date": "2024-10-07",
      "batch_type": "confirmed",
      "uploaded_at": "2024-10-15T10:00:00Z"
    },
    {
      "batch_id": 2,
      "lecture_id": 1,
      "session": "第1回",
      "lecture_date": "2024-10-07",
      "batch_type": "preliminary",
      "uploaded_at": "2024-10-08T09:00:00Z"
    }
  ]
}
```

### 4.3.3 アンケートバッチ削除

特定の講義回・分析タイプのデータを削除する。

**エンドポイント**: `DELETE /surveys/batches/:batchId`

**パスパラメータ (Path)**

| パラメータ | 型 | 説明 |
| --- | --- | --- |
| `batchId` | number | survey_batches.id |

**レスポンス（成功時）**

```tsx
interface DeleteResponse {
  success: true;
  deleted_batch_id: number;
  deleted_response_count: number;
  message: string;
}
```

**レスポンス例**

```json
{
  "success": true,
  "deleted_batch_id": 1,
  "deleted_response_count": 50,
  "message": "バッチID 1 のデータ（50件）を削除しました。"
}
```

---

## 4.4 その他

### 4.4.1 受講生属性一覧取得

利用可能な受講生属性の一覧を取得する。

**エンドポイント**: `GET /attributes`

**レスポンス**

```tsx
interface AttributesResponse {
  attributes: AttributeItem[];
}

interface AttributeItem {
  key: StudentAttribute;        // 属性キー（英語）
  label: string;                // 表示名（日本語）
}
```

**レスポンス例**

```json
{
  "attributes": [
    { "key": "all", "label": "全体" },
    { "key": "student", "label": "学生" },
    { "key": "corporate", "label": "会員企業" },
    { "key": "invited", "label": "招待枠" },
    { "key": "faculty", "label": "教員" },
    { "key": "other", "label": "その他/不明" }
  ]
}
```

### 4.4.2 ログインユーザー情報取得

ALBが付与したヘッダー情報を基に、現在のユーザー情報を返す。

**エンドポイント**: `GET /me`

**レスポンス**

```tsx
interface UserInfoResponse {
  sub: string;           // ユーザーID (x-amzn-oidc-identity)
  username: string;      // ユーザー名
  email: string;         // メールアドレス
  role: string;          // 権限ロール（Cognitoグループ等から判定）
}
```

**レスポンス例**

```json
{
  "sub": "a1b2c3d4-e5f6-7890-g1h2-i3j4k5l6m7n8",
  "username": "taro_yamada",
  "email": "taro.yamada@example.com",
  "role": "admin"
}
```

### 4.4.3 ログイン

ログインフローを開始する。ALBがCognitoのHosted UIへリダイレクトし、認証成功後にフロントエンドのトップページへリダイレクトする。

**エンドポイント**: `GET /login`

**処理フロー**

1. ブラウザが `/api/v1/login` へアクセス
2. ALBが未認証を検知し、CognitoのHosted UIへ302リダイレクト
3. ユーザーがCognitoでID/パスワードを入力
4. 認証成功後、ALBがセッションCookie（`AWSELBAuthSessionCookie`）を発行
5. FastAPIがフロントエンドのトップページ（`/`）へ302リダイレクト

**レスポンス**

- **302 Redirect**: 認証成功時、フロントエンドのトップページへリダイレクト

**フロントエンド実装例**

```tsx
// 認証切れ検知時にログインフローを開始
function redirectToLogin() {
  // fetchではリダイレクトを追跡できないため、ブラウザ全体を遷移させる
  window.location.href = '/api/v1/login';
}
```

### 4.4.4 ログアウト

ログアウト処理を実行する。ブラウザのセッションCookieを削除し、CognitoのログアウトエンドポイントへリダイレクトしてAWS側のセッションも終了させる。

**エンドポイント**: `GET /logout`

**処理フロー**

1. ブラウザが `/api/v1/logout` へアクセス
2. FastAPIがCookie削除のSet-Cookieヘッダーを付与
3. CognitoのログアウトURL（`https://[domain]/logout?client_id=...&logout_uri=...`）へ302リダイレクト
4. Cognito側のセッションが終了
5. フロントエンドのトップページ（`/`）へリダイレクト（未認証状態）

**レスポンス**

- **302 Redirect**: Cognitoのログアウトエンドポイントへリダイレクト

**フロントエンド実装例**

```tsx
// ログアウトボタンクリック時
function logout() {
  window.location.href = '/api/v1/logout';
}
```

---

## **4.5 非同期ジョブ管理**

- **4.5.1 ジョブ状態確認**
    
    アップロード処理などの非同期ジョブの進行状況と結果を取得する。
    
    **エンドポイント:** `GET /jobs/:jobId`
    
    **パスパラメータ:** `jobId` (string) - ジョブ識別子
    
    **レスポンス**
    
    ```tsx
    interface JobStatusResponse {
      job_id: string;
      status: 'queued' | 'processing' | 'completed' | 'failed';
      created_at: string;
      // status='completed' の場合のみ、処理結果が含まれる
      result?: {
        lecture_id: number;
        batch_id: number;
        response_count: number;
      };
      // status='failed' の場合のみ、エラー情報が含まれる
      error?: {
        code: string;
        message: string;
      };
    }
    ```
    
    **レスポンス例（処理中）**
    
    ```json
    {
      "job_id": "job_abc12345",
      "status": "processing",
      "created_at": "2024-10-07T10:00:00Z"
    }
    ```
    
    **レスポンス例（完了時）**
    
    ```json
    {
      "job_id": "job_abc12345",
      "status": "completed",
      "created_at": "2024-10-07T10:00:00Z",
      "result": {
        "lecture_id": 1,
        "batch_id": 10,
        "response_count": 50
      }
    }
    ```
    

---

# 5. Enum定義

### AnalysisType (BatchType)

- `preliminary`: 速報版
- `confirmed`: 確定版

### StudentAttribute

- `all`: 全体
- `student`: 学生
- `corporate`: 会員企業
- `invited`: 招待枠
- `faculty`: 教員
- `other`: その他

### QuestionType (設問タイプ)

- `learned`: 学んだこと
- `good_points`: 良かった点
- `improvements`: 改善点
- `instructor_feedback`: 講師へのフィードバック
- `future_requests`: 今後の要望
- `free_comment`: 自由コメント

### Sentiment

- `positive`, `neutral`, `negative`

### Priority (優先度)

- `high`: 高
- `medium`: 中
- `low`: 低

### FixDifficulty (修正難易度)

- `high`: 高
- `medium`: 中
- `low`: 低

### CommentCategory

- `content`: 講義内容
- `material`: 講義資料
- `instructor`: 講師
- `operation`: 運営
- `other`: その他

# 6. APIエンドポイント一覧

| メソッド | エンドポイント | 説明 | 認証 |
| --- | --- | --- | --- |
| GET | `/api/v1/login` | ログイン（Cognitoへリダイレクト） | 不要 |
| GET | `/api/v1/logout` | ログアウト（セッション破棄） | 必要 |
| GET | `/api/v1/courses` | 講座一覧取得 | 必要 |
| GET | `/api/v1/courses/detail` | 講座詳細取得 | 必要 |
| GET | `/api/v1/courses/trends` | 全体傾向データ取得 | 必要 |
| GET | `/api/v1/courses/compare` | 年度比較データ取得 | 必要 |
| GET | `/api/v1/lectures/:lectureId/analysis` | 講義回別分析データ取得 | 必要 |
| POST | `/api/v1/surveys/upload` | アンケートデータアップロード | 必要 |
| GET | `/api/v1/surveys/batches/search` | 削除対象バッチ検索 | 必要 |
| DELETE | `/api/v1/surveys/batches/:batchId` | アンケートバッチ削除 | 必要 |
| GET | `/api/v1/attributes` | 受講生属性一覧取得 | 必要 |
| GET | `/api/v1/me` | ログインユーザー情報取得 | 必要 |
| GET | `/api/v1/jobs/:jobId` | ジョブ状態確認（ポーリング用） | 必要 |
