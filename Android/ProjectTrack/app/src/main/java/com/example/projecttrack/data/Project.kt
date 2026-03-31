package com.example.projecttrack.data

data class Project(
    val id: String,
    val name: String,
    val description: String,
    val startDate: String, // Usa String por simplicidad, luego LocalDate.
    val onedriveLink: String? = null,
    val workfrontLink: String? = null,
    val qaUrls: Map<String, String> = emptyMap(),
    val stgUrls: Map<String, String> = emptyMap(),
    val prodUrls: Map<String, String> = emptyMap(),
)
