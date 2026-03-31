package com.example.projecttrack.ui.screens

import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalFocusManager
import androidx.compose.ui.platform.LocalSoftwareKeyboardController
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp

@Composable
fun ProfileScreen(
    currentDisplayName: String,
    isSavingDisplayName: Boolean,
    displayNameErrorMessage: String?,
    displayNameInfoMessage: String?,
    onSaveDisplayName: (String) -> Unit,
    userEmail: String,
    userId: String,
    isAuthenticated: Boolean,
    projectsCount: Int,
    changesCount: Int,
    dataWarningMessage: String?,
    modifier: Modifier = Modifier,
) {
    val focusManager = LocalFocusManager.current
    val keyboardController = LocalSoftwareKeyboardController.current
    val formTapSource = remember { MutableInteractionSource() }

    var displayNameInput by rememberSaveable(currentDisplayName) { mutableStateOf(currentDisplayName) }
    val emailLabel = userEmail.ifBlank { "No disponible" }
    val idLabel = userId.ifBlank { "No disponible" }
    val authLabel = if (isAuthenticated) "Sesion activa" else "Sesion no autenticada"
    val normalizedCurrentName = currentDisplayName.trim()
    val normalizedInputName = displayNameInput.trim()
    val canSaveDisplayName = !isSavingDisplayName &&
        normalizedInputName.isNotBlank() &&
        normalizedInputName != normalizedCurrentName

    LazyColumn(
        modifier = modifier
            .fillMaxSize()
            .clickable(
                interactionSource = formTapSource,
                indication = null,
            ) {
                focusManager.clearFocus(force = true)
                keyboardController?.hide()
            },
        contentPadding = PaddingValues(16.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp),
    ) {
        item {
            Card(modifier = Modifier.fillMaxWidth()) {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(14.dp),
                    verticalArrangement = Arrangement.spacedBy(8.dp),
                ) {
                    Text(
                        text = "Perfil",
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.SemiBold,
                    )
                    OutlinedTextField(
                        value = displayNameInput,
                        onValueChange = { displayNameInput = it },
                        singleLine = true,
                        label = { Text("Nombre visible") },
                        modifier = Modifier.fillMaxWidth(),
                    )
                    Button(
                        onClick = { onSaveDisplayName(displayNameInput) },
                        enabled = canSaveDisplayName,
                        modifier = Modifier.fillMaxWidth(),
                    ) {
                        Text(if (isSavingDisplayName) "Guardando..." else "Guardar nombre")
                    }
                    if (!displayNameErrorMessage.isNullOrBlank()) {
                        Text(
                            text = "Error: $displayNameErrorMessage",
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.error,
                        )
                    }
                    if (!displayNameInfoMessage.isNullOrBlank()) {
                        Text(
                            text = displayNameInfoMessage,
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.primary,
                        )
                    }
                }
            }
        }

        item {
            InfoCard(
                title = "Cuenta",
                lines = listOf(
                    "Estado: $authLabel",
                    "Correo: $emailLabel",
                    "ID: $idLabel",
                    "Nombre visible: ${normalizedCurrentName.ifBlank { "No definido" }}",
                ),
            )
        }

        item {
            InfoCard(
                title = "Datos cargados",
                lines = listOf(
                    "Proyectos visibles: $projectsCount",
                    "Cambios visibles: $changesCount",
                ),
            )
        }

        if (!dataWarningMessage.isNullOrBlank()) {
            item {
                InfoCard(
                    title = "Aviso de acceso",
                    lines = listOf(dataWarningMessage),
                )
            }
        }
    }
}

@Composable
private fun InfoCard(
    title: String,
    lines: List<String>,
    modifier: Modifier = Modifier,
) {
    Card(
        modifier = modifier.fillMaxWidth(),
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(14.dp),
            verticalArrangement = Arrangement.spacedBy(8.dp),
        ) {
            Text(
                text = title,
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.SemiBold,
            )
            lines.forEach { line ->
                Text(
                    text = line,
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                )
            }
        }
    }
}
