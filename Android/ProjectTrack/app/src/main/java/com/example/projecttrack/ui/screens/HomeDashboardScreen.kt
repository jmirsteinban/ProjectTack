package com.example.projecttrack.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.BoxWithConstraints
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.List
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.lerp
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import com.example.projecttrack.data.Change
import com.example.projecttrack.data.ProjectTodoNote
import com.example.projecttrack.ui.theme.DashboardHeroGradientColors
import com.example.projecttrack.ui.theme.DashboardHeroSubtitleColor
import com.example.projecttrack.ui.theme.DashboardMetricAssignedColor
import com.example.projecttrack.ui.theme.DashboardMetricCompletedColor
import com.example.projecttrack.ui.theme.DashboardMetricHighPriorityColor
import com.example.projecttrack.ui.theme.DashboardMetricInProgressColor
import com.example.projecttrack.ui.theme.DashboardMetricPendingColor
import com.example.projecttrack.ui.theme.DashboardMetricQaReviewColor
import com.example.projecttrack.ui.theme.ProjectTrackTheme
import com.example.projecttrack.ui.theme.extendedColors
import com.example.projecttrack.ui.theme.priorityPillColor
import com.example.projecttrack.ui.theme.statusPillColor

@Composable
fun HomeDashboardScreen(
    assignedChanges: List<Change>,
    mentionedNotes: List<ProjectTodoNote>,
    projectNameById: Map<String, String>,
    changeNameById: Map<String, String>,
    activeUserDisplayName: String,
    activeUserId: String,
    onGoToProjects: () -> Unit,
    onChangeClick: (Change) -> Unit,
    onMentionNoteClick: (ProjectTodoNote) -> Unit,
    modifier: Modifier = Modifier,
) {
    val sortedAssigned = assignedChanges.sortedWith(
        compareBy<Change> { statusRank(it.status) }
            .thenBy { priorityWeight(it.priority) }
            .thenBy { it.name },
    )
    val openItems = sortedAssigned.filter { canonicalStatus(it.status) != "completado_qa" }
    val highPriorityCount = openItems.count { normalizePriority(it.priority) == "alta" }
    val completedCount = sortedAssigned.count { canonicalStatus(it.status) == "completado_qa" }
    val inDevelopmentCount = sortedAssigned.count { canonicalStatus(it.status) == "en_desarrollo" }
    val qaReviewCount = sortedAssigned.count { canonicalStatus(it.status) == "en_revision_qa" }
    val pendingCount = sortedAssigned.count { canonicalStatus(it.status) == "pendiente" }

    LazyColumn(
        modifier = modifier.fillMaxSize(),
        contentPadding = PaddingValues(start = 16.dp, end = 16.dp, bottom = 16.dp),
        verticalArrangement = Arrangement.spacedBy(14.dp),
    ) {
        item {
            DashboardHeroCard(
                activeUserDisplayName = activeUserDisplayName,
                activeUserId = activeUserId,
                todoCount = openItems.size,
                onGoToProjects = onGoToProjects,
            )
        }

        item {
            MetricStrip(
                totalAssigned = sortedAssigned.size,
                pendingCount = pendingCount,
                inDevelopmentCount = inDevelopmentCount,
                qaReviewCount = qaReviewCount,
                completedCount = completedCount,
                highPriorityCount = highPriorityCount,
            )
        }

        when {
            activeUserId.isBlank() -> {
                item {
                    InfoPanel(
                        title = "Sesion sin usuario",
                        message = "No se pudo obtener el usuario autenticado para cargar asignaciones.",
                    )
                }
            }

            else -> {
                item {
                    DashboardContent(
                        todoItems = openItems,
                        projectNameById = projectNameById,
                        mentionedNotes = mentionedNotes,
                        changeNameById = changeNameById,
                        onChangeClick = onChangeClick,
                        onMentionNoteClick = onMentionNoteClick,
                    )
                }
            }
        }
    }
}

@Composable
private fun DashboardHeroCard(
    activeUserDisplayName: String,
    activeUserId: String,
    todoCount: Int,
    onGoToProjects: () -> Unit,
    modifier: Modifier = Modifier,
) {
    val normalizedDisplayName = activeUserDisplayName.trim()
    val heroShape = RoundedCornerShape(topStart = 0.dp, topEnd = 0.dp, bottomStart = 16.dp, bottomEnd = 16.dp)
    val userLabel = when {
        normalizedDisplayName.isNotBlank() -> normalizedDisplayName
        activeUserId.isNotBlank() -> activeUserId.take(8)
        else -> "Usuario"
    }

    Card(
        modifier = modifier
            .fillMaxWidth()
            .shadow(
                elevation = 10.dp,
                shape = heroShape,
                clip = false,
                ambientColor = Color.White.copy(alpha = 0.18f),
                spotColor = Color.White.copy(alpha = 0.32f),
            ),
        shape = heroShape,
        elevation = CardDefaults.cardElevation(defaultElevation = 0.dp),
    ) {
        Box(
            modifier = Modifier.fillMaxWidth(),
        ) {
            Box(
                modifier = Modifier
                    .matchParentSize()
                    .background(
                        brush = Brush.linearGradient(
                            colors = DashboardHeroGradientColors,
                        ),
                    ),
            )
            Box(
                modifier = Modifier
                    .matchParentSize()
                    .background(
                        brush = Brush.verticalGradient(
                            colors = listOf(
                                Color.White.copy(alpha = 0.12f),
                                Color.Transparent,
                                Color.Black.copy(alpha = 0.08f),
                            ),
                        ),
                    ),
            )

            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(18.dp),
                horizontalArrangement = Arrangement.spacedBy(12.dp),
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Column(
                    modifier = Modifier.weight(1f),
                    verticalArrangement = Arrangement.spacedBy(10.dp),
                ) {
                    Text(
                        text = "Hola, $userLabel",
                        style = MaterialTheme.typography.headlineSmall,
                        color = Color.White,
                        fontWeight = FontWeight.Bold,
                    )
                    Text(
                        text = "Tienes $todoCount tareas pendientes por avanzar hoy.",
                        style = MaterialTheme.typography.bodyMedium,
                        color = DashboardHeroSubtitleColor,
                    )
                }
                Button(
                    onClick = onGoToProjects,
                    modifier = Modifier.heightIn(min = 44.dp),
                    shape = MaterialTheme.shapes.medium,
                    colors = ButtonDefaults.buttonColors(
                        containerColor = MaterialTheme.extendedColors.heroButton,
                        contentColor = MaterialTheme.extendedColors.onHeroButton,
                    ),
                ) {
                    Icon(
                        imageVector = Icons.AutoMirrored.Filled.List,
                        contentDescription = null,
                    )
                    Spacer(modifier = Modifier.width(8.dp))
                    Text("Ir a proyectos")
                }
            }
        }
    }
}

@Composable
private fun MetricStrip(
    totalAssigned: Int,
    pendingCount: Int,
    inDevelopmentCount: Int,
    qaReviewCount: Int,
    completedCount: Int,
    highPriorityCount: Int,
    modifier: Modifier = Modifier,
) {
    val metrics = listOf(
        DashboardMetric(
            title = "Asignadas",
            value = totalAssigned.toString(),
            subtitle = "Total del usuario",
            color = DashboardMetricAssignedColor,
        ),
        DashboardMetric(
            title = "Pendientes",
            value = pendingCount.toString(),
            subtitle = "Por iniciar",
            color = DashboardMetricPendingColor,
        ),
        DashboardMetric(
            title = "En desarrollo",
            value = inDevelopmentCount.toString(),
            subtitle = "Trabajo activo",
            color = DashboardMetricInProgressColor,
        ),
        DashboardMetric(
            title = "En revision QA",
            value = qaReviewCount.toString(),
            subtitle = "Validacion en curso",
            color = DashboardMetricQaReviewColor,
        ),
        DashboardMetric(
            title = "QA aprobado",
            value = completedCount.toString(),
            subtitle = "Cambios completados",
            color = DashboardMetricCompletedColor,
        ),
        DashboardMetric(
            title = "Alta prioridad",
            value = highPriorityCount.toString(),
            subtitle = "Requieren foco",
            color = DashboardMetricHighPriorityColor,
        ),
    )

    LazyRow(
        modifier = modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.spacedBy(10.dp),
        contentPadding = PaddingValues(horizontal = 2.dp),
    ) {
        items(metrics) { metric ->
            Card(
                modifier = Modifier.width(178.dp),
                shape = MaterialTheme.shapes.medium
            ) {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(12.dp),
                    verticalArrangement = Arrangement.spacedBy(3.dp),
                ) {
                    Text(
                        text = metric.title,
                        style = MaterialTheme.typography.labelMedium,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                    )
                    Surface(
                        color = metric.color,
                        shape = MaterialTheme.shapes.small,
                    ) {
                        Text(
                            text = metric.value,
                            style = MaterialTheme.typography.titleLarge,
                            color = MaterialTheme.extendedColors.pillOn,
                            fontWeight = FontWeight.Bold,
                            modifier = Modifier.padding(horizontal = 10.dp, vertical = 4.dp),
                        )
                    }
                    Text(
                        text = metric.subtitle,
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                    )
                }
            }
        }
    }
}

@Composable
private fun DashboardContent(
    todoItems: List<Change>,
    projectNameById: Map<String, String>,
    mentionedNotes: List<ProjectTodoNote>,
    changeNameById: Map<String, String>,
    onChangeClick: (Change) -> Unit,
    onMentionNoteClick: (ProjectTodoNote) -> Unit,
    modifier: Modifier = Modifier,
) {
    BoxWithConstraints(modifier = modifier.fillMaxWidth()) {
        val isWide = maxWidth >= 980.dp

        if (isWide) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(12.dp),
            ) {
                TodoListPanel(
                    todoItems = todoItems,
                    projectNameById = projectNameById,
                    onChangeClick = onChangeClick,
                    modifier = Modifier.weight(1.4f),
                )
                MentionedNotesPanel(
                    mentionedNotes = mentionedNotes,
                    projectNameById = projectNameById,
                    changeNameById = changeNameById,
                    onMentionNoteClick = onMentionNoteClick,
                    modifier = Modifier.weight(1f),
                )
            }
        } else {
            Column(
                modifier = Modifier.fillMaxWidth(),
                verticalArrangement = Arrangement.spacedBy(12.dp),
            ) {
                TodoListPanel(
                    todoItems = todoItems,
                    projectNameById = projectNameById,
                    onChangeClick = onChangeClick,
                )
                MentionedNotesPanel(
                    mentionedNotes = mentionedNotes,
                    projectNameById = projectNameById,
                    changeNameById = changeNameById,
                    onMentionNoteClick = onMentionNoteClick,
                )
            }
        }
    }
}

@Composable
private fun TodoListPanel(
    todoItems: List<Change>,
    projectNameById: Map<String, String>,
    onChangeClick: (Change) -> Unit,
    modifier: Modifier = Modifier,
) {
    Card(
        modifier = modifier.fillMaxWidth(),
        shape = MaterialTheme.shapes.medium
    ) {
        Column(
            modifier = Modifier.fillMaxWidth(),
        ) {
            DashboardPanelTitleBar(
                text = "Cola de trabajo",
                subtitle = "Prioriza cambios abiertos",
                countLabel = "${todoItems.size} cambios",
            )

            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(14.dp),
                verticalArrangement = Arrangement.spacedBy(10.dp),
            ) {
                if (todoItems.isEmpty()) {
                    Text(
                        text = "No tienes cambios abiertos.",
                        style = MaterialTheme.typography.bodyMedium,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                    )
                } else {
                    todoItems.take(8).forEach { item ->
                        ChangeListItemCard(
                            item = item,
                            projectName = projectNameById[item.projectId] ?: "Proyecto sin nombre",
                            onClick = { onChangeClick(item) },
                        )
                    }

                    if (todoItems.size > 8) {
                        Text(
                            text = "Mostrando 8 de ${todoItems.size} cambios en cola",
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant,
                        )
                    }
                }
            }
        }
    }
}

@Composable
private fun DashboardPanelTitleBar(
    text: String,
    subtitle: String,
    countLabel: String,
    modifier: Modifier = Modifier,
) {
    val softenedHeroColors = DashboardHeroGradientColors.map { heroColor ->
        lerp(heroColor, MaterialTheme.colorScheme.surface, 0.25f)
    }

    Box(
        modifier = modifier
            .fillMaxWidth()
            .background(
                brush = Brush.horizontalGradient(
                    colors = softenedHeroColors,
                ),
            )
            .padding(horizontal = 14.dp, vertical = 12.dp),
    ) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(10.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Column(
                modifier = Modifier.weight(1f),
                verticalArrangement = Arrangement.spacedBy(2.dp),
            ) {
                Text(
                    text = text,
                    style = MaterialTheme.typography.titleMedium,
                    color = Color.White,
                    fontWeight = FontWeight.Bold,
                )
                Text(
                    text = subtitle,
                    style = MaterialTheme.typography.labelSmall,
                    color = DashboardHeroSubtitleColor,
                )
            }

            Surface(
                shape = MaterialTheme.shapes.large,
                color = MaterialTheme.extendedColors.heroButton,
            ) {
                Text(
                    text = countLabel,
                    style = MaterialTheme.typography.labelMedium,
                    color = MaterialTheme.extendedColors.onHeroButton,
                    fontWeight = FontWeight.SemiBold,
                    modifier = Modifier.padding(horizontal = 10.dp, vertical = 6.dp),
                )
            }
        }
    }
}

@Composable
private fun ChangeListItemCard(
    item: Change,
    projectName: String,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
) {
    Card(
        onClick = onClick,
        modifier = modifier.fillMaxWidth(),
        shape = MaterialTheme.shapes.small
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(10.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
        ) {
            Column(
                modifier = Modifier.weight(1f),
                verticalArrangement = Arrangement.spacedBy(4.dp),
            ) {
                Text(
                    text = item.name,
                    style = MaterialTheme.typography.bodyMedium,
                    fontWeight = FontWeight.Medium,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis,
                )
                Text(
                    text = projectName,
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis,
                )
            }

            Row(
                horizontalArrangement = Arrangement.spacedBy(6.dp),
                modifier = Modifier.padding(start = 8.dp),
            ) {
                StatusPill(text = item.status)
                PriorityPill(text = item.priority)
            }
        }
    }
}

@Composable
private fun MentionedNotesPanel(
    mentionedNotes: List<ProjectTodoNote>,
    projectNameById: Map<String, String>,
    changeNameById: Map<String, String>,
    onMentionNoteClick: (ProjectTodoNote) -> Unit,
    modifier: Modifier = Modifier,
) {
    Card(
        modifier = modifier.fillMaxWidth(),
        shape = MaterialTheme.shapes.medium
    ) {
        Column(
            modifier = Modifier.fillMaxWidth(),
        ) {
            DashboardPanelTitleBar(
                text = "Ultimas notas donde te mencionan",
                subtitle = "Seguimiento de menciones recientes",
                countLabel = "${mentionedNotes.size} notas",
            )

            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(14.dp),
                verticalArrangement = Arrangement.spacedBy(10.dp),
            ) {
                if (mentionedNotes.isEmpty()) {
                    Text(
                        text = "Aun no tienes menciones en notas.",
                        style = MaterialTheme.typography.bodyMedium,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                    )
                } else {
                    mentionedNotes.take(8).forEach { note ->
                        MentionedNoteCard(
                            note = note,
                            projectName = projectNameById[note.projectId] ?: "Proyecto sin nombre",
                            changeName = note.changeId?.let { changeNameById[it] } ?: "Cambio sin nombre",
                            onClick = { onMentionNoteClick(note) },
                        )
                    }

                    if (mentionedNotes.size > 8) {
                        Text(
                            text = "Mostrando 8 de ${mentionedNotes.size} notas",
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant,
                        )
                    }
                }
            }
        }
    }
}

@Composable
private fun MentionedNoteCard(
    note: ProjectTodoNote,
    projectName: String,
    changeName: String,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
) {
    Card(
        onClick = onClick,
        modifier = modifier.fillMaxWidth(),
        shape = MaterialTheme.shapes.small
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(10.dp),
            verticalArrangement = Arrangement.spacedBy(4.dp),
        ) {
            Text(
                text = shortNoteText(note.text),
                style = MaterialTheme.typography.bodyMedium,
                fontWeight = FontWeight.Medium,
                maxLines = 2,
                overflow = TextOverflow.Ellipsis,
            )
            Text(
                text = projectName,
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
                maxLines = 1,
                overflow = TextOverflow.Ellipsis,
            )
            Text(
                text = changeName,
                style = MaterialTheme.typography.labelSmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
                maxLines = 1,
                overflow = TextOverflow.Ellipsis,
            )
            Surface(
                shape = MaterialTheme.shapes.extraSmall,
                color = statusPillColor(note.status),
            ) {
                Text(
                    text = note.status,
                    style = MaterialTheme.typography.labelSmall,
                    color = MaterialTheme.extendedColors.pillOn,
                    modifier = Modifier.padding(horizontal = 8.dp, vertical = 3.dp),
                )
            }
        }
    }
}

@Composable
private fun InfoPanel(
    title: String,
    message: String,
    modifier: Modifier = Modifier,
) {
    Card(
        modifier = modifier.fillMaxWidth(),
        shape = MaterialTheme.shapes.medium
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(14.dp),
            verticalArrangement = Arrangement.spacedBy(6.dp),
        ) {
            Text(
                text = title,
                style = MaterialTheme.typography.titleSmall,
                fontWeight = FontWeight.SemiBold,
            )
            Text(
                text = message,
                style = MaterialTheme.typography.bodyMedium,
            )
        }
    }
}

@Composable
private fun StatusPill(text: String, modifier: Modifier = Modifier) {
    Surface(
        modifier = modifier,
        color = statusPillColor(text),
        shape = MaterialTheme.shapes.extraSmall,
    ) {
        Text(
            text = text,
            style = MaterialTheme.typography.labelSmall,
            color = MaterialTheme.extendedColors.pillOn,
            modifier = Modifier.padding(horizontal = 8.dp, vertical = 3.dp),
        )
    }
}

@Composable
private fun PriorityPill(text: String, modifier: Modifier = Modifier) {
    Surface(
        modifier = modifier,
        color = priorityPillColor(text),
        shape = MaterialTheme.shapes.extraSmall,
    ) {
        Text(
            text = text,
            style = MaterialTheme.typography.labelSmall,
            color = MaterialTheme.extendedColors.pillOn,
            modifier = Modifier.padding(horizontal = 8.dp, vertical = 3.dp),
        )
    }
}

private data class DashboardMetric(
    val title: String,
    val value: String,
    val subtitle: String,
    val color: Color,
)

private fun priorityWeight(priority: String): Int {
    return when (normalizePriority(priority)) {
        "alta" -> 0
        "media" -> 1
        "baja" -> 2
        else -> 3
    }
}

private fun statusRank(status: String): Int {
    return when (canonicalStatus(status)) {
        "en_desarrollo" -> 0
        "en_revision_qa" -> 1
        "pendiente" -> 2
        "completado_qa" -> 3
        else -> 4
    }
}

private fun canonicalStatus(status: String): String {
    return when (status.trim().lowercase()) {
        "pendiente" -> "pendiente"
        "en progreso", "en desarrollo" -> "en_desarrollo"
        "en revision de qa", "en revisión de qa", "en revision qa", "revision qa" -> "en_revision_qa"
        "completado", "completado (qa aprobado)", "qa aprobado" -> "completado_qa"
        else -> status.trim().lowercase()
    }
}

private fun normalizePriority(priority: String): String = priority.trim().lowercase()

private fun shortNoteText(text: String): String = text.trim().ifBlank { "(sin texto)" }

@Preview(showBackground = true, name = "Portrait")
@Composable
fun HomeDashboardScreenPreview() {
    HomeDashboardPreviewContent()
}

@Preview(showBackground = true, name = "Landscape", device = "spec:width=1280dp,height=800dp,orientation=landscape")
@Composable
fun HomeDashboardScreenLandscapePreview() {
    HomeDashboardPreviewContent()
}

@Composable
private fun HomeDashboardPreviewContent() {
    val sampleChanges = listOf(
        Change(
            id = "1",
            projectId = "p1",
            name = "Actualizar iconos de navegación",
            description = "Cambiar los iconos antiguos por los nuevos de Material3",
            status = "En Progreso",
            priority = "Alta"
        ),
        Change(
            id = "2",
            projectId = "p1",
            name = "Fix: Error en el login",
            description = "Corregir el crash cuando se ingresa una contraseña vacía",
            status = "Pendiente",
            priority = "Alta"
        ),
        Change(
            id = "3",
            projectId = "p2",
            name = "Pantalla de perfil",
            description = "Implementar la nueva pantalla de perfil de usuario",
            status = "Completado",
            priority = "Media"
        ),
        Change(
            id = "4",
            projectId = "p3",
            name = "Refactorización de base de datos",
            description = "Migrar a Room 2.6.0",
            status = "Pendiente",
            priority = "Baja"
        )
    )

    val sampleProjectNameById = mapOf(
        "p1" to "App Android Principal",
        "p2" to "Portal Web Clientes",
        "p3" to "Microservicio Auth"
    )
    val sampleChangeNameById = sampleChanges.associate { change -> change.id to change.name }
    val sampleMentionedNotes = listOf(
        ProjectTodoNote(
            id = "n1",
            projectId = "p1",
            changeId = "1",
            text = "@juan revisa este cambio antes del pase a STG",
            status = "Pendiente",
            isTodo = true,
            createdBy = "u1",
            assignedTo = "u2",
            assigneeIds = listOf("u2"),
            createdAt = "2026-03-10T08:00:00Z",
        ),
        ProjectTodoNote(
            id = "n2",
            projectId = "p2",
            changeId = "3",
            text = "@juan confirmar validacion funcional",
            status = "Completado",
            isTodo = true,
            createdBy = "u3",
            assignedTo = "u2",
            assigneeIds = listOf("u2"),
            createdAt = "2026-03-09T15:30:00Z",
        ),
    )

    ProjectTrackTheme {
        Surface(color = MaterialTheme.colorScheme.background) {
            HomeDashboardScreen(
                assignedChanges = sampleChanges,
                mentionedNotes = sampleMentionedNotes,
                projectNameById = sampleProjectNameById,
                changeNameById = sampleChangeNameById,
                activeUserDisplayName = "Juan Pérez",
                activeUserId = "user_12345678",
                onGoToProjects = {},
                onChangeClick = {},
                onMentionNoteClick = {},
            )
        }
    }
}
