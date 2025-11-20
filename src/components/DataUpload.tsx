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
import { Upload, FileSpreadsheet, X, Loader2, CheckCircle, AlertCircle, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

interface DataUploadProps {
  onComplete: () => void;
  existingCourses: Array<{
    id: string;
    name: string;
    year: string;
    period: string;
    sessionCount: number;
    responseCount: number;
    sessions?: Array<{
      sessionNumber: number;
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
  const [sessionCount, setSessionCount] = useState('');
  const [analysisType, setAnalysisType] = useState<AnalysisType>('速報版');
  const [zoomParticipants, setZoomParticipants] = useState('');
  const [recordingViews, setRecordingViews] = useState('');
  const [instructorName, setInstructorName] = useState('');
  const [lectureContent, setLectureContent] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'analyzing' | 'complete'>('idle');
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
  const effectiveSessionCount = isNewCourse ? sessionCount : (selectedCourse?.sessionCount.toString() || '');

  const duplicateDetected = useMemo(() => {
    if (!effectiveCourseName || !effectiveYear || !effectivePeriod || !sessionNumber || !analysisType) return false;
    const course = existingCourses.find(
      c => c.name === effectiveCourseName && c.year === effectiveYear && c.period === effectivePeriod
    );
    if (course && course.sessions) {
      const session = course.sessions.find(s => s.sessionNumber === parseInt(sessionNumber));
      return !!(session && session.analysisTypes.includes(analysisType));
    }
    return false;
  }, [effectiveCourseName, effectiveYear, effectivePeriod, sessionNumber, analysisType, existingCourses]);
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

  const validateAndSetFile = (selectedFile: File) => {
    const validExtensions = ['.xlsx', '.xls', '.csv'];
    const fileExtension = selectedFile.name.substring(selectedFile.name.lastIndexOf('.')).toLowerCase();
    
    if (!validExtensions.includes(fileExtension)) {
      toast.error('ファイル形式エラー', {
        description: 'Excel形式（.xlsx, .xls）またはCSV形式のファイルを選択してください。',
      });
      return;
    }

    setFile(selectedFile);
    toast.success('ファイルを選択しました', {
      description: selectedFile.name,
    });
  };

  const handleRemoveFile = () => {
    setFile(null);
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
    // バリデーション
    if (!file) {
      toast.error('ファイルを選択してください');
      return;
    }
    if (!isNewCourse && (!selectedCourseName || !selectedYear || !selectedPeriod)) {
      toast.error('既存の講座を選択してください');
      return;
    }
    if (!effectiveCourseName.trim()) {
      toast.error('講座名を入力してください');
      return;
    }
    if (!effectiveYear) {
      toast.error('年度を選択してください');
      return;
    }
    if (isNewCourse && !period.trim()) {
      toast.error('期間を入力してください');
      return;
    }
    if (!sessionNumber || parseInt(sessionNumber) <= 0) {
      toast.error('講義回を入力してください');
      return;
    }
    if (!instructorName.trim()) {
      toast.error('講師名を入力してください');
      return;
    }
    if (analysisType === '速報版' && (!zoomParticipants || parseInt(zoomParticipants) <= 0)) {
      toast.error('Zoom参加者数を入力してください');
      return;
    }
    if (analysisType === '確定版' && (!recordingViews || parseInt(recordingViews) <= 0)) {
      toast.error('録画の視聴回数を入力してください');
      return;
    }
    if (isNewCourse && (!sessionCount || parseInt(sessionCount) <= 0)) {
      toast.error('講義回数を入力してください');
      return;
    }
    if (!isNewCourse && effectiveSessionCount && parseInt(sessionNumber) > parseInt(effectiveSessionCount)) {
      toast.error(`講義回は${effectiveSessionCount}以下である必要があります`);
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
                  ${isDragging 
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
              </div>
            ) : (
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
            )}
          </CardContent>
        </Card>

        {/* 講座情報入力フォーム */}
        <Card>
          <CardHeader>
            <CardTitle>② 講座情報の入力</CardTitle>
            <CardDescription>
              新規講座または既存講座のデータを追加します
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* 新規/既存選択 */}
              <div className="space-y-2">
                <Label>講座の種類</Label>
                <Tabs value={isNewCourse ? 'new' : 'existing'} onValueChange={(value) => {
                  setIsNewCourse(value === 'new');
                  setCourseName('');
                  setYear('');
                  setPeriod('');
                  setSessionCount('');
                  setSessionNumber('');
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
                    }} disabled={isUploading}>
                      <SelectTrigger id="existingCourseName">
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
                    <Label htmlFor="existingYear">年度を選択 *</Label>
                    <Select value={selectedYear} onValueChange={(value) => {
                      setSelectedYear(value);
                      setSelectedPeriod('');
                    }} disabled={isUploading || !selectedCourseName}>
                      <SelectTrigger id="existingYear">
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
                    <Label htmlFor="existingPeriod">期間を選択 *</Label>
                    <Select value={selectedPeriod} onValueChange={setSelectedPeriod} disabled={isUploading || !selectedYear}>
                      <SelectTrigger id="existingPeriod">
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
                    onChange={(e) => setCourseName(e.target.value)}
                    disabled={isUploading}
                  />
                </div>
              )}

              {/* 年度選択 */}
              {isNewCourse && (
                <div className="space-y-2">
                  <Label htmlFor="year">年度 *</Label>
                  <Select value={year} onValueChange={setYear} disabled={isUploading}>
                    <SelectTrigger id="year">
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
                    onChange={(e) => setPeriod(e.target.value)}
                    disabled={isUploading}
                  />
                  <p className="text-sm text-gray-500">
                    講座の実施期間を入力してください（例: 10月～12月、前期（4月-7月））
                  </p>
                </div>
              )}

              {/* 新規講座の場合のみ講義回数 */}
              {isNewCourse && (
                <div className="space-y-2">
                  <Label htmlFor="sessionCount">講義回数（全体） *</Label>
                  <Input
                    id="sessionCount"
                    type="number"
                    placeholder="例: 15"
                    min="1"
                    value={sessionCount}
                    onChange={(e) => setSessionCount(e.target.value)}
                    disabled={isUploading}
                  />
                  <p className="text-sm text-gray-500">
                    この講座で実施される講義の総回数を入力してください
                  </p>
                </div>
              )}

              {/* 講義回（何回目のデータか） */}
              <div className="space-y-2">
                <Label htmlFor="sessionNumber">今回アップロードする講義回 *</Label>
                <Input
                  id="sessionNumber"
                  type="number"
                  placeholder="例: 1"
                  min="1"
                  max={sessionCount || undefined}
                  value={sessionNumber}
                  onChange={(e) => setSessionNumber(e.target.value)}
                  disabled={isUploading || (!isNewCourse && (!selectedCourseName || !selectedYear || !selectedPeriod))}
                />
                <p className="text-sm text-gray-500">
                  アップロードするデータが第何回の講義のものかを入力してください
                </p>
              </div>

              {/* 重複警告 */}
              {duplicateDetected && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>データの重複が検出されました</AlertTitle>
                  <AlertDescription>
                    <p className="mb-2">
                      同じ「講座名」「年度」「期間」「講義回」「分析タイプ」の組み合わせが既に存在します。
                    </p>
                    <p className="mb-2">
                      <strong>「{effectiveCourseName}」「{effectiveYear}」「{effectivePeriod}」「第{sessionNumber}回」「{analysisType}」</strong>
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
                    onChange={(e) => setZoomParticipants(e.target.value)}
                    disabled={isUploading}
                  />
                  <p className="text-sm text-gray-500">
                    当日のZoomセッションに参加した受講生の数を入力してください
                  </p>
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
                    onChange={(e) => setRecordingViews(e.target.value)}
                    disabled={isUploading}
                  />
                  <p className="text-sm text-gray-500">
                    録画の視聴回数（延べ人数）を入力してください
                  </p>
                </div>
              )}

              {/* 講師名 */}
              <div className="space-y-2">
                <Label htmlFor="instructorName">講師名 *</Label>
                <Input
                  id="instructorName"
                  placeholder="例: 山田太郎"
                  value={instructorName}
                  onChange={(e) => setInstructorName(e.target.value)}
                  disabled={isUploading}
                />
                <p className="text-sm text-gray-500">
                  今回担当した講師の名前を入力してください
                </p>
              </div>

              {/* 講義内容 */}
              <div className="space-y-2">
                <Label htmlFor="lectureContent">今回の講義内容</Label>
                <Textarea
                  id="lectureContent"
                  placeholder="例: 大規模言語モデルの基礎と応用"
                  value={lectureContent}
                  onChange={(e) => setLectureContent(e.target.value)}
                  disabled={isUploading}
                  rows={3}
                />
                <p className="text-sm text-gray-500">
                  シラバスに記載の講義概要を書いてください
                </p>
              </div>
            </div>

            <Alert className="mt-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>注意:</strong> 同じ「講座名」「年度」「期間」「講義回」「分析タイプ」の組み合わせが既に存在する場合、新しいデータはアップロードされません。上書きしたい場合は、先にデータ削除画面から該当するデータを削除してください。
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
            disabled={
              isUploading || 
              !file || 
              !effectiveCourseName || 
              !effectiveYear || 
              (isNewCourse && !period) ||
              !sessionNumber ||
              (isNewCourse && !sessionCount) ||
              (!isNewCourse && (!selectedCourseName || !selectedYear || !selectedPeriod)) ||
              (analysisType === '速報版' && !zoomParticipants) ||
              (analysisType === '確定版' && !recordingViews) || 
              !instructorName
            }
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