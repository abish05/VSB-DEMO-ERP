import axios from 'axios'
import { logger } from '@/middleware/errorHandler'

const LEETCODE_GRAPHQL = 'https://leetcode.com/graphql'
const LEETCODE_FALLBACK_PROFILE = 'https://alfa-leetcode-api.onrender.com'
const LEETCODE_FALLBACK_STATS = 'https://leetcode-api-faisalshohag.vercel.app'

const client = axios.create({
  baseURL: LEETCODE_GRAPHQL,
  headers: {
    'Content-Type': 'application/json',
    Referer: 'https://leetcode.com',
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
  },
  timeout: 15000,
})

export interface LeetCodeStats {
  username: string
  displayName: string | null
  avatar: string | null
  country: string | null
  reputation: number | null
  totalSolved: number
  easySolved: number
  mediumSolved: number
  hardSolved: number
  acceptanceRate: number
  ranking: number | null
  submissionCalendar: Record<string, number>
  recentSubmissions: Array<{
    title: string
    titleSlug: string
    timestamp: string
    statusDisplay: string
    lang: string
  }>
}

type FallbackUserProfile = {
  username?: string
  name?: string | null
  avatar?: string | null
  country?: string | null
  reputation?: number | null
  ranking?: number | null
}

type FallbackStats = {
  errors?: unknown[]
  totalSolved?: number
  easySolved?: number
  mediumSolved?: number
  hardSolved?: number
  ranking?: number | null
  reputation?: number | null
  submissionCalendar?: Record<string, number>
  recentSubmissions?: Array<{
    title: string
    titleSlug: string
    timestamp: string
    statusDisplay: string
    lang: string
  }>
  matchedUserStats?: {
    acSubmissionNum?: Array<{ difficulty: string; count: number; submissions?: number }>
    totalSubmissionNum?: Array<{ difficulty: string; count: number; submissions?: number }>
  }
  totalSubmissions?: Array<{ difficulty: string; count: number; submissions?: number }>
}

function toSlug(title: string) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

function isNotFoundFallback(data: FallbackStats) {
  return Array.isArray(data.errors) || typeof data.totalSolved !== 'number'
}

async function fetchFallbackUserStats(username: string): Promise<LeetCodeStats> {
  const encoded = encodeURIComponent(username)
  const [profileResult, statsResult] = await Promise.allSettled([
    axios.get<FallbackUserProfile>(`${LEETCODE_FALLBACK_PROFILE}/${encoded}`, { timeout: 15000 }),
    axios.get<FallbackStats>(`${LEETCODE_FALLBACK_STATS}/${encoded}`, { timeout: 15000 }),
  ])

  if (statsResult.status !== 'fulfilled') {
    throw statsResult.reason
  }

  const stats = statsResult.value.data
  if (isNotFoundFallback(stats)) {
    throw new Error(`LeetCode user not found: ${username}`)
  }

  const profile = profileResult.status === 'fulfilled' ? profileResult.value.data : null
  const totalSubmissions = stats.totalSubmissions?.find((s) => s.difficulty === 'All')?.submissions || 0
  const totalAccepted = stats.matchedUserStats?.acSubmissionNum?.find((s) => s.difficulty === 'All')?.count || stats.totalSolved || 0

  return {
    username: profile?.username || username,
    displayName: profile?.name || profile?.username || username,
    avatar: profile?.avatar || null,
    country: profile?.country || null,
    reputation: profile?.reputation ?? stats.reputation ?? null,
    totalSolved: stats.totalSolved || 0,
    easySolved: stats.easySolved || 0,
    mediumSolved: stats.mediumSolved || 0,
    hardSolved: stats.hardSolved || 0,
    acceptanceRate: totalSubmissions > 0 ? Number(((totalAccepted / totalSubmissions) * 100).toFixed(2)) : 0,
    ranking: stats.ranking ?? profile?.ranking ?? null,
    submissionCalendar: stats.submissionCalendar || {},
    recentSubmissions: stats.recentSubmissions || [],
  }
}

export interface ContestInfo {
  contestTitle: string
  contestSlug: string
  rating: number
  ranking: number
  problemsSolved: number
  totalProblems: number
  attended: Date
}

export async function fetchUserStats(username: string): Promise<LeetCodeStats> {
  const query = `
    query getUserProfile($username: String!) {
      matchedUser(username: $username) {
        username
        profile {
          realName
          userAvatar
          countryName
          ranking
          reputation
        }
        submitStats: submitStatsGlobal {
          acSubmissionNum { difficulty count }
          totalSubmissionNum { difficulty count submissions }
        }
        submissionCalendar
      }
      recentSubmissionList(username: $username, limit: 20) {
        title
        titleSlug
        timestamp
        statusDisplay
        lang
      }
    }
  `
  try {
    const { data } = await client.post('', {
      query,
      variables: { username },
    })

    const user = data?.data?.matchedUser
    if (!user) throw new Error(`LeetCode user not found: ${username}`)

    const acStats: { difficulty: string; count: number }[] = user.submitStats?.acSubmissionNum || []
    const totalStats: { difficulty: string; count: number; submissions: number }[] = user.submitStats?.totalSubmissionNum || []
    const get = (d: string) => acStats.find((s) => s.difficulty === d)?.count || 0

    const easy = get('Easy')
    const medium = get('Medium')
    const hard = get('Hard')
    const total = easy + medium + hard
    const totalAccepted = acStats.find((s) => s.difficulty === 'All')?.count || total
    const totalSubmissions = totalStats.find((s) => s.difficulty === 'All')?.submissions || totalStats.find((s) => s.difficulty === 'All')?.count || 0

    const calendar = JSON.parse(user.submissionCalendar || '{}') as Record<string, number>

    return {
      username: user.username || username,
      displayName: user.profile?.realName || null,
      avatar: user.profile?.userAvatar || null,
      country: user.profile?.countryName || null,
      reputation: user.profile?.reputation ?? null,
      totalSolved: total,
      easySolved: easy,
      mediumSolved: medium,
      hardSolved: hard,
      acceptanceRate: totalSubmissions > 0 ? Number(((totalAccepted / totalSubmissions) * 100).toFixed(2)) : 0,
      ranking: user.profile?.ranking || null,
      submissionCalendar: calendar,
      recentSubmissions: data?.data?.recentSubmissionList || [],
    }
  } catch (err) {
    logger.warn(`LeetCode GraphQL stats failed for ${username}; trying fallback provider`)
    try {
      return await fetchFallbackUserStats(username)
    } catch (fallbackErr) {
      logger.error(`Failed to fetch LeetCode stats for ${username}`, fallbackErr)
      throw fallbackErr
    }
  }
}

export async function fetchContestHistory(username: string): Promise<ContestInfo[]> {
  const query = `
    query getUserContestHistory($username: String!) {
      userContestRankingHistory(username: $username) {
        attended
        rating
        ranking
        problemsSolved
        totalProblems
        contest { title slug startTime }
      }
    }
  `
  try {
    const { data } = await client.post('', { query, variables: { username } })
    const history = data?.data?.userContestRankingHistory || []

    return history
      .filter((h: unknown) => (h as { attended: boolean }).attended)
      .map((h: unknown) => {
        const item = h as {
          contest: { title: string; slug: string; startTime?: number }
          rating: number
          ranking: number
          problemsSolved: number
          totalProblems: number
          attended: boolean
        }
        return {
          contestTitle: item.contest.title,
          contestSlug: item.contest.slug,
          rating: item.rating,
          ranking: item.ranking,
          problemsSolved: item.problemsSolved,
          totalProblems: item.totalProblems,
          attended: item.contest.startTime ? new Date(item.contest.startTime * 1000) : new Date(),
        }
      })
  } catch (err) {
    logger.warn(`LeetCode GraphQL contests failed for ${username}; trying fallback provider`)
    try {
      const { data } = await axios.get<{
        userContestRankingHistory?: Array<{
          attended: boolean
          rating: number
          ranking: number
          problemsSolved: number
          totalProblems: number
          contest?: { title?: string; slug?: string; startTime?: number }
        }>
      }>(`${LEETCODE_FALLBACK_PROFILE}/userContestRankingInfo/${encodeURIComponent(username)}`, { timeout: 15000 })

      return (data.userContestRankingHistory || [])
        .filter((item) => item.attended && item.contest?.title)
        .map((item) => ({
          contestTitle: item.contest?.title || 'LeetCode Contest',
          contestSlug: item.contest?.slug || toSlug(item.contest?.title || 'leetcode-contest'),
          rating: item.rating,
          ranking: item.ranking,
          problemsSolved: item.problemsSolved,
          totalProblems: item.totalProblems,
          attended: item.contest?.startTime ? new Date(item.contest.startTime * 1000) : new Date(),
        }))
    } catch (fallbackErr) {
      logger.error(`Failed to fetch contest history for ${username}`, fallbackErr)
      return []
    }
  }
}

export async function checkUsernameExists(username: string): Promise<boolean> {
  try {
    const stats = await fetchUserStats(username)
    return !!stats
  } catch {
    return false
  }
}
