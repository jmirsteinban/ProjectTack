package com.example.projecttrack.data

import io.github.jan.supabase.postgrest.from
import io.github.jan.supabase.postgrest.query.Columns
import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

object ProjectTodoNoteRepository {
    private val todoColumnsCurrent = Columns.list(
        "id",
        "project_id",
        "change_id",
        "text",
        "is_todo",
        "status",
        "created_by",
        "assigned_to",
        "created_at",
    )

    private val todoColumnsWithChangeLegacy = Columns.list(
        "id",
        "project_id",
        "change_id",
        "text",
        "is_todo",
        "status",
        "created_at",
    )

    private val todoColumnsLegacy = Columns.list(
        "id",
        "project_id",
        "text",
        "is_todo",
        "status",
        "created_at",
    )

    private val todoAssigneeColumns = Columns.list(
        "id",
        "note_id",
        "user_id",
        "mention_order",
    )

    suspend fun fetchTodoNotesByChange(
        changeId: String,
        projectIdFallback: String? = null,
    ): List<ProjectTodoNote> {
        return fetchTodoNotesByChangeInternal(
            changeId = changeId,
            projectIdFallback = projectIdFallback,
            includeSoftDeleteFilter = true,
        )
    }

    suspend fun fetchTodoNotesByProject(projectId: String): List<ProjectTodoNote> {
        return fetchTodoNotesByProjectInternal(
            projectId = projectId,
            includeSoftDeleteFilter = true,
        )
    }

    private suspend fun fetchTodoNotesByChangeInternal(
        changeId: String,
        projectIdFallback: String?,
        includeSoftDeleteFilter: Boolean,
    ): List<ProjectTodoNote> {
        val normalizedChangeId = changeId.trim()
        if (normalizedChangeId.isBlank()) return emptyList()

        return try {
            val rows = selectTodoRowsByChange(
                changeId = normalizedChangeId,
                columns = todoColumnsCurrent,
                includeSoftDeleteFilter = includeSoftDeleteFilter,
            )

            rowsToProjectTodos(rows)
        } catch (e: Exception) {
            if (
                includeSoftDeleteFilter &&
                e.isMissingProjectNotesColumns("is_deleted", "deleted_at", "deleted_by")
            ) {
                return fetchTodoNotesByChangeInternal(
                    changeId = normalizedChangeId,
                    projectIdFallback = projectIdFallback,
                    includeSoftDeleteFilter = false,
                )
            }

            val missingChangeId = e.isMissingProjectNotesColumns("change_id")
            val missingAssigneeColumns = e.isMissingProjectNotesColumns("created_by", "assigned_to")
            if (missingAssigneeColumns && !missingChangeId) {
                val rows = selectTodoRowsByChange(
                    changeId = normalizedChangeId,
                    columns = todoColumnsWithChangeLegacy,
                    includeSoftDeleteFilter = includeSoftDeleteFilter,
                )

                return rowsToProjectTodos(rows)
            }
            if (!missingChangeId && !missingAssigneeColumns) throw e

            val normalizedProjectId = projectIdFallback?.trim().orEmpty()
            if (normalizedProjectId.isBlank()) {
                emptyList()
            } else {
                fetchTodoNotesByProjectInternal(
                    projectId = normalizedProjectId,
                    includeSoftDeleteFilter = includeSoftDeleteFilter,
                )
            }
        }
    }

    private suspend fun fetchTodoNotesByProjectInternal(
        projectId: String,
        includeSoftDeleteFilter: Boolean,
    ): List<ProjectTodoNote> {
        val normalizedProjectId = projectId.trim()
        if (normalizedProjectId.isBlank()) return emptyList()

        return try {
            val rows = selectTodoRowsByProject(
                projectId = normalizedProjectId,
                columns = todoColumnsCurrent,
                includeSoftDeleteFilter = includeSoftDeleteFilter,
            )

            rowsToProjectTodos(rows)
        } catch (e: Exception) {
            if (
                includeSoftDeleteFilter &&
                e.isMissingProjectNotesColumns("is_deleted", "deleted_at", "deleted_by")
            ) {
                return fetchTodoNotesByProjectInternal(
                    projectId = normalizedProjectId,
                    includeSoftDeleteFilter = false,
                )
            }

            val missingChangeId = e.isMissingProjectNotesColumns("change_id")
            val missingAssigneeColumns = e.isMissingProjectNotesColumns("created_by", "assigned_to")
            if (!missingChangeId && !missingAssigneeColumns) throw e

            val fallbackColumns = if (missingChangeId) todoColumnsLegacy else todoColumnsWithChangeLegacy

            val rows = selectTodoRowsByProject(
                projectId = normalizedProjectId,
                columns = fallbackColumns,
                includeSoftDeleteFilter = includeSoftDeleteFilter,
            )

            rowsToProjectTodos(rows)
        }
    }

    suspend fun createTodoNote(
        projectId: String,
        changeId: String,
        text: String,
        assignedTo: String? = null,
        assigneeUserIds: List<String> = emptyList(),
    ): ProjectTodoNote? {
        val normalizedProjectId = projectId.trim()
        val normalizedChangeId = changeId.trim()
        val normalizedText = text.trim()
        val normalizedAssigneeIds = normalizeNoteAssigneeIds(
            if (assigneeUserIds.isNotEmpty()) assigneeUserIds else listOfNotNull(assignedTo),
        )
        val normalizedAssignedTo = normalizedAssigneeIds.firstOrNull()
        if (normalizedProjectId.isBlank() || normalizedChangeId.isBlank() || normalizedText.isBlank()) return null

        return try {
            val rows = SupabaseProvider.client
                .from("project_notes")
                .insert(
                    ProjectTodoNoteInsertWrite(
                        projectId = normalizedProjectId,
                        changeId = normalizedChangeId,
                        text = normalizedText,
                        isTodo = true,
                        status = "Pendiente",
                        assignedTo = normalizedAssignedTo,
                    ),
                ) {
                    select(columns = todoColumnsCurrent)
                }
                .decodeAs<List<ProjectTodoNoteRow>>()

            val createdRow = rows.firstOrNull() ?: return null
            syncProjectNoteAssignees(
                noteId = createdRow.id,
                assigneeUserIds = normalizedAssigneeIds,
            )?.let { syncError ->
                if (normalizedAssigneeIds.size > 1) {
                    rollbackCreatedTodoNote(createdRow.id)
                    throw IllegalStateException(
                        "No se pudieron guardar asignados multiples en project_note_assignees: $syncError",
                    )
                }
            }

            fetchTodoNoteById(createdRow.id)
                ?: rowToProjectTodo(
                    row = createdRow,
                    assigneeIdsFromTable = normalizedAssigneeIds,
                )
        } catch (e: Exception) {
            val missingChangeId = e.isMissingProjectNotesColumns("change_id")
            val missingAssigneeColumns = e.isMissingProjectNotesColumns("assigned_to", "created_by")
            if (missingAssigneeColumns && !missingChangeId) {
                val rows = SupabaseProvider.client
                    .from("project_notes")
                    .insert(
                        ProjectTodoNoteInsertWithoutAssigneeWrite(
                            projectId = normalizedProjectId,
                            changeId = normalizedChangeId,
                            text = normalizedText,
                            isTodo = true,
                            status = "Pendiente",
                        ),
                    ) {
                        select(columns = todoColumnsWithChangeLegacy)
                    }
                    .decodeAs<List<ProjectTodoNoteRow>>()

                val createdRow = rows.firstOrNull() ?: return null
                syncProjectNoteAssignees(
                    noteId = createdRow.id,
                    assigneeUserIds = normalizedAssigneeIds,
                )?.let { syncError ->
                    if (normalizedAssigneeIds.size > 1) {
                        rollbackCreatedTodoNote(createdRow.id)
                        throw IllegalStateException(
                            "No se pudieron guardar asignados multiples en project_note_assignees: $syncError",
                        )
                    }
                }
                return fetchTodoNoteById(createdRow.id)
                    ?: rowToProjectTodo(
                        row = createdRow,
                        assigneeIdsFromTable = normalizedAssigneeIds,
                    )
            }
            if (!missingChangeId && !missingAssigneeColumns) throw e

            val rows = SupabaseProvider.client
                .from("project_notes")
                .insert(
                    ProjectTodoNoteInsertLegacyWrite(
                        projectId = normalizedProjectId,
                        text = normalizedText,
                        isTodo = true,
                        status = "Pendiente",
                    ),
                ) {
                    select(columns = todoColumnsLegacy)
                }
                .decodeAs<List<ProjectTodoNoteRow>>()

            val createdRow = rows.firstOrNull() ?: return null
            syncProjectNoteAssignees(
                noteId = createdRow.id,
                assigneeUserIds = normalizedAssigneeIds,
            )?.let { syncError ->
                if (normalizedAssigneeIds.size > 1) {
                    rollbackCreatedTodoNote(createdRow.id)
                    throw IllegalStateException(
                        "No se pudieron guardar asignados multiples en project_note_assignees: $syncError",
                    )
                }
            }
            fetchTodoNoteById(createdRow.id)
                ?: rowToProjectTodo(
                    row = createdRow,
                    assigneeIdsFromTable = normalizedAssigneeIds,
                )
        }
    }

    suspend fun updateTodoNoteText(
        noteId: String,
        text: String,
        assigneeUserIds: List<String>? = null,
        completed: Boolean? = null,
    ): ProjectTodoNote? {
        val normalizedNoteId = noteId.trim()
        val normalizedText = text.trim()
        if (normalizedNoteId.isBlank() || normalizedText.isBlank()) return null

        val normalizedAssigneeIds = assigneeUserIds?.let(::normalizeNoteAssigneeIds)
        val shouldUpdateSingleAssignee = normalizedAssigneeIds != null

        val rows = try {
            if (shouldUpdateSingleAssignee) {
                SupabaseProvider.client
                    .from("project_notes")
                    .update(
                        ProjectTodoNoteTextWithAssigneeUpdateWrite(
                            text = normalizedText,
                            assignedTo = normalizedAssigneeIds?.firstOrNull(),
                        ),
                    ) {
                        filter {
                            ProjectTodoNoteRow::id eq normalizedNoteId
                        }
                        select(columns = todoColumnsCurrent)
                    }
                    .decodeAs<List<ProjectTodoNoteRow>>()
            } else {
                SupabaseProvider.client
                    .from("project_notes")
                    .update(
                        ProjectTodoNoteTextUpdateWrite(
                            text = normalizedText,
                        ),
                    ) {
                        filter {
                            ProjectTodoNoteRow::id eq normalizedNoteId
                        }
                        select(columns = todoColumnsCurrent)
                    }
                    .decodeAs<List<ProjectTodoNoteRow>>()
            }
        } catch (e: Exception) {
            val missingChangeId = e.isMissingProjectNotesColumns("change_id")
            val missingAssigneeColumns = e.isMissingProjectNotesColumns("created_by", "assigned_to")
            if (!missingChangeId && !missingAssigneeColumns) throw e
            val fallbackColumns = if (missingChangeId) todoColumnsLegacy else todoColumnsWithChangeLegacy

            SupabaseProvider.client
                .from("project_notes")
                .update(
                    ProjectTodoNoteTextUpdateWrite(
                        text = normalizedText,
                    ),
                ) {
                    filter {
                        ProjectTodoNoteRow::id eq normalizedNoteId
                    }
                    select(columns = fallbackColumns)
                }
                .decodeAs<List<ProjectTodoNoteRow>>()
        }

        if (normalizedAssigneeIds != null) {
            syncProjectNoteAssignees(
                noteId = normalizedNoteId,
                assigneeUserIds = normalizedAssigneeIds,
            )?.let { syncError ->
                if (normalizedAssigneeIds.size > 1) {
                    throw IllegalStateException(
                        "No se pudieron actualizar asignados multiples en project_note_assignees: $syncError",
                    )
                }
            }
        }

        val updatedFromRows = rows.firstOrNull()?.let { row ->
            rowToProjectTodo(
                row = row,
                assigneeIdsFromTable = normalizedAssigneeIds.orEmpty(),
            )
        }
        val noteAfterTextUpdate = fetchTodoNoteById(normalizedNoteId) ?: updatedFromRows
        if (completed == null) return noteAfterTextUpdate

        val noteAfterStatusUpdate = setTodoNoteCompletion(
            noteId = normalizedNoteId,
            completed = completed,
        )
        return noteAfterStatusUpdate ?: noteAfterTextUpdate
    }

    suspend fun setTodoNoteCompletion(
        noteId: String,
        completed: Boolean,
    ): ProjectTodoNote? {
        val normalizedNoteId = noteId.trim()
        if (normalizedNoteId.isBlank()) return null

        return try {
            val rows = SupabaseProvider.client
                .from("project_notes")
                .update(
                    ProjectTodoNoteStatusUpdateWrite(
                        status = if (completed) "Completado" else "Pendiente",
                        isTodo = true,
                    ),
                ) {
                    filter {
                        ProjectTodoNoteRow::id eq normalizedNoteId
                    }
                    select(columns = todoColumnsCurrent)
                }
                .decodeAs<List<ProjectTodoNoteRow>>()

            val updatedFromRows = rows.firstOrNull()?.let { rowToProjectTodo(it, emptyList()) }
            fetchTodoNoteById(normalizedNoteId) ?: updatedFromRows
        } catch (e: Exception) {
            val missingChangeId = e.isMissingProjectNotesColumns("change_id")
            val missingAssigneeColumns = e.isMissingProjectNotesColumns("created_by", "assigned_to")
            if (!missingChangeId && !missingAssigneeColumns) throw e
            val fallbackColumns = if (missingChangeId) todoColumnsLegacy else todoColumnsWithChangeLegacy

            val rows = SupabaseProvider.client
                .from("project_notes")
                .update(
                    ProjectTodoNoteStatusUpdateWrite(
                        status = if (completed) "Completado" else "Pendiente",
                        isTodo = true,
                    ),
                ) {
                    filter {
                        ProjectTodoNoteRow::id eq normalizedNoteId
                    }
                    select(columns = fallbackColumns)
                }
                .decodeAs<List<ProjectTodoNoteRow>>()

            val updatedFromRows = rows.firstOrNull()?.let { rowToProjectTodo(it, emptyList()) }
            fetchTodoNoteById(normalizedNoteId) ?: updatedFromRows
        }
    }

    suspend fun softDeleteTodoNote(
        noteId: String,
        deletedBy: String? = null,
    ): Boolean {
        val normalizedNoteId = noteId.trim()
        if (normalizedNoteId.isBlank()) return false

        val softDeleteWrite = ProjectTodoNoteSoftDeleteWrite(
            deletedAt = java.time.Instant.now().toString(),
            deletedBy = deletedBy?.trim()?.takeIf { value -> value.isNotBlank() },
        )

        return try {
            val rows = SupabaseProvider.client
                .from("project_notes")
                .update(softDeleteWrite) {
                    filter {
                        ProjectTodoNoteRow::id eq normalizedNoteId
                        ProjectTodoNoteRow::isDeleted eq false
                    }
                    select(columns = Columns.list("id"))
                }
                .decodeAs<List<ProjectTodoNoteDeleteResultRow>>()
            rows.isNotEmpty()
        } catch (e: Exception) {
            if (e.isMissingProjectNotesColumns("is_deleted", "deleted_at", "deleted_by")) {
                throw IllegalStateException(
                    "Falta migracion de borrado logico (is_deleted/deleted_at/deleted_by) en project_notes.",
                    e,
                )
            }
            throw e
        }
    }

    private suspend fun fetchTodoNoteById(noteId: String): ProjectTodoNote? {
        return fetchTodoNoteByIdInternal(
            noteId = noteId,
            includeSoftDeleteFilter = true,
        )
    }

    private suspend fun fetchTodoNoteByIdInternal(
        noteId: String,
        includeSoftDeleteFilter: Boolean,
    ): ProjectTodoNote? {
        val normalizedNoteId = noteId.trim()
        if (normalizedNoteId.isBlank()) return null

        return try {
            val rows = selectTodoRowsById(
                noteId = normalizedNoteId,
                columns = todoColumnsCurrent,
                includeSoftDeleteFilter = includeSoftDeleteFilter,
            )
            rowsToProjectTodos(rows).firstOrNull()
        } catch (e: Exception) {
            if (
                includeSoftDeleteFilter &&
                e.isMissingProjectNotesColumns("is_deleted", "deleted_at", "deleted_by")
            ) {
                return fetchTodoNoteByIdInternal(
                    noteId = normalizedNoteId,
                    includeSoftDeleteFilter = false,
                )
            }
            val missingChangeId = e.isMissingProjectNotesColumns("change_id")
            val missingAssigneeColumns = e.isMissingProjectNotesColumns("created_by", "assigned_to")
            if (!missingChangeId && !missingAssigneeColumns) throw e
            val fallbackColumns = if (missingChangeId) todoColumnsLegacy else todoColumnsWithChangeLegacy
            val rows = selectTodoRowsById(
                noteId = normalizedNoteId,
                columns = fallbackColumns,
                includeSoftDeleteFilter = includeSoftDeleteFilter,
            )
            rowsToProjectTodos(rows).firstOrNull()
        }
    }

    private suspend fun selectTodoRowsByChange(
        changeId: String,
        columns: Columns,
        includeSoftDeleteFilter: Boolean,
    ): List<ProjectTodoNoteRow> {
        return SupabaseProvider.client
            .from("project_notes")
            .select(columns = columns) {
                filter {
                    ProjectTodoNoteRow::changeId eq changeId
                    ProjectTodoNoteRow::isTodo eq true
                    if (includeSoftDeleteFilter) {
                        ProjectTodoNoteRow::isDeleted eq false
                    }
                }
            }
            .decodeAs<List<ProjectTodoNoteRow>>()
    }

    private suspend fun selectTodoRowsByProject(
        projectId: String,
        columns: Columns,
        includeSoftDeleteFilter: Boolean,
    ): List<ProjectTodoNoteRow> {
        return SupabaseProvider.client
            .from("project_notes")
            .select(columns = columns) {
                filter {
                    ProjectTodoNoteRow::projectId eq projectId
                    ProjectTodoNoteRow::isTodo eq true
                    if (includeSoftDeleteFilter) {
                        ProjectTodoNoteRow::isDeleted eq false
                    }
                }
            }
            .decodeAs<List<ProjectTodoNoteRow>>()
    }

    private suspend fun selectTodoRowsById(
        noteId: String,
        columns: Columns,
        includeSoftDeleteFilter: Boolean,
    ): List<ProjectTodoNoteRow> {
        return SupabaseProvider.client
            .from("project_notes")
            .select(columns = columns) {
                filter {
                    ProjectTodoNoteRow::id eq noteId
                    if (includeSoftDeleteFilter) {
                        ProjectTodoNoteRow::isDeleted eq false
                    }
                }
            }
            .decodeAs<List<ProjectTodoNoteRow>>()
    }

    private suspend fun syncProjectNoteAssignees(
        noteId: String,
        assigneeUserIds: List<String>,
    ): String? {
        val normalizedAssigneeIds = normalizeNoteAssigneeIds(assigneeUserIds)
        try {
            SupabaseProvider.client
                .from("project_note_assignees")
                .delete {
                    filter {
                        ProjectTodoNoteAssigneeRow::noteId eq noteId
                    }
                }

            if (normalizedAssigneeIds.isNotEmpty()) {
                SupabaseProvider.client
                    .from("project_note_assignees")
                    .insert(
                        normalizedAssigneeIds.mapIndexed { index, userId ->
                            ProjectTodoNoteAssigneeWrite(
                                noteId = noteId,
                                userId = userId,
                                mentionOrder = index,
                            )
                        },
                    )
            }
        } catch (e: Exception) {
            val message = e.message?.trim().orEmpty()
            if (isMissingProjectNoteAssigneesTable(message)) {
                // Compatibilidad parcial: permite 1 asignado en assigned_to,
                // pero reporta falta de tabla para no ocultar perdida de multi-asignacion.
                return "La tabla project_note_assignees no existe en la BD activa"
            }
            return message.ifBlank { "Error desconocido al sincronizar project_note_assignees" }
        }
        return null
    }

    private suspend fun rollbackCreatedTodoNote(noteId: String) {
        runCatching {
            SupabaseProvider.client
                .from("project_notes")
                .delete {
                    filter {
                        ProjectTodoNoteRow::id eq noteId
                    }
                }
        }
    }

    private suspend fun rowsToProjectTodos(rows: List<ProjectTodoNoteRow>): List<ProjectTodoNote> {
        if (rows.isEmpty()) return emptyList()
        val assigneeIdsByNoteId = fetchAssigneeIdsByNoteId(
            noteIds = rows.map { row -> row.id }.toSet(),
        )
        return rows
            .map { row ->
                rowToProjectTodo(
                    row = row,
                    assigneeIdsFromTable = assigneeIdsByNoteId[row.id].orEmpty(),
                )
            }
            .sortedByDescending { it.createdAt }
    }

    private suspend fun fetchAssigneeIdsByNoteId(
        noteIds: Set<String>,
    ): Map<String, List<String>> {
        if (noteIds.isEmpty()) return emptyMap()

        val rows = try {
            SupabaseProvider.client
                .from("project_note_assignees")
                .select(columns = todoAssigneeColumns)
                .decodeAs<List<ProjectTodoNoteAssigneeRow>>()
        } catch (_: Exception) {
            return emptyMap()
        }

        return rows
            .asSequence()
            .filter { row -> row.noteId != null && noteIds.contains(row.noteId) }
            .groupBy { row -> row.noteId.orEmpty() }
            .mapValues { (_, noteAssignees) ->
                noteAssignees
                    .sortedWith(
                        compareBy<ProjectTodoNoteAssigneeRow> { row ->
                            row.mentionOrder ?: Int.MAX_VALUE
                        }.thenBy { row ->
                            row.id.orEmpty()
                        },
                    )
                    .mapNotNull { row ->
                        row.userId?.trim()?.takeIf { it.isNotBlank() }
                    }
            }
    }
}

private fun Throwable.isMissingProjectNotesColumns(vararg columnNames: String): Boolean {
    val normalized = message.orEmpty().lowercase()
    if (!normalized.contains("project_notes")) return false
    val hasMissingSignal = normalized.contains("does not exist") ||
        normalized.contains("no existe") ||
        normalized.contains("column") ||
        normalized.contains("columna")
    if (!hasMissingSignal) return false
    return columnNames.any { column -> normalized.contains(column.lowercase()) }
}

private fun rowToProjectTodo(
    row: ProjectTodoNoteRow,
    assigneeIdsFromTable: List<String>,
): ProjectTodoNote {
    val normalizedFromTable = normalizeNoteAssigneeIds(assigneeIdsFromTable)
    val fallbackAssignee = row.assignedTo?.trim().orEmpty().takeIf { it.isNotBlank() }
    val normalizedAssigneeIds = if (normalizedFromTable.isNotEmpty()) {
        normalizedFromTable
    } else {
        listOfNotNull(fallbackAssignee)
    }
    return ProjectTodoNote(
        id = row.id,
        projectId = row.projectId ?: "",
        changeId = row.changeId,
        text = row.text ?: "(sin texto)",
        status = row.status ?: "Pendiente",
        isTodo = row.isTodo ?: true,
        createdBy = row.createdBy,
        assignedTo = normalizedAssigneeIds.firstOrNull(),
        assigneeIds = normalizedAssigneeIds,
        createdAt = row.createdAt ?: "",
    )
}

private fun normalizeNoteAssigneeIds(values: List<String>): List<String> {
    return values
        .map { raw -> raw.trim() }
        .filter { value -> value.isNotBlank() }
}

private fun isMissingProjectNoteAssigneesTable(message: String): Boolean {
    val normalized = message.lowercase()
    val isMissing = normalized.contains("does not exist") || normalized.contains("no existe")
    return normalized.contains("project_note_assignees") && isMissing
}

@Serializable
private data class ProjectTodoNoteInsertWrite(
    @SerialName("project_id")
    val projectId: String,
    @SerialName("change_id")
    val changeId: String,
    val text: String,
    @SerialName("is_todo")
    val isTodo: Boolean,
    val status: String,
    @SerialName("assigned_to")
    val assignedTo: String? = null,
)

@Serializable
private data class ProjectTodoNoteInsertWithoutAssigneeWrite(
    @SerialName("project_id")
    val projectId: String,
    @SerialName("change_id")
    val changeId: String,
    val text: String,
    @SerialName("is_todo")
    val isTodo: Boolean,
    val status: String,
)

@Serializable
private data class ProjectTodoNoteInsertLegacyWrite(
    @SerialName("project_id")
    val projectId: String,
    val text: String,
    @SerialName("is_todo")
    val isTodo: Boolean,
    val status: String,
)

@Serializable
private data class ProjectTodoNoteTextUpdateWrite(
    val text: String,
)

@Serializable
private data class ProjectTodoNoteTextWithAssigneeUpdateWrite(
    val text: String,
    @SerialName("assigned_to")
    val assignedTo: String?,
)

@Serializable
private data class ProjectTodoNoteStatusUpdateWrite(
    val status: String,
    @SerialName("is_todo")
    val isTodo: Boolean,
)

@Serializable
private data class ProjectTodoNoteAssigneeRow(
    val id: String? = null,
    @SerialName("note_id")
    val noteId: String? = null,
    @SerialName("user_id")
    val userId: String? = null,
    @SerialName("mention_order")
    val mentionOrder: Int? = null,
)

@Serializable
private data class ProjectTodoNoteAssigneeWrite(
    @SerialName("note_id")
    val noteId: String,
    @SerialName("user_id")
    val userId: String,
    @SerialName("mention_order")
    val mentionOrder: Int,
)

@Serializable
private data class ProjectTodoNoteSoftDeleteWrite(
    @SerialName("is_deleted")
    val isDeleted: Boolean = true,
    @SerialName("deleted_at")
    val deletedAt: String,
    @SerialName("deleted_by")
    val deletedBy: String? = null,
)

@Serializable
private data class ProjectTodoNoteDeleteResultRow(
    val id: String,
)
