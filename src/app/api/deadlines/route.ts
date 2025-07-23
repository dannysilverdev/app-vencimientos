// src/app/api/deadlines/route.ts
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const entity_id = searchParams.get('entity_id')

  const query = supabaseAdmin
    .from('deadlines')
    .select(`
      id,
      entity_id,
      type_id,
      last_done,
      frequency,
      frequency_unit,
      usage_daily_average,
      deadline_types (
        name,
        measure_by,
        unit
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
  const {
    entity_id,
    type_id,
    last_done,
    frequency,
    frequency_unit,
    usage_daily_average
  } = await req.json()

  if (!entity_id || !type_id || !last_done || !frequency) {
    return NextResponse.json({ error: 'Faltan campos requeridos.' }, { status: 400 })
  }

  const { data: deadlineType, error: typeError } = await supabaseAdmin
    .from('deadline_types')
    .select('measure_by')
    .eq('id', type_id)
    .single()

  if (typeError) {
    return NextResponse.json({ error: typeError.message }, { status: 500 })
  }

  const measureBy = deadlineType?.measure_by

  if (measureBy === 'usage') {
    if (!frequency_unit || usage_daily_average == null) {
      return NextResponse.json({ error: 'Faltan campos de uso para vencimientos por uso.' }, { status: 400 })
    }
  }

  const { data, error } = await supabaseAdmin
    .from('deadlines')
    .insert([{
      entity_id,
      type_id,
      last_done,
      frequency,
      frequency_unit: measureBy === 'usage' ? frequency_unit : null,
      usage_daily_average: measureBy === 'usage' ? usage_daily_average : null
    }])
    .select()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data[0])
}