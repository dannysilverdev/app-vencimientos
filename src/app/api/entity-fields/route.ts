import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const entity_type_id = searchParams.get('entity_type_id')

  const query = supabaseAdmin
    .from('entity_fields')
    .select('id, name, field_type, is_required, show_in_card, entity_type_id')

  if (entity_type_id) {
    query.eq('entity_type_id', entity_type_id)
  }

  const { data, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const {
    entity_type_id,
    name,
    field_type,
    is_required = false,
    show_in_card = false
  } = await req.json()

  if (!entity_type_id || !name || !field_type) {
    return NextResponse.json({ error: 'Faltan campos requeridos.' }, { status: 400 })
  }

  const validTypes = ['text', 'number', 'date']
  if (!validTypes.includes(field_type)) {
    return NextResponse.json({ error: 'Tipo de campo inválido.' }, { status: 400 })
  }

  const { data, error } = await supabaseAdmin
    .from('entity_fields')
    .insert([
      { entity_type_id, name, field_type, is_required, show_in_card }
    ])
    .select()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data[0])
}
