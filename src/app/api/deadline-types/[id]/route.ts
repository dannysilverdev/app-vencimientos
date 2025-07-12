import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { NextRequest, NextResponse } from 'next/server'

export async function PUT(req: NextRequest, context: { params: { id: string } }) {
  const { id } = context.params
  const body = await req.json()

  const { name, measure_by, unit } = body

  const { error } = await supabaseAdmin
    .from('deadline_types')
    .update({ name, measure_by, unit })
    .eq('id', id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}