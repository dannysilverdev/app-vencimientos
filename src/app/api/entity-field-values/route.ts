// src/app/api/entity-field-values/route.ts
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const entity_id = searchParams.get('entity_id')

  const query = supabaseAdmin
    .from('entity_field_values')
    .select(`
      id,
      value,
      field_id,
      entity_id,
      entity_fields (
        name,
        field_type,
        is_required,
        show_in_card
      )
    `)

  if (entity_id) {
    query.eq('entity_id', entity_id)
  }

  const { data, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const { entity_id, field_id, value } = await req.json()

  if (!entity_id || !field_id || value === undefined) {
    return NextResponse.json({ error: 'Faltan campos requeridos.' }, { status: 400 })
  }

  const { data, error } = await supabaseAdmin
    .from('entity_field_values')
    .insert([{ entity_id, field_id, value: value.toString() }])
    .select()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data[0])
}
