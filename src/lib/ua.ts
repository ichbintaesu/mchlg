export interface CoarseUa {
  os: string
  browser: string
  deviceType: string
}

export function parseUserAgent(ua: string | null): CoarseUa {
  if (!ua) return { os: 'unknown', browser: 'unknown', deviceType: 'unknown' }

  const os = /iPhone|iPad|iPod/.test(ua)
    ? 'ios'
    : /Android/.test(ua)
      ? 'android'
      : /Windows/.test(ua)
        ? 'windows'
        : /Mac OS X/.test(ua)
          ? 'macos'
          : 'other'

  const browser = /Line\//i.test(ua)
    ? 'line'
    : /Instagram/i.test(ua)
      ? 'instagram'
      : /FBAN|FBAV/i.test(ua)
        ? 'facebook'
        : /Edg\//.test(ua)
          ? 'edge'
          : /Chrome\//.test(ua)
            ? 'chrome'
            : /Safari\//.test(ua)
              ? 'safari'
              : /Firefox\//.test(ua)
                ? 'firefox'
                : 'other'

  const deviceType = /iPad/.test(ua)
    ? 'tablet'
    : /Mobile|iPhone|Android/.test(ua)
      ? 'mobile'
      : 'desktop'

  return { os, browser, deviceType }
}
