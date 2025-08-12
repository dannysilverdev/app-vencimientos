// src/components/EntityCard.tsx
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
  usageLine?: string
}

const WARNING_PROGRESS = 0.85 // 85%

function formatDateISO(d: Date) {
  return d.toISOString().split("T")[0]
}

function getDeadlineStatus(d: Deadline): DeadlineStatus {
  const today = new Date() // ✅ Declarado una sola vez

  // --- Vencimientos por USO ---
  if (d.deadline_types.measure_by === "usage") {
    const unit = d.deadline_types.unit || d.frequency_unit || ""
    const hasCurrent = typeof d.current_usage === "number"
    const hasFreq = typeof d.frequency === "number" && isFinite(d.frequency) && d.frequency > 0

    // baseline: valor de uso en la fecha de last_done (si existe). Si no, cae al current_usage.
    const baseline = typeof d.baseline_usage === "number"
      ? d.baseline_usage
      : (hasCurrent ? d.current_usage! : 0)
    const current = hasCurrent ? d.current_usage! : NaN

    if (!hasCurrent || !hasFreq) {
      return {
        text: "Sin fecha",
        variant: "default",
        icon: <CheckCircle size={16} />,
        daysRemaining: Infinity,
        label: d.deadline_types.name,
        color: "#4caf50",
        usageLine: "Sin datos suficientes de uso",
      }
    }

    const effectiveUsage = Math.max(0, current - baseline)
    const progress = effectiveUsage / d.frequency

    // Proyección de fecha (si hay promedio diario)
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
    const usageLine = `Uso actual: ${currentRounded} ${unit} • Vence a los ${thresholdUsage} ${unit}`

    return {
      text,
      variant,
      icon,
      daysRemaining,
      label: d.deadline_types.name,
      color,
      usageLine,
    }
  }

  // --- Vencimientos por FECHA ---
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
  const matches = useMediaQuery(theme.breakpoints.down('sm'))

  const visibleFields = fieldValues
    .filter(f => f.entity_fields?.show_in_card && f.value?.trim())
    .slice(0, 3)

  const nearestDeadlines = deadlines
    .map(getDeadlineStatus)
    .sort((a, b) => a.daysRemaining - b.daysRemaining)

  return (
    <Box
      onClick={onClick}
      sx={{
        bgcolor: theme.palette.background.paper,
        borderRadius: 2,
        p: 2,
        boxShadow: 2,
        minWidth: 250,
        maxWidth: matches ? '100%' : 380,
        cursor: 'pointer',
        transition: 'transform 0.2s',
        '&:hover': { transform: 'scale(1.01)' },
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
      }}
    >
      <Typography variant="h6" fontWeight={600} gutterBottom>
        {entity.name}
      </Typography>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 1 }}>
        {nearestDeadlines.map((d, i) => (
          <Box key={i}>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                fontSize: '0.875rem',
                gap: 1,
                color: d.color,
              }}
            >
              {d.icon}
              <span>
                {d.daysRemaining < 0
                  ? `${d.label} - VENCIÓ el ${d.text}`
                  : `${d.label} - ${isFinite(d.daysRemaining) ? d.daysRemaining : '—'} días para vencer / ${d.text}`}
              </span>
            </Box>

            {d.usageLine && (
              <Typography
                variant="body2"
                sx={{ ml: 4, mt: 0.5, fontSize: '0.75rem', color: theme.palette.text.secondary }}
              >
                {d.usageLine}
              </Typography>
            )}
          </Box>
        ))}
      </Box>

      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 1 }}>
        {visibleFields.map((f, i) => (
          <Box
            key={i}
            sx={{
              px: 1.5,
              py: 0.5,
              bgcolor: theme.palette.mode === 'dark' ? 'grey.800' : 'grey.200',
              color: theme.palette.text.primary,
              borderRadius: 999,
              fontSize: '0.75rem',
              fontWeight: 500
            }}
          >
            {f.value}
          </Box>
        ))}
      </Box>
    </Box>
  )
}
