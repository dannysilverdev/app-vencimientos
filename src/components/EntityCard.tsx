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
  color: string;
  text: string
  variant: "default" | "secondary" | "destructive"
  icon: React.ReactNode
  daysRemaining: number
  label: string
}

function getDeadlineStatus(d: Deadline): DeadlineStatus {
  const today = new Date()
  const last = new Date(d.last_done)
  const estimated = new Date(last)

  if (d.deadline_types.measure_by === "date") {
    estimated.setDate(estimated.getDate() + d.frequency)
  } else {
    const daily = d.usage_daily_average || 0
    const daysUntilDue = daily > 0 ? d.frequency / daily : 0
    estimated.setDate(estimated.getDate() + Math.round(daysUntilDue))
  }

  const diffDays = Math.ceil((estimated.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

  let variant: DeadlineStatus["variant"] = "default"
  let color = "#4caf50" // verde
  let icon = <CheckCircle size={16} />
  if (diffDays < 0) {
    variant = "destructive"
    color = "#f44336" // rojo
    icon = <XCircle size={16} />
  } else if (diffDays <= d.frequency * 0.3) {
    variant = "secondary"
    color = "#ff9800" // naranjo
    icon = <AlertTriangle size={16} />
  }

  return {
    text: estimated.toISOString().split("T")[0],
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
          <Box
            key={i}
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
                : `${d.label} - ${d.daysRemaining} días para vencer / ${d.text}`}
            </span>
          </Box>
        ))}
      </Box>

      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 1 }}>
        {visibleFields.map((f, i) => (
          <Box
            key={i}
            sx={(theme) => ({
              px: 1.5,
              py: 0.5,
              bgcolor: theme.palette.mode === 'dark' ? 'grey.800' : 'grey.200',
              color: theme.palette.text.primary,
              borderRadius: 999,
              fontSize: '0.75rem',
              fontWeight: 500
            })}
          >
            {f.value}
          </Box>
        ))}
      </Box>
    </Box>
  )
}
