package com.example.projecttrack.data

data class Change(
    val id: String,
    val projectId: String,
    val name: String,
    val description: String,
    val status: String, // "Pendiente", "En desarrollo", "En revision de QA", "Completado (QA aprobado)".
    val priority: String, // "Baja", "Media", "Alta".
    val assignedTo: String = "",
    val assigneeIds: List<String> = emptyList(),
    val workfrontLink: String = "",
    val onedriveLink: String = "",
    val currentEnvironment: String = "QA",
    val showQaLinks: Boolean = true,
    val showStgLinks: Boolean = false,
    val showProdLinks: Boolean = false,
)
