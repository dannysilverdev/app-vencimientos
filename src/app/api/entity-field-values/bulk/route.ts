import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { entity_id, values } = body

  if (!entity_id || !Array.isArray(values)) {
    return NextResponse.json({ error: 'Parámetros inválidos' }, { status: 400 })
  }

  const upsertData = values.map((v: { field_id: string; value: string }) => ({
    entity_id,
    field_id: v.field_id,
    value: v.value
  }))

  const { error } = await supabaseAdmin
    .from('entity_field_values')
    .upsert(upsertData, {
      onConflict: 'entity_id,field_id' // 👈 CORRECTO: string simple, no arreglo
    })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
