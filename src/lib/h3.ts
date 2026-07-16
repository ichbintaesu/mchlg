import { cellToLatLng, gridDisk, gridDistance, isValidCell, latLngToCell } from 'h3-js'
import { H3_RESOLUTION, WRITE_NEIGHBOR_TOLERANCE_K } from '@/config'

export function resolveCell(lat: number, lng: number): string {
  return latLngToCell(lat, lng, H3_RESOLUTION)
}

export function isValidCellId(cellId: string): boolean {
  return isValidCell(cellId)
}

export function cellCenter(cellId: string): { lat: number; lng: number } {
  const [lat, lng] = cellToLatLng(cellId)
  return { lat, lng }
}

export function directionalNeighbor(cellId: string, k: number, dir: 'west' | 'east'): string {
  const ring = gridDisk(cellId, k)
    .filter((id) => gridDistance(cellId, id) === k)
    .map((id) => ({ id, lng: cellToLatLng(id)[1] }))
    .sort((a, b) => a.lng - b.lng)
  return dir === 'west' ? ring[0].id : ring[ring.length - 1].id
}

export function isWithinWriteTolerance(targetCellId: string, lat: number, lng: number): boolean {
  const actualCell = resolveCell(lat, lng)
  return gridDisk(actualCell, WRITE_NEIGHBOR_TOLERANCE_K).includes(targetCellId)
}
