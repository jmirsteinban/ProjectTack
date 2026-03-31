package com.example.projecttrack.data

private val assigneeSeparators = Regex("[,;\\n\\r]+")

fun parseAssignees(rawValue: String?): List<String> {
    if (rawValue.isNullOrBlank()) return emptyList()
    val uniqueByKey = linkedMapOf<String, String>()
    rawValue
        .split(assigneeSeparators)
        .map { token -> token.trim() }
        .filter { token -> token.isNotEmpty() }
        .forEach { token ->
            val key = token.lowercase()
            if (!uniqueByKey.containsKey(key)) {
                uniqueByKey[key] = token
            }
        }
    return uniqueByKey.values.toList()
}

fun joinAssignees(assignees: List<String>): String {
    return parseAssignees(assignees.joinToString(",")).joinToString(",")
}

fun formatAssignees(rawValue: String?): String {
    val parsed = parseAssignees(rawValue)
    return if (parsed.isEmpty()) "Sin asignar" else parsed.joinToString(", ")
}

fun Change.isAssignedToUser(userId: String): Boolean {
    val normalizedUserId = userId.trim()
    if (normalizedUserId.isBlank()) return false
    if (assigneeIds.isNotEmpty()) {
        return assigneeIds.any { assignee ->
            assignee.equals(normalizedUserId, ignoreCase = true)
        }
    }
    return parseAssignees(assignedTo).any { assignee ->
        assignee.equals(normalizedUserId, ignoreCase = true)
    }
}
