// src/components/EntityListItem.tsx
"use client"

import React, { useMemo, useState } from "react"
import { Box, Typography, IconButton, useTheme, useMediaQuery } from "@mui/material"
import { alpha } from "@mui/material/styles"
import { ChevronDown, ChevronUp } from "lucide-react"
import {
  type Deadline,
  type DeadlineStatus,
  clamp01,
  getDeadlineStatus,
  colorForVariant,
  labelForVariant,
} from "@/utils/deadlines"

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

type Props = {
  entity: Entity
  deadlines: Deadline[]
  fieldValues: FieldValue[]
  onClick?: () => void
}

export default function EntityListItem({ entity, deadlines, fieldValues, onClick }: Props) {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"))
  const [expanded, setExpanded] = useState(false)

  const active = useMemo(() => (deadlines || []).filter(d => d.status === "active"), [deadlines])

  // Statuses (idénticos a tarjeta)
  const statuses = useMemo<DeadlineStatus[]>(
    () => active.map(getDeadlineStatus).sort((a, b) => a.daysRemaining - b.daysRemaining),
    [active]
  )

  // Puntos: color/label según variant de la MISMA lógica + límite mobile
  const dots = useMemo(() => {
    return statuses.map((s, idx) => ({
      key: active[idx]?.id ?? String(idx),
      color: colorForVariant(s.variant, theme),
      label: labelForVariant(s.variant),
    }))
  }, [statuses, active, theme])

  const maxDots = isMobile ? 5 : 999
  const extraDots = Math.max(0, dots.length - maxDots)

  const handleExpandClick: React.MouseEventHandler<HTMLButtonElement> = (e) => {
    e.stopPropagation()
    setExpanded(prev => !prev)
  }

  // Campos visibles como en tarjetas
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

  const valuesLine = useMemo(() => {
    const values = (visibleFields || [])
      .map(f => (f.value ?? "").toString().trim())
      .filter(v => v.length > 0)
    return values.length > 0 ? values.join(" • ") : "—"
  }, [visibleFields])

  return (
    <Box
      onClick={onClick}
      role="button"
      tabIndex={0}
      sx={{
        p: { xs: 2, sm: 2.5 },          // mismo padding que tarjetas
        borderRadius: 2,
        border: "1px solid",
        borderColor: "divider",
        bgcolor: "background.paper",
        width: "100%",
        maxWidth: "100%",
        boxSizing: "border-box",        // el borde no suma ancho
        overflow: "hidden",
        "& *": { boxSizing: "border-box", minWidth: 0, maxWidth: "100%" }, // cinturón de seguridad
        "&:hover": {
          borderColor: theme.palette.primary.main,
          boxShadow: 2,
        },
        outline: "none",
        cursor: "pointer",
      }}
    >
      {/* ===== Cabecera ===== */}
      {isMobile ? (
        // ---- MOBILE: 2 líneas ----
        <>
          <Box display="flex" alignItems="center" gap={0.75} sx={{ minWidth: 0 }}>
            <Typography
              variant="subtitle1"
              noWrap
              sx={{
                flex: 1,
                fontWeight: 600,
                minWidth: 0,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                pr: 0.75,
              }}
              title={entity.name}
            >
              {entity.name}
            </Typography>

            {!expanded && dots.length > 0 && (
              <Box
                display="flex"
                alignItems="center"
                gap={0.5}
                sx={{ flexShrink: 0, maxWidth: "40%", minWidth: 0, overflow: "hidden" }}
              >
                {dots.slice(0, maxDots).map(dot => (
                  <Box
                    key={dot.key}
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
                {extraDots > 0 && (
                  <Typography variant="caption" sx={{ ml: 0.25, color: "text.secondary" }}>
                    +{extraDots}
                  </Typography>
                )}
              </Box>
            )}

            <IconButton
              aria-label={expanded ? "Contraer" : "Expandir"}
              size="small"
              onClick={handleExpandClick}
              sx={{ ml: 0.25, flexShrink: 0 }}
            >
              {expanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
            </IconButton>
          </Box>

          <Typography
            variant="body2"
            color="text.secondary"
            title={valuesLine}
            sx={{
              fontSize: "0.9rem",
              mt: 0.25,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {valuesLine}
          </Typography>
        </>
      ) : (
        // ---- DESKTOP/TABLET: 1 línea ----
        <Box display="flex" alignItems="center" gap={0.75} sx={{ minWidth: 0 }}>
          <Typography
            variant="subtitle1"
            noWrap
            sx={{
              flexGrow: 0,
              flexShrink: 1,
              flexBasis: "32%",
              maxWidth: "32%",
              fontWeight: 600,
              minWidth: 0,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              pr: 0.75,
            }}
            title={entity.name}
          >
            {entity.name}
          </Typography>

          <Typography
            variant="body2"
            color="text.secondary"
            noWrap
            title={valuesLine}
            sx={{ fontSize: "0.9rem", minWidth: 0, flex: "1 1 0" }}
          >
            {valuesLine}
          </Typography>

          {!expanded && dots.length > 0 && (
            <Box
              display="flex"
              alignItems="center"
              gap={0.5}
              sx={{ flexShrink: 1, maxWidth: "30%", minWidth: 0, overflow: "hidden" }}
            >
              {dots.map(dot => (
                <Box
                  key={dot.key}
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

          <IconButton
            aria-label={expanded ? "Contraer" : "Expandir"}
            size="small"
            onClick={handleExpandClick}
            sx={{ ml: 0.25, flexShrink: 0 }}
          >
            {expanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </IconButton>
        </Box>
      )}

      {/* ===== Contenido expandido (idéntico a tarjeta) ===== */}
      {expanded && (
        <Box mt={1.0} onClick={(e) => e.stopPropagation()}>
          <Box component="section" sx={{ borderTop: "1px dashed", borderColor: "divider", pt: 1 }}>
            <Typography variant="caption" sx={{ fontWeight: 700, color: "text.secondary" }}>
              Vencimientos
            </Typography>

            {statuses.length === 0 ? (
              <Typography variant="caption" color="text.secondary">Sin vencimientos</Typography>
            ) : (
              <Box sx={{ display: "flex", flexDirection: "column", gap: isMobile ? 0.5 : 0.75, mt: 0.5 }}>
                {statuses.map((d, idx) => (
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
