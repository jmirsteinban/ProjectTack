package com.example.projecttrack.data

data class ProjectTodoNote(
    val id: String,
    val projectId: String,
    val changeId: String?,
    val text: String,
    val status: String, // "Pendiente", "Completado"
    val isTodo: Boolean,
    val createdBy: String?,
    val assignedTo: String?,
    val assigneeIds: List<String> = emptyList(),
    val createdAt: String,
)
