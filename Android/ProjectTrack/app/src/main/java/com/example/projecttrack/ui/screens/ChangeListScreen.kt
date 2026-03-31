package com.example.projecttrack.ui.screens

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import com.example.projecttrack.data.Change
import com.example.projecttrack.ui.theme.PillOnColor
import com.example.projecttrack.ui.theme.ProjectTrackTheme
import com.example.projecttrack.ui.theme.priorityPillColor
import com.example.projecttrack.ui.theme.statusPillColor

@Composable
fun ChangeListScreen(
    changes: List<Change>,
    onCreateChange: () -> Unit,
    onChangeClick: (Change) -> Unit,
    modifier: Modifier = Modifier,
) {
    LazyColumn(
        modifier = modifier.fillMaxSize(),
        contentPadding = PaddingValues(16.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp),
    ) {
        item {
            Card(modifier = Modifier.fillMaxWidth()) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(14.dp),
                    horizontalArrangement = Arrangement.SpaceBetween,
                ) {
                    Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
                        Text(
                            text = "Cambios del proyecto",
                            style = MaterialTheme.typography.titleMedium,
                            fontWeight = FontWeight.SemiBold,
                        )
                        Text(
                            text = "Total: ${changes.size}",
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant,
                        )
                    }

                    Button(onClick = onCreateChange) {
                        Text("Nuevo cambio")
                    }
                }
            }
        }

        items(
            items = changes,
            key = { change -> change.id },
        ) { change ->
            ChangeCard(
                change = change,
                onClick = { onChangeClick(change) },
            )
        }
    }
}

@Composable
private fun ChangeCard(
    change: Change,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
) {
    Card(
        onClick = onClick,
        modifier = modifier.fillMaxWidth(),
    ) {
        Column(
            modifier = Modifier.padding(14.dp),
            verticalArrangement = Arrangement.spacedBy(8.dp),
        ) {
            Text(
                text = change.name,
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.SemiBold,
            )
            Text(
                text = if (change.description.isBlank()) "Sin descripcion" else change.description,
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
            )
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                StatusPill(text = change.status)
                PriorityPill(text = change.priority)
            }
        }
    }
}

@Composable
private fun StatusPill(text: String, modifier: Modifier = Modifier) {
    Surface(
        modifier = modifier,
        color = statusPillColor(text),
        shape = RoundedCornerShape(10.dp),
    ) {
        Text(
            text = text,
            style = MaterialTheme.typography.labelSmall,
            color = PillOnColor,
            modifier = Modifier.padding(horizontal = 8.dp, vertical = 3.dp),
        )
    }
}

@Composable
private fun PriorityPill(text: String, modifier: Modifier = Modifier) {
    Surface(
        modifier = modifier,
        color = priorityPillColor(text),
        shape = RoundedCornerShape(10.dp),
    ) {
        Text(
            text = text,
            style = MaterialTheme.typography.labelSmall,
            color = PillOnColor,
            modifier = Modifier.padding(horizontal = 8.dp, vertical = 3.dp),
        )
    }
}

private val previewChanges = listOf(
    Change(
        id = "1",
        projectId = "p1",
        name = "Actualizar home",
        description = "Ajustes visuales y correcciones menores.",
        status = "En Progreso",
        priority = "Alta",
    ),
    Change(
        id = "2",
        projectId = "p1",
        name = "Optimizar carga",
        description = "Reducir tiempo de render inicial.",
        status = "Pendiente",
        priority = "Media",
    ),
)

@Preview(showBackground = true)
@Composable
private fun ChangeListScreenPreview() {
    ProjectTrackTheme {
        ChangeListScreen(
            changes = previewChanges,
            onCreateChange = {},
            onChangeClick = {},
        )
    }
}
