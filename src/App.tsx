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
    responseCount: 450,
    sessions: [
      { sessionNumber: 1, isSpecialSession: false, lectureDate: '2024-10-07', analysisTypes: ['速報版', '確定版'] },
      { sessionNumber: 2, isSpecialSession: false, lectureDate: '2024-10-14', analysisTypes: ['速報版', '確定版'] },
      { sessionNumber: 3, isSpecialSession: false, lectureDate: '2024-10-21', analysisTypes: ['速報版'] },
      { sessionNumber: 0, isSpecialSession: true, lectureDate: '2024-10-28', analysisTypes: ['速報版'] },
    ],
  },
  {
    id: '2',
    name: '機械学習基礎',
    year: '2024年度',
    period: '前期（4月-7月）',
    responseCount: 360,
    sessions: [
      { sessionNumber: 1, isSpecialSession: false, lectureDate: '2024-04-08', analysisTypes: ['速報版', '確定版'] },
      { sessionNumber: 2, isSpecialSession: false, lectureDate: '2024-04-15', analysisTypes: ['速報版', '確定版'] },
      { sessionNumber: 3, isSpecialSession: false, lectureDate: '2024-04-22', analysisTypes: ['速報版', '確定版'] },
    ],
  },
  {
    id: '3',
    name: 'データサイエンス入門',
    year: '2024年度',
    period: '後期（9月-12月）',
    responseCount: 300,
    sessions: [
      { sessionNumber: 1, isSpecialSession: false, lectureDate: '2024-09-09', analysisTypes: ['速報版', '確定版'] },
      { sessionNumber: 2, isSpecialSession: false, lectureDate: '2024-09-16', analysisTypes: ['速報版'] },
    ],
  },
  {
    id: '4',
    name: '深層学習応用',
    year: '2023年度',
    period: '後期（9月-12月）',
    responseCount: 420,
    sessions: [
      { sessionNumber: 1, isSpecialSession: false, lectureDate: '2023-09-11', analysisTypes: ['速報版', '確定版'] },
      { sessionNumber: 2, isSpecialSession: false, lectureDate: '2023-09-18', analysisTypes: ['速報版', '確定版'] },
      { sessionNumber: 0, isSpecialSession: true, lectureDate: '2023-09-25', analysisTypes: ['速報版', '確定版'] },
    ],
  },
  {
    id: '5',
    name: '自然言語処理',
    year: '2023年度',
    period: '前期（4月-7月）',
    responseCount: 390,
    sessions: [
      { sessionNumber: 1, isSpecialSession: false, lectureDate: '2023-04-10', analysisTypes: ['速報版', '確定版'] },
      { sessionNumber: 2, isSpecialSession: false, lectureDate: '2023-04-17', analysisTypes: ['速報版', '確定版'] },
    ],
  },
  {
    id: '6',
    name: 'コンピュータビジョン',
    year: '2023年度',
    period: '後期（9月-12月）',
    responseCount: 360,
    sessions: [
      { sessionNumber: 1, isSpecialSession: false, lectureDate: '2023-09-12', analysisTypes: ['速報版', '確定版'] },
      { sessionNumber: 2, isSpecialSession: false, lectureDate: '2023-09-19', analysisTypes: ['速報版'] },
    ],
  },
  // 年度比較用のダミーデータ
  {
    id: '7',
    name: '大規模言語モデル',
    year: '2023年度',
    period: '前期（4月-7月）',
    responseCount: 420,
    sessions: [
      { sessionNumber: 1, isSpecialSession: false, lectureDate: '2023-04-10', analysisTypes: ['速報版', '確定版'] },
      { sessionNumber: 2, isSpecialSession: false, lectureDate: '2023-04-17', analysisTypes: ['速報版', '確定版'] },
    ],
  },
  {
    id: '8',
    name: '大規模言語モデル',
    year: '2022年度',
    period: '前期（4月-7月）',
    responseCount: 390,
    sessions: [
      { sessionNumber: 1, isSpecialSession: false, lectureDate: '2022-04-11', analysisTypes: ['速報版', '確定版'] },
    ],
  },
  {
    id: '9',
    name: '機械学習基礎',
    year: '2023年度',
    period: '前期（4月-7月）',
    responseCount: 340,
    sessions: [
      { sessionNumber: 1, isSpecialSession: false, lectureDate: '2023-04-10', analysisTypes: ['速報版', '確定版'] },
      { sessionNumber: 2, isSpecialSession: false, lectureDate: '2023-04-17', analysisTypes: ['速報版', '確定版'] },
    ],
  },
  {
    id: '10',
    name: '機械学習基礎',
    year: '2022年度',
    period: '前期（4月-7月）',
    responseCount: 315,
    sessions: [
      { sessionNumber: 1, isSpecialSession: false, lectureDate: '2022-04-11', analysisTypes: ['速報版', '確定版'] },
    ],
  },
  {
    id: '11',
    name: 'データサイエンス入門',
    year: '2023年度',
    period: '後期（9月-12月）',
    responseCount: 280,
    sessions: [
      { sessionNumber: 1, isSpecialSession: false, lectureDate: '2023-09-11', analysisTypes: ['速報版', '確定版'] },
    ],
  },
  {
    id: '12',
    name: 'データサイエンス入門',
    year: '2022年度',
    period: '後期（9月-12月）',
    responseCount: 265,
    sessions: [
      { sessionNumber: 1, isSpecialSession: false, lectureDate: '2022-09-12', analysisTypes: ['速報版', '確定版'] },
    ],
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
