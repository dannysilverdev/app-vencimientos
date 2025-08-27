// src/components/EntityCard.tsx
"use client"

import type React from "react"
import { useMemo, useState } from "react"
import { Box, Typography, useTheme, useMediaQuery } from "@mui/material"
import { alpha } from "@mui/material/styles"
import { ChevronDown, ChevronUp } from "lucide-react"

import {
  type Deadline,
  type DeadlineStatus,
  clamp01,
  getDeadlineStatus,
  colorForVariant,
} from "@/utils/deadlines"

type Entity = {
  id: string
  name: string
  type_id: string
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

type Props = {
  entity: Entity
  deadlines: Deadline[]
  fieldValues?: FieldValue[]
  onClick?: () => void
}

export default function EntityCard({ entity, deadlines, fieldValues = [], onClick }: Props) {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"))
  const [expanded, setExpanded] = useState(false)

  // Custom fields visibles (exactamente como en tarjeta)
  const chips = useMemo(
    () => fieldValues.filter((f) => f.entity_fields?.show_in_card && f.value?.trim()),
    [fieldValues]
  )
  const visibleChips = chips.slice(0, isMobile ? 4 : 6)
  const hiddenChipsCount = Math.max(0, chips.length - visibleChips.length)

  // Deadlines ordenados (misma lógica/colores que el helper compartido)
  const sorted = useMemo<DeadlineStatus[]>(
    () =>
      deadlines
        .filter((d) => d.status === "active")
        .map(getDeadlineStatus)
        .sort((a, b) => a.daysRemaining - b.daysRemaining),
    [deadlines]
  )

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
        if (e.key === "Enter" || e.key === " ") onClick?.()
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
        gap: isMobile ? 1.25 : 1.75,
        position: "relative",
      }}
    >
      {/* Botón flotante para expandir/contraer detalles de cada deadline */}
      {sorted.length > 0 && (
        <Box
          onClick={(e) => {
            e.stopPropagation()
            setExpanded((v) => !v)
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
          title={expanded ? "Mostrar menos" : "Mostrar más"}
        >
          {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
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
            pr: 5, // espacio para el botón flotante
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
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          gap: isMobile ? 0.5 : 0.75,
        }}
      >
        {sorted.map((d, i) => (
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
            {/* Título + ícono (solo expandido) */}
            {expanded && (
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
            )}

            {/* Compacto: etiqueta + barra  /  Expandido: barra + porcentaje */}
            {!expanded ? (
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Typography
                  variant="caption"
                  noWrap
                  sx={{
                    flexBasis: "38%",
                    flexGrow: 0,
                    flexShrink: 1,
                    color: colorFor(d.variant),
                    fontWeight: 600,
                    letterSpacing: 0.1,
                    minWidth: 0,
                  }}
                  title={d.unit ? `${d.label} (${d.unit})` : d.label}
                >
                  {d.unit ? `${d.label} (${d.unit})` : d.label}
                </Typography>

                <Box
                  aria-label={`${d.label}: ${Math.round(clamp01(d.progress ?? 0) * 100)}%`}
                  role="progressbar"
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={Math.round(clamp01(d.progress ?? 0) * 100)}
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
              </Box>
            ) : (
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
            )}

            {/* Detalles (solo expandido) */}
            {expanded && (
              <>
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
              </>
            )}
          </Box>
        ))}
      </Box>
    </Box>
  )
}
