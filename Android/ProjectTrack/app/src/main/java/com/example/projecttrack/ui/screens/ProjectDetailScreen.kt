package com.example.projecttrack.ui.screens

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Card
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import com.example.projecttrack.data.Project
import com.example.projecttrack.ui.theme.ProjectTrackTheme
import com.example.projecttrack.ui.theme.extendedColors

@Composable
fun ProjectDetailScreen(
    project: Project?,
    modifier: Modifier = Modifier,
) {
    Column(
        modifier = modifier
            .fillMaxSize()
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp),
    ) {
        if (project == null) {
            Text("Proyecto no encontrado")
            return@Column
        }

        Card(
            modifier = Modifier.fillMaxWidth(),
            shape = MaterialTheme.shapes.medium
        ) {
            Column(
                modifier = Modifier.padding(16.dp),
                verticalArrangement = Arrangement.spacedBy(10.dp),
            ) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    verticalAlignment = Alignment.Top,
                ) {
                    Text(
                        text = project.name,
                        style = MaterialTheme.typography.headlineSmall,
                        fontWeight = FontWeight.Bold,
                        modifier = Modifier.weight(1f),
                    )

                    Surface(
                        color = MaterialTheme.extendedColors.badge,
                        shape = MaterialTheme.shapes.small,
                    ) {
                        Column(
                            modifier = Modifier.padding(horizontal = 10.dp, vertical = 6.dp),
                            horizontalAlignment = Alignment.End,
                        ) {
                            Text(
                                text = "Inicio",
                                style = MaterialTheme.typography.labelSmall,
                                color = MaterialTheme.extendedColors.onBadge,
                            )
                            Text(
                                text = project.startDate.ifBlank { "No definido" },
                                style = MaterialTheme.typography.bodySmall,
                                color = MaterialTheme.extendedColors.pillOn,
                                fontWeight = FontWeight.SemiBold,
                            )
                        }
                    }
                }

                Text(
                    text = project.description,
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                )

                Column(
                    verticalArrangement = Arrangement.spacedBy(8.dp),
                    modifier = Modifier.padding(top = 6.dp),
                ) {
                    DetailLine(label = "Workfront", value = project.workfrontLink ?: "No definido")
                    DetailLine(label = "One Drive", value = project.onedriveLink ?: "No definido")
                }
            }
        }

        UrlGroupCard(
            title = "QA",
            urls = project.qaUrls,
            accentColor = MaterialTheme.extendedColors.qa,
        )
        UrlGroupCard(
            title = "STG",
            urls = project.stgUrls,
            accentColor = MaterialTheme.extendedColors.stg,
        )
        UrlGroupCard(
            title = "PROD",
            urls = project.prodUrls,
            accentColor = MaterialTheme.extendedColors.prod,
        )
    }
}

@Composable
private fun DetailLine(
    label: String,
    value: String,
    modifier: Modifier = Modifier,
) {
    Row(
        modifier = modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.spacedBy(8.dp),
    ) {
        Text(
            text = "$label:",
            style = MaterialTheme.typography.labelMedium,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
        )
        Text(
            text = value,
            style = MaterialTheme.typography.bodyMedium,
            modifier = Modifier.weight(1f),
        )
    }
}

@Composable
private fun UrlGroupCard(
    title: String,
    urls: Map<String, String>,
    accentColor: Color,
    modifier: Modifier = Modifier,
) {
    Card(
        modifier = modifier.fillMaxWidth(),
        shape = MaterialTheme.shapes.medium
    ) {
        Column(
            modifier = Modifier.padding(12.dp),
            verticalArrangement = Arrangement.spacedBy(8.dp),
        ) {
            Surface(
                color = accentColor,
                shape = MaterialTheme.shapes.small,
            ) {
                Text(
                    text = title,
                    style = MaterialTheme.typography.labelLarge,
                    color = MaterialTheme.extendedColors.pillOn,
                    modifier = Modifier.padding(horizontal = 10.dp, vertical = 4.dp),
                )
            }

            if (urls.isEmpty()) {
                Text(
                    text = "Sin URLs configuradas",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                )
            } else {
                urls.toSortedMap().forEach { (label, value) ->
                    Text(
                        text = "${formatLabel(label)}: $value",
                        style = MaterialTheme.typography.bodySmall,
                    )
                }
            }
        }
    }
}

private fun formatLabel(raw: String): String {
    return raw
        .split("_")
        .filter { it.isNotBlank() }
        .joinToString(" ") { part ->
            part.lowercase().replaceFirstChar { ch ->
                if (ch.isLowerCase()) ch.titlecase() else ch.toString()
            }
        }
}

@Preview(showBackground = true)
@Composable
private fun ProjectDetailScreenPreview() {
    ProjectTrackTheme {
        ProjectDetailScreen(
            project = Project(
                id = "1",
                name = "Portal de Clientes",
                description = "UX Refactor y performance optimizado para dispositivos moviles y escritorio.",
                startDate = "2026-03-01",
                onedriveLink = "https://onedrive.com/project1",
                workfrontLink = "https://workfront.com/project1",
                qaUrls = mapOf("Home" to "https://qa.example.com", "Login" to "https://qa.example.com/login"),
                stgUrls = mapOf("Home" to "https://stg.example.com"),
                prodUrls = mapOf("Home" to "https://example.com")
            )
        )
    }
}
