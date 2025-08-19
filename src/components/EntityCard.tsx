// src/components/EntityCard.tsx
"use client"

import type React from "react"
import { useMemo, useState } from "react"
import { Box, Typography, useTheme, useMediaQuery } from "@mui/material"
import { alpha } from "@mui/material/styles"
import { AlertTriangle, CheckCircle, XCircle, ChevronDown, ChevronUp, Info } from "lucide-react"

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
  status?: string
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
  variant: "default" | "warning" | "secondary" | "destructive"
  icon: React.ReactNode
  daysRemaining: number
  label: string
  unit?: string
  progress: number
  currentUsage?: number
  thresholdUsage?: number
  elapsedDays?: number
  totalDays?: number
}

const WARNING_PROGRESS = 0.85            // “Próximo a vencer” (uso)
const EARLY_WARNING_PROGRESS = 0.7       // “Aviso” (uso)
const DEADLINE_WARNING_DAYS = 30         // “Próximo a vencer” (fecha)
const DEADLINE_EARLY_WARNING_DAYS = 60   // “Aviso” (fecha)
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

function colorForVariant(variant: DeadlineStatus["variant"], theme: any) {
  switch (variant) {
    case "destructive":
      return theme.palette.error.main
    case "secondary":
      return theme.palette.warning.main
    case "warning":
      // AVISO: color fijo solicitado
      return "#ffb74d"
    default:
      return theme.palette.success.main
  }
}

function getDeadlineStatus(d: Deadline): DeadlineStatus {
  const today = new Date()

  if (d.deadline_types.measure_by === "usage") {
    const unit = d.deadline_types.unit || d.frequency_unit || ""
    const hasCurrent = typeof d.current_usage === "number"
    const hasFreq = typeof d.frequency === "number" && isFinite(d.frequency) && d.frequency > 0
    const baseline = typeof d.baseline_usage === "number" ? d.baseline_usage : 0
    const current = hasCurrent ? d.current_usage! : Number.NaN

    if (!hasCurrent || !hasFreq) {
      return {
        text: "Sin fecha",
        variant: "default",
        icon: <CheckCircle size={16} />,
        daysRemaining: Number.POSITIVE_INFINITY,
        label: d.deadline_types.name,
        color: "",
        progress: 0,
        currentUsage: hasCurrent ? current : undefined,
        thresholdUsage: hasFreq ? baseline + d.frequency : undefined,
        unit,
      }
    }

    const effectiveUsage = Math.max(0, current - baseline)
    const progress = clamp01(effectiveUsage / d.frequency)

    let text = "Sin fecha"
    let daysRemaining = Number.POSITIVE_INFINITY
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
    let icon: React.ReactNode = <CheckCircle size={16} />

    if (progress >= 1) {
      variant = "destructive"
      icon = <XCircle size={16} />
    } else if (progress >= WARNING_PROGRESS) {
      variant = "secondary"
      icon = <AlertTriangle size={16} />
    } else if (progress >= EARLY_WARNING_PROGRESS) {
      variant = "warning"
      icon = <Info size={16} />
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
      color: variant === "warning" ? "#ffb74d" : "", // AVISO color fijo
      progress,
      currentUsage: currentRounded,
      thresholdUsage,
    }
  }

  const dueDate = d.next_due_date ? new Date(d.next_due_date) : null
  const lastDone = d.last_done ? new Date(d.last_done) : null
  const diffDays = dueDate ? daysBetween(dueDate, today) : Number.POSITIVE_INFINITY

  let variant: DeadlineStatus["variant"] = "default"
  let icon: React.ReactNode = <CheckCircle size={16} />

  if (dueDate && diffDays < 0) {
    variant = "destructive"
    icon = <XCircle size={16} />
  } else if (dueDate && diffDays <= DEADLINE_WARNING_DAYS) {
    variant = "secondary"
    icon = <AlertTriangle size={16} />
  } else if (dueDate && diffDays <= DEADLINE_EARLY_WARNING_DAYS) {
    variant = "warning"
    icon = <Info size={16} />
  }

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
    if (diffDays <= 0) progress = 1
    else progress = clamp01((DEADLINE_WARNING_DAYS - diffDays) / DEADLINE_WARNING_DAYS)
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
    color: variant === "warning" ? "#ffb74d" : "",
    progress,
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
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"))
  const isTablet = useMediaQuery(theme.breakpoints.down("md"))
  const [deadlinesExpanded, setDeadlinesExpanded] = useState(false)
  const [fieldsExpanded, setFieldsExpanded] = useState(false)

  const chips = useMemo(
    () => fieldValues.filter((f) => f.entity_fields?.show_in_card && f.value?.trim()),
    [fieldValues],
  )
  const visibleChips = chips.slice(0, isMobile ? 4 : 6)
  const hiddenChipsCount = Math.max(0, chips.length - visibleChips.length)

  const sorted = useMemo(
    () =>
      deadlines
        .filter((d) => d.status === "active")
        .map(getDeadlineStatus)
        .sort((a, b) => a.daysRemaining - b.daysRemaining),
    [deadlines],
  )

  const visibleCount = sorted.length

  const surface =
    theme.palette.mode === "dark"
      ? `linear-gradient(145deg, ${alpha("#fff", 0.06)}, ${alpha("#fff", 0.02)})`
      : `linear-gradient(145deg, ${alpha("#fff", 0.9)}, ${alpha("#fff", 0.7)})`

  const border = theme.palette.mode === "dark" ? alpha("#fff", 0.12) : alpha("#000", 0.06)

  const hoverBg =
    theme.palette.mode === "dark"
      ? `linear-gradient(145deg, ${alpha("#fff", 0.08)}, ${alpha("#fff", 0.04)})`
      : `linear-gradient(145deg, ${alpha("#fff", 0.95)}, ${alpha("#fff", 0.8)})`

  const colorFor = (v: DeadlineStatus["variant"]) => colorForVariant(v, theme)

  return (
    <Box
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") onClick()
      }}
      sx={{
        background: surface,
        border: `1px solid ${border}`,
        borderRadius: isMobile ? 2 : 3,
        p: isMobile ? 2 : 2.5,
        boxShadow:
          theme.palette.mode === "dark"
            ? "0 4px 20px rgba(0,0,0,0.3), 0 1px 3px rgba(0,0,0,0.2)"
            : "0 4px 20px rgba(0,0,0,0.08), 0 1px 3px rgba(0,0,0,0.06)",
        // llenar celda en todos los modos
        width: "100%",
        maxWidth: "100%",
        mx: 0,
        cursor: "pointer",
        transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        "&:hover": {
          transform: isMobile ? "translateY(-1px)" : "translateY(-4px)",
          boxShadow:
            theme.palette.mode === "dark"
              ? "0 8px 32px rgba(0,0,0,0.4), 0 2px 6px rgba(0,0,0,0.3)"
              : "0 8px 32px rgba(0,0,0,0.12), 0 2px 6px rgba(0,0,0,0.08)",
          background: hoverBg,
          borderColor: theme.palette.mode === "dark" ? alpha("#fff", 0.16) : alpha("#000", 0.08),
        },
        "&:focus-visible": {
          outline: `2px solid ${theme.palette.primary.main}`,
          outlineOffset: 2,
        },
        "&:active": {
          transform: isMobile ? "translateY(0px)" : "translateY(-2px)",
        },
        display: "flex",
        flexDirection: "column",
        gap: isMobile ? 1.5 : 2,
        position: "relative",
      }}
    >
      {sorted.length > 0 && (
        <Box
          onClick={(e) => {
            e.stopPropagation()
            setDeadlinesExpanded((v) => !v)
          }}
          sx={{
            position: "absolute",
            top: isMobile ? 12 : 16,
            right: isMobile ? 12 : 16,
            zIndex: 1,
            width: 32,
            height: 32,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: "50%",
            bgcolor: alpha(theme.palette.primary.main, 0.1),
            border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
            color: theme.palette.primary.main,
            cursor: "pointer",
            transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
            "&:hover": {
              bgcolor: alpha(theme.palette.primary.main, 0.15),
              transform: "translateY(-1px) scale(1.05)",
              boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.3)}`,
            },
            "&:active": {
              transform: "translateY(0px) scale(1)",
            },
          }}
        >
          {deadlinesExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </Box>
      )}

      {/* Header */}
      <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
        <Typography
          variant={isMobile ? "h6" : "h5"}
          sx={{
            fontWeight: 700,
            lineHeight: 1.2,
            letterSpacing: -0.01,
            wordBreak: "break-word",
            color: theme.palette.text.primary,
            fontSize: isMobile ? "1.1rem" : "1.25rem",
            pr: 5,
          }}
        >
          {entity.name}
        </Typography>

        {chips.length > 0 && (
          <Typography
            variant="body2"
            sx={{
              color: theme.palette.text.secondary,
              fontWeight: 500,
              lineHeight: 1.3,
              fontSize: isMobile ? "0.8rem" : "0.85rem",
              pr: 5,
            }}
            title={chips.map((c) => c.value).join(" • ")}
          >
            {visibleChips.map((c) => c.value).join(" • ")}
            {hiddenChipsCount > 0 && ` • +${hiddenChipsCount} más`}
          </Typography>
        )}
      </Box>

      {/* Deadlines */}
      <Box sx={{ display: "flex", flexDirection: "column", gap: isMobile ? 0.5 : 0.75, flex: 1 }}>
        {sorted.slice(0, visibleCount).map((d, i) => (
          <Box
            key={i}
            sx={{
              display: "flex",
              flexDirection: "column",
              gap: 0.25,
              p: isMobile ? 0.5 : 0.75,
              borderRadius: 2,
              bgcolor: alpha(colorFor(d.variant), 0.05),
              border: `1px solid ${alpha(colorFor(d.variant), 0.15)}`,
              transition: "all 0.2s ease",
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Box sx={{ color: colorFor(d.variant), display: "flex", alignItems: "center" }}>
                {d.icon}
              </Box>
              <Typography
                variant="subtitle2"
                sx={{
                  fontWeight: 700,
                  color: colorFor(d.variant),
                  fontSize: isMobile ? "0.85rem" : "0.9rem",
                  flex: 1,
                }}
              >
                {d.unit ? `${d.label} (${d.unit})` : d.label}
              </Typography>
            </Box>

            {deadlinesExpanded && (
              <Typography
                variant="body2"
                sx={{
                  color: theme.palette.text.secondary,
                  fontSize: isMobile ? "0.8rem" : "0.85rem",
                  lineHeight: 1.4,
                }}
              >
                {d.daysRemaining < 0
                  ? `Venció el ${d.text}`
                  : isFinite(d.daysRemaining)
                    ? `${d.daysRemaining} días para vencer el ${d.text}`
                    : `Sin fecha definida`}
              </Typography>
            )}

            <Box
              aria-label={`${d.label}: ${Math.round(clamp01(d.progress ?? 0) * 100)}%`}
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.round(clamp01(d.progress ?? 0) * 100)}
              sx={{ mt: 0.5, display: "flex", alignItems: "center", gap: 1.5 }}
            >
              <Box
                sx={{
                  flex: 1,
                  position: "relative",
                  height: isMobile ? 6 : 8,
                  borderRadius: 999,
                  bgcolor: alpha(colorFor(d.variant), 0.15),
                  overflow: "hidden",
                  boxShadow: `inset 0 1px 2px ${alpha(theme.palette.common.black, 0.1)}`,
                  ...(d.variant === "destructive" && {
                    backgroundImage: `repeating-linear-gradient(
                      45deg,
                      ${alpha(colorFor(d.variant), 0.2)} 0px,
                      ${alpha(colorFor(d.variant), 0.2)} 8px,
                      ${alpha(colorFor(d.variant), 0.1)} 8px,
                      ${alpha(colorFor(d.variant), 0.1)} 16px
                    )`,
                    animation: "stripeMove 2s linear infinite",
                    "@keyframes stripeMove": {
                      "0%": { backgroundPosition: "0 0" },
                      "100%": { backgroundPosition: "32px 0" },
                    },
                  }),
                }}
              >
                <Box
                  sx={{
                    position: "absolute",
                    left: 0,
                    top: 0,
                    bottom: 0,
                    width: `${clamp01(d.progress ?? 0) * 100}%`,
                    bgcolor: colorFor(d.variant),
                    borderRadius: 999,
                    transition: "width 0.6s cubic-bezier(0.4, 0, 0.2, 1)",
                    boxShadow:
                      clamp01(d.progress ?? 0) * 100 > 5
                        ? `0 0 8px ${alpha(colorFor(d.variant), 0.4)}`
                        : "none",
                  }}
                />
              </Box>
              <Typography
                variant="caption"
                sx={{
                  fontWeight: 600,
                  color: colorFor(d.variant),
                  minWidth: isMobile ? 28 : 34,
                  textAlign: "right",
                  fontSize: isMobile ? "0.7rem" : "0.75rem",
                }}
              >
                {Math.round(clamp01(d.progress ?? 0) * 100)}%
              </Typography>
            </Box>

            {deadlinesExpanded && (
              <Typography
                variant="caption"
                sx={{
                  color: theme.palette.text.secondary,
                  fontSize: isMobile ? "0.7rem" : "0.75rem",
                  fontWeight: 500,
                  lineHeight: 1.3,
                }}
              >
                {typeof d.currentUsage === "number" && typeof d.thresholdUsage === "number"
                  ? `Uso actual: ${d.currentUsage} ${d.unit ?? ""} • Límite: ${d.thresholdUsage} ${d.unit ?? ""}`
                  : Number.isFinite(d.elapsedDays) && Number.isFinite(d.totalDays)
                    ? `Transcurrido: ${d.elapsedDays}/${d.totalDays} días`
                    : isFinite(d.daysRemaining)
                      ? `Quedan ${Math.max(0, d.daysRemaining)} días`
                      : "Progreso no disponible"}
              </Typography>
            )}
          </Box>
        ))}
      </Box>
    </Box>
  )
}
