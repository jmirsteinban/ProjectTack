package com.example.projecttrack.data

import io.github.jan.supabase.postgrest.from

object HealthcheckRepository {
    suspend fun fetchHealthcheck(): List<HealthcheckRow> {
        return SupabaseProvider.client
            .from("healthcheck")
            .select()
            .decodeAs<List<HealthcheckRow>>()
    }
}