import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const entity_id = req.nextUrl.searchParams.get("entity_id")

  if (!entity_id) {
    return NextResponse.json({ error: "Falta entity_id" }, { status: 400 })
  }

  const { data, error } = await supabaseAdmin
    .from('entity_field_values')
    .select('field_id, value, entity_fields(name, field_type)')
    .eq('entity_id', entity_id)

  if (error) {
    console.error('🛑 Error en GET /bulk:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data ?? [])
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { entity_id, values } = body

    if (!entity_id || !Array.isArray(values)) {
      console.error('⚠️ Datos inválidos recibidos:', body)
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
        onConflict: 'entity_id,field_id'
      })

    if (error) {
      console.error('🛑 Error de Supabase en upsert:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('🛑 Error inesperado en el endpoint /bulk:', err)
    return NextResponse.json({ error: err.message || 'Error inesperado' }, { status: 500 })
  }
}
