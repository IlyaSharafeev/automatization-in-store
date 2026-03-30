export interface SharedItem {
  n: string  // name
  q: number  // qty
  u: string  // unit
  s: string  // store name
}

export interface SharedList {
  v: 1
  t?: string  // title (author name)
  items: SharedItem[]
}

export function encodeList(data: SharedList): string {
  try {
    return btoa(unescape(encodeURIComponent(JSON.stringify(data))))
  } catch {
    return ''
  }
}

export function decodeList(encoded: string): SharedList | null {
  try {
    const json = decodeURIComponent(escape(atob(encoded)))
    const parsed = JSON.parse(json)
    if (parsed?.v === 1 && Array.isArray(parsed.items)) return parsed as SharedList
    return null
  } catch {
    return null
  }
}

export function buildShareUrl(data: SharedList): string {
  const encoded = encodeList(data)
  return `${window.location.origin}/shared?d=${encoded}`
}
