import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Alert, AlertDescription } from './ui/alert';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, TrendingDown, Info } from 'lucide-react';
import type { Course } from './CourseList';

// 型定義追加
interface YearlyNPSPoint { session: string; nps: number }
interface YearlyCategoryScore { category: string; score: number }
interface YearlyMetric { averageNPS: number; averageOverall: number; averageInstructor: number; responseRate: number; totalResponses: number }

interface YearComparisonProps {
  currentCourseName: string;
  currentYear: string;
  currentPeriod: string;
  allCourses: Course[];
}

// モックデータ - 年度別NPS推移
const yearlyNPSData: Record<string, YearlyNPSPoint[]> = {
  '2024年度': [
    { session: '第1回', nps: 15.5 },
    { session: '第2回', nps: 22.3 },
    { session: '第3回', nps: 18.7 },
    { session: '第4回', nps: 28.4 },
    { session: '第5回', nps: 31.2 },
    { session: '第6回', nps: 35.8 },
  ],
  '2023年度': [
    { session: '第1回', nps: 12.3 },
    { session: '第2回', nps: 18.5 },
    { session: '第3回', nps: 16.2 },
    { session: '第4回', nps: 24.1 },
    { session: '第5回', nps: 27.8 },
    { session: '第6回', nps: 30.5 },
  ],
  '2022年度': [
    { session: '第1回', nps: 10.8 },
    { session: '第2回', nps: 15.2 },
    { session: '第3回', nps: 14.5 },
    { session: '第4回', nps: 20.3 },
    { session: '第5回', nps: 23.6 },
    { session: '第6回', nps: 26.9 },
  ],
};

// 年度別カテゴリ平均スコア
const yearlyCategoryData: Record<string, YearlyCategoryScore[]> = {
  '2024年度': [
    { category: '総合満足度', score: 4.35 },
    { category: '学習量', score: 4.28 },
    { category: '理解度', score: 4.15 },
    { category: '運営', score: 4.32 },
    { category: '講師満足度', score: 4.62 },
    { category: '時間使い方', score: 4.58 },
    { category: '質問対応', score: 4.65 },
    { category: '話し方', score: 4.55 },
  ],
  '2023年度': [
    { category: '総合満足度', score: 4.20 },
    { category: '学習量', score: 4.15 },
    { category: '理解度', score: 4.05 },
    { category: '運営', score: 4.18 },
    { category: '講師満足度', score: 4.48 },
    { category: '時間使い方', score: 4.42 },
    { category: '質問対応', score: 4.52 },
    { category: '話し方', score: 4.45 },
  ],
  '2022年度': [
    { category: '総合満足度', score: 4.10 },
    { category: '学習量', score: 4.05 },
    { category: '理解度', score: 3.95 },
    { category: '運営', score: 4.08 },
    { category: '講師満足度', score: 4.35 },
    { category: '時間使い方', score: 4.30 },
    { category: '質問対応', score: 4.40 },
    { category: '話し方', score: 4.32 },
  ],
};

// 年度別総合指標
const yearlyMetrics: Record<string, YearlyMetric> = {
  '2024年度': {
    averageNPS: 25.2,
    averageOverall: 4.35,
    averageInstructor: 4.62,
    responseRate: 90,
    totalResponses: 450,
  },
  '2023年度': {
    averageNPS: 21.8,
    averageOverall: 4.20,
    averageInstructor: 4.48,
    responseRate: 85,
    totalResponses: 420,
  },
  '2022年度': {
    averageNPS: 18.5,
    averageOverall: 4.10,
    averageInstructor: 4.35,
    responseRate: 82,
    totalResponses: 390,
  },
};

export function YearComparison({ currentCourseName, currentYear, currentPeriod, allCourses }: YearComparisonProps) {
  const [comparisonYear, setComparisonYear] = useState('');
  const [comparisonPeriod, setComparisonPeriod] = useState('');

  // 同じ講座名の他の年度・期間を取得
  const availableYearPeriods = allCourses
    .filter(c => c.name === currentCourseName && (c.year !== currentYear || c.period !== currentPeriod))
    .map(c => ({ year: c.year, period: c.period, key: `${c.year}_${c.period}` }))
    .filter((item, index, self) => self.findIndex(t => t.key === item.key) === index);

  const currentYearData = yearlyMetrics[currentYear] || yearlyMetrics['2024年度'];
  const comparisonYearData = comparisonYear ? yearlyMetrics[comparisonYear] : null;

  const currentYearPeriodLabel = `${currentYear} ${currentPeriod}`;
  const comparisonYearPeriodLabel = comparisonYear && comparisonPeriod ? `${comparisonYear} ${comparisonPeriod}` : '';

  // 比較用のNPSデータを統合
  const getCombinedNPSData = () => {
    if (!comparisonYear) return [];
    
    const current = yearlyNPSData[currentYear] || yearlyNPSData['2024年度'];
    const comparison = yearlyNPSData[comparisonYear] || yearlyNPSData['2023年度'];
    
    return current.map((item, index) => ({
      session: item.session,
      [currentYearPeriodLabel]: item.nps,
      [comparisonYearPeriodLabel]: comparison[index]?.nps || 0,
    }));
  };

  // 比較用のカテゴリデータを統合
  const getCombinedCategoryData = () => {
    if (!comparisonYear) return [];
    
    const current = yearlyCategoryData[currentYear] || yearlyCategoryData['2024年度'];
    const comparison = yearlyCategoryData[comparisonYear] || yearlyCategoryData['2023年度'];
    
    return current.map((item, index) => ({
      category: item.category,
      [currentYearPeriodLabel]: item.score,
      [comparisonYearPeriodLabel]: comparison[index]?.score || 0,
    }));
  };

  const calculateDifference = (current: number, comparison: number) => {
    const diff = current - comparison;
    return {
      value: Math.abs(diff),
      isPositive: diff > 0,
      formatted: diff > 0 ? `+${diff.toFixed(2)}` : diff.toFixed(2),
    };
  };

  return (
    <div className="space-y-6">
      {/* 比較年度選択 */}
      <Card>
        <CardHeader>
          <CardTitle>年度比較</CardTitle>
          <CardDescription>
            他の年度と比較して、講座の改善傾向や課題を分析できます
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm">現在の年度</label>
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="font-medium text-blue-900">{currentYear} {currentPeriod}</p>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm">比較する年度</label>
                {availableYearPeriods.length > 0 ? (
                  <Select 
                    value={comparisonYear ? `${comparisonYear}_${comparisonPeriod}` : ''} 
                    onValueChange={(value) => {
                      const selected = availableYearPeriods.find(item => item.key === value);
                      if (selected) {
                        setComparisonYear(selected.year);
                        setComparisonPeriod(selected.period);
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="比較する年度を選択" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableYearPeriods.map((item) => (
                        <SelectItem key={item.key} value={item.key}>
                          {item.year} {item.period}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertDescription>
                      「{currentCourseName}」の他の年度のデータがありません
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 比較が選択されている場合のみ表示 */}
      {comparisonYear && comparisonYearData && (
        <>
          {/* 総合指標の比較 */}
          <Card>
            <CardHeader>
              <CardTitle>総合指標の比較</CardTitle>
              <CardDescription>主要な指標を年度間で比較</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* 平均NPS */}
                <Card className="bg-gray-50">
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <p className="text-sm text-gray-600 mb-2">平均NPS</p>
                      <p className="text-2xl mb-1">{currentYearData.averageNPS.toFixed(1)}</p>
                      <div className="flex items-center justify-center gap-1 text-sm">
                        {(() => {
                          const diff = calculateDifference(currentYearData.averageNPS, comparisonYearData.averageNPS);
                          return (
                            <>
                              {diff.isPositive ? (
                                <TrendingUp className="h-4 w-4 text-green-600" />
                              ) : (
                                <TrendingDown className="h-4 w-4 text-red-600" />
                              )}
                              <span className={diff.isPositive ? 'text-green-600' : 'text-red-600'}>
                                {diff.formatted}
                              </span>
                            </>
                          );
                        })()}
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        前年: {comparisonYearData.averageNPS.toFixed(1)}
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* 総合満足度 */}
                <Card className="bg-gray-50">
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <p className="text-sm text-gray-600 mb-2">総合満足度</p>
                      <p className="text-2xl mb-1">{currentYearData.averageOverall.toFixed(2)}</p>
                      <div className="flex items-center justify-center gap-1 text-sm">
                        {(() => {
                          const diff = calculateDifference(currentYearData.averageOverall, comparisonYearData.averageOverall);
                          return (
                            <>
                              {diff.isPositive ? (
                                <TrendingUp className="h-4 w-4 text-green-600" />
                              ) : (
                                <TrendingDown className="h-4 w-4 text-red-600" />
                              )}
                              <span className={diff.isPositive ? 'text-green-600' : 'text-red-600'}>
                                {diff.formatted}
                              </span>
                            </>
                          );
                        })()}
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        前年: {comparisonYearData.averageOverall.toFixed(2)}
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* 講師満足度 */}
                <Card className="bg-gray-50">
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <p className="text-sm text-gray-600 mb-2">講師満足度</p>
                      <p className="text-2xl mb-1">{currentYearData.averageInstructor.toFixed(2)}</p>
                      <div className="flex items-center justify-center gap-1 text-sm">
                        {(() => {
                          const diff = calculateDifference(currentYearData.averageInstructor, comparisonYearData.averageInstructor);
                          return (
                            <>
                              {diff.isPositive ? (
                                <TrendingUp className="h-4 w-4 text-green-600" />
                              ) : (
                                <TrendingDown className="h-4 w-4 text-red-600" />
                              )}
                              <span className={diff.isPositive ? 'text-green-600' : 'text-red-600'}>
                                {diff.formatted}
                              </span>
                            </>
                          );
                        })()}
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        前年: {comparisonYearData.averageInstructor.toFixed(2)}
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* 回答率 */}
                <Card className="bg-gray-50">
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <p className="text-sm text-gray-600 mb-2">回答率</p>
                      <p className="text-2xl mb-1">{currentYearData.responseRate}%</p>
                      <div className="flex items-center justify-center gap-1 text-sm">
                        {(() => {
                          const diff = calculateDifference(currentYearData.responseRate, comparisonYearData.responseRate);
                          return (
                            <>
                              {diff.isPositive ? (
                                <TrendingUp className="h-4 w-4 text-green-600" />
                              ) : (
                                <TrendingDown className="h-4 w-4 text-red-600" />
                              )}
                              <span className={diff.isPositive ? 'text-green-600' : 'text-red-600'}>
                                {diff.formatted}%
                              </span>
                            </>
                          );
                        })()}
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        前年: {comparisonYearData.responseRate}%
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>

          {/* NPS推移の比較 */}
          <Card>
            <CardHeader>
              <CardTitle>NPS推移の年度比較</CardTitle>
              <CardDescription>講義回ごとのNPSスコアの推移を比較</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <LineChart data={getCombinedNPSData()}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="session" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey={currentYearPeriodLabel} 
                    stroke="#3b82f6" 
                    strokeWidth={3}
                    dot={{ r: 5 }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey={comparisonYearPeriodLabel} 
                    stroke="#94a3b8" 
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    dot={{ r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* カテゴリ別平均スコアの比較 */}
          <Card>
            <CardHeader>
              <CardTitle>カテゴリ別平均スコアの比較</CardTitle>
              <CardDescription>各評価項目の年度間比較</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={getCombinedCategoryData()}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="category" angle={-45} textAnchor="end" height={100} />
                  <YAxis domain={[0, 5]} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey={currentYearPeriodLabel} fill="#3b82f6" />
                  <Bar dataKey={comparisonYearPeriodLabel} fill="#94a3b8" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* 改善点と課題 */}
          <Card>
            <CardHeader>
              <CardTitle>年度比較サマリー</CardTitle>
              <CardDescription>主な改善点と課題</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <h4 className="flex items-center gap-2 mb-2">
                    <TrendingUp className="h-5 w-5 text-green-600" />
                    <span className="text-green-900">改善された点</span>
                  </h4>
                  <ul className="text-sm text-green-800 space-y-1 ml-7">
                    <li>• NPSスコアが前年度比で{calculateDifference(currentYearData.averageNPS, comparisonYearData.averageNPS).formatted}ポイント向上</li>
                    <li>• 総合満足度が{calculateDifference(currentYearData.averageOverall, comparisonYearData.averageOverall).formatted}ポイント改善</li>
                    <li>• アンケート回答率が{calculateDifference(currentYearData.responseRate, comparisonYearData.responseRate).formatted}%増加</li>
                  </ul>
                </div>

                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <h4 className="flex items-center gap-2 mb-2">
                    <Info className="h-5 w-5 text-blue-600" />
                    <span className="text-blue-900">今後の課題</span>
                  </h4>
                  <ul className="text-sm text-blue-800 space-y-1 ml-7">
                    <li>• 継続的な満足度向上のための施策実施</li>
                    <li>• 受講生の予習・復習支援の強化</li>
                    <li>• フィードバックを活かした講義内容の最適化</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* 比較年度が選択されていない場合 */}
      {!comparisonYear && availableYearPeriods.length > 0 && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            比較する年度を選択すると、年度間の詳細な比較分析が表示されます
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
