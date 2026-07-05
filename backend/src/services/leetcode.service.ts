import axios from 'axios'
import { logger } from '@/middleware/errorHandler'

const LEETCODE_GRAPHQL = 'https://leetcode.com/graphql'

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
    logger.error(`Failed to fetch LeetCode stats for ${username}`, err)
    throw err
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
    logger.error(`Failed to fetch contest history for ${username}`, err)
    return []
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
