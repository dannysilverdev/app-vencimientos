import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { NextResponse } from 'next/server'

export async function GET(_, context) {
  const { id } = context.params

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
  const { id } = context.params
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

export async function DELETE(_, context) {
  const { id } = context.params

  const { error } = await supabaseAdmin
    .from('entities')
    .delete()
    .eq('id', id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
