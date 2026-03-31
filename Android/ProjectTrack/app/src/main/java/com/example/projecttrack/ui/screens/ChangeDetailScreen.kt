package com.example.projecttrack.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Info
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
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
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import com.example.projecttrack.data.AssigneeSuggestion
import com.example.projecttrack.data.Change
import com.example.projecttrack.data.Project
import com.example.projecttrack.data.ProjectTodoNote
import com.example.projecttrack.data.parseAssignees
import com.example.projecttrack.ui.theme.DashboardHeroGradientColors
import com.example.projecttrack.ui.theme.DashboardHeroProjectsButtonColor
import com.example.projecttrack.ui.theme.DashboardHeroProjectsButtonContentColor
import com.example.projecttrack.ui.theme.DashboardHeroSubtitleColor
import com.example.projecttrack.ui.theme.PillOnColor
import com.example.projecttrack.ui.theme.ProjectTrackTheme
import com.example.projecttrack.ui.theme.UrlGroupProdColor
import com.example.projecttrack.ui.theme.UrlGroupQaColor
import com.example.projecttrack.ui.theme.UrlGroupStgColor
import com.example.projecttrack.ui.theme.priorityPillColor
import com.example.projecttrack.ui.theme.statusPillColor

@Composable
fun ChangeDetailScreen(
    change: Change?,
    project: Project?,
    assigneeSuggestions: List<AssigneeSuggestion>,
    todoNotes: List<ProjectTodoNote>,
    todoNotesError: String?,
    isTodoSubmitting: Boolean,
    todoActionError: String?,
    onCreateTodoNote: (String, List<String>) -> Unit,
    onUpdateTodoNoteText: (String, String, List<String>, Boolean) -> Unit,
    onToggleTodoNoteCompletion: (String, Boolean) -> Unit,
    modifier: Modifier = Modifier,
) {
    if (change == null) {
        Box(
            modifier = modifier
                .fillMaxSize()
                .padding(16.dp),
        ) {
            EmptyChangeState(modifier = Modifier.align(Alignment.Center))
        }
        return
    }

    val assigneeNames = remember(change.assignedTo, assigneeSuggestions) {
        resolveAssignedNames(
            rawAssignedTo = change.assignedTo,
            suggestions = assigneeSuggestions,
        )
    }
    val visibleEnvironmentsLabel = remember(
        change.showQaLinks,
        change.showStgLinks,
        change.showProdLinks,
    ) {
        val visibleEnvironments = visibleEnvironmentsForChange(change)
        if (visibleEnvironments.isEmpty()) "Ninguno" else visibleEnvironments.joinToString(", ")
    }

    LazyColumn(
        modifier = modifier.fillMaxSize(),
        contentPadding = PaddingValues(start = 16.dp, end = 16.dp, bottom = 16.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp),
    ) {
        item {
            ChangeHeroCard(
                change = change,
                projectName = project?.name,
                assigneeNames = assigneeNames,
                visibleEnvironmentsLabel = visibleEnvironmentsLabel,
            )
        }

        item {
            ChangeEnvironmentLinksSection(
                change = change,
                project = project,
            )
        }

        item {
            TodoNotesSection(
                notes = todoNotes,
                assigneeSuggestions = assigneeSuggestions,
                errorMessage = todoNotesError,
                actionErrorMessage = todoActionError,
                isSubmitting = isTodoSubmitting,
                onCreateNote = onCreateTodoNote,
                onUpdateNoteText = onUpdateTodoNoteText,
                onToggleNoteCompletion = onToggleTodoNoteCompletion,
            )
        }
    }
}

@Composable
private fun ChangeHeroCard(
    change: Change,
    projectName: String?,
    assigneeNames: String,
    visibleEnvironmentsLabel: String,
    modifier: Modifier = Modifier,
) {
    val heroProjectName = projectName?.trim().orEmpty().ifBlank { "Proyecto ${shortId(change.projectId)}" }
    Card(
        modifier = modifier.fillMaxWidth(),
        shape = RoundedCornerShape(topStart = 0.dp, topEnd = 0.dp, bottomStart = 12.dp, bottomEnd = 12.dp),
    ) {
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .background(
                    brush = Brush.linearGradient(
                        colors = DashboardHeroGradientColors,
                    ),
                )
                .padding(18.dp),
        ) {
            Column(
                verticalArrangement = Arrangement.spacedBy(12.dp),
            ) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(10.dp),
                    verticalAlignment = Alignment.CenterVertically,
                ) {
                    Text(
                        text = heroProjectName,
                        style = MaterialTheme.typography.labelSmall,
                        color = DashboardHeroSubtitleColor,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis,
                        modifier = Modifier.weight(1f),
                    )
                    Surface(
                        color = DashboardHeroProjectsButtonColor,
                        shape = RoundedCornerShape(10.dp),
                    ) {
                        Text(
                            text = change.projectId,
                            style = MaterialTheme.typography.labelSmall,
                            color = DashboardHeroProjectsButtonContentColor,
                            fontWeight = FontWeight.Medium,
                            modifier = Modifier.padding(horizontal = 10.dp, vertical = 6.dp),
                        )
                    }
                    Surface(
                        color = DashboardHeroProjectsButtonColor,
                        shape = RoundedCornerShape(10.dp),
                    ) {
                        Text(
                            text = change.id,
                            style = MaterialTheme.typography.labelSmall,
                            color = DashboardHeroProjectsButtonContentColor,
                            fontWeight = FontWeight.Medium,
                            modifier = Modifier.padding(horizontal = 10.dp, vertical = 6.dp),
                        )
                    }
                }

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                    verticalAlignment = Alignment.CenterVertically,
                ) {
                    Text(
                        text = change.name,
                        style = MaterialTheme.typography.headlineSmall,
                        color = Color.White,
                        fontWeight = FontWeight.Bold,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis,
                        modifier = Modifier.weight(1f),
                    )
                    CompactHeroBadge(
                        value = change.status,
                        containerColor = statusPillColor(change.status),
                    )
                    CompactHeroBadge(
                        value = change.priority,
                        containerColor = priorityPillColor(change.priority),
                    )
                }


                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(10.dp),
                    verticalAlignment = Alignment.Top,
                ) {
                    Text(
                        text = change.description.ifBlank { "Sin descripción" },
                        style = MaterialTheme.typography.bodyMedium,
                        color = DashboardHeroSubtitleColor,
                        modifier = Modifier.weight(1f),
                    )
                    HeroInfoPill(
                        label = "Asignados",
                        value = assigneeNames,
                    )
                    HeroInfoPill(
                        label = "Ambientes visibles",
                        value = visibleEnvironmentsLabel,
                    )
                }
            }
        }
    }
}

@Composable
private fun HeroInfoPill(
    label: String,
    value: String,
    modifier: Modifier = Modifier,
) {
    Surface(
        modifier = modifier,
        color = DashboardHeroProjectsButtonColor.copy(alpha = 0.2f),
        shape = RoundedCornerShape(10.dp),
    ) {
        Row(
            modifier = Modifier
                .padding(horizontal = 10.dp, vertical = 7.dp),
            horizontalArrangement = Arrangement.spacedBy(6.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Text(
                text = "$label:",
                style = MaterialTheme.typography.labelSmall,
                color = DashboardHeroSubtitleColor,
                maxLines = 1,
                overflow = TextOverflow.Ellipsis,
            )
            Text(
                text = value,
                style = MaterialTheme.typography.bodySmall,
                fontWeight = FontWeight.Medium,
                color = Color.White,
                maxLines = 1,
                overflow = TextOverflow.Ellipsis,
            )
        }
    }
}

@Composable
private fun InlineLinkRow(
    label: String,
    value: String,
    modifier: Modifier = Modifier,
) {
    Surface(
        modifier = modifier.fillMaxWidth(),
        color = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.45f),
        shape = RoundedCornerShape(10.dp),
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 10.dp, vertical = 7.dp),
            horizontalArrangement = Arrangement.spacedBy(8.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Text(
                text = "$label:",
                style = MaterialTheme.typography.labelSmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
            )
            Text(
                text = value,
                style = MaterialTheme.typography.bodySmall,
                fontWeight = FontWeight.Medium,
                maxLines = 1,
                overflow = TextOverflow.Ellipsis,
                modifier = Modifier.weight(1f),
            )
        }
    }
}

@Composable
private fun CompactHeroBadge(
    value: String,
    containerColor: Color,
    modifier: Modifier = Modifier,
) {
    Surface(
        modifier = modifier,
        color = containerColor,
        shape = RoundedCornerShape(999.dp),
    ) {
        Text(
            text = value,
            style = MaterialTheme.typography.labelSmall,
            color = PillOnColor,
            fontWeight = FontWeight.SemiBold,
            modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp),
        )
    }
}

@Composable
private fun ChangeEnvironmentLinksSection(
    change: Change,
    project: Project?,
    modifier: Modifier = Modifier,
) {
    Card(modifier = modifier.fillMaxWidth()) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(14.dp),
            verticalArrangement = Arrangement.spacedBy(10.dp),
        ) {
            Text(
                text = "Links del cambio",
                style = MaterialTheme.typography.titleSmall,
                fontWeight = FontWeight.SemiBold,
            )

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(8.dp),
                verticalAlignment = Alignment.Top,
            ) {
                InlineLinkRow(
                    label = "Workfront",
                    value = change.workfrontLink.ifBlank { "No definido" },
                    modifier = Modifier.weight(1f),
                )
                InlineLinkRow(
                    label = "OneDrive",
                    value = change.onedriveLink.ifBlank { "No definido" },
                    modifier = Modifier.weight(1f),
                )
            }

            HorizontalDivider(modifier = Modifier.padding(top = 2.dp, bottom = 2.dp))

            val visibleEnvironments = visibleEnvironmentsForChange(change)

            if (project == null) {
                Text(
                    text = "No se pudo cargar el proyecto para mostrar sus URLs por ambiente.",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                )
            } else if (visibleEnvironments.isEmpty()) {
                Text(
                    text = "No hay ambientes seleccionados para mostrar links.",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                )
            } else {
                visibleEnvironments.forEach { environment ->
                    val urls = urlsByEnvironment(project, environment)
                    val accentColor = when (environment) {
                        "QA" -> UrlGroupQaColor
                        "STG" -> UrlGroupStgColor
                        "PROD" -> UrlGroupProdColor
                        else -> MaterialTheme.colorScheme.primary
                    }
                    EnvironmentLinksCard(
                        environment = environment,
                        urls = urls,
                        accentColor = accentColor,
                    )
                }
            }
        }
    }
}

@Composable
private fun EnvironmentLinksCard(
    environment: String,
    urls: Map<String, String>,
    accentColor: Color,
    modifier: Modifier = Modifier,
) {
    Box(modifier = modifier.fillMaxWidth()) {
        Surface(
            modifier = Modifier
                .fillMaxWidth()
                .padding(top = 10.dp),
            color = Color.Transparent,
            shape = RoundedCornerShape(12.dp),
            border = BorderStroke(
                width = 1.dp,
                color = accentColor.copy(alpha = 0.65f),
            ),
        ) {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(start = 10.dp, end = 10.dp, top = 14.dp, bottom = 10.dp),
                verticalArrangement = Arrangement.spacedBy(8.dp),
            ) {
                if (urls.isEmpty()) {
                    Text(
                        text = "Sin URLs configuradas en este ambiente.",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                    )
                } else {
                    urls.toSortedMap().forEach { (label, value) ->
                        InlineLinkRow(
                            label = formatEnvironmentLabel(label),
                            value = value.ifBlank { "No definido" },
                        )
                    }
                }
            }
        }

        Surface(
            color = accentColor,
            shape = RoundedCornerShape(999.dp),
            modifier = Modifier.padding(start = 14.dp),
        ) {
            Text(
                text = environment,
                style = MaterialTheme.typography.labelMedium,
                color = PillOnColor,
                modifier = Modifier.padding(horizontal = 10.dp, vertical = 4.dp),
            )
        }
    }
}

@Composable
private fun EmptyChangeState(modifier: Modifier = Modifier) {
    Column(
        modifier = modifier,
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.spacedBy(8.dp),
    ) {
        Icon(
            imageVector = Icons.Filled.Info,
            contentDescription = null,
            tint = MaterialTheme.colorScheme.onSurfaceVariant,
            modifier = Modifier.size(46.dp),
        )
        Text(
            text = "Cambio no encontrado",
            style = MaterialTheme.typography.titleMedium,
        )
    }
}

@Composable
private fun TodoNotesSection(
    notes: List<ProjectTodoNote>,
    assigneeSuggestions: List<AssigneeSuggestion>,
    errorMessage: String?,
    actionErrorMessage: String?,
    isSubmitting: Boolean,
    onCreateNote: (String, List<String>) -> Unit,
    onUpdateNoteText: (String, String, List<String>, Boolean) -> Unit,
    onToggleNoteCompletion: (String, Boolean) -> Unit,
    modifier: Modifier = Modifier,
) {
    var newNoteText by rememberSaveable { mutableStateOf("") }
    var editingNote by remember { mutableStateOf<ProjectTodoNote?>(null) }
    var editingText by rememberSaveable { mutableStateOf("") }
    var editingCompleted by rememberSaveable { mutableStateOf(false) }
    val assigneeLabelByValue = remember(assigneeSuggestions) {
        assigneeSuggestions.associate { suggestion ->
            suggestion.value.lowercase() to suggestion.label
        }
    }
    val noteMentionQuery = remember(newNoteText) {
        extractTrailingNoteMentionQuery(newNoteText)
    }
    val noteMentionSuggestions = remember(
        assigneeSuggestions,
        noteMentionQuery,
    ) {
        buildNoteMentionSuggestions(
            assigneeSuggestions = assigneeSuggestions,
            mentionQuery = noteMentionQuery,
        )
    }
    val selectedAssigneeIdsFromNote = remember(newNoteText, assigneeSuggestions) {
        resolveAssignedUserIdsFromNoteText(
            noteText = newNoteText,
            suggestions = assigneeSuggestions,
        )
    }
    val selectedAssigneeLabel = remember(selectedAssigneeIdsFromNote, assigneeLabelByValue) {
        if (selectedAssigneeIdsFromNote.isEmpty()) {
            null
        } else {
            selectedAssigneeIdsFromNote
                .map { assigneeId ->
                    assigneeLabelByValue[assigneeId.lowercase()] ?: assigneeId
                }
                .joinToString(", ")
        }
    }

    Card(
        modifier = modifier.fillMaxWidth(),
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(14.dp),
            verticalArrangement = Arrangement.spacedBy(10.dp),
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Text(
                    text = "Notas TO-DO relacionadas",
                    style = MaterialTheme.typography.titleSmall,
                    fontWeight = FontWeight.SemiBold,
                )
                Surface(
                    color = DashboardHeroProjectsButtonColor,
                    shape = RoundedCornerShape(10.dp),
                ) {
                    val count = notes.size
                    Text(
                        text = "$count",
                        style = MaterialTheme.typography.labelSmall,
                        color = DashboardHeroProjectsButtonContentColor,
                        fontWeight = FontWeight.SemiBold,
                        modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp),
                    )
                }
            }

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(8.dp),
                verticalAlignment = Alignment.CenterVertically,
            ) {
                OutlinedTextField(
                    value = newNoteText,
                    onValueChange = { updated -> newNoteText = updated },
                    modifier = Modifier.weight(1f),
                    enabled = !isSubmitting,
                    singleLine = true,
                    shape = RoundedCornerShape(10.dp),
                    placeholder = {
                        Text("Agregar nota TO-DO (usa @ para asignar)")
                    },
                )
                Button(
                    enabled = !isSubmitting && newNoteText.trim().isNotBlank(),
                    onClick = {
                        val textToCreate = newNoteText.trim()
                        onCreateNote(textToCreate, selectedAssigneeIdsFromNote)
                        newNoteText = ""
                    },
                ) {
                    Text(if (isSubmitting) "Guardando..." else "Agregar")
                }
            }
            Text(
                text = "Menciona con @ en el mismo texto para relacionar personas",
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
            )
            if (noteMentionQuery != null) {
                Card(modifier = Modifier.fillMaxWidth()) {
                    Column(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(vertical = 4.dp),
                    ) {
                        if (noteMentionSuggestions.isEmpty()) {
                            val mentionQueryLabel = noteMentionQuery.takeIf { it.isNotBlank() } ?: ""
                            Text(
                                text = "Sin coincidencias para @$mentionQueryLabel",
                                style = MaterialTheme.typography.bodySmall,
                                color = MaterialTheme.colorScheme.onSurfaceVariant,
                                modifier = Modifier.padding(horizontal = 12.dp, vertical = 8.dp),
                            )
                        } else {
                            noteMentionSuggestions.forEach { suggestion ->
                                TextButton(
                                    modifier = Modifier.fillMaxWidth(),
                                    onClick = {
                                        newNoteText = applyMentionSelectionToNoteText(
                                            noteText = newNoteText,
                                            mentionLabel = suggestion.label,
                                        )
                                    },
                                ) {
                                    Text(
                                        text = suggestion.label,
                                        modifier = Modifier.fillMaxWidth(),
                                    )
                                }
                            }
                        }
                    }
                }
            }
            if (!selectedAssigneeLabel.isNullOrBlank()) {
                Text(
                    text = "Asignados detectados: $selectedAssigneeLabel",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                )
            }

            if (!actionErrorMessage.isNullOrBlank()) {
                FormErrorCard(message = actionErrorMessage)
            }

            when {
                errorMessage != null -> {
                    CopyableErrorText(
                        text = "Error cargando TO-DO: $errorMessage",
                    )
                }

                notes.isEmpty() -> {
                    Surface(
                        modifier = Modifier.fillMaxWidth(),
                        color = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.45f),
                        shape = RoundedCornerShape(10.dp),
                    ) {
                        Text(
                            text = "No hay notas TO-DO para este cambio",
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant,
                            modifier = Modifier.padding(horizontal = 10.dp, vertical = 8.dp),
                        )
                    }
                }

                else -> {
                    notes.forEachIndexed { index, note ->
                        if (index > 0) {
                            HorizontalDivider()
                        }
                        TodoNoteRow(
                            note = note,
                            index = index + 1,
                            assigneeLabel = note.assigneeIds
                                .ifEmpty { listOfNotNull(note.assignedTo?.takeIf { it.isNotBlank() }) }
                                .map { assigneeId ->
                                    assigneeLabelByValue[assigneeId.lowercase()] ?: assigneeId
                                }
                                .joinToString(", ")
                                .ifBlank { null },
                            isSubmitting = isSubmitting,
                            onEdit = { selected ->
                                editingNote = selected
                                editingText = selected.text
                                editingCompleted = isTodoNoteCompleted(selected.status)
                            },
                            onToggleCompletion = { selected, completed ->
                                onToggleNoteCompletion(selected.id, completed)
                            },
                        )
                    }
                }
            }
        }
    }

    val noteToEdit = editingNote
    if (noteToEdit != null) {
        val editingMentionQuery = remember(editingText) {
            extractTrailingNoteMentionQuery(editingText)
        }
        val editingMentionSuggestions = remember(assigneeSuggestions, editingMentionQuery) {
            buildNoteMentionSuggestions(
                assigneeSuggestions = assigneeSuggestions,
                mentionQuery = editingMentionQuery,
            )
        }
        AlertDialog(
            onDismissRequest = {
                if (!isSubmitting) {
                    editingNote = null
                }
            },
            title = {
                Text("Editar nota TO-DO")
            },
            text = {
                Column(
                    modifier = Modifier.fillMaxWidth(),
                    verticalArrangement = Arrangement.spacedBy(8.dp),
                ) {
                    OutlinedTextField(
                        value = editingText,
                        onValueChange = { editingText = it },
                        modifier = Modifier.fillMaxWidth(),
                        enabled = !isSubmitting,
                        minLines = 3,
                        maxLines = 6,
                        shape = RoundedCornerShape(10.dp),
                    )
                    Text(
                        text = "Estado",
                        style = MaterialTheme.typography.labelMedium,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                    )
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(8.dp),
                    ) {
                        Button(
                            onClick = { editingCompleted = false },
                            enabled = !isSubmitting,
                            modifier = Modifier.weight(1f),
                            colors = androidx.compose.material3.ButtonDefaults.buttonColors(
                                containerColor = if (!editingCompleted) {
                                    MaterialTheme.colorScheme.primary
                                } else {
                                    MaterialTheme.colorScheme.secondaryContainer
                                },
                                contentColor = if (!editingCompleted) {
                                    MaterialTheme.colorScheme.onPrimary
                                } else {
                                    MaterialTheme.colorScheme.onSecondaryContainer
                                },
                            ),
                        ) {
                            Text("Pendiente")
                        }
                        Button(
                            onClick = { editingCompleted = true },
                            enabled = !isSubmitting,
                            modifier = Modifier.weight(1f),
                            colors = androidx.compose.material3.ButtonDefaults.buttonColors(
                                containerColor = if (editingCompleted) {
                                    MaterialTheme.colorScheme.primary
                                } else {
                                    MaterialTheme.colorScheme.secondaryContainer
                                },
                                contentColor = if (editingCompleted) {
                                    MaterialTheme.colorScheme.onPrimary
                                } else {
                                    MaterialTheme.colorScheme.onSecondaryContainer
                                },
                            ),
                        ) {
                            Text("Completado")
                        }
                    }

                    if (editingMentionQuery != null) {
                        Card(modifier = Modifier.fillMaxWidth()) {
                            Column(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(vertical = 4.dp),
                            ) {
                                if (editingMentionSuggestions.isEmpty()) {
                                    val mentionQueryLabel = editingMentionQuery.takeIf { it.isNotBlank() } ?: ""
                                    Text(
                                        text = "Sin coincidencias para @$mentionQueryLabel",
                                        style = MaterialTheme.typography.bodySmall,
                                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                                        modifier = Modifier.padding(horizontal = 12.dp, vertical = 8.dp),
                                    )
                                } else {
                                    editingMentionSuggestions.forEach { suggestion ->
                                        TextButton(
                                            modifier = Modifier.fillMaxWidth(),
                                            onClick = {
                                                editingText = applyMentionSelectionToNoteText(
                                                    noteText = editingText,
                                                    mentionLabel = suggestion.label,
                                                )
                                            },
                                        ) {
                                            Text(
                                                text = suggestion.label,
                                                modifier = Modifier.fillMaxWidth(),
                                            )
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            },
            confirmButton = {
                TextButton(
                    enabled = !isSubmitting && editingText.trim().isNotBlank(),
                    onClick = {
                        val updatedText = editingText.trim()
                        val updatedAssigneeIds = resolveAssignedUserIdsFromNoteText(
                            noteText = updatedText,
                            suggestions = assigneeSuggestions,
                        )
                        onUpdateNoteText(
                            noteToEdit.id,
                            updatedText,
                            updatedAssigneeIds,
                            editingCompleted,
                        )
                        editingNote = null
                    },
                ) {
                    Text("Guardar")
                }
            },
            dismissButton = {
                TextButton(
                    enabled = !isSubmitting,
                    onClick = {
                        editingNote = null
                    },
                ) {
                    Text("Cancelar")
                }
            },
        )
    }
}

@Composable
private fun TodoNoteRow(
    note: ProjectTodoNote,
    index: Int,
    assigneeLabel: String?,
    isSubmitting: Boolean,
    onEdit: (ProjectTodoNote) -> Unit,
    onToggleCompletion: (ProjectTodoNote, Boolean) -> Unit,
    modifier: Modifier = Modifier,
) {
    val isCompleted = isTodoNoteCompleted(note.status)

    Surface(
        modifier = modifier.fillMaxWidth(),
        color = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.35f),
        shape = RoundedCornerShape(10.dp),
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(10.dp),
            verticalArrangement = Arrangement.spacedBy(6.dp),
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Text(
                    text = "Nota #$index",
                    style = MaterialTheme.typography.labelSmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                )
                Text(
                    text = "Creada: ${readableCreatedAt(note.createdAt)}",
                    style = MaterialTheme.typography.labelSmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                )
            }
            Text(
                text = note.text,
                style = MaterialTheme.typography.bodyMedium,
            )
            if (!assigneeLabel.isNullOrBlank()) {
                Text(
                    text = "Asignados: $assigneeLabel",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                )
            }
            Surface(
                shape = RoundedCornerShape(10.dp),
                color = statusPillColor(note.status),
            ) {
                Text(
                    text = note.status,
                    style = MaterialTheme.typography.labelSmall,
                    color = PillOnColor,
                    modifier = Modifier.padding(horizontal = 10.dp, vertical = 4.dp),
                )
            }
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(10.dp),
                verticalAlignment = Alignment.CenterVertically,
            ) {
                TextButton(
                    enabled = !isSubmitting,
                    onClick = {
                        onToggleCompletion(note, !isCompleted)
                    },
                ) {
                    Text(if (isCompleted) "Reabrir" else "Completar")
                }
                TextButton(
                    enabled = !isSubmitting,
                    onClick = {
                        onEdit(note)
                    },
                ) {
                    Text("Editar")
                }
            }
        }
    }
}

private fun shortId(value: String): String {
    val trimmed = value.trim()
    if (trimmed.isBlank()) return "N/A"
    return if (trimmed.length <= 8) trimmed else trimmed.take(8)
}

private fun buildNoteMentionSuggestions(
    assigneeSuggestions: List<AssigneeSuggestion>,
    mentionQuery: String?,
): List<AssigneeSuggestion> {
    if (mentionQuery == null) return emptyList()

    return assigneeSuggestions
        .asSequence()
        .map { suggestion ->
            AssigneeSuggestion(
                value = suggestion.value.trim(),
                label = suggestion.label.trim(),
            )
        }
        .filter { suggestion -> suggestion.value.isNotBlank() }
        .filter { suggestion ->
            if (mentionQuery.isBlank()) {
                true
            } else {
                suggestion.label.contains(mentionQuery, ignoreCase = true) ||
                    suggestion.value.contains(mentionQuery, ignoreCase = true)
            }
        }
        .sortedWith(
            compareBy<AssigneeSuggestion> { suggestion ->
                val query = mentionQuery.trim()
                if (query.isBlank()) {
                    0
                } else if (
                    suggestion.label.startsWith("@$query", ignoreCase = true) ||
                    suggestion.label.contains("($query", ignoreCase = true) ||
                    suggestion.value.startsWith(query, ignoreCase = true)
                ) {
                    0
                } else {
                    1
                }
            }.thenBy { suggestion -> suggestion.label.lowercase() },
        )
        .take(8)
        .toList()
}

private fun extractTrailingNoteMentionQuery(noteText: String): String? {
    val match = Regex("(^|\\s)@([^\\s@]*)$").find(noteText) ?: return null
    return match.groupValues[2]
}

private fun applyMentionSelectionToNoteText(
    noteText: String,
    mentionLabel: String,
): String {
    val normalizedLabel = mentionLabel.trim()
    if (normalizedLabel.isBlank()) return noteText

    val mentionRegex = Regex("(^|\\s)@([^\\s@]*)$")
    return if (mentionRegex.containsMatchIn(noteText)) {
        noteText.replace(mentionRegex) { match ->
            val prefix = match.groupValues[1]
            "$prefix$normalizedLabel "
        }
    } else {
        val separator = if (noteText.isBlank() || noteText.endsWith(" ")) "" else " "
        "$noteText$separator$normalizedLabel "
    }
}

private fun resolveAssignedUserIdsFromNoteText(
    noteText: String,
    suggestions: List<AssigneeSuggestion>,
): List<String> {
    if (noteText.isBlank()) return emptyList()

    val matches = mutableListOf<Pair<Int, String>>()

    suggestions.forEach { suggestion ->
        val assigneeId = suggestion.value.trim()
        val assigneeLabel = suggestion.label.trim()
        if (assigneeId.isBlank() || assigneeLabel.isBlank()) return@forEach

        var searchIndex = 0
        while (searchIndex < noteText.length) {
            val matchIndex = noteText.indexOf(
                assigneeLabel,
                startIndex = searchIndex,
                ignoreCase = true,
            )
            if (matchIndex < 0) break

            val endIndex = matchIndex + assigneeLabel.length
            val hasValidPrefix = matchIndex == 0 || noteText[matchIndex - 1].isWhitespace()
            val hasValidSuffix = endIndex >= noteText.length ||
                noteText[endIndex].isWhitespace() ||
                noteText[endIndex] in setOf('.', ',', ';', ':', '!', '?')

            if (hasValidPrefix && hasValidSuffix) {
                matches += matchIndex to assigneeId
            }

            searchIndex = matchIndex + assigneeLabel.length
        }
    }

    return matches
        .sortedBy { (index, _) -> index }
        .map { (_, assigneeId) -> assigneeId }
}

private fun visibleEnvironmentsForChange(change: Change): List<String> {
    return listOfNotNull(
        "QA".takeIf { change.showQaLinks },
        "STG".takeIf { change.showStgLinks },
        "PROD".takeIf { change.showProdLinks },
    )
}

private fun resolveAssignedNames(
    rawAssignedTo: String?,
    suggestions: List<AssigneeSuggestion>,
): String {
    val nameById = suggestions
        .asSequence()
        .mapNotNull { suggestion ->
            val key = suggestion.value.trim().lowercase()
            if (key.isBlank()) {
                null
            } else {
                key to assigneeNameFromLabel(suggestion.label)
            }
        }
        .toMap()

    val names = parseAssignees(rawAssignedTo)
        .map { assigneeId ->
            nameById[assigneeId.lowercase()] ?: "Usuario"
        }
        .distinct()

    return if (names.isEmpty()) "Sin asignados" else names.joinToString(", ")
}

private fun assigneeNameFromLabel(label: String): String {
    val normalized = label.trim().removePrefix("@").trim()
    if (normalized.isBlank()) return "Usuario"
    val extracted = normalized.substringBefore("(").trim()
    return extracted.ifBlank { normalized }
}

private fun urlsByEnvironment(
    project: Project,
    environment: String,
): Map<String, String> {
    return when (environment.trim().uppercase()) {
        "QA" -> project.qaUrls
        "STG" -> project.stgUrls
        "PROD" -> project.prodUrls
        else -> emptyMap()
    }
}

private fun formatEnvironmentLabel(raw: String): String {
    return raw
        .split("_")
        .filter { it.isNotBlank() }
        .joinToString(" ") { part ->
            part.lowercase().replaceFirstChar { ch ->
                if (ch.isLowerCase()) ch.titlecase() else ch.toString()
            }
        }
}

private fun readableCreatedAt(raw: String): String {
    val trimmed = raw.trim()
    if (trimmed.isBlank()) return "N/A"
    return trimmed
        .replace("T", " ")
        .replace("Z", "")
        .take(16)
}

private fun isTodoNoteCompleted(status: String): Boolean {
    return status.trim().lowercase() in setOf(
        "completado",
        "completada",
        "completed",
        "done",
        "cerrado",
        "cerrada",
    )
}

@Preview(showBackground = true, name = "Landscape", device = "spec:width=1280dp,height=800dp,orientation=landscape")
@Composable
fun ChangeDetailScreenLandscapePreview() {
    val sampleProject = Project(
        id = "p1",
        name = "App Android Principal",
        description = "Proyecto de ejemplo",
        startDate = "2023-01-01",
        qaUrls = mapOf("URL_QA_1" to "https://qa1.example.com", "URL_QA_2" to "https://qa2.example.com"),
        stgUrls = mapOf("URL_STG_1" to "https://stg1.example.com"),
        prodUrls = mapOf("URL_PROD" to "https://example.com")
    )
    val sampleChange = Change(
        id = "c1",
        projectId = "p1",
        name = "Actualizar iconos de navegación",
        description = "Cambiar los iconos antiguos por los nuevos de Material3",
        status = "En Progreso",
        priority = "Alta",
        assignedTo = "user_1,user_2",
        showQaLinks = true,
        showStgLinks = true,
        showProdLinks = true
    )
    val sampleTodoNotes = listOf(
        ProjectTodoNote(
            id = "n1",
            projectId = "p1",
            changeId = "c1",
            text = "Revisar contraste de colores",
            status = "Pendiente",
            isTodo = true,
            createdBy = "user_admin",
            assignedTo = "user_1",
            assigneeIds = listOf("user_1"),
            createdAt = "2023-10-27T10:00:00Z"
        ),
        ProjectTodoNote(
            id = "n2",
            projectId = "p1",
            changeId = "c1",
            text = "Validar en tablets",
            status = "Completado",
            isTodo = true,
            createdBy = "user_admin",
            assignedTo = "user_2",
            assigneeIds = listOf("user_2"),
            createdAt = "2023-10-26T15:30:00Z"
        )
    )
    val sampleSuggestions = listOf(
        AssigneeSuggestion("user_1", "Juan Perez"),
        AssigneeSuggestion("user_2", "Maria Garcia")
    )

    ProjectTrackTheme {
        Surface(color = MaterialTheme.colorScheme.background) {
            ChangeDetailScreen(
                change = sampleChange,
                project = sampleProject,
                assigneeSuggestions = sampleSuggestions,
                todoNotes = sampleTodoNotes,
                todoNotesError = null,
                isTodoSubmitting = false,
                todoActionError = null,
                onCreateTodoNote = { _, _ -> },
                onUpdateTodoNoteText = { _, _, _, _ -> },
                onToggleTodoNoteCompletion = { _, _ -> }
            )
        }
    }
}
