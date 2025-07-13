import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { NextResponse } from 'next/server'

export async function PUT(req, context) {
  const { id } = context.params
  const { name } = await req.json()

  const { error } = await supabaseAdmin
    .from('entity_types')
    .update({ name })
    .eq('id', id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}

export async function DELETE(_, context) {
  const { id } = context.params

  const { error } = await supabaseAdmin
    .from('entity_types')
    .delete()
    .eq('id', id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
