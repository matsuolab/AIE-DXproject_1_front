import { useState, useRef, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { Tabs, TabsList, TabsTrigger } from './ui/tabs';
import { Textarea } from './ui/textarea';
import { Upload, FileSpreadsheet, X, Loader2, CheckCircle, AlertCircle, AlertTriangle, ShieldAlert } from 'lucide-react';
import { toast } from 'sonner';
import { detectPrivacyColumns, type PrivacyColumnDetectionResult } from '../lib/pii-detector';

interface DataUploadProps {
  onComplete: () => void;
  existingCourses: Array<{
    id: string;
    name: string;
    year: string;
    period: string;
    responseCount: number;
    sessions?: Array<{
      sessionNumber: number;
      isSpecialSession: boolean;
      lectureDate: string;
      analysisTypes: Array<'速報版' | '確定版'>;
    }>;
  }>;
}

export type AnalysisType = '速報版' | '確定版';

export function DataUpload({ onComplete, existingCourses }: DataUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isNewCourse, setIsNewCourse] = useState(false);
  const [selectedCourseName, setSelectedCourseName] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState('');
  const [courseName, setCourseName] = useState('');
  const [year, setYear] = useState('');
  const [period, setPeriod] = useState('');
  const [sessionNumber, setSessionNumber] = useState('');
  const [analysisType, setAnalysisType] = useState<AnalysisType>('速報版');
  const [zoomParticipants, setZoomParticipants] = useState('');
  const [recordingViews, setRecordingViews] = useState('');
  const [instructorName, setInstructorName] = useState('');
  const [lectureContent, setLectureContent] = useState('');
  const [isSpecialSession, setIsSpecialSession] = useState(false);
  const [lectureDate, setLectureDate] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'analyzing' | 'complete'>('idle');
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [privacyDetectionResult, setPrivacyDetectionResult] = useState<PrivacyColumnDetectionResult | null>(null);
  const [isCheckingPrivacy, setIsCheckingPrivacy] = useState(false);
  // 重複検出は派生状態なので useMemo で算出し、不要な再レンダーを防ぐ
  // 既存講座選択時に派生させる講座情報（stateに二重保持しない）
  const selectedCourse = useMemo(() => {
    if (!isNewCourse && selectedCourseName && selectedYear && selectedPeriod) {
      return existingCourses.find(
        c => c.name === selectedCourseName && c.year === selectedYear && c.period === selectedPeriod
      );
    }
    return undefined;
  }, [isNewCourse, selectedCourseName, selectedYear, selectedPeriod, existingCourses]);

  const effectiveCourseName = isNewCourse ? courseName : (selectedCourse?.name || '');
  const effectiveYear = isNewCourse ? year : (selectedCourse?.year || '');
  const effectivePeriod = isNewCourse ? period : (selectedCourse?.period || '');

  const duplicateDetected = useMemo(() => {
    if (!effectiveCourseName || !effectiveYear || !effectivePeriod || !analysisType || !lectureDate) return false;
    // 特別回でない場合は講義回も必要
    if (!isSpecialSession && !sessionNumber) return false;

    const course = existingCourses.find(
      c => c.name === effectiveCourseName && c.year === effectiveYear && c.period === effectivePeriod
    );
    if (course && course.sessions) {
      const sessionNum = isSpecialSession ? 0 : parseInt(sessionNumber);
      const session = course.sessions.find(s =>
        s.sessionNumber === sessionNum &&
        s.lectureDate === lectureDate &&
        s.isSpecialSession === isSpecialSession
      );
      return !!(session && session.analysisTypes.includes(analysisType));
    }
    return false;
  }, [effectiveCourseName, effectiveYear, effectivePeriod, sessionNumber, analysisType, existingCourses, lectureDate, isSpecialSession]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const years = ['2025年度', '2024年度', '2023年度', '2022年度', '2021年度'];

  // 重複チェックは useMemo で算出し、副作用での setState を避ける

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      validateAndSetFile(droppedFile);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      validateAndSetFile(selectedFile);
    }
  };

  const validateAndSetFile = async (selectedFile: File) => {
    const validExtensions = ['.xlsx', '.xls', '.csv'];
    const fileExtension = selectedFile.name.substring(selectedFile.name.lastIndexOf('.')).toLowerCase();

    if (!validExtensions.includes(fileExtension)) {
      toast.error('ファイル形式エラー', {
        description: 'Excel形式（.xlsx, .xls）またはCSV形式のファイルを選択してください。',
      });
      return;
    }

    setFile(selectedFile);
    setPrivacyDetectionResult(null);

    // 個人情報列の検出を実行
    setIsCheckingPrivacy(true);
    try {
      const result = await detectPrivacyColumns(selectedFile);
      setPrivacyDetectionResult(result);

      if (result.hasPrivacyColumns) {
        toast.warning('個人情報の可能性がある列を検出しました', {
          description: '詳細を確認してください。',
          duration: 5000,
        });
      } else {
        toast.success('ファイルを選択しました', {
          description: selectedFile.name,
        });
      }
    } catch (error) {
      toast.error('ファイルの解析に失敗しました', {
        description: error instanceof Error ? error.message : '不明なエラー',
      });
    } finally {
      setIsCheckingPrivacy(false);
    }
  };

  const handleRemoveFile = () => {
    setFile(null);
    setPrivacyDetectionResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClickUploadArea = () => {
    fileInputRef.current?.click();
  };

  // 既存講座選択用のユニークな値を取得
  const uniqueCourseNames = Array.from(new Set(existingCourses.map(c => c.name)));
  const filteredYears = selectedCourseName 
    ? Array.from(new Set(existingCourses.filter(c => c.name === selectedCourseName).map(c => c.year)))
    : [];
  const filteredPeriods = selectedCourseName && selectedYear
    ? Array.from(new Set(existingCourses.filter(c => c.name === selectedCourseName && c.year === selectedYear).map(c => c.period)))
    : [];

  // 既存講座選択時は派生値を使用するため effect での setState は不要

  const handleStartAnalysis = async () => {
    // 個人情報列が検出されている場合はアップロードをブロック
    if (privacyDetectionResult?.hasPrivacyColumns) {
      toast.error('個人情報列を含むファイルはアップロードできません', {
        description: '該当列を削除してから再度お試しください。',
        duration: 5000,
      });
      return;
    }

    // バリデーション - 未入力項目を収集
    const errors: Record<string, string> = {};

    if (!file) {
      errors.file = 'Excelファイルを選択してください';
    }
    if (!isNewCourse && !selectedCourseName) {
      errors.existingCourseName = '講座名を選択してください';
    }
    if (!isNewCourse && selectedCourseName && !selectedYear) {
      errors.existingYear = '年度を選択してください';
    }
    if (!isNewCourse && selectedCourseName && selectedYear && !selectedPeriod) {
      errors.existingPeriod = '期間を選択してください';
    }
    if (isNewCourse && !effectiveCourseName.trim()) {
      errors.courseName = '講座名を入力してください';
    }
    if (isNewCourse && !effectiveYear) {
      errors.year = '年度を選択してください';
    }
    if (isNewCourse && !period.trim()) {
      errors.period = '期間を入力してください';
    }
    if (!isSpecialSession && (!sessionNumber || parseInt(sessionNumber) <= 0)) {
      errors.sessionNumber = '講義回を入力してください';
    }
    if (!lectureDate) {
      errors.lectureDate = '講義日を選択してください';
    }
    if (!instructorName.trim()) {
      errors.instructorName = '講師名を入力してください';
    }
    if (analysisType === '速報版' && (!zoomParticipants || parseInt(zoomParticipants) <= 0)) {
      errors.zoomParticipants = 'Zoom参加者数を入力してください';
    }
    if (analysisType === '確定版' && (!recordingViews || parseInt(recordingViews) <= 0)) {
      errors.recordingViews = '録画の視聴回数を入力してください';
    }

    setValidationErrors(errors);

    if (Object.keys(errors).length > 0) {
      toast('入力されていない項目があります', {
        duration: 5000,
        style: {
          background: '#ffffff',
          border: '1px solid #ef4444',
          color: '#000000',
        },
      });
      return;
    }

    setIsUploading(true);
    setUploadStatus('uploading');

    try {
      // ファイルアップロード処理のシミュレーション
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setUploadStatus('analyzing');
      toast.info('データ分析を開始しました', {
        description: 'バックエンドで分析処理を実行しています...',
      });

      // 分析処理のシミュレーション
      await new Promise(resolve => setTimeout(resolve, 2500));

      setUploadStatus('complete');
      toast.success('分析が完了しました！', {
        description: `講座「${effectiveCourseName}」の${analysisType}データが登録されました。`,
      });

      // 完了後、少し待ってから講座一覧に戻る
      setTimeout(() => {
        onComplete();
      }, 1500);

    } catch {
      toast.error('エラーが発生しました', {
        description: 'データのアップロードに失敗しました。もう一度お試しください。',
      });
      setUploadStatus('idle');
      setIsUploading(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl mb-2">データ追加</h1>
        <p className="text-gray-600">新しい講座のExcelデータをアップロードして分析を開始します</p>
      </div>

      <div className="space-y-6">
        {/* ファイルアップロードエリア */}
        <Card>
          <CardHeader>
            <CardTitle>① Excelファイルのアップロード</CardTitle>
            <CardDescription>
              講義フィードバックデータを含むExcelファイル（.xlsx, .xls, .csv）を選択してください
            </CardDescription>
          </CardHeader>
          <CardContent>
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileSelect}
              className="hidden"
            />
            
            {!file ? (
              <div
                onClick={handleClickUploadArea}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`
                  border-2 border-dashed rounded-lg p-12 text-center cursor-pointer
                  transition-colors
                  ${validationErrors.file
                ? 'border-red-500 bg-red-50'
                : isDragging
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
              }
                `}
              >
                <Upload className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p className="mb-2">
                  ファイルをドラッグ&ドロップ
                </p>
                <p className="text-sm text-gray-500 mb-4">または</p>
                <Button type="button" variant="outline">
                  ファイルを選択
                </Button>
                <p className="text-xs text-gray-400 mt-4">
                  対応形式: Excel (.xlsx, .xls), CSV (.csv)
                </p>
                {validationErrors.file && (
                  <p className="text-sm text-red-600 mt-2 font-medium">{validationErrors.file}</p>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="border rounded-lg p-4 bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <FileSpreadsheet className="h-10 w-10 text-green-600" />
                      <div>
                        <p className="font-medium">{file.name}</p>
                        <p className="text-sm text-gray-500">{formatFileSize(file.size)}</p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleRemoveFile}
                      disabled={isUploading}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* 個人情報検出中のローディング表示 */}
                {isCheckingPrivacy && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>個人情報列をチェック中...</span>
                  </div>
                )}

                {/* 個人情報検出アラート */}
                {privacyDetectionResult?.hasPrivacyColumns && (
                  <Alert variant="destructive" className="border-orange-500 bg-orange-50">
                    <ShieldAlert className="h-4 w-4 text-orange-600" />
                    <AlertTitle className="text-orange-800">個人情報列を検出しました</AlertTitle>
                    <AlertDescription className="text-orange-700">
                      <p className="mb-2">
                        以下の列が含まれています。アップロード前に該当列を削除してください。
                      </p>
                      <ul className="list-disc list-inside space-y-1">
                        {privacyDetectionResult.detectedColumns.map((col, index) => (
                          <li key={index}>
                            「{col.columnName}」列
                            {privacyDetectionResult.detectedColumns.some(c => c.sheetName !== 'Sheet1') && (
                              <span className="text-gray-500">（{col.sheetName}シート）</span>
                            )}
                          </li>
                        ))}
                      </ul>
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* 講座情報入力フォーム */}
        <Card>
          <CardHeader>
            <CardTitle>② 講座情報の入力</CardTitle>
            <CardDescription>
              新規講座または既存講座のデータを追加します。
              既存講座とは、同じ「講座名」「年度」「期間」で登録された講座のことです（例：「大規模言語モデル」「2024年度」「10月〜12月」）。
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* 新規/既存選択 */}
              <div className="space-y-2">
                <Label>講座の種類</Label>
                <Tabs value={isNewCourse ? 'new' : 'existing'} onValueChange={(value) => {
                  const isNew = value === 'new';
                  setIsNewCourse(isNew);
                  setCourseName('');
                  setYear('');
                  setPeriod('');
                  setSessionNumber(isNew ? '1' : '');
                  setIsSpecialSession(false);
                  setLectureDate('');
                  setSelectedCourseName('');
                  setSelectedYear('');
                  setSelectedPeriod('');
                }}>
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger 
                      value="existing"
                      className="data-[state=active]:bg-black data-[state=active]:text-white data-[state=active]:shadow-md"
                    >
                      既存講座にデータ追加
                    </TabsTrigger>
                    <TabsTrigger value="new">新規講座</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>

              {/* 既存講座選択 */}
              {!isNewCourse && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="existingCourseName">講座名を選択 *</Label>
                    <Select value={selectedCourseName} onValueChange={(value) => {
                      setSelectedCourseName(value);
                      setSelectedYear('');
                      setSelectedPeriod('');
                      setValidationErrors(prev => ({ ...prev, existingCourseName: '' }));
                    }} disabled={isUploading}>
                      <SelectTrigger id="existingCourseName" className={validationErrors.existingCourseName ? 'border-red-500' : ''}>
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
                    {validationErrors.existingCourseName && (
                      <p className="text-sm text-red-600 font-medium">{validationErrors.existingCourseName}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="existingYear">年度を選択 *</Label>
                    <Select value={selectedYear} onValueChange={(value) => {
                      setSelectedYear(value);
                      setSelectedPeriod('');
                      setValidationErrors(prev => ({ ...prev, existingYear: '' }));
                    }} disabled={isUploading || !selectedCourseName}>
                      <SelectTrigger id="existingYear" className={validationErrors.existingYear ? 'border-red-500' : ''}>
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
                    {validationErrors.existingYear && (
                      <p className="text-sm text-red-600 font-medium">{validationErrors.existingYear}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="existingPeriod">期間を選択 *</Label>
                    <Select value={selectedPeriod} onValueChange={(value) => {
                      setSelectedPeriod(value);
                      setValidationErrors(prev => ({ ...prev, existingPeriod: '' }));
                    }} disabled={isUploading || !selectedYear}>
                      <SelectTrigger id="existingPeriod" className={validationErrors.existingPeriod ? 'border-red-500' : ''}>
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
                    {validationErrors.existingPeriod && (
                      <p className="text-sm text-red-600 font-medium">{validationErrors.existingPeriod}</p>
                    )}
                  </div>
                </>
              )}

              {/* 新規講座の場合のみ講座名入力 */}
              {isNewCourse && (
                <div className="space-y-2">
                  <Label htmlFor="courseName">講座名 *</Label>
                  <Input
                    id="courseName"
                    placeholder="例: 大規模言語モデル"
                    value={courseName}
                    onChange={(e) => {
                      setCourseName(e.target.value);
                      setValidationErrors(prev => ({ ...prev, courseName: '' }));
                    }}
                    disabled={isUploading}
                    className={validationErrors.courseName ? 'border-red-500' : ''}
                  />
                  {validationErrors.courseName && (
                    <p className="text-sm text-red-600 font-medium">{validationErrors.courseName}</p>
                  )}
                </div>
              )}

              {/* 年度選択 */}
              {isNewCourse && (
                <div className="space-y-2">
                  <Label htmlFor="year">年度 *</Label>
                  <Select value={year} onValueChange={(value) => {
                    setYear(value);
                    setValidationErrors(prev => ({ ...prev, year: '' }));
                  }} disabled={isUploading}>
                    <SelectTrigger id="year" className={validationErrors.year ? 'border-red-500' : ''}>
                      <SelectValue placeholder="年度を選択" />
                    </SelectTrigger>
                    <SelectContent>
                      {years.map((y) => (
                        <SelectItem key={y} value={y}>
                          {y}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {validationErrors.year && (
                    <p className="text-sm text-red-600 font-medium">{validationErrors.year}</p>
                  )}
                </div>
              )}

              {/* 期間入力 */}
              {isNewCourse && (
                <div className="space-y-2">
                  <Label htmlFor="period">期間 *</Label>
                  <Input
                    id="period"
                    placeholder="例: 10月～12月"
                    value={period}
                    onChange={(e) => {
                      setPeriod(e.target.value);
                      setValidationErrors(prev => ({ ...prev, period: '' }));
                    }}
                    disabled={isUploading}
                    className={validationErrors.period ? 'border-red-500' : ''}
                  />
                  <p className="text-sm text-gray-500">
                    講座の実施期間を入力してください（例: 10月～12月、前期（4月-7月））
                  </p>
                  {validationErrors.period && (
                    <p className="text-sm text-red-600 font-medium">{validationErrors.period}</p>
                  )}
                </div>
              )}

              {/* 講義回（何回目のデータか） */}
              <div className="space-y-2">
                <Label>今回アップロードする講義回 *</Label>
                <RadioGroup
                  value={isSpecialSession ? 'special' : 'normal'}
                  onValueChange={(value) => setIsSpecialSession(value === 'special')}
                  disabled={isUploading || (!isNewCourse && (!selectedCourseName || !selectedYear || !selectedPeriod))}
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="normal" id="normalSession" />
                    <Label htmlFor="normalSession" className="cursor-pointer">
                      通常回
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="special" id="specialSession" />
                    <Label htmlFor="specialSession" className="cursor-pointer">
                      特別回
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              {/* 通常回の場合のみ講義回入力を表示 */}
              {!isSpecialSession && (
                <div className="space-y-2">
                  <Label htmlFor="sessionNumber">第何回の講義か *</Label>
                  <Input
                    id="sessionNumber"
                    type="number"
                    placeholder="例: 1"
                    min="1"
                    value={sessionNumber}
                    onChange={(e) => {
                      setSessionNumber(e.target.value);
                      setValidationErrors(prev => ({ ...prev, sessionNumber: '' }));
                    }}
                    disabled={isUploading || (!isNewCourse && (!selectedCourseName || !selectedYear || !selectedPeriod))}
                    className={validationErrors.sessionNumber ? 'border-red-500' : ''}
                  />
                  <p className="text-sm text-gray-500">
                    アップロードするデータが第何回の講義のものかを入力してください
                  </p>
                  {validationErrors.sessionNumber && (
                    <p className="text-sm text-red-600 font-medium">{validationErrors.sessionNumber}</p>
                  )}
                </div>
              )}

              {/* 講義日 */}
              <div className="space-y-2">
                <Label htmlFor="lectureDate">講義日 *</Label>
                <Input
                  id="lectureDate"
                  type="date"
                  value={lectureDate}
                  onChange={(e) => {
                    setLectureDate(e.target.value);
                    setValidationErrors(prev => ({ ...prev, lectureDate: '' }));
                  }}
                  disabled={isUploading || (!isNewCourse && (!selectedCourseName || !selectedYear || !selectedPeriod))}
                  className={validationErrors.lectureDate ? 'border-red-500' : ''}
                />
                <p className="text-sm text-gray-500">
                  講義が実施された日付を選択してください
                </p>
                {validationErrors.lectureDate && (
                  <p className="text-sm text-red-600 font-medium">{validationErrors.lectureDate}</p>
                )}
              </div>

              {/* 講師名 */}
              <div className="space-y-2">
                <Label htmlFor="instructorName">講師名 *</Label>
                <Input
                  id="instructorName"
                  placeholder="例: 山田太郎"
                  value={instructorName}
                  onChange={(e) => {
                    setInstructorName(e.target.value);
                    setValidationErrors(prev => ({ ...prev, instructorName: '' }));
                  }}
                  disabled={isUploading || (!isNewCourse && (!selectedCourseName || !selectedYear || !selectedPeriod))}
                  className={validationErrors.instructorName ? 'border-red-500' : ''}
                />
                <p className="text-sm text-gray-500">
                  今回担当した講師の名前を入力してください
                </p>
                {validationErrors.instructorName && (
                  <p className="text-sm text-red-600 font-medium">{validationErrors.instructorName}</p>
                )}
              </div>

              {/* 講義内容 */}
              <div className="space-y-2">
                <Label htmlFor="lectureContent">今回の講義内容</Label>
                <Textarea
                  id="lectureContent"
                  placeholder="例: 大規模言語モデルの基礎と応用"
                  value={lectureContent}
                  onChange={(e) => setLectureContent(e.target.value)}
                  disabled={isUploading || (!isNewCourse && (!selectedCourseName || !selectedYear || !selectedPeriod))}
                  rows={3}
                />
                <p className="text-sm text-gray-500">
                  シラバスに記載の講義概要を書いてください
                </p>
              </div>

              {/* 重複警告 */}
              {duplicateDetected && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>データの重複が検出されました</AlertTitle>
                  <AlertDescription>
                    <p className="mb-2">
                      同じ「講座名」「年度」「期間」「講義回」「講義日」「分析タイプ」の組み合わせが既に存在します。
                    </p>
                    <p className="mb-2">
                      <strong>「{effectiveCourseName}」「{effectiveYear}」「{effectivePeriod}」「{isSpecialSession ? '特別回' : `第${sessionNumber}回`}」「{lectureDate}」「{analysisType}」</strong>
                    </p>
                    <p className="mb-2">
                      新しいデータはアップロードされません。上書きしたい場合は、先にデータ削除画面から該当する講義回のデータを削除してから、もう一度アップロードしてください。
                    </p>
                  </AlertDescription>
                </Alert>
              )}

              {/* 分析タイプ */}
              <div className="space-y-2">
                <Label>分析タイプ *</Label>
                <RadioGroup value={analysisType} onValueChange={(value) => setAnalysisType(value as AnalysisType)} disabled={isUploading}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="速報版" id="quick" />
                    <Label htmlFor="quick" className="cursor-pointer">
                      速報版（講義翌日）
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="確定版" id="final" />
                    <Label htmlFor="final" className="cursor-pointer">
                      確定版（アンケート締切後）
                    </Label>
                  </div>
                </RadioGroup>
                <p className="text-sm text-gray-500">
                  速報版と確定版は別データとして保存され、ダッシュボードで切り替えて確認できます
                </p>
              </div>

              {/* 速報版：Zoom参加者数 */}
              {analysisType === '速報版' && (
                <div className="space-y-2">
                  <Label htmlFor="zoomParticipants">当日のZoom参加者数 *</Label>
                  <Input
                    id="zoomParticipants"
                    type="number"
                    placeholder="例: 150"
                    min="0"
                    value={zoomParticipants}
                    onChange={(e) => {
                      setZoomParticipants(e.target.value);
                      setValidationErrors(prev => ({ ...prev, zoomParticipants: '' }));
                    }}
                    disabled={isUploading}
                    className={validationErrors.zoomParticipants ? 'border-red-500' : ''}
                  />
                  <p className="text-sm text-gray-500">
                    当日のZoomセッションに参加した受講生の数を入力してください
                  </p>
                  {validationErrors.zoomParticipants && (
                    <p className="text-sm text-red-600 font-medium">{validationErrors.zoomParticipants}</p>
                  )}
                </div>
              )}

              {/* 確定版：録画の視聴回数 */}
              {analysisType === '確定版' && (
                <div className="space-y-2">
                  <Label htmlFor="recordingViews">録画の視聴回数 *</Label>
                  <Input
                    id="recordingViews"
                    type="number"
                    placeholder="例: 230"
                    min="0"
                    value={recordingViews}
                    onChange={(e) => {
                      setRecordingViews(e.target.value);
                      setValidationErrors(prev => ({ ...prev, recordingViews: '' }));
                    }}
                    disabled={isUploading}
                    className={validationErrors.recordingViews ? 'border-red-500' : ''}
                  />
                  <p className="text-sm text-gray-500">
                    録画の視聴回数（延べ人数）を入力してください
                  </p>
                  {validationErrors.recordingViews && (
                    <p className="text-sm text-red-600 font-medium">{validationErrors.recordingViews}</p>
                  )}
                </div>
              )}
            </div>

            <Alert className="mt-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>注意:</strong> 同じ「講座名」「年度」「期間」「講義回」「講義日」「分析タイプ」の組み合わせが既に存在する場合、新しいデータはアップロードされません。上書きしたい場合は、先にデータ削除画面から該当するデータを削除してください。
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>

        {/* アップロード状態の表示 */}
        {uploadStatus !== 'idle' && (
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-center gap-3">
                {uploadStatus === 'uploading' && (
                  <>
                    <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                    <span>ファイルをアップロード中...</span>
                  </>
                )}
                {uploadStatus === 'analyzing' && (
                  <>
                    <Loader2 className="h-6 w-6 animate-spin text-purple-600" />
                    <span>データを分析中...</span>
                  </>
                )}
                {uploadStatus === 'complete' && (
                  <>
                    <CheckCircle className="h-6 w-6 text-green-600" />
                    <span>分析完了！講座一覧に戻ります...</span>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* データ分析を開始するボタン */}
        <div className="flex justify-end gap-3">
          <Button
            variant="outline"
            onClick={onComplete}
            disabled={isUploading}
          >
            キャンセル
          </Button>
          <Button
            onClick={handleStartAnalysis}
            disabled={isUploading}
            className="min-w-[200px]"
          >
            {isUploading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                処理中...
              </>
            ) : (
              'データ分析を開始する'
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}