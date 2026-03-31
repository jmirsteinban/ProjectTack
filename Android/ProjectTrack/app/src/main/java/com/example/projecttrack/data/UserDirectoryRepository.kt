package com.example.projecttrack.data

import io.github.jan.supabase.postgrest.from
import io.github.jan.supabase.postgrest.query.Columns
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.contentOrNull
import kotlinx.serialization.json.jsonPrimitive

object UserDirectoryRepository {
    suspend fun fetchAssigneeSuggestions(): List<AssigneeSuggestion> {
        val rows = SupabaseProvider.client
            .from("users")
            .select(columns = Columns.ALL)
            .decodeAs<List<JsonObject>>()

        val uniqueSuggestions = linkedMapOf<String, AssigneeSuggestion>()

        rows.forEach { row ->
            val id = row.stringValue("id")
            val userId = row.stringValue("user_id")
            val email = row.stringValue("email")
            val displayName = row.stringValue("display_name")
                ?: row.stringValue("full_name")
                ?: row.stringValue("name")

            val value = id ?: userId ?: email ?: return@forEach
            val label = when {
                !displayName.isNullOrBlank() && !email.isNullOrBlank() -> "@$displayName ($email)"
                !displayName.isNullOrBlank() -> "@$displayName"
                !email.isNullOrBlank() -> "@$email"
                else -> "@$value"
            }

            val key = value.lowercase()
            if (!uniqueSuggestions.containsKey(key)) {
                uniqueSuggestions[key] = AssigneeSuggestion(
                    value = value,
                    label = label,
                )
            }
        }

        return uniqueSuggestions.values.toList()
    }
}

private fun JsonObject.stringValue(key: String): String? {
    return this[key]
        ?.jsonPrimitive
        ?.contentOrNull
        ?.trim()
        ?.takeIf { value -> value.isNotBlank() }
}
