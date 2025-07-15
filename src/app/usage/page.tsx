import { supabaseAdmin } from '@/lib/supabaseAdmin'
import UsageLogForm from '@/components/UsageLogForm'

export default async function UsoPage() {
  const { data: entities } = await supabaseAdmin
    .from('entities')
    .select('id, name')
    .order('name', { ascending: true })

  return <UsageLogForm entities={entities ?? []} />
}
