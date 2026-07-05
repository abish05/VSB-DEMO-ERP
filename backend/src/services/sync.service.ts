import cron from 'node-cron'
import prisma from '@/config/prisma'
import { fetchUserStats, fetchContestHistory } from './leetcode.service'
import { logger } from '@/middleware/errorHandler'
import { SyncStatus } from '@prisma/client'

export async function syncUser(userId: string): Promise<void> {
  const profile = await prisma.leetCodeProfile.findUnique({
    where: { userId }
  })

  if (!profile) {
    throw new Error('No LeetCode profile linked')
  }

  try {
    const stats = await fetchUserStats(profile.username)
    const contests = await fetchContestHistory(profile.username)

    // Compute streak from calendar
    const calendar = stats.submissionCalendar
    const sortedDates = Object.keys(calendar)
      .map((ts) => new Date(parseInt(ts) * 1000).toISOString().split('T')[0])
      .sort()
      .reverse()

    let currentStreak = 0
    let longestStreak = 0
    let tempStreak = 0
    const now = new Date()
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const weekStart = new Date(todayStart)
    weekStart.setDate(todayStart.getDate() - 6)
    const monthStart = new Date(todayStart)
    monthStart.setDate(todayStart.getDate() - 29)
    let dailySolvedCount = 0
    let weeklySolvedCount = 0
    let monthlySolvedCount = 0
    let lastSubmissionDate: Date | null = null

    const today = new Date().toISOString().split('T')[0]
    for (let i = 0; i < sortedDates.length; i++) {
      const expected = new Date(today)
      expected.setDate(expected.getDate() - i)
      if (sortedDates[i] === expected.toISOString().split('T')[0]) {
        tempStreak++
        if (i === 0 || i === 1) currentStreak = tempStreak
        longestStreak = Math.max(longestStreak, tempStreak)
      } else {
        if (i > 1) break
        tempStreak = 0
      }
    }

    for (const [timestampStr, count] of Object.entries(calendar)) {
      const date = new Date(parseInt(timestampStr) * 1000)
      if (!lastSubmissionDate || date > lastSubmissionDate) {
        lastSubmissionDate = date
      }
      if (date >= todayStart) dailySolvedCount += count as number
      if (date >= weekStart) weeklySolvedCount += count as number
      if (date >= monthStart) monthlySolvedCount += count as number
    }

    // Determine latest contest rating
    let contestRating = profile.contestRating
    let bestContestRanking = profile.bestContestRanking
    if (contests.length > 0) {
      const latest = [...contests].sort((a, b) => {
        const ta = a.attended instanceof Date ? a.attended.getTime() : new Date(a.attended).getTime()
        const tb = b.attended instanceof Date ? b.attended.getTime() : new Date(b.attended).getTime()
        return tb - ta
      })[0]
      contestRating = latest.rating
      bestContestRanking = contests.reduce<number | null>((best, contest) => {
        if (!contest.ranking) return best
        return best === null ? contest.ranking : Math.min(best, contest.ranking)
      }, null)
    }

    // Update LeetCodeProfile
    await prisma.leetCodeProfile.update({
      where: { userId },
      data: {
        displayName: stats.displayName,
        avatar: stats.avatar,
        country: stats.country,
        reputation: stats.reputation,
        totalSolved: stats.totalSolved,
        easySolved: stats.easySolved,
        mediumSolved: stats.mediumSolved,
        hardSolved: stats.hardSolved,
        acceptanceRate: stats.acceptanceRate,
        globalRank: stats.ranking,
        bestContestRanking,
        totalContestsParticipated: contests.length,
        currentStreak,
        longestStreak,
        dailySolvedCount,
        weeklySolvedCount,
        monthlySolvedCount,
        totalActiveDays: Object.keys(calendar).length,
        lastSubmissionDate,
        recentSubmissions: stats.recentSubmissions as any,
        submissionCalendar: stats.submissionCalendar as any,
        contestRating,
        syncStatus: SyncStatus.SUCCESS,
        lastSyncedAt: new Date(),
      }
    })

    // Upsert DailyActivity
    for (const [timestampStr, count] of Object.entries(calendar)) {
      const ts = parseInt(timestampStr) * 1000
      const date = new Date(ts)
      const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate())

      await prisma.dailyActivity.upsert({
        where: {
          userId_date: {
            userId,
            date: dateOnly
          }
        },
        create: {
          userId,
          date: dateOnly,
          solved: count as number,
          easy: 0,
          medium: 0,
          hard: 0
        },
        update: {
          solved: count as number
        }
      })
    }

    // Upsert ContestHistory
    for (const c of contests) {
      await prisma.contestHistory.upsert({
        where: {
          userId_contestSlug: {
            userId,
            contestSlug: c.contestSlug,
          }
        },
        create: {
          userId,
          contestTitle: c.contestTitle,
          contestSlug: c.contestSlug,
          rating: c.rating,
          ranking: c.ranking,
          problemsSolved: c.problemsSolved,
          totalProblems: c.totalProblems,
          attended: c.attended instanceof Date ? c.attended : new Date(c.attended),
        },
        update: {
          rating: c.rating,
          ranking: c.ranking,
          problemsSolved: c.problemsSolved,
        }
      })
    }

    // Add Sync Log success
    await prisma.syncLog.create({
      data: {
        userId,
        status: SyncStatus.SUCCESS,
        message: `Synced ${stats.totalSolved} problems`,
      }
    })

    logger.info(`Synced LeetCode data for user ${userId}: ${stats.totalSolved} problems`)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    await prisma.leetCodeProfile.update({
      where: { userId },
      data: { syncStatus: SyncStatus.ERROR },
    }).catch(() => {})
    await prisma.syncLog.create({
      data: {
        userId,
        status: SyncStatus.ERROR,
        message,
      }
    })
    logger.error(`Sync failed for user ${userId}`, err)
    throw err
  }
}

export async function syncAllUsers(): Promise<void> {
  logger.info('Starting scheduled sync for all users...')
  const profiles = await prisma.leetCodeProfile.findMany()

  let success = 0
  let errors = 0

  for (const profile of profiles) {
    try {
      await syncUser(profile.userId)
      success++
      await new Promise((resolve) => setTimeout(resolve, 2000))
    } catch (err) {
      errors++
    }
  }

  logger.info(`Scheduled sync complete: ${success} success, ${errors} errors`)
}

export function startScheduledSync() {
  cron.schedule('0 2 * * *', async () => {
    await syncAllUsers()
  })
  logger.info('Scheduled LeetCode sync cron job started (daily at 2:00 AM)')
}
