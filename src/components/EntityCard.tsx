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

  // Mobile: un poco más denso para 2 por fila
  const mobilePadding = 1.25
  const mobileGap = 1.0
  const titleMobileSize = "1rem"

  const chips = useMemo(
    () => fieldValues.filter((f) => f.entity_fields?.show_in_card && f.value?.trim()),
    [fieldValues],
  )
  // Mobile: mostrar un chip menos para evitar cortes en 2-col
  const visibleChips = chips.slice(0, isMobile ? 3 : 6)
  const hiddenChipsCount = Math.max(0, chips.length - visibleChips.length)

  const sorted = useMemo<DeadlineStatus[]>(
    () =>
      deadlines
        .filter((d) => d.status === "active")
        .map(getDeadlineStatus)
        .sort((a, b) => a.daysRemaining - b.daysRemaining),
    [deadlines],
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
        borderRadius: { xs: 2, sm: 3 },
        p: { xs: mobilePadding, sm: 2, md: 2.5 },  // ✅ más compacto en mobile
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
          transform: { xs: "translateY(-1px)", sm: "translateY(-4px)" },
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
          transform: { xs: "translateY(0px)", sm: "translateY(-2px)" },
        },
        display: "flex",
        flexDirection: "column",
        gap: { xs: mobileGap, sm: 1.25, md: 1.75 }, // ✅ menos gap en mobile
        position: "relative",
        boxSizing: "border-box",
      }}
    >
      {/* Toggle expand */}
      {sorted.length > 0 && (
        <Box
          onClick={(e) => {
            e.stopPropagation()
            setExpanded((v) => !v)
          }}
          sx={{
            position: "absolute",
            top: { xs: 8, sm: 12, md: 16 },
            right: { xs: 8, sm: 12, md: 16 },
            zIndex: 1,
            width: 30,
            height: 30,
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
            fontSize: { xs: titleMobileSize, sm: "1.15rem", md: "1.25rem" }, // ✅ más chico en mobile
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
              fontSize: { xs: "0.75rem", sm: "0.8rem", md: "0.85rem" }, // ✅ más chico en mobile
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
      <Box sx={{ display: "flex", flexDirection: "column", gap: { xs: 0.5, sm: 0.75 } }}>
        {sorted.map((d, i) => (
          <Box
            key={i}
            sx={{
              display: "flex",
              flexDirection: "column",
              gap: 0.25,
              p: { xs: 0.5, sm: 0.75 },
              borderRadius: 2,
              bgcolor: alpha(colorFor(d.variant), 0.05),
              border: `1px solid ${alpha(colorFor(d.variant), 0.15)}`,
              transition: "all 0.2s ease",
            }}
          >
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
                    fontSize: { xs: "0.82rem", sm: "0.9rem" }, // ✅ más chico en mobile
                    flex: 1,
                  }}
                >
                  {d.unit ? `${d.label} (${d.unit})` : d.label}
                </Typography>
              </Box>
            )}

            {!expanded ? (
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Typography
                  variant="caption"
                  noWrap
                  sx={{
                    flexBasis: { xs: "42%", sm: "38%" }, // ✅ un poco más de ancho para label en mobile
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
                    height: { xs: 5, sm: 6, md: 8 }, // ✅ barra más baja en mobile
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
                sx={{ mt: 0.5, display: "flex", alignItems: "center", gap: 1.25 }}
              >
                <Box
                  sx={{
                    flex: 1,
                    position: "relative",
                    height: { xs: 5, sm: 6, md: 8 },
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
                    minWidth: { xs: 26, sm: 28, md: 34 },
                    textAlign: "right",
                    fontSize: { xs: "0.68rem", sm: "0.72rem", md: "0.75rem" },
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
                    fontSize: { xs: "0.78rem", sm: "0.82rem", md: "0.85rem" },
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
                    fontSize: { xs: "0.68rem", sm: "0.72rem", md: "0.75rem" },
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
