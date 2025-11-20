import { useState } from 'react';
import { Header } from './components/Header';
import { CourseList, type Course } from './components/CourseList';
import { CourseDashboard } from './components/CourseDashboard';
import { DataUpload } from './components/DataUpload';
import { DataDelete } from './components/DataDelete';
import { Toaster } from './components/ui/sonner';

// モックデータ
const mockCourses: Course[] = [
  {
    id: '1',
    name: '大規模言語モデル',
    year: '2024年度',
    period: '10月～12月',
    sessionCount: 15,
    responseCount: 450,
  },
  {
    id: '2',
    name: '機械学習基礎',
    year: '2024年度',
    period: '前期（4月-7月）',
    sessionCount: 12,
    responseCount: 360,
  },
  {
    id: '3',
    name: 'データサイエンス入門',
    year: '2024年度',
    period: '後期（9月-12月）',
    sessionCount: 10,
    responseCount: 300,
  },
  {
    id: '4',
    name: '深層学習応用',
    year: '2023年度',
    period: '後期（9月-12月）',
    sessionCount: 14,
    responseCount: 420,
  },
  {
    id: '5',
    name: '自然言語処理',
    year: '2023年度',
    period: '前期（4月-7月）',
    sessionCount: 13,
    responseCount: 390,
  },
  {
    id: '6',
    name: 'コンピュータビジョン',
    year: '2023年度',
    period: '後期（9月-12月）',
    sessionCount: 12,
    responseCount: 360,
  },
  // 年度比較用のダミーデータ
  {
    id: '7',
    name: '大規模言語モデル',
    year: '2023年度',
    period: '前期（4月-7月）',
    sessionCount: 15,
    responseCount: 420,
  },
  {
    id: '8',
    name: '大規模言語モデル',
    year: '2022年度',
    period: '前期（4月-7月）',
    sessionCount: 15,
    responseCount: 390,
  },
  {
    id: '9',
    name: '機械学習基礎',
    year: '2023年度',
    period: '前期（4月-7月）',
    sessionCount: 12,
    responseCount: 340,
  },
  {
    id: '10',
    name: '機械学習基礎',
    year: '2022年度',
    period: '前期（4月-7月）',
    sessionCount: 12,
    responseCount: 315,
  },
  {
    id: '11',
    name: 'データサイエンス入門',
    year: '2023年度',
    period: '後期（9月-12月）',
    sessionCount: 10,
    responseCount: 280,
  },
  {
    id: '12',
    name: 'データサイエンス入門',
    year: '2022年度',
    period: '後期（9月-12月）',
    sessionCount: 10,
    responseCount: 265,
  },
];

type ViewMode = 'list' | 'dashboard' | 'upload' | 'delete';

export default function App() {
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [courses, setCourses] = useState<Course[]>(mockCourses);
  
  const selectedCourse = courses.find(c => c.id === selectedCourseId);

  const handleSelectCourse = (courseId: string) => {
    setSelectedCourseId(courseId);
    setViewMode('dashboard');
  };

  const handleBackToList = () => {
    setSelectedCourseId(null);
    setViewMode('list');
  };

  const handleAddData = () => {
    setViewMode('upload');
  };

  const handleDeleteData = () => {
    setViewMode('delete');
  };

  const handleUploadComplete = () => {
    setViewMode('list');
  };

  const handleDeleteComplete = (courseId: string) => {
    setCourses(courses.filter(c => c.id !== courseId));
    setViewMode('list');
  };

  const showBackButton = viewMode === 'dashboard' || viewMode === 'upload' || viewMode === 'delete';

  return (
    <div className="min-h-screen bg-gray-50">
      <Header 
        showBackButton={showBackButton} 
        onBackClick={handleBackToList}
      />
      
      {viewMode === 'dashboard' && selectedCourse ? (
        <CourseDashboard 
          courseId={selectedCourse.id}
          courseName={selectedCourse.name}
          courseYear={selectedCourse.year}
          coursePeriod={selectedCourse.period}
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
