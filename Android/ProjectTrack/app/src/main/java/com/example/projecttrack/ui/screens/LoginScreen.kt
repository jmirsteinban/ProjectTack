package com.example.projecttrack.ui.screens

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.gestures.awaitEachGesture
import androidx.compose.foundation.gestures.awaitFirstDown
import androidx.compose.foundation.gestures.waitForUpOrCancellation
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.input.pointer.PointerEventPass
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.layout.LayoutCoordinates
import androidx.compose.ui.layout.onGloballyPositioned
import androidx.compose.ui.platform.LocalFocusManager
import androidx.compose.ui.platform.LocalSoftwareKeyboardController
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp

private const val SHOW_SELF_SERVICE_AUTH_ACTIONS = false

@Composable
fun LoginScreen(
    isSessionInitializing: Boolean,
    isSubmitting: Boolean,
    errorMessage: String?,
    infoMessage: String?,
    onLogin: (email: String, password: String) -> Unit,
    onSignUp: (email: String, password: String) -> Unit,
    onRecoverPassword: (email: String) -> Unit,
    modifier: Modifier = Modifier,
) {
    var email by rememberSaveable { mutableStateOf("") }
    var password by rememberSaveable { mutableStateOf("") }
    var containerCoordinates by remember { mutableStateOf<LayoutCoordinates?>(null) }
    var emailFieldCoordinates by remember { mutableStateOf<LayoutCoordinates?>(null) }
    var passwordFieldCoordinates by remember { mutableStateOf<LayoutCoordinates?>(null) }
    val focusManager = LocalFocusManager.current
    val keyboardController = LocalSoftwareKeyboardController.current
    val canSubmitWithPassword = !isSessionInitializing && !isSubmitting && email.isNotBlank() && password.isNotBlank()
    val canRecoverPassword = !isSessionInitializing && !isSubmitting && email.isNotBlank()

    fun dismissKeyboardAndClearFocus() {
        focusManager.clearFocus(force = true)
        keyboardController?.hide()
    }

    Box(
        modifier = modifier
            .fillMaxSize()
            .onGloballyPositioned { coordinates ->
                containerCoordinates = coordinates
            }
            .pointerInput(containerCoordinates, emailFieldCoordinates, passwordFieldCoordinates) {
                awaitEachGesture {
                    val down = awaitFirstDown(pass = PointerEventPass.Final)
                    if (waitForUpOrCancellation(pass = PointerEventPass.Final) == null) return@awaitEachGesture
                    val container = containerCoordinates ?: return@awaitEachGesture

                    val tappedInsideInput = isTapInsideField(
                        containerCoordinates = container,
                        fieldCoordinates = emailFieldCoordinates,
                        tapOffsetInContainer = down.position,
                    ) || isTapInsideField(
                        containerCoordinates = container,
                        fieldCoordinates = passwordFieldCoordinates,
                        tapOffsetInContainer = down.position,
                    )

                    if (!tappedInsideInput) {
                        dismissKeyboardAndClearFocus()
                    }
                }
            }
            .padding(16.dp),
        contentAlignment = Alignment.Center,
    ) {
        Card(modifier = Modifier.fillMaxWidth()) {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(16.dp),
                verticalArrangement = Arrangement.spacedBy(12.dp),
            ) {
                Text(
                    text = "Iniciar sesion",
                    style = MaterialTheme.typography.headlineSmall,
                    fontWeight = FontWeight.Bold,
                )

                Text(
                    text = "Ingresa con tu cuenta del sistema.",
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                )

                OutlinedTextField(
                    value = email,
                    onValueChange = { email = it },
                    label = { Text("Correo") },
                    singleLine = true,
                    keyboardOptions = KeyboardOptions(
                        keyboardType = KeyboardType.Email,
                        imeAction = ImeAction.Next,
                    ),
                    modifier = Modifier
                        .fillMaxWidth()
                        .onGloballyPositioned { coordinates ->
                            emailFieldCoordinates = coordinates
                        },
                )

                OutlinedTextField(
                    value = password,
                    onValueChange = { password = it },
                    label = { Text("Contrasena") },
                    singleLine = true,
                    keyboardOptions = KeyboardOptions(
                        keyboardType = KeyboardType.Password,
                        imeAction = ImeAction.Done,
                    ),
                    visualTransformation = PasswordVisualTransformation(),
                    modifier = Modifier
                        .fillMaxWidth()
                        .onGloballyPositioned { coordinates ->
                            passwordFieldCoordinates = coordinates
                        },
                )

                if (errorMessage != null) {
                    Text(
                        text = "Error: $errorMessage",
                        color = MaterialTheme.colorScheme.error,
                        style = MaterialTheme.typography.bodySmall,
                    )
                }

                if (infoMessage != null) {
                    Text(
                        text = infoMessage,
                        color = MaterialTheme.colorScheme.primary,
                        style = MaterialTheme.typography.bodySmall,
                    )
                }

                Button(
                    onClick = {
                        dismissKeyboardAndClearFocus()
                        onLogin(email, password)
                    },
                    enabled = canSubmitWithPassword,
                    modifier = Modifier.fillMaxWidth(),
                ) {
                    Text(
                        when {
                            isSessionInitializing -> "Cargando sesion..."
                            isSubmitting -> "Ingresando..."
                            else -> "Ingresar"
                        },
                    )
                }

                if (SHOW_SELF_SERVICE_AUTH_ACTIONS) {
                    OutlinedButton(
                        onClick = {
                            dismissKeyboardAndClearFocus()
                            onSignUp(email, password)
                        },
                        enabled = canSubmitWithPassword,
                        modifier = Modifier.fillMaxWidth(),
                    ) {
                        Text(if (isSubmitting) "Procesando..." else "Crear cuenta")
                    }

                    TextButton(
                        onClick = {
                            dismissKeyboardAndClearFocus()
                            onRecoverPassword(email)
                        },
                        enabled = canRecoverPassword,
                        modifier = Modifier.fillMaxWidth(),
                    ) {
                        Text(if (isSubmitting) "Procesando..." else "Olvide mi contrasena")
                    }
                }
            }
        }
    }
}

private fun isTapInsideField(
    containerCoordinates: LayoutCoordinates,
    fieldCoordinates: LayoutCoordinates?,
    tapOffsetInContainer: Offset,
): Boolean {
    if (fieldCoordinates == null || !fieldCoordinates.isAttached || !containerCoordinates.isAttached) {
        return false
    }
    val tapOffsetInField = fieldCoordinates.localPositionOf(containerCoordinates, tapOffsetInContainer)
    return tapOffsetInField.x >= 0f &&
        tapOffsetInField.y >= 0f &&
        tapOffsetInField.x <= fieldCoordinates.size.width &&
        tapOffsetInField.y <= fieldCoordinates.size.height
}
