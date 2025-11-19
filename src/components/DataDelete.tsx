import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from './ui/alert-dialog';
import { Trash2, AlertTriangle, BarChart3, Calendar } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
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

  // 講義回数のリストを生成
  const sessionNumbers = selectedCourse 
    ? Array.from({ length: selectedCourse.sessionCount }, (_, i) => `第${i + 1}回`)
    : [];

  // 分析タイプ
  const analysisTypes = ['速報版', '確定版'];

  const handleDeleteClick = () => {
    if (!selectedCourseName || !selectedYear || !selectedPeriod || !selectedSession || !selectedAnalysisType) {
      toast.error('削除するデータをすべて選択してください');
      return;
    }
    setShowConfirmDialog(true);
  };

  const handleConfirmDelete = () => {
    if (selectedCourse) {
      onDelete(selectedCourse.id);
      toast.success('データを削除しました', {
        description: `「${selectedCourse.name}」${selectedSession} ${selectedAnalysisType}のデータを削除しました。`,
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

            <div className="space-y-2">
              <label className="text-sm">講義回数を選択 *</label>
              <Select value={selectedSession} onValueChange={(value) => {
                setSelectedSession(value);
                setSelectedAnalysisType('');
              }} disabled={!selectedPeriod}>
                <SelectTrigger>
                  <SelectValue placeholder="講義回数を選択してください" />
                </SelectTrigger>
                <SelectContent>
                  {sessionNumbers.map((session) => (
                    <SelectItem key={session} value={session}>
                      {session}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm">分析タイプを選択 *</label>
              <Select value={selectedAnalysisType} onValueChange={setSelectedAnalysisType} disabled={!selectedSession}>
                <SelectTrigger>
                  <SelectValue placeholder="分析タイプを選択してください" />
                </SelectTrigger>
                <SelectContent>
                  {analysisTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedCourse && selectedSession && selectedAnalysisType && (
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
                        <span>講義回数</span>
                      </div>
                      <span className="font-medium">{selectedSession}</span>
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
            disabled={!selectedCourseName || !selectedYear || !selectedPeriod || !selectedSession || !selectedAnalysisType}
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
              「{selectedCourse?.name}」{selectedSession} {selectedAnalysisType}のデータを削除します。
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
