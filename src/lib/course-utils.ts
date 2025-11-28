// src/lib/course-utils.ts
// 講座関連のユーティリティ関数

import type { CourseItem } from '../types/api';

/**
 * 講座の一意キーを生成する
 * @param course - 講座情報
 * @returns 講座の一意キー（例: "大規模言語モデル_2024_10月～12月"）
 */
export function getCourseKey(course: CourseItem): string {
  return `${course.name}_${course.academic_year}_${course.term}`;
}

/**
 * 年度を表示用文字列に変換
 * @param year - 年度（数値）
 * @returns 表示用文字列（例: "2024年度"）
 */
export function formatAcademicYear(year: number): string {
  return `${year}年度`;
}

/**
 * 表示用年度から数値に変換
 * @param yearStr - 表示用文字列（例: "2024年度"）
 * @returns 年度（数値）
 */
export function parseAcademicYear(yearStr: string): number {
  return parseInt(yearStr.replace('年度', ''), 10);
}
