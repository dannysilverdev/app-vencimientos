import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { NextRequest, NextResponse } from 'next/server'

// GET individual deadline by ID
export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params

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

// PUT update deadline
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params
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

// DELETE deadline
export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params

  const { error } = await supabaseAdmin
    .from('deadlines')
    .delete()
    .eq('id', id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
