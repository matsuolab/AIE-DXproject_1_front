import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { BarChart, Bar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { AlertCircle, ThumbsUp, ThumbsDown, Minus, TrendingUp, TrendingDown, Calendar, User, BookOpen, Loader2 } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './ui/accordion';
import { fetchSessionAnalysis } from '../api/client';
import type {
  SessionSummary,
  SessionAnalysisResponse,
  CommentItem,
  Sentiment,
  CommentCategory,
  Priority,
  FixDifficulty,
  RiskLevel,
  RatingDistribution,
} from '../types/api';
import {
  AnalysisTypeFromLabel,
  StudentAttributeFromLabel,
  SentimentLabels,
  CommentCategoryLabels,
  PriorityLabels,
  FixDifficultyLabels,
  RiskLevelLabels,
  QuestionTypeLabels,
} from '../types/api';

// UI表示用の型（CourseDashboardから渡される）
type AnalysisTypeLabel = '速報版' | '確定版';
type StudentAttributeLabel = '全体' | '学生' | '会員企業' | '招待枠' | '不明';

interface SessionAnalysisProps {
  courseSessions: SessionSummary[];
  analysisType: AnalysisTypeLabel;
  studentAttribute: StudentAttributeLabel;
}

// 評価分布を「5点」「4点」形式に変換
function formatDistribution(distribution: RatingDistribution[]): { rating: string; count: number }[] {
  return distribution
    .slice()
    .sort((a, b) => b.rating - a.rating)
    .map(item => ({
      rating: `${item.rating}点`,
      count: item.count,
    }));
}

export function SessionAnalysis({ courseSessions, analysisType, studentAttribute }: SessionAnalysisProps) {
  const [selectedLectureId, setSelectedLectureId] = useState<number | null>(null);
  const [data, setData] = useState<SessionAnalysisResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sentimentFilter, setSentimentFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [fixDifficultyFilter, setFixDifficultyFilter] = useState<string>('all');
  const [riskLevelFilter, setRiskLevelFilter] = useState<string>('all');
  const [questionTypeFilter, setQuestionTypeFilter] = useState<string>('all');

  // データ取得
  const loadData = useCallback(async () => {
    if (selectedLectureId === null) return;

    setIsLoading(true);
    setError(null);
    try {
      const apiAnalysisType = AnalysisTypeFromLabel[analysisType];
      const apiAttribute = StudentAttributeFromLabel[studentAttribute];

      const response = await fetchSessionAnalysis(selectedLectureId, {
        batch_type: apiAnalysisType,
        student_attribute: apiAttribute === 'all' ? undefined : apiAttribute,
      });
      setData(response);
    } catch (err) {
      console.error('Failed to fetch session analysis:', err);
      setError('データの取得に失敗しました');
      setData(null);
    } finally {
      setIsLoading(false);
    }
  }, [selectedLectureId, analysisType, studentAttribute]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // 選択された講義回の情報
  const selectedSession = courseSessions.find(s => s.lecture_id === selectedLectureId);

  // コメントフィルタリング
  const filteredComments = (data?.comments || []).filter((comment: CommentItem) => {
    // 「学んだこと」のコメントは常に非表示
    if (comment.question_type === 'learned') {
      return false;
    }
    const sentimentMatch = sentimentFilter === 'all' || comment.sentiment === sentimentFilter;
    const categoryMatch = categoryFilter === 'all' || comment.category === categoryFilter;
    const priorityMatch = priorityFilter === 'all' || comment.priority === priorityFilter;
    const fixDifficultyMatch = fixDifficultyFilter === 'all' || comment.fix_difficulty === fixDifficultyFilter;
    const riskLevelMatch = riskLevelFilter === 'all' || comment.risk_level === riskLevelFilter;
    const questionTypeMatch = questionTypeFilter === 'all' || comment.question_type === questionTypeFilter;
    return sentimentMatch && categoryMatch && priorityMatch && fixDifficultyMatch && riskLevelMatch && questionTypeMatch;
  });


  // ラベル別の集計を計算
  const allComments = data?.comments || [];

  const labelStats = {
    questionType: {} as Record<string, number>,
    sentiment: {} as Record<string, number>,
    category: {} as Record<string, number>,
    priority: {} as Record<string, number>,
    fixDifficulty: {} as Record<string, number>,
    riskLevel: {} as Record<string, number>,
  };

  allComments.forEach((comment: CommentItem) => {
    // 設問タイプ
    if (comment.question_type) {
      labelStats.questionType[comment.question_type] = (labelStats.questionType[comment.question_type] || 0) + 1;
    }
    // 感情
    if (comment.sentiment) {
      labelStats.sentiment[comment.sentiment] = (labelStats.sentiment[comment.sentiment] || 0) + 1;
    }
    // カテゴリ
    if (comment.category) {
      labelStats.category[comment.category] = (labelStats.category[comment.category] || 0) + 1;
    }
    // 優先度
    if (comment.priority) {
      labelStats.priority[comment.priority] = (labelStats.priority[comment.priority] || 0) + 1;
    }
    // 修正難易度
    if (comment.fix_difficulty) {
      labelStats.fixDifficulty[comment.fix_difficulty] = (labelStats.fixDifficulty[comment.fix_difficulty] || 0) + 1;
    }
    // リスクレベル
    if (comment.risk_level) {
      labelStats.riskLevel[comment.risk_level] = (labelStats.riskLevel[comment.risk_level] || 0) + 1;
    }
  });

  // NPS表示用の色
  const npsScore = data?.nps.score ?? 0;
  const npsColor = npsScore >= 0 ? 'text-green-600' : 'text-red-600';
  const npsBgColor = npsScore >= 0 ? 'bg-green-50' : 'bg-red-50';

  const getSentimentIcon = (sentiment: Sentiment | null) => {
    switch (sentiment) {
    case 'positive':
      return <ThumbsUp className="h-4 w-4 text-green-600" />;
    case 'negative':
      return <ThumbsDown className="h-4 w-4 text-red-600" />;
    default:
      return <Minus className="h-4 w-4 text-gray-600" />;
    }
  };

  interface BadgeConfig {
    variant: 'default' | 'secondary' | 'outline';
    className?: string;
  }

  const getSentimentBadge = (sentiment: Sentiment | null) => {
    if (!sentiment) {
      return <Badge variant="secondary">未分析</Badge>;
    }
    const variants: Record<Sentiment, BadgeConfig> = {
      positive: { variant: 'default', className: 'bg-green-100 text-green-800 hover:bg-green-100' },
      negative: { variant: 'default', className: 'bg-red-100 text-red-800 hover:bg-red-100' },
      neutral: { variant: 'secondary', className: '' },
    };
    const config = variants[sentiment];
    return <Badge {...config}>{SentimentLabels[sentiment]}</Badge>;
  };

  const getCategoryBadge = (category: CommentCategory | null) => {
    if (!category) {
      return <Badge variant="outline">未分類</Badge>;
    }
    return <Badge variant="outline">{CommentCategoryLabels[category]}</Badge>;
  };

  const getPriorityBadge = (priority: Priority | null) => {
    if (!priority) {
      return <Badge variant="outline">未判定</Badge>;
    }
    const variants: Record<Priority, BadgeConfig> = {
      high: { variant: 'default', className: 'bg-orange-100 text-orange-800 hover:bg-orange-100' },
      medium: { variant: 'default', className: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100' },
      low: { variant: 'default', className: 'bg-gray-100 text-gray-800 hover:bg-gray-100' },
    };
    const config = variants[priority];
    return <Badge {...config}>{PriorityLabels[priority]}</Badge>;
  };

  const getFixDifficultyBadge = (fixDifficulty: FixDifficulty | null) => {
    if (!fixDifficulty) {
      return <Badge variant="outline">未判定</Badge>;
    }
    const variants: Record<FixDifficulty, BadgeConfig> = {
      easy: { variant: 'default', className: 'bg-green-100 text-green-800 hover:bg-green-100' },
      hard: { variant: 'default', className: 'bg-red-100 text-red-800 hover:bg-red-100' },
      none: { variant: 'default', className: 'bg-gray-100 text-gray-800 hover:bg-gray-100' },
    };
    const config = variants[fixDifficulty];
    return <Badge {...config}>{FixDifficultyLabels[fixDifficulty]}</Badge>;
  };

  const getRiskLevelBadge = (riskLevel: RiskLevel | null) => {
    if (!riskLevel) {
      return <Badge variant="outline">未判定</Badge>;
    }
    const variants: Record<RiskLevel, BadgeConfig> = {
      flag: { variant: 'default', className: 'bg-red-100 text-red-800 hover:bg-red-100' },
      safe: { variant: 'default', className: 'bg-green-100 text-green-800 hover:bg-green-100' },
    };
    const config = variants[riskLevel];
    return <Badge {...config}>{RiskLevelLabels[riskLevel]}</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* 講義回セレクター */}
      <Card>
        <CardHeader>
          <CardTitle>{selectedSession?.session || '講義回を選択'}</CardTitle>
          <CardDescription>分析したい講義回を選択してください</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="flex-1 max-w-xs">
              <label className="text-sm mb-2 block">講義回</label>
              <Select
                value={selectedLectureId?.toString() || ''}
                onValueChange={(value) => setSelectedLectureId(Number(value))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="講義回を選択" />
                </SelectTrigger>
                <SelectContent>
                  {courseSessions.map((session) => (
                    <SelectItem key={session.lecture_id} value={session.lecture_id.toString()}>
                      {session.session}（{session.lecture_date}）
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 講義情報 */}
            {data?.lecture_info && (
              <div className="bg-blue-50 rounded-lg p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="text-xs text-gray-500">講義日</p>
                    <p className="font-medium">{data.lecture_info.lecture_date}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <User className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="text-xs text-gray-500">講師名</p>
                    <p className="font-medium">{data.lecture_info.instructor_name}</p>
                  </div>
                </div>
                {data.lecture_info.description && (
                  <div className="flex items-start gap-3">
                    <BookOpen className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div>
                      <p className="text-xs text-gray-500">講義内容</p>
                      <p className="font-medium">{data.lecture_info.description}</p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 講義回が選択されていない場合のメッセージ */}
      {!selectedLectureId && (
        <Card>
          <CardContent className="py-12">
            <p className="text-center text-gray-500">
              講義回を選択すると、詳細な分析結果が表示されます
            </p>
          </CardContent>
        </Card>
      )}

      {/* ローディング */}
      {isLoading && (
        <Card>
          <CardContent className="py-12">
            <div className="flex items-center justify-center gap-2">
              <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
              <span className="text-gray-500">データを取得中...</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* エラー */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="py-6">
            <div className="flex items-center gap-2 text-red-600">
              <AlertCircle className="h-5 w-5" />
              <span>{error}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* NPSと評価内訳 + レーダーチャート（横並び） */}
      {selectedLectureId && data && !isLoading && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 当該回の評価詳細 */}
          <Card>
            <CardHeader>
              <CardTitle>NPSと評価内訳</CardTitle>
              <CardDescription>この講義回のNPSスコアと分類</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* NPSスコア */}
                <div className={`${npsBgColor} rounded-lg p-6`}>
                  <div className="text-center">
                    <p className="text-sm text-gray-600 mb-2">NPSスコア</p>
                    <div className="flex items-center justify-center gap-2">
                      {npsScore >= 0 ? (
                        <TrendingUp className={`h-6 w-6 ${npsColor}`} />
                      ) : (
                        <TrendingDown className={`h-6 w-6 ${npsColor}`} />
                      )}
                      <span className={`text-4xl ${npsColor}`}>
                        {npsScore > 0 ? '+' : ''}{npsScore.toFixed(1)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* NPS内訳 */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">推奨者（9-10点）</span>
                    <span className="text-sm">{data.nps.promoters_count}人（{data.nps.promoters_percentage.toFixed(1)}%）</span>
                  </div>
                  <Progress value={data.nps.promoters_percentage} className="h-2" />
                  <div className="flex justify-between items-center">
                    <span className="text-sm">中立者（7-8点）</span>
                    <span className="text-sm">{data.nps.neutrals_count}人（{data.nps.neutrals_percentage.toFixed(1)}%）</span>
                  </div>
                  <Progress value={data.nps.neutrals_percentage} className="h-2" />
                  <div className="flex justify-between items-center">
                    <span className="text-sm">批判者（0-6点）</span>
                    <span className="text-sm">{data.nps.detractors_count}人（{data.nps.detractors_percentage.toFixed(1)}%）</span>
                  </div>
                  <Progress value={data.nps.detractors_percentage} className="h-2" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 当該回の平均点一覧（レーダーチャート） */}
          <Card>
            <CardHeader>
              <CardTitle>全項目の平均点（レーダーチャート）</CardTitle>
              <CardDescription>各評価項目の5点満点での平均スコア</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <RadarChart data={data.average_scores}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="category" />
                  <PolarRadiusAxis angle={90} domain={[0, 5]} />
                  <Radar
                    name="平均点"
                    dataKey="score"
                    stroke="#3b82f6"
                    fill="#3b82f6"
                    fillOpacity={0.6}
                  />
                  <Legend />
                  <Tooltip />
                </RadarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 評価分布詳細（主要項目） */}
      {selectedLectureId && data && !isLoading && (
        <Card>
          <CardHeader>
            <CardTitle>評価分布詳細</CardTitle>
            <CardDescription>主要項目の段階評価分布（5点満点）</CardDescription>
          </CardHeader>
          <CardContent>
            <Accordion type="multiple" defaultValue={['overall']} className="w-full">
              {/* 総合満足度 */}
              <AccordionItem value="overall">
                <AccordionTrigger>総合満足度</AccordionTrigger>
                <AccordionContent>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <ResponsiveContainer width="100%" height={180}>
                      <BarChart data={formatDistribution(data.score_distributions.overall_satisfaction)} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" />
                        <YAxis dataKey="rating" type="category" width={40} />
                        <Tooltip />
                        <Bar dataKey="count" fill="#3b82f6" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* 講義内容グループ */}
              <AccordionItem value="lecture-content">
                <AccordionTrigger>講義内容</AccordionTrigger>
                <AccordionContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-gray-50 rounded-lg p-3">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">学習量</h4>
                      <ResponsiveContainer width="100%" height={150}>
                        <BarChart data={formatDistribution(data.score_distributions.learning_amount)} layout="vertical">
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis type="number" tick={{ fontSize: 10 }} />
                          <YAxis dataKey="rating" type="category" width={35} tick={{ fontSize: 11 }} />
                          <Tooltip />
                          <Bar dataKey="count" fill="#8b5cf6" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">理解度</h4>
                      <ResponsiveContainer width="100%" height={150}>
                        <BarChart data={formatDistribution(data.score_distributions.comprehension)} layout="vertical">
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis type="number" tick={{ fontSize: 10 }} />
                          <YAxis dataKey="rating" type="category" width={35} tick={{ fontSize: 11 }} />
                          <Tooltip />
                          <Bar dataKey="count" fill="#ec4899" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">運営アナウンス</h4>
                      <ResponsiveContainer width="100%" height={150}>
                        <BarChart data={formatDistribution(data.score_distributions.operations)} layout="vertical">
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis type="number" tick={{ fontSize: 10 }} />
                          <YAxis dataKey="rating" type="category" width={35} tick={{ fontSize: 11 }} />
                          <Tooltip />
                          <Bar dataKey="count" fill="#10b981" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* 講師評価グループ */}
              <AccordionItem value="instructor">
                <AccordionTrigger>講師評価</AccordionTrigger>
                <AccordionContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-gray-50 rounded-lg p-3">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">総合満足度</h4>
                      <ResponsiveContainer width="100%" height={150}>
                        <BarChart data={formatDistribution(data.score_distributions.instructor_satisfaction)} layout="vertical">
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis type="number" tick={{ fontSize: 10 }} />
                          <YAxis dataKey="rating" type="category" width={35} tick={{ fontSize: 11 }} />
                          <Tooltip />
                          <Bar dataKey="count" fill="#f59e0b" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">時間の使い方</h4>
                      <ResponsiveContainer width="100%" height={150}>
                        <BarChart data={formatDistribution(data.score_distributions.time_management)} layout="vertical">
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis type="number" tick={{ fontSize: 10 }} />
                          <YAxis dataKey="rating" type="category" width={35} tick={{ fontSize: 11 }} />
                          <Tooltip />
                          <Bar dataKey="count" fill="#06b6d4" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">質問対応</h4>
                      <ResponsiveContainer width="100%" height={150}>
                        <BarChart data={formatDistribution(data.score_distributions.question_handling)} layout="vertical">
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis type="number" tick={{ fontSize: 10 }} />
                          <YAxis dataKey="rating" type="category" width={35} tick={{ fontSize: 11 }} />
                          <Tooltip />
                          <Bar dataKey="count" fill="#6366f1" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">話し方</h4>
                      <ResponsiveContainer width="100%" height={150}>
                        <BarChart data={formatDistribution(data.score_distributions.speaking_style)} layout="vertical">
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis type="number" tick={{ fontSize: 10 }} />
                          <YAxis dataKey="rating" type="category" width={35} tick={{ fontSize: 11 }} />
                          <Tooltip />
                          <Bar dataKey="count" fill="#f43f5e" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* 受講生の自己評価グループ */}
              <AccordionItem value="self-evaluation">
                <AccordionTrigger>受講生の自己評価</AccordionTrigger>
                <AccordionContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-gray-50 rounded-lg p-3">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">予習</h4>
                      <ResponsiveContainer width="100%" height={150}>
                        <BarChart data={formatDistribution(data.score_distributions.preparation)} layout="vertical">
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis type="number" tick={{ fontSize: 10 }} />
                          <YAxis dataKey="rating" type="category" width={35} tick={{ fontSize: 11 }} />
                          <Tooltip />
                          <Bar dataKey="count" fill="#84cc16" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">意欲</h4>
                      <ResponsiveContainer width="100%" height={150}>
                        <BarChart data={formatDistribution(data.score_distributions.motivation)} layout="vertical">
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis type="number" tick={{ fontSize: 10 }} />
                          <YAxis dataKey="rating" type="category" width={35} tick={{ fontSize: 11 }} />
                          <Tooltip />
                          <Bar dataKey="count" fill="#a855f7" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">今後への活用</h4>
                      <ResponsiveContainer width="100%" height={150}>
                        <BarChart data={formatDistribution(data.score_distributions.future_application)} layout="vertical">
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis type="number" tick={{ fontSize: 10 }} />
                          <YAxis dataKey="rating" type="category" width={35} tick={{ fontSize: 11 }} />
                          <Tooltip />
                          <Bar dataKey="count" fill="#0ea5e9" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </CardContent>
        </Card>
      )}

      {/* 重要コメント */}
      {selectedLectureId && data && !isLoading && (
        <Card className="border-orange-200 bg-orange-50/30">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <AlertCircle className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">
                    重要コメント
                    <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-100 text-xs">重要度：高</Badge>
                  </CardTitle>
                  <CardDescription>優先的に確認すべきコメント</CardDescription>
                </div>
              </div>
              {data.priority_comments.length > 0 && (
                <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-100">
                  {data.priority_comments.length}件
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {data.priority_comments.length > 0 ? (
              <div className="grid gap-4">
                {data.priority_comments.map((comment) => (
                  <div
                    key={comment.id}
                    className={`p-4 rounded-lg border-l-4 bg-white shadow-sm ${comment.sentiment === 'positive'
                      ? 'border-l-green-500'
                      : comment.sentiment === 'negative'
                        ? 'border-l-red-500'
                        : 'border-l-gray-400'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      {getSentimentIcon(comment.sentiment)}
                      {getSentimentBadge(comment.sentiment)}
                      {getCategoryBadge(comment.category)}
                    </div>
                    <p className="text-sm text-gray-700 leading-relaxed">{comment.text}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="p-3 bg-gray-100 rounded-full w-fit mx-auto mb-3">
                  <AlertCircle className="h-6 w-6 text-gray-400" />
                </div>
                <p className="text-sm text-gray-500">
                  この回には重要度の高いコメントがありません
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ラベル集計表示 */}
      <Card>
        <CardHeader>
          <CardTitle>コメント分析サマリー</CardTitle>
          <CardDescription>各ラベルの分布状況</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* 感情 */}
            <div>
              <h3 className="text-sm font-semibold mb-3">感情</h3>
              <div className="space-y-2">
                {Object.entries(labelStats.sentiment).map(([sentiment, count]) => (
                  <div key={sentiment} className="flex items-center justify-between">
                    <span className="text-sm">{SentimentLabels[sentiment as Sentiment] || sentiment}</span>
                    <Badge variant="outline">{count}件</Badge>
                  </div>
                ))}
              </div>
            </div>

            {/* カテゴリ */}
            <div>
              <h3 className="text-sm font-semibold mb-3">カテゴリ</h3>
              <div className="space-y-2">
                {Object.entries(labelStats.category).map(([category, count]) => (
                  <div key={category} className="flex items-center justify-between">
                    <span className="text-sm">{CommentCategoryLabels[category as CommentCategory] || category}</span>
                    <Badge variant="outline">{count}件</Badge>
                  </div>
                ))}
              </div>
            </div>

            {/* 優先度 */}
            <div>
              <h3 className="text-sm font-semibold mb-3">優先度</h3>
              <div className="space-y-2">
                {Object.entries(labelStats.priority).map(([priority, count]) => (
                  <div key={priority} className="flex items-center justify-between">
                    <span className="text-sm">{PriorityLabels[priority as Priority] || priority}</span>
                    <Badge variant="outline">{count}件</Badge>
                  </div>
                ))}
              </div>
            </div>

            {/* 修正難易度 */}
            <div>
              <h3 className="text-sm font-semibold mb-3">修正難易度</h3>
              <div className="space-y-2">
                {Object.entries(labelStats.fixDifficulty).map(([difficulty, count]) => (
                  <div key={difficulty} className="flex items-center justify-between">
                    <span className="text-sm">{FixDifficultyLabels[difficulty as FixDifficulty] || difficulty}</span>
                    <Badge variant="outline">{count}件</Badge>
                  </div>
                ))}
              </div>
            </div>

            {/* リスクレベル */}
            <div>
              <h3 className="text-sm font-semibold mb-3">リスクレベル</h3>
              <div className="space-y-2">
                {Object.entries(labelStats.riskLevel).map(([level, count]) => (
                  <div key={level} className="flex items-center justify-between">
                    <span className="text-sm">{RiskLevelLabels[level as RiskLevel] || level}</span>
                    <Badge variant="outline">{count}件</Badge>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* コメント一覧 */}
      {selectedLectureId && data && !isLoading && (
        <Card>
          <CardHeader>
            <CardTitle>コメント一覧</CardTitle>
            <CardDescription>フィルタリングして表示</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4 mb-4">
              <div>
                <label className="text-sm mb-2 block">設問タイプ</label>
                <Select value={questionTypeFilter} onValueChange={setQuestionTypeFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">すべて</SelectItem>
                    <SelectItem value="good_points">良かった点</SelectItem>
                    <SelectItem value="improvements">改善点</SelectItem>
                    <SelectItem value="instructor_feedback">講師フィードバック</SelectItem>
                    <SelectItem value="future_requests">今後の要望</SelectItem>
                    <SelectItem value="free_comment">自由コメント</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm mb-2 block">感情</label>
                <Select value={sentimentFilter} onValueChange={setSentimentFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">すべて</SelectItem>
                    <SelectItem value="positive">ポジティブ</SelectItem>
                    <SelectItem value="neutral">ニュートラル</SelectItem>
                    <SelectItem value="negative">ネガティブ</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm mb-2 block">カテゴリ</label>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">すべて</SelectItem>
                    <SelectItem value="content">講義内容</SelectItem>
                    <SelectItem value="material">講義資料</SelectItem>
                    <SelectItem value="operation">運営</SelectItem>
                    <SelectItem value="instructor">講師</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm mb-2 block">重要度</label>
                <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">すべて</SelectItem>
                    <SelectItem value="high">高</SelectItem>
                    <SelectItem value="medium">中</SelectItem>
                    <SelectItem value="low">低</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm mb-2 block">修正難易度</label>
                <Select value={fixDifficultyFilter} onValueChange={setFixDifficultyFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">すべて</SelectItem>
                    <SelectItem value="easy">容易</SelectItem>
                    <SelectItem value="hard">難しい</SelectItem>
                    <SelectItem value="none">なし</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm mb-2 block">リスク</label>
                <Select value={riskLevelFilter} onValueChange={setRiskLevelFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">すべて</SelectItem>
                    <SelectItem value="flag">要注意</SelectItem>
                    <SelectItem value="safe">安全</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[120px]">設問タイプ</TableHead>
                    <TableHead className="w-[100px]">感情</TableHead>
                    <TableHead className="w-[120px]">カテゴリ</TableHead>
                    <TableHead className="w-[100px]">重要度</TableHead>
                    <TableHead className="w-[100px]">修正難易度</TableHead>
                    <TableHead className="w-[100px]">リスク</TableHead>
                    <TableHead>コメント</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredComments.length > 0 ? (
                    filteredComments.map((comment) => (
                      <TableRow key={comment.id}>
                        <TableCell>
                          <Badge variant="outline">
                            {QuestionTypeLabels[comment.question_type]}
                          </Badge>
                        </TableCell>
                        <TableCell>{getSentimentBadge(comment.sentiment)}</TableCell>
                        <TableCell>{getCategoryBadge(comment.category)}</TableCell>
                        <TableCell>{getPriorityBadge(comment.priority)}</TableCell>
                        <TableCell>{getFixDifficultyBadge(comment.fix_difficulty)}</TableCell>
                        <TableCell>{getRiskLevelBadge(comment.risk_level)}</TableCell>
                        <TableCell>{comment.text}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-gray-500 py-8">
                        条件に一致するコメントがありません
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
