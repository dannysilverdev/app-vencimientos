// src/app/api/usage-logs/route.ts
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const entity_id = searchParams.get('entity_id')

  const query = supabaseAdmin
    .from('usage_logs')
    .select('id, entity_id, date, value')
    .order('date', { ascending: false })

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
  const { entity_id, date, value } = await req.json()

  if (!entity_id || !date || value === undefined) {
    return NextResponse.json({ error: 'Faltan campos requeridos.' }, { status: 400 })
  }

  const { data, error } = await supabaseAdmin
    .from('usage_logs')
    .insert([{ entity_id, date, value }])
    .select()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data[0])
}
