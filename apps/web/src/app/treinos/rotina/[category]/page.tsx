import { redirect, notFound } from 'next/navigation'
import { COMPLEMENTARY_CATEGORIES, type ComplementaryCategory } from '@helux/types'
import { getServerSession } from '@/lib/server-session'
import { RoutineExecutionClient } from '@/components/routines/RoutineExecutionClient'

export default async function RoutineExecutionPage({
  params,
}: {
  params: { category: string }
}) {
  const session = await getServerSession()
  if (!session) redirect('/login')

  const category = params.category as ComplementaryCategory
  if (!COMPLEMENTARY_CATEGORIES.includes(category)) {
    notFound()
  }

  return <RoutineExecutionClient category={category} />
}
