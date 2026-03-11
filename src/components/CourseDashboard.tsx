import { useState } from 'react';
import { OverallTrends } from './OverallTrends';
import { SessionAnalysis } from './SessionAnalysis';
import { YearComparison } from './YearComparison';
import { formatAcademicYear } from '../lib/course-utils';
import type { CourseItem, SessionSummary } from '../types/api';
import { Card } from './ui/card';
import { BarChart3, CheckCircle2, Users, TrendingUp, LayoutList, GitCompareArrows, CalendarDays } from 'lucide-react';

interface CourseDashboardProps {
  courseName: string;
  courseYear: number;        // 年度（例: 2024）
  coursePeriod: string;      // 期間（例: "10月～12月"）
  courseSessions: SessionSummary[];  // 講義回サマリー
  allCourses: CourseItem[];
}

// UI表示用の分析タイプ（日本語）
export type AnalysisTypeLabel = '速報版' | '確定版';
export type StudentAttributeLabel = '全体' | '学生' | '会員企業' | '招待枠' | '教員' | 'その他/不明';

export function CourseDashboard({ courseName, courseYear, coursePeriod, courseSessions, allCourses }: CourseDashboardProps) {
  const [analysisType, setAnalysisType] = useState<AnalysisTypeLabel>('確定版');
  const [studentAttribute, setStudentAttribute] = useState<StudentAttributeLabel>('全体');
  const [activeTab, setActiveTab] = useState<'overall' | 'session' | 'comparison'>('overall');

  // 表示用の年度文字列
  const courseYearDisplay = formatAcademicYear(courseYear);

  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl">
      {/* ヘッダー部分 */}
      <div className="mb-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">{courseName}</h1>
            <div className="mt-2 flex items-center gap-2 text-slate-500">
              <CalendarDays className="h-4 w-4" />
              <span className="text-sm">{courseYearDisplay} {coursePeriod}</span>
            </div>
          </div>

          {/* データバージョン選択 */}
          <div className="flex flex-col items-end gap-1.5">
            <span className="text-xs text-slate-400">
              {analysisType === '速報版' ? '講義翌日のデータを表示中' : 'アンケート締切後の確定データを表示中'}
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setAnalysisType('速報版')}
                style={analysisType === '速報版' ? { backgroundColor: '#2563eb', color: '#ffffff' } : undefined}
                className={`inline-flex items-center gap-1.5 rounded-lg border-0 outline-none px-4 py-2 text-sm font-semibold cursor-pointer transition-all duration-200 ${
                  analysisType === '速報版'
                    ? 'shadow-md'
                    : 'bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-700'
                }`}
              >
                <BarChart3 className="h-3.5 w-3.5" />
                速報版
              </button>
              <button
                type="button"
                onClick={() => setAnalysisType('確定版')}
                style={analysisType === '確定版' ? { backgroundColor: '#059669', color: '#ffffff' } : undefined}
                className={`inline-flex items-center gap-1.5 rounded-lg border-0 outline-none px-4 py-2 text-sm font-semibold cursor-pointer transition-all duration-200 ${
                  analysisType === '確定版'
                    ? 'shadow-md'
                    : 'bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-700'
                }`}
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                確定版
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 受講生の属性選択 */}
      <Card className="mb-6 border border-slate-200 bg-white shadow-sm">
        <div className="p-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-100">
                <Users className="h-4.5 w-4.5 text-violet-600" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-slate-800">受講生の属性</h2>
                <p className="text-xs text-slate-500">
                  分析対象の受講生属性を選択
                </p>
              </div>
            </div>
            <div className="inline-flex flex-row flex-nowrap gap-1.5">
              {(['全体', '学生', '会員企業', '招待枠', '教員', 'その他/不明'] as StudentAttributeLabel[]).map((attr) => (
                <button
                  key={attr}
                  type="button"
                  onClick={() => setStudentAttribute(attr)}
                  style={studentAttribute === attr ? { backgroundColor: '#7c3aed', color: '#ffffff' } : undefined}
                  className={`rounded-lg border-0 outline-none px-3 py-1.5 text-sm font-medium cursor-pointer transition-all duration-200 ${
                    studentAttribute === attr
                      ? 'shadow-sm'
                      : 'bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-700'
                  }`}
                >
                  {attr}
                </button>
              ))}
            </div>
          </div>
        </div>
      </Card>

      {/* メインタブナビゲーション */}
      <div className="w-full">
        <div className="grid w-full max-w-2xl grid-cols-3 gap-1.5 rounded-xl bg-slate-100 p-1.5">
          {([
            { key: 'overall', label: '全体傾向', icon: <TrendingUp className="h-4 w-4" /> },
            { key: 'session', label: '講義回別分析', icon: <LayoutList className="h-4 w-4" /> },
            { key: 'comparison', label: '年度比較', icon: <GitCompareArrows className="h-4 w-4" /> },
          ] as const).map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              style={activeTab === tab.key ? { backgroundColor: '#1e40af', color: '#ffffff' } : undefined}
              className={`inline-flex items-center justify-center gap-1.5 rounded-lg border-0 outline-none px-3 py-2 text-sm font-medium cursor-pointer transition-all duration-200 ${
                activeTab === tab.key
                  ? 'shadow-sm'
                  : 'text-slate-500 hover:bg-slate-200 hover:text-slate-700'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'overall' && (
          <div className="mt-6">
            <OverallTrends
              courseName={courseName}
              courseYear={courseYear}
              coursePeriod={coursePeriod}
              analysisType={analysisType}
              studentAttribute={studentAttribute}
            />
          </div>
        )}

        {activeTab === 'session' && (
          <div className="mt-6">
            <SessionAnalysis
              courseSessions={courseSessions}
              analysisType={analysisType}
              studentAttribute={studentAttribute}
            />
          </div>
        )}

        {activeTab === 'comparison' && (
          <div className="mt-6">
            <YearComparison
              currentCourseName={courseName}
              currentYear={courseYear}
              currentPeriod={coursePeriod}
              allCourses={allCourses}
              analysisType={analysisType}
            />
          </div>
        )}
      </div>
    </div>
  );
}
