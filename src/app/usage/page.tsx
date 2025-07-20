"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabaseClient"
import UsageLogForm from "@/components/UsageLogForm"

export default function UsagePage() {
  const [entities, setEntities] = useState<{ id: string; name: string }[]>([])

  useEffect(() => {
    async function load() {
      const { data } = await supabase.from("entities").select("id, name").order("name")
      if (data) setEntities(data)
    }
    load()
  }, [])

  return <UsageLogForm entities={entities} />
}
