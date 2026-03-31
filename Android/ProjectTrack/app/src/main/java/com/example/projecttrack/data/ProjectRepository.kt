package com.example.projecttrack.data

import io.github.jan.supabase.postgrest.from
import io.github.jan.supabase.postgrest.query.Columns
import java.time.Instant
import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.JsonPrimitive
import kotlinx.serialization.json.buildJsonObject
import kotlinx.serialization.json.contentOrNull
import kotlinx.serialization.json.jsonPrimitive

object ProjectRepository {
    @Volatile
    private var lastUpdateDiagnosticMessage: String? = null

    fun consumeLastUpdateDiagnostic(): String? {
        val message = lastUpdateDiagnosticMessage
        lastUpdateDiagnosticMessage = null
        return message
    }

    suspend fun fetchProjectById(projectId: String): Project? {
        val rows = try {
            SupabaseProvider.client
                .from("projects")
                .select(columns = projectColumns(includeSoftDelete = true)) {
                    filter {
                        ProjectRow::id eq projectId
                        ProjectRow::isDeleted eq false
                    }
                }
                .decodeAs<List<ProjectRow>>()
        } catch (e: Exception) {
            if (!e.isMissingProjectSoftDeleteColumns()) throw e
            SupabaseProvider.client
                .from("projects")
                .select(columns = projectColumns(includeSoftDelete = false)) {
                    filter {
                        ProjectRow::id eq projectId
                    }
                }
                .decodeAs<List<ProjectRow>>()
        }

        val row = rows.firstOrNull() ?: return null
        return rowToProject(row)
    }

    suspend fun fetchProjects(): List<Project> {
        val rows = try {
            SupabaseProvider.client
                .from("projects")
                .select(columns = projectColumns(includeSoftDelete = true)) {
                    filter {
                        ProjectRow::isDeleted eq false
                    }
                }
                .decodeAs<List<ProjectRow>>()
        } catch (e: Exception) {
            if (!e.isMissingProjectSoftDeleteColumns()) throw e
            SupabaseProvider.client
                .from("projects")
                .select(columns = projectColumns(includeSoftDelete = false))
                .decodeAs<List<ProjectRow>>()
        }

        return rows.map(::rowToProject)
    }

    suspend fun createProject(
        name: String,
        description: String,
        startDate: String,
        onedriveLink: String,
        workfrontLink: String,
        qaUrls: Map<String, String>,
        stgUrls: Map<String, String>,
        prodUrls: Map<String, String>,
    ): Project? {
        val rows = SupabaseProvider.client
            .from("projects")
            .insert(
                ProjectWrite(
                    name = name.trim(),
                    description = normalizeOptionalText(description),
                    startDate = normalizeOptionalText(startDate),
                    onedriveLink = normalizeOptionalText(onedriveLink),
                    workfrontLink = normalizeOptionalText(workfrontLink),
                    qaUrls = stringMapToJsonObject(qaUrls),
                    stgUrls = stringMapToJsonObject(stgUrls),
                    prodUrls = stringMapToJsonObject(prodUrls),
                ),
            ) {
                select(columns = projectColumns(includeSoftDelete = false))
            }
            .decodeAs<List<ProjectRow>>()

        val row = rows.firstOrNull() ?: return null
        return rowToProject(row)
    }

    suspend fun updateProject(
        projectId: String,
        name: String,
        description: String,
        startDate: String,
        onedriveLink: String,
        workfrontLink: String,
        qaUrls: Map<String, String>,
        stgUrls: Map<String, String>,
        prodUrls: Map<String, String>,
    ): Project? {
        lastUpdateDiagnosticMessage = null
        val rows = SupabaseProvider.client
            .from("projects")
            .update(
                ProjectWrite(
                    name = name.trim(),
                    description = normalizeOptionalText(description),
                    startDate = normalizeOptionalText(startDate),
                    onedriveLink = normalizeOptionalText(onedriveLink),
                    workfrontLink = normalizeOptionalText(workfrontLink),
                    qaUrls = stringMapToJsonObject(qaUrls),
                    stgUrls = stringMapToJsonObject(stgUrls),
                    prodUrls = stringMapToJsonObject(prodUrls),
                ),
            ) {
                filter {
                    ProjectRow::id eq projectId
                }
                select(columns = projectColumns(includeSoftDelete = false))
            }
            .decodeAs<List<ProjectRow>>()
        val updateReturnedRows = rows.isNotEmpty()

        val updatedRow = rows.firstOrNull()
        if (updatedRow != null) {
            return rowToProject(updatedRow)
        }

        val reloaded = fetchProjectById(projectId)
        if (
            reloaded != null &&
            matchesUpdatedProjectPayload(
                current = reloaded,
                name = name,
                description = description,
                startDate = startDate,
                onedriveLink = onedriveLink,
                workfrontLink = workfrontLink,
                qaUrls = qaUrls,
                stgUrls = stgUrls,
                prodUrls = prodUrls,
            )
        ) {
            return reloaded
        }
        if (reloaded != null) {
            lastUpdateDiagnosticMessage = buildProjectUpdateMismatchDiagnostic(
                current = reloaded,
                name = name,
                description = description,
                startDate = startDate,
                onedriveLink = onedriveLink,
                workfrontLink = workfrontLink,
                qaUrls = qaUrls,
                stgUrls = stgUrls,
                prodUrls = prodUrls,
                updateReturnedRows = updateReturnedRows,
            )
            return null
        }

        lastUpdateDiagnosticMessage = "Actualizacion sin confirmacion completa por RLS/SELECT. " +
            "Se devolvio estado local de respaldo para continuar en UI."
        return Project(
            id = projectId,
            name = name.trim(),
            description = description.trim().ifBlank { "(sin descripcion)" },
            startDate = startDate.trim(),
            onedriveLink = normalizeOptionalText(onedriveLink),
            workfrontLink = normalizeOptionalText(workfrontLink),
            qaUrls = normalizeStringMapForCompare(qaUrls),
            stgUrls = normalizeStringMapForCompare(stgUrls),
            prodUrls = normalizeStringMapForCompare(prodUrls),
        )
    }

    suspend fun softDeleteProject(
        projectId: String,
        deletedBy: String? = null,
    ): Boolean {
        val normalizedProjectId = projectId.trim()
        if (normalizedProjectId.isBlank()) return false

        val softDeleteWrite = ProjectSoftDeleteWrite(
            deletedAt = Instant.now().toString(),
            deletedBy = deletedBy?.trim()?.takeIf { value -> value.isNotBlank() },
        )

        return try {
            val rows = SupabaseProvider.client
                .from("projects")
                .update(softDeleteWrite) {
                    filter {
                        ProjectRow::id eq normalizedProjectId
                        ProjectRow::isDeleted eq false
                    }
                    select(columns = Columns.list("id"))
                }
                .decodeAs<List<ProjectDeleteResultRow>>()

            if (rows.isEmpty()) return false

            SupabaseProvider.client
                .from("changes")
                .update(softDeleteWrite) {
                    filter {
                        ChangeRow::projectId eq normalizedProjectId
                        ChangeRow::isDeleted eq false
                    }
                }

            SupabaseProvider.client
                .from("project_notes")
                .update(softDeleteWrite) {
                    filter {
                        ProjectTodoNoteRow::projectId eq normalizedProjectId
                        ProjectTodoNoteRow::isDeleted eq false
                    }
                }

            true
        } catch (e: Exception) {
            if (e.isMissingProjectSoftDeleteColumns()) {
                throw IllegalStateException(
                    "Falta migracion de borrado logico (is_deleted/deleted_at/deleted_by) en projects/changes/project_notes.",
                    e,
                )
            }
            throw e
        }
    }

    private fun projectColumns(includeSoftDelete: Boolean): Columns {
        return Columns.list(
            "id",
            "name",
            "description",
            "start_date",
            "onedrive_link",
            "workfront_link",
            "qa_urls",
            "stg_urls",
            "prod_urls",
            *if (includeSoftDelete) {
                arrayOf("is_deleted", "deleted_at", "deleted_by")
            } else {
                emptyArray()
            },
        )
    }

    private fun jsonObjectToStringMap(source: JsonObject?): Map<String, String> {
        if (source == null) return emptyMap()

        return source.mapNotNull { (key, value) ->
            val text = value.jsonPrimitive.contentOrNull
            if (text.isNullOrBlank()) null else key to text
        }.toMap()
    }

    private fun normalizeOptionalText(value: String): String? {
        return value.trim().takeIf { it.isNotEmpty() }
    }

    private fun stringMapToJsonObject(source: Map<String, String>): JsonObject? {
        val normalizedEntries = source.mapNotNull { (rawKey, rawValue) ->
            val key = rawKey.trim()
            val value = rawValue.trim()
            if (key.isBlank() || value.isBlank()) null else key to value
        }
        if (normalizedEntries.isEmpty()) return null

        return buildJsonObject {
            normalizedEntries.forEach { (key, value) ->
                put(key, JsonPrimitive(value))
            }
        }
    }

    private fun rowToProject(row: ProjectRow): Project {
        return Project(
            id = row.id,
            name = row.name,
            description = row.description ?: "(sin descripcion)",
            startDate = row.startDate ?: "",
            onedriveLink = row.onedriveLink,
            workfrontLink = row.workfrontLink,
            qaUrls = jsonObjectToStringMap(row.qaUrls),
            stgUrls = jsonObjectToStringMap(row.stgUrls),
            prodUrls = jsonObjectToStringMap(row.prodUrls),
        )
    }
}

private fun Throwable.isMissingProjectSoftDeleteColumns(): Boolean {
    val normalized = message.orEmpty().lowercase()
    if (!normalized.contains("projects") &&
        !normalized.contains("changes") &&
        !normalized.contains("project_notes")
    ) {
        return false
    }
    val hasMissingSignal = normalized.contains("does not exist") ||
        normalized.contains("no existe") ||
        normalized.contains("column") ||
        normalized.contains("columna")
    if (!hasMissingSignal) return false
    return normalized.contains("is_deleted") ||
        normalized.contains("deleted_at") ||
        normalized.contains("deleted_by")
}

@Serializable
private data class ProjectWrite(
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
)

@Serializable
private data class ProjectSoftDeleteWrite(
    @SerialName("is_deleted")
    val isDeleted: Boolean = true,
    @SerialName("deleted_at")
    val deletedAt: String,
    @SerialName("deleted_by")
    val deletedBy: String? = null,
)

@Serializable
private data class ProjectDeleteResultRow(
    val id: String,
)

private fun matchesUpdatedProjectPayload(
    current: Project,
    name: String,
    description: String,
    startDate: String,
    onedriveLink: String,
    workfrontLink: String,
    qaUrls: Map<String, String>,
    stgUrls: Map<String, String>,
    prodUrls: Map<String, String>,
): Boolean {
    val expectedDescription = description.trim()
    val actualDescription = current.description.trim()
    val descriptionMatches = actualDescription == expectedDescription ||
        (expectedDescription.isBlank() && actualDescription == "(sin descripcion)")

    return current.name.trim() == name.trim() &&
        descriptionMatches &&
        current.startDate.trim() == startDate.trim() &&
        current.onedriveLink.orEmpty().trim() == onedriveLink.trim() &&
        current.workfrontLink.orEmpty().trim() == workfrontLink.trim() &&
        normalizeStringMapForCompare(current.qaUrls) == normalizeStringMapForCompare(qaUrls) &&
        normalizeStringMapForCompare(current.stgUrls) == normalizeStringMapForCompare(stgUrls) &&
        normalizeStringMapForCompare(current.prodUrls) == normalizeStringMapForCompare(prodUrls)
}

private fun normalizeStringMapForCompare(source: Map<String, String>): Map<String, String> {
    return source
        .mapNotNull { (rawKey, rawValue) ->
            val key = rawKey.trim()
            val value = rawValue.trim()
            if (key.isBlank() || value.isBlank()) null else key to value
        }
        .toMap()
}

private fun buildProjectUpdateMismatchDiagnostic(
    current: Project,
    name: String,
    description: String,
    startDate: String,
    onedriveLink: String,
    workfrontLink: String,
    qaUrls: Map<String, String>,
    stgUrls: Map<String, String>,
    prodUrls: Map<String, String>,
    updateReturnedRows: Boolean,
): String {
    val mismatches = mutableListOf<String>()
    if (current.name.trim() != name.trim()) {
        mismatches += "nombre esperado='${name.trim()}' actual='${current.name.trim()}'"
    }

    val expectedDescription = description.trim()
    val actualDescription = current.description.trim()
    val descriptionMatches = actualDescription == expectedDescription ||
        (expectedDescription.isBlank() && actualDescription == "(sin descripcion)")
    if (!descriptionMatches) {
        mismatches += "descripcion esperada='${expectedDescription.ifBlank { "(vacia)" }}' actual='$actualDescription'"
    }

    if (current.startDate.trim() != startDate.trim()) {
        mismatches += "start_date esperado='${startDate.trim()}' actual='${current.startDate.trim()}'"
    }
    if (current.onedriveLink.orEmpty().trim() != onedriveLink.trim()) {
        mismatches += "onedrive esperado='${onedriveLink.trim()}' actual='${current.onedriveLink.orEmpty().trim()}'"
    }
    if (current.workfrontLink.orEmpty().trim() != workfrontLink.trim()) {
        mismatches += "workfront esperado='${workfrontLink.trim()}' actual='${current.workfrontLink.orEmpty().trim()}'"
    }
    if (normalizeStringMapForCompare(current.qaUrls) != normalizeStringMapForCompare(qaUrls)) {
        mismatches += "qa_urls esperadas=${normalizeStringMapForCompare(qaUrls)} actual=${normalizeStringMapForCompare(current.qaUrls)}"
    }
    if (normalizeStringMapForCompare(current.stgUrls) != normalizeStringMapForCompare(stgUrls)) {
        mismatches += "stg_urls esperadas=${normalizeStringMapForCompare(stgUrls)} actual=${normalizeStringMapForCompare(current.stgUrls)}"
    }
    if (normalizeStringMapForCompare(current.prodUrls) != normalizeStringMapForCompare(prodUrls)) {
        mismatches += "prod_urls esperadas=${normalizeStringMapForCompare(prodUrls)} actual=${normalizeStringMapForCompare(current.prodUrls)}"
    }

    if (mismatches.isEmpty()) {
        mismatches += "No se pudo confirmar persistencia con lectura posterior"
    }
    val probableRlsHint = if (!updateReturnedRows) {
        " (UPDATE devolvio 0 filas; probable policy RLS de UPDATE bloqueando la fila)"
    } else {
        ""
    }
    return "No se pudo confirmar la actualizacion del proyecto$probableRlsHint: ${mismatches.joinToString(" | ")}"
}
