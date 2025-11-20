import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { OverallTrends } from './OverallTrends';
import { SessionAnalysis } from './SessionAnalysis';
import { YearComparison } from './YearComparison';
import type { Course } from './CourseList';
import { Card } from './ui/card';

interface CourseDashboardProps {
  courseId: string;
  courseName: string;
  courseYear: string;
  coursePeriod: string;
  allCourses: Course[];
}

export type AnalysisType = '速報版' | '確定版';
export type StudentAttribute = '全体' | '学生' | '会員企業' | '招待枠' | '不明';

export function CourseDashboard({ courseName, courseYear, coursePeriod, allCourses }: CourseDashboardProps) {
  const [analysisType, setAnalysisType] = useState<AnalysisType>('確定版');
  const [studentAttribute, setStudentAttribute] = useState<StudentAttribute>('全体');

  return (
    <div className="container mx-auto px-4 py-8">
      {/* ヘッダー部分 - タイトルとデータバージョン選択 */}
      <div className="mb-6 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl mb-2">{courseName}</h1>
          <p className="text-gray-600">{courseYear} {coursePeriod}</p>
        </div>
        
        {/* データバージョン選択 - 右上に配置 */}
        <div className="flex flex-col items-end gap-1">
          <span className="text-xs text-gray-500">
            {analysisType === '速報版' ? '講義翌日のデータを表示中' : 'アンケート締切後の確定データを表示中'}
          </span>
          <Tabs value={analysisType} onValueChange={(value) => setAnalysisType(value as AnalysisType)}>
            <TabsList className="grid w-[220px] grid-cols-2">
              <TabsTrigger 
                value="速報版"
                className="data-[state=active]:bg-blue-500 data-[state=active]:text-white"
              >
                📊 速報版
              </TabsTrigger>
              <TabsTrigger 
                value="確定版"
                className="data-[state=active]:bg-green-600 data-[state=active]:text-white data-[state=active]:shadow-md"
              >
                ✅ 確定版
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* 受講生の属性選択 */}
      <Card className="mb-6 border-2 border-purple-200 bg-purple-50">
        <div className="p-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h2 className="mb-1">受講生の属性</h2>
              <p className="text-sm text-gray-600">
                👥 分析対象の受講生属性を選択
              </p>
            </div>
            <Tabs value={studentAttribute} onValueChange={(value) => setStudentAttribute(value as StudentAttribute)}>
              <TabsList className="grid w-[500px] grid-cols-5">
                <TabsTrigger value="全体">全体</TabsTrigger>
                <TabsTrigger value="学生">学生</TabsTrigger>
                <TabsTrigger value="会員企業">会員企業</TabsTrigger>
                <TabsTrigger value="招待枠">招待枠</TabsTrigger>
                <TabsTrigger value="不明">不明</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>
      </Card>

      <Tabs defaultValue="overall" className="w-full">
        <TabsList className="grid w-full max-w-2xl grid-cols-3">
          <TabsTrigger value="overall">全体傾向</TabsTrigger>
          <TabsTrigger value="session">講義回別分析</TabsTrigger>
          <TabsTrigger value="comparison">年度比較</TabsTrigger>
        </TabsList>

        <TabsContent value="overall" className="mt-6">
          <OverallTrends courseName={courseName} analysisType={analysisType} studentAttribute={studentAttribute} />
        </TabsContent>

        <TabsContent value="session" className="mt-6">
          <SessionAnalysis analysisType={analysisType} studentAttribute={studentAttribute} />
        </TabsContent>

        <TabsContent value="comparison" className="mt-6">
          <YearComparison 
            currentCourseName={courseName}
            currentYear={courseYear}
            currentPeriod={coursePeriod}
            allCourses={allCourses}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
