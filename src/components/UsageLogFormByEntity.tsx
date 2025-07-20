"use client"

import { useState, useEffect } from "react"
import {
  Stack,
  Typography,
  TextField,
  Button,
  Alert,
} from "@mui/material"
import { LocalizationProvider } from "@mui/x-date-pickers"
import { DatePicker } from "@mui/x-date-pickers/DatePicker"
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs"
import dayjs from "dayjs"
import { supabase } from "@/lib/supabaseClient"

type Props = {
  entity: {
    id: string
    name: string
  }
}

export default function UsageLogFormByEntity({ entity }: Props) {
  const [date, setDate] = useState(dayjs())
  const [value, setValue] = useState<number | "">(0)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const [lastLog, setLastLog] = useState<{ date: string; value: number } | null>(null)

  useEffect(() => {
    // Al cambiar de entidad, se reinicia el formulario
    setDate(dayjs())
    setValue("")
    setMessage(null)
    setLastLog(null)

    const fetchLastLog = async () => {
      const { data } = await supabase
        .from("usage_logs")
        .select("date, value")
        .eq("entity_id", entity.id)
        .order("date", { ascending: false })
        .limit(1)

      if (data && data.length > 0) {
        setLastLog(data[0])
      }
    }

    fetchLastLog()
  }, [entity.id])

  const handleSubmit = async () => {
    setMessage(null)

    const numericValue = typeof value === "number" ? value : parseFloat(value)

    if (isNaN(numericValue)) {
      setMessage({ type: "error", text: "⚠️ Ingresa un valor numérico válido." })
      return
    }

    const { error } = await supabase
      .from("usage_logs")
      .insert([
        {
          entity_id: entity.id,
          date: date.toISOString().split("T")[0],
          value: numericValue
        }
      ])

    if (error) {
      console.error("Error al guardar:", error.message)
      setMessage({ type: "error", text: "❌ Error al guardar: " + (error.message || "Desconocido") })
    } else {
      setMessage({ type: "success", text: "✅ Registro guardado." })
      setValue("")
      setLastLog({ date: date.toISOString().split("T")[0], value: numericValue })
    }
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Stack spacing={2} mt={2} maxWidth={400}>
        <Typography variant="h6">{entity.name}</Typography>

        <DatePicker
          label="Fecha"
          value={date}
          onChange={(newDate) => newDate && setDate(newDate)}
        />

        <TextField
          label="Valor acumulado (ej: km, horas, etc)"
          type="number"
          value={value}
          onChange={(e) => {
            const newVal = e.target.value
            setValue(newVal === "" ? "" : parseFloat(newVal))
          }}
        />

        <Button variant="contained" onClick={handleSubmit}>
          Registrar
        </Button>

        {message && (
          <Alert severity={message.type}>{message.text}</Alert>
        )}

        {lastLog && (
          <Typography variant="body2" color="text.secondary">
            Último: {lastLog.value} el {lastLog.date}
          </Typography>
        )}
      </Stack>
    </LocalizationProvider>
  )
}
