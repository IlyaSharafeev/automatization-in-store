import { Router, Request, Response } from 'express'
import prisma from '../lib/prisma'
import { requireAuth, AuthRequest } from '../middleware/auth'

const router = Router()

// GET /api/stats
router.get('/', requireAuth, async (req: Request, res: Response): Promise<void> => {
  const userId = (req as AuthRequest).userId!

  const sessions = await prisma.shoppingSession.findMany({
    where: { userId, clientId: { not: 'current' } },
    include: { items: true },
    orderBy: { date: 'desc' },
    take: 100,
  })

  if (sessions.length === 0) {
    res.json({
      totalSessions: 0,
      totalSpent: 0,
      avgSessionCost: 0,
      maxSession: 0,
      byStore: [],
      byMonth: [],
      topByCount: [],
      topByValue: [],
    })
    return
  }

  // ── Totals ─────────────────────────────────────────────────────
  const sessionTotals = sessions.map(s =>
    s.items.reduce((sum, i) => sum + i.price * i.quantity, 0)
  )
  const totalSpent = sessionTotals.reduce((a, b) => a + b, 0)
  const sessionsWithCost = sessionTotals.filter(t => t > 0)
  const avgSessionCost = sessionsWithCost.length
    ? sessionsWithCost.reduce((a, b) => a + b, 0) / sessionsWithCost.length
    : 0
  const maxSession = Math.max(...sessionTotals, 0)

  // ── By store ───────────────────────────────────────────────────
  // Fetch all products for this user to get storeId
  const products = await prisma.product.findMany({
    where: { userId },
    select: { clientId: true, storeId: true, name: true },
  })
  const productMap = new Map(products.map(p => [p.clientId, p]))

  const storeMap = new Map<string, { total: number; count: number }>()
  for (const s of sessions) {
    for (const item of s.items) {
      const product = productMap.get(item.productClientId)
      if (!product) continue
      const storeId = product.storeId
      const existing = storeMap.get(storeId) ?? { total: 0, count: 0 }
      existing.total += item.price * item.quantity
      existing.count += item.quantity
      storeMap.set(storeId, existing)
    }
  }
  const byStore = [...storeMap.entries()]
    .map(([storeId, data]) => ({ storeId, ...data }))
    .sort((a, b) => b.total - a.total)

  // ── By month (last 12) ─────────────────────────────────────────
  const now = new Date()
  const byMonth = Array.from({ length: 12 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (11 - i), 1)
    const year = d.getFullYear()
    const month = d.getMonth()
    const label = d.toLocaleString('uk-UA', { month: 'short', year: '2-digit' })
    const monthSessions = sessions.filter(s => {
      const sd = new Date(s.date)
      return sd.getFullYear() === year && sd.getMonth() === month
    })
    const total = monthSessions.reduce(
      (sum, s) => sum + s.items.reduce((ss, i) => ss + i.price * i.quantity, 0),
      0
    )
    return { label, total, count: monthSessions.length }
  })

  // ── Top by count (frequency) ───────────────────────────────────
  const countMap = new Map<string, number>()
  for (const s of sessions) {
    const seen = new Set<string>()
    for (const item of s.items) {
      if (!seen.has(item.productClientId)) {
        countMap.set(item.productClientId, (countMap.get(item.productClientId) ?? 0) + 1)
        seen.add(item.productClientId)
      }
    }
  }
  const topByCount = [...countMap.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([productClientId, times]) => ({
      productClientId,
      name: productMap.get(productClientId)?.name ?? productClientId,
      times,
    }))

  // ── Top by value ───────────────────────────────────────────────
  const valueMap = new Map<string, number>()
  for (const s of sessions) {
    for (const item of s.items) {
      valueMap.set(
        item.productClientId,
        (valueMap.get(item.productClientId) ?? 0) + item.price * item.quantity
      )
    }
  }
  const topByValue = [...valueMap.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([productClientId, total]) => ({
      productClientId,
      name: productMap.get(productClientId)?.name ?? productClientId,
      total,
    }))

  res.json({
    totalSessions: sessions.length,
    totalSpent,
    avgSessionCost,
    maxSession,
    byStore,
    byMonth,
    topByCount,
    topByValue,
  })
})

export default router
