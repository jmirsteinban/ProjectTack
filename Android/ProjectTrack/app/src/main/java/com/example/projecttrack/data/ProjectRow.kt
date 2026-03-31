package com.example.projecttrack.data

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable
import kotlinx.serialization.json.JsonObject

@Serializable
data class ProjectRow(
    val id: String,
    val name: String,
    val description: String? = null,
    @SerialName("start_date")
    val startDate: String? = null,
    @SerialName("onedrive_link")
    val onedriveLink: String? = null,
    @SerialName("workfront_link")
    val workfrontLink: String? = null,
    @SerialName("qa_urls")
    val qaUrls: JsonObject? = null,
    @SerialName("stg_urls")
    val stgUrls: JsonObject? = null,
    @SerialName("prod_urls")
    val prodUrls: JsonObject? = null,
    @SerialName("is_deleted")
    val isDeleted: Boolean? = null,
    @SerialName("deleted_at")
    val deletedAt: String? = null,
    @SerialName("deleted_by")
    val deletedBy: String? = null,
)
