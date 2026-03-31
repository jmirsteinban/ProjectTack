package com.example.projecttrack.ui.theme

import androidx.compose.ui.graphics.Color

val Purple80 = Color(0xFFD0BCFF)
val PurpleGrey80 = Color(0xFFCCC2DC)
val Pink80 = Color(0xFFEFB8C8)

val Purple40 = Color(0xFF6650a4)
val PurpleGrey40 = Color(0xFF625b71)
val Pink40 = Color(0xFF7D5260)

val PillOnColor = Color.White
val PillOnColorMuted = Color.White.copy(alpha = 0.9f)

val StatusPendingColor = Color(0xFF7CB7FF) // Azul claro
val StatusInDevelopmentColor = Color(0xFFC389F5) // Morado rosado
val StatusQaReviewColor = Color(0xFFF4B67D) // Naranja pastel
val StatusCompletedQaColor = Color(0xFF7BD5A6) // Verde pastel
val StatusInProgressColor = StatusInDevelopmentColor // Compatibilidad con nombres anteriores
val StatusCompletedColor = StatusCompletedQaColor // Compatibilidad con nombres anteriores
val StatusUnknownColor = Color(0xFF6B7280)

val PriorityHighColor = Color(0xFFDC2626)
val PriorityMediumColor = Color(0xFFF59E0B)
val PriorityLowColor = Color(0xFF16A34A)
val PriorityUnknownColor = Color(0xFF6B7280)

val DashboardHeroGradientStart = Color(0xFF181825)
val DashboardHeroGradientMiddle = Color(0xFF342060)
val DashboardHeroGradientEnd = Color(0xFF4F2A90)
val DashboardHeroSubtitleColor = Color(0xFFE6E1FF)
val DashboardHeroProjectsButtonColor = Color(0xFFB9A8FF)
val DashboardHeroProjectsButtonContentColor = Color(0xFF2E1A63)
val DashboardHeroGradientColors = listOf(
    DashboardHeroGradientStart,
    DashboardHeroGradientMiddle,
    DashboardHeroGradientEnd,
)

val DashboardMetricAssignedColor = Color(0xFF3C2E74)
val DashboardMetricPendingColor = Color(0xFF8A4B1F)
val DashboardMetricInProgressColor = StatusInDevelopmentColor
val DashboardMetricQaReviewColor = StatusQaReviewColor
val DashboardMetricCompletedColor = Color(0xFF1E7D47)
val DashboardMetricHighPriorityColor = Color(0xFFA32626)

val ProjectStartBadgeColor = Color(0xFF3C2E74)
val ProjectStartBadgeLabelColor = Color(0xFFE4DCFF)

val UrlGroupQaColor = StatusInProgressColor
val UrlGroupStgColor = PriorityMediumColor
val UrlGroupProdColor = StatusCompletedColor
val FormErrorColor = Color(0xFFB42318)
val FormErrorCardBackgroundColor = Color(0xFFFFF0EE)
val FormErrorCardBorderColor = Color(0xFFF3C2BD)

fun statusPillColor(status: String): Color {
    return when (status.trim().lowercase()) {
        "pendiente" -> StatusPendingColor
        "en progreso", "en desarrollo" -> StatusInDevelopmentColor
        "en revision de qa", "en revisión de qa", "en revision qa", "revision qa" -> StatusQaReviewColor
        "completado", "completado (qa aprobado)", "qa aprobado" -> StatusCompletedQaColor
        else -> StatusUnknownColor
    }
}

fun priorityPillColor(priority: String): Color {
    return when (priority.trim().lowercase()) {
        "alta" -> PriorityHighColor
        "media" -> PriorityMediumColor
        "baja" -> PriorityLowColor
        else -> PriorityUnknownColor
    }
}
