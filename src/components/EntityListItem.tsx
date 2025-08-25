// src/components/EntityListItem.tsx
"use client"

import React, { useMemo, useState } from "react"
import { Box, Typography, IconButton, useTheme, useMediaQuery } from "@mui/material"
import { ChevronDown, ChevronUp } from "lucide-react"

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
  entity: Entity
  deadlines: Deadline[]
  fieldValues: FieldValue[]
  onClick?: () => void
}

// mismos umbrales que page.tsx
const DEADLINE_WARNING_DAYS = 30         // 🟠 ≤30 días
const DEADLINE_EARLY_WARNING_DAYS = 60   // 🟧 ≤60 días
const AVISO_HEX = "#ffb74d"

function getDiffDays(next_due_date: string | null) {
  if (!next_due_date) return Infinity
  const today = new Date()
  const due = new Date(next_due_date)
  return Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
}

export default function EntityListItem({ entity, deadlines, fieldValues, onClick }: Props) {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"))
  const [expanded, setExpanded] = useState(false)

  // Solo deadlines activos si vienen mezclados
  const active = useMemo(() => (deadlines || []).filter(d => d.status === "active"), [deadlines])

  // Mapear cada deadline a un color de estado (un punto por vencimiento)
  const dots = useMemo(() => {
    return active.map(d => {
      const diffDays = getDiffDays(d.next_due_date)
      let color: string = theme.palette.success.main   // "Al día" / default
      let label = "Al día"
      if (isFinite(diffDays)) {
        if (diffDays < 0) {
          color = theme.palette.error.main
          label = "Vencida"
        } else if (diffDays <= DEADLINE_WARNING_DAYS) {
          color = theme.palette.warning.main
          label = "Pronto"
        } else if (diffDays <= DEADLINE_EARLY_WARNING_DAYS) {
          color = AVISO_HEX
          label = "Aviso"
        }
      }
      return { id: d.id, color, label }
    })
  }, [active, theme.palette.error.main, theme.palette.warning.main, theme.palette.success.main])

  const handleExpandClick: React.MouseEventHandler<HTMLButtonElement> = (e) => {
    e.stopPropagation()
    setExpanded((prev) => !prev)
  }

  // Línea resumida con valores custom (separados por " • ")
  const collapsedValuesLine = useMemo(() => {
    const values = (fieldValues || [])
      .map(f => (f.value ?? "").toString().trim())
      .filter(v => v.length > 0)
    return values.length > 0 ? values.join(" • ") : "—"
  }, [fieldValues])

  return (
    <Box
      onClick={onClick}
      role="button"
      tabIndex={0}
      sx={{
        p: 1.25,
        borderRadius: 2,
        border: "1px solid",
        borderColor: "divider",
        bgcolor: "background.paper",
        "&:hover": {
          borderColor: theme.palette.primary.main,
          boxShadow: 2
        },
        outline: "none",
        cursor: "pointer"
      }}
    >
      {/* Row superior: título + (si está colapsado) puntos + botón */}
      <Box display="flex" alignItems="center" gap={1}>
        <Typography
          variant="subtitle1"
          sx={{
            flex: 1,
            fontWeight: 600,
            minWidth: 0,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap"
          }}
          title={entity.name}
        >
          {entity.name}
        </Typography>

        {/* Dots: solo cuando está comprimido */}
        {!expanded && dots.length > 0 && (
          <Box
            display="flex"
            alignItems="center"
            gap={0.75}
            sx={{ flexShrink: 1, flexWrap: "wrap", maxWidth: { xs: "45%", sm: "60%" } }}
          >
            {dots.map(dot => (
              <Box
                key={dot.id}
                component="span"
                title={dot.label}
                aria-label={dot.label}
                sx={{
                  width: 10,
                  height: 10,
                  borderRadius: "50%",
                  bgcolor: dot.color,
                  boxShadow: `0 0 0 1px ${theme.palette.mode === "dark" ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.15)"}`
                }}
              />
            ))}
          </Box>
        )}

        {/* Botón expandir/contraer */}
        <IconButton
          aria-label={expanded ? "Contraer" : "Expandir"}
          size="small"
          onClick={handleExpandClick}
          sx={{ ml: 0.5 }}
        >
          {expanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </IconButton>
      </Box>

      {/* Contenido comprimido: información custom (solo valores) */}
      {!expanded && (
        <Box mt={0.5}>
          <Typography
            variant="body2"
            color="text.secondary"
            noWrap
            title={collapsedValuesLine}
            sx={{ fontSize: isMobile ? "0.8rem" : "0.9rem" }}
          >
            {collapsedValuesLine}
          </Typography>
        </Box>
      )}

      {/* Contenido expandido: información custom (labels+valores) + detalle de vencimientos (sin puntos) */}
      {expanded && (
        <Box mt={1.25} onClick={(e) => e.stopPropagation()}>
          {/* Info custom (mismo diseño que comprimido) */}
          <Box component="section" sx={{ mb: 1, borderTop: "1px dashed", borderColor: "divider", pt: 1 }}>
            <Typography variant="caption" sx={{ fontWeight: 700, color: "text.secondary" }}>
              Información personalizada
            </Typography>
            <Typography
              variant="body2"
              color="text.secondary"
              title={collapsedValuesLine}
              sx={{ fontSize: isMobile ? "0.8rem" : "0.9rem", mt: 0.5 }}
            >
              {collapsedValuesLine}
            </Typography>
          </Box>

          {/* Vencimientos detalle */}          {/* Vencimientos detalle */}
          <Box component="section" sx={{ borderTop: "1px dashed", borderColor: "divider", pt: 1 }}>
            <Typography variant="caption" sx={{ fontWeight: 700, color: "text.secondary" }}>
              Vencimientos
            </Typography>
            {active.length > 0 ? (
              <Box component="ul" sx={{ listStyle: "none", pl: 0, m: 0, mt: 0.5 }}>
                {active.map((d) => (
                  <li key={d.id}>
                    <Box fontSize={12} py={0.5} sx={{ borderBottom: "1px dashed", borderColor: "divider" }}>
                      <Typography sx={{ fontSize: 13, fontWeight: 600 }}>
                        {d.deadline_types.name}
                      </Typography>
                      <Box display="flex" flexDirection="column" gap={0.25} mt={0.25}>
                        <Typography variant="caption">Última realización: {d.last_done || "—"}</Typography>
                        <Typography variant="caption">Fecha de vencimiento: {d.next_due_date || "—"}</Typography>
                        {d.deadline_types.measure_by === "usage" && (
                          <>
                            <Typography variant="caption">Frecuencia: {d.frequency} {d.frequency_unit}</Typography>
                            <Typography variant="caption">Promedio diario: {d.usage_daily_average ?? "—"}</Typography>
                            <Typography variant="caption">Uso actual: {typeof d.current_usage === "number" ? d.current_usage : "—"}</Typography>
                          </>
                        )}
                      </Box>
                    </Box>
                  </li>
                ))}
              </Box>
            ) : (
              <Typography variant="caption" color="text.secondary">Sin vencimientos</Typography>
            )}
          </Box>
        </Box>
      )}
    </Box>
  )
}
