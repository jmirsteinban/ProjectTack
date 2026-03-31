package com.example.projecttrack.ui.screens

import android.widget.Toast
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalClipboardManager
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.AnnotatedString
import androidx.compose.ui.unit.dp
import com.example.projecttrack.ui.theme.FormErrorCardBackgroundColor
import com.example.projecttrack.ui.theme.FormErrorCardBorderColor
import com.example.projecttrack.ui.theme.FormErrorColor

@Composable
fun FormErrorCard(
    message: String,
    modifier: Modifier = Modifier,
) {
    Card(
        modifier = modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(
            containerColor = FormErrorCardBackgroundColor,
        ),
        border = BorderStroke(1.dp, FormErrorCardBorderColor),
    ) {
        CopyableErrorText(
            text = "Error: $message",
            modifier = Modifier.padding(12.dp),
        )
    }
}

@Composable
fun CopyableErrorText(
    text: String,
    modifier: Modifier = Modifier,
) {
    val clipboardManager = LocalClipboardManager.current
    val context = LocalContext.current
    Text(
        text = text,
        color = FormErrorColor,
        style = MaterialTheme.typography.bodySmall,
        modifier = modifier.clickable {
            clipboardManager.setText(AnnotatedString(text))
            Toast.makeText(context, "Error copiado al portapapeles", Toast.LENGTH_SHORT).show()
        },
    )
}
