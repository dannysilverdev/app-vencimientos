// Nuevo archivo
import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabaseClient"

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const entityId = searchParams.get("entity_id")

  if (!entityId) {
    return NextResponse.json({ error: "Falta entity_id" }, { status: 400 })
  }

  const { data, error } = await supabase
    .from("usage_logs")
    .select("value")
    .eq("entity_id", entityId)
    .order("created_at", { ascending: false })
    .limit(1)
    .single()

  if (error) {
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }

  return NextResponse.json(data || null)
}
