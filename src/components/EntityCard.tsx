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
  Calendar,
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

type FieldValue = {
  field_id: string
  value: string | null
  entity_fields: {
    name: string
    field_type: string
    entity_type_id: string
  }
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

export default function EntityCard({ entity, deadlines, fieldValues = [], onClick }: Props) {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"))

  let mainDeadline: Deadline | null = null
  let mainStatus: DeadlineStatus | null = null

  if (deadlines.length > 0) {
    mainDeadline = deadlines
      .map(d => ({ deadline: d, status: getDeadlineStatus(d) }))
      .sort((a, b) => a.status.daysRemaining - b.status.daysRemaining)[0].deadline
    mainStatus = getDeadlineStatus(mainDeadline)
  }

  const bgColor =
    mainStatus?.variant === "destructive"
      ? "#ffebee"
      : mainStatus?.variant === "secondary"
      ? "#fff8e1"
      : "#e8f5e9"

  const visibleFields = fieldValues.filter(fv => fv.value !== null && fv.value !== "")

  return (
    <Box
      onClick={onClick}
      sx={{
        flex: { xs: "1 1 100%", sm: "1 1 300px" },
        maxWidth: { xs: "100%", sm: 360 },
        borderRadius: 3,
        cursor: "pointer",
        transition: "all 0.2s",
        bgcolor: bgColor,
        p: 2,
        ":hover": {
          boxShadow: 6,
          transform: "scale(1.01)",
        },
        display: "flex",
        flexDirection: "column",
        gap: 1,
      }}
    >
      <Box display="flex" alignItems="center" gap={2}>
        <Box>{mainStatus?.icon || <Calendar size={28} />}</Box>
        <Box flexGrow={1} overflow="hidden">
          <Typography
            variant="subtitle1"
            fontWeight={600}
            noWrap
            sx={{ fontSize: isMobile ? "1rem" : "1.1rem" }}
          >
            {entity.name}
          </Typography>

          {mainStatus && (
            <Typography
              variant="body2"
              color="text.secondary"
              noWrap
              sx={{ fontSize: isMobile ? "0.8rem" : "0.9rem" }}
            >
              {mainStatus.label} — {mainStatus.text}
            </Typography>
          )}

          {deadlines.length > 1 && (
            <Typography
              variant="caption"
              color="text.disabled"
              sx={{ fontSize: isMobile ? "0.7rem" : "0.8rem" }}
            >
              {deadlines.length - 1} venc. adicionales
            </Typography>
          )}
        </Box>
      </Box>

      {visibleFields.length > 0 && (
        <Box mt={1}>
          {visibleFields.map(fv => (
            <Typography
              key={fv.field_id}
              variant="caption"
              color="text.secondary"
              sx={{ display: "block", fontSize: "0.75rem" }}
            >
              {fv.entity_fields.name}: {fv.value}
            </Typography>
          ))}
        </Box>
      )}
    </Box>
  )
}
