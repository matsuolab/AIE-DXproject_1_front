import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { BarChart3, Calendar, Plus, Trash2, Search, Filter, ChevronDown, ChevronUp } from 'lucide-react';

export interface SessionData {
  sessionNumber: number;
  isSpecialSession: boolean;
  lectureDate: string;
  analysisTypes: Array<'速報版' | '確定版'>;
}

export interface Course {
  id: string;
  name: string;
  year: string;
  period: string;
  responseCount: number;
  sessions?: SessionData[];
}

interface CourseListProps {
  courses: Course[];
  onSelectCourse: (courseId: string) => void;
  onAddData: () => void;
  onDeleteData: () => void;
}

export function CourseList({ courses, onSelectCourse, onAddData, onDeleteData }: CourseListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [yearFilter, setYearFilter] = useState('all');
  const [periodFilter, setPeriodFilter] = useState('all');
  const [isFilterExpanded, setIsFilterExpanded] = useState(false);

  // フィルタリング処理
  const filteredCourses = courses.filter(course => {
    const matchesSearch = course.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesYear = yearFilter === 'all' || course.year === yearFilter;
    const matchesPeriod = periodFilter === 'all' || course.period === periodFilter;
    return matchesSearch && matchesYear && matchesPeriod;
  });

  // ユニークな年度と期間を取得
  const uniqueYears = Array.from(new Set(courses.map(c => c.year)));
  const uniquePeriods = Array.from(new Set(courses.map(c => c.period)));

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl mb-2">講座一覧</h1>
          <Button 
            variant="outline" 
            size="lg"
            onClick={() => setIsFilterExpanded(!isFilterExpanded)}
          >
            <Filter className="h-5 w-5 mr-2" />
            絞り込む
            {isFilterExpanded ? (
              <ChevronUp className="h-5 w-5 ml-2" />
            ) : (
              <ChevronDown className="h-5 w-5 ml-2" />
            )}
          </Button>
        </div>
        <div className="flex gap-3 items-center">
          <Button onClick={onAddData} size="lg">
            <Plus className="h-5 w-5 mr-2" />
            新しいデータを追加
          </Button>
          <Button onClick={onDeleteData} size="icon" variant="outline">
            <Trash2 className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* 絞り込みフィルター */}
      {isFilterExpanded && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>絞り込み検索</CardTitle>
            <CardDescription>講座名、年度、期間で絞り込むことができます</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-sm">講座名で検索</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="講座名を入力..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm">年度</label>
                <Select value={yearFilter} onValueChange={setYearFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="年度を選択" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">すべて</SelectItem>
                    {uniqueYears.map(year => (
                      <SelectItem key={year} value={year}>{year}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm">期間</label>
                <Select value={periodFilter} onValueChange={setPeriodFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="期間を選択" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">すべて</SelectItem>
                    {uniquePeriods.map(period => (
                      <SelectItem key={period} value={period}>{period}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            {(searchQuery || yearFilter !== 'all' || periodFilter !== 'all') && (
              <div className="mt-4 flex items-center justify-between">
                <p className="text-sm text-gray-600">
                  {filteredCourses.length}件の講座が見つかりました
                </p>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => {
                    setSearchQuery('');
                    setYearFilter('all');
                    setPeriodFilter('all');
                  }}
                >
                フィルターをリセット
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* 講座カード一覧 */}
      {filteredCourses.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-gray-500">該当する講座が見つかりませんでした</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCourses.map((course) => (
            <Card key={course.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle>{course.name}</CardTitle>
                <CardDescription>{course.year}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Calendar className="h-4 w-4" />
                    <span>{course.period}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <BarChart3 className="h-4 w-4" />
                    <span>
                      速報版: {course.sessions?.filter(s => s.analysisTypes.includes('速報版')).length || 0}回 /
                      確定版: {course.sessions?.filter(s => s.analysisTypes.includes('確定版')).length || 0}回
                    </span>
                  </div>
                  <Button
                    className="w-full mt-4"
                    onClick={() => onSelectCourse(course.id)}
                  >
                  分析ダッシュボードを見る
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
