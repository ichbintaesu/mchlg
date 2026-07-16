export const SERVICE_NAME = 'machilog'

export const H3_RESOLUTION = 10
export const WRITE_NEIGHBOR_TOLERANCE_K = 1
export const MAX_GPS_ACCURACY_METERS = 200

export const MAX_POST_LENGTH = 80
export const POSTS_PAGE_SIZE = 30

export const WRITE_LIMIT_PER_DEVICE_MS = 60 * 60 * 1000
export const WRITE_LIMIT_PER_IP = { windowMs: 10 * 60 * 1000, max: 3 }
export const REPORT_LIMIT_PER_DEVICE = { windowMs: 10 * 60 * 1000, max: 3 }

export const AUTO_HIDE_REPORT_COUNT = 2
export const IP_RETENTION_DAYS = 90

export const DEVICE_COOKIE = 'ml_did'
export const LOCALE_COOKIE = 'ml_locale'
export const TOWN_COOKIE = 'ml_town'
export const TOWN_COOKIE_MAX_AGE = 60 * 60
export const ADMIN_COOKIE = 'ml_admin'
export const ADMIN_SESSION_HOURS = 24

export const TIME_ZONE = 'Asia/Tokyo'

export const LOCALES = ['ja', 'en', 'ko', 'zh-Hans', 'zh-Hant'] as const
export type Locale = (typeof LOCALES)[number]
export const DEFAULT_LOCALE: Locale = 'ja'
