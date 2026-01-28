import type {
  ErrorResponse,
  CourseListResponse,
  CourseDetailResponse,
  OverallTrendsResponse,
  SessionAnalysisResponse,
  YearComparisonResponse,
  UploadResponse,
  BatchSearchResponse,
  DeleteResponse,
  AttributesResponse,
  UserInfoResponse,
  JobStatusResponse,
  AnalysisType,
  StudentAttribute,
} from '../types/api';

// ===== 設定 =====

const BASE_URL = '/api/v1';

// ===== 認証切れ時の共通リダイレクト =====
// 何回も同じ遷移をしないためのフラグ
let isRedirectingToLogin = false;

function redirectToLogin() {
  // SSRなど、window が無い環境対策（念のため）
  if (typeof window === 'undefined') return;

  // 多重遷移防止
  if (isRedirectingToLogin) return;

  // すでにログイン開始URLならループ防止
  if (window.location.pathname === `${BASE_URL}/login`) return;

  isRedirectingToLogin = true;
  window.location.href = `${BASE_URL}/login`;
}

// 「認証切れ」と判断する条件
function isAuthExpiredByStatus(status: number) {
  return status === 401 || status === 0;
}

// ===== エラークラス =====

export class ApiError extends Error {
  status: number;
  code: string;
  details?: Record<string, string>;

  constructor(
    status: number,
    code: string,
    message: string,
    details?: Record<string, string>
  ) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

// ===== 共通fetch処理 =====

async function fetchApi<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${BASE_URL}${endpoint}`;

  let response: Response;

  try {
    response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });
  } catch {
    // 通信失敗（CORS等）= status 0 相当として扱う
    redirectToLogin();
    // 以後の処理を止める（各コンポーネントで個別処理を書かせない）
    return new Promise<T>(() => {});
  }

  // 401 / 0: 認証切れ扱いでログインへ
  if (isAuthExpiredByStatus(response.status)) {
    redirectToLogin();
    return new Promise<T>(() => {});
  }

  // エラーレスポンスの処理（認証切れ以外）
  if (!response.ok) {
    let errorData: ErrorResponse | null = null;
    try {
      errorData = await response.json();
    } catch {
      // JSONパース失敗時はデフォルトエラー
    }

    throw new ApiError(
      response.status,
      errorData?.error?.code || 'UNKNOWN_ERROR',
      errorData?.error?.message || `APIエラー: ${response.status}`,
      errorData?.error?.details
    );
  }

  return response.json();
}

// multipart/form-data用のfetch（ファイルアップロード）
async function fetchApiMultipart<T>(
  endpoint: string,
  formData: FormData
): Promise<T> {
  const url = `${BASE_URL}${endpoint}`;

  let response: Response;

  try {
    response = await fetch(url, {
      method: 'POST',
      body: formData,
      // Content-Typeは自動設定（boundary含む）
    });
  } catch {
    // 通信失敗（CORS等）= status 0 相当として扱う
    redirectToLogin();
    return new Promise<T>(() => {});
  }

  // 401 / 0: 認証切れ扱いでログインへ
  if (isAuthExpiredByStatus(response.status)) {
    redirectToLogin();
    return new Promise<T>(() => {});
  }

  if (!response.ok) {
    let errorData: ErrorResponse | null = null;
    try {
      errorData = await response.json();
    } catch {
      // JSONパース失敗時はデフォルトエラー
    }

    throw new ApiError(
      response.status,
      errorData?.error?.code || 'UNKNOWN_ERROR',
      errorData?.error?.message || `APIエラー: ${response.status}`,
      errorData?.error?.details
    );
  }

  return response.json();
}

// ===== 1. 講座関連API =====

/**
 * 講座一覧取得
 * GET /courses
 */
export async function fetchCourses(params?: {
  name?: string;
  academic_year?: number;
  term?: string;
}): Promise<CourseListResponse> {
  const searchParams = new URLSearchParams();
  if (params?.name) searchParams.append('name', params.name);
  if (params?.academic_year) searchParams.append('academic_year', params.academic_year.toString());
  if (params?.term) searchParams.append('term', params.term);

  const query = searchParams.toString();
  const endpoint = query ? `/courses?${query}` : '/courses';

  return fetchApi<CourseListResponse>(endpoint);
}

/**
 * 講座詳細取得
 * GET /courses/detail
 */
export async function fetchCourseDetail(params: {
  name: string;
  academic_year: number;
  term: string;
}): Promise<CourseDetailResponse> {
  const searchParams = new URLSearchParams({
    name: params.name,
    academic_year: params.academic_year.toString(),
    term: params.term,
  });

  return fetchApi<CourseDetailResponse>(`/courses/detail?${searchParams}`);
}

// ===== 2. ダッシュボードAPI =====

/**
 * 全体傾向データ取得
 * GET /courses/trends
 */
export async function fetchOverallTrends(params: {
  name: string;
  academic_year: number;
  term: string;
  batch_type: AnalysisType;
  student_attribute?: StudentAttribute;
}): Promise<OverallTrendsResponse> {
  const searchParams = new URLSearchParams({
    name: params.name,
    academic_year: params.academic_year.toString(),
    term: params.term,
    batch_type: params.batch_type,
  });
  if (params.student_attribute) {
    searchParams.append('student_attribute', params.student_attribute);
  }

  return fetchApi<OverallTrendsResponse>(`/courses/trends?${searchParams}`);
}

/**
 * 講義回別分析データ取得
 * GET /lectures/:lectureId/analysis
 */
export async function fetchSessionAnalysis(
  lectureId: number,
  params: {
    batch_type: AnalysisType;
    student_attribute?: StudentAttribute;
  }
): Promise<SessionAnalysisResponse> {
  const searchParams = new URLSearchParams({
    batch_type: params.batch_type,
  });
  if (params.student_attribute) {
    searchParams.append('student_attribute', params.student_attribute);
  }

  return fetchApi<SessionAnalysisResponse>(`/lectures/${lectureId}/analysis?${searchParams}`);
}

/**
 * 年度比較データ取得
 * GET /courses/compare
 */
export async function fetchYearComparison(params: {
  name: string;
  current_year: number;
  current_term: string;
  compare_year: number;
  compare_term: string;
  batch_type: AnalysisType;
}): Promise<YearComparisonResponse> {
  const searchParams = new URLSearchParams({
    name: params.name,
    current_year: params.current_year.toString(),
    current_term: params.current_term,
    compare_year: params.compare_year.toString(),
    compare_term: params.compare_term,
    batch_type: params.batch_type,
  });

  return fetchApi<YearComparisonResponse>(`/courses/compare?${searchParams}`);
}

// ===== 3. データアップロードAPI =====

/**
 * アンケートデータアップロード
 * POST /surveys/upload
 */
export async function uploadSurveyData(params: {
  file: File;
  course_name: string;
  academic_year: number;
  term: string;
  session: string;
  lecture_date: string;
  instructor_name: string;
  description?: string;
  batch_type: AnalysisType;
  zoom_participants?: number;
  recording_views?: number;
}): Promise<UploadResponse> {
  const formData = new FormData();

  formData.append('file', params.file);
  formData.append('course_name', params.course_name);
  formData.append('academic_year', params.academic_year.toString());
  formData.append('term', params.term);
  formData.append('session', params.session);
  formData.append('lecture_date', params.lecture_date);
  formData.append('instructor_name', params.instructor_name);
  if (params.description) {
    formData.append('description', params.description);
  }
  formData.append('batch_type', params.batch_type);
  if (params.zoom_participants !== undefined) {
    formData.append('zoom_participants', params.zoom_participants.toString());
  }
  if (params.recording_views !== undefined) {
    formData.append('recording_views', params.recording_views.toString());
  }

  return fetchApiMultipart<UploadResponse>('/surveys/upload', formData);
}

// ===== 4. データ削除API =====

/**
 * 削除対象バッチ検索
 * GET /surveys/batches/search
 */
export async function searchBatches(params: {
  course_name: string;
  academic_year: number;
  term: string;
}): Promise<BatchSearchResponse> {
  const searchParams = new URLSearchParams({
    course_name: params.course_name,
    academic_year: params.academic_year.toString(),
    term: params.term,
  });

  return fetchApi<BatchSearchResponse>(`/surveys/batches/search?${searchParams}`);
}

/**
 * アンケートバッチ削除
 * DELETE /surveys/batches/:batchId
 */
export async function deleteBatch(batchId: number): Promise<DeleteResponse> {
  return fetchApi<DeleteResponse>(`/surveys/batches/${batchId}`, {
    method: 'DELETE',
  });
}

// ===== 5. 受講生属性API =====

/**
 * 受講生属性一覧取得
 * GET /attributes
 */
export async function fetchAttributes(): Promise<AttributesResponse> {
  return fetchApi<AttributesResponse>('/attributes');
}

// ===== 6. ユーザー情報API =====

/**
 * ログインユーザー情報取得
 * GET /me
 */
export async function fetchUserInfo(): Promise<UserInfoResponse> {
  return fetchApi<UserInfoResponse>('/me');
}

// ===== 7. 非同期ジョブ管理API =====

/**
 * ジョブ状態確認
 * GET /jobs/:jobId
 */
export async function fetchJobStatus(jobId: string): Promise<JobStatusResponse> {
  return fetchApi<JobStatusResponse>(`/jobs/${jobId}`);
}

// ===== 8. 認証API =====

/**
 * ログアウト
 * ログアウトエンドポイントへリダイレクト
 */

const COGNITO_DOMAIN = 'ap-northeast-1tnj7xwspp.auth.ap-northeast-1.amazoncognito.com';
const CLIENT_ID = '4ukh5lqeoglamjvthd6g87ghlu';
const SIGN_OUT_URL = 'https://le-questionnaire-analysis-app.lecture.weblab-dev.com';

export function logout(): void {

  const url =
    `https://${COGNITO_DOMAIN}/logout` +
    `?client_id=${encodeURIComponent(CLIENT_ID)}` +
    `&logout_uri=${encodeURIComponent(SIGN_OUT_URL)}`;

  window.location.assign(url);

}
