import { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { CourseList } from './components/CourseList';
import { getCourseKey } from './lib/course-utils';
import { CourseDashboard } from './components/CourseDashboard';
import { DataUpload } from './components/DataUpload';
import { DataDelete } from './components/DataDelete';
import { Toaster } from './components/ui/sonner';
import { fetchCourses, ApiError, logout } from './api/client';
import type { CourseItem } from './types/api';
import { dummyCourses } from './data/dummy';
import { Loader2, RefreshCw, WifiOff } from 'lucide-react';
import { Button } from './components/ui/button';
import { Alert, AlertDescription } from './components/ui/alert';

type ViewMode = 'list' | 'dashboard' | 'upload' | 'delete';

export default function App() {
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedCourse, setSelectedCourse] = useState<CourseItem | null>(null);
  const [courses, setCourses] = useState<CourseItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // コース一覧を取得
  const loadCourses = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetchCourses();
      setCourses(response.courses);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('講座一覧の取得に失敗しました。バックエンドAPIが起動しているかご確認ください。現在はダミーデータを表示しています。');
      }
      // API接続エラー時はダミー講座で画面を表示する
      setCourses(dummyCourses);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCourses();
  }, []);

  const handleSelectCourse = (course: CourseItem) => {
    setSelectedCourse(course);
    setViewMode('dashboard');
  };

  const handleBackToList = () => {
    setSelectedCourse(null);
    setViewMode('list');
  };

  const handleAddData = () => {
    setViewMode('upload');
  };

  const handleDeleteData = () => {
    setViewMode('delete');
  };

  const handleUploadComplete = () => {
    // アップロード完了後、講座一覧を再取得
    loadCourses();
    setViewMode('list');
  };

  const handleDeleteComplete = (courseKey: string) => {
    // 削除完了後、講座一覧を再取得
    loadCourses();
    // 削除された講座が選択中だった場合はクリア
    if (selectedCourse && getCourseKey(selectedCourse) === courseKey) {
      setSelectedCourse(null);
    }
    setViewMode('list');
  };

  const handleLogout = () => {
    logout();
  };

  const showBackButton = viewMode === 'dashboard' || viewMode === 'upload' || viewMode === 'delete';

  // ローディング表示
  if (isLoading && viewMode === 'list') {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header
          showBackButton={false}
          onBackClick={handleBackToList}
          onLogout={handleLogout}
        />
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="h-12 w-12 animate-spin text-blue-600 mb-4" />
            <p className="text-gray-600">講座データを読み込み中...</p>
          </div>
        </div>
        <Toaster />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header
        showBackButton={showBackButton}
        onBackClick={handleBackToList}
        onLogout={handleLogout}
      />

      {/* API接続エラー時の警告バナー */}
      {error && (
        <div className="container mx-auto px-4 pt-4 max-w-7xl">
          <Alert className="border-amber-300 bg-amber-50">
            <WifiOff className="h-4 w-4 text-amber-600" />
            <AlertDescription className="flex items-center justify-between gap-4 flex-wrap">
              <span className="text-amber-800 text-sm">{error}</span>
              <Button onClick={loadCourses} variant="outline" size="sm" className="shrink-0">
                <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
                再接続
              </Button>
            </AlertDescription>
          </Alert>
        </div>
      )}

      {viewMode === 'dashboard' && selectedCourse ? (
        <CourseDashboard
          courseName={selectedCourse.name}
          courseYear={selectedCourse.academic_year}
          coursePeriod={selectedCourse.term}
          courseSessions={selectedCourse.sessions}
          allCourses={courses}
        />
      ) : viewMode === 'upload' ? (
        <DataUpload
          onComplete={handleUploadComplete}
          existingCourses={courses}
        />
      ) : viewMode === 'delete' ? (
        <DataDelete
          courses={courses}
          onComplete={handleBackToList}
          onDelete={handleDeleteComplete}
        />
      ) : (
        <CourseList
          courses={courses}
          onSelectCourse={handleSelectCourse}
          onAddData={handleAddData}
          onDeleteData={handleDeleteData}
        />
      )}

      <Toaster />
    </div>
  );
}
