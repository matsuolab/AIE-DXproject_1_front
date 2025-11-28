import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Alert, AlertDescription } from './ui/alert';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, TrendingDown, Info, Loader2, AlertCircle } from 'lucide-react';
import { formatAcademicYear, parseAcademicYear } from '../lib/course-utils';
import { fetchYearComparison } from '../api/client';
import type { CourseItem, YearComparisonResponse } from '../types/api';
import { AnalysisTypeFromLabel } from '../types/api';

// UI表示用の型
type AnalysisTypeLabel = '速報版' | '確定版';

interface YearComparisonProps {
  currentCourseName: string;
  currentYear: number;       // 年度（例: 2024）
  currentPeriod: string;
  allCourses: CourseItem[];
  analysisType: AnalysisTypeLabel;
}

export function YearComparison({ currentCourseName, currentYear, currentPeriod, allCourses, analysisType }: YearComparisonProps) {
  const [comparisonYear, setComparisonYear] = useState('');
  const [comparisonPeriod, setComparisonPeriod] = useState('');
  const [data, setData] = useState<YearComparisonResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 表示用の年度文字列
  const currentYearDisplay = formatAcademicYear(currentYear);

  // 同じ講座名の他の年度・期間を取得
  const availableYearPeriods = allCourses
    .filter(c => c.name === currentCourseName && (c.academic_year !== currentYear || c.term !== currentPeriod))
    .map(c => ({ year: formatAcademicYear(c.academic_year), period: c.term, key: `${formatAcademicYear(c.academic_year)}_${c.term}` }))
    .filter((item, index, self) => self.findIndex(t => t.key === item.key) === index);

  // データ取得
  const loadData = useCallback(async () => {
    if (!comparisonYear || !comparisonPeriod) return;

    setIsLoading(true);
    setError(null);
    try {
      const apiAnalysisType = AnalysisTypeFromLabel[analysisType];
      const comparisonYearNum = parseAcademicYear(comparisonYear);

      const response = await fetchYearComparison({
        name: currentCourseName,
        current_year: currentYear,
        current_term: currentPeriod,
        compare_year: comparisonYearNum,
        compare_term: comparisonPeriod,
        batch_type: apiAnalysisType,
      });
      setData(response);
    } catch (err) {
      console.error('Failed to fetch year comparison:', err);
      setError('比較データの取得に失敗しました');
      setData(null);
    } finally {
      setIsLoading(false);
    }
  }, [currentCourseName, currentYear, currentPeriod, comparisonYear, comparisonPeriod, analysisType]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const currentYearPeriodLabel = `${currentYearDisplay} ${currentPeriod}`;
  const comparisonYearPeriodLabel = comparisonYear && comparisonPeriod ? `${comparisonYear} ${comparisonPeriod}` : '';

  // 比較用のNPSデータを統合
  const getCombinedNPSData = () => {
    if (!data) return [];

    const maxLen = Math.max(data.nps_trends.current.length, data.nps_trends.comparison.length);
    const result = [];

    for (let i = 0; i < maxLen; i++) {
      const currentItem = data.nps_trends.current[i];
      const comparisonItem = data.nps_trends.comparison[i];
      result.push({
        session: currentItem?.session || comparisonItem?.session || '',
        [currentYearPeriodLabel]: currentItem?.nps_score ?? null,
        [comparisonYearPeriodLabel]: comparisonItem?.nps_score ?? null,
      });
    }

    return result;
  };

  // 比較用のカテゴリデータを統合
  const getCombinedCategoryData = () => {
    if (!data) return [];

    return data.score_comparison.map(item => ({
      category: item.category,
      [currentYearPeriodLabel]: item.current_score,
      [comparisonYearPeriodLabel]: item.comparison_score,
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
                  <p className="font-medium text-blue-900">{currentYearDisplay} {currentPeriod}</p>
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

      {/* ローディング */}
      {isLoading && (
        <Card>
          <CardContent className="py-12">
            <div className="flex items-center justify-center gap-2">
              <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
              <span className="text-gray-500">比較データを取得中...</span>
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

      {/* 比較が選択されている場合のみ表示 */}
      {comparisonYear && comparisonPeriod && data && !isLoading && (
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
                      <p className="text-2xl mb-1">{data.current.average_nps.toFixed(1)}</p>
                      <div className="flex items-center justify-center gap-1 text-sm">
                        {(() => {
                          const diff = calculateDifference(data.current.average_nps, data.comparison.average_nps);
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
                        比較: {data.comparison.average_nps.toFixed(1)}
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* 総合満足度 */}
                <Card className="bg-gray-50">
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <p className="text-sm text-gray-600 mb-2">総合満足度</p>
                      <p className="text-2xl mb-1">{data.current.average_scores.overall_satisfaction.toFixed(2)}</p>
                      <div className="flex items-center justify-center gap-1 text-sm">
                        {(() => {
                          const diff = calculateDifference(
                            data.current.average_scores.overall_satisfaction,
                            data.comparison.average_scores.overall_satisfaction
                          );
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
                        比較: {data.comparison.average_scores.overall_satisfaction.toFixed(2)}
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* 講師満足度 */}
                <Card className="bg-gray-50">
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <p className="text-sm text-gray-600 mb-2">講師満足度</p>
                      <p className="text-2xl mb-1">{data.current.average_scores.instructor_satisfaction.toFixed(2)}</p>
                      <div className="flex items-center justify-center gap-1 text-sm">
                        {(() => {
                          const diff = calculateDifference(
                            data.current.average_scores.instructor_satisfaction,
                            data.comparison.average_scores.instructor_satisfaction
                          );
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
                        比較: {data.comparison.average_scores.instructor_satisfaction.toFixed(2)}
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* 総回答数 */}
                <Card className="bg-gray-50">
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <p className="text-sm text-gray-600 mb-2">総回答数</p>
                      <p className="text-2xl mb-1">{data.current.total_responses}</p>
                      <div className="flex items-center justify-center gap-1 text-sm">
                        {(() => {
                          const diff = calculateDifference(data.current.total_responses, data.comparison.total_responses);
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
                        比較: {data.comparison.total_responses}
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
                    connectNulls
                  />
                  <Line
                    type="monotone"
                    dataKey={comparisonYearPeriodLabel}
                    stroke="#94a3b8"
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    dot={{ r: 4 }}
                    connectNulls
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
                    {data.score_comparison
                      .filter(item => item.difference > 0)
                      .slice(0, 3)
                      .map(item => (
                        <li key={item.category_key}>
                          • {item.category}が+{item.difference.toFixed(2)}ポイント向上
                        </li>
                      ))}
                    {data.current.average_nps > data.comparison.average_nps && (
                      <li>
                        • NPSスコアが{calculateDifference(data.current.average_nps, data.comparison.average_nps).formatted}ポイント向上
                      </li>
                    )}
                  </ul>
                </div>

                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <h4 className="flex items-center gap-2 mb-2">
                    <TrendingDown className="h-5 w-5 text-yellow-600" />
                    <span className="text-yellow-900">要改善点</span>
                  </h4>
                  <ul className="text-sm text-yellow-800 space-y-1 ml-7">
                    {data.score_comparison
                      .filter(item => item.difference < 0)
                      .slice(0, 3)
                      .map(item => (
                        <li key={item.category_key}>
                          • {item.category}が{item.difference.toFixed(2)}ポイント低下
                        </li>
                      ))}
                    {data.score_comparison.filter(item => item.difference < 0).length === 0 && (
                      <li>• 全項目で前年度比で改善または維持されています</li>
                    )}
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
