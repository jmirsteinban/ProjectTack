package com.example.projecttrack.ui.theme

import android.os.Build
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.dynamicDarkColorScheme
import androidx.compose.material3.dynamicLightColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.Immutable
import androidx.compose.runtime.staticCompositionLocalOf
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext

@Immutable
data class ProjectTrackCustomColors(
    val qa: Color = UrlGroupQaColor,
    val stg: Color = UrlGroupStgColor,
    val prod: Color = UrlGroupProdColor,
    val badge: Color = ProjectStartBadgeColor,
    val onBadge: Color = ProjectStartBadgeLabelColor,
    val heroButton: Color = DashboardHeroProjectsButtonColor,
    val onHeroButton: Color = DashboardHeroProjectsButtonContentColor,
    val pillOn: Color = PillOnColor
)

val LocalProjectTrackColors = staticCompositionLocalOf { ProjectTrackCustomColors() }

private val DarkColorScheme = darkColorScheme(
    primary = DashboardHeroProjectsButtonColor,
    onPrimary = DashboardHeroProjectsButtonContentColor,
    secondary = PurpleGrey80,
    tertiary = Pink80,
    background = DashboardHeroGradientStart,
    surface = Color(0xFF49454F),
    onBackground = Color.White,
    onSurface = Color.White,
    surfaceVariant = Color(0xFF2E2E3D),
    onSurfaceVariant = Color(0xFFB0B0C0),
    outline = Color(0xFF444455)
)

private val LightColorScheme = lightColorScheme(
    primary = DashboardHeroGradientMiddle,
    onPrimary = Color.White,
    secondary = PurpleGrey40,
    tertiary = Pink40,
    background = Color(0xFFFDFBFF),
    surface = Color.White,
    onBackground = Color(0xFF1B1B23),
    onSurface = Color(0xFF1B1B23)
)

@Composable
fun ProjectTrackTheme(
    darkTheme: Boolean = isSystemInDarkTheme(),
    dynamicColor: Boolean = false, // Deshabilitamos dynamicColor por defecto para mantener tu identidad visual
    content: @Composable () -> Unit
) {
    val colorScheme = when {
        dynamicColor && Build.VERSION.SDK_INT >= Build.VERSION_CODES.S -> {
            val context = LocalContext.current
            if (darkTheme) dynamicDarkColorScheme(context) else dynamicLightColorScheme(context)
        }

        darkTheme -> DarkColorScheme
        else -> LightColorScheme
    }

    val customColors = ProjectTrackCustomColors()

    CompositionLocalProvider(LocalProjectTrackColors provides customColors) {
        MaterialTheme(
            colorScheme = colorScheme,
            typography = Typography,
            shapes = Shapes,
            content = content
        )
    }
}

val MaterialTheme.extendedColors: ProjectTrackCustomColors
    @Composable
    get() = LocalProjectTrackColors.current
