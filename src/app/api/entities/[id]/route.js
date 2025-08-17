// src/app/api/entities/[id]/route.js
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { NextResponse } from 'next/server'

// Evita caché en el handler
export const dynamic = 'force-dynamic'

function noStoreJson(payload, init = {}) {
  const headers = new Headers(init.headers || {})
  headers.set('Cache-Control', 'no-store, no-cache, must-revalidate')
  return NextResponse.json(payload, { ...init, headers })
}

function toBool(value) {
  if (typeof value === 'boolean') return value
  if (typeof value === 'number') return value === 1
  if (typeof value === 'string') {
    const v = value.toLowerCase().trim()
    return v === 'true' || v === '1' || v === 'yes' || v === 'on'
  }
  return Boolean(value)
}

export async function GET(_req, { params }) {
  try {
    const { id } = params

    const { data, error } = await supabaseAdmin
      .from('entities')
      .select('id, name, type_id, tracks_usage')
      .eq('id', id)
      .single()

    if (error || !data) {
      return noStoreJson({ error: error?.message || 'Entidad no encontrada' }, { status: 404 })
    }

    return noStoreJson(data, { status: 200 })
  } catch (e) {
    return noStoreJson({ error: e?.message || 'Error inesperado' }, { status: 500 })
  }
}

export async function PUT(req, { params }) {
  try {
    const { id } = params
    const body = await req.json().catch(() => ({}))

    // Allowlist de campos válidos
    const allowed = ['name', 'type_id', 'tracks_usage']
    const updateData = {}
    for (const k of allowed) {
      if (Object.prototype.hasOwnProperty.call(body, k)) {
        updateData[k] = body[k]
      }
    }

    // Coerción estricta del booleano
    if (Object.prototype.hasOwnProperty.call(updateData, 'tracks_usage')) {
      updateData.tracks_usage = toBool(updateData.tracks_usage) ? true : false
    }

    if (Object.keys(updateData).length === 0) {
      return noStoreJson({ error: 'No se proporcionaron campos válidos' }, { status: 400 })
    }

    const { data, error } = await supabaseAdmin
      .from('entities')
      .update({
        ...(Object.prototype.hasOwnProperty.call(updateData, 'name') ? { name: updateData.name } : {}),
        ...(Object.prototype.hasOwnProperty.call(updateData, 'type_id') ? { type_id: updateData.type_id } : {}),
        ...(Object.prototype.hasOwnProperty.call(updateData, 'tracks_usage')
          ? { tracks_usage: updateData.tracks_usage === true }
          : {}),
      })
      .eq('id', id)
      .select('id, name, type_id, tracks_usage')
      .single()

    if (error) {
      return noStoreJson({ error: error.message }, { status: 500 })
    }

    return noStoreJson(data, { status: 200 })
  } catch (e) {
    return noStoreJson({ error: e?.message || 'Error inesperado' }, { status: 500 })
  }
}

export async function DELETE(_req, { params }) {
  try {
    const { id } = params

    const { error } = await supabaseAdmin
      .from('entities')
      .delete()
      .eq('id', id)

    if (error) {
      return noStoreJson({ error: error.message }, { status: 500 })
    }

    return noStoreJson({ success: true }, { status: 200 })
  } catch (e) {
    return noStoreJson({ error: e?.message || 'Error inesperado' }, { status: 500 })
  }
}
