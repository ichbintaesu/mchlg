interface GsiReverseGeocodeResponse {
  results?: {
    muniCd?: string
    lv01Nm?: string | null
  }
}

export async function reverseGeocodeTown(lat: number, lng: number): Promise<string | null> {
  try {
    const res = await fetch(
      `https://mreversegeocoder.gsi.go.jp/reverse-geocoder/LonLatToAddress?lat=${lat}&lon=${lng}`,
      { signal: AbortSignal.timeout(3000) },
    )
    if (!res.ok) return null
    const data: GsiReverseGeocodeResponse = await res.json()
    const town = data.results?.lv01Nm?.trim()
    return town ? town : null
  } catch {
    return null
  }
}
