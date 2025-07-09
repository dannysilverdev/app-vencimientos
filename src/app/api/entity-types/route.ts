// src/app/api/entity-types/route.ts
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  const { data, error } = await supabaseAdmin
    .from('entity_types')
    .select('id, name')

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const { name } = await req.json()

  if (!name) {
    return NextResponse.json({ error: 'El campo "name" es requerido.' }, { status: 400 })
  }

  const { data, error } = await supabaseAdmin
    .from('entity_types')
    .insert([{ name }])
    .select()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data[0])
}
