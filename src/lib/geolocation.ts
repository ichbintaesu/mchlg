function attempt(options: PositionOptions): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(resolve, reject, options)
  })
}

export async function getCurrentPositionRobust(): Promise<GeolocationPosition> {
  try {
    return await attempt({ enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 })
  } catch (error) {
    const err = error as GeolocationPositionError
    if (err.code === err.PERMISSION_DENIED) throw err
    return attempt({ enableHighAccuracy: false, timeout: 20000, maximumAge: 600000 })
  }
}

export function isPermissionDenied(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as GeolocationPositionError).code === 1
  )
}
