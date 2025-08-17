// src/components/EntityCard.tsx
"use client"

import React, { useMemo, useState } from "react"
import {
  Box,
  Typography,
  useTheme,
  useMediaQuery,
} from "@mui/material"
import { alpha } from "@mui/material/styles"
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
  progress: number                 // ✅ siempre presente (0..1)
  currentUsage?: number
  thresholdUsage?: number
  elapsedDays?: number             // ⏱️ para fecha
  totalDays?: number               // ⏱️ para fecha
}

const WARNING_PROGRESS = 0.85
const DEADLINE_WARNING_DAYS = 30 // ⚠️ Amarillo si faltan ≤ 30 días (fecha)
const MS_PER_DAY = 1000 * 60 * 60 * 24

function clamp01(n: number) {
  return Math.max(0, Math.min(1, n))
}

function daysBetween(a: Date, b: Date) {
  return Math.ceil((a.getTime() - b.getTime()) / MS_PER_DAY)
}

function formatDateISO(d: Date) {
  return d.toISOString().split("T")[0]
}

function getDeadlineStatus(d: Deadline): DeadlineStatus {
  const today = new Date()

  // --- Vencimientos por USO ---
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
        progress: 0, // ✅ barra vacía si faltan datos
        currentUsage: hasCurrent ? current : undefined,
        thresholdUsage: hasFreq ? baseline + d.frequency : undefined,
        unit,
      }
    }

    const effectiveUsage = Math.max(0, current - baseline)
    const progress = clamp01(effectiveUsage / d.frequency)

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

  // --- Vencimientos por FECHA ---
  const dueDate = d.next_due_date ? new Date(d.next_due_date) : null
  const lastDone = d.last_done ? new Date(d.last_done) : null
  const diffDays = dueDate ? daysBetween(dueDate, today) : Infinity

  let variant: DeadlineStatus["variant"] = "default"
  let color = "#4caf50"
  let icon: React.ReactNode = <CheckCircle size={16} />

  if (dueDate && diffDays < 0) {
    variant = "destructive"     // 🔴 Vencido
    color = "#f44336"
    icon = <XCircle size={16} />
  } else if (dueDate && diffDays <= DEADLINE_WARNING_DAYS) {
    variant = "secondary"       // 🟡 Pronto (≤ 30 días)
    color = "#ff9800"
    icon = <AlertTriangle size={16} />
  }

  // 📊 Progreso para fecha
  // Caso preferente: si tenemos last_done y next_due_date, usamos esa ventana completa.
  let progress = 0
  let elapsedDays: number | undefined = undefined
  let totalDays: number | undefined = undefined

  if (lastDone && dueDate) {
    const total = Math.max(1, daysBetween(dueDate, lastDone))
    const elapsed = Math.max(0, Math.min(total, daysBetween(today, lastDone)))
    totalDays = total
    elapsedDays = Math.max(0, Math.min(total, elapsed))
    progress = clamp01(elapsed / total)
  } else if (dueDate) {
    // Fallback: barra dentro de la ventana de aviso (30 días antes del vencimiento)
    // - Si faltan >30 días → 0%
    // - A medida que se acerca (<=30) sube hasta 100%
    if (diffDays <= 0) {
      progress = 1
    } else {
      progress = clamp01((DEADLINE_WARNING_DAYS - diffDays) / DEADLINE_WARNING_DAYS)
    }
  } else {
    progress = 0
  }

  return {
    text: dueDate ? formatDateISO(dueDate) : "Sin fecha",
    variant,
    icon,
    daysRemaining: diffDays,
    label: d.deadline_types.name,
    unit: d.deadline_types.unit || d.frequency_unit || undefined,
    color,
    progress,          // ✅ ahora siempre presente
    elapsedDays,
    totalDays,
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
    const pct = clamp01(progress ?? 0) * 100
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
              transition: "width .35s ease, background-color .35s ease",
            }}
          />
        </Box>
        <Typography
          variant="caption"
          sx={{
            fontWeight: 700,
            color: theme.palette.text.secondary,
            minWidth: 34,
            textAlign: "right"
          }}
        >
          {Math.round(pct)}%
        </Typography>
      </Box>
    )
  }

  const surface = theme.palette.mode === "dark" ? alpha("#fff", 0.04) : alpha("#000", 0.02)
  const border = theme.palette.mode === "dark" ? alpha("#fff", 0.08) : alpha("#000", 0.08)
  const hoverBg = theme.palette.mode === "dark" ? alpha("#fff", 0.06) : alpha("#000", 0.04)

  return (
    <Box
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") onClick() }}
      sx={{
        bgcolor: surface,
        border: `1px solid ${border}`,
        borderRadius: 2.5,
        p: 2,
        boxShadow: "0 6px 20px rgba(0,0,0,0.06)",
        minWidth: 260,
        maxWidth: matches ? "100%" : 420,
        cursor: "pointer",
        transition: "transform .22s ease, box-shadow .22s ease, background-color .22s ease, border-color .22s ease",
        "&:hover": {
          transform: "translateY(-3px)",
          boxShadow: "0 10px 26px rgba(0,0,0,0.10)",
          bgcolor: hoverBg
        },
        "&:focus-visible": {
          outline: `2px solid ${alpha(theme.palette.primary.main, 0.5)}`,
          outlineOffset: 2
        },
        display: "grid",
        gridTemplateRows: "auto 1fr auto",
        rowGap: 1.25,
      }}
    >
      {/* Nombre de la entidad */}
      <Typography
        variant="h6"
        fontWeight={800}
        sx={{
          m: 0,
          lineHeight: 1.15,
          letterSpacing: 0.2,
          wordBreak: "break-word",
          whiteSpace: "normal",
        }}
      >
        {entity.name}
      </Typography>

      {/* Lista de vencimientos */}
      <Box sx={{ display: "flex", flexDirection: "column", gap: 1.25, mt: 0.25 }}>
        {sorted.slice(0, visibleCount).map((d, i) => (
          <Box
            key={i}
            sx={{
              display: "flex",
              flexDirection: "column",
              gap: 0.35,
              p: 0,
            }}
          >
            <Typography variant="body2" sx={{ fontWeight: 700, color: d.color }}>
              {d.unit ? `${d.label} (${d.unit})` : d.label}
            </Typography>
            <Typography variant="body2" sx={{ color: theme.palette.text.secondary, mt: -0.25 }}>
              {d.daysRemaining < 0
                ? `Venció el ${d.text}`
                : isFinite(d.daysRemaining)
                  ? `${d.daysRemaining} días para vencer el ${d.text}`
                  : `Sin fecha`}
            </Typography>

            {/* ✅ Barra de progreso SIEMPRE visible */}
            {renderProgressBar(d.progress)}

            {/* Pie de apoyo */}
            <Typography variant="caption" sx={{ color: theme.palette.text.secondary, mt: 0.25 }}>
              {typeof d.currentUsage === "number" && typeof d.thresholdUsage === "number"
                ? `Uso actual: ${d.currentUsage} ${d.unit ?? ""} • Vence a los ${d.thresholdUsage} ${d.unit ?? ""}`
                : (Number.isFinite(d.elapsedDays) && Number.isFinite(d.totalDays))
                  ? `Transcurrido: ${d.elapsedDays}/${d.totalDays} días`
                  : isFinite(d.daysRemaining)
                    ? `Quedan ${Math.max(0, d.daysRemaining)} días`
                    : "Progreso no disponible"}
            </Typography>
          </Box>
        ))}

        {sorted.length > 2 && (
          <Box
            onClick={(e) => { e.stopPropagation(); setExpanded(v => !v) }}
            sx={{
              mt: 0.25,
              alignSelf: "flex-start",
              px: 1,
              py: 0.35,
              borderRadius: 999,
              bgcolor: theme.palette.mode === "dark" ? alpha("#fff", 0.06) : alpha("#000", 0.05),
              border: `1px solid ${theme.palette.mode === "dark" ? alpha("#fff", 0.08) : alpha("#000", 0.08)}`,
              fontSize: "0.75rem",
              fontWeight: 700,
              userSelect: "none",
              transition: "background-color .2s ease, transform .2s ease",
              "&:hover": { transform: "translateY(-1px)" }
            }}
          >
            {expanded ? "Ver menos" : `Ver más (${sorted.length - 2})`}
          </Box>
        )}
      </Box>

      {/* Chips de campos personalizados */}
      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5, mt: 0.75 }}>
        {visibleChips.map((f, i) => (
          <Box
            key={i}
            sx={{
              px: 1,
              py: 0.4,
              bgcolor: theme.palette.mode === "dark" ? alpha("#fff", 0.06) : alpha("#000", 0.05),
              border: `1px solid ${theme.palette.mode === "dark" ? alpha("#fff", 0.08) : alpha("#000", 0.08)}`,
              color: theme.palette.text.primary,
              borderRadius: 999,
              fontSize: "0.75rem",
              fontWeight: 700,
              lineHeight: 1.2,
            }}
          >
            {f.value}
          </Box>
        ))}
        {hiddenChipsCount > 0 && (
          <Box
            sx={{
              px: 1,
              py: 0.4,
              borderRadius: 999,
              bgcolor: theme.palette.mode === "dark" ? alpha("#fff", 0.04) : alpha("#000", 0.04),
              border: `1px solid ${theme.palette.mode === "dark" ? alpha("#fff", 0.08) : alpha("#000", 0.08)}`,
              fontSize: "0.75rem",
              fontWeight: 800,
            }}
          >
            +{hiddenChipsCount}
          </Box>
        )}
      </Box>
    </Box>
  )
}
