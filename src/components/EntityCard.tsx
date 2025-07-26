// src/components/EntityCard.tsx
import {
  Box,
  Typography,
  Stack,
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
  let icon = <CheckCircle size={16} />
  if (diffDays < 0) {
    variant = "destructive"
    icon = <XCircle size={16} />
  } else if (diffDays <= d.frequency * 0.3) {
    variant = "secondary"
    icon = <AlertTriangle size={16} />
  }

  return {
    text: estimated.toISOString().split("T")[0],
    variant,
    icon,
    daysRemaining: diffDays,
    label: d.deadline_types.name,
  }
}

type Props = {
  entity: Entity
  deadlines: Deadline[]
  fieldValues?: FieldValue[]
  onClick: () => void
}

export default function EntityCard({ entity, deadlines, fieldValues, onClick }: Props) {
  const nearestDeadlines = deadlines
    .map(getDeadlineStatus)
    .sort((a, b) => a.daysRemaining - b.daysRemaining)
    .slice(0, 2)

  const visibleFields = fieldValues?.filter(f =>
    f.entity_fields?.show_in_card &&
    f.value != null &&
    String(f.value).trim() !== ''
  ) || []

  return (
    <Box onClick={onClick} sx={{ border: '1px solid #ddd', borderRadius: 2, p: 2, cursor: 'pointer', mb: 2 }}>
      <Typography variant="h6" fontWeight="bold">{entity.name}</Typography>

      {nearestDeadlines.map((deadline, i) => (
        <Box
          key={i}
          sx={{
            mt: 2,
            p: 1.5,
            borderRadius: 1,
            bgcolor:
              deadline.variant === 'destructive' ? '#fdecea'
              : deadline.variant === 'secondary' ? '#fff4e5'
              : '#edf7ed'
          }}
        >
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              {deadline.icon}
              <Typography variant="subtitle2" fontWeight="bold" sx={{ ml: 1 }}>
                {deadline.label}
              </Typography>
            </Box>
            <Box sx={{ ml: { sm: 3 } }}>
              {deadline.daysRemaining < 0 ? (
                <Typography variant="body2" color="error">
                  VENCIÓ el {new Date(deadline.text).toLocaleDateString()}
                </Typography>
              ) : (
                <>
                  <Typography variant="body2">
                    {deadline.daysRemaining} días restantes
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    (vence el {new Date(deadline.text).toLocaleDateString()})
                  </Typography>
                </>
              )}
            </Box>
          </Stack>
        </Box>
      ))}

      {visibleFields.length > 0 && (
        <Box sx={{ mt: 2, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
          {visibleFields.map((f, i) => (
            <Box
              key={i}
              sx={{
                px: 1.5,
                py: 0.5,
                bgcolor: 'grey.200',
                borderRadius: 999,
                fontSize: '0.75rem',
                fontWeight: 500
              }}
            >
              {f.value}
            </Box>
          ))}
        </Box>
      )}
    </Box>
  )
}
