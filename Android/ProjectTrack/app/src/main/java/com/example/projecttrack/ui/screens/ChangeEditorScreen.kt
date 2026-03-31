package com.example.projecttrack.ui.screens

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.clickable
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.background
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Close
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.Checkbox
import androidx.compose.material3.DropdownMenuItem
import androidx.compose.material3.ExposedDropdownMenuBox
import androidx.compose.material3.ExposedDropdownMenuDefaults
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.MenuAnchorType
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalFocusManager
import androidx.compose.ui.platform.LocalSoftwareKeyboardController
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.example.projecttrack.data.AssigneeSuggestion
import com.example.projecttrack.data.joinAssignees
import com.example.projecttrack.data.parseAssignees
import com.example.projecttrack.ui.theme.DashboardHeroGradientColors
import com.example.projecttrack.ui.theme.DashboardHeroSubtitleColor
import com.example.projecttrack.ui.theme.FormErrorColor

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ChangeEditorScreen(
    title: String,
    initialName: String,
    initialDescription: String,
    initialStatus: String,
    initialPriority: String,
    initialCurrentEnvironment: String,
    initialShowQaLinks: Boolean,
    initialShowStgLinks: Boolean,
    initialShowProdLinks: Boolean,
    initialAssignedTo: String,
    assigneeSuggestions: List<AssigneeSuggestion> = emptyList(),
    initialWorkfrontLink: String,
    initialOnedriveLink: String,
    submitLabel: String,
    isSubmitting: Boolean,
    errorMessage: String?,
    onSubmit: (
        name: String,
        description: String,
        status: String,
        priority: String,
        currentEnvironment: String,
        showQaLinks: Boolean,
        showStgLinks: Boolean,
        showProdLinks: Boolean,
        assignedTo: String,
        workfrontLink: String,
        onedriveLink: String,
    ) -> Unit,
    onBack: () -> Unit,
    showActionButtons: Boolean = true,
    submitTrigger: Int = 0,
    onCanSubmitChange: ((Boolean) -> Unit)? = null,
    usePurpleHeroHeader: Boolean = false,
    modifier: Modifier = Modifier,
) {
    val statusOptions = listOf(
        "Pendiente",
        "En desarrollo",
        "En revision de QA",
        "Completado (QA aprobado)",
    )
    val priorityOptions = listOf("Baja", "Media", "Alta")
    val environmentOptions = listOf("QA", "STG", "PROD")
    val focusManager = LocalFocusManager.current
    val keyboardController = LocalSoftwareKeyboardController.current
    val formCardTapSource = remember { MutableInteractionSource() }

    var name by remember { mutableStateOf(initialName) }
    var description by remember { mutableStateOf(initialDescription) }
    var assignedAssignees by remember { mutableStateOf(parseAssignees(initialAssignedTo)) }
    var assigneeInput by remember { mutableStateOf("") }
    var workfrontLink by remember { mutableStateOf(initialWorkfrontLink) }
    var onedriveLink by remember { mutableStateOf(initialOnedriveLink) }
    var currentEnvironment by remember {
        mutableStateOf(
            normalizedDropdownOption(
                rawValue = initialCurrentEnvironment,
                options = environmentOptions,
                fallback = environmentOptions.first(),
            ),
        )
    }
    var showQaLinks by remember { mutableStateOf(initialShowQaLinks) }
    var showStgLinks by remember { mutableStateOf(initialShowStgLinks) }
    var showProdLinks by remember { mutableStateOf(initialShowProdLinks) }
    var isManualVisibility by remember { mutableStateOf(false) }
    var status by remember {
        mutableStateOf(
            normalizedStatusOption(
                rawValue = initialStatus,
                options = statusOptions,
                fallback = statusOptions.first(),
            ),
        )
    }
    var priority by remember {
        mutableStateOf(
            normalizedDropdownOption(
                rawValue = initialPriority,
                options = priorityOptions,
                fallback = priorityOptions[1],
            ),
        )
    }
    var environmentExpanded by remember { mutableStateOf(false) }
    var statusExpanded by remember { mutableStateOf(false) }
    var priorityExpanded by remember { mutableStateOf(false) }
    var hasTriedSubmit by remember { mutableStateOf(false) }

    LaunchedEffect(
        initialName,
        initialDescription,
        initialCurrentEnvironment,
        initialShowQaLinks,
        initialShowStgLinks,
        initialShowProdLinks,
        initialStatus,
        initialPriority,
        initialAssignedTo,
        initialWorkfrontLink,
        initialOnedriveLink,
    ) {
        name = initialName
        description = initialDescription
        assignedAssignees = parseAssignees(initialAssignedTo)
        assigneeInput = ""
        workfrontLink = initialWorkfrontLink
        onedriveLink = initialOnedriveLink
        currentEnvironment = normalizedDropdownOption(
            rawValue = initialCurrentEnvironment,
            options = environmentOptions,
            fallback = environmentOptions.first(),
        )
        showQaLinks = initialShowQaLinks
        showStgLinks = initialShowStgLinks
        showProdLinks = initialShowProdLinks
        isManualVisibility = !matchesSequentialVisibility(
            environment = currentEnvironment,
            showQaLinks = showQaLinks,
            showStgLinks = showStgLinks,
            showProdLinks = showProdLinks,
        )
        status = normalizedStatusOption(
            rawValue = initialStatus,
            options = statusOptions,
            fallback = statusOptions.first(),
        )
        priority = normalizedDropdownOption(
            rawValue = initialPriority,
            options = priorityOptions,
            fallback = priorityOptions[1],
        )
        environmentExpanded = false
        statusExpanded = false
        priorityExpanded = false
    }

    val normalizedAssignedTo = joinAssignees(assignedAssignees)
    val assigneeMentionInput = assigneeInput.trim()
    val isMentionSearch = assigneeMentionInput.startsWith("@")
    val mentionQuery = assigneeMentionInput.removePrefix("@").trim()
    val assigneeLabelByValue = remember(assigneeSuggestions) {
        assigneeSuggestions.associate { suggestion ->
            suggestion.value.lowercase() to suggestion.label
        }
    }
    val mentionSuggestions = remember(assigneeSuggestions, mentionQuery, isMentionSearch, assignedAssignees) {
        if (!isMentionSearch) {
            emptyList()
        } else {
            assigneeSuggestions
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
                        if (mentionQuery.isBlank()) {
                            0
                        } else if (
                            suggestion.label.startsWith(mentionQuery, ignoreCase = true) ||
                            suggestion.value.startsWith(mentionQuery, ignoreCase = true)
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
    }
    val canSubmit = !isSubmitting &&
        name.isNotBlank() &&
        (showQaLinks || showStgLinks || showProdLinks) &&
        normalizedAssignedTo.isNotBlank() &&
        workfrontLink.isNotBlank() &&
        onedriveLink.isNotBlank()

    val nameHasError = hasTriedSubmit && name.isBlank()
    val visibilityHasError = hasTriedSubmit && !(showQaLinks || showStgLinks || showProdLinks)
    val assignedToHasError = hasTriedSubmit && normalizedAssignedTo.isBlank()
    val workfrontHasError = hasTriedSubmit && workfrontLink.isBlank()
    val onedriveHasError = hasTriedSubmit && onedriveLink.isBlank()

    LaunchedEffect(canSubmit) {
        onCanSubmitChange?.invoke(canSubmit)
    }

    LaunchedEffect(submitTrigger) {
        if (submitTrigger > 0) {
            hasTriedSubmit = true
            if (canSubmit) {
                onSubmit(
                    name.trim(),
                    description.trim(),
                    status.trim(),
                    priority.trim(),
                    currentEnvironment.trim(),
                    showQaLinks,
                    showStgLinks,
                    showProdLinks,
                    normalizedAssignedTo,
                    workfrontLink.trim(),
                    onedriveLink.trim(),
                )
            }
        }
    }

    Column(
        modifier = modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .padding(start = 16.dp, end = 16.dp, bottom = 16.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp),
    ) {
        if (usePurpleHeroHeader) {
            Card(
                modifier = Modifier.fillMaxWidth(),
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
                        verticalArrangement = Arrangement.spacedBy(6.dp),
                    ) {
                        Text(
                            text = title,
                            style = MaterialTheme.typography.headlineSmall,
                            color = Color.White,
                            fontWeight = FontWeight.Bold,
                        )
                        Text(
                            text = "Completa la informacion del cambio",
                            style = MaterialTheme.typography.bodyMedium,
                            color = DashboardHeroSubtitleColor,
                        )
                    }
                }
            }
        } else {
            Card(modifier = Modifier.fillMaxWidth()) {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(14.dp),
                    verticalArrangement = Arrangement.spacedBy(6.dp),
                ) {
                    Text(
                        text = title,
                        style = MaterialTheme.typography.titleLarge,
                        fontWeight = FontWeight.Bold,
                    )
                    Text(
                        text = "Completa la informacion del cambio",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                    )
                }
            }
        }

        Card(modifier = Modifier.fillMaxWidth()) {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .clickable(
                        interactionSource = formCardTapSource,
                        indication = null,
                    ) {
                        focusManager.clearFocus(force = true)
                        keyboardController?.hide()
                    }
                    .padding(14.dp),
                verticalArrangement = Arrangement.spacedBy(12.dp),
            ) {
                OutlinedTextField(
                    value = name,
                    onValueChange = { name = it },
                    label = { Text("Nombre") },
                    isError = nameHasError,
                    modifier = Modifier.fillMaxWidth(),
                    singleLine = true,
                )

                OutlinedTextField(
                    value = description,
                    onValueChange = { description = it },
                    label = { Text("Descripcion") },
                    modifier = Modifier.fillMaxWidth(),
                    minLines = 3,
                )

                Column(
                    modifier = Modifier.fillMaxWidth(),
                    verticalArrangement = Arrangement.spacedBy(8.dp),
                ) {
                    Text(
                        text = "Asignados *",
                        style = MaterialTheme.typography.labelLarge,
                        fontWeight = FontWeight.SemiBold,
                    )
                    Text(
                        text = "Escribe @ para buscar personas y selecciona de la lista.",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                    )
                    OutlinedTextField(
                        value = assigneeInput,
                        onValueChange = { assigneeInput = it },
                        label = { Text("@nombre") },
                        isError = assignedToHasError,
                        modifier = Modifier.fillMaxWidth(),
                        singleLine = true,
                    )
                    if (isMentionSearch) {
                        Card(
                            modifier = Modifier
                                .fillMaxWidth()
                                .heightIn(max = 220.dp),
                        ) {
                            Column(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(vertical = 4.dp),
                            ) {
                                if (mentionSuggestions.isEmpty()) {
                                    Text(
                                        text = "Sin coincidencias para @$mentionQuery",
                                        style = MaterialTheme.typography.bodySmall,
                                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                                        modifier = Modifier.padding(horizontal = 12.dp, vertical = 8.dp),
                                    )
                                } else {
                                    mentionSuggestions.forEach { suggestion ->
                                        TextButton(
                                            onClick = {
                                                assignedAssignees = parseAssignees(
                                                    joinAssignees(assignedAssignees + suggestion.value),
                                                )
                                                assigneeInput = ""
                                            },
                                            modifier = Modifier.fillMaxWidth(),
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

                    val visibleAssignees = assignedAssignees
                    if (visibleAssignees.isEmpty()) {
                        Text(
                            text = "Sin personas asignadas.",
                            style = MaterialTheme.typography.bodySmall,
                            color = if (assignedToHasError) FormErrorColor else MaterialTheme.colorScheme.onSurfaceVariant,
                        )
                    } else {
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .horizontalScroll(rememberScrollState()),
                            horizontalArrangement = Arrangement.spacedBy(6.dp),
                        ) {
                            visibleAssignees.forEach { assignee ->
                                AssigneePill(
                                    value = assigneeLabelByValue[assignee.lowercase()] ?: assignee,
                                    onRemove = if (isSubmitting) {
                                        null
                                    } else {
                                        {
                                            assignedAssignees = assignedAssignees.filterNot { current ->
                                                current.equals(assignee, ignoreCase = true)
                                            }
                                        }
                                    },
                                )
                            }
                        }
                    }
                }

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(10.dp),
                ) {
                    ExposedDropdownMenuBox(
                        expanded = statusExpanded,
                        onExpandedChange = { shouldExpand ->
                            if (!isSubmitting) {
                                statusExpanded = shouldExpand
                                if (shouldExpand) {
                                    priorityExpanded = false
                                }
                            }
                        },
                        modifier = Modifier.weight(1f),
                    ) {
                        OutlinedTextField(
                            value = status,
                            onValueChange = {},
                            readOnly = true,
                            enabled = !isSubmitting,
                            label = { Text("Estado") },
                            trailingIcon = {
                                ExposedDropdownMenuDefaults.TrailingIcon(expanded = statusExpanded)
                            },
                            modifier = Modifier
                                .fillMaxWidth()
                                .menuAnchor(
                                    type = MenuAnchorType.PrimaryNotEditable,
                                    enabled = !isSubmitting,
                                ),
                            singleLine = true,
                        )

                        ExposedDropdownMenu(
                            expanded = statusExpanded,
                            onDismissRequest = { statusExpanded = false },
                        ) {
                            statusOptions.forEach { option ->
                                DropdownMenuItem(
                                    text = { Text(option) },
                                    onClick = {
                                        status = option
                                        statusExpanded = false
                                    },
                                )
                            }
                        }
                    }

                    ExposedDropdownMenuBox(
                        expanded = priorityExpanded,
                        onExpandedChange = { shouldExpand ->
                            if (!isSubmitting) {
                                priorityExpanded = shouldExpand
                                if (shouldExpand) {
                                    statusExpanded = false
                                }
                            }
                        },
                        modifier = Modifier.weight(1f),
                    ) {
                        OutlinedTextField(
                            value = priority,
                            onValueChange = {},
                            readOnly = true,
                            enabled = !isSubmitting,
                            label = { Text("Prioridad") },
                            trailingIcon = {
                                ExposedDropdownMenuDefaults.TrailingIcon(expanded = priorityExpanded)
                            },
                            modifier = Modifier
                                .fillMaxWidth()
                                .menuAnchor(
                                    type = MenuAnchorType.PrimaryNotEditable,
                                    enabled = !isSubmitting,
                                ),
                            singleLine = true,
                        )

                        ExposedDropdownMenu(
                            expanded = priorityExpanded,
                            onDismissRequest = { priorityExpanded = false },
                        ) {
                            priorityOptions.forEach { option ->
                                DropdownMenuItem(
                                    text = { Text(option) },
                                    onClick = {
                                        priority = option
                                        priorityExpanded = false
                                    },
                                )
                            }
                        }
                    }
                }

                ExposedDropdownMenuBox(
                    expanded = environmentExpanded,
                    onExpandedChange = { shouldExpand ->
                        if (!isSubmitting) {
                            environmentExpanded = shouldExpand
                            if (shouldExpand) {
                                statusExpanded = false
                                priorityExpanded = false
                            }
                        }
                    },
                    modifier = Modifier.fillMaxWidth(),
                ) {
                    OutlinedTextField(
                        value = currentEnvironment,
                        onValueChange = {},
                        readOnly = true,
                        enabled = !isSubmitting,
                        label = { Text("Ambiente actual") },
                        trailingIcon = {
                            ExposedDropdownMenuDefaults.TrailingIcon(expanded = environmentExpanded)
                        },
                        modifier = Modifier
                            .fillMaxWidth()
                            .menuAnchor(
                                type = MenuAnchorType.PrimaryNotEditable,
                                enabled = !isSubmitting,
                            ),
                        singleLine = true,
                    )

                    ExposedDropdownMenu(
                        expanded = environmentExpanded,
                        onDismissRequest = { environmentExpanded = false },
                    ) {
                        environmentOptions.forEach { option ->
                            DropdownMenuItem(
                                text = { Text(option) },
                                onClick = {
                                    currentEnvironment = option
                                    environmentExpanded = false
                                    if (!isManualVisibility) {
                                        val sequential = sequentialVisibilityForEnvironment(option)
                                        showQaLinks = sequential.first
                                        showStgLinks = sequential.second
                                        showProdLinks = sequential.third
                                    }
                                },
                            )
                        }
                    }
                }

                Card(modifier = Modifier.fillMaxWidth()) {
                    Column(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(12.dp),
                        verticalArrangement = Arrangement.spacedBy(4.dp),
                    ) {
                        Text(
                            text = "Links visibles por ambiente",
                            style = MaterialTheme.typography.titleSmall,
                            fontWeight = FontWeight.SemiBold,
                        )
                        Text(
                            text = "Por defecto sigue QA -> STG -> PROD, pero puedes ajustarlo manualmente.",
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant,
                        )

                        VisibilityCheckRow(
                            label = "Mostrar links QA",
                            checked = showQaLinks,
                            enabled = !isSubmitting,
                            onCheckedChange = { checked ->
                                showQaLinks = checked
                                isManualVisibility = true
                            },
                        )
                        VisibilityCheckRow(
                            label = "Mostrar links STG",
                            checked = showStgLinks,
                            enabled = !isSubmitting,
                            onCheckedChange = { checked ->
                                showStgLinks = checked
                                isManualVisibility = true
                            },
                        )
                        VisibilityCheckRow(
                            label = "Mostrar links PROD",
                            checked = showProdLinks,
                            enabled = !isSubmitting,
                            onCheckedChange = { checked ->
                                showProdLinks = checked
                                isManualVisibility = true
                            },
                        )

                        if (visibilityHasError) {
                            Text(
                                text = "Debes seleccionar al menos un ambiente visible.",
                                style = MaterialTheme.typography.bodySmall,
                                color = FormErrorColor,
                            )
                        }

                        TextButton(
                            onClick = {
                                val sequential = sequentialVisibilityForEnvironment(currentEnvironment)
                                showQaLinks = sequential.first
                                showStgLinks = sequential.second
                                showProdLinks = sequential.third
                                isManualVisibility = false
                            },
                            enabled = !isSubmitting,
                        ) {
                            Text("Aplicar flujo secuencial")
                        }
                    }
                }

                OutlinedTextField(
                    value = workfrontLink,
                    onValueChange = { workfrontLink = it },
                    label = { Text("Workfront *") },
                    isError = workfrontHasError,
                    modifier = Modifier.fillMaxWidth(),
                    singleLine = true,
                )

                OutlinedTextField(
                    value = onedriveLink,
                    onValueChange = { onedriveLink = it },
                    label = { Text("OneDrive *") },
                    isError = onedriveHasError,
                    modifier = Modifier.fillMaxWidth(),
                    singleLine = true,
                )

                if (hasTriedSubmit && !canSubmit) {
                    Text(
                        text = "Completa los campos obligatorios para guardar el cambio.",
                        style = MaterialTheme.typography.bodySmall,
                        color = FormErrorColor,
                    )
                }
            }
        }

        if (errorMessage != null) {
            FormErrorCard(message = errorMessage)
        }

        if (showActionButtons) {
            Card(modifier = Modifier.fillMaxWidth()) {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(12.dp),
                    verticalArrangement = Arrangement.spacedBy(8.dp),
                ) {
                    Button(
                        onClick = {
                            onSubmit(
                                name.trim(),
                                description.trim(),
                                status.trim(),
                                priority.trim(),
                                currentEnvironment.trim(),
                                showQaLinks,
                                showStgLinks,
                                showProdLinks,
                                normalizedAssignedTo,
                                workfrontLink.trim(),
                                onedriveLink.trim(),
                            )
                        },
                        enabled = canSubmit,
                        modifier = Modifier.fillMaxWidth(),
                    ) {
                        Text(if (isSubmitting) "Guardando..." else submitLabel)
                    }

                    Button(
                        onClick = onBack,
                        enabled = !isSubmitting,
                        modifier = Modifier.fillMaxWidth(),
                    ) {
                        Text("Cancelar")
                    }
                }
            }
        }
    }
}

private fun normalizedDropdownOption(
    rawValue: String,
    options: List<String>,
    fallback: String,
): String {
    val normalizedRaw = rawValue.trim()
    if (normalizedRaw.isBlank()) return fallback
    val matchingOption = options.firstOrNull { option ->
        option.equals(normalizedRaw, ignoreCase = true)
    }
    return matchingOption ?: fallback
}

private fun normalizedStatusOption(
    rawValue: String,
    options: List<String>,
    fallback: String,
): String {
    val normalizedRaw = rawValue.trim().lowercase()
    if (normalizedRaw.isBlank()) return fallback

    val canonical = when (normalizedRaw) {
        "en progreso" -> "en desarrollo"
        "en revision de qa", "en revisión de qa", "en revision qa", "revision qa" -> "en revision de qa"
        "completado", "qa aprobado", "completado (qa aprobado)" -> "completado (qa aprobado)"
        else -> normalizedRaw
    }

    val matchingOption = options.firstOrNull { option ->
        option.equals(canonical, ignoreCase = true)
    }
    return matchingOption ?: fallback
}

@Composable
private fun VisibilityCheckRow(
    label: String,
    checked: Boolean,
    enabled: Boolean,
    onCheckedChange: (Boolean) -> Unit,
    modifier: Modifier = Modifier,
) {
    Row(
        modifier = modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = androidx.compose.ui.Alignment.CenterVertically,
    ) {
        Text(
            text = label,
            style = MaterialTheme.typography.bodyMedium,
        )
        Checkbox(
            checked = checked,
            onCheckedChange = onCheckedChange,
            enabled = enabled,
        )
    }
}

@Composable
private fun AssigneePill(
    value: String,
    onRemove: (() -> Unit)?,
    modifier: Modifier = Modifier,
) {
    Surface(
        modifier = modifier,
        color = MaterialTheme.colorScheme.primaryContainer,
        shape = MaterialTheme.shapes.large,
    ) {
        Row(
            modifier = Modifier.padding(start = 10.dp, end = 4.dp, top = 2.dp, bottom = 2.dp),
            verticalAlignment = androidx.compose.ui.Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(2.dp),
        ) {
            Text(
                text = value,
                style = MaterialTheme.typography.labelMedium,
                color = MaterialTheme.colorScheme.onPrimaryContainer,
            )
            if (onRemove != null) {
                IconButton(
                    onClick = onRemove,
                    modifier = Modifier.padding(0.dp),
                ) {
                    Icon(
                        imageVector = Icons.Filled.Close,
                        contentDescription = "Quitar asignado",
                        tint = MaterialTheme.colorScheme.onPrimaryContainer,
                    )
                }
            }
        }
    }
}

private fun sequentialVisibilityForEnvironment(environment: String): Triple<Boolean, Boolean, Boolean> {
    return when (environment.trim().uppercase()) {
        "QA" -> Triple(true, false, false)
        "STG" -> Triple(true, true, false)
        "PROD" -> Triple(true, true, true)
        else -> Triple(true, false, false)
    }
}

private fun matchesSequentialVisibility(
    environment: String,
    showQaLinks: Boolean,
    showStgLinks: Boolean,
    showProdLinks: Boolean,
): Boolean {
    val sequential = sequentialVisibilityForEnvironment(environment)
    return showQaLinks == sequential.first &&
        showStgLinks == sequential.second &&
        showProdLinks == sequential.third
}
