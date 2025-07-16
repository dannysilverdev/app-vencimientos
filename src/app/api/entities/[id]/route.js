import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { NextResponse } from 'next/server'

export async function GET(_req, context) {
  const params = await context.params
  const id = params.id

  const { data, error } = await supabaseAdmin
    .from('entities')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !data) {
    return NextResponse.json(
      { error: error?.message || 'Entidad no encontrada' },
      { status: 404 }
    )
  }

  return NextResponse.json(data)
}

export async function PUT(req, context) {
  const params = await context.params
  const id = params.id
  const body = await req.json()

  const { error } = await supabaseAdmin
    .from('entities')
    .update(body)
    .eq('id', id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}

export async function DELETE(_req, context) {
  const params = await context.params
  const id = params.id

  const { error } = await supabaseAdmin
    .from('entities')
    .delete()
    .eq('id', id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
