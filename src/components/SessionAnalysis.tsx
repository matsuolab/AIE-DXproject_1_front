import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { BarChart, Bar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { AlertCircle, ThumbsUp, ThumbsDown, Minus, TrendingUp, TrendingDown, Calendar, User, BookOpen } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './ui/accordion';

interface Comment {
  id: string;
  text: string;
  sentiment: 'positive' | 'negative' | 'neutral';
  category: string;
  importance: 'high' | 'medium' | 'low';
}

type AnalysisType = '速報版' | '確定版';
type StudentAttribute = '全体' | '学生' | '会員企業' | '招待枠' | '不明';

// モックデータ
const sessions = ['第1回', '第2回', '第3回', '第4回', '特別回', '第5回', '第6回'];

// 講義情報データ
const sessionInfoData: Record<string, { lectureDate: string; instructorName: string; lectureContent: string }> = {
  '第1回': { lectureDate: '2024-10-07', instructorName: '山田 太郎', lectureContent: 'イントロダクション：大規模言語モデルの概要と歴史' },
  '第2回': { lectureDate: '2024-10-14', instructorName: '山田 太郎', lectureContent: 'Transformerアーキテクチャの基礎' },
  '第3回': { lectureDate: '2024-10-21', instructorName: '鈴木 花子', lectureContent: '事前学習とファインチューニング' },
  '第4回': { lectureDate: '2024-10-28', instructorName: '鈴木 花子', lectureContent: 'プロンプトエンジニアリング' },
  '特別回': { lectureDate: '2024-11-04', instructorName: '田中 健一', lectureContent: '特別講演：企業におけるLLM活用事例' },
  '第5回': { lectureDate: '2024-11-11', instructorName: '佐藤 一郎', lectureContent: 'RAGと外部知識の活用' },
  '第6回': { lectureDate: '2024-11-18', instructorName: '山田 太郎', lectureContent: 'LLMの応用事例と今後の展望' },
};

// 型定義
interface NPSMetrics {
  score: number;
  promoters: number;
  neutrals: number;
  detractors: number;
}

interface RadarItem {
  category: string;
  score: number;
  fullMark: number;
}

interface RatingCount {
  rating: string;
  count: number;
}

interface DistributionGroups {
  overall: RatingCount[];
  学習量: RatingCount[];
  理解度: RatingCount[];
  運営: RatingCount[];
  講師満足度: RatingCount[];
  時間使い方: RatingCount[];
  質問対応: RatingCount[];
  話し方: RatingCount[];
  予習: RatingCount[];
  意欲: RatingCount[];
  今後活用: RatingCount[];
}

// 各回のNPSデータ（速報版と確定版）
const npsData: Record<string, Record<AnalysisType, NPSMetrics>> = {
  '第1回': {
    '速報版': { score: 12.5, promoters: 22, neutrals: 20, detractors: 8 },
    '確定版': { score: 15.5, promoters: 25, neutrals: 18, detractors: 7 },
  },
  '第2回': {
    '速報版': { score: 20.0, promoters: 28, neutrals: 16, detractors: 6 },
    '確定版': { score: 22.3, promoters: 30, neutrals: 15, detractors: 5 },
  },
  '第3回': {
    '速報版': { score: 16.0, promoters: 26, neutrals: 17, detractors: 7 },
    '確定版': { score: 18.7, promoters: 28, neutrals: 16, detractors: 6 },
  },
  '特別回': {
    '速報版': { score: 28.5, promoters: 35, neutrals: 12, detractors: 3 },
    '確定版': { score: 32.0, promoters: 38, neutrals: 10, detractors: 2 },
  },
};

// レーダーチャートデータ（速報版と確定版）
const radarData: Record<string, Record<AnalysisType, RadarItem[]>> = {
  '第1回': {
    '速報版': [
      { category: '総合満足度', score: 4.0, fullMark: 5 },
      { category: '学習量', score: 3.9, fullMark: 5 },
      { category: '理解度', score: 3.8, fullMark: 5 },
      { category: '運営', score: 4.1, fullMark: 5 },
      { category: '講師満足度', score: 4.3, fullMark: 5 },
      { category: '時間使い方', score: 4.2, fullMark: 5 },
      { category: '質問対応', score: 4.4, fullMark: 5 },
      { category: '話し方', score: 4.3, fullMark: 5 },
      { category: '予習', score: 3.5, fullMark: 5 },
      { category: '意欲', score: 3.7, fullMark: 5 },
      { category: '今後活用', score: 3.6, fullMark: 5 },
    ],
    '確定版': [
      { category: '総合満足度', score: 4.2, fullMark: 5 },
      { category: '学習量', score: 4.1, fullMark: 5 },
      { category: '理解度', score: 4.0, fullMark: 5 },
      { category: '運営', score: 4.3, fullMark: 5 },
      { category: '講師満足度', score: 4.5, fullMark: 5 },
      { category: '時間使い方', score: 4.4, fullMark: 5 },
      { category: '質問対応', score: 4.6, fullMark: 5 },
      { category: '話し方', score: 4.5, fullMark: 5 },
      { category: '予習', score: 3.7, fullMark: 5 },
      { category: '意欲', score: 3.9, fullMark: 5 },
      { category: '今後活用', score: 3.8, fullMark: 5 },
    ],
  },
  '第2回': {
    '速報版': [
      { category: '総合満足度', score: 4.1, fullMark: 5 },
      { category: '学習量', score: 4.0, fullMark: 5 },
      { category: '理解度', score: 3.9, fullMark: 5 },
      { category: '運営', score: 4.2, fullMark: 5 },
      { category: '講師満足度', score: 4.4, fullMark: 5 },
      { category: '時間使い方', score: 4.3, fullMark: 5 },
      { category: '質問対応', score: 4.5, fullMark: 5 },
      { category: '話し方', score: 4.4, fullMark: 5 },
      { category: '予習', score: 3.7, fullMark: 5 },
      { category: '意欲', score: 3.9, fullMark: 5 },
      { category: '今後活用', score: 3.8, fullMark: 5 },
    ],
    '確定版': [
      { category: '総合満足度', score: 4.3, fullMark: 5 },
      { category: '学習量', score: 4.2, fullMark: 5 },
      { category: '理解度', score: 4.1, fullMark: 5 },
      { category: '運営', score: 4.4, fullMark: 5 },
      { category: '講師満足度', score: 4.6, fullMark: 5 },
      { category: '時間使い方', score: 4.5, fullMark: 5 },
      { category: '質問対応', score: 4.7, fullMark: 5 },
      { category: '話し方', score: 4.6, fullMark: 5 },
      { category: '予習', score: 3.9, fullMark: 5 },
      { category: '意欲', score: 4.1, fullMark: 5 },
      { category: '今後活用', score: 4.0, fullMark: 5 },
    ],
  },
  '第3回': {
    '速報版': [
      { category: '総合満足度', score: 3.9, fullMark: 5 },
      { category: '学習量', score: 3.8, fullMark: 5 },
      { category: '理解度', score: 3.7, fullMark: 5 },
      { category: '運営', score: 4.0, fullMark: 5 },
      { category: '講師満足度', score: 4.2, fullMark: 5 },
      { category: '時間使い方', score: 4.1, fullMark: 5 },
      { category: '質問対応', score: 4.3, fullMark: 5 },
      { category: '話し方', score: 4.2, fullMark: 5 },
      { category: '予習', score: 3.6, fullMark: 5 },
      { category: '意欲', score: 3.8, fullMark: 5 },
      { category: '今後活用', score: 3.7, fullMark: 5 },
    ],
    '確定版': [
      { category: '総合満足度', score: 4.1, fullMark: 5 },
      { category: '学習量', score: 4.0, fullMark: 5 },
      { category: '理解度', score: 3.9, fullMark: 5 },
      { category: '運営', score: 4.2, fullMark: 5 },
      { category: '講師満足度', score: 4.4, fullMark: 5 },
      { category: '時間使い方', score: 4.3, fullMark: 5 },
      { category: '質問対応', score: 4.5, fullMark: 5 },
      { category: '話し方', score: 4.4, fullMark: 5 },
      { category: '予習', score: 3.8, fullMark: 5 },
      { category: '意欲', score: 4.0, fullMark: 5 },
      { category: '今後活用', score: 3.9, fullMark: 5 },
    ],
  },
  '特別回': {
    '速報版': [
      { category: '総合満足度', score: 4.5, fullMark: 5 },
      { category: '学習量', score: 4.3, fullMark: 5 },
      { category: '理解度', score: 4.4, fullMark: 5 },
      { category: '運営', score: 4.5, fullMark: 5 },
      { category: '講師満足度', score: 4.7, fullMark: 5 },
      { category: '時間使い方', score: 4.5, fullMark: 5 },
      { category: '質問対応', score: 4.6, fullMark: 5 },
      { category: '話し方', score: 4.6, fullMark: 5 },
      { category: '予習', score: 3.8, fullMark: 5 },
      { category: '意欲', score: 4.3, fullMark: 5 },
      { category: '今後活用', score: 4.5, fullMark: 5 },
    ],
    '確定版': [
      { category: '総合満足度', score: 4.7, fullMark: 5 },
      { category: '学習量', score: 4.5, fullMark: 5 },
      { category: '理解度', score: 4.6, fullMark: 5 },
      { category: '運営', score: 4.7, fullMark: 5 },
      { category: '講師満足度', score: 4.9, fullMark: 5 },
      { category: '時間使い方', score: 4.7, fullMark: 5 },
      { category: '質問対応', score: 4.8, fullMark: 5 },
      { category: '話し方', score: 4.8, fullMark: 5 },
      { category: '予習', score: 4.0, fullMark: 5 },
      { category: '意欲', score: 4.5, fullMark: 5 },
      { category: '今後活用', score: 4.7, fullMark: 5 },
    ],
  },
};

// 評価分布データ（速報版と確定版）
const distributionData: Record<string, Record<AnalysisType, DistributionGroups>> = {
  '第1回': {
    '速報版': {
      overall: [
        { rating: '5点', count: 15 },
        { rating: '4点', count: 24 },
        { rating: '3点', count: 9 },
        { rating: '2点', count: 2 },
        { rating: '1点', count: 0 },
      ],
      学習量: [
        { rating: '5点', count: 14 },
        { rating: '4点', count: 23 },
        { rating: '3点', count: 10 },
        { rating: '2点', count: 3 },
        { rating: '1点', count: 0 },
      ],
      理解度: [
        { rating: '5点', count: 12 },
        { rating: '4点', count: 22 },
        { rating: '3点', count: 12 },
        { rating: '2点', count: 4 },
        { rating: '1点', count: 0 },
      ],
      運営: [
        { rating: '5点', count: 16 },
        { rating: '4点', count: 24 },
        { rating: '3点', count: 8 },
        { rating: '2点', count: 2 },
        { rating: '1点', count: 0 },
      ],
      講師満足度: [
        { rating: '5点', count: 20 },
        { rating: '4点', count: 22 },
        { rating: '3点', count: 6 },
        { rating: '2点', count: 2 },
        { rating: '1点', count: 0 },
      ],
      時間使い方: [
        { rating: '5点', count: 18 },
        { rating: '4点', count: 23 },
        { rating: '3点', count: 7 },
        { rating: '2点', count: 2 },
        { rating: '1点', count: 0 },
      ],
      質問対応: [
        { rating: '5点', count: 22 },
        { rating: '4点', count: 21 },
        { rating: '3点', count: 5 },
        { rating: '2点', count: 2 },
        { rating: '1点', count: 0 },
      ],
      話し方: [
        { rating: '5点', count: 20 },
        { rating: '4点', count: 22 },
        { rating: '3点', count: 6 },
        { rating: '2点', count: 2 },
        { rating: '1点', count: 0 },
      ],
      予習: [
        { rating: '5点', count: 8 },
        { rating: '4点', count: 18 },
        { rating: '3点', count: 15 },
        { rating: '2点', count: 7 },
        { rating: '1点', count: 2 },
      ],
      意欲: [
        { rating: '5点', count: 12 },
        { rating: '4点', count: 20 },
        { rating: '3点', count: 12 },
        { rating: '2点', count: 5 },
        { rating: '1点', count: 1 },
      ],
      今後活用: [
        { rating: '5点', count: 10 },
        { rating: '4点', count: 19 },
        { rating: '3点', count: 14 },
        { rating: '2点', count: 6 },
        { rating: '1点', count: 1 },
      ],
    },
    '確定版': {
      overall: [
        { rating: '5点', count: 18 },
        { rating: '4点', count: 22 },
        { rating: '3点', count: 8 },
        { rating: '2点', count: 2 },
        { rating: '1点', count: 0 },
      ],
      学習量: [
        { rating: '5点', count: 17 },
        { rating: '4点', count: 21 },
        { rating: '3点', count: 9 },
        { rating: '2点', count: 3 },
        { rating: '1点', count: 0 },
      ],
      理解度: [
        { rating: '5点', count: 15 },
        { rating: '4点', count: 20 },
        { rating: '3点', count: 11 },
        { rating: '2点', count: 4 },
        { rating: '1点', count: 0 },
      ],
      運営: [
        { rating: '5点', count: 19 },
        { rating: '4点', count: 22 },
        { rating: '3点', count: 7 },
        { rating: '2点', count: 2 },
        { rating: '1点', count: 0 },
      ],
      講師満足度: [
        { rating: '5点', count: 24 },
        { rating: '4点', count: 20 },
        { rating: '3点', count: 5 },
        { rating: '2点', count: 1 },
        { rating: '1点', count: 0 },
      ],
      時間使い方: [
        { rating: '5点', count: 22 },
        { rating: '4点', count: 21 },
        { rating: '3点', count: 6 },
        { rating: '2点', count: 1 },
        { rating: '1点', count: 0 },
      ],
      質問対応: [
        { rating: '5点', count: 26 },
        { rating: '4点', count: 19 },
        { rating: '3点', count: 4 },
        { rating: '2点', count: 1 },
        { rating: '1点', count: 0 },
      ],
      話し方: [
        { rating: '5点', count: 24 },
        { rating: '4点', count: 20 },
        { rating: '3点', count: 5 },
        { rating: '2点', count: 1 },
        { rating: '1点', count: 0 },
      ],
      予習: [
        { rating: '5点', count: 10 },
        { rating: '4点', count: 20 },
        { rating: '3点', count: 14 },
        { rating: '2点', count: 5 },
        { rating: '1点', count: 1 },
      ],
      意欲: [
        { rating: '5点', count: 14 },
        { rating: '4点', count: 22 },
        { rating: '3点', count: 10 },
        { rating: '2点', count: 3 },
        { rating: '1点', count: 1 },
      ],
      今後活用: [
        { rating: '5点', count: 12 },
        { rating: '4点', count: 21 },
        { rating: '3点', count: 12 },
        { rating: '2点', count: 4 },
        { rating: '1点', count: 1 },
      ],
    },
  },
  '第2回': {
    '速報版': {
      overall: [
        { rating: '5点', count: 22 },
        { rating: '4点', count: 20 },
        { rating: '3点', count: 6 },
        { rating: '2点', count: 2 },
        { rating: '1点', count: 0 },
      ],
      学習量: [
        { rating: '5点', count: 21 },
        { rating: '4点', count: 19 },
        { rating: '3点', count: 7 },
        { rating: '2点', count: 3 },
        { rating: '1点', count: 0 },
      ],
      理解度: [
        { rating: '5点', count: 19 },
        { rating: '4点', count: 18 },
        { rating: '3点', count: 9 },
        { rating: '2点', count: 4 },
        { rating: '1点', count: 0 },
      ],
      運営: [
        { rating: '5点', count: 23 },
        { rating: '4点', count: 20 },
        { rating: '3点', count: 5 },
        { rating: '2点', count: 2 },
        { rating: '1点', count: 0 },
      ],
      講師満足度: [
        { rating: '5点', count: 26 },
        { rating: '4点', count: 18 },
        { rating: '3点', count: 5 },
        { rating: '2点', count: 1 },
        { rating: '1点', count: 0 },
      ],
      時間使い方: [
        { rating: '5点', count: 24 },
        { rating: '4点', count: 19 },
        { rating: '3点', count: 6 },
        { rating: '2点', count: 1 },
        { rating: '1点', count: 0 },
      ],
      質問対応: [
        { rating: '5点', count: 28 },
        { rating: '4点', count: 17 },
        { rating: '3点', count: 4 },
        { rating: '2点', count: 1 },
        { rating: '1点', count: 0 },
      ],
      話し方: [
        { rating: '5点', count: 26 },
        { rating: '4点', count: 18 },
        { rating: '3点', count: 5 },
        { rating: '2点', count: 1 },
        { rating: '1点', count: 0 },
      ],
      予習: [
        { rating: '5点', count: 12 },
        { rating: '4点', count: 20 },
        { rating: '3点', count: 12 },
        { rating: '2点', count: 5 },
        { rating: '1点', count: 1 },
      ],
      意欲: [
        { rating: '5点', count: 16 },
        { rating: '4点', count: 22 },
        { rating: '3点', count: 9 },
        { rating: '2点', count: 3 },
        { rating: '1点', count: 0 },
      ],
      今後活用: [
        { rating: '5点', count: 14 },
        { rating: '4点', count: 21 },
        { rating: '3点', count: 11 },
        { rating: '2点', count: 4 },
        { rating: '1点', count: 0 },
      ],
    },
    '確定版': {
      overall: [
        { rating: '5点', count: 24 },
        { rating: '4点', count: 18 },
        { rating: '3点', count: 6 },
        { rating: '2点', count: 2 },
        { rating: '1点', count: 0 },
      ],
      学習量: [
        { rating: '5点', count: 23 },
        { rating: '4点', count: 17 },
        { rating: '3点', count: 7 },
        { rating: '2点', count: 3 },
        { rating: '1点', count: 0 },
      ],
      理解度: [
        { rating: '5点', count: 21 },
        { rating: '4点', count: 16 },
        { rating: '3点', count: 9 },
        { rating: '2点', count: 4 },
        { rating: '1点', count: 0 },
      ],
      運営: [
        { rating: '5点', count: 25 },
        { rating: '4点', count: 18 },
        { rating: '3点', count: 5 },
        { rating: '2点', count: 2 },
        { rating: '1点', count: 0 },
      ],
      講師満足度: [
        { rating: '5点', count: 28 },
        { rating: '4点', count: 17 },
        { rating: '3点', count: 4 },
        { rating: '2点', count: 1 },
        { rating: '1点', count: 0 },
      ],
      時間使い方: [
        { rating: '5点', count: 26 },
        { rating: '4点', count: 18 },
        { rating: '3点', count: 5 },
        { rating: '2点', count: 1 },
        { rating: '1点', count: 0 },
      ],
      質問対応: [
        { rating: '5点', count: 30 },
        { rating: '4点', count: 15 },
        { rating: '3点', count: 4 },
        { rating: '2点', count: 1 },
        { rating: '1点', count: 0 },
      ],
      話し方: [
        { rating: '5点', count: 28 },
        { rating: '4点', count: 17 },
        { rating: '3点', count: 4 },
        { rating: '2点', count: 1 },
        { rating: '1点', count: 0 },
      ],
      予習: [
        { rating: '5点', count: 14 },
        { rating: '4点', count: 22 },
        { rating: '3点', count: 10 },
        { rating: '2点', count: 3 },
        { rating: '1点', count: 1 },
      ],
      意欲: [
        { rating: '5点', count: 18 },
        { rating: '4点', count: 24 },
        { rating: '3点', count: 6 },
        { rating: '2点', count: 2 },
        { rating: '1点', count: 0 },
      ],
      今後活用: [
        { rating: '5点', count: 16 },
        { rating: '4点', count: 23 },
        { rating: '3点', count: 8 },
        { rating: '2点', count: 3 },
        { rating: '1点', count: 0 },
      ],
    },
  },
  '第3回': {
    '速報版': {
      overall: [
        { rating: '5点', count: 18 },
        { rating: '4点', count: 21 },
        { rating: '3点', count: 8 },
        { rating: '2点', count: 3 },
        { rating: '1点', count: 0 },
      ],
      学習量: [
        { rating: '5点', count: 17 },
        { rating: '4点', count: 20 },
        { rating: '3点', count: 9 },
        { rating: '2点', count: 4 },
        { rating: '1点', count: 0 },
      ],
      理解度: [
        { rating: '5点', count: 15 },
        { rating: '4点', count: 19 },
        { rating: '3点', count: 11 },
        { rating: '2点', count: 5 },
        { rating: '1点', count: 0 },
      ],
      運営: [
        { rating: '5点', count: 19 },
        { rating: '4点', count: 21 },
        { rating: '3点', count: 7 },
        { rating: '2点', count: 3 },
        { rating: '1点', count: 0 },
      ],
      講師満足度: [
        { rating: '5点', count: 20 },
        { rating: '4点', count: 22 },
        { rating: '3点', count: 7 },
        { rating: '2点', count: 1 },
        { rating: '1点', count: 0 },
      ],
      時間使い方: [
        { rating: '5点', count: 19 },
        { rating: '4点', count: 21 },
        { rating: '3点', count: 8 },
        { rating: '2点', count: 2 },
        { rating: '1点', count: 0 },
      ],
      質問対応: [
        { rating: '5点', count: 21 },
        { rating: '4点', count: 21 },
        { rating: '3点', count: 6 },
        { rating: '2点', count: 2 },
        { rating: '1点', count: 0 },
      ],
      話し方: [
        { rating: '5点', count: 20 },
        { rating: '4点', count: 22 },
        { rating: '3点', count: 7 },
        { rating: '2点', count: 1 },
        { rating: '1点', count: 0 },
      ],
      予習: [
        { rating: '5点', count: 10 },
        { rating: '4点', count: 19 },
        { rating: '3点', count: 13 },
        { rating: '2点', count: 6 },
        { rating: '1点', count: 2 },
      ],
      意欲: [
        { rating: '5点', count: 14 },
        { rating: '4点', count: 21 },
        { rating: '3点', count: 10 },
        { rating: '2点', count: 4 },
        { rating: '1点', count: 1 },
      ],
      今後活用: [
        { rating: '5点', count: 12 },
        { rating: '4点', count: 20 },
        { rating: '3点', count: 12 },
        { rating: '2点', count: 5 },
        { rating: '1点', count: 1 },
      ],
    },
    '確定版': {
      overall: [
        { rating: '5点', count: 20 },
        { rating: '4点', count: 20 },
        { rating: '3点', count: 7 },
        { rating: '2点', count: 3 },
        { rating: '1点', count: 0 },
      ],
      学習量: [
        { rating: '5点', count: 19 },
        { rating: '4点', count: 19 },
        { rating: '3点', count: 8 },
        { rating: '2点', count: 4 },
        { rating: '1点', count: 0 },
      ],
      理解度: [
        { rating: '5点', count: 17 },
        { rating: '4点', count: 18 },
        { rating: '3点', count: 10 },
        { rating: '2点', count: 5 },
        { rating: '1点', count: 0 },
      ],
      運営: [
        { rating: '5点', count: 21 },
        { rating: '4点', count: 20 },
        { rating: '3点', count: 6 },
        { rating: '2点', count: 3 },
        { rating: '1点', count: 0 },
      ],
      講師満足度: [
        { rating: '5点', count: 22 },
        { rating: '4点', count: 21 },
        { rating: '3点', count: 6 },
        { rating: '2点', count: 1 },
        { rating: '1点', count: 0 },
      ],
      時間使い方: [
        { rating: '5点', count: 21 },
        { rating: '4点', count: 20 },
        { rating: '3点', count: 7 },
        { rating: '2点', count: 2 },
        { rating: '1点', count: 0 },
      ],
      質問対応: [
        { rating: '5点', count: 23 },
        { rating: '4点', count: 20 },
        { rating: '3点', count: 5 },
        { rating: '2点', count: 2 },
        { rating: '1点', count: 0 },
      ],
      話し方: [
        { rating: '5点', count: 22 },
        { rating: '4点', count: 21 },
        { rating: '3点', count: 6 },
        { rating: '2点', count: 1 },
        { rating: '1点', count: 0 },
      ],
      予習: [
        { rating: '5点', count: 12 },
        { rating: '4点', count: 21 },
        { rating: '3点', count: 11 },
        { rating: '2点', count: 5 },
        { rating: '1点', count: 1 },
      ],
      意欲: [
        { rating: '5点', count: 16 },
        { rating: '4点', count: 23 },
        { rating: '3点', count: 8 },
        { rating: '2点', count: 3 },
        { rating: '1点', count: 0 },
      ],
      今後活用: [
        { rating: '5点', count: 14 },
        { rating: '4点', count: 22 },
        { rating: '3点', count: 10 },
        { rating: '2点', count: 4 },
        { rating: '1点', count: 0 },
      ],
    },
  },
  '特別回': {
    '速報版': {
      overall: [
        { rating: '5点', count: 28 },
        { rating: '4点', count: 18 },
        { rating: '3点', count: 4 },
        { rating: '2点', count: 0 },
        { rating: '1点', count: 0 },
      ],
      学習量: [
        { rating: '5点', count: 26 },
        { rating: '4点', count: 19 },
        { rating: '3点', count: 5 },
        { rating: '2点', count: 0 },
        { rating: '1点', count: 0 },
      ],
      理解度: [
        { rating: '5点', count: 27 },
        { rating: '4点', count: 18 },
        { rating: '3点', count: 5 },
        { rating: '2点', count: 0 },
        { rating: '1点', count: 0 },
      ],
      運営: [
        { rating: '5点', count: 28 },
        { rating: '4点', count: 19 },
        { rating: '3点', count: 3 },
        { rating: '2点', count: 0 },
        { rating: '1点', count: 0 },
      ],
      講師満足度: [
        { rating: '5点', count: 32 },
        { rating: '4点', count: 15 },
        { rating: '3点', count: 3 },
        { rating: '2点', count: 0 },
        { rating: '1点', count: 0 },
      ],
      時間使い方: [
        { rating: '5点', count: 28 },
        { rating: '4点', count: 18 },
        { rating: '3点', count: 4 },
        { rating: '2点', count: 0 },
        { rating: '1点', count: 0 },
      ],
      質問対応: [
        { rating: '5点', count: 30 },
        { rating: '4点', count: 17 },
        { rating: '3点', count: 3 },
        { rating: '2点', count: 0 },
        { rating: '1点', count: 0 },
      ],
      話し方: [
        { rating: '5点', count: 30 },
        { rating: '4点', count: 17 },
        { rating: '3点', count: 3 },
        { rating: '2点', count: 0 },
        { rating: '1点', count: 0 },
      ],
      予習: [
        { rating: '5点', count: 14 },
        { rating: '4点', count: 22 },
        { rating: '3点', count: 10 },
        { rating: '2点', count: 4 },
        { rating: '1点', count: 0 },
      ],
      意欲: [
        { rating: '5点', count: 24 },
        { rating: '4点', count: 20 },
        { rating: '3点', count: 6 },
        { rating: '2点', count: 0 },
        { rating: '1点', count: 0 },
      ],
      今後活用: [
        { rating: '5点', count: 28 },
        { rating: '4点', count: 18 },
        { rating: '3点', count: 4 },
        { rating: '2点', count: 0 },
        { rating: '1点', count: 0 },
      ],
    },
    '確定版': {
      overall: [
        { rating: '5点', count: 32 },
        { rating: '4点', count: 16 },
        { rating: '3点', count: 2 },
        { rating: '2点', count: 0 },
        { rating: '1点', count: 0 },
      ],
      学習量: [
        { rating: '5点', count: 30 },
        { rating: '4点', count: 17 },
        { rating: '3点', count: 3 },
        { rating: '2点', count: 0 },
        { rating: '1点', count: 0 },
      ],
      理解度: [
        { rating: '5点', count: 31 },
        { rating: '4点', count: 16 },
        { rating: '3点', count: 3 },
        { rating: '2点', count: 0 },
        { rating: '1点', count: 0 },
      ],
      運営: [
        { rating: '5点', count: 32 },
        { rating: '4点', count: 16 },
        { rating: '3点', count: 2 },
        { rating: '2点', count: 0 },
        { rating: '1点', count: 0 },
      ],
      講師満足度: [
        { rating: '5点', count: 36 },
        { rating: '4点', count: 12 },
        { rating: '3点', count: 2 },
        { rating: '2点', count: 0 },
        { rating: '1点', count: 0 },
      ],
      時間使い方: [
        { rating: '5点', count: 32 },
        { rating: '4点', count: 15 },
        { rating: '3点', count: 3 },
        { rating: '2点', count: 0 },
        { rating: '1点', count: 0 },
      ],
      質問対応: [
        { rating: '5点', count: 34 },
        { rating: '4点', count: 14 },
        { rating: '3点', count: 2 },
        { rating: '2点', count: 0 },
        { rating: '1点', count: 0 },
      ],
      話し方: [
        { rating: '5点', count: 34 },
        { rating: '4点', count: 14 },
        { rating: '3点', count: 2 },
        { rating: '2点', count: 0 },
        { rating: '1点', count: 0 },
      ],
      予習: [
        { rating: '5点', count: 16 },
        { rating: '4点', count: 24 },
        { rating: '3点', count: 8 },
        { rating: '2点', count: 2 },
        { rating: '1点', count: 0 },
      ],
      意欲: [
        { rating: '5点', count: 28 },
        { rating: '4点', count: 18 },
        { rating: '3点', count: 4 },
        { rating: '2点', count: 0 },
        { rating: '1点', count: 0 },
      ],
      今後活用: [
        { rating: '5点', count: 32 },
        { rating: '4点', count: 16 },
        { rating: '3点', count: 2 },
        { rating: '2点', count: 0 },
        { rating: '1点', count: 0 },
      ],
    },
  },
};

const comments: { [key: string]: { [type in AnalysisType]: Comment[] } } = {
  '第1回': {
    '速報版': [
      { id: '1', text: '非常にわかりやすい説明で、大規模言語モデルの基礎がよく理解できました。', sentiment: 'positive', category: '講義内容', importance: 'high' },
      { id: '2', text: '講師の話し方が聞き取りやすく、ライドも見やすかった。', sentiment: 'positive', category: 'その他', importance: 'medium' },
      { id: '3', text: '配布資料のPDFが一部文字化けしていました。', sentiment: 'negative', category: '講義資料', importance: 'high' },
      { id: '4', text: '実例を交えた説明で理解が深まりました。', sentiment: 'positive', category: '講義内容', importance: 'medium' },
    ],
    '確定版': [
      { id: '1', text: '非常にわかりやすい説明で、大規模言語モデルの基礎がよく理解できました。', sentiment: 'positive', category: '講義内容', importance: 'high' },
      { id: '2', text: '講師の話し方が聞き取りやすく、スライドも見やすかった。', sentiment: 'positive', category: 'その他', importance: 'medium' },
      { id: '3', text: '配布資料のPDFが一部文字化けしていました。', sentiment: 'negative', category: '講義資料', importance: 'high' },
      { id: '4', text: '実例を交えた説明で理解が深まりました。', sentiment: 'positive', category: '講義内容', importance: 'medium' },
      { id: '5', text: '時間配分が適切でした。', sentiment: 'positive', category: '運営', importance: 'low' },
      { id: '6', text: '専門用語の説明がもう少し欲しかったです。', sentiment: 'negative', category: '講義内容', importance: 'medium' },
    ],
  },
  '第2回': {
    '速報版': [
      { id: '7', text: 'Transformerアーキテクチャの説明が素晴らしかったです。', sentiment: 'positive', category: '講義内容', importance: 'high' },
      { id: '8', text: '実装例があってとても参考になりました。', sentiment: 'positive', category: '講義内容', importance: 'high' },
      { id: '9', text: 'もう少しゆっくり進めてほしい。', sentiment: 'negative', category: 'その他', importance: 'medium' },
    ],
    '確定版': [
      { id: '7', text: 'Transformerアーキテクチャの説明が素晴らしかったです。', sentiment: 'positive', category: '講義内容', importance: 'high' },
      { id: '8', text: '実装例があってとても参考になりました。', sentiment: 'positive', category: '講義内容', importance: 'high' },
      { id: '9', text: 'もう少しゆっくり進めてほしい。', sentiment: 'negative', category: 'その他', importance: 'medium' },
      { id: '10', text: '質問に丁寧に答えていただけた。', sentiment: 'positive', category: 'その他', importance: 'medium' },
      { id: '11', text: '会場のマイクの調子が悪かった。', sentiment: 'negative', category: '運営', importance: 'high' },
    ],
  },
  '第3回': {
    '速報版': [
      { id: '12', text: 'ファインチューニングの実践例が役立ちました。', sentiment: 'positive', category: '講義内容', importance: 'high' },
      { id: '13', text: '演習時間がもう少し欲しかったです。', sentiment: 'negative', category: '運営', importance: 'medium' },
    ],
    '確定版': [
      { id: '12', text: 'ファインチューニングの実践例が役立ちました。', sentiment: 'positive', category: '講義内容', importance: 'high' },
      { id: '13', text: '演習時間がもう少し欲しかったです。', sentiment: 'negative', category: '運営', importance: 'medium' },
      { id: '14', text: '前回よりも理解しやすい内容でした。', sentiment: 'positive', category: '講義内容', importance: 'medium' },
      { id: '15', text: 'コードサンプルが充実していて良かった。', sentiment: 'positive', category: '講義資料', importance: 'medium' },
    ],
  },
  '特別回': {
    '速報版': [
      { id: '16', text: '実際のビジネス現場でのLLM活用事例が非常に参考になりました。', sentiment: 'positive', category: '講義内容', importance: 'high' },
      { id: '17', text: '企業の方から直接お話を聞けて貴重な経験でした。', sentiment: 'positive', category: '講義内容', importance: 'high' },
      { id: '18', text: '質疑応答の時間がもう少し欲しかったです。', sentiment: 'negative', category: '運営', importance: 'medium' },
      { id: '19', text: '具体的な導入事例と成果の数字が印象的でした。', sentiment: 'positive', category: '講義内容', importance: 'medium' },
    ],
    '確定版': [
      { id: '16', text: '実際のビジネス現場でのLLM活用事例が非常に参考になりました。', sentiment: 'positive', category: '講義内容', importance: 'high' },
      { id: '17', text: '企業の方から直接お話を聞けて貴重な経験でした。', sentiment: 'positive', category: '講義内容', importance: 'high' },
      { id: '18', text: '質疑応答の時間がもう少し欲しかったです。', sentiment: 'negative', category: '運営', importance: 'medium' },
      { id: '19', text: '具体的な導入事例と成果の数字が印象的でした。', sentiment: 'positive', category: '講義内容', importance: 'medium' },
      { id: '20', text: '今後のキャリアを考える上で参考になりました。', sentiment: 'positive', category: 'その他', importance: 'medium' },
      { id: '21', text: '資料も分かりやすく、復習しやすい内容でした。', sentiment: 'positive', category: '講義資料', importance: 'low' },
    ],
  },
};

interface SessionAnalysisProps {
  analysisType: AnalysisType;
  studentAttribute: StudentAttribute;
}

// 属性別のデータ調整関数
function adjustNPSForAttribute(baseNPS: NPSMetrics, attribute: StudentAttribute): NPSMetrics {
  const adjustments: { [key: string]: number } = {
    '全体': 0,
    '学生': -3,
    '会員企業': 5,
    '招待枠': -2,
    '不明': -8
  };
  const adjust = adjustments[attribute];
  return {
    score: baseNPS.score + adjust,
    promoters: Math.max(0, baseNPS.promoters + (adjust > 0 ? Math.floor(adjust * 0.8) : Math.floor(adjust * 0.6))),
    neutrals: baseNPS.neutrals,
    detractors: Math.max(0, baseNPS.detractors - (adjust > 0 ? Math.floor(adjust * 0.8) : Math.floor(adjust * 0.6)))
  };
}

function adjustScoreForAttribute(baseScore: number, attribute: StudentAttribute): number {
  const adjustments: { [key: string]: number } = {
    '全体': 0,
    '学生': -0.15,
    '会員企業': 0.12,
    '招待枠': -0.08,
    '不明': -0.25
  };
  return Math.max(1, Math.min(5, baseScore + adjustments[attribute]));
}

function adjustCountForAttribute(baseCount: number, attribute: StudentAttribute): number {
  const factors: { [key: string]: number } = {
    '全体': 1.0,
    '学生': 0.4,
    '会員企業': 0.44,
    '招待枠': 0.11,
    '不明': 0.05
  };
  return Math.max(0, Math.round(baseCount * factors[attribute]));
}

export function SessionAnalysis({ analysisType, studentAttribute }: SessionAnalysisProps) {
  const [selectedSession, setSelectedSession] = useState('');
  const [sentimentFilter, setSentimentFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  // 基本データ取得
  const baseNPS = npsData[selectedSession]?.[analysisType] || npsData['第1回']['確定版'];
  const baseRadar = radarData[selectedSession]?.[analysisType] || radarData['第1回']['確定版'];
  const baseDistribution = distributionData[selectedSession]?.[analysisType] || distributionData['第1回']['確定版'];
  const baseComments = comments[selectedSession]?.[analysisType] || comments['第1回']['確定版'];

  // 属性に応じてデータを調整
  const currentNPS = adjustNPSForAttribute(baseNPS, studentAttribute);
  const currentRadar = baseRadar.map(item => ({
    ...item,
    score: adjustScoreForAttribute(item.score, studentAttribute)
  }));
  const currentDistribution = {
    overall: baseDistribution.overall.map(item => ({
      ...item,
      count: adjustCountForAttribute(item.count, studentAttribute)
    })),
    学習量: baseDistribution.学習量.map(item => ({
      ...item,
      count: adjustCountForAttribute(item.count, studentAttribute)
    })),
    理解度: baseDistribution.理解度.map(item => ({
      ...item,
      count: adjustCountForAttribute(item.count, studentAttribute)
    })),
    運営: baseDistribution.運営.map(item => ({
      ...item,
      count: adjustCountForAttribute(item.count, studentAttribute)
    })),
    講師満足度: baseDistribution.講師満足度.map(item => ({
      ...item,
      count: adjustCountForAttribute(item.count, studentAttribute)
    })),
    時間使い方: baseDistribution.時間使い方.map(item => ({
      ...item,
      count: adjustCountForAttribute(item.count, studentAttribute)
    })),
    質問対応: baseDistribution.質問対応.map(item => ({
      ...item,
      count: adjustCountForAttribute(item.count, studentAttribute)
    })),
    話し方: baseDistribution.話し方.map(item => ({
      ...item,
      count: adjustCountForAttribute(item.count, studentAttribute)
    })),
    予習: baseDistribution.予習.map(item => ({
      ...item,
      count: adjustCountForAttribute(item.count, studentAttribute)
    })),
    意欲: baseDistribution.意欲.map(item => ({
      ...item,
      count: adjustCountForAttribute(item.count, studentAttribute)
    })),
    今後活用: baseDistribution.今後活用.map(item => ({
      ...item,
      count: adjustCountForAttribute(item.count, studentAttribute)
    })),
  };
  
  // コメントは属性によってフィルタリング（簡易実装）
  const currentComments = studentAttribute === '全体' 
    ? baseComments 
    : baseComments.slice(0, Math.max(1, Math.floor(baseComments.length * (studentAttribute === '会員企業' ? 0.5 : studentAttribute === '学生' ? 0.45 : 0.3))));
  
  const currentImportant = currentComments.filter(c => c.importance === 'high');

  const filteredComments = currentComments.filter(comment => {
    const sentimentMatch = sentimentFilter === 'all' || comment.sentiment === sentimentFilter;
    const categoryMatch = categoryFilter === 'all' || comment.category === categoryFilter;
    return sentimentMatch && categoryMatch;
  });

  const npsColor = currentNPS.score >= 0 ? 'text-green-600' : 'text-red-600';
  const npsBgColor = currentNPS.score >= 0 ? 'bg-green-50' : 'bg-red-50';

  const getSentimentIcon = (sentiment: string) => {
    switch (sentiment) {
    case 'positive':
      return <ThumbsUp className="h-4 w-4 text-green-600" />;
    case 'negative':
      return <ThumbsDown className="h-4 w-4 text-red-600" />;
    default:
      return <Minus className="h-4 w-4 text-gray-600" />;
    }
  };

  type Sentiment = 'positive' | 'negative' | 'neutral';
  type Importance = 'high' | 'medium' | 'low';
  interface BadgeConfig {
    variant: 'default' | 'secondary' | 'outline';
    className?: string;
  }

  const getSentimentBadge = (sentiment: Sentiment) => {
    const variants: Record<Sentiment, BadgeConfig> = {
      positive: { variant: 'default', className: 'bg-green-100 text-green-800 hover:bg-green-100' },
      negative: { variant: 'default', className: 'bg-red-100 text-red-800 hover:bg-red-100' },
      neutral: { variant: 'secondary', className: '' },
    };
    const labels: Record<Sentiment, string> = {
      positive: 'ポジティブ',
      negative: 'ネガティブ',
      neutral: 'ニュートラル',
    };
    const config = variants[sentiment];
    return <Badge {...config}>{labels[sentiment]}</Badge>;
  };

  const getImportanceBadge = (importance: Importance) => {
    const variants: Record<Importance, BadgeConfig> = {
      high: { variant: 'default', className: 'bg-orange-100 text-orange-800 hover:bg-orange-100' },
      medium: { variant: 'secondary', className: '' },
      low: { variant: 'outline', className: '' },
    };
    const labels: Record<Importance, string> = {
      high: '重要',
      medium: '中',
      low: '低',
    };
    const config = variants[importance];
    return <Badge {...config}>{labels[importance]}</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* 講義回セレクター */}
      <Card>
        <CardHeader>
          <CardTitle>{selectedSession || '講義回を選択'}</CardTitle>
          <CardDescription>分析したい講義回を選択してください</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="flex-1 max-w-xs">
              <label className="text-sm mb-2 block">講義回</label>
              <Select value={selectedSession} onValueChange={setSelectedSession}>
                <SelectTrigger>
                  <SelectValue placeholder="講義回を選択" />
                </SelectTrigger>
                <SelectContent>
                  {sessions.map((session) => (
                    <SelectItem key={session} value={session}>
                      {session}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 講義情報 */}
            {selectedSession && sessionInfoData[selectedSession] && (
              <div className="bg-blue-50 rounded-lg p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="text-xs text-gray-500">講義日</p>
                    <p className="font-medium">{sessionInfoData[selectedSession].lectureDate}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <User className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="text-xs text-gray-500">講師名</p>
                    <p className="font-medium">{sessionInfoData[selectedSession].instructorName}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <BookOpen className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <p className="text-xs text-gray-500">講義内容</p>
                    <p className="font-medium">{sessionInfoData[selectedSession].lectureContent}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 講義回が選択されていない場合のメッセージ */}
      {!selectedSession && (
        <Card>
          <CardContent className="py-12">
            <p className="text-center text-gray-500">
              講義回を選択すると、詳細な分析結果が表示されます
            </p>
          </CardContent>
        </Card>
      )}

      {/* NPSと評価内訳 + レーダーチャート（横並び） */}
      {selectedSession && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 当該回の評価詳細 */}
          <Card>
            <CardHeader>
              <CardTitle>NPSと評価内訳</CardTitle>
              <CardDescription>この講義回のNPSスコアと分類</CardDescription>
            </CardHeader>
            <CardContent>
              {(() => {
                const total = currentNPS.promoters + currentNPS.neutrals + currentNPS.detractors;
                const promotersPercent = total > 0 ? (currentNPS.promoters / total) * 100 : 0;
                const neutralsPercent = total > 0 ? (currentNPS.neutrals / total) * 100 : 0;
                const detractorsPercent = total > 0 ? (currentNPS.detractors / total) * 100 : 0;

                return (
                  <div className="space-y-6">
                    {/* NPSスコア */}
                    <div className={`${npsBgColor} rounded-lg p-6`}>
                      <div className="text-center">
                        <p className="text-sm text-gray-600 mb-2">NPSスコア</p>
                        <div className="flex items-center justify-center gap-2">
                          {currentNPS.score >= 0 ? (
                            <TrendingUp className={`h-6 w-6 ${npsColor}`} />
                          ) : (
                            <TrendingDown className={`h-6 w-6 ${npsColor}`} />
                          )}
                          <span className={`text-4xl ${npsColor}`}>
                            {currentNPS.score > 0 ? '+' : ''}{currentNPS.score.toFixed(1)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* NPS内訳 */}
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm">推奨者（9-10点）</span>
                        <span className="text-sm">{currentNPS.promoters}人（{promotersPercent.toFixed(1)}%）</span>
                      </div>
                      <Progress value={promotersPercent} className="h-2" />
                      <div className="flex justify-between items-center">
                        <span className="text-sm">中立者（7-8点）</span>
                        <span className="text-sm">{currentNPS.neutrals}人（{neutralsPercent.toFixed(1)}%）</span>
                      </div>
                      <Progress value={neutralsPercent} className="h-2" />
                      <div className="flex justify-between items-center">
                        <span className="text-sm">批判者（0-6点）</span>
                        <span className="text-sm">{currentNPS.detractors}人（{detractorsPercent.toFixed(1)}%）</span>
                      </div>
                      <Progress value={detractorsPercent} className="h-2" />
                    </div>
                  </div>
                );
              })()}
            </CardContent>
          </Card>

          {/* 当該回の平均点一覧（レーダーチャート） */}
          <Card>
            <CardHeader>
              <CardTitle>全項目の平均点（レーダーチャート）</CardTitle>
              <CardDescription>各評価項目の5点満点での平均スコア</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <RadarChart data={currentRadar}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="category" />
                  <PolarRadiusAxis angle={90} domain={[0, 5]} />
                  <Radar
                    name="平均点"
                    dataKey="score"
                    stroke="#3b82f6"
                    fill="#3b82f6"
                    fillOpacity={0.6}
                  />
                  <Legend />
                  <Tooltip />
                </RadarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 評価分布詳細（主要項目） */}
      {selectedSession && (
        <Card>
          <CardHeader>
            <CardTitle>評価分布詳細</CardTitle>
            <CardDescription>主要項目の段階評価分布（5点満点）</CardDescription>
          </CardHeader>
          <CardContent>
            <Accordion type="multiple" defaultValue={['overall']} className="w-full">
              {/* 総合満足度 */}
              <AccordionItem value="overall">
                <AccordionTrigger>総合満足度</AccordionTrigger>
                <AccordionContent>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <ResponsiveContainer width="100%" height={180}>
                      <BarChart data={currentDistribution.overall} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" />
                        <YAxis dataKey="rating" type="category" width={40} />
                        <Tooltip />
                        <Bar dataKey="count" fill="#3b82f6" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* 講義内容グループ */}
              <AccordionItem value="lecture-content">
                <AccordionTrigger>講義内容</AccordionTrigger>
                <AccordionContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-gray-50 rounded-lg p-3">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">学習量</h4>
                      <ResponsiveContainer width="100%" height={150}>
                        <BarChart data={currentDistribution.学習量} layout="vertical">
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis type="number" tick={{ fontSize: 10 }} />
                          <YAxis dataKey="rating" type="category" width={35} tick={{ fontSize: 11 }} />
                          <Tooltip />
                          <Bar dataKey="count" fill="#8b5cf6" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">理解度</h4>
                      <ResponsiveContainer width="100%" height={150}>
                        <BarChart data={currentDistribution.理解度} layout="vertical">
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis type="number" tick={{ fontSize: 10 }} />
                          <YAxis dataKey="rating" type="category" width={35} tick={{ fontSize: 11 }} />
                          <Tooltip />
                          <Bar dataKey="count" fill="#ec4899" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">運営アナウンス</h4>
                      <ResponsiveContainer width="100%" height={150}>
                        <BarChart data={currentDistribution.運営} layout="vertical">
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis type="number" tick={{ fontSize: 10 }} />
                          <YAxis dataKey="rating" type="category" width={35} tick={{ fontSize: 11 }} />
                          <Tooltip />
                          <Bar dataKey="count" fill="#10b981" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* 講師評価グループ */}
              <AccordionItem value="instructor">
                <AccordionTrigger>講師評価</AccordionTrigger>
                <AccordionContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-gray-50 rounded-lg p-3">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">総合満足度</h4>
                      <ResponsiveContainer width="100%" height={150}>
                        <BarChart data={currentDistribution.講師満足度} layout="vertical">
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis type="number" tick={{ fontSize: 10 }} />
                          <YAxis dataKey="rating" type="category" width={35} tick={{ fontSize: 11 }} />
                          <Tooltip />
                          <Bar dataKey="count" fill="#f59e0b" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">時間の使い方</h4>
                      <ResponsiveContainer width="100%" height={150}>
                        <BarChart data={currentDistribution.時間使い方} layout="vertical">
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis type="number" tick={{ fontSize: 10 }} />
                          <YAxis dataKey="rating" type="category" width={35} tick={{ fontSize: 11 }} />
                          <Tooltip />
                          <Bar dataKey="count" fill="#06b6d4" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">質問対応</h4>
                      <ResponsiveContainer width="100%" height={150}>
                        <BarChart data={currentDistribution.質問対応} layout="vertical">
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis type="number" tick={{ fontSize: 10 }} />
                          <YAxis dataKey="rating" type="category" width={35} tick={{ fontSize: 11 }} />
                          <Tooltip />
                          <Bar dataKey="count" fill="#6366f1" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">話し方</h4>
                      <ResponsiveContainer width="100%" height={150}>
                        <BarChart data={currentDistribution.話し方} layout="vertical">
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis type="number" tick={{ fontSize: 10 }} />
                          <YAxis dataKey="rating" type="category" width={35} tick={{ fontSize: 11 }} />
                          <Tooltip />
                          <Bar dataKey="count" fill="#f43f5e" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* 受講生の自己評価グループ */}
              <AccordionItem value="self-evaluation">
                <AccordionTrigger>受講生の自己評価</AccordionTrigger>
                <AccordionContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-gray-50 rounded-lg p-3">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">予習</h4>
                      <ResponsiveContainer width="100%" height={150}>
                        <BarChart data={currentDistribution.予習} layout="vertical">
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis type="number" tick={{ fontSize: 10 }} />
                          <YAxis dataKey="rating" type="category" width={35} tick={{ fontSize: 11 }} />
                          <Tooltip />
                          <Bar dataKey="count" fill="#84cc16" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">意欲</h4>
                      <ResponsiveContainer width="100%" height={150}>
                        <BarChart data={currentDistribution.意欲} layout="vertical">
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis type="number" tick={{ fontSize: 10 }} />
                          <YAxis dataKey="rating" type="category" width={35} tick={{ fontSize: 11 }} />
                          <Tooltip />
                          <Bar dataKey="count" fill="#a855f7" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">今後への活用</h4>
                      <ResponsiveContainer width="100%" height={150}>
                        <BarChart data={currentDistribution.今後活用} layout="vertical">
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis type="number" tick={{ fontSize: 10 }} />
                          <YAxis dataKey="rating" type="category" width={35} tick={{ fontSize: 11 }} />
                          <Tooltip />
                          <Bar dataKey="count" fill="#0ea5e9" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </CardContent>
        </Card>
      )}

      {/* 重要コメント */}
      {selectedSession && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-orange-600" />
              <CardTitle>重要コメント</CardTitle>
            </div>
            <CardDescription>優先的に確認すべきコメント</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {currentImportant.length > 0 ? (
                currentImportant.map((comment) => (
                  <Alert key={comment.id}>
                    <div className="flex items-start gap-3">
                      {getSentimentIcon(comment.sentiment)}
                      <div className="flex-1">
                        <AlertTitle className="flex items-center gap-2 mb-2">
                          {getSentimentBadge(comment.sentiment)}
                          <Badge variant="outline">{comment.category}</Badge>
                        </AlertTitle>
                        <AlertDescription>{comment.text}</AlertDescription>
                      </div>
                    </div>
                  </Alert>
                ))
              ) : (
                <p className="text-sm text-gray-500 text-center py-4">
                この回には重要度の高いコメントがありません
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* コメント一覧 */}
      {selectedSession && (
        <Card>
          <CardHeader>
            <CardTitle>コメント一覧</CardTitle>
            <CardDescription>フィルタリングして表示</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4 mb-4">
              <div>
                <label className="text-sm mb-2 block">感情分析</label>
                <Select value={sentimentFilter} onValueChange={setSentimentFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">すべて</SelectItem>
                    <SelectItem value="positive">ポジティブ</SelectItem>
                    <SelectItem value="neutral">ニュートラル</SelectItem>
                    <SelectItem value="negative">ネガティブ</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm mb-2 block">カテゴリ</label>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">すべて</SelectItem>
                    <SelectItem value="講義内容">講義内容</SelectItem>
                    <SelectItem value="講義資料">講義資料</SelectItem>
                    <SelectItem value="運営">運営</SelectItem>
                    <SelectItem value="その他">その他</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[100px]">感情</TableHead>
                    <TableHead className="w-[120px]">カテゴリ</TableHead>
                    <TableHead>コメント</TableHead>
                    <TableHead className="w-[100px]">重要度</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredComments.map((comment) => (
                    <TableRow key={comment.id}>
                      <TableCell>{getSentimentBadge(comment.sentiment)}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{comment.category}</Badge>
                      </TableCell>
                      <TableCell>{comment.text}</TableCell>
                      <TableCell>{getImportanceBadge(comment.importance)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}