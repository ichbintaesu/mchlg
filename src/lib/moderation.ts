export type ModerationVerdict = 'visible' | 'pending' | 'blocked'

interface ModerationResult {
  verdict: ModerationVerdict
  matched: string[]
}

const BLOCK_PATTERNS: { name: string; pattern: RegExp }[] = [
  { name: 'phone_number', pattern: /(?:\+81|0\d{1,4})[-\s]?\d{2,4}[-\s]?\d{3,4}/ },
  { name: 'email', pattern: /[\w.+-]+@[\w-]+\.[\w.]+/ },
  { name: 'url', pattern: /https?:\/\/|www\./i },
  { name: 'sns_handle', pattern: /@[a-zA-Z0-9_]{3,}/ },
]

const PENDING_PATTERNS: { name: string; pattern: RegExp }[] = [
  { name: 'jp_slur', pattern: /死ね|殺す|きもい|キモい|ぶす|ブス|くたばれ/ },
  { name: 'ko_slur', pattern: /씨발|병신|새끼|꺼져|죽어/ },
  { name: 'en_slur', pattern: /\b(fuck|shit|bitch|asshole)\b/i },
  { name: 'person_reference_jp', pattern: /店員|従業員|バイトの|あの(人|男|女|子)|レジの/ },
  { name: 'person_reference_ko', pattern: /직원|알바|점원|저\s?(남자|여자|사람)/ },
]

export function moderateContent(content: string): ModerationResult {
  const matched: string[] = []

  for (const { name, pattern } of BLOCK_PATTERNS) {
    if (pattern.test(content)) matched.push(name)
  }
  if (matched.length > 0) return { verdict: 'blocked', matched }

  for (const { name, pattern } of PENDING_PATTERNS) {
    if (pattern.test(content)) matched.push(name)
  }
  if (matched.length > 0) return { verdict: 'pending', matched }

  return { verdict: 'visible', matched }
}

export function detectLanguage(content: string): string {
  const hiraganaKatakana = (content.match(/[぀-ヿ]/g) ?? []).length
  const hangul = (content.match(/[가-힯]/g) ?? []).length
  const cjkIdeographs = (content.match(/[一-鿿]/g) ?? []).length
  const latin = (content.match(/[a-zA-Z]/g) ?? []).length

  const max = Math.max(hiraganaKatakana, hangul, cjkIdeographs, latin)
  if (max === 0) return 'unknown'
  if (max === hangul) return 'ko'
  if (max === hiraganaKatakana) return 'ja'
  if (max === cjkIdeographs) return hiraganaKatakana > 0 ? 'ja' : 'zh'
  return 'en'
}
