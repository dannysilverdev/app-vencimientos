// src/components/EntityListItem.tsx
"use client"

import React, { useMemo, useState } from "react"
import { Box, Typography, IconButton, useTheme, useMediaQuery } from "@mui/material"
import { alpha } from "@mui/material/styles"
import { ChevronDown, ChevronUp, AlertTriangle, CheckCircle, XCircle, Info } from "lucide-react"

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
    show_in_card?: boolean
    showInCard?: boolean
    showincard?: boolean
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

// ======= Config (idéntica a EntityCard) =======
const WARNING_PROGRESS = 0.85            // “Próximo a vencer” (uso)
const EARLY_WARNING_PROGRESS = 0.7       // “Aviso” (uso)
const DEADLINE_WARNING_DAYS = 30         // “Pronto” (fecha)
const DEADLINE_EARLY_WARNING_DAYS = 60   // “Aviso” (fecha)
const MS_PER_DAY = 1000 * 60 * 60 * 24

const PRONTO_HEX = "#fb8c00"             // naranjo para puntos (≤30 días)
const AVISO_HEX  = "#fdd835"             // amarillo para puntos (≤60 días)

function clamp01(n: number) { return Math.max(0, Math.min(1, n)) }
function daysBetween(a: Date, b: Date) { return Math.ceil((a.getTime() - b.getTime()) / MS_PER_DAY) }
function formatDateISO(d: Date) { return d.toISOString().split("T")[0] }

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

function colorForVariant(variant: DeadlineStatus["variant"], theme: any) {
  switch (variant) {
    case "destructive":
      return theme.palette.error.main
    case "secondary":
      return theme.palette.warning.main // PRONTO
    case "warning":
      return "#ffb74d" // AVISO (fijo)
    default:
      return theme.palette.success.main
  }
}

function getDiffDays(next_due_date: string | null) {
  if (!next_due_date) return Infinity
  const today = new Date()
  const due = new Date(next_due_date)
  return Math.ceil((due.getTime() - today.getTime()) / MS_PER_DAY)
}

// === Misma lógica que EntityCard.getDeadlineStatus ===
function computeDeadlineStatus(d: Deadline): DeadlineStatus {
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
      color: variant === "warning" ? "#ffb74d" : "",
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
    const elapsed = Math.max(0, Math.min(total, daysBetween(new Date(), lastDone)))
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

export default function EntityListItem({ entity, deadlines, fieldValues, onClick }: Props) {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"))
  const [expanded, setExpanded] = useState(false)

  // Solo deadlines activos
  const active = useMemo(() => (deadlines || []).filter(d => d.status === "active"), [deadlines])

  // Puntos por vencimiento (solo para modo comprimido)
  const dots = useMemo(() => {
    return active.map(d => {
      const diffDays = getDiffDays(d.next_due_date)
      let color: string = theme.palette.success.main
      let label = "Al día"
      if (isFinite(diffDays)) {
        if (diffDays < 0) {
          color = theme.palette.error.main
          label = "Vencida"
        } else if (diffDays <= DEADLINE_WARNING_DAYS) {
          color = PRONTO_HEX
          label = "Pronto"
        } else if (diffDays <= DEADLINE_EARLY_WARNING_DAYS) {
          color = AVISO_HEX
          label = "Aviso"
        }
      }
      return { id: d.id, color, label }
    })
  }, [active, theme.palette.error.main, theme.palette.success.main])

  const handleExpandClick: React.MouseEventHandler<HTMLButtonElement> = (e) => {
    e.stopPropagation()
    setExpanded(prev => !prev)
  }

  // Campos visibles como en tarjetas (respeta flags si existen)
  const visibleFields = useMemo(() => {
    const arr = fieldValues || []
    const anyFlag = arr.some(f => f?.entity_fields && (
      typeof f.entity_fields.show_in_card === "boolean" ||
      typeof f.entity_fields.showInCard === "boolean" ||
      typeof (f.entity_fields as any).showincard === "boolean"
    ))
    if (anyFlag) {
      return arr.filter(f =>
        f?.entity_fields?.show_in_card === true ||
        f?.entity_fields?.showInCard === true ||
        (f?.entity_fields as any)?.showincard === true
      )
    }
    return arr
  }, [fieldValues])

  // Línea de valores (•) para ambos modos
  const collapsedValuesLine = useMemo(() => {
    const values = (visibleFields || [])
      .map(f => (f.value ?? "").toString().trim())
      .filter(v => v.length > 0)
    return values.length > 0 ? values.join(" • ") : "—"
  }, [visibleFields])

  // Statuses con MISMA lógica que la tarjeta
  const sortedStatuses = useMemo(() => {
    const statuses = active.map(computeDeadlineStatus)
    return statuses.sort((a, b) => a.daysRemaining - b.daysRemaining)
  }, [active])

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
      {/* ===== Fila superior: título + valores + (puntos si comprimido) + chevron ===== */}
      <Box display="flex" alignItems="center" gap={0.75}>
        {/* Título */}
        <Typography
          variant="subtitle1"
          noWrap
          sx={{
            flexGrow: 0,
            flexShrink: 1,
            flexBasis: { xs: "42%", sm: "32%" },
            maxWidth: { xs: "42%", sm: "32%" },
            fontWeight: 600,
            minWidth: 0,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            pr: 0.75
          }}
          title={entity.name}
        >
          {entity.name}
        </Typography>

        {/* Valores (•) — SIEMPRE inline */}
        <Typography
          variant="body2"
          color="text.secondary"
          noWrap
          title={collapsedValuesLine}
          sx={{ fontSize: isMobile ? "0.8rem" : "0.9rem", minWidth: 0, flex: 1 }}
        >
          {collapsedValuesLine}
        </Typography>

        {/* Puntos (solo comprimido) */}
        {!expanded && dots.length > 0 && (
          <Box
            display="flex"
            alignItems="center"
            gap={0.5}
            sx={{ flexShrink: 0, maxWidth: "30%" }}
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
          sx={{ ml: 0.25, flexShrink: 0 }}
        >
          {expanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </IconButton>
      </Box>

      {/* ===== Contenido expandido: DISEÑO CALCADO DE EntityCard ===== */}
      {expanded && (
        <Box mt={1.0} onClick={(e) => e.stopPropagation()}>
          <Box component="section" sx={{ borderTop: "1px dashed", borderColor: "divider", pt: 1 }}>
            <Typography variant="caption" sx={{ fontWeight: 700, color: "text.secondary" }}>
              Vencimientos
            </Typography>

            {sortedStatuses.length === 0 ? (
              <Typography variant="caption" color="text.secondary">Sin vencimientos</Typography>
            ) : (
              <Box sx={{ display: "flex", flexDirection: "column", gap: isMobile ? 0.5 : 0.75, mt: 0.5 }}>
                {sortedStatuses.map((d, idx) => (
                  <Box
                    key={idx}
                    sx={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 0.25,
                      p: isMobile ? 0.5 : 0.75,
                      borderRadius: 2,
                      bgcolor: alpha(colorForVariant(d.variant, theme), 0.05),
                      border: `1px solid ${alpha(colorForVariant(d.variant, theme), 0.15)}`,
                      transition: "all 0.2s ease",
                    }}
                  >
                    {/* Título + icono */}
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Box sx={{ color: colorForVariant(d.variant, theme), display: "flex", alignItems: "center" }}>
                        {d.icon}
                      </Box>
                      <Typography
                        variant="subtitle2"
                        sx={{
                          fontWeight: 700,
                          color: colorForVariant(d.variant, theme),
                          fontSize: isMobile ? "0.85rem" : "0.9rem",
                          flex: 1,
                        }}
                        title={d.unit ? `${d.label} (${d.unit})` : d.label}
                      >
                        {d.unit ? `${d.label} (${d.unit})` : d.label}
                      </Typography>
                    </Box>

                    {/* Barra + porcentaje */}
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
                          bgcolor: alpha(colorForVariant(d.variant, theme), 0.15),
                          overflow: "hidden",
                          boxShadow: `inset 0 1px 2px ${alpha(theme.palette.common.black, 0.1)}`,
                          ...(d.variant === "destructive" && {
                            backgroundImage: `repeating-linear-gradient(
                              45deg,
                              ${alpha(colorForVariant(d.variant, theme), 0.2)} 0px,
                              ${alpha(colorForVariant(d.variant, theme), 0.2)} 8px,
                              ${alpha(colorForVariant(d.variant, theme), 0.1)} 8px,
                              ${alpha(colorForVariant(d.variant, theme), 0.1)} 16px
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
                            bgcolor: colorForVariant(d.variant, theme),
                            borderRadius: 999,
                            transition: "width 0.6s cubic-bezier(0.4, 0, 0.2, 1)",
                            boxShadow:
                              clamp01(d.progress ?? 0) * 100 > 5
                                ? `0 0 8px ${alpha(colorForVariant(d.variant, theme), 0.4)}`
                                : "none",
                          }}
                        />
                      </Box>
                      <Typography
                        variant="caption"
                        sx={{
                          fontWeight: 600,
                          color: colorForVariant(d.variant, theme),
                          minWidth: isMobile ? 28 : 34,
                          textAlign: "right",
                          fontSize: isMobile ? "0.7rem" : "0.75rem",
                        }}
                      >
                        {Math.round(clamp01(d.progress ?? 0) * 100)}%
                      </Typography>
                    </Box>

                    {/* Detalles */}
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
                  </Box>
                ))}
              </Box>
            )}
          </Box>
        </Box>
      )}
    </Box>
  )
}
