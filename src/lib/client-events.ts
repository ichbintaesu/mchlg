interface ClientEvent {
  type: 'geo_denied' | 'geo_error' | 'compose_opened'
  cellId?: string
  source?: string
  meta?: Record<string, unknown>
}

export function sendClientEvent(event: ClientEvent): void {
  const body = JSON.stringify(event)
  if (navigator.sendBeacon) {
    navigator.sendBeacon('/api/events', new Blob([body], { type: 'application/json' }))
  } else {
    fetch('/api/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
      keepalive: true,
    }).catch(() => {})
  }
}
