import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { leetcodeService } from '@/services/leetcode.service'
import { useAuthStore } from '@/store/authStore'
import { useToast } from '@/hooks/use-toast'

export function useLeetCode(userId?: string) {
  const { user } = useAuthStore()
  const targetUserId = userId || user?.id
  const qc = useQueryClient()
  const { toast } = useToast()

  const profileQuery = useQuery({
    queryKey: ['leetcode-profile', targetUserId],
    queryFn: () => leetcodeService.getProfile(targetUserId!),
    enabled: !!targetUserId,
  })

  const activityQuery = useQuery({
    queryKey: ['leetcode-activity', targetUserId],
    queryFn: () => leetcodeService.getDailyActivity(targetUserId!),
    enabled: !!targetUserId,
  })

  const contestsQuery = useQuery({
    queryKey: ['leetcode-contests', targetUserId],
    queryFn: () => leetcodeService.getContestHistory(targetUserId!),
    enabled: !!targetUserId,
  })

  const syncMutation = useMutation({
    mutationFn: () => leetcodeService.syncNow(targetUserId!),
    onSuccess: () => {
      toast({ title: '✅ Sync Complete', description: 'LeetCode data updated successfully' })
      qc.invalidateQueries({ queryKey: ['leetcode-profile', targetUserId] })
      qc.invalidateQueries({ queryKey: ['leetcode-activity', targetUserId] })
      qc.invalidateQueries({ queryKey: ['leetcode-contests', targetUserId] })
    },
    onError: () => {
      toast({ title: '❌ Sync Failed', description: 'Could not sync LeetCode data', variant: 'destructive' })
    },
  })

  const linkMutation = useMutation({
    mutationFn: (username: string) => leetcodeService.linkUsername(username),
    onSuccess: () => {
      toast({ title: '🔗 Linked!', description: 'LeetCode account linked successfully' })
      qc.invalidateQueries({ queryKey: ['leetcode-profile'] })
    },
    onError: () => {
      toast({ title: '❌ Link Failed', description: 'Username not found on LeetCode', variant: 'destructive' })
    },
  })

  return {
    profile: profileQuery.data,
    activity: activityQuery.data,
    contests: contestsQuery.data,
    isLoading: profileQuery.isLoading,
    isActivityLoading: activityQuery.isLoading,
    sync: syncMutation.mutate,
    isSyncing: syncMutation.isPending,
    link: linkMutation.mutate,
    isLinking: linkMutation.isPending,
  }
}
