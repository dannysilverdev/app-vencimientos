import { Box, TextField, Typography } from "@mui/material"

type Field = {
  field_id: string
  value: string
  entity_fields?: {
    name: string
    field_type: string
  } | null
}

type Props = {
  fieldValues: Field[]
  onChange: (fieldId: string, value: string) => void
}

export default function CustomFieldsForm({ fieldValues, onChange }: Props) {
  if (!fieldValues || fieldValues.length === 0) {
    return null
  }

  return (
    <Box sx={{ mb: 3 }}>
      <Typography variant="h6" gutterBottom>Campos personalizados</Typography>

      {fieldValues.map(field => {
        const label = field.entity_fields?.name || 'Campo sin nombre'
        const type = field.entity_fields?.field_type === 'number' ? 'number' : 'text'

        return (
          <TextField
            key={field.field_id}
            label={label}
            type={type}
            value={field.value ?? ''}
            onChange={(e) => onChange(field.field_id, e.target.value)}
            fullWidth
            sx={{ mb: 2 }}
          />
        )
      })}
    </Box>
  )
}
