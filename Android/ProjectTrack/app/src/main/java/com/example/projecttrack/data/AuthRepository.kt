package com.example.projecttrack.data

import com.example.projecttrack.BuildConfig
import io.github.jan.supabase.auth.auth
import io.github.jan.supabase.auth.exception.AuthErrorCode
import io.github.jan.supabase.auth.exception.AuthRestException
import io.github.jan.supabase.auth.exception.AuthWeakPasswordException
import io.github.jan.supabase.auth.providers.builtin.Email
import io.github.jan.supabase.auth.status.SessionStatus
import kotlinx.coroutines.flow.StateFlow
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.JsonPrimitive
import kotlinx.serialization.json.buildJsonObject
import kotlinx.serialization.json.contentOrNull
import kotlinx.serialization.json.jsonPrimitive

object AuthRepository {
    private val auth get() = SupabaseProvider.client.auth

    val sessionStatus: StateFlow<SessionStatus>
        get() = auth.sessionStatus

    suspend fun signInWithEmail(email: String, password: String) {
        requireSupabaseConfig()
        auth.signInWith(Email) {
            this.email = email.trim()
            this.password = password
        }
    }

    suspend fun signUpWithEmail(email: String, password: String) {
        requireSupabaseConfig()
        auth.signUpWith(Email) {
            this.email = email.trim()
            this.password = password
        }
    }

    suspend fun sendPasswordResetEmail(email: String) {
        requireSupabaseConfig()
        auth.resetPasswordForEmail(email.trim())
    }

    suspend fun signOut() {
        auth.signOut()
    }

    fun currentUserIdOrNull(): String? = auth.currentUserOrNull()?.id

    fun currentUserEmailOrNull(): String? = auth.currentUserOrNull()?.email

    fun currentUserDisplayNameOrNull(): String? =
        metadataDisplayName(auth.currentUserOrNull()?.userMetadata)

    suspend fun updateCurrentUserDisplayName(displayName: String) {
        requireSupabaseConfig()
        val normalizedDisplayName = displayName.trim()
        if (normalizedDisplayName.isBlank()) {
            throw IllegalArgumentException("El nombre no puede estar vacio.")
        }

        val mergedMetadata = buildJsonObject {
            auth.currentUserOrNull()?.userMetadata?.forEach { (key, value) ->
                put(key, value)
            }
            put("full_name", JsonPrimitive(normalizedDisplayName))
        }

        auth.updateUser {
            data = mergedMetadata
        }

        auth.retrieveUserForCurrentSession(updateSession = true)
    }

    fun mapLoginError(error: Throwable): String = mapAuthError(error, AuthAction.Login)

    fun mapSignUpError(error: Throwable): String = mapAuthError(error, AuthAction.SignUp)

    fun mapPasswordResetError(error: Throwable): String = mapAuthError(error, AuthAction.PasswordReset)

    fun mapProfileUpdateError(error: Throwable): String = mapAuthError(error, AuthAction.ProfileUpdate)

    private fun mapAuthError(error: Throwable, action: AuthAction): String {
        val authRestException = error as? AuthRestException
        if (error is AuthWeakPasswordException) {
            val reasons = error.reasons.joinToString(", ").trim()
            return if (reasons.isBlank()) {
                "La contrasena es demasiado debil."
            } else {
                "La contrasena es demasiado debil: $reasons"
            }
        }

        if (authRestException != null) {
            return when (authRestException.errorCode) {
                AuthErrorCode.InvalidCredentials ->
                    "Correo o contrasena incorrectos."

                AuthErrorCode.EmailNotConfirmed ->
                    "Debes confirmar tu correo antes de iniciar sesion."

                AuthErrorCode.UserAlreadyExists, AuthErrorCode.EmailExists ->
                    "Ya existe una cuenta con ese correo."

                AuthErrorCode.SignupDisabled ->
                    "El registro de usuarios esta deshabilitado."

                AuthErrorCode.EmailProviderDisabled ->
                    "El acceso por correo esta deshabilitado en Supabase."

                AuthErrorCode.OverRequestRateLimit, AuthErrorCode.OverEmailSendRateLimit ->
                    "Demasiados intentos. Espera un momento e intenta de nuevo."

                AuthErrorCode.UserNotFound ->
                    if (action == AuthAction.PasswordReset) {
                        "No hay cuenta asociada a ese correo."
                    } else {
                        "Usuario no encontrado."
                    }

                else -> {
                    authRestException.message?.takeIf { it.isNotBlank() } ?: defaultErrorMessage(action)
                }
            }
        }

        val rawMessage = buildString {
            append(error.message.orEmpty())
            val causeMessage = error.cause?.message
            if (!causeMessage.isNullOrBlank()) {
                append(" ")
                append(causeMessage)
            }
        }.trim()
        val message = rawMessage.lowercase()

        return when {
            message.contains("invalid login credentials") || message.contains("invalid_credentials") ->
                "Correo o contrasena incorrectos."

            message.contains("email not confirmed") || message.contains("email_not_confirmed") ->
                "Debes confirmar tu correo en Supabase antes de iniciar sesion."

            message.contains("unable to resolve host") ||
                message.contains("failed to connect") ||
                message.contains("timeout") ||
            message.contains("network") ->
                "No se pudo conectar con Supabase. Revisa tu conexion a internet."

            rawMessage.contains("SUPABASE_URL") || rawMessage.contains("SUPABASE_PUBLISHABLE_KEY") ->
                rawMessage

            rawMessage.isNotBlank() -> rawMessage

            else -> defaultErrorMessage(action)
        }
    }

    private fun defaultErrorMessage(action: AuthAction): String {
        return when (action) {
            AuthAction.Login -> "No se pudo iniciar sesion."
            AuthAction.SignUp -> "No se pudo crear la cuenta."
            AuthAction.PasswordReset -> "No se pudo enviar el correo de recuperacion."
            AuthAction.ProfileUpdate -> "No se pudo actualizar el perfil."
        }
    }

    private fun metadataDisplayName(metadata: JsonObject?): String? {
        if (metadata == null) return null
        val fullName = metadata["full_name"]?.jsonPrimitive?.contentOrNull?.trim().orEmpty()
        if (fullName.isNotBlank()) return fullName
        val name = metadata["name"]?.jsonPrimitive?.contentOrNull?.trim().orEmpty()
        return name.takeIf { it.isNotBlank() }
    }

    private fun requireSupabaseConfig() {
        val hasUrl = BuildConfig.SUPABASE_URL.isNotBlank()
        val hasKey = BuildConfig.SUPABASE_PUBLISHABLE_KEY.isNotBlank()
        if (hasUrl && hasKey) return
        throw IllegalStateException(
            "Falta configurar SUPABASE_URL y SUPABASE_PUBLISHABLE_KEY en local.properties",
        )
    }

    private enum class AuthAction {
        Login,
        SignUp,
        PasswordReset,
        ProfileUpdate,
    }
}
