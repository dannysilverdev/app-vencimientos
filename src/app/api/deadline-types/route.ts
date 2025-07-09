// src/app/api/deadline-types/route.ts
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  const { data, error } = await supabaseAdmin
    .from('deadline_types')
    .select('id, name, measure_by, unit')

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const { name, measure_by, unit } = await req.json()

  if (!name || !measure_by || !['date', 'usage'].includes(measure_by)) {
    return NextResponse.json({ error: 'Faltan o son inválidos los campos requeridos.' }, { status: 400 })
  }

  if (measure_by === 'usage' && unit && !['hours', 'kilometers'].includes(unit)) {
    return NextResponse.json({ error: 'Unidad de medida no válida para uso acumulado.' }, { status: 400 })
  }

  const { data, error } = await supabaseAdmin
    .from('deadline_types')
    .insert([{ name, measure_by, unit }])
    .select()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data[0])
}
