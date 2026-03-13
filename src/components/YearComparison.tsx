import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Alert, AlertDescription } from './ui/alert';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, TrendingDown, Info, Loader2, AlertCircle, GitCompareArrows, Award, BarChart3 } from 'lucide-react';
import { formatAcademicYear, parseAcademicYear } from '../lib/course-utils';
import { fetchYearComparison } from '../api/client';
import { getDummyYearComparison } from '../data/dummy';
import type { CourseItem, YearComparisonResponse } from '../types/api';
import { AnalysisTypeFromLabel, StudentAttributeFromLabel } from '../types/api';

// UI表示用の型
type AnalysisTypeLabel = '速報版' | '確定版';
type StudentAttributeLabel = '全体' | '学生' | '会員企業' | '招待枠' | '教員' | 'その他/不明';

interface YearComparisonProps {
  currentCourseName: string;
  currentYear: number;       // 年度（例: 2024）
  currentPeriod: string;
  allCourses: CourseItem[];
  analysisType: AnalysisTypeLabel;
  studentAttribute: StudentAttributeLabel;
}

export function YearComparison({ currentCourseName, currentYear, currentPeriod, allCourses, analysisType, studentAttribute }: YearComparisonProps) {
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
      const apiAttribute = StudentAttributeFromLabel[studentAttribute] || 'all';
      const comparisonYearNum = parseAcademicYear(comparisonYear);

      const response = await fetchYearComparison({
        name: currentCourseName,
        current_year: currentYear,
        current_term: currentPeriod,
        compare_year: comparisonYearNum,
        compare_term: comparisonPeriod,
        batch_type: apiAnalysisType,
        student_attribute: apiAttribute,
      });
      setData(response);
    } catch {
      // API接続失敗時はダミーデータで表示
      setData(getDummyYearComparison(studentAttribute, analysisType));
      setError(null);
    } finally {
      setIsLoading(false);
    }
  }, [currentCourseName, currentYear, currentPeriod, comparisonYear, comparisonPeriod, analysisType, studentAttribute]);

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
      <Card className="border border-slate-200 shadow-sm">
        <CardHeader className="border-b border-slate-100 bg-slate-50/50">
          <CardTitle className="flex items-center gap-2 text-slate-800">
            <GitCompareArrows className="h-5 w-5 text-blue-600" />
            年度比較
          </CardTitle>
          <CardDescription>
            同じ講座の異なる年度のデータを比較します
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
          <Card className="border border-slate-200 shadow-sm">
            <CardHeader className="border-b border-slate-100 bg-slate-50/50">
              <CardTitle className="flex items-center gap-2 text-slate-800">
                <Award className="h-5 w-5 text-blue-600" />
                  総合指標の比較
              </CardTitle>
              <CardDescription>主要な指標を年度間で比較</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* 平均NPS */}
                <Card className="bg-slate-50/80 border-slate-200">
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <p className="text-sm text-slate-500 mb-2">平均NPS</p>
                      <p className="text-2xl font-bold tabular-nums text-slate-800 mb-1">{data.current.average_nps.toFixed(1)}</p>
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
                <Card className="bg-slate-50/80 border-slate-200">
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <p className="text-sm text-slate-500 mb-2">総合満足度</p>
                      <p className="text-2xl font-bold tabular-nums text-slate-800 mb-1">{data.current.average_scores.overall_satisfaction.toFixed(2)}</p>
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
                <Card className="bg-slate-50/80 border-slate-200">
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <p className="text-sm text-slate-500 mb-2">講師満足度</p>
                      <p className="text-2xl font-bold tabular-nums text-slate-800 mb-1">{data.current.average_scores.instructor_satisfaction.toFixed(2)}</p>
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
                <Card className="bg-slate-50/80 border-slate-200">
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <p className="text-sm text-slate-500 mb-2">総回答数</p>
                      <p className="text-2xl font-bold tabular-nums text-slate-800 mb-1">{data.current.total_responses}</p>
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

          {/* NPS推移の比較 + カテゴリ別平均スコアの比較 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* NPS推移の比較 */}
            <Card className="border border-slate-200 shadow-sm">
              <CardHeader className="border-b border-slate-100 bg-slate-50/50">
                <CardTitle className="flex items-center gap-2 text-slate-800">
                  <TrendingUp className="h-5 w-5 text-blue-600" />
                  NPS推移の年度比較
                </CardTitle>
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
            <Card className="border border-slate-200 shadow-sm">
              <CardHeader className="border-b border-slate-100 bg-slate-50/50">
                <CardTitle className="flex items-center gap-2 text-slate-800">
                  <BarChart3 className="h-5 w-5 text-blue-600" />
                  カテゴリ別平均スコアの比較
                </CardTitle>
                <CardDescription>各評価項目の年度間比較</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={350}>
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
          </div>
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
