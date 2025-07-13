import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { NextResponse } from 'next/server'

export async function PUT(req, context) {
  const { id } = context.params
  const body = await req.json()

  const { name, field_type, is_required } = body

  const { error } = await supabaseAdmin
    .from('entity_fields')
    .update({
      name,
      field_type,
      is_required
    })
    .eq('id', id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}

export async function DELETE(_, context) {
  const { id } = context.params

  const { error } = await supabaseAdmin
    .from('entity_fields')
    .delete()
    .eq('id', id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
