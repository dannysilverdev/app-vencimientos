import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { NextRequest, NextResponse } from 'next/server'

// Helper para extraer ID desde la URL
function extractId(req: NextRequest): string | null {
  const url = req.nextUrl.pathname
  const match = url.match(/\/api\/deadlines\/([^\/]+)/)
  return match?.[1] ?? null
}

export async function GET(req: NextRequest) {
  const id = extractId(req)
  if (!id) return NextResponse.json({ error: 'ID inválido' }, { status: 400 })

  const { data, error } = await supabaseAdmin
    .from('deadlines')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !data) {
    return NextResponse.json(
      { error: error?.message || 'Vencimiento no encontrado' },
      { status: 404 }
    )
  }

  return NextResponse.json(data)
}

export async function PUT(req: NextRequest) {
  const id = extractId(req)
  if (!id) return NextResponse.json({ error: 'ID inválido' }, { status: 400 })

  const body = await req.json()

  const { error } = await supabaseAdmin
    .from('deadlines')
    .update(body)
    .eq('id', id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}

export async function DELETE(req: NextRequest) {
  const id = extractId(req)
  if (!id) return NextResponse.json({ error: 'ID inválido' }, { status: 400 })

  const { error } = await supabaseAdmin
    .from('deadlines')
    .delete()
    .eq('id', id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
