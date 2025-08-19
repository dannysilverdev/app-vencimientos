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
      next_due_date,
      status,
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
    usage_daily_average,
    next_due_date
  } = await req.json()

  if (!entity_id || !type_id || !last_done) {
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

  // Archivar vencimientos anteriores activos del mismo tipo y entidad
  const { error: archiveError } = await supabaseAdmin
    .from('deadlines')
    .update({ status: 'archived' })
    .eq('entity_id', entity_id)
    .eq('type_id', type_id)
    .eq('status', 'active')

  if (archiveError) {
    return NextResponse.json({ error: 'Error al archivar vencimientos anteriores.' }, { status: 500 })
  }

  const insertPayload = {
    entity_id,
    type_id,
    last_done,
    frequency: measureBy === 'usage' ? frequency : null,
    frequency_unit: measureBy === 'usage' ? frequency_unit : null,
    usage_daily_average: measureBy === 'usage' ? usage_daily_average : null,
    next_due_date: measureBy === 'date' ? next_due_date : null,
    status: 'active'
  }

  const { data, error } = await supabaseAdmin
    .from('deadlines')
    .insert([insertPayload])
    .select()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data[0])
}

export async function PUT(req: NextRequest) {
  const {
    id,
    last_done,
    frequency,
    frequency_unit,
    usage_daily_average,
    next_due_date
  } = await req.json()

  if (!id || !last_done) {
    return NextResponse.json({ error: 'Faltan campos requeridos.' }, { status: 400 })
  }

  const { data: current, error: loadError } = await supabaseAdmin
    .from('deadlines')
    .select('type_id')
    .eq('id', id)
    .single()

  if (loadError) {
    return NextResponse.json({ error: loadError.message }, { status: 500 })
  }

  const { data: typeData, error: typeError } = await supabaseAdmin
    .from('deadline_types')
    .select('measure_by')
    .eq('id', current.type_id)
    .single()

  if (typeError) {
    return NextResponse.json({ error: typeError.message }, { status: 500 })
  }

  const measureBy = typeData?.measure_by

  const updatePayload = {
    last_done,
    frequency: measureBy === 'usage' ? frequency : null,
    frequency_unit: measureBy === 'usage' ? frequency_unit : null,
    usage_daily_average: measureBy === 'usage' ? usage_daily_average : null,
    next_due_date: measureBy === 'date' ? next_due_date : null
  }

  const { data, error } = await supabaseAdmin
    .from('deadlines')
    .update(updatePayload)
    .eq('id', id)
    .select()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data[0])
}

export async function DELETE(req: NextRequest) {
  try {
    const { id } = await req.json()

    if (!id) {
      return NextResponse.json({ error: 'ID no proporcionado.' }, { status: 400 })
    }

    const { error } = await supabaseAdmin
      .from('deadlines')
      .delete()
      .eq('id', id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Error inesperado.' }, { status: 500 })
  }
}
