// src/utils/deadlines.tsx
"use client"

import type React from "react"
import { AlertTriangle, CheckCircle, XCircle, Info } from "lucide-react"
import type { Theme } from "@mui/material/styles"

// ======= Config (fuente de la verdad) =======
export const WARNING_PROGRESS = 0.85            // “Próximo a vencer” (uso)
export const EARLY_WARNING_PROGRESS = 0.7       // “Aviso” (uso)
export const DEADLINE_WARNING_DAYS = 30         // “Pronto” (fecha)
export const DEADLINE_EARLY_WARNING_DAYS = 60   // “Aviso” (fecha)
export const MS_PER_DAY = 1000 * 60 * 60 * 24

export function clamp01(n: number) {
  return Math.max(0, Math.min(1, n))
}
export function daysBetween(a: Date, b: Date) {
  return Math.ceil((a.getTime() - b.getTime()) / MS_PER_DAY)
}
export function formatDateISO(d: Date) {
  return d.toISOString().split("T")[0]
}

// Colores EXACTOS (la tarjeta manda)
export function colorForVariant(
  variant: DeadlineStatus["variant"],
  theme: Theme
) {
  switch (variant) {
    case "destructive":
      return theme.palette.error.main
    case "secondary":
      return theme.palette.warning.main // PRONTO (naranjo del theme)
    case "warning":
      return "#ffb74d" // AVISO fijo solicitado
    default:
      return theme.palette.success.main
  }
}

// ===== Tipos que usan los componentes =====
export type Deadline = {
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
    measure_by: "usage" | "date" | string
    unit: string | null
  }
}

export type DeadlineStatus = {
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

// ===== Lógica 1:1 (calcada de EntityCard) =====
export function getDeadlineStatus(d: Deadline): DeadlineStatus {
  const today = new Date()

  // ---- Medido por uso ----
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

  // ---- Medido por fecha ----
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

// Etiqueta legible para puntos
export function labelForVariant(variant: DeadlineStatus["variant"]) {
  switch (variant) {
    case "destructive": return "Vencida"
    case "secondary":   return "Pronto"
    case "warning":     return "Aviso"
    default:            return "Al día"
  }
}
