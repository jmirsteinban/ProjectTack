package com.example.projecttrack.data

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

@Serializable
data class ProjectTodoNoteRow(
    val id: String,
    @SerialName("project_id")
    val projectId: String? = null,
    @SerialName("change_id")
    val changeId: String? = null,
    val text: String? = null,
    @SerialName("is_todo")
    val isTodo: Boolean? = null,
    val status: String? = null,
    @SerialName("created_by")
    val createdBy: String? = null,
    @SerialName("assigned_to")
    val assignedTo: String? = null,
    @SerialName("created_at")
    val createdAt: String? = null,
    @SerialName("is_deleted")
    val isDeleted: Boolean? = null,
    @SerialName("deleted_at")
    val deletedAt: String? = null,
    @SerialName("deleted_by")
    val deletedBy: String? = null,
)
