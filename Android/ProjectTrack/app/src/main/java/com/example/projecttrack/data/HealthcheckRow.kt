package com.example.projecttrack.data

import kotlinx.serialization.Serializable

@Serializable
data class HealthcheckRow(
    val id: Long,
    val message: String,
    val created_at: String,
)