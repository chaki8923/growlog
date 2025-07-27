// 気分評価のレベルと色の定数
export const MOOD_COLORS = ['', '#ff6b6b', '#ff9f43', '#feca57', '#48dbfb', '#0be881'];

export const MOOD_TEXTS = ['', 'CRITICAL', 'ERROR', 'WARNING', 'SUCCESS', 'OPTIMAL'];

/**
 * 気分評価レベルに対応する色を取得
 * @param mood 気分評価レベル（1-5）
 * @returns 対応する色のHEXコード
 */
export const getMoodColor = (mood: number): string => {
  return MOOD_COLORS[Math.round(mood)] || MOOD_COLORS[0];
};

/**
 * 気分評価レベルに対応するテキストを取得
 * @param mood 気分評価レベル（1-5）
 * @returns 対応するテキストラベル
 */
export const getMoodText = (mood: number): string => {
  return MOOD_TEXTS[mood] || '';
}; 