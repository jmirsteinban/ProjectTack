package com.example.projecttrack.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowDropDown
import androidx.compose.material.icons.filled.Info
import androidx.compose.material.icons.filled.Search
import androidx.compose.material3.*
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalFocusManager
import androidx.compose.ui.platform.LocalSoftwareKeyboardController
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import androidx.compose.ui.zIndex
import com.example.projecttrack.data.Change
import com.example.projecttrack.data.Project
import com.example.projecttrack.ui.theme.DashboardHeroGradientColors
import com.example.projecttrack.ui.theme.DashboardHeroProjectsButtonColor
import com.example.projecttrack.ui.theme.DashboardHeroProjectsButtonContentColor
import com.example.projecttrack.ui.theme.DashboardHeroSubtitleColor
import com.example.projecttrack.ui.theme.ProjectTrackTheme
import com.example.projecttrack.ui.theme.extendedColors
import com.example.projecttrack.ui.theme.priorityPillColor
import com.example.projecttrack.ui.theme.statusPillColor
import java.text.Normalizer

private enum class ProjectActivityFilter(val label: String) {
    ALL("Todos"),
    ACTIVE("Activos"),
    INACTIVE("Inactivos"),
}

@Composable
fun ProjectListScreen(
    projects: List<Project>,
    changesByProjectId: Map<String, List<Change>>,
    onProjectClick: (Project) -> Unit,
    onChangeClick: (Change) -> Unit,
    modifier: Modifier = Modifier,
) {
    var searchQuery by rememberSaveable { mutableStateOf("") }
    var activityFilterKey by rememberSaveable { mutableStateOf(ProjectActivityFilter.ALL.name) }
    val activityFilter = remember(activityFilterKey) { ProjectActivityFilter.valueOf(activityFilterKey) }

    val filteredProjects = remember(projects, changesByProjectId, searchQuery, activityFilter) {
        projects.filter { project ->
            val matchesName = matchesProjectName(
                projectName = project.name,
                query = searchQuery,
            )
            val matchesActivity = matchesProjectActivity(
                changes = changesByProjectId[project.id].orEmpty(),
                filter = activityFilter,
            )

            matchesName && matchesActivity
        }
    }

    Column(
        modifier = modifier.fillMaxSize(),
        verticalArrangement = Arrangement.spacedBy(16.dp),
    ) {
        ProjectSearchHeroCard(
            searchQuery = searchQuery,
            onSearchQueryChange = { searchQuery = it },
            selectedActivityFilter = activityFilter,
            onActivityFilterChange = { activityFilterKey = it.name },
            visibleCount = filteredProjects.size,
            totalCount = projects.size,
            modifier = Modifier.padding(start = 24.dp, end = 24.dp),
        )

        LazyColumn(
            modifier = Modifier.fillMaxSize(),
            contentPadding = PaddingValues(start = 24.dp, end = 24.dp, bottom = 24.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp),
        ) {
            if (filteredProjects.isEmpty()) {
                item {
                    Card(
                        modifier = Modifier.fillMaxWidth(),
                        shape = MaterialTheme.shapes.medium
                    ) {
                        Text(
                            text = "No se encontraron proyectos.",
                            color = MaterialTheme.colorScheme.onSurfaceVariant,
                            modifier = Modifier.padding(24.dp)
                        )
                    }
                }
            }

            items(
                items = filteredProjects,
                key = { project -> project.id },
            ) { project ->
                ProjectCard(
                    project = project,
                    changes = changesByProjectId[project.id].orEmpty(),
                    onClick = { onProjectClick(project) },
                    onChangeClick = onChangeClick,
                )
            }
        }
    }
}

@Composable
private fun ProjectSearchHeroCard(
    searchQuery: String,
    onSearchQueryChange: (String) -> Unit,
    selectedActivityFilter: ProjectActivityFilter,
    onActivityFilterChange: (ProjectActivityFilter) -> Unit,
    visibleCount: Int,
    totalCount: Int,
    modifier: Modifier = Modifier,
) {
    val focusManager = LocalFocusManager.current
    val keyboardController = LocalSoftwareKeyboardController.current
    val heroCardTapSource = remember { MutableInteractionSource() }

    Card(
        modifier = modifier.fillMaxWidth(),
        shape = RoundedCornerShape(topStart = 0.dp, topEnd = 0.dp, bottomStart = 16.dp, bottomEnd = 16.dp),
        elevation = CardDefaults.cardElevation(defaultElevation = 12.dp)
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .clickable(
                    interactionSource = heroCardTapSource,
                    indication = null,
                ) {
                    focusManager.clearFocus(force = true)
                    keyboardController?.hide()
                }
                .background(
                    brush = Brush.linearGradient(
                        colors = DashboardHeroGradientColors,
                    ),
                )
                .padding(horizontal = 24.dp, vertical = 24.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(32.dp)
        ) {
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = "Proyectos",
                    style = MaterialTheme.typography.headlineMedium,
                    color = Color.White,
                    fontWeight = FontWeight.Black,
                )
                Text(
                    text = "$visibleCount proyectos filtrados de $totalCount",
                    style = MaterialTheme.typography.bodyMedium,
                    color = DashboardHeroSubtitleColor,
                )
            }

            Row(
                modifier = Modifier.weight(2f),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(12.dp),
            ) {
                OutlinedTextField(
                    value = searchQuery,
                    onValueChange = onSearchQueryChange,
                    modifier = Modifier.weight(1f),
                    singleLine = true,
                    shape = MaterialTheme.shapes.medium,
                    leadingIcon = {
                        Icon(
                            imageVector = Icons.Filled.Search,
                            contentDescription = null,
                            tint = Color.White.copy(alpha = 0.8f)
                        )
                    },
                    placeholder = {
                        Text(
                            "Buscar proyecto...",
                            color = Color.White.copy(alpha = 0.4f),
                        )
                    },
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedTextColor = Color.White,
                        unfocusedTextColor = Color.White,
                        focusedContainerColor = Color.White.copy(alpha = 0.15f),
                        unfocusedContainerColor = Color.White.copy(alpha = 0.1f),
                        cursorColor = Color.White,
                        focusedBorderColor = Color.White.copy(alpha = 0.6f),
                        unfocusedBorderColor = Color.White.copy(alpha = 0.3f),
                    ),
                )

                ProjectActivityFilterDropdown(
                    selectedFilter = selectedActivityFilter,
                    onFilterSelected = onActivityFilterChange,
                    modifier = Modifier.width(170.dp),
                )
            }
        }
    }
}

@Composable
private fun ProjectActivityFilterDropdown(
    selectedFilter: ProjectActivityFilter,
    onFilterSelected: (ProjectActivityFilter) -> Unit,
    modifier: Modifier = Modifier,
) {
    var expanded by remember { mutableStateOf(false) }

    Box(modifier = modifier) {
        Button(
            onClick = { expanded = true },
            modifier = Modifier
                .fillMaxWidth()
                .heightIn(min = 44.dp),
            shape = MaterialTheme.shapes.medium,
            colors = ButtonDefaults.buttonColors(
                containerColor = MaterialTheme.extendedColors.heroButton,
                contentColor = MaterialTheme.extendedColors.onHeroButton,
            ),
        ) {
            Text(
                text = selectedFilter.label,
                maxLines = 1,
                overflow = TextOverflow.Ellipsis,
            )
            Icon(
                imageVector = Icons.Filled.ArrowDropDown,
                contentDescription = null,
            )
        }

        DropdownMenu(
            expanded = expanded,
            onDismissRequest = { expanded = false },
        ) {
            ProjectActivityFilter.entries.forEach { filter ->
                DropdownMenuItem(
                    text = { Text(filter.label) },
                    onClick = {
                        onFilterSelected(filter)
                        expanded = false
                    },
                )
            }
        }
    }
}

@Composable
private fun ProjectCard(
    project: Project,
    changes: List<Change>,
    onClick: () -> Unit,
    onChangeClick: (Change) -> Unit,
    modifier: Modifier = Modifier,
) {
    Card(
        onClick = onClick,
        modifier = modifier.fillMaxWidth(),
        elevation = CardDefaults.cardElevation(defaultElevation = 3.dp),
        shape = MaterialTheme.shapes.medium
    ) {
        Column(
            modifier = Modifier.padding(24.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp),
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.Top
            ) {
                Text(
                    text = project.name,
                    style = MaterialTheme.typography.headlineSmall,
                    fontWeight = FontWeight.Bold,
                    color = Color.White,
                    modifier = Modifier.weight(1f),
                )
                Row(
                    modifier = Modifier.padding(start = 12.dp),
                    horizontalArrangement = Arrangement.spacedBy(6.dp),
                    verticalAlignment = Alignment.CenterVertically,
                ) {
                    Text(
                        text = "Creado:",
                        style = MaterialTheme.typography.labelSmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                    )
                    Surface(
                        color = MaterialTheme.extendedColors.badge,
                        shape = MaterialTheme.shapes.small,
                    ) {
                        Text(
                            text = project.startDate.ifBlank { "TBD" },
                            style = MaterialTheme.typography.labelSmall,
                            color = MaterialTheme.extendedColors.onBadge,
                            modifier = Modifier.padding(horizontal = 8.dp, vertical = 3.dp),
                            maxLines = 1,
                            overflow = TextOverflow.Ellipsis,
                        )
                    }
                }
            }

            Text(
                text = project.description,
                style = MaterialTheme.typography.bodyLarge,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
            )

            HorizontalDivider(color = MaterialTheme.colorScheme.outlineVariant, thickness = 0.5.dp)

            FieldsetGroup(title = "CAMBIOS") {
                if (changes.isEmpty()) {
                    Text(
                        text = "Sin cambios recientes",
                        style = MaterialTheme.typography.bodyMedium,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                        modifier = Modifier.padding(vertical = 8.dp)
                    )
                } else {
                    changes.take(4).forEach { change ->
                        ChangeItem(change = change, onClick = { onChangeClick(change) })
                    }
                    if (changes.size > 4) {
                        Text(
                            text = "Ver los ${changes.size - 4} restantes...",
                            style = MaterialTheme.typography.labelLarge,
                            color = MaterialTheme.extendedColors.onHeroButton,
                            modifier = Modifier.padding(top = 4.dp).clickable { onClick() }
                        )
                    }
                }
            }
        }
    }
}

@Composable
private fun ChangeItem(change: Change, onClick: () -> Unit) {
    Surface(
        onClick = onClick,
        color = Color.White.copy(alpha = 0.03f),
        shape = MaterialTheme.shapes.small,
        modifier = Modifier.fillMaxWidth()
    ) {
        Row(
            modifier = Modifier.padding(14.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            Row(
                modifier = Modifier.weight(1f),
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Text(
                    text = change.name,
                    style = MaterialTheme.typography.bodyLarge,
                    color = Color.White,
                    fontWeight = FontWeight.Medium,
                    modifier = Modifier.weight(1f),
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis
                )
                Row(
                    modifier = Modifier.padding(start = 16.dp),
                    horizontalArrangement = Arrangement.spacedBy(10.dp),
                ) {
                    StatusPill(text = change.status)
                    PriorityPill(text = change.priority)
                }
            }
            Icon(
                imageVector = Icons.Default.Info,
                contentDescription = null,
                tint = Color.White.copy(alpha = 0.2f),
                modifier = Modifier.size(24.dp)
            )
        }
    }
}

@Composable
private fun FieldsetGroup(
    title: String,
    content: @Composable ColumnScope.() -> Unit,
) {
    Box(modifier = Modifier.fillMaxWidth()) {
        Surface(
            color = MaterialTheme.colorScheme.surface,
            shape = MaterialTheme.shapes.extraSmall,
            modifier = Modifier
                .align(Alignment.TopStart)
                .padding(start = 14.dp)
                .offset(y = (-10).dp)
                .zIndex(1f),
        ) {
            Text(
                text = title,
                style = MaterialTheme.typography.labelLarge,
                color = MaterialTheme.extendedColors.heroButton,
                fontWeight = FontWeight.Black,
                modifier = Modifier.padding(horizontal = 8.dp, vertical = 2.dp),
            )
        }

        Column(
            modifier = Modifier
                .fillMaxWidth()
                .border(1.dp, MaterialTheme.colorScheme.outlineVariant, MaterialTheme.shapes.medium)
                .padding(start = 14.dp, end = 14.dp, top = 18.dp, bottom = 14.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp),
        ) {
            content()
        }
    }
}

@Composable
private fun StatusPill(text: String) {
    Surface(
        color = statusPillColor(text),
        shape = RoundedCornerShape(6.dp),
    ) {
        Text(
            text = text,
            style = MaterialTheme.typography.labelSmall,
            color = Color.White,
            modifier = Modifier.padding(horizontal = 8.dp, vertical = 2.dp),
        )
    }
}

@Composable
private fun PriorityPill(text: String) {
    Surface(
        color = priorityPillColor(text),
        shape = RoundedCornerShape(6.dp),
    ) {
        Text(
            text = text,
            style = MaterialTheme.typography.labelSmall,
            color = Color.White,
            modifier = Modifier.padding(horizontal = 8.dp, vertical = 2.dp),
        )
    }
}

private fun matchesProjectName(projectName: String, query: String): Boolean {
    val normalizedQuery = normalizeSearchText(query)
    if (normalizedQuery.isBlank()) return true
    return normalizeSearchText(projectName).contains(normalizedQuery)
}

private fun matchesProjectActivity(
    changes: List<Change>,
    filter: ProjectActivityFilter,
): Boolean {
    val isActive = isProjectActive(changes)
    return when (filter) {
        ProjectActivityFilter.ALL -> true
        ProjectActivityFilter.ACTIVE -> isActive
        ProjectActivityFilter.INACTIVE -> !isActive
    }
}

private fun isProjectActive(changes: List<Change>): Boolean {
    if (changes.isEmpty()) return false
    return changes.any { change -> !isCompletedStatus(change.status) }
}

private fun isCompletedStatus(status: String): Boolean {
    val normalizedStatus = normalizeSearchText(status).replace("\\s+".toRegex(), " ")
    return normalizedStatus in setOf("completado", "completada", "completed", "done", "cerrado", "cerrada")
}

private fun normalizeSearchText(value: String): String {
    return Normalizer.normalize(value, Normalizer.Form.NFD)
        .replace("\\p{M}+".toRegex(), "")
        .lowercase().trim()
}

@Preview(
    showBackground = true,
    device = "spec:width=1280dp,height=800dp,orientation=landscape"
)
@Composable
private fun ProjectListScreenPreview() {
    ProjectTrackTheme(darkTheme = true) {
        ProjectListScreen(
            projects = listOf(
                Project("1", "Portal de Clientes", "UX Refactor y performance optimizado.", "2026-03-01"),
                Project("2", "Landing Campana", "Tracking de conversiones avanzado.", "2026-03-05"),
            ),
            changesByProjectId = emptyMap(),
            onProjectClick = {},
            onChangeClick = {},
        )
    }
}
