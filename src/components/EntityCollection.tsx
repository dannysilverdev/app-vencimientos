// src/components/EntityCollection.tsx
"use client"

import React from "react"
import { Box } from "@mui/material"
import EntityCard from "@/components/EntityCard"
import EntityListItem from "@/components/EntityListItem"

type Entity = {
  id: string
  name: string
  type_id: string
}

type FieldValue = {
  id: string
  value: string
  field_id: string
  entity_fields: {
    name: string
    field_type: string
    entity_type_id: string
  }
}

type Deadline = {
  id: string
  last_done: string
  frequency: number
  frequency_unit: string
  usage_daily_average: number | null
  next_due_date: string | null
  current_usage?: number
  baseline_usage?: number
  status?: string
  deadline_types: {
    name: string
    measure_by: string
    unit: string | null
  }
}

type Props = {
  entities: Entity[]
  deadlinesByEntity: Record<string, Deadline[]>
  fieldValuesByEntity: Record<string, FieldValue[]>
  viewMode: "grid" | "list"
  onOpenEntity: (id: string) => void
}

export default function EntityCollection({
  entities,
  deadlinesByEntity,
  fieldValuesByEntity,
  viewMode,
  onOpenEntity
}: Props) {
  if (viewMode === "list") {
    return (
      <Box display="flex" flexDirection="column" gap={1}>
        {entities.map((entity) => {
          const deadlinesAll = deadlinesByEntity[entity.id] || []
          const fieldValues = fieldValuesByEntity[entity.id] || []
          return (
            <EntityListItem
              key={entity.id}
              entity={entity}
              deadlines={deadlinesAll}
              fieldValues={fieldValues}
              onClick={() => onOpenEntity(entity.id)}
            />
          )
        })}
      </Box>
    )
  }

  // grid (tarjetas)
  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: {
          xs: "1fr",
          sm: "repeat(2, minmax(0, 1fr))",
          md: "repeat(3, minmax(0, 1fr))",
          lg: "repeat(4, minmax(0, 1fr))",
        },
        gap: { xs: 1, sm: 1.5, md: 2 },
        alignItems: "start",
        justifyItems: "stretch",
        px: { xs: 0, sm: 0 },
      }}
    >
      {entities.map((entity) => {
        const deadlinesAll = deadlinesByEntity[entity.id] || []
        const fieldValues = fieldValuesByEntity[entity.id] || []
        return (
          <Box key={entity.id} sx={{ width: "100%" }}>
            <EntityCard
              entity={entity}
              deadlines={deadlinesAll} // EntityCard filtra activos
              fieldValues={fieldValues}
              onClick={() => onOpenEntity(entity.id)}
            />
          </Box>
        )
      })}
    </Box>
  )
}
