import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, ComposedChart, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { Progress } from './ui/progress';
import { Checkbox } from './ui/checkbox';
import { Label } from './ui/label';
import { useState } from 'react';

export type AnalysisType = '速報版' | '確定版';
export type StudentAttribute = '全体' | '学生' | '会員企業' | '招待枠' | '不明';

interface OverallTrendsProps {
  courseName: string;
  analysisType: AnalysisType;
  studentAttribute: StudentAttribute;
}

// モックデータ - NPS推移（速報版と確定版）
const npsTrendData = {
  '速報版': [
    { session: '第1回', nps: 12.5 },
    { session: '第2回', nps: 20.0 },
    { session: '第3回', nps: 16.0 },
    { session: '第4回', nps: 25.2 },
    { session: '第5回', nps: 28.5 },
    { session: '第6回', nps: 32.1 },
  ],
  '確定版': [
    { session: '第1回', nps: 15.5 },
    { session: '第2回', nps: 22.3 },
    { session: '第3回', nps: 18.7 },
    { session: '第4回', nps: 28.4 },
    { session: '第5回', nps: 31.2 },
    { session: '第6回', nps: 35.8 },
  ],
};

// 回答数と離脱率の推移データ（速報版と確定版）
interface ResponseRetentionEntry {
  session: string;
  responses: number;
  retentionRate: number;
  student: number;
  corporate: number;
  invited: number;
  unknown: number;
}

const responseRetentionData: Record<AnalysisType, ResponseRetentionEntry[]> = {
  '速報版': [
    { session: '第1回', responses: 350, retentionRate: 100, student: 140, corporate: 155, invited: 40, unknown: 15 },
    { session: '第2回', responses: 338, retentionRate: 96.6, student: 136, corporate: 150, invited: 38, unknown: 14 },
    { session: '第3回', responses: 325, retentionRate: 92.9, student: 130, corporate: 145, invited: 36, unknown: 14 },
    { session: '第4回', responses: 315, retentionRate: 90.0, student: 126, corporate: 141, invited: 35, unknown: 13 },
    { session: '第5回', responses: 308, retentionRate: 88.0, student: 123, corporate: 137, invited: 34, unknown: 14 },
    { session: '第6回', responses: 302, retentionRate: 86.3, student: 121, corporate: 134, invited: 33, unknown: 14 },
  ],
  '確定版': [
    { session: '第1回', responses: 450, retentionRate: 100, student: 180, corporate: 200, invited: 50, unknown: 20 },
    { session: '第2回', responses: 432, retentionRate: 96.0, student: 175, corporate: 190, invited: 48, unknown: 19 },
    { session: '第3回', responses: 418, retentionRate: 92.9, student: 168, corporate: 185, invited: 47, unknown: 18 },
    { session: '第4回', responses: 405, retentionRate: 90.0, student: 162, corporate: 180, invited: 45, unknown: 18 },
    { session: '第5回', responses: 395, retentionRate: 87.8, student: 158, corporate: 175, invited: 44, unknown: 18 },
    { session: '第6回', responses: 388, retentionRate: 86.2, student: 155, corporate: 172, invited: 43, unknown: 18 },
  ],
};

// 詳細な評価項目別推移データ（速報版と確定版）
const detailedTrendData = {
  '速報版': [
    { session: '第1回', 総合満足度: 4.0, 学習量: 3.9, 理解度: 3.8, 運営: 4.1, 講師満足度: 4.3, 時間使い方: 4.2, 質問対応: 4.4, 話し方: 4.3, 予習: 3.5, 意欲: 3.7, 今後活用: 3.6 },
    { session: '第2回', 総合満足度: 4.1, 学習量: 4.0, 理解度: 3.9, 運営: 4.2, 講師満足度: 4.4, 時間使い方: 4.3, 質問対応: 4.5, 話し方: 4.4, 予習: 3.7, 意欲: 3.9, 今後活用: 3.8 },
    { session: '第3回', 総合満足度: 3.9, 学習量: 3.8, 理解度: 3.7, 運営: 4.0, 講師満足度: 4.2, 時間使い方: 4.1, 質問対応: 4.3, 話し方: 4.2, 予習: 3.6, 意欲: 3.8, 今後活用: 3.7 },
    { session: '第4回', 総合満足度: 4.2, 学習量: 4.1, 理解度: 4.0, 運営: 4.3, 講師満足度: 4.5, 時間使い方: 4.4, 質問対応: 4.6, 話し方: 4.5, 予習: 3.8, 意欲: 4.0, 今後活用: 3.9 },
    { session: '第5回', 総合満足度: 4.3, 学習量: 4.2, 理解度: 4.1, 運営: 4.4, 講師満足度: 4.6, 時間使い方: 4.5, 質問対応: 4.7, 話し方: 4.6, 予習: 3.9, 意欲: 4.1, 今後活用: 4.0 },
    { session: '第6回', 総合満足度: 4.4, 学習量: 4.3, 理解度: 4.2, 運営: 4.5, 講師満足度: 4.5, 時間使い方: 4.4, 質問対応: 4.6, 話し方: 4.5, 予習: 4.0, 意欲: 4.2, 今後活用: 4.1 },
  ],
  '確定版': [
    { session: '第1回', 総合満足度: 4.2, 学習量: 4.1, 理解度: 4.0, 運営: 4.3, 講師満足度: 4.5, 時間使い方: 4.4, 質問対応: 4.6, 話し方: 4.5, 予習: 3.7, 意欲: 3.9, 今後活用: 3.8 },
    { session: '第2回', 総合満足度: 4.3, 学習量: 4.2, 理解度: 4.1, 運営: 4.4, 講師満足度: 4.6, 時間使い方: 4.5, 質問対応: 4.7, 話し方: 4.6, 予習: 3.9, 意欲: 4.1, 今後活用: 4.0 },
    { session: '第3回', 総合満足度: 4.1, 学習量: 4.0, 理解度: 3.9, 運営: 4.2, 講師満足度: 4.4, 時間使い方: 4.3, 質問対応: 4.5, 話し方: 4.4, 予習: 3.8, 意欲: 4.0, 今後活用: 3.9 },
    { session: '第4回', 総合満足度: 4.4, 学習量: 4.3, 理解度: 4.2, 運営: 4.5, 講師満足度: 4.7, 時間使い方: 4.6, 質問対応: 4.8, 話し方: 4.7, 予習: 4.0, 意欲: 4.2, 今後活用: 4.1 },
    { session: '第5回', 総合満足度: 4.5, 学習量: 4.4, 理解度: 4.3, 運営: 4.6, 講師満足度: 4.8, 時間使い方: 4.7, 質問対応: 4.9, 話し方: 4.8, 予習: 4.1, 意欲: 4.3, 今後活用: 4.2 },
    { session: '第6回', 総合満足度: 4.6, 学習量: 4.5, 理解度: 4.4, 運営: 4.7, 講師満足度: 4.7, 時間使い方: 4.6, 質問対応: 4.8, 話し方: 4.7, 予習: 4.2, 意欲: 4.4, 今後活用: 4.3 },
  ],
};

// 評価項目の設定（表示名とデータキー、色）
const evaluationItems = [
  { key: '総合満足度', label: '総合的な満足度', color: '#3b82f6' },
  { key: '学習量', label: '講義内容の学習量', color: '#8b5cf6' },
  { key: '理解度', label: '講義内容の理解度', color: '#ec4899' },
  { key: '運営', label: '講義中の運営アナウンス', color: '#f59e0b' },
  { key: '講師満足度', label: '講師の総合的な満足度', color: '#10b981' },
  { key: '時間使い方', label: '講師の授業時間の使い方', color: '#06b6d4' },
  { key: '質問対応', label: '講師の質問対応', color: '#6366f1' },
  { key: '話し方', label: '講師の話し方', color: '#f43f5e' },
  { key: '予習', label: '自身の予習', color: '#84cc16' },
  { key: '意欲', label: '自身の意欲', color: '#a855f7' },
  { key: '今後活用', label: '自身の今後への活用', color: '#0ea5e9' },
];

// 全体を通しての平均点（速報版と確定版）
const overallAverages = {
  '速報版': {
    overall: {
      label: '総合満足度',
      items: [
        { name: '本日の総合的な満足度', score: 4.15 }
      ]
    },
    content: {
      label: '講義内容',
      items: [
        { name: '講義内容の学習量', score: 4.08 },
        { name: '講義内容の理解度', score: 3.95 },
        { name: '講義中の運営アナウンス', score: 4.12 }
      ]
    },
    instructor: {
      label: '講師評価',
      items: [
        { name: '講師の総合的な満足度', score: 4.42 },
        { name: '講師の授業時間の使い方', score: 4.38 },
        { name: '講師の質問対応', score: 4.45 },
        { name: '講師の話し方', score: 4.35 }
      ]
    },
    selfEval: {
      label: '受講生の自己評価',
      items: [
        { name: '自身の予習', score: 3.65 },
        { name: '自身の意欲', score: 3.92 },
        { name: '自身の今後への活用', score: 3.85 }
      ]
    }
  },
  '確定版': {
    overall: {
      label: '総合満足度',
      items: [
        { name: '本日の総合的な満足度', score: 4.35 }
      ]
    },
    content: {
      label: '講義内容',
      items: [
        { name: '講義内容の学習量', score: 4.28 },
        { name: '講義内容の理解度', score: 4.15 },
        { name: '講義中の運営アナウンス', score: 4.32 }
      ]
    },
    instructor: {
      label: '講師評価',
      items: [
        { name: '講師の総合的な満足度', score: 4.62 },
        { name: '講師の授業時間の使い方', score: 4.58 },
        { name: '講師の質問対応', score: 4.65 },
        { name: '講師の話し方', score: 4.55 }
      ]
    },
    selfEval: {
      label: '受講生の自己評価',
      items: [
        { name: '自身の予習', score: 3.85 },
        { name: '自身の意欲', score: 4.12 },
        { name: '自身の今後への活用', score: 4.05 }
      ]
    }
  }
};

const sentimentData = {
  '速報版': [
    { name: 'ポジティブ', value: 62, color: '#22c55e' },
    { name: 'ニュートラル', value: 26, color: '#94a3b8' },
    { name: 'ネガティブ', value: 12, color: '#ef4444' },
  ],
  '確定版': [
    { name: 'ポジティブ', value: 65, color: '#22c55e' },
    { name: 'ニュートラル', value: 25, color: '#94a3b8' },
    { name: 'ネガティブ', value: 10, color: '#ef4444' },
  ],
};

const categoryData = {
  '速報版': [
    { category: '講義内容', count: 98 },
    { category: '講義資料', count: 52 },
    { category: '運営', count: 38 },
    { category: 'その他', count: 28 },
  ],
  '確定版': [
    { category: '講義内容', count: 125 },
    { category: '講義資料', count: 67 },
    { category: '運営', count: 45 },
    { category: 'その他', count: 35 },
  ],
};

// 属性別のデータ調整係数（全体を1.0として）
const attributeFactors = {
  '全体': { factor: 1.0, npsAdjust: 0 },
  '学生': { factor: 0.4, npsAdjust: -3.2 },
  '会員企業': { factor: 0.44, npsAdjust: 5.1 },
  '招待枠': { factor: 0.11, npsAdjust: -1.5 },
  '不明': { factor: 0.05, npsAdjust: -8.0 },
};

// 属性別にデータをフィルタリングする関数
function getAttributeResponseCount(sessionData: ResponseRetentionEntry, attribute: StudentAttribute): number {
  if (attribute === '全体') return sessionData.responses;
  const attrMap: Record<Exclude<StudentAttribute, '全体'>, 'student' | 'corporate' | 'invited' | 'unknown'> = {
    '学生': 'student',
    '会員企業': 'corporate',
    '招待枠': 'invited',
    '不明': 'unknown'
  };
  const key = attrMap[attribute];
  return sessionData[key] ?? 0;
}

// 属性別にNPSを調整する関数
function adjustNPSForAttribute(baseNPS: number, attribute: StudentAttribute): number {
  return baseNPS + attributeFactors[attribute].npsAdjust;
}

// 属性別にスコアを調整する関数（微調整）
function adjustScoreForAttribute(baseScore: number, attribute: StudentAttribute): number {
  const adjustments: { [key: string]: number } = {
    '全体': 0,
    '学生': -0.15,
    '会員企業': 0.12,
    '招待枠': -0.08,
    '不明': -0.25
  };
  return Math.max(1, Math.min(5, baseScore + adjustments[attribute]));
}

export function OverallTrends({ analysisType, studentAttribute }: OverallTrendsProps) {
  // チェックボックスで選択された項目を管理
  const [selectedItems, setSelectedItems] = useState<string[]>(['総合満足度', '学習量', '理解度', '運営', '講師満足度']);

  // チェックボックスの切り替え
  const toggleItem = (itemKey: string) => {
    setSelectedItems(prev => 
      prev.includes(itemKey)
        ? prev.filter(k => k !== itemKey)
        : [...prev, itemKey]
    );
  };

  // 分析タイプに応じたデータを選択
  const baseNPSTrend = npsTrendData[analysisType];
  const baseResponseRetention = responseRetentionData[analysisType];
  const baseDetailedTrend = detailedTrendData[analysisType];
  const baseOverallAverages = overallAverages[analysisType];
  const baseSentiment = sentimentData[analysisType];
  const baseCategory = categoryData[analysisType];

  // 属性に応じてデータを調整
  const currentNPSTrend = baseNPSTrend.map(item => ({
    ...item,
    nps: adjustNPSForAttribute(item.nps, studentAttribute)
  }));

  // 回答数と継続率を属性別に計算
  const attributeResponseData = baseResponseRetention.map(item => ({
    ...item,
    responses: getAttributeResponseCount(item, studentAttribute)
  }));
  
  // 第1回の回答数を基準に継続率を再計算
  const firstSessionAttributeResponses = attributeResponseData[0]?.responses || 1;
  const currentResponseRetention = attributeResponseData.map(item => ({
    ...item,
    retentionRate: (item.responses / firstSessionAttributeResponses) * 100
  }));

  const currentOverallAverages = Object.fromEntries(
    Object.entries(baseOverallAverages).map(([key, category]) => [
      key,
      {
        ...category,
        items: category.items.map(item => ({
          ...item,
          score: adjustScoreForAttribute(item.score, studentAttribute)
        }))
      }
    ])
  );

  const currentSentiment = baseSentiment;
  const currentCategory = baseCategory.map(item => ({
    ...item,
    count: Math.round(item.count * attributeFactors[studentAttribute].factor)
  }));

  // 1回目の回答数を取得（Y軸のスケール調整用）
  const firstSessionResponses = currentResponseRetention[0]?.responses || 100;

  // 全体のNPSスコアを計算（速報版と確定版、属性で異なる）
  const baseNPS = analysisType === '速報版' ? 21.8 : 25.2;
  const overallNPS = adjustNPSForAttribute(baseNPS, studentAttribute);
  const npsColor = overallNPS >= 0 ? 'text-green-600' : 'text-red-600';
  const npsBgColor = overallNPS >= 0 ? 'bg-green-50' : 'bg-red-50';
  const npsBorderColor = overallNPS >= 0 ? 'border-green-200' : 'border-red-200';

  // NPS内訳も分析タイプと属性に応じて変更
  const baseBreakdown = analysisType === '速報版' 
    ? { promoters: 42, neutrals: 36, detractors: 22 }
    : { promoters: 45, neutrals: 35, detractors: 20 };
  
  const attributeBreakdownAdjust: { [key: string]: { promoters: number, neutrals: number, detractors: number } } = {
    '全体': { promoters: 0, neutrals: 0, detractors: 0 },
    '学生': { promoters: -5, neutrals: 2, detractors: 3 },
    '会員企業': { promoters: 8, neutrals: -3, detractors: -5 },
    '招待枠': { promoters: -3, neutrals: 1, detractors: 2 },
    '不明': { promoters: -12, neutrals: 4, detractors: 8 },
  };
  
  const npsBreakdown = {
    promoters: Math.max(0, Math.min(100, baseBreakdown.promoters + attributeBreakdownAdjust[studentAttribute].promoters)),
    neutrals: Math.max(0, Math.min(100, baseBreakdown.neutrals + attributeBreakdownAdjust[studentAttribute].neutrals)),
    detractors: Math.max(0, Math.min(100, baseBreakdown.detractors + attributeBreakdownAdjust[studentAttribute].detractors))
  };

  return (
    <div className="space-y-6">
      {/* 回答数と継続率の推移 */}
      <Card>
        <CardHeader>
          <CardTitle>回答数と継続率の推移</CardTitle>
          <CardDescription>各講義回のアンケート回答数と1回目を基準とした回答継続率</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={350}>
            <ComposedChart data={currentResponseRetention}>
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
                <span className="text-sm">{npsBreakdown.promoters}%</span>
              </div>
              <Progress value={npsBreakdown.promoters} className="h-2" />
              <div className="flex justify-between items-center">
                <span className="text-sm">中立者（7-8点）</span>
                <span className="text-sm">{npsBreakdown.neutrals}%</span>
              </div>
              <Progress value={npsBreakdown.neutrals} className="h-2" />
              <div className="flex justify-between items-center">
                <span className="text-sm">批判者（0-6点）</span>
                <span className="text-sm">{npsBreakdown.detractors}%</span>
              </div>
              <Progress value={npsBreakdown.detractors} className="h-2" />
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
              <LineChart data={currentNPSTrend}>
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
          {/* チェックボックスで項目を選択 */}
          <div className="mb-6 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {evaluationItems.map((item) => (
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

          {selectedItems.length > 0 ? (
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={baseDetailedTrend.map(item => ({
                ...item,
                ...Object.fromEntries(
                  Object.entries(item).filter(([key]) => key === 'session' || selectedItems.includes(key))
                    .map(([key, value]) => [
                      key,
                      key === 'session' ? value : adjustScoreForAttribute(value as number, studentAttribute)
                    ])
                )
              }))}>
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
          <div className="space-y-6">
            {Object.entries(currentOverallAverages).map(([key, category]) => (
              <div key={key}>
                <h3 className="mb-3">{category.label}</h3>
                <div className="space-y-3 ml-4">
                  {category.items.map((item, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="text-sm text-gray-700">{item.name}</span>
                      <div className="flex items-center gap-3">
                        <Progress 
                          value={(item.score / 5) * 100} 
                          className="w-32 h-2"
                        />
                        <span className="text-sm min-w-[3rem] text-right">
                          {item.score.toFixed(2)}
                        </span>
                      </div>
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
                  data={currentSentiment}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                  label={(entry) => `${entry.name}: ${entry.value}%`}
                >
                  {currentSentiment.map((entry, index) => (
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
              <BarChart data={currentCategory} layout="vertical">
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