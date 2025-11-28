import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, ComposedChart, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, TrendingDown, Calendar, User, BookOpen, Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import { Progress } from './ui/progress';
import { Checkbox } from './ui/checkbox';
import { Label } from './ui/label';
import { Button } from './ui/button';
import { fetchOverallTrends, ApiError } from '../api/client';
import type {
  OverallTrendsResponse,
  AnalysisType,
  StudentAttribute,
  ScoreItem,
} from '../types/api';
import {
  AnalysisTypeFromLabel,
  StudentAttributeFromLabel,
  SentimentLabels as SentimentLabelMap,
  CommentCategoryLabels as CategoryLabelMap,
} from '../types/api';

export type AnalysisTypeLabel = '速報版' | '確定版';
export type StudentAttributeLabel = '全体' | '学生' | '会員企業' | '招待枠' | '不明';

interface OverallTrendsProps {
  courseName: string;
  courseYear: number;
  coursePeriod: string;
  analysisType: AnalysisTypeLabel;
  studentAttribute: StudentAttributeLabel;
}

// 評価項目の設定（表示名とデータキー、色）- グループ分け
const evaluationItemGroups = [
  {
    groupName: '総合満足度',
    items: [
      { key: 'overall_satisfaction', label: '総合的な満足度', color: '#3b82f6' },
    ]
  },
  {
    groupName: '講義内容',
    items: [
      { key: 'learning_amount', label: '講義内容の学習量', color: '#8b5cf6' },
      { key: 'comprehension', label: '講義内容の理解度', color: '#ec4899' },
      { key: 'operations', label: '講義中の運営アナウンス', color: '#f59e0b' },
    ]
  },
  {
    groupName: '講師評価',
    items: [
      { key: 'instructor_satisfaction', label: '講師の総合的な満足度', color: '#10b981' },
      { key: 'time_management', label: '講師の授業時間の使い方', color: '#06b6d4' },
      { key: 'question_handling', label: '講師の質問対応', color: '#6366f1' },
      { key: 'speaking_style', label: '講師の話し方', color: '#f43f5e' },
    ]
  },
  {
    groupName: '受講生の自己評価',
    items: [
      { key: 'preparation', label: '自身の予習', color: '#84cc16' },
      { key: 'motivation', label: '自身の意欲', color: '#a855f7' },
      { key: 'future_application', label: '自身の今後への活用', color: '#0ea5e9' },
    ]
  },
];

// フラットな評価項目リスト（グラフ描画用）
const evaluationItems = evaluationItemGroups.flatMap(group => group.items);

export function OverallTrends({ courseName, courseYear, coursePeriod, analysisType, studentAttribute }: OverallTrendsProps) {
  const [data, setData] = useState<OverallTrendsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // チェックボックスで選択された項目を管理
  const [selectedItems, setSelectedItems] = useState<string[]>(['overall_satisfaction', 'instructor_satisfaction']);

  // API呼び出し
  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const batchType: AnalysisType = AnalysisTypeFromLabel[analysisType];
      const studentAttr: StudentAttribute = StudentAttributeFromLabel[studentAttribute] || 'all';

      const response = await fetchOverallTrends({
        name: courseName,
        academic_year: courseYear,
        term: coursePeriod,
        batch_type: batchType,
        student_attribute: studentAttr,
      });
      setData(response);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('データの取得に失敗しました');
      }
    } finally {
      setIsLoading(false);
    }
  }, [courseName, courseYear, coursePeriod, analysisType, studentAttribute]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // チェックボックスの切り替え
  const toggleItem = (itemKey: string) => {
    setSelectedItems(prev =>
      prev.includes(itemKey)
        ? prev.filter(k => k !== itemKey)
        : [...prev, itemKey]
    );
  };

  // ローディング表示
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="h-12 w-12 animate-spin text-blue-600 mb-4" />
        <p className="text-gray-600">データを読み込み中...</p>
      </div>
    );
  }

  // エラー表示
  if (error || !data) {
    return (
      <Card className="max-w-md mx-auto">
        <CardContent className="py-8">
          <div className="flex flex-col items-center text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
            <h2 className="text-lg font-semibold mb-2">エラーが発生しました</h2>
            <p className="text-gray-600 mb-6">{error || 'データを取得できませんでした'}</p>
            <Button onClick={loadData} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              再読み込み
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // APIレスポンスからUIデータを生成
  const {
    lecture_info,
    response_trends,
    participation_trends,
    nps_summary,
    nps_trends,
    score_trends,
    overall_averages,
    sentiment_summary,
    category_summary,
  } = data;

  // NPS関連
  const overallNPS = nps_summary.score;
  const npsColor = overallNPS >= 0 ? 'text-green-600' : 'text-red-600';
  const npsBgColor = overallNPS >= 0 ? 'bg-green-50' : 'bg-red-50';
  const npsBorderColor = overallNPS >= 0 ? 'border-green-200' : 'border-red-200';

  // 回答数・継続率データを変換
  const responseRetentionData = response_trends.map(item => ({
    session: item.session,
    responses: item.response_count,
    retentionRate: item.retention_rate,
  }));

  // 第1回の回答数（Y軸スケール調整用）
  const firstSessionResponses = responseRetentionData[0]?.responses || 100;

  // NPS推移データを変換
  const npsTrendData = nps_trends.map(item => ({
    session: item.session,
    nps: item.nps_score,
  }));

  // 評価項目推移データを変換
  const detailedTrendData = score_trends.map(item => ({
    session: item.session,
    ...item.scores,
  }));

  // 感情分析データを変換
  const sentimentData = sentiment_summary.map(item => ({
    name: SentimentLabelMap[item.sentiment],
    value: item.percentage,
    color: item.sentiment === 'positive' ? '#22c55e' : item.sentiment === 'negative' ? '#ef4444' : '#94a3b8',
  }));

  // カテゴリ別コメント数を変換
  const categoryData = category_summary.map(item => ({
    category: CategoryLabelMap[item.category],
    count: item.count,
  }));

  // Zoom参加者数/録画視聴回数データを変換
  const participationData = participation_trends.map(item => ({
    session: item.session,
    participants: item.zoom_participants,
    views: item.recording_views,
  }));

  return (
    <div className="space-y-6">
      {/* 講義回情報一覧 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            講義回情報一覧
          </CardTitle>
          <CardDescription>各講義回の講義日、講師名、講義内容</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[80px]">講義回</TableHead>
                <TableHead className="w-[120px]">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    講義日
                  </div>
                </TableHead>
                <TableHead className="w-[120px]">
                  <div className="flex items-center gap-1">
                    <User className="h-4 w-4" />
                    講師名
                  </div>
                </TableHead>
                <TableHead>講義内容</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {lecture_info.map((info) => (
                <TableRow key={info.lecture_id}>
                  <TableCell className="font-medium">{info.session}</TableCell>
                  <TableCell>{info.lecture_date}</TableCell>
                  <TableCell>{info.instructor_name}</TableCell>
                  <TableCell>{info.description || '-'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* 回答数と継続率の推移 */}
      <Card>
        <CardHeader>
          <CardTitle>回答数と継続率の推移</CardTitle>
          <CardDescription>各講義回のアンケート回答数と1回目を基準とした回答継続率</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={350}>
            <ComposedChart data={responseRetentionData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="session" />
              <YAxis yAxisId="left" domain={[0, firstSessionResponses]} />
              <YAxis yAxisId="right" orientation="right" domain={[0, 100]} />
              <Tooltip
                formatter={(value, name) => {
                  if (name === '継続率') {
                    return `${value}%`;
                  }
                  return value;
                }}
              />
              <Legend />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="responses"
                stroke="#3b82f6"
                name="回答数"
                strokeWidth={2}
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="retentionRate"
                stroke="#22c55e"
                name="継続率"
                strokeWidth={2}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Zoom参加者数の推移（速報版）/ 録画視聴回数の推移（確定版） - 全体の時のみ表示 */}
      {studentAttribute === '全体' && participationData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>
              {analysisType === '速報版' ? 'Zoom参加者数の推移' : '録画視聴回数の推移'}
            </CardTitle>
            <CardDescription>
              {analysisType === '速報版'
                ? '各講義回のZoom参加者数'
                : '各講義回の録画視聴回数'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={participationData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="session" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey={analysisType === '速報版' ? 'participants' : 'views'}
                  stroke={analysisType === '速報版' ? '#3b82f6' : '#22c55e'}
                  name={analysisType === '速報版' ? 'Zoom参加者数' : '録画視聴回数'}
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* NPS（推奨度）サマリー */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className={`${npsBorderColor} border-2`}>
          <CardHeader>
            <CardTitle>講座全体のNPSスコア</CardTitle>
            <CardDescription>Net Promoter Score（推奨者比率）</CardDescription>
          </CardHeader>
          <CardContent>
            <div className={`${npsBgColor} rounded-lg p-8 text-center`}>
              <div className="flex items-center justify-center gap-2 mb-2">
                {overallNPS >= 0 ? (
                  <TrendingUp className={`h-8 w-8 ${npsColor}`} />
                ) : (
                  <TrendingDown className={`h-8 w-8 ${npsColor}`} />
                )}
                <span className={`text-5xl ${npsColor}`}>
                  {overallNPS > 0 ? '+' : ''}{overallNPS.toFixed(1)}
                </span>
              </div>
              <p className="text-sm text-gray-600 mt-4">
                推奨者（9-10点）の割合から批判者（0-6点）の割合を引いた値
              </p>
            </div>
            <div className="mt-6 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm">推奨者（9-10点）</span>
                <span className="text-sm">{nps_summary.promoters_count}人（{nps_summary.promoters_percentage}%）</span>
              </div>
              <Progress value={nps_summary.promoters_percentage} className="h-2" />
              <div className="flex justify-between items-center">
                <span className="text-sm">中立者（7-8点）</span>
                <span className="text-sm">{nps_summary.neutrals_count}人（{nps_summary.neutrals_percentage}%）</span>
              </div>
              <Progress value={nps_summary.neutrals_percentage} className="h-2" />
              <div className="flex justify-between items-center">
                <span className="text-sm">批判者（0-6点）</span>
                <span className="text-sm">{nps_summary.detractors_count}人（{nps_summary.detractors_percentage}%）</span>
              </div>
              <Progress value={nps_summary.detractors_percentage} className="h-2" />
            </div>
          </CardContent>
        </Card>

        {/* NPS推移グラフ */}
        <Card>
          <CardHeader>
            <CardTitle>NPS推移</CardTitle>
            <CardDescription>各講義回のNPSスコア推移</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={npsTrendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="session" />
                <YAxis domain={[-100, 100]} />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="nps"
                  stroke="#3b82f6"
                  name="NPSスコア"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* 各回の平均点推移 */}
      <Card>
        <CardHeader>
          <CardTitle>各回の平均点推移</CardTitle>
          <CardDescription>評価項目の推移（5点満点）- 表示したい項目を選択してください</CardDescription>
        </CardHeader>
        <CardContent>
          {/* チェックボックスで項目を選択（グループ分け） */}
          <div className="mb-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {evaluationItemGroups.map((group) => (
              <div key={group.groupName} className="bg-gray-50 rounded-lg p-3">
                <h4 className="text-sm font-medium text-gray-700 mb-2 border-b border-gray-200 pb-1">
                  {group.groupName}
                </h4>
                <div className="space-y-2">
                  {group.items.map((item) => (
                    <div key={item.key} className="flex items-center space-x-2">
                      <Checkbox
                        id={`item-${item.key}`}
                        checked={selectedItems.includes(item.key)}
                        onCheckedChange={() => toggleItem(item.key)}
                      />
                      <Label
                        htmlFor={`item-${item.key}`}
                        className="text-sm cursor-pointer"
                        style={{ color: selectedItems.includes(item.key) ? item.color : undefined }}
                      >
                        {item.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {selectedItems.length > 0 ? (
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={detailedTrendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="session" />
                <YAxis domain={[0, 5]} />
                <Tooltip />
                <Legend />
                {evaluationItems
                  .filter(item => selectedItems.includes(item.key))
                  .map((item) => (
                    <Line
                      key={item.key}
                      type="monotone"
                      dataKey={item.key}
                      stroke={item.color}
                      name={item.label}
                      strokeWidth={2}
                    />
                  ))}
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[400px] flex items-center justify-center text-gray-500">
              表示する項目を選択してください
            </div>
          )}
        </CardContent>
      </Card>

      {/* 全体を通しての平均点 */}
      <Card>
        <CardHeader>
          <CardTitle>全体を通しての平均点</CardTitle>
          <CardDescription>全期間の評価項目別平均点（5点満点）</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {Object.entries(overall_averages).map(([key, category]) => (
              <div key={key} className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-sm font-medium text-gray-700 mb-3 border-b border-gray-200 pb-2">{category.label}</h3>
                <div className="space-y-3">
                  {category.items.map((item: ScoreItem, index: number) => (
                    <div key={index}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-gray-600">{item.name}</span>
                        <span className="text-sm font-semibold text-gray-900">
                          {item.score.toFixed(2)}
                        </span>
                      </div>
                      <Progress
                        value={(item.score / 5) * 100}
                        className="h-2"
                      />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* コメントの全体傾向 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* コメントのネガポジ比率 */}
        <Card>
          <CardHeader>
            <CardTitle>コメント感情分析</CardTitle>
            <CardDescription>全コメントのネガポジ比率</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={sentimentData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                  label={(entry) => `${entry.name}: ${entry.value}%`}
                >
                  {sentimentData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* カテゴリ別コメント数 */}
        <Card>
          <CardHeader>
            <CardTitle>カテゴリ別コメント数</CardTitle>
            <CardDescription>コメントの分類結果</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={categoryData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="category" type="category" width={100} />
                <Tooltip />
                <Bar dataKey="count" fill="#8b5cf6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
