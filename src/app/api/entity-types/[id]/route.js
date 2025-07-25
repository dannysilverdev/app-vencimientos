import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { NextResponse } from 'next/server'

export async function PUT(req, context) {
  const { id } = context.params
  const { name, fields } = await req.json()

  const updates = []

  // Actualizar el nombre del tipo de entidad
  if (name) {
    const { error: nameError } = await supabaseAdmin
      .from('entity_types')
      .update({ name })
      .eq('id', id)

    if (nameError) {
      return NextResponse.json({ error: nameError.message }, { status: 500 })
    }
  }

  // Actualizar campos personalizados asociados
  if (Array.isArray(fields)) {
    for (const field of fields) {
      const { id: fieldId, show_in_card } = field

      const { error: fieldError } = await supabaseAdmin
        .from('entity_fields')
        .update({ show_in_card })
        .eq('id', fieldId)
        .eq('entity_type_id', id)

      if (fieldError) {
        return NextResponse.json({ error: fieldError.message }, { status: 500 })
      }
    }
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
