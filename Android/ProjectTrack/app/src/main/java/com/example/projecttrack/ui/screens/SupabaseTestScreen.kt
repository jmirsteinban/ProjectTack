package com.example.projecttrack.ui.screens

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Button
import androidx.compose.material3.Text
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.example.projecttrack.data.HealthcheckRepository
import kotlinx.coroutines.launch

@Composable
fun SupabaseTestScreen(modifier: Modifier = Modifier) {
    var status by remember { mutableStateOf("Sin probar") }
    val scope = rememberCoroutineScope()

    Column(
        modifier = modifier.fillMaxSize().padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp),
    ) {
        Button(onClick = {
            scope.launch {
                status = "Consultando..."
                status = try {
                    val rows = HealthcheckRepository.fetchHealthcheck()
                    val msg = rows.firstOrNull()?.message ?: "sin filas"
                    "OK: $msg"
                } catch (e: Exception) {
                    "Error: ${e.message}"
                }
            }
        }) {
            Text("Probar Supabase")
        }

        Text(status)
    }
}