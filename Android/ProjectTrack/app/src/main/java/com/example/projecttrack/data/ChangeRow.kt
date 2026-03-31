package com.example.projecttrack.data

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

@Serializable
data class ChangeRow(
    val id: String,
    @SerialName("project_id")
    val projectId: String? = null,
    @SerialName("assigned_to")
    val assignedTo: String? = null,
    @SerialName("workfront_link")
    val workfrontLink: String? = null,
    @SerialName("onedrive_link")
    val onedriveLink: String? = null,
    @SerialName("current_environment")
    val currentEnvironment: String? = null,
    @SerialName("show_qa_links")
    val showQaLinks: Boolean? = null,
    @SerialName("show_stg_links")
    val showStgLinks: Boolean? = null,
    @SerialName("show_prod_links")
    val showProdLinks: Boolean? = null,
    val name: String,
    val description: String? = null,
    val status: String? = null,
    val priority: String? = null,
    @SerialName("is_deleted")
    val isDeleted: Boolean? = null,
    @SerialName("deleted_at")
    val deletedAt: String? = null,
    @SerialName("deleted_by")
    val deletedBy: String? = null,
)
