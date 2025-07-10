// src/hooks/useEntityTypes.ts
import { useEffect, useState } from 'react'

export type EntityType = {
  id: string
  name: string
}

export function useEntityTypes() {
  const [types, setTypes] = useState<EntityType[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/entity-types')
      .then(res => res.json())
      .then(data => {
        setTypes(data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  return { types, loading }
}
