package com.example.projecttrack.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.offset
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Person
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.FilledTonalButton
import androidx.compose.material3.DropdownMenu
import androidx.compose.material3.DropdownMenuItem
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.unit.dp

@Composable
fun ScreenHeader(
    title: String,
    breadcrumb: String,
    secondaryActionLabel: String? = null,
    onSecondaryAction: (() -> Unit)? = null,
    secondaryActionIcon: ImageVector? = null,
    primaryActionLabel: String? = null,
    onPrimaryAction: (() -> Unit)? = null,
    primaryActionIcon: ImageVector? = null,
    tertiaryActionLabel: String? = null,
    onTertiaryAction: (() -> Unit)? = null,
    tertiaryActionIcon: ImageVector? = null,
    showUserAvatar: Boolean = false,
    onUserDashboardClick: (() -> Unit)? = null,
    onUserProfileClick: (() -> Unit)? = null,
    onUserLogoutClick: (() -> Unit)? = null,
    modifier: Modifier = Modifier,
) {
    val secondaryAction = if (secondaryActionLabel != null && onSecondaryAction != null) {
        HeaderAction(
            label = secondaryActionLabel,
            onClick = onSecondaryAction,
            icon = secondaryActionIcon,
        )
    } else {
        null
    }
    val primaryAction = if (primaryActionLabel != null && onPrimaryAction != null) {
        HeaderAction(
            label = primaryActionLabel,
            onClick = onPrimaryAction,
            icon = primaryActionIcon,
        )
    } else {
        null
    }
    val tertiaryAction = if (tertiaryActionLabel != null && onTertiaryAction != null) {
        HeaderAction(
            label = tertiaryActionLabel,
            onClick = onTertiaryAction,
            icon = tertiaryActionIcon,
        )
    } else {
        null
    }

    Box(
        modifier = modifier
            .fillMaxWidth()
            .statusBarsPadding(),
    ) {
        Box(
            modifier = Modifier
                .align(Alignment.BottomCenter)
                .offset(y = 1.dp)
                .fillMaxWidth()
                .height(3.dp)
                .background(
                    brush = Brush.verticalGradient(
                        colors = listOf(
                            Color.Black.copy(alpha = 0.05f),
                            Color.Black.copy(alpha = 0.02f),
                            Color.Transparent,
                        ),
                    ),
                ),
        )
        Surface(
            modifier = Modifier.fillMaxWidth(),
            tonalElevation = 0.dp,
        ) {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(start = 16.dp, end = 16.dp, top = 8.dp, bottom = 12.dp),
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Column(
                    modifier = Modifier.weight(1f),
                ) {
                    Text(
                        text = title,
                        style = MaterialTheme.typography.headlineMedium,
                    )
                    Text(
                        text = breadcrumb,
                        style = MaterialTheme.typography.bodySmall,
                    )
                }

                if (secondaryAction != null || primaryAction != null || tertiaryAction != null || showUserAvatar) {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(8.dp),
                    ) {
                        if (secondaryAction != null || primaryAction != null || tertiaryAction != null) {
                            Row(
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.spacedBy(6.dp),
                            ) {
                                secondaryAction?.let { action ->
                                    HeaderActionButton(action = action)
                                }
                                primaryAction?.let { action ->
                                    HeaderActionButton(action = action)
                                }
                                tertiaryAction?.let { action ->
                                    HeaderActionButton(action = action)
                                }
                            }
                        }

                        if (showUserAvatar) {
                            HeaderUserAvatarMenu(
                                onDashboardClick = onUserDashboardClick,
                                onProfileClick = onUserProfileClick,
                                onLogoutClick = onUserLogoutClick,
                            )
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun HeaderActionButton(action: HeaderAction) {
    FilledTonalButton(
        onClick = action.onClick,
        modifier = Modifier.height(34.dp),
        shape = MaterialTheme.shapes.medium, // Aplicamos el radius profesional de 12dp
        contentPadding = PaddingValues(horizontal = 10.dp, vertical = 0.dp),
    ) {
        action.icon?.let { icon ->
            Icon(
                imageVector = icon,
                contentDescription = null,
                modifier = Modifier.size(ButtonDefaults.IconSize),
            )
            androidx.compose.foundation.layout.Spacer(modifier = Modifier.width(4.dp))
        }
        Text(
            text = action.label,
            style = MaterialTheme.typography.labelMedium,
            maxLines = 1,
        )
    }
}

private data class HeaderAction(
    val label: String,
    val onClick: () -> Unit,
    val icon: ImageVector?,
)

@Composable
private fun HeaderUserAvatarMenu(
    onDashboardClick: (() -> Unit)?,
    onProfileClick: (() -> Unit)?,
    onLogoutClick: (() -> Unit)?,
    modifier: Modifier = Modifier,
) {
    var isMenuExpanded by remember { mutableStateOf(false) }

    Box(modifier = modifier) {
        HeaderUserAvatar(
            onClick = { isMenuExpanded = true },
        )

        DropdownMenu(
            expanded = isMenuExpanded,
            onDismissRequest = { isMenuExpanded = false },
        ) {
            onDashboardClick?.let { callback ->
                DropdownMenuItem(
                    text = { Text("Dashboard") },
                    onClick = {
                        isMenuExpanded = false
                        callback()
                    },
                )
            }
            onProfileClick?.let { callback ->
                DropdownMenuItem(
                    text = { Text("Perfil") },
                    onClick = {
                        isMenuExpanded = false
                        callback()
                    },
                )
            }
            onLogoutClick?.let { callback ->
                DropdownMenuItem(
                    text = { Text("Cerrar sesion") },
                    onClick = {
                        isMenuExpanded = false
                        callback()
                    },
                )
            }
        }
    }
}

@Composable
private fun HeaderUserAvatar(
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
) {
    Surface(
        modifier = modifier.size(40.dp),
        tonalElevation = 1.dp,
        shape = CircleShape,
    ) {
        IconButton(onClick = onClick) {
            Icon(
                imageVector = Icons.Filled.Person,
                contentDescription = "Perfil",
                modifier = Modifier.size(22.dp),
            )
        }
    }
}
