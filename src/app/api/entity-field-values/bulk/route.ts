import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const entity_id = req.nextUrl.searchParams.get("entity_id")
  if (!entity_id) {
    return NextResponse.json({ error: "Falta entity_id" }, { status: 400 })
  }

  // Obtener el tipo de entidad
  const { data: entity, error: errorEntity } = await supabaseAdmin
    .from('entities')
    .select('type_id')
    .eq('id', entity_id)
    .single()

  if (errorEntity || !entity) {
    return NextResponse.json({ error: 'Entidad no encontrada' }, { status: 404 })
  }

  const type_id = entity.type_id

  // 1. Obtener todos los campos definidos para ese tipo
  const { data: allFields, error: errorFields } = await supabaseAdmin
    .from('entity_fields')
    .select('id, name, field_type, entity_type_id')
    .eq('entity_type_id', type_id)

  if (errorFields || !allFields) {
    console.error('❌ Error al obtener los campos:', errorFields)
    return NextResponse.json({ error: 'Error al obtener campos' }, { status: 500 })
  }

  // 2. Obtener los valores que ya tiene la entidad
  const { data: valuesData, error: errorValues } = await supabaseAdmin
    .from('entity_field_values')
    .select('field_id, value')
    .eq('entity_id', entity_id)

  if (errorValues) {
    console.error('❌ Error al obtener valores existentes:', errorValues)
    return NextResponse.json({ error: errorValues.message }, { status: 500 })
  }

  // 3. Combinar campos con valores existentes (o null si no hay)
  const merged = allFields.map(field => {
    const existing = valuesData?.find(v => v.field_id === field.id)
    return {
      field_id: field.id,
      value: existing?.value ?? null,
      entity_fields: {
        name: field.name,
        field_type: field.field_type,
        entity_type_id: field.entity_type_id
      }
    }
  })

  return NextResponse.json(merged)
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { entity_id, values } = body

    if (!entity_id || !Array.isArray(values)) {
      return NextResponse.json({ error: 'Parámetros inválidos' }, { status: 400 })
    }

    const upsertData = values.map((v: { field_id: string; value: string }) => ({
      entity_id,
      field_id: v.field_id,
      value: v.value
    }))

    const { error } = await supabaseAdmin
      .from('entity_field_values')
      .upsert(upsertData, { onConflict: 'entity_id,field_id' })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Error inesperado' }, { status: 500 })
  }
}
