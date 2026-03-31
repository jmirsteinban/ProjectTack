package com.example.projecttrack.data

import io.github.jan.supabase.postgrest.from
import io.github.jan.supabase.postgrest.query.Columns
import java.time.Instant
import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

object ChangeRepository {
    @Volatile
    private var lastUpdateDiagnosticMessage: String? = null

    private val changeColumnsCurrent = Columns.list(
        "id",
        "project_id",
        "assigned_to",
        "workfront_link",
        "onedrive_link",
        "current_environment",
        "show_qa_links",
        "show_stg_links",
        "show_prod_links",
        "name",
        "description",
        "status",
        "priority",
        "is_deleted",
        "deleted_at",
        "deleted_by",
    )

    private val changeColumnsLegacy = Columns.list(
        "id",
        "project_id",
        "assigned_to",
        "workfront_link",
        "onedrive_link",
        "current_environment",
        "show_qa_links",
        "show_stg_links",
        "show_prod_links",
        "name",
        "description",
        "status",
        "priority",
    )

    fun consumeLastUpdateDiagnostic(): String? {
        val message = lastUpdateDiagnosticMessage
        lastUpdateDiagnosticMessage = null
        return message
    }

    suspend fun fetchAllChanges(): List<Change> {
        val rows = try {
            SupabaseProvider.client
                .from("changes")
                .select(columns = changeColumnsCurrent) {
                    filter {
                        ChangeRow::isDeleted eq false
                    }
                }
                .decodeAs<List<ChangeRow>>()
        } catch (e: Exception) {
            if (!e.isMissingChangeSoftDeleteColumns()) throw e
            SupabaseProvider.client
                .from("changes")
                .select(columns = changeColumnsLegacy)
                .decodeAs<List<ChangeRow>>()
        }

        return mapRowsToChanges(rows)
    }

    suspend fun fetchChangesByProject(projectId: String): List<Change> {
        val rows = try {
            SupabaseProvider.client
                .from("changes")
                .select(columns = changeColumnsCurrent) {
                    filter {
                        ChangeRow::projectId eq projectId
                        ChangeRow::isDeleted eq false
                    }
                }
                .decodeAs<List<ChangeRow>>()
        } catch (e: Exception) {
            if (!e.isMissingChangeSoftDeleteColumns()) throw e
            SupabaseProvider.client
                .from("changes")
                .select(columns = changeColumnsLegacy) {
                    filter {
                        ChangeRow::projectId eq projectId
                    }
                }
                .decodeAs<List<ChangeRow>>()
        }

        return mapRowsToChanges(rows)
    }

    suspend fun fetchChangeById(changeId: String): Change? {
        val rows = try {
            SupabaseProvider.client
                .from("changes")
                .select(columns = changeColumnsCurrent) {
                    filter {
                        ChangeRow::id eq changeId
                        ChangeRow::isDeleted eq false
                    }
                }
                .decodeAs<List<ChangeRow>>()
        } catch (e: Exception) {
            if (!e.isMissingChangeSoftDeleteColumns()) throw e
            SupabaseProvider.client
                .from("changes")
                .select(columns = changeColumnsLegacy) {
                    filter {
                        ChangeRow::id eq changeId
                    }
                }
                .decodeAs<List<ChangeRow>>()
        }

        return mapRowsToChanges(rows).firstOrNull()
    }

    suspend fun createChange(
        projectId: String,
        name: String,
        description: String,
        status: String,
        priority: String,
        assignedTo: String,
        workfrontLink: String,
        onedriveLink: String,
        currentEnvironment: String,
        showQaLinks: Boolean,
        showStgLinks: Boolean,
        showProdLinks: Boolean,
    ): Change? {
        lastUpdateDiagnosticMessage = null
        val normalizedAssigneeIds = parseAssigneeUserIds(assignedTo)
        val requestedStatus = status.trim()
        val rows = runWithLegacyStatusFallback(requestedStatus) { statusForWrite ->
            SupabaseProvider.client
                .from("changes")
                .insert(
                    ChangeWrite(
                        projectId = projectId,
                        assignedTo = normalizedAssigneeIds.firstOrNull(),
                        workfrontLink = workfrontLink,
                        onedriveLink = onedriveLink,
                        currentEnvironment = normalizeEnvironment(currentEnvironment),
                        showQaLinks = showQaLinks,
                        showStgLinks = showStgLinks,
                        showProdLinks = showProdLinks,
                        name = name,
                        description = description,
                        status = statusForWrite,
                        priority = priority,
                    ),
                ) {
                    select(changeColumnsLegacy)
                }
                .decodeAs<List<ChangeRow>>()
        }

        val row = rows.firstOrNull() ?: return null
        val syncError = syncChangeAssignees(row.id, normalizedAssigneeIds)
        if (syncError != null && normalizedAssigneeIds.size > 1) {
            return null
        }
        return fetchChangeById(row.id)
    }

    suspend fun updateChange(
        changeId: String,
        name: String,
        description: String,
        status: String,
        priority: String,
        assignedTo: String,
        workfrontLink: String,
        onedriveLink: String,
        currentEnvironment: String,
        showQaLinks: Boolean,
        showStgLinks: Boolean,
        showProdLinks: Boolean,
        projectIdHint: String? = null,
    ): Change? {
        val normalizedAssigneeIds = parseAssigneeUserIds(assignedTo)
        val requestedStatus = status.trim()
        val rows = runWithLegacyStatusFallback(requestedStatus) { statusForWrite ->
            SupabaseProvider.client
                .from("changes")
                .update(
                    ChangeWrite(
                        assignedTo = normalizedAssigneeIds.firstOrNull(),
                        workfrontLink = workfrontLink,
                        onedriveLink = onedriveLink,
                        currentEnvironment = normalizeEnvironment(currentEnvironment),
                        showQaLinks = showQaLinks,
                        showStgLinks = showStgLinks,
                        showProdLinks = showProdLinks,
                        name = name,
                        description = description,
                        status = statusForWrite,
                        priority = priority,
                    ),
                ) {
                    filter {
                        ChangeRow::id eq changeId
                    }
                    select(changeColumnsLegacy)
                }
                .decodeAs<List<ChangeRow>>()
        }
        val updateReturnedRows = rows.isNotEmpty()

        val updatedRow = rows.firstOrNull()
        val syncError = syncChangeAssignees(changeId, normalizedAssigneeIds)
        if (syncError != null && normalizedAssigneeIds.size > 1) {
            lastUpdateDiagnosticMessage = "No se pudieron guardar asignados multiples " +
                "en change_assignees: $syncError"
            return null
        }

        val reloaded = fetchChangeById(changeId)
        if (reloaded != null) {
            return if (
                matchesUpdatedChangePayload(
                    current = reloaded,
                    name = name,
                    description = description,
                    status = status,
                    priority = priority,
                    assignedUserIds = normalizedAssigneeIds,
                    workfrontLink = workfrontLink,
                    onedriveLink = onedriveLink,
                    currentEnvironment = currentEnvironment,
                    showQaLinks = showQaLinks,
                    showStgLinks = showStgLinks,
                    showProdLinks = showProdLinks,
                )
            ) {
                reloaded
            } else {
                lastUpdateDiagnosticMessage = buildUpdateMismatchDiagnostic(
                    current = reloaded,
                    name = name,
                    description = description,
                    status = status,
                    priority = priority,
                    assignedUserIds = normalizedAssigneeIds,
                    workfrontLink = workfrontLink,
                    onedriveLink = onedriveLink,
                    currentEnvironment = currentEnvironment,
                    showQaLinks = showQaLinks,
                    showStgLinks = showStgLinks,
                    showProdLinks = showProdLinks,
                    updateReturnedRows = updateReturnedRows,
                )
                null
            }
        }

        if (updatedRow != null) {
            return rowToChange(
                row = updatedRow,
                assigneeIdsFromTable = normalizedAssigneeIds,
            )
        }

        if (!projectIdHint.isNullOrBlank()) {
            val normalizedEnvironment = normalizeEnvironment(currentEnvironment)
            lastUpdateDiagnosticMessage = "Actualizado sin confirmacion completa por RLS/SELECT. " +
                "Se devolvio estado local de respaldo para continuar en UI."
            return Change(
                id = changeId,
                projectId = projectIdHint,
                name = name.trim(),
                description = description.trim(),
                status = status.trim(),
                priority = priority.trim(),
                assignedTo = normalizedAssigneeIds.joinToString(","),
                assigneeIds = normalizedAssigneeIds,
                workfrontLink = workfrontLink.trim(),
                onedriveLink = onedriveLink.trim(),
                currentEnvironment = normalizedEnvironment,
                showQaLinks = showQaLinks,
                showStgLinks = showStgLinks,
                showProdLinks = showProdLinks,
            )
        }

        lastUpdateDiagnosticMessage = "No se pudo confirmar el update: respuesta vacia al actualizar " +
            "y sin lectura posterior del cambio. Revisa policies RLS en changes/change_assignees."
        return null
    }

    suspend fun deleteChange(changeId: String) {
        softDeleteChange(changeId = changeId)
    }

    suspend fun softDeleteChange(
        changeId: String,
        deletedBy: String? = null,
    ): Boolean {
        val normalizedChangeId = changeId.trim()
        if (normalizedChangeId.isBlank()) return false

        val softDeleteWrite = ChangeSoftDeleteWrite(
            deletedAt = Instant.now().toString(),
            deletedBy = deletedBy?.trim()?.takeIf { value -> value.isNotBlank() },
        )

        return try {
            SupabaseProvider.client
                .from("changes")
                .update(softDeleteWrite) {
                    filter {
                        ChangeRow::id eq normalizedChangeId
                        ChangeRow::isDeleted eq false
                    }
                }

            SupabaseProvider.client
                .from("project_notes")
                .update(softDeleteWrite) {
                    filter {
                        ProjectTodoNoteRow::changeId eq normalizedChangeId
                        ProjectTodoNoteRow::isDeleted eq false
                    }
                }
            fetchChangeById(normalizedChangeId) == null
        } catch (e: Exception) {
            if (e.isMissingChangeSoftDeleteColumns()) {
                return hardDeleteChangeLegacy(normalizedChangeId)
            }
            throw e
        }
    }

    private suspend fun hardDeleteChangeLegacy(changeId: String): Boolean {
        SupabaseProvider.client
            .from("project_notes")
            .delete {
                filter {
                    ProjectTodoNoteRow::changeId eq changeId
                }
            }

        SupabaseProvider.client
            .from("changes")
            .delete {
                filter {
                    ChangeRow::id eq changeId
                }
            }

        return fetchChangeById(changeId) == null
    }

    suspend fun fetchChangesAssignedToUser(userId: String): List<Change> {
        if (userId.isBlank()) return emptyList()
        return fetchAllChanges().filter { change -> change.isAssignedToUser(userId) }
    }

    private suspend fun mapRowsToChanges(rows: List<ChangeRow>): List<Change> {
        if (rows.isEmpty()) return emptyList()
        val assigneeIdsByChangeId = fetchAssigneeIdsByChangeId(
            changeIds = rows.map { row -> row.id }.toSet(),
        )
        return rows.map { row ->
            rowToChange(
                row = row,
                assigneeIdsFromTable = assigneeIdsByChangeId[row.id].orEmpty(),
            )
        }
    }

    private suspend fun fetchAssigneeIdsByChangeId(
        changeIds: Set<String>,
    ): Map<String, List<String>> {
        if (changeIds.isEmpty()) return emptyMap()

        val rows = try {
            SupabaseProvider.client
                .from("change_assignees")
                .select(
                    columns = Columns.list(
                        "change_id",
                        "user_id",
                    ),
                )
                .decodeAs<List<ChangeAssigneeRow>>()
        } catch (_: Exception) {
            // Tabla aun no creada o sin permisos: usamos fallback assigned_to.
            return emptyMap()
        }

        return rows
            .asSequence()
            .filter { row -> row.changeId != null && changeIds.contains(row.changeId) }
            .groupBy(
                keySelector = { row -> row.changeId.orEmpty() },
                valueTransform = { row -> row.userId.orEmpty() },
            )
            .mapValues { (_, ids) -> normalizeAssigneeIds(ids) }
    }

    private suspend fun syncChangeAssignees(
        changeId: String,
        assigneeUserIds: List<String>,
    ): String? {
        val normalizedAssigneeIds = normalizeAssigneeIds(assigneeUserIds)
        try {
            SupabaseProvider.client
                .from("change_assignees")
                .delete {
                    filter {
                        ChangeAssigneeRow::changeId eq changeId
                    }
                }

            if (normalizedAssigneeIds.isNotEmpty()) {
                SupabaseProvider.client
                    .from("change_assignees")
                    .insert(
                        normalizedAssigneeIds.map { userId ->
                            ChangeAssigneeWrite(
                                changeId = changeId,
                                userId = userId,
                            )
                        },
                    )
            }
        } catch (e: Exception) {
            val message = e.message?.trim().orEmpty()
            if (isMissingChangeAssigneesTable(message)) {
                // Compatibilidad temporal hasta ejecutar migracion SQL en Supabase.
                return null
            }
            return message.ifBlank { "Error desconocido al sincronizar change_assignees" }
        }
        return null
    }
}

private fun Throwable.isMissingChangeSoftDeleteColumns(): Boolean {
    val normalized = message.orEmpty().lowercase()
    if (!normalized.contains("changes") && !normalized.contains("project_notes")) return false
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
private data class ChangeWrite(
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
    val description: String,
    val status: String,
    val priority: String,
)

@Serializable
private data class ChangeAssigneeRow(
    @SerialName("change_id")
    val changeId: String? = null,
    @SerialName("user_id")
    val userId: String? = null,
)

@Serializable
private data class ChangeAssigneeWrite(
    @SerialName("change_id")
    val changeId: String,
    @SerialName("user_id")
    val userId: String,
)

@Serializable
private data class ChangeSoftDeleteWrite(
    @SerialName("is_deleted")
    val isDeleted: Boolean = true,
    @SerialName("deleted_at")
    val deletedAt: String,
    @SerialName("deleted_by")
    val deletedBy: String? = null,
)

private fun rowToChange(
    row: ChangeRow,
    assigneeIdsFromTable: List<String>,
): Change {
    val normalizedEnvironment = normalizeEnvironment(row.currentEnvironment)
    val sequentialVisibility = sequentialVisibilityForEnvironment(normalizedEnvironment)
    val fallbackAssigned = row.assignedTo?.trim().orEmpty()
    val normalizedAssignees = normalizeAssigneeIds(
        assigneeIdsFromTable + listOfNotNull(
            fallbackAssigned.takeIf { value -> value.isNotBlank() },
        ),
    )
    val joinedAssignees = normalizedAssignees.joinToString(",")
    return Change(
        id = row.id,
        projectId = row.projectId ?: "",
        name = row.name,
        description = row.description ?: "(sin descripcion)",
        status = normalizeStatusForDisplay(row.status ?: "Pendiente"),
        priority = row.priority ?: "Media",
        assignedTo = joinedAssignees,
        assigneeIds = normalizedAssignees,
        workfrontLink = row.workfrontLink ?: "",
        onedriveLink = row.onedriveLink ?: "",
        currentEnvironment = normalizedEnvironment,
        showQaLinks = row.showQaLinks ?: sequentialVisibility.first,
        showStgLinks = row.showStgLinks ?: sequentialVisibility.second,
        showProdLinks = row.showProdLinks ?: sequentialVisibility.third,
    )
}

private fun normalizeEnvironment(rawValue: String?): String {
    return when (rawValue?.trim()?.uppercase()) {
        "QA" -> "QA"
        "STG" -> "STG"
        "PROD" -> "PROD"
        else -> "QA"
    }
}

private fun sequentialVisibilityForEnvironment(environment: String): Triple<Boolean, Boolean, Boolean> {
    return when (normalizeEnvironment(environment)) {
        "QA" -> Triple(true, false, false)
        "STG" -> Triple(true, true, false)
        "PROD" -> Triple(true, true, true)
        else -> Triple(true, false, false)
    }
}

private val uuidRegex = Regex("^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$")

private fun parseAssigneeUserIds(rawValue: String): List<String> {
    return normalizeAssigneeIds(parseAssignees(rawValue))
}

private fun normalizeAssigneeIds(values: List<String>): List<String> {
    val unique = linkedMapOf<String, String>()
    values.forEach { raw ->
        val normalized = raw.trim()
        if (normalized.isBlank()) return@forEach
        if (!uuidRegex.matches(normalized)) return@forEach
        val key = normalized.lowercase()
        if (!unique.containsKey(key)) {
            unique[key] = normalized
        }
    }
    return unique.values.toList()
}

private fun isMissingChangeAssigneesTable(message: String): Boolean {
    val normalized = message.lowercase()
    return normalized.contains("change_assignees") &&
        normalized.contains("does not exist")
}

private fun matchesUpdatedChangePayload(
    current: Change,
    name: String,
    description: String,
    status: String,
    priority: String,
    assignedUserIds: List<String>,
    workfrontLink: String,
    onedriveLink: String,
    currentEnvironment: String,
    showQaLinks: Boolean,
    showStgLinks: Boolean,
    showProdLinks: Boolean,
): Boolean {
    val expectedAssignees = normalizeAssigneeIds(assignedUserIds)
    val actualAssignees = normalizeAssigneeIds(
        if (current.assigneeIds.isNotEmpty()) {
            current.assigneeIds
        } else {
            parseAssigneeUserIds(current.assignedTo)
        },
    )
    val expectedAssigneeKeySet = expectedAssignees.map { it.lowercase() }.toSet()
    val actualAssigneeKeySet = actualAssignees.map { it.lowercase() }.toSet()
    val primaryExpectedAssignee = expectedAssignees.firstOrNull()
    val assigneesMatch = (
        actualAssigneeKeySet == expectedAssigneeKeySet &&
            actualAssignees.size == expectedAssignees.size
        ) || (
        // Fallback compatible: cuando change_assignees no esta disponible,
        // la app puede conservar solo el primer UUID en changes.assigned_to.
        primaryExpectedAssignee != null &&
            actualAssignees.size == 1 &&
            actualAssignees.first().equals(primaryExpectedAssignee, ignoreCase = true)
        )

    val normalizedExpectedDescription = description.trim()
    val normalizedActualDescription = current.description.trim()
    val descriptionMatches = normalizedActualDescription == normalizedExpectedDescription ||
        (normalizedExpectedDescription.isBlank() && normalizedActualDescription == "(sin descripcion)")

    return current.name.trim() == name.trim() &&
        descriptionMatches &&
        areEquivalentChangeStatuses(current.status, status) &&
        current.priority.trim().equals(priority.trim(), ignoreCase = true) &&
        current.workfrontLink.trim() == workfrontLink.trim() &&
        current.onedriveLink.trim() == onedriveLink.trim() &&
        normalizeEnvironment(current.currentEnvironment) == normalizeEnvironment(currentEnvironment) &&
        current.showQaLinks == showQaLinks &&
        current.showStgLinks == showStgLinks &&
        current.showProdLinks == showProdLinks &&
        assigneesMatch
}

private fun buildUpdateMismatchDiagnostic(
    current: Change,
    name: String,
    description: String,
    status: String,
    priority: String,
    assignedUserIds: List<String>,
    workfrontLink: String,
    onedriveLink: String,
    currentEnvironment: String,
    showQaLinks: Boolean,
    showStgLinks: Boolean,
    showProdLinks: Boolean,
    updateReturnedRows: Boolean,
): String {
    val mismatches = mutableListOf<String>()
    val expectedAssignees = normalizeAssigneeIds(assignedUserIds).map { it.lowercase() }.toSet()
    val actualAssignees = normalizeAssigneeIds(
        if (current.assigneeIds.isNotEmpty()) current.assigneeIds else parseAssigneeUserIds(current.assignedTo),
    ).map { it.lowercase() }.toSet()

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

    if (!current.status.trim().equals(status.trim(), ignoreCase = true)) {
        if (!areEquivalentChangeStatuses(current.status, status)) {
        mismatches += "status esperado='${status.trim()}' actual='${current.status.trim()}'"
        }
    }
    if (!current.priority.trim().equals(priority.trim(), ignoreCase = true)) {
        mismatches += "prioridad esperada='${priority.trim()}' actual='${current.priority.trim()}'"
    }
    if (current.workfrontLink.trim() != workfrontLink.trim()) {
        mismatches += "workfront esperado='${workfrontLink.trim()}' actual='${current.workfrontLink.trim()}'"
    }
    if (current.onedriveLink.trim() != onedriveLink.trim()) {
        mismatches += "onedrive esperado='${onedriveLink.trim()}' actual='${current.onedriveLink.trim()}'"
    }
    if (normalizeEnvironment(current.currentEnvironment) != normalizeEnvironment(currentEnvironment)) {
        mismatches += "ambiente esperado='${normalizeEnvironment(currentEnvironment)}' " +
            "actual='${normalizeEnvironment(current.currentEnvironment)}'"
    }
    if (current.showQaLinks != showQaLinks) mismatches += "show_qa_links esperado=$showQaLinks actual=${current.showQaLinks}"
    if (current.showStgLinks != showStgLinks) mismatches += "show_stg_links esperado=$showStgLinks actual=${current.showStgLinks}"
    if (current.showProdLinks != showProdLinks) mismatches += "show_prod_links esperado=$showProdLinks actual=${current.showProdLinks}"
    if (actualAssignees != expectedAssignees) {
        mismatches += "asignados esperados=${expectedAssignees.sorted()} actual=${actualAssignees.sorted()}"
    }

    if (mismatches.isEmpty()) {
        mismatches += "No se pudo confirmar persistencia con lectura posterior"
    }

    val probableRlsHint = if (!updateReturnedRows) {
        " (UPDATE devolvio 0 filas; probable policy RLS de UPDATE bloqueando la fila)"
    } else {
        ""
    }
    return "No se pudo confirmar la actualizacion del cambio$probableRlsHint: ${mismatches.joinToString(" | ")}"
}

private suspend fun runWithLegacyStatusFallback(
    requestedStatus: String,
    block: suspend (String) -> List<ChangeRow>,
): List<ChangeRow> {
    val normalizedRequestedStatus = requestedStatus.trim()
    return try {
        block(normalizedRequestedStatus)
    } catch (e: Exception) {
        if (!e.isChangeStatusConstraintViolation()) throw e
        val fallbackStatus = mapStatusToLegacyConstraint(normalizedRequestedStatus)
        if (fallbackStatus.equals(normalizedRequestedStatus, ignoreCase = true)) throw e
        block(fallbackStatus)
    }
}

private fun mapStatusToLegacyConstraint(status: String): String {
    return when (canonicalChangeStatus(status)) {
        "pendiente" -> "Pendiente"
        "en_desarrollo", "en_revision_qa" -> "En progreso"
        "completado_qa" -> "Completado"
        else -> status.trim()
    }
}

private fun normalizeStatusForDisplay(status: String): String {
    return when (canonicalChangeStatus(status)) {
        "pendiente" -> "Pendiente"
        "en_desarrollo" -> "En desarrollo"
        "en_revision_qa" -> "En revision de QA"
        "completado_qa" -> "Completado (QA aprobado)"
        else -> status.trim().ifBlank { "Pendiente" }
    }
}

private fun canonicalChangeStatus(status: String): String {
    val normalized = status
        .trim()
        .lowercase()
        .replace("\\s+".toRegex(), " ")
    return when (normalized) {
        "pendiente" -> "pendiente"
        "en progreso", "en desarrollo", "in progress" -> "en_desarrollo"
        "en revision de qa", "en revisión de qa", "en revision qa", "revision qa", "qa review", "en qa" -> "en_revision_qa"
        "completado", "completada", "completed", "done", "qa aprobado", "completado (qa aprobado)" -> "completado_qa"
        else -> normalized
    }
}

private fun areEquivalentChangeStatuses(left: String, right: String): Boolean {
    return canonicalChangeStatus(left) == canonicalChangeStatus(right)
}

private fun Throwable.isChangeStatusConstraintViolation(): Boolean {
    val normalized = message.orEmpty().lowercase()
    return normalized.contains("changes_status_check") ||
        (normalized.contains("changes") && normalized.contains("status") && normalized.contains("constraint"))
}
