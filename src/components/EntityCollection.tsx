// src/components/EntityCollection.tsx
"use client"

import React from "react"
import { Box, useMediaQuery, useTheme } from "@mui/material"
import EntityCard from "./EntityCard"
import EntityListItem from "./EntityListItem"

type Entity = {
  id: string
  name: string
  type_id: string
  entity_types?: { name: string }
}

type FieldValue = {
  id: string
  value: string
  field_id: string
  entity_fields: {
    name: string
    field_type: string
    entity_type_id: string
    show_in_card?: boolean
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
  onOpenEntity?: (id: string) => void
}

export default function EntityCollection({
  entities,
  deadlinesByEntity,
  fieldValuesByEntity,
  viewMode,
  onOpenEntity,
}: Props) {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"))

  if (viewMode === "grid") {
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
          width: "100%",
          maxWidth: "100%",
          overflowX: "hidden",
        }}
      >
        {entities.map((entity) => (
          <Box key={entity.id} sx={{ width: "100%", minWidth: 0 }}>
            <EntityCard
              entity={entity}
              deadlines={deadlinesByEntity[entity.id] || []}
              fieldValues={fieldValuesByEntity[entity.id] || []}
              onClick={() => onOpenEntity?.(entity.id)}
            />
          </Box>
        ))}
      </Box>
    )
  }

  // LISTA (encaje 1:1 con tarjetas)
  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: "minmax(0, 1fr)", // evita desbordes
        gap: { xs: 0.75, md: 1 },
        width: "100%",
        maxWidth: "100%",
        overflowX: "hidden",
      }}
    >
      {entities.map((entity) => (
        <Box
          key={entity.id}
          sx={{
            width: "100%",
            minWidth: 0,
            overflow: "hidden",
          }}
        >
          <EntityListItem
            entity={entity}
            deadlines={deadlinesByEntity[entity.id] || []}
            fieldValues={fieldValuesByEntity[entity.id] || []}
            onClick={() => onOpenEntity?.(entity.id)}
          />
        </Box>
      ))}
    </Box>
  )
}
