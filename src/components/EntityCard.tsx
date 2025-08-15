// src/components/EntityCard.tsx
"use client"

import React, { useMemo, useState } from "react"
import {
  Box,
  Typography,
  useTheme,
  useMediaQuery,
} from "@mui/material"
import {
  AlertTriangle,
  CheckCircle,
  XCircle,
} from "lucide-react"

type Entity = {
  id: string
  name: string
  type_id: string
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
  deadline_types: {
    name: string
    measure_by: string
    unit: string | null
  }
}

type EntityField = {
  name: string
  field_type: string
  entity_type_id: string
  show_in_card?: boolean
}

type FieldValue = {
  id: string
  value: string
  field_id: string
  entity_fields?: EntityField | null
}

type DeadlineStatus = {
  color: string
  text: string
  variant: "default" | "secondary" | "destructive"
  icon: React.ReactNode
  daysRemaining: number
  label: string
  unit?: string
  progress?: number
  currentUsage?: number
  thresholdUsage?: number
}

const WARNING_PROGRESS = 0.85

function formatDateISO(d: Date) {
  return d.toISOString().split("T")[0]
}

function getDeadlineStatus(d: Deadline): DeadlineStatus {
  const today = new Date()

  if (d.deadline_types.measure_by === "usage") {
    const unit = d.deadline_types.unit || d.frequency_unit || ""
    const hasCurrent = typeof d.current_usage === "number"
    const hasFreq = typeof d.frequency === "number" && isFinite(d.frequency) && d.frequency > 0
    const baseline = typeof d.baseline_usage === "number" ? d.baseline_usage : 0
    const current = hasCurrent ? d.current_usage! : NaN

    if (!hasCurrent || !hasFreq) {
      return {
        text: "Sin fecha",
        variant: "default",
        icon: <CheckCircle size={16} />,
        daysRemaining: Infinity,
        label: d.deadline_types.name,
        color: "#4caf50",
        progress: 0,
        currentUsage: hasCurrent ? current : undefined,
        thresholdUsage: hasFreq ? baseline + d.frequency : undefined,
        unit,
      }
    }

    const effectiveUsage = Math.max(0, current - baseline)
    const progress = effectiveUsage / d.frequency

    let text = "Sin fecha"
    let daysRemaining = Infinity
    const avg = typeof d.usage_daily_average === "number" ? d.usage_daily_average : 0

    if (avg > 0) {
      const remainingUsage = Math.max(0, d.frequency - effectiveUsage)
      const days = Math.ceil(remainingUsage / avg)
      daysRemaining = days
      const dueDate = new Date(today)
      dueDate.setDate(today.getDate() + days)
      text = formatDateISO(dueDate)
    }

    let variant: DeadlineStatus["variant"] = "default"
    let color = "#4caf50"
    let icon: React.ReactNode = <CheckCircle size={16} />

    if (progress >= 1) {
      variant = "destructive"
      color = "#f44336"
      icon = <XCircle size={16} />
    } else if (progress >= WARNING_PROGRESS) {
      variant = "secondary"
      color = "#ff9800"
      icon = <AlertTriangle size={16} />
    }

    const thresholdUsage = Math.round((baseline + d.frequency) * 100) / 100
    const currentRounded = Math.round(current * 100) / 100

    return {
      text,
      variant,
      icon,
      daysRemaining,
      label: d.deadline_types.name,
      unit,
      color,
      progress,
      currentUsage: currentRounded,
      thresholdUsage,
    }
  }

  const dueDate = d.next_due_date ? new Date(d.next_due_date) : null
  const diffDays = dueDate ? Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)) : Infinity

  let variant: DeadlineStatus["variant"] = "default"
  let color = "#4caf50"
  let icon: React.ReactNode = <CheckCircle size={16} />

  if (dueDate && diffDays < 0) {
    variant = "destructive"
    color = "#f44336"
    icon = <XCircle size={16} />
  } else if (dueDate && diffDays <= 3) {
    variant = "secondary"
    color = "#ff9800"
    icon = <AlertTriangle size={16} />
  }

  return {
    text: dueDate ? formatDateISO(dueDate) : "Sin fecha",
    variant,
    icon,
    daysRemaining: diffDays,
    label: d.deadline_types.name,
    unit: d.deadline_types.unit || d.frequency_unit || undefined,
    color,
  }
}

type Props = {
  entity: Entity
  deadlines: Deadline[]
  fieldValues?: FieldValue[]
  onClick: () => void
}

export default function EntityCard({ entity, deadlines, fieldValues = [], onClick }: Props) {
  const theme = useTheme()
  const matches = useMediaQuery(theme.breakpoints.down("sm"))
  const [expanded, setExpanded] = useState(false)

  const chips = useMemo(
    () => fieldValues.filter(f => f.entity_fields?.show_in_card && f.value?.trim()),
    [fieldValues]
  )
  const visibleChips = chips.slice(0, 6)
  const hiddenChipsCount = Math.max(0, chips.length - visibleChips.length)

  const sorted = useMemo(
    () =>
      deadlines
        .map(getDeadlineStatus)
        .sort((a, b) => a.daysRemaining - b.daysRemaining),
    [deadlines]
  )

  const visibleCount = expanded ? sorted.length : Math.min(sorted.length, 2)

  const getProgressColor = (p: number | undefined) => {
    if (p === undefined) return theme.palette.success.main
    if (p >= 1) return theme.palette.error.main
    if (p >= WARNING_PROGRESS) return theme.palette.warning.main
    return theme.palette.success.main
  }

  const renderProgressBar = (progress?: number) => {
    const pct = Math.max(0, Math.min(1, progress ?? 0)) * 100
    const fillColor = getProgressColor(progress)
    return (
      <Box sx={{ mt: 1.0, display: "flex", alignItems: "center", gap: 1 }}>
        <Box
          sx={{
            flex: 1,
            position: "relative",
            height: 8,
            borderRadius: 999,
            bgcolor: theme.palette.mode === "dark" ? "grey.800" : "grey.200",
            overflow: "hidden",
          }}
        >
          <Box
            sx={{
              position: "absolute",
              left: 0,
              top: 0,
              bottom: 0,
              width: `${pct}%`,
              bgcolor: fillColor,
              borderRadius: 999,
              transition: "width .25s ease",
            }}
          />
        </Box>
        <Typography
          variant="caption"
          sx={{
            fontWeight: 700,
            color: theme.palette.text.secondary,
            minWidth: 30,
            textAlign: "right"
          }}
        >
          {Math.round(pct)}%
        </Typography>
      </Box>
    )
  }

  return (
    <Box
      onClick={onClick}
      sx={{
        bgcolor: theme.palette.background.paper,
        borderRadius: 2,
        p: 2,
        boxShadow: 2,
        minWidth: 260,
        maxWidth: matches ? "100%" : 420,
        cursor: "pointer",
        transition: "transform 0.2s, box-shadow .2s",
        "&:hover": { transform: "translateY(-2px)", boxShadow: 4 },
        display: "grid",
        gridTemplateRows: "auto 1fr auto",
        rowGap: 1.25,
      }}
    >
      <Typography
        variant="h6"
        fontWeight={700}
        sx={{
          m: 0,
          lineHeight: 1.2,
          wordBreak: "break-word",
          whiteSpace: "normal",
        }}
      >
        {entity.name}
      </Typography>

      <Box sx={{ display: "flex", flexDirection: "column", gap: 1.25, mt: 0.5 }}>
        {sorted.slice(0, visibleCount).map((d, i) => (
          <Box key={i} sx={{ display: "flex", flexDirection: "column", gap: 0.25 }}>
            <Typography variant="body2" sx={{ fontWeight: 600, color: d.color }}>
              {d.unit ? `${d.label} (${d.unit})` : d.label}
            </Typography>
            <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
              {d.daysRemaining < 0
                ? `Venció el ${d.text}`
                : isFinite(d.daysRemaining)
                  ? `${d.daysRemaining} días para vencer el ${d.text}`
                  : `Sin fecha`}
            </Typography>
            {d.progress !== undefined && (
              <>
                {renderProgressBar(d.progress)}
                <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
                  {typeof d.currentUsage === "number" && typeof d.thresholdUsage === "number"
                    ? `Uso actual: ${d.currentUsage} ${d.unit ?? ""} • Vence a los ${d.thresholdUsage} ${d.unit ?? ""}`
                    : "Sin datos suficientes de uso"}
                </Typography>
              </>
            )}
          </Box>
        ))}

        {sorted.length > 2 && (
          <Box
            onClick={(e) => { e.stopPropagation(); setExpanded(v => !v) }}
            sx={{
              mt: 0.25,
              alignSelf: "flex-start",
              px: 1,
              py: 0.5,
              borderRadius: 999,
              bgcolor: theme.palette.mode === "dark" ? "grey.900" : "grey.100",
              fontSize: "0.75rem",
              fontWeight: 600,
              userSelect: "none",
            }}
          >
            {expanded ? "Ver menos" : `Ver más (${sorted.length - 2})`}
          </Box>
        )}
      </Box>

      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5, mt: 1 }}>
        {visibleChips.map((f, i) => (
          <Box
            key={i}
            sx={{
              px: 1.25,
              py: 0.5,
              bgcolor: theme.palette.mode === "dark" ? "grey.800" : "grey.200",
              color: theme.palette.text.primary,
              borderRadius: 999,
              fontSize: "0.75rem",
              fontWeight: 600,
            }}
          >
            {f.value}
          </Box>
        ))}
        {hiddenChipsCount > 0 && (
          <Box
            sx={{
              px: 1.25,
              py: 0.5,
              borderRadius: 999,
              bgcolor: theme.palette.mode === "dark" ? "grey.900" : "grey.100",
              fontSize: "0.75rem",
              fontWeight: 700,
            }}
          >
            +{hiddenChipsCount}
          </Box>
        )}
      </Box>
    </Box>
  )
}
