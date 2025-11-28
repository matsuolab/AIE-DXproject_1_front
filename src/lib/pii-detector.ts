import * as XLSX from 'xlsx';

// 検出対象の個人情報列名（完全一致）
const PRIVACY_COLUMN_NAMES = [
  'メールアドレス',
  'ロール',
  '姓',
  '名',
  '学校名',
  '学部',
  '会員企業',
  '企業名',
  '部署名',
];

export interface PrivacyColumnDetectionResult {
  hasPrivacyColumns: boolean;
  detectedColumns: {
    columnName: string;
    sheetName: string;
  }[];
}

/**
 * Excelファイルのヘッダー行から個人情報列を検出する
 */
export async function detectPrivacyColumns(file: File): Promise<PrivacyColumnDetectionResult> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'array' });

        const detectedColumns: PrivacyColumnDetectionResult['detectedColumns'] = [];

        // 全シートをチェック
        for (const sheetName of workbook.SheetNames) {
          const worksheet = workbook.Sheets[sheetName];

          // シートをJSONに変換（ヘッダー行を取得するため）
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as string[][];

          if (jsonData.length === 0) continue;

          // 1行目（ヘッダー行）を取得
          const headerRow = jsonData[0];

          if (!headerRow) continue;

          // 各列名をチェック
          for (const columnName of headerRow) {
            if (!columnName || typeof columnName !== 'string') continue;

            const trimmedName = columnName.trim();

            // 完全一致でチェック
            if (PRIVACY_COLUMN_NAMES.includes(trimmedName)) {
              // 重複を避ける
              const alreadyDetected = detectedColumns.some(
                col => col.columnName === trimmedName && col.sheetName === sheetName
              );

              if (!alreadyDetected) {
                detectedColumns.push({
                  columnName: trimmedName,
                  sheetName,
                });
              }
            }
          }
        }

        resolve({
          hasPrivacyColumns: detectedColumns.length > 0,
          detectedColumns,
        });
      } catch (error) {
        reject(new Error(`ファイルの解析に失敗しました: ${error instanceof Error ? error.message : '不明なエラー'}`));
      }
    };

    reader.onerror = () => {
      reject(new Error('ファイルの読み込みに失敗しました'));
    };

    reader.readAsArrayBuffer(file);
  });
}
