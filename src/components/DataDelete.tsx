import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from './ui/alert-dialog';
import { Trash2, AlertTriangle, BarChart3, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import type { Course } from './CourseList';

interface DataDeleteProps {
  courses: Course[];
  onComplete: () => void;
  onDelete: (courseId: string) => void;
}

export function DataDelete({ courses, onComplete, onDelete }: DataDeleteProps) {
  const [selectedCourseName, setSelectedCourseName] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState('');
  const [selectedSession, setSelectedSession] = useState('');
  const [selectedLectureDate, setSelectedLectureDate] = useState('');
  const [selectedAnalysisType, setSelectedAnalysisType] = useState('');
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  // ユニークな値を取得
  const uniqueCourseNames = Array.from(new Set(courses.map(c => c.name)));
  const filteredYears = selectedCourseName 
    ? Array.from(new Set(courses.filter(c => c.name === selectedCourseName).map(c => c.year)))
    : [];
  const filteredPeriods = selectedCourseName && selectedYear
    ? Array.from(new Set(courses.filter(c => c.name === selectedCourseName && c.year === selectedYear).map(c => c.period)))
    : [];

  const selectedCourse = courses.find(
    c => c.name === selectedCourseName && c.year === selectedYear && c.period === selectedPeriod
  );

  // 講義回のリストを生成（通常回と特別回の両方を含む）
  const sessionOptions = useMemo(() => {
    if (!selectedCourse?.sessions) return [];
    const options: { value: string; label: string; isSpecial: boolean }[] = [];

    // 通常回を追加
    const normalSessions = selectedCourse.sessions
      .filter(s => !s.isSpecialSession)
      .map(s => s.sessionNumber)
      .filter((v, i, a) => a.indexOf(v) === i)
      .sort((a, b) => a - b);
    normalSessions.forEach(n => {
      options.push({ value: `normal-${n}`, label: `第${n}回`, isSpecial: false });
    });

    // 特別回を追加
    const hasSpecialSession = selectedCourse.sessions.some(s => s.isSpecialSession);
    if (hasSpecialSession) {
      options.push({ value: 'special', label: '特別回', isSpecial: true });
    }

    return options;
  }, [selectedCourse]);

  // 選択された講義回が特別回かどうか
  const isSpecialSession = selectedSession === 'special';

  // 選択された講義回に対応する講義日リストを取得
  const availableLectureDates = useMemo(() => {
    if (!selectedCourse?.sessions || !selectedSession) return [];

    if (isSpecialSession) {
      // 特別回の場合
      return selectedCourse.sessions
        .filter(s => s.isSpecialSession)
        .map(s => s.lectureDate);
    } else {
      // 通常回の場合
      const sessionNum = parseInt(selectedSession.replace('normal-', ''));
      return selectedCourse.sessions
        .filter(s => !s.isSpecialSession && s.sessionNumber === sessionNum)
        .map(s => s.lectureDate);
    }
  }, [selectedCourse, selectedSession, isSpecialSession]);

  // 選択された講義日に対応する分析タイプリストを取得
  const availableAnalysisTypes = useMemo(() => {
    if (!selectedCourse?.sessions || !selectedLectureDate || !selectedSession) return [];

    const sessionNum = isSpecialSession ? 0 : parseInt(selectedSession.replace('normal-', ''));
    const session = selectedCourse.sessions.find(s =>
      s.lectureDate === selectedLectureDate &&
      s.isSpecialSession === isSpecialSession &&
      (isSpecialSession || s.sessionNumber === sessionNum)
    );

    return session?.analysisTypes || [];
  }, [selectedCourse, selectedLectureDate, isSpecialSession, selectedSession]);

  // 選択された講義回の表示ラベルを取得
  const selectedSessionLabel = useMemo(() => {
    const option = sessionOptions.find(o => o.value === selectedSession);
    return option?.label || '';
  }, [sessionOptions, selectedSession]);

  const handleDeleteClick = () => {
    if (!selectedCourseName || !selectedYear || !selectedPeriod || !selectedSession || !selectedLectureDate || !selectedAnalysisType) {
      toast.error('削除するデータをすべて選択してください');
      return;
    }
    setShowConfirmDialog(true);
  };

  const handleConfirmDelete = () => {
    if (selectedCourse) {
      onDelete(selectedCourse.id);
      toast.success('データを削除しました', {
        description: `「${selectedCourse.name}」${selectedSessionLabel} ${selectedLectureDate} ${selectedAnalysisType}のデータを削除しました。`,
      });
    }
    setShowConfirmDialog(false);
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl mb-2">データ削除</h1>
        <p className="text-gray-600">削除したい講座を選択してください</p>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>削除する講座の選択</CardTitle>
            <CardDescription>
              削除したい講座を選択してください。削除されたデータは復元できません。
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm">講座名を選択 *</label>
              <Select value={selectedCourseName} onValueChange={(value) => {
                setSelectedCourseName(value);
                setSelectedYear('');
                setSelectedPeriod('');
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="講座名を選択してください" />
                </SelectTrigger>
                <SelectContent>
                  {uniqueCourseNames.map((name) => (
                    <SelectItem key={name} value={name}>
                      {name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm">年度を選択 *</label>
              <Select value={selectedYear} onValueChange={(value) => {
                setSelectedYear(value);
                setSelectedPeriod('');
              }} disabled={!selectedCourseName}>
                <SelectTrigger>
                  <SelectValue placeholder="年度を選択してください" />
                </SelectTrigger>
                <SelectContent>
                  {filteredYears.map((year) => (
                    <SelectItem key={year} value={year}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm">期間を選択 *</label>
              <Select value={selectedPeriod} onValueChange={(value) => {
                setSelectedPeriod(value);
                setSelectedSession('');
                setSelectedLectureDate('');
                setSelectedAnalysisType('');
              }} disabled={!selectedYear}>
                <SelectTrigger>
                  <SelectValue placeholder="期間を選択してください" />
                </SelectTrigger>
                <SelectContent>
                  {filteredPeriods.map((period) => (
                    <SelectItem key={period} value={period}>
                      {period}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 講義回を選択 */}
            <div className="space-y-2">
              <Label>講義回を選択 *</Label>
              <Select value={selectedSession} onValueChange={(value) => {
                setSelectedSession(value);
                setSelectedLectureDate('');
                setSelectedAnalysisType('');
              }} disabled={!selectedPeriod || sessionOptions.length === 0}>
                <SelectTrigger>
                  <SelectValue placeholder="講義回を選択してください" />
                </SelectTrigger>
                <SelectContent>
                  {sessionOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 講義日を選択 */}
            <div className="space-y-2">
              <Label>講義日を選択 *</Label>
              <Select
                value={selectedLectureDate}
                onValueChange={(value) => {
                  setSelectedLectureDate(value);
                  setSelectedAnalysisType('');
                }}
                disabled={availableLectureDates.length === 0}
              >
                <SelectTrigger>
                  <SelectValue placeholder="講義日を選択してください" />
                </SelectTrigger>
                <SelectContent>
                  {availableLectureDates.map((date) => (
                    <SelectItem key={date} value={date}>
                      {date}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {availableLectureDates.length === 0 && selectedSession && (
                <p className="text-sm text-amber-600">
                  該当する講義日のデータがありません
                </p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm">分析タイプを選択 *</label>
              <Select value={selectedAnalysisType} onValueChange={setSelectedAnalysisType} disabled={!selectedLectureDate || availableAnalysisTypes.length === 0}>
                <SelectTrigger>
                  <SelectValue placeholder="分析タイプを選択してください" />
                </SelectTrigger>
                <SelectContent>
                  {availableAnalysisTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedCourse && selectedSession && selectedLectureDate && selectedAnalysisType && (
              <Card className="bg-gray-50 border-gray-200">
                <CardContent className="pt-6">
                  <h3 className="mb-4">選択中のデータ情報</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">講座名</span>
                      <span className="font-medium">{selectedCourse.name}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Calendar className="h-4 w-4" />
                        <span>年度・期間</span>
                      </div>
                      <span className="font-medium">{selectedCourse.year} {selectedCourse.period}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <BarChart3 className="h-4 w-4" />
                        <span>講義回</span>
                      </div>
                      <span className="font-medium">{selectedSessionLabel}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Calendar className="h-4 w-4" />
                        <span>講義日</span>
                      </div>
                      <span className="font-medium">{selectedLectureDate}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">分析タイプ</span>
                      <span className="font-medium">{selectedAnalysisType}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>警告</AlertTitle>
              <AlertDescription>
                この操作は取り消せません。選択された講義回の分析データが完全に削除されます。
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3">
          <Button
            variant="outline"
            onClick={onComplete}
          >
            キャンセル
          </Button>
          <Button
            variant="destructive"
            onClick={handleDeleteClick}
            disabled={!selectedCourseName || !selectedYear || !selectedPeriod || !selectedSession || !selectedLectureDate || !selectedAnalysisType}
            size="icon"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* 確認ダイアログ */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>本当に削除しますか？</AlertDialogTitle>
            <AlertDialogDescription>
              「{selectedCourse?.name}」{selectedSessionLabel} {selectedLectureDate} {selectedAnalysisType}のデータを削除します。
              この操作は取り消すことができません。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>キャンセル</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              削除する
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
