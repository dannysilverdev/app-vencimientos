import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabaseAdmin"

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const id = params.id
  const body = await req.json()

  const { data, error } = await supabaseAdmin
    .from("deadlines")
    .update({
      frequency: body.frequency,
      last_done: body.last_done,
      usage_daily_average: body.usage_daily_average
    })
    .eq("id", id)
    .select()

  if (error) {
    console.error("Error actualizando vencimiento:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}
