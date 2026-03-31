package com.example.projecttrack.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.MaterialTheme
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
import androidx.compose.ui.platform.LocalFocusManager
import androidx.compose.ui.platform.LocalSoftwareKeyboardController
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.example.projecttrack.ui.theme.DashboardHeroGradientColors
import com.example.projecttrack.ui.theme.DashboardHeroSubtitleColor
import com.example.projecttrack.ui.theme.PillOnColor
import com.example.projecttrack.ui.theme.UrlGroupProdColor
import com.example.projecttrack.ui.theme.UrlGroupQaColor
import com.example.projecttrack.ui.theme.UrlGroupStgColor
import java.text.Normalizer

@Composable
fun ProjectEditorScreen(
    title: String,
    initialName: String,
    initialDescription: String,
    initialStartDate: String,
    initialWorkfrontLink: String,
    initialOneDriveLink: String,
    initialQaUrls: Map<String, String>,
    initialStgUrls: Map<String, String>,
    initialProdUrls: Map<String, String>,
    submitLabel: String,
    isSubmitting: Boolean,
    errorMessage: String?,
    onSubmit: (
        name: String,
        description: String,
        startDate: String,
        workfrontLink: String,
        oneDriveLink: String,
        qaUrls: Map<String, String>,
        stgUrls: Map<String, String>,
        prodUrls: Map<String, String>,
    ) -> Unit,
    onBack: () -> Unit,
    showActionButtons: Boolean = true,
    submitTrigger: Int = 0,
    onCanSubmitChange: ((Boolean) -> Unit)? = null,
    modifier: Modifier = Modifier,
) {
    val focusManager = LocalFocusManager.current
    val keyboardController = LocalSoftwareKeyboardController.current
    val formTapSource = remember { MutableInteractionSource() }

    var name by remember { mutableStateOf(initialName) }
    var description by remember { mutableStateOf(initialDescription) }
    var startDate by remember { mutableStateOf(initialStartDate) }
    var workfrontLink by remember { mutableStateOf(initialWorkfrontLink) }
    var oneDriveLink by remember { mutableStateOf(initialOneDriveLink) }
    var qaEntries by remember { mutableStateOf(urlMapToEntries(initialQaUrls)) }
    var stgEntries by remember { mutableStateOf(urlMapToEntries(initialStgUrls)) }
    var prodEntries by remember { mutableStateOf(urlMapToEntries(initialProdUrls)) }

    LaunchedEffect(
        initialName,
        initialDescription,
        initialStartDate,
        initialWorkfrontLink,
        initialOneDriveLink,
        initialQaUrls,
        initialStgUrls,
        initialProdUrls,
    ) {
        name = initialName
        description = initialDescription
        startDate = initialStartDate
        workfrontLink = initialWorkfrontLink
        oneDriveLink = initialOneDriveLink
        qaEntries = urlMapToEntries(initialQaUrls)
        stgEntries = urlMapToEntries(initialStgUrls)
        prodEntries = urlMapToEntries(initialProdUrls)
    }

    val canSubmit = !isSubmitting && name.isNotBlank()

    LaunchedEffect(canSubmit) {
        onCanSubmitChange?.invoke(canSubmit)
    }

    LaunchedEffect(submitTrigger) {
        if (submitTrigger > 0 && canSubmit) {
            onSubmit(
                name.trim(),
                description.trim(),
                startDate.trim(),
                workfrontLink.trim(),
                oneDriveLink.trim(),
                urlEntriesToMap(qaEntries),
                urlEntriesToMap(stgEntries),
                urlEntriesToMap(prodEntries),
            )
        }
    }

    LazyColumn(
        modifier = modifier
            .fillMaxSize()
            .clickable(
                interactionSource = formTapSource,
                indication = null,
            ) {
                focusManager.clearFocus(force = true)
                keyboardController?.hide()
            }
            .padding(start = 16.dp, end = 16.dp, bottom = 16.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp),
    ) {
        item {
            EditorHeroCard(
                title = title,
                subtitle = "Completa la informacion del proyecto y sus ambientes",
            )
        }

        item {
            Card(modifier = Modifier.fillMaxWidth()) {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(14.dp),
                    verticalArrangement = Arrangement.spacedBy(12.dp),
                ) {
                    Text(
                        text = "Datos generales",
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.SemiBold,
                    )

                    OutlinedTextField(
                        value = name,
                        onValueChange = { name = it },
                        label = { Text("Nombre *") },
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

                    OutlinedTextField(
                        value = startDate,
                        onValueChange = { startDate = it },
                        label = { Text("Fecha inicio (AAAA-MM-DD)") },
                        modifier = Modifier.fillMaxWidth(),
                        singleLine = true,
                    )

                    OutlinedTextField(
                        value = workfrontLink,
                        onValueChange = { workfrontLink = it },
                        label = { Text("Workfront link") },
                        modifier = Modifier.fillMaxWidth(),
                        singleLine = true,
                    )

                    OutlinedTextField(
                        value = oneDriveLink,
                        onValueChange = { oneDriveLink = it },
                        label = { Text("One Drive link") },
                        modifier = Modifier.fillMaxWidth(),
                        singleLine = true,
                    )
                }
            }
        }

        item {
            EnvironmentUrlsEditorCard(
                title = "QA",
                accentColor = UrlGroupQaColor,
                entries = qaEntries,
                onEntriesChange = { qaEntries = it },
            )
        }

        item {
            EnvironmentUrlsEditorCard(
                title = "STG",
                accentColor = UrlGroupStgColor,
                entries = stgEntries,
                onEntriesChange = { stgEntries = it },
            )
        }

        item {
            EnvironmentUrlsEditorCard(
                title = "PROD",
                accentColor = UrlGroupProdColor,
                entries = prodEntries,
                onEntriesChange = { prodEntries = it },
            )
        }

        if (errorMessage != null) {
            item {
                FormErrorCard(message = errorMessage)
            }
        }

        if (showActionButtons) {
            item {
                Card(modifier = Modifier.fillMaxWidth()) {
                    Column(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(12.dp),
                        verticalArrangement = Arrangement.spacedBy(6.dp),
                    ) {
                        Button(
                            onClick = {
                                onSubmit(
                                    name.trim(),
                                    description.trim(),
                                    startDate.trim(),
                                    workfrontLink.trim(),
                                    oneDriveLink.trim(),
                                    urlEntriesToMap(qaEntries),
                                    urlEntriesToMap(stgEntries),
                                    urlEntriesToMap(prodEntries),
                                )
                            },
                            enabled = canSubmit,
                            modifier = Modifier.fillMaxWidth(),
                        ) {
                            Text(if (isSubmitting) "Guardando..." else submitLabel)
                        }

                        TextButton(
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
}

@Composable
private fun EditorHeroCard(
    title: String,
    subtitle: String,
    modifier: Modifier = Modifier,
) {
    Card(
        modifier = modifier.fillMaxWidth(),
        shape = RoundedCornerShape(topStart = 0.dp, topEnd = 0.dp, bottomStart = 12.dp, bottomEnd = 12.dp),
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .background(
                    brush = Brush.linearGradient(
                        colors = DashboardHeroGradientColors,
                    ),
                )
                .padding(18.dp),
            verticalArrangement = Arrangement.spacedBy(8.dp),
        ) {
            Text(
                text = title,
                style = MaterialTheme.typography.headlineSmall,
                color = PillOnColor,
                fontWeight = FontWeight.Bold,
            )
            Text(
                text = subtitle,
                style = MaterialTheme.typography.bodyMedium,
                color = DashboardHeroSubtitleColor,
            )
        }
    }
}

@Composable
private fun EnvironmentUrlsEditorCard(
    title: String,
    accentColor: androidx.compose.ui.graphics.Color,
    entries: List<UrlEntry>,
    onEntriesChange: (List<UrlEntry>) -> Unit,
    modifier: Modifier = Modifier,
) {
    Card(modifier = modifier.fillMaxWidth()) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(14.dp),
            verticalArrangement = Arrangement.spacedBy(10.dp),
        ) {
            Surface(
                color = accentColor,
                shape = MaterialTheme.shapes.small,
            ) {
                Text(
                    text = title,
                    style = MaterialTheme.typography.labelLarge,
                    color = PillOnColor,
                    modifier = Modifier.padding(horizontal = 10.dp, vertical = 5.dp),
                )
            }

            Text(
                text = "Agrega nombre y URL para este ambiente.",
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
            )

            if (entries.isEmpty()) {
                Text(
                    text = "Sin URLs configuradas.",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                )
            } else {
                entries.forEachIndexed { index, entry ->
                    Card(modifier = Modifier.fillMaxWidth()) {
                        Column(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(10.dp),
                            verticalArrangement = Arrangement.spacedBy(8.dp),
                        ) {
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween,
                            ) {
                                Text(
                                    text = "URL ${index + 1}",
                                    style = MaterialTheme.typography.labelMedium,
                                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                                )
                                TextButton(
                                    onClick = {
                                        onEntriesChange(
                                            entries.filterIndexed { currentIndex, _ ->
                                                currentIndex != index
                                            },
                                        )
                                    },
                                ) {
                                    Text("Quitar")
                                }
                            }

                            OutlinedTextField(
                                value = entry.name,
                                onValueChange = { updatedName ->
                                    onEntriesChange(
                                        entries.mapIndexed { currentIndex, currentEntry ->
                                            if (currentIndex == index) {
                                                currentEntry.copy(name = updatedName)
                                            } else {
                                                currentEntry
                                            }
                                        },
                                    )
                                },
                                label = { Text("Nombre") },
                                placeholder = { Text("Ejemplo: web principal") },
                                modifier = Modifier.fillMaxWidth(),
                                singleLine = true,
                            )

                            OutlinedTextField(
                                value = entry.url,
                                onValueChange = { updatedUrl ->
                                    onEntriesChange(
                                        entries.mapIndexed { currentIndex, currentEntry ->
                                            if (currentIndex == index) {
                                                currentEntry.copy(url = updatedUrl)
                                            } else {
                                                currentEntry
                                            }
                                        },
                                    )
                                },
                                label = { Text("URL") },
                                placeholder = { Text("https://...") },
                                modifier = Modifier.fillMaxWidth(),
                                singleLine = true,
                            )
                        }
                    }
                }
            }

            Button(
                onClick = { onEntriesChange(entries + UrlEntry()) },
                modifier = Modifier.fillMaxWidth(),
            ) {
                Text("Agregar URL")
            }
        }
    }
}

private data class UrlEntry(
    val name: String = "",
    val url: String = "",
)

private fun urlMapToEntries(source: Map<String, String>): List<UrlEntry> {
    return source
        .toSortedMap()
        .map { (key, value) ->
            UrlEntry(
                name = key.replace("_", " "),
                url = value,
            )
        }
}

private fun urlEntriesToMap(entries: List<UrlEntry>): Map<String, String> {
    return entries
        .mapNotNull { entry ->
            val key = normalizeUrlName(entry.name)
            val value = entry.url.trim()
            if (key.isBlank() || value.isBlank()) {
                null
            } else {
                key to value
            }
        }
        .toMap()
}

private fun normalizeUrlName(rawValue: String): String {
    val ascii = Normalizer
        .normalize(rawValue, Normalizer.Form.NFD)
        .replace("\\p{M}+".toRegex(), "")

    return ascii
        .lowercase()
        .trim()
        .replace("[^a-z0-9]+".toRegex(), "_")
        .trim('_')
}
