"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabaseClient"
import UsageLogForm from "@/components/UsageLogForm"

export default function UsagePage() {
  const [entities, setEntities] = useState<{ id: string; name: string }[]>([])

  useEffect(() => {
    async function loadEntities() {
      const { data, error } = await supabase
        .from("entities")
        .select("id, name")
        .order("name", { ascending: true })

      if (error) {
        console.error("Error al cargar entidades:", error)
      } else if (data) {
        setEntities(data)
      }
    }

    loadEntities()
  }, [])

  return <UsageLogForm entities={entities} />
}
