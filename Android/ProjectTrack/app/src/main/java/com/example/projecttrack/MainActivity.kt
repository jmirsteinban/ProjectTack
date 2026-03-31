package com.example.projecttrack

import android.os.Bundle
import android.widget.Toast
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.automirrored.filled.List
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material.icons.filled.Edit
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.DropdownMenuItem
import androidx.compose.material3.ExposedDropdownMenuBox
import androidx.compose.material3.ExposedDropdownMenuDefaults
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.MenuAnchorType
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import androidx.navigation.NavType
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.currentBackStackEntryAsState
import androidx.navigation.compose.rememberNavController
import androidx.navigation.navArgument
import com.example.projecttrack.data.AuthRepository
import com.example.projecttrack.data.AssigneeSuggestion
import com.example.projecttrack.data.Change
import com.example.projecttrack.data.ChangeRepository
import com.example.projecttrack.data.Project
import com.example.projecttrack.data.ProjectRepository
import com.example.projecttrack.data.ProjectTodoNote
import com.example.projecttrack.data.ProjectTodoNoteRepository
import com.example.projecttrack.data.UserDirectoryRepository
import com.example.projecttrack.data.isAssignedToUser
import com.example.projecttrack.ui.screens.ChangeDetailScreen
import com.example.projecttrack.ui.screens.ChangeEditorScreen
import com.example.projecttrack.ui.screens.ChangeListScreen
import com.example.projecttrack.ui.screens.ChangesEmptyState
import com.example.projecttrack.ui.screens.ChangesErrorState
import com.example.projecttrack.ui.screens.ChangesLoadingState
import com.example.projecttrack.ui.screens.HomeDashboardScreen
import com.example.projecttrack.ui.screens.LoginScreen
import com.example.projecttrack.ui.screens.ProfileScreen
import com.example.projecttrack.ui.screens.ProjectDetailScreen
import com.example.projecttrack.ui.screens.ProjectEditorScreen
import com.example.projecttrack.ui.screens.ProjectListScreen
import com.example.projecttrack.ui.screens.ProjectsEmptyState
import com.example.projecttrack.ui.screens.ProjectsErrorState
import com.example.projecttrack.ui.screens.ProjectsLoadingState
import com.example.projecttrack.ui.screens.ScreenHeader
import com.example.projecttrack.ui.theme.ProjectTrackTheme
import io.github.jan.supabase.auth.status.SessionStatus
import kotlinx.coroutines.launch

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContent {
            ProjectTrackTheme {
                val context = LocalContext.current
                var projects by remember { mutableStateOf<List<Project>>(emptyList()) }
                var allChanges by remember { mutableStateOf<List<Change>>(emptyList()) }
                var changesByProjectId by remember { mutableStateOf<Map<String, List<Change>>>(emptyMap()) }
                var mentionedNotes by remember { mutableStateOf<List<ProjectTodoNote>>(emptyList()) }
                var isLoading by remember { mutableStateOf(true) }
                var errorMessage by remember { mutableStateOf<String?>(null) }
                var dataWarningMessage by remember { mutableStateOf<String?>(null) }
                var reloadTrigger by remember { mutableIntStateOf(0) }
                val navController = rememberNavController()
                val navBackStackEntry by navController.currentBackStackEntryAsState()
                val currentRoute = navBackStackEntry?.destination?.route
                val currentProjectId = navBackStackEntry?.arguments?.getString("projectId")
                val currentChangeId = navBackStackEntry?.arguments?.getString("changeId")
                val sessionStatus by AuthRepository.sessionStatus.collectAsState()
                val isAuthInitializing = sessionStatus is SessionStatus.Initializing
                val isAuthenticated = sessionStatus is SessionStatus.Authenticated
                val authenticatedSession = sessionStatus as? SessionStatus.Authenticated
                val activeUserId = authenticatedSession?.session?.user?.id
                    ?: AuthRepository.currentUserIdOrNull().orEmpty()
                val activeUserEmail = authenticatedSession?.session?.user?.email
                    ?: AuthRepository.currentUserEmailOrNull().orEmpty()
                val headerInfo = screenHeaderForRoute(currentRoute)
                val projectNameById = projects.associate { project -> project.id to project.name }
                val changeNameById = allChanges.associate { change -> change.id to change.name }
                val assignedChanges = if (activeUserId.isBlank()) {
                    emptyList()
                } else {
                    allChanges.filter { change -> change.isAssignedToUser(activeUserId) }
                }
                var usersDirectorySuggestions by remember { mutableStateOf<List<AssigneeSuggestion>>(emptyList()) }
                val assigneeSuggestions = remember(
                    activeUserId,
                    activeUserEmail,
                    usersDirectorySuggestions,
                ) {
                    val uniqueCandidates = linkedMapOf<String, AssigneeSuggestion>()
                    val uuidRegex = Regex("^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$")
                    fun addCandidate(valueRaw: String?, labelRaw: String?) {
                        val value = valueRaw?.trim().orEmpty()
                        if (value.isBlank()) return
                        if (!uuidRegex.matches(value)) return
                        val baseLabel = labelRaw?.trim().orEmpty().ifBlank { value }
                        val label = if (baseLabel.startsWith("@")) baseLabel else "@$baseLabel"
                        val key = value.lowercase()
                        if (!uniqueCandidates.containsKey(key)) {
                            uniqueCandidates[key] = AssigneeSuggestion(
                                value = value,
                                label = label,
                            )
                        }
                    }

                    usersDirectorySuggestions.forEach { suggestion ->
                        addCandidate(
                            valueRaw = suggestion.value,
                            labelRaw = suggestion.label,
                        )
                    }

                    addCandidate(
                        valueRaw = activeUserId,
                        labelRaw = activeUserEmail.ifBlank { activeUserId },
                    )

                    uniqueCandidates.values.toList()
                }
                var loginIsSubmitting by remember { mutableStateOf(false) }
                var loginErrorMessage by remember { mutableStateOf<String?>(null) }
                var loginInfoMessage by remember { mutableStateOf<String?>(null) }
                var profileDisplayName by remember { mutableStateOf(AuthRepository.currentUserDisplayNameOrNull().orEmpty()) }
                var profileNameIsSubmitting by remember { mutableStateOf(false) }
                var profileNameErrorMessage by remember { mutableStateOf<String?>(null) }
                var profileNameInfoMessage by remember { mutableStateOf<String?>(null) }
                val activeUserDisplayName = profileDisplayName.ifBlank {
                    AuthRepository.currentUserDisplayNameOrNull().orEmpty()
                }
                val showProfileHeaderActions = currentRoute == "profile"
                val showProjectsHeaderActions = currentRoute == "projects"
                val showProjectCreateHeaderActions = currentRoute == "project_create"
                val showProjectEditHeaderActions = currentRoute == "project_edit/{projectId}" && currentProjectId != null
                val showProjectDetailHeaderActions = currentRoute == "project_detail/{projectId}" && currentProjectId != null
                val showChangeCreateHeaderActions = currentRoute == "change_create/{projectId}" && currentProjectId != null
                val showChangeDetailHeaderActions = currentRoute == "change_detail/{changeId}" && currentChangeId != null
                val showChangeEditHeaderActions = currentRoute == "change_edit/{changeId}" && currentChangeId != null
                var changeDetailHeaderState by remember { mutableStateOf<Change?>(null) }
                var changeCreateSubmitTrigger by remember { mutableIntStateOf(0) }
                var changeCreateCanSubmit by remember { mutableStateOf(false) }
                var changeCreateIsSubmitting by remember { mutableStateOf(false) }
                var changeEditSubmitTrigger by remember { mutableIntStateOf(0) }
                var changeEditCanSubmit by remember { mutableStateOf(false) }
                var changeEditIsSubmitting by remember { mutableStateOf(false) }
                var projectEditSubmitTrigger by remember { mutableIntStateOf(0) }
                var projectEditCanSubmit by remember { mutableStateOf(false) }
                var projectEditIsSubmitting by remember { mutableStateOf(false) }
                var showProjectPickerForNewChange by remember { mutableStateOf(false) }
                val headerActionsScope = rememberCoroutineScope()

                LaunchedEffect(showChangeDetailHeaderActions) {
                    if (!showChangeDetailHeaderActions) {
                        changeDetailHeaderState = null
                    }
                }

                LaunchedEffect(showChangeEditHeaderActions) {
                    if (!showChangeEditHeaderActions) {
                        changeEditSubmitTrigger = 0
                        changeEditCanSubmit = false
                        changeEditIsSubmitting = false
                    }
                }

                LaunchedEffect(showChangeCreateHeaderActions) {
                    if (!showChangeCreateHeaderActions) {
                        changeCreateSubmitTrigger = 0
                        changeCreateCanSubmit = false
                        changeCreateIsSubmitting = false
                    }
                }

                LaunchedEffect(showProjectEditHeaderActions) {
                    if (!showProjectEditHeaderActions) {
                        projectEditSubmitTrigger = 0
                        projectEditCanSubmit = false
                        projectEditIsSubmitting = false
                    }
                }

                LaunchedEffect(showProjectsHeaderActions) {
                    if (!showProjectsHeaderActions) {
                        showProjectPickerForNewChange = false
                    }
                }

                LaunchedEffect(sessionStatus, currentRoute) {
                    when (sessionStatus) {
                        SessionStatus.Initializing -> Unit

                        is SessionStatus.Authenticated -> {
                            loginIsSubmitting = false
                            loginErrorMessage = null
                            loginInfoMessage = null
                            profileDisplayName = AuthRepository.currentUserDisplayNameOrNull().orEmpty()
                            if (currentRoute == null || currentRoute == "login") {
                                navController.navigate("home") {
                                    popUpTo("login") { inclusive = true }
                                    launchSingleTop = true
                                }
                            }
                        }

                        is SessionStatus.NotAuthenticated, is SessionStatus.RefreshFailure -> {
                            loginIsSubmitting = false
                            profileDisplayName = ""
                            profileNameIsSubmitting = false
                            profileNameErrorMessage = null
                            profileNameInfoMessage = null
                            if (currentRoute != null && currentRoute != "login") {
                                navController.navigate("login") {
                                    popUpTo(navController.graph.startDestinationId) {
                                        inclusive = true
                                    }
                                    launchSingleTop = true
                                }
                            }
                        }
                    }
                }

                LaunchedEffect(reloadTrigger, isAuthenticated, activeUserId) {
                    if (!isAuthenticated) {
                        projects = emptyList()
                        allChanges = emptyList()
                        changesByProjectId = emptyMap()
                        mentionedNotes = emptyList()
                        usersDirectorySuggestions = emptyList()
                        isLoading = false
                        errorMessage = null
                        dataWarningMessage = null
                        return@LaunchedEffect
                    }
                    isLoading = true
                    errorMessage = null
                    dataWarningMessage = null
                    try {
                        val loadedProjects = ProjectRepository.fetchProjects()
                        projects = loadedProjects
                        if (loadedProjects.isEmpty()) {
                            dataWarningMessage = "No hay proyectos visibles para este usuario. Revisa politicas RLS de projects."
                        }
                    } catch (e: Exception) {
                        projects = emptyList()
                        allChanges = emptyList()
                        changesByProjectId = emptyMap()
                        mentionedNotes = emptyList()
                        val message = e.message ?: "Error desconocido"
                        errorMessage = "No se pudieron cargar los proyectos: $message"
                        isLoading = false
                        return@LaunchedEffect
                    }

                    try {
                        val loadedChanges = ChangeRepository.fetchAllChanges()
                        allChanges = loadedChanges
                        changesByProjectId = loadedChanges.groupBy { it.projectId }
                    } catch (e: Exception) {
                        allChanges = emptyList()
                        changesByProjectId = emptyMap()
                        val message = e.message ?: "Error desconocido"
                        val warningPrefix = if (dataWarningMessage.isNullOrBlank()) "" else "$dataWarningMessage "
                        dataWarningMessage = "${warningPrefix}Se cargaron proyectos, pero no cambios: $message"
                    }

                    try {
                        if (activeUserId.isBlank()) {
                            mentionedNotes = emptyList()
                        } else {
                            val notesByProject = projects.flatMap { project ->
                                ProjectTodoNoteRepository.fetchTodoNotesByProject(project.id)
                            }
                            mentionedNotes = notesByProject
                                .asSequence()
                                .filter { note ->
                                    note.changeId?.isNotBlank() == true &&
                                        isNoteMentioningUser(note, activeUserId) &&
                                        !isTodoNoteCompletedStatus(note.status)
                                }
                                .distinctBy { note -> note.id }
                                .sortedByDescending { note -> note.createdAt }
                                .take(20)
                                .toList()
                        }
                    } catch (e: Exception) {
                        mentionedNotes = emptyList()
                        val message = e.message ?: "Error desconocido"
                        val warningPrefix = if (dataWarningMessage.isNullOrBlank()) "" else "$dataWarningMessage "
                        dataWarningMessage = "${warningPrefix}No se pudieron cargar notas donde te mencionan: $message"
                    }

                    try {
                        usersDirectorySuggestions = UserDirectoryRepository.fetchAssigneeSuggestions()
                    } catch (_: Exception) {
                        // Si falla la lectura de users (RLS o schema), mantenemos fallback con asignados actuales.
                        usersDirectorySuggestions = emptyList()
                    }

                    isLoading = false
                }

                Scaffold(
                    modifier = Modifier.fillMaxSize(),
                    topBar = {
                        if (isAuthenticated && currentRoute != "login") {
                            ScreenHeader(
                                title = headerInfo.title,
                                breadcrumb = headerInfo.breadcrumb,
                                secondaryActionLabel = when {
                                    showProjectEditHeaderActions -> "Cancelar"
                                    showChangeCreateHeaderActions -> "Cancelar"
                                    showProjectsHeaderActions ||
                                        showProjectCreateHeaderActions ||
                                        showProfileHeaderActions ||
                                        showProjectDetailHeaderActions ||
                                        showChangeDetailHeaderActions ||
                                        showChangeEditHeaderActions -> "Volver"
                                    else -> null
                                },
                                onSecondaryAction = if (
                                    showProjectsHeaderActions ||
                                    showProjectCreateHeaderActions ||
                                    showProjectEditHeaderActions ||
                                    showChangeCreateHeaderActions ||
                                    showProfileHeaderActions ||
                                    showProjectDetailHeaderActions ||
                                    showChangeDetailHeaderActions ||
                                    showChangeEditHeaderActions
                                ) {
                                    { navController.popBackStack() }
                                } else null,
                                secondaryActionIcon = if (
                                    showProjectsHeaderActions ||
                                    showProjectCreateHeaderActions ||
                                    showProjectEditHeaderActions ||
                                    showChangeCreateHeaderActions ||
                                    showProfileHeaderActions ||
                                    showProjectDetailHeaderActions ||
                                    showChangeDetailHeaderActions ||
                                    showChangeEditHeaderActions
                                ) {
                                    Icons.AutoMirrored.Filled.ArrowBack
                                } else null,
                                primaryActionLabel = when {
                                    showProjectsHeaderActions -> "Nuevo Proyecto"
                                    showProjectEditHeaderActions -> if (projectEditIsSubmitting) "Guardando..." else "Guardar cambios"
                                    showChangeCreateHeaderActions -> if (changeCreateIsSubmitting) "Creando..." else "Crear cambio"
                                    showProjectDetailHeaderActions -> "Ver cambios"
                                    showChangeDetailHeaderActions && changeDetailHeaderState != null -> "Editar"
                                    showChangeEditHeaderActions -> if (changeEditIsSubmitting) "Guardando..." else "Guardar"
                                    else -> null
                                },
                                onPrimaryAction = if (showProjectsHeaderActions) {
                                    {
                                        navController.navigate("project_create")
                                    }
                                } else if (showProjectEditHeaderActions) {
                                    {
                                        if (projectEditCanSubmit && !projectEditIsSubmitting) {
                                            projectEditSubmitTrigger++
                                        }
                                    }
                                } else if (showChangeCreateHeaderActions) {
                                    {
                                        if (!changeCreateIsSubmitting) {
                                            changeCreateSubmitTrigger++
                                        }
                                        if (!changeCreateCanSubmit && !changeCreateIsSubmitting) {
                                            Toast.makeText(
                                                context,
                                                "Completa Nombre, Asignados, Workfront, OneDrive y al menos un ambiente visible.",
                                                Toast.LENGTH_LONG,
                                            ).show()
                                        }
                                    }
                                } else if (showProjectDetailHeaderActions) {
                                    { navController.navigate("project_changes/$currentProjectId") }
                                } else if (showChangeDetailHeaderActions && changeDetailHeaderState != null) {
                                    { navController.navigate("change_edit/$currentChangeId") }
                                } else if (showChangeEditHeaderActions) {
                                    {
                                        if (!changeEditIsSubmitting) {
                                            changeEditSubmitTrigger++
                                        }
                                        if (!changeEditCanSubmit && !changeEditIsSubmitting) {
                                            Toast.makeText(
                                                context,
                                                "Completa Nombre, Asignados, Workfront, OneDrive y al menos un ambiente visible.",
                                                Toast.LENGTH_LONG,
                                            ).show()
                                        }
                                    }
                                } else null,
                                primaryActionIcon = if (showProjectsHeaderActions) {
                                    Icons.Filled.Add
                                } else if (showProjectEditHeaderActions) {
                                    Icons.Filled.Edit
                                } else if (showChangeCreateHeaderActions) {
                                    Icons.Filled.Add
                                } else if (showProjectDetailHeaderActions) {
                                    Icons.AutoMirrored.Filled.List
                                } else if (showChangeDetailHeaderActions && changeDetailHeaderState != null) {
                                    Icons.Filled.Edit
                                } else if (showChangeEditHeaderActions) {
                                    Icons.Filled.Edit
                                } else null,
                                tertiaryActionLabel = when {
                                    showProjectsHeaderActions -> "Nuevo Cambio"
                                    showChangeDetailHeaderActions && changeDetailHeaderState != null -> "Eliminar"
                                    showProjectDetailHeaderActions -> "Editar"
                                    else -> null
                                },
                                onTertiaryAction = when {
                                    showProjectsHeaderActions -> {
                                        {
                                            showProjectPickerForNewChange = true
                                        }
                                    }
                                    showChangeDetailHeaderActions && changeDetailHeaderState != null -> {
                                        {
                                            val currentChange = changeDetailHeaderState
                                            if (currentChange != null) {
                                                headerActionsScope.launch {
                                                    try {
                                                        val deleted = ChangeRepository.softDeleteChange(
                                                            changeId = currentChange.id,
                                                            deletedBy = activeUserId,
                                                        )
                                                        if (deleted) {
                                                            reloadTrigger++
                                                            navController.navigate("project_changes/${currentChange.projectId}") {
                                                                popUpTo("project_changes/${currentChange.projectId}") {
                                                                    inclusive = true
                                                                }
                                                            }
                                                        } else {
                                                            errorMessage = "No se pudo eliminar el cambio."
                                                        }
                                                    } catch (e: Exception) {
                                                        errorMessage = e.message ?: "Error eliminando cambio"
                                                    }
                                                }
                                            }
                                        }
                                    }
                                    showProjectDetailHeaderActions -> {
                                        {
                                            navController.navigate("project_edit/$currentProjectId")
                                        }
                                    }
                                    else -> null
                                },
                                tertiaryActionIcon = when {
                                    showProjectsHeaderActions -> Icons.Filled.Edit
                                    showChangeDetailHeaderActions && changeDetailHeaderState != null -> Icons.Filled.Delete
                                    showProjectDetailHeaderActions -> Icons.Filled.Edit
                                    else -> null
                                },
                                showUserAvatar = true,
                                onUserDashboardClick = {
                                    val movedToHome = navController.popBackStack("home", inclusive = false)
                                    if (!movedToHome) {
                                        navController.navigate("home") {
                                            launchSingleTop = true
                                        }
                                    }
                                },
                                onUserProfileClick = {
                                    if (currentRoute != "profile") {
                                        navController.navigate("profile") {
                                            launchSingleTop = true
                                        }
                                    }
                                },
                                onUserLogoutClick = {
                                    headerActionsScope.launch {
                                        try {
                                            AuthRepository.signOut()
                                            Toast.makeText(context, "Sesion cerrada", Toast.LENGTH_SHORT).show()
                                        } catch (e: Exception) {
                                            Toast.makeText(
                                                context,
                                                e.message ?: "No se pudo cerrar sesion",
                                                Toast.LENGTH_LONG,
                                            ).show()
                                        }
                                    }
                                },
                            )
                        }
                    },
                ) { innerPadding ->
                    NavHost(
                        navController = navController,
                        startDestination = "login",
                        modifier = Modifier.padding(innerPadding),
                    ) {
                        composable("login") {
                            LoginScreen(
                                isSessionInitializing = isAuthInitializing,
                                isSubmitting = loginIsSubmitting,
                                errorMessage = loginErrorMessage,
                                infoMessage = loginInfoMessage,
                                onLogin = { email, password ->
                                    if (isAuthInitializing || loginIsSubmitting) return@LoginScreen
                                    headerActionsScope.launch {
                                        loginIsSubmitting = true
                                        loginErrorMessage = null
                                        loginInfoMessage = null
                                        try {
                                            AuthRepository.signInWithEmail(email, password)
                                        } catch (e: Exception) {
                                            loginErrorMessage = AuthRepository.mapLoginError(e)
                                        } finally {
                                            loginIsSubmitting = false
                                        }
                                    }
                                },
                                onSignUp = { email, password ->
                                    if (isAuthInitializing || loginIsSubmitting) return@LoginScreen
                                    headerActionsScope.launch {
                                        loginIsSubmitting = true
                                        loginErrorMessage = null
                                        loginInfoMessage = null
                                        try {
                                            AuthRepository.signUpWithEmail(email, password)
                                            loginInfoMessage =
                                                "Cuenta creada. Revisa tu correo para confirmarla y luego inicia sesion."
                                        } catch (e: Exception) {
                                            loginErrorMessage = AuthRepository.mapSignUpError(e)
                                        } finally {
                                            loginIsSubmitting = false
                                        }
                                    }
                                },
                                onRecoverPassword = { email ->
                                    if (isAuthInitializing || loginIsSubmitting) return@LoginScreen
                                    headerActionsScope.launch {
                                        loginIsSubmitting = true
                                        loginErrorMessage = null
                                        loginInfoMessage = null
                                        try {
                                            AuthRepository.sendPasswordResetEmail(email)
                                            loginInfoMessage =
                                                "Si el correo existe, te enviamos un link para cambiar la contrasena."
                                        } catch (e: Exception) {
                                            loginErrorMessage = AuthRepository.mapPasswordResetError(e)
                                        } finally {
                                            loginIsSubmitting = false
                                        }
                                    }
                                },
                            )
                        }

                        composable("home") {
                            if (!isAuthenticated) {
                                ProjectsLoadingState()
                            } else {
                                when {
                                    isLoading -> ProjectsLoadingState()
                                    errorMessage != null -> ProjectsErrorState(
                                        message = errorMessage ?: "Error desconocido",
                                        onRetry = { reloadTrigger++ },
                                    )
                                    else -> HomeDashboardScreen(
                                        assignedChanges = assignedChanges,
                                        mentionedNotes = mentionedNotes,
                                        projectNameById = projectNameById,
                                        changeNameById = changeNameById,
                                        activeUserDisplayName = activeUserDisplayName,
                                        activeUserId = activeUserId,
                                        onGoToProjects = { navController.navigate("projects") },
                                        onChangeClick = { change ->
                                            navController.navigate("change_detail/${change.id}")
                                        },
                                        onMentionNoteClick = { note ->
                                            val noteChangeId = note.changeId
                                            if (noteChangeId.isNullOrBlank()) {
                                                Toast.makeText(
                                                    context,
                                                    "La nota no tiene un cambio asociado.",
                                                    Toast.LENGTH_SHORT,
                                                ).show()
                                            } else {
                                                navController.navigate("change_detail/$noteChangeId")
                                            }
                                        },
                                    )
                                }
                            }
                        }

                        composable("profile") {
                            ProfileScreen(
                                currentDisplayName = profileDisplayName,
                                isSavingDisplayName = profileNameIsSubmitting,
                                displayNameErrorMessage = profileNameErrorMessage,
                                displayNameInfoMessage = profileNameInfoMessage,
                                onSaveDisplayName = { updatedName ->
                                    if (profileNameIsSubmitting) return@ProfileScreen
                                    headerActionsScope.launch {
                                        profileNameIsSubmitting = true
                                        profileNameErrorMessage = null
                                        profileNameInfoMessage = null
                                        try {
                                            AuthRepository.updateCurrentUserDisplayName(updatedName)
                                            profileDisplayName = AuthRepository.currentUserDisplayNameOrNull().orEmpty()
                                            profileNameInfoMessage = "Nombre actualizado correctamente."
                                        } catch (e: Exception) {
                                            profileNameErrorMessage = AuthRepository.mapProfileUpdateError(e)
                                        } finally {
                                            profileNameIsSubmitting = false
                                        }
                                    }
                                },
                                userEmail = activeUserEmail,
                                userId = activeUserId,
                                isAuthenticated = isAuthenticated,
                                projectsCount = projects.size,
                                changesCount = allChanges.size,
                                dataWarningMessage = dataWarningMessage,
                            )
                        }

                        composable("projects") {
                            if (!isAuthenticated) {
                                ProjectsLoadingState()
                            } else {
                                when {
                                    isLoading -> ProjectsLoadingState()
                                    errorMessage != null -> ProjectsErrorState(
                                        message = errorMessage ?: "Error desconocido",
                                        onRetry = { reloadTrigger++ },
                                    )
                                    projects.isEmpty() -> ProjectsEmptyState()
                                    else -> ProjectListScreen(
                                        projects = projects,
                                        changesByProjectId = changesByProjectId,
                                        onProjectClick = { project ->
                                            navController.navigate("project_detail/${project.id}")
                                        },
                                        onChangeClick = { change ->
                                            navController.navigate("change_detail/${change.id}")
                                        },
                                    )
                                }
                            }

                            if (showProjectPickerForNewChange) {
                                ProjectSelectionForNewChangeDialog(
                                    isLoading = isLoading,
                                    errorMessage = errorMessage,
                                    projects = projects.sortedBy { project -> project.name.lowercase() },
                                    onDismiss = {
                                        showProjectPickerForNewChange = false
                                    },
                                    onProjectSelected = { project ->
                                        showProjectPickerForNewChange = false
                                        navController.navigate("change_create/${project.id}")
                                    },
                                )
                            }
                        }

                        composable("project_create") {
                            var isSubmitting by remember { mutableStateOf(false) }
                            var submitError by remember { mutableStateOf<String?>(null) }
                            val scope = rememberCoroutineScope()

                            ProjectEditorScreen(
                                title = "Nuevo proyecto",
                                initialName = "",
                                initialDescription = "",
                                initialStartDate = "",
                                initialWorkfrontLink = "",
                                initialOneDriveLink = "",
                                initialQaUrls = emptyMap(),
                                initialStgUrls = emptyMap(),
                                initialProdUrls = emptyMap(),
                                submitLabel = "Crear proyecto",
                                isSubmitting = isSubmitting,
                                errorMessage = submitError,
                                onSubmit = { name, description, startDate, workfrontLink, oneDriveLink, qaUrls, stgUrls, prodUrls ->
                                    scope.launch {
                                        isSubmitting = true
                                        submitError = null
                                        try {
                                            val created = ProjectRepository.createProject(
                                                name = name,
                                                description = description,
                                                startDate = startDate,
                                                onedriveLink = oneDriveLink,
                                                workfrontLink = workfrontLink,
                                                qaUrls = qaUrls,
                                                stgUrls = stgUrls,
                                                prodUrls = prodUrls,
                                            )
                                            if (created == null) {
                                                submitError = "No se pudo crear el proyecto"
                                            } else {
                                                projects = projects + created
                                                dataWarningMessage = null
                                                reloadTrigger++
                                                navController.navigate("project_detail/${created.id}") {
                                                    popUpTo("project_create") {
                                                        inclusive = true
                                                    }
                                                }
                                            }
                                        } catch (e: Exception) {
                                            submitError = e.message ?: "Error creando proyecto"
                                        } finally {
                                            isSubmitting = false
                                        }
                                    }
                                },
                                onBack = { navController.popBackStack() },
                            )
                        }

                        composable(
                            route = "project_edit/{projectId}",
                            arguments = listOf(navArgument("projectId") {
                                type = NavType.StringType
                            }),
                        ) { backStackEntry ->
                            val projectId = backStackEntry.arguments?.getString("projectId")
                            if (projectId == null) {
                                ProjectsErrorState(
                                    message = "ID de proyecto invalido",
                                    onRetry = {},
                                )
                                return@composable
                            }

                            var project by remember(projectId) {
                                mutableStateOf<Project?>(projects.firstOrNull { it.id == projectId })
                            }
                            var isProjectLoading by remember(projectId) { mutableStateOf(project == null) }
                            var submitError by remember(projectId) { mutableStateOf<String?>(null) }
                            var isSubmitting by remember(projectId) { mutableStateOf(false) }
                            var reloadProject by remember(projectId) { mutableIntStateOf(0) }
                            val scope = rememberCoroutineScope()

                            LaunchedEffect(projectId) {
                                projectEditSubmitTrigger = 0
                                projectEditCanSubmit = false
                                projectEditIsSubmitting = false
                            }

                            LaunchedEffect(isSubmitting) {
                                projectEditIsSubmitting = isSubmitting
                            }

                            LaunchedEffect(projectId, reloadProject) {
                                isProjectLoading = true
                                submitError = null
                                try {
                                    project = ProjectRepository.fetchProjectById(projectId)
                                } catch (e: Exception) {
                                    submitError = e.message ?: "Error cargando proyecto"
                                } finally {
                                    isProjectLoading = false
                                }
                            }

                            when {
                                isProjectLoading -> ProjectsLoadingState()
                                submitError != null && project == null -> ProjectsErrorState(
                                    message = submitError ?: "Error desconocido",
                                    onRetry = { reloadProject++ },
                                )
                                else -> {
                                    val currentProject = project
                                    ProjectEditorScreen(
                                        title = "Editar proyecto",
                                        initialName = currentProject?.name.orEmpty(),
                                        initialDescription = projectDescriptionForEditor(
                                            currentProject?.description.orEmpty(),
                                        ),
                                        initialStartDate = currentProject?.startDate.orEmpty(),
                                        initialWorkfrontLink = currentProject?.workfrontLink.orEmpty(),
                                        initialOneDriveLink = currentProject?.onedriveLink.orEmpty(),
                                        initialQaUrls = currentProject?.qaUrls.orEmpty(),
                                        initialStgUrls = currentProject?.stgUrls.orEmpty(),
                                        initialProdUrls = currentProject?.prodUrls.orEmpty(),
                                        submitLabel = "Guardar cambios",
                                        isSubmitting = isSubmitting,
                                        errorMessage = submitError,
                                        onSubmit = { name, description, startDate, workfrontLink, oneDriveLink, qaUrls, stgUrls, prodUrls ->
                                            if (currentProject == null) return@ProjectEditorScreen
                                            scope.launch {
                                                isSubmitting = true
                                                submitError = null
                                                try {
                                                    val updated = ProjectRepository.updateProject(
                                                        projectId = currentProject.id,
                                                        name = name,
                                                        description = description,
                                                        startDate = startDate,
                                                        onedriveLink = oneDriveLink,
                                                        workfrontLink = workfrontLink,
                                                        qaUrls = qaUrls,
                                                        stgUrls = stgUrls,
                                                        prodUrls = prodUrls,
                                                    )
                                                    if (updated == null) {
                                                        submitError = ProjectRepository.consumeLastUpdateDiagnostic()
                                                            ?: "No se pudo actualizar el proyecto"
                                                    } else {
                                                        projects = projects.map { existing ->
                                                            if (existing.id == updated.id) updated else existing
                                                        }
                                                        reloadTrigger++
                                                        navController.popBackStack()
                                                    }
                                                } catch (e: Exception) {
                                                    submitError = e.message ?: "Error actualizando proyecto"
                                                } finally {
                                                    isSubmitting = false
                                                }
                                            }
                                        },
                                        onBack = { navController.popBackStack() },
                                        showActionButtons = false,
                                        submitTrigger = projectEditSubmitTrigger,
                                        onCanSubmitChange = { canSubmit ->
                                            projectEditCanSubmit = canSubmit
                                        },
                                    )
                                }
                            }
                        }

                        composable(
                            route = "project_detail/{projectId}",
                            arguments = listOf(navArgument("projectId") {
                                type = NavType.StringType
                            }),
                        ) { backStackEntry ->
                            val projectId = backStackEntry.arguments?.getString("projectId")
                            val project = projects.firstOrNull { it.id == projectId }

                            ProjectDetailScreen(
                                project = project,
                            )
                        }

                        composable(
                            route = "project_changes/{projectId}",
                            arguments = listOf(navArgument("projectId") {
                                type = NavType.StringType
                            }),
                        ) { backStackEntry ->
                            val projectId = backStackEntry.arguments?.getString("projectId")
                            if (projectId == null) {
                                ChangesErrorState(
                                    message = "ID de proyecto invalido",
                                    onRetry = {},
                                )
                                return@composable
                            }

                            var changes by remember(projectId) { mutableStateOf<List<Change>>(emptyList()) }
                            var isChangesLoading by remember(projectId) { mutableStateOf(true) }
                            var changesError by remember(projectId) { mutableStateOf<String?>(null) }
                            var changesReload by remember(projectId) { mutableIntStateOf(0) }

                            LaunchedEffect(projectId, changesReload) {
                                isChangesLoading = true
                                changesError = null
                                try {
                                    changes = ChangeRepository.fetchChangesByProject(projectId)
                                } catch (e: Exception) {
                                    changesError = e.message ?: "Error desconocido"
                                } finally {
                                    isChangesLoading = false
                                }
                            }

                            when {
                                isChangesLoading -> ChangesLoadingState()
                                changesError != null -> ChangesErrorState(
                                    message = changesError ?: "Error desconocido",
                                    onRetry = { changesReload++ },
                                )
                                changes.isEmpty() -> ChangesEmptyState(
                                    onCreateChange = {
                                        navController.navigate("change_create/$projectId")
                                    },
                                )
                                else -> ChangeListScreen(
                                    changes = changes,
                                    onCreateChange = {
                                        navController.navigate("change_create/$projectId")
                                    },
                                    onChangeClick = { change ->
                                        navController.navigate("change_detail/${change.id}")
                                    },
                                )
                            }
                        }

                        composable(
                            route = "change_detail/{changeId}",
                            arguments = listOf(navArgument("changeId") {
                                type = NavType.StringType
                            }),
                        ) { backStackEntry ->
                            val changeId = backStackEntry.arguments?.getString("changeId")
                            if (changeId == null) {
                                ChangesErrorState(
                                    message = "ID de cambio invalido",
                                    onRetry = {},
                                )
                                return@composable
                            }

                            var change by remember(changeId) { mutableStateOf<Change?>(null) }
                            var isChangeLoading by remember(changeId) { mutableStateOf(true) }
                            var changeError by remember(changeId) { mutableStateOf<String?>(null) }
                            var todoNotes by remember(changeId) { mutableStateOf<List<ProjectTodoNote>>(emptyList()) }
                            var todoNotesError by remember(changeId) { mutableStateOf<String?>(null) }
                            var todoActionError by remember(changeId) { mutableStateOf<String?>(null) }
                            var isTodoSubmitting by remember(changeId) { mutableStateOf(false) }
                            var changeReload by remember(changeId) { mutableIntStateOf(0) }
                            val changeDetailScope = rememberCoroutineScope()

                            LaunchedEffect(changeId) {
                                changeDetailHeaderState = null
                                todoNotes = emptyList()
                                todoNotesError = null
                                todoActionError = null
                                isTodoSubmitting = false
                            }

                            LaunchedEffect(changeId, changeReload) {
                                isChangeLoading = true
                                changeError = null
                                try {
                                    val loadedChange = ChangeRepository.fetchChangeById(changeId)
                                    change = loadedChange

                                    if (loadedChange != null) {
                                        try {
                                            todoNotes = ProjectTodoNoteRepository.fetchTodoNotesByChange(
                                                changeId = loadedChange.id,
                                                projectIdFallback = loadedChange.projectId,
                                            )
                                            todoNotesError = null
                                        } catch (e: Exception) {
                                            todoNotes = emptyList()
                                            todoNotesError = e.message ?: "Error cargando notas TO-DO"
                                        }
                                    } else {
                                        todoNotes = emptyList()
                                        todoNotesError = null
                                    }
                                } catch (e: Exception) {
                                    changeError = e.message ?: "Error desconocido"
                                } finally {
                                    isChangeLoading = false
                                }
                            }

                            when {
                                isChangeLoading -> ChangesLoadingState()
                                changeError != null -> ChangesErrorState(
                                    message = changeError ?: "Error desconocido",
                                    onRetry = { changeReload++ },
                                )
                                else -> {
                                    LaunchedEffect(change?.id) {
                                        changeDetailHeaderState = change
                                    }
                                    ChangeDetailScreen(
                                        change = change,
                                        project = change?.let { loadedChange ->
                                            projects.firstOrNull { project -> project.id == loadedChange.projectId }
                                        },
                                        assigneeSuggestions = assigneeSuggestions,
                                        todoNotes = todoNotes,
                                        todoNotesError = todoNotesError,
                                        isTodoSubmitting = isTodoSubmitting,
                                        todoActionError = todoActionError,
                                        onCreateTodoNote = { noteText, noteAssigneeIds ->
                                            val projectIdForNote = change?.projectId
                                            val changeIdForNote = change?.id
                                            if (projectIdForNote.isNullOrBlank() || changeIdForNote.isNullOrBlank()) {
                                                todoActionError = "No se pudo identificar el cambio para crear la nota."
                                            } else {
                                                changeDetailScope.launch {
                                                    isTodoSubmitting = true
                                                    todoActionError = null
                                                    try {
                                                        val created = ProjectTodoNoteRepository.createTodoNote(
                                                            projectId = projectIdForNote,
                                                            changeId = changeIdForNote,
                                                            text = noteText,
                                                            assigneeUserIds = noteAssigneeIds,
                                                        )
                                                        if (created == null) {
                                                            throw IllegalStateException("No se pudo crear la nota TO-DO.")
                                                        }
                                                        todoNotes = ProjectTodoNoteRepository.fetchTodoNotesByChange(
                                                            changeId = changeIdForNote,
                                                            projectIdFallback = projectIdForNote,
                                                        )
                                                        todoNotesError = null
                                                    } catch (e: Exception) {
                                                        todoActionError = mapProjectNotesActionError(
                                                            throwable = e,
                                                            actionLabel = "crear",
                                                        )
                                                    } finally {
                                                        isTodoSubmitting = false
                                                    }
                                                }
                                            }
                                        },
                                        onUpdateTodoNoteText = { noteId, updatedText, updatedAssigneeIds, completed ->
                                            val changeIdForNote = change?.id
                                            val projectIdForNote = change?.projectId
                                            if (changeIdForNote.isNullOrBlank()) {
                                                todoActionError = "No se pudo identificar el cambio para editar la nota."
                                            } else {
                                                changeDetailScope.launch {
                                                    isTodoSubmitting = true
                                                    todoActionError = null
                                                    try {
                                                        val updated = ProjectTodoNoteRepository.updateTodoNoteText(
                                                            noteId = noteId,
                                                            text = updatedText,
                                                            assigneeUserIds = updatedAssigneeIds,
                                                            completed = completed,
                                                        )
                                                        if (updated == null) {
                                                            throw IllegalStateException("No se pudo editar la nota TO-DO.")
                                                        }
                                                        todoNotes = ProjectTodoNoteRepository.fetchTodoNotesByChange(
                                                            changeId = changeIdForNote,
                                                            projectIdFallback = projectIdForNote,
                                                        )
                                                        todoNotesError = null
                                                    } catch (e: Exception) {
                                                        todoActionError = mapProjectNotesActionError(
                                                            throwable = e,
                                                            actionLabel = "editar",
                                                        )
                                                    } finally {
                                                        isTodoSubmitting = false
                                                    }
                                                }
                                            }
                                        },
                                        onToggleTodoNoteCompletion = { noteId, completed ->
                                            val changeIdForNote = change?.id
                                            val projectIdForNote = change?.projectId
                                            if (changeIdForNote.isNullOrBlank()) {
                                                todoActionError = "No se pudo identificar el cambio para actualizar la nota."
                                            } else {
                                                changeDetailScope.launch {
                                                    isTodoSubmitting = true
                                                    todoActionError = null
                                                    try {
                                                        val updated = ProjectTodoNoteRepository.setTodoNoteCompletion(
                                                            noteId = noteId,
                                                            completed = completed,
                                                        )
                                                        if (updated == null) {
                                                            throw IllegalStateException("No se pudo actualizar estado de la nota TO-DO.")
                                                        }
                                                        todoNotes = ProjectTodoNoteRepository.fetchTodoNotesByChange(
                                                            changeId = changeIdForNote,
                                                            projectIdFallback = projectIdForNote,
                                                        )
                                                        todoNotesError = null
                                                    } catch (e: Exception) {
                                                        todoActionError = mapProjectNotesActionError(
                                                            throwable = e,
                                                            actionLabel = "actualizar",
                                                        )
                                                    } finally {
                                                        isTodoSubmitting = false
                                                    }
                                                }
                                            }
                                        },
                                    )
                                }
                            }
                        }

                        composable(
                            route = "change_create/{projectId}",
                            arguments = listOf(navArgument("projectId") {
                                type = NavType.StringType
                            }),
                        ) { backStackEntry ->
                            val projectId = backStackEntry.arguments?.getString("projectId")
                            if (projectId == null) {
                                ChangesErrorState(
                                    message = "ID de proyecto invalido",
                                    onRetry = {},
                                )
                                return@composable
                            }

                            var isSubmitting by remember(projectId) { mutableStateOf(false) }
                            var submitError by remember(projectId) { mutableStateOf<String?>(null) }
                            val scope = rememberCoroutineScope()

                            LaunchedEffect(projectId) {
                                changeCreateSubmitTrigger = 0
                                changeCreateCanSubmit = false
                                changeCreateIsSubmitting = false
                            }

                            LaunchedEffect(isSubmitting) {
                                changeCreateIsSubmitting = isSubmitting
                            }

                            ChangeEditorScreen(
                                title = "Nuevo cambio",
                                initialName = "",
                                initialDescription = "",
                                initialStatus = "Pendiente",
                                initialPriority = "Media",
                                initialCurrentEnvironment = "QA",
                                initialShowQaLinks = true,
                                initialShowStgLinks = false,
                                initialShowProdLinks = false,
                                initialAssignedTo = activeUserId,
                                assigneeSuggestions = assigneeSuggestions,
                                initialWorkfrontLink = "",
                                initialOnedriveLink = "",
                                submitLabel = "Crear cambio",
                                isSubmitting = isSubmitting,
                                errorMessage = submitError,
                                usePurpleHeroHeader = true,
                                onSubmit = {
                                    name,
                                    description,
                                    status,
                                    priority,
                                    currentEnvironment,
                                    showQaLinks,
                                    showStgLinks,
                                    showProdLinks,
                                    assignedTo,
                                    workfrontLink,
                                    onedriveLink,
                                ->
                                    scope.launch {
                                        isSubmitting = true
                                        submitError = null
                                        try {
                                            val created = ChangeRepository.createChange(
                                                projectId = projectId,
                                                name = name,
                                                description = description,
                                                status = status,
                                                priority = priority,
                                                assignedTo = assignedTo,
                                                workfrontLink = workfrontLink,
                                                onedriveLink = onedriveLink,
                                                currentEnvironment = currentEnvironment,
                                                showQaLinks = showQaLinks,
                                                showStgLinks = showStgLinks,
                                                showProdLinks = showProdLinks,
                                            )
                                            if (created == null) {
                                                submitError = "No se pudo crear el cambio"
                                            } else {
                                                navController.navigate("project_changes/$projectId") {
                                                    popUpTo("project_changes/$projectId") {
                                                        inclusive = true
                                                    }
                                                }
                                            }
                                        } catch (e: Exception) {
                                            submitError = e.message ?: "Error creando cambio"
                                        } finally {
                                            isSubmitting = false
                                        }
                                    }
                                },
                                onBack = { navController.popBackStack() },
                                showActionButtons = false,
                                submitTrigger = changeCreateSubmitTrigger,
                                onCanSubmitChange = { canSubmit ->
                                    changeCreateCanSubmit = canSubmit
                                },
                            )
                        }

                        composable(
                            route = "change_edit/{changeId}",
                            arguments = listOf(navArgument("changeId") {
                                type = NavType.StringType
                            }),
                        ) { backStackEntry ->
                            val changeId = backStackEntry.arguments?.getString("changeId")
                            if (changeId == null) {
                                ChangesErrorState(
                                    message = "ID de cambio invalido",
                                    onRetry = {},
                                )
                                return@composable
                            }

                            var change by remember(changeId) { mutableStateOf<Change?>(null) }
                            var isChangeLoading by remember(changeId) { mutableStateOf(true) }
                            var submitError by remember(changeId) { mutableStateOf<String?>(null) }
                            var isSubmitting by remember(changeId) { mutableStateOf(false) }
                            var reloadEdit by remember(changeId) { mutableIntStateOf(0) }
                            val scope = rememberCoroutineScope()

                            LaunchedEffect(changeId) {
                                changeEditSubmitTrigger = 0
                                changeEditCanSubmit = false
                                changeEditIsSubmitting = false
                            }

                            LaunchedEffect(isSubmitting) {
                                changeEditIsSubmitting = isSubmitting
                            }

                            LaunchedEffect(changeId, reloadEdit) {
                                isChangeLoading = true
                                submitError = null
                                try {
                                    change = ChangeRepository.fetchChangeById(changeId)
                                } catch (e: Exception) {
                                    submitError = e.message ?: "Error cargando cambio"
                                } finally {
                                    isChangeLoading = false
                                }
                            }

                            when {
                                isChangeLoading -> ChangesLoadingState()
                                submitError != null && change == null -> ChangesErrorState(
                                    message = submitError ?: "Error desconocido",
                                    onRetry = { reloadEdit++ },
                                )
                                else -> {
                                    val currentChange = change
                                    ChangeEditorScreen(
                                        title = "Editar cambio",
                                        initialName = currentChange?.name ?: "",
                                        initialDescription = currentChange?.description ?: "",
                                        initialStatus = currentChange?.status ?: "Pendiente",
                                        initialPriority = currentChange?.priority ?: "Media",
                                        initialCurrentEnvironment = currentChange?.currentEnvironment ?: "QA",
                                        initialShowQaLinks = currentChange?.showQaLinks ?: true,
                                        initialShowStgLinks = currentChange?.showStgLinks ?: false,
                                        initialShowProdLinks = currentChange?.showProdLinks ?: false,
                                        initialAssignedTo = currentChange?.assignedTo ?: "",
                                        assigneeSuggestions = assigneeSuggestions,
                                        initialWorkfrontLink = currentChange?.workfrontLink ?: "",
                                        initialOnedriveLink = currentChange?.onedriveLink ?: "",
                                        submitLabel = "Guardar cambios",
                                        isSubmitting = isSubmitting,
                                        errorMessage = submitError,
                                        usePurpleHeroHeader = true,
                                        onSubmit = {
                                            name,
                                            description,
                                            status,
                                            priority,
                                            currentEnvironment,
                                            showQaLinks,
                                            showStgLinks,
                                            showProdLinks,
                                            assignedTo,
                                            workfrontLink,
                                            onedriveLink,
                                        ->
                                            if (currentChange == null) return@ChangeEditorScreen
                                            scope.launch {
                                                isSubmitting = true
                                                submitError = null
                                                try {
                                                    val updated = ChangeRepository.updateChange(
                                                        changeId = currentChange.id,
                                                        name = name,
                                                        description = description,
                                                        status = status,
                                                        priority = priority,
                                                        assignedTo = assignedTo,
                                                        workfrontLink = workfrontLink,
                                                        onedriveLink = onedriveLink,
                                                        currentEnvironment = currentEnvironment,
                                                        showQaLinks = showQaLinks,
                                                        showStgLinks = showStgLinks,
                                                        showProdLinks = showProdLinks,
                                                        projectIdHint = currentChange.projectId,
                                                    )
                                                    if (updated == null) {
                                                        submitError = ChangeRepository.consumeLastUpdateDiagnostic()
                                                            ?: "No se pudo actualizar el cambio"
                                                    } else {
                                                        navController.navigate("project_changes/${updated.projectId}") {
                                                            popUpTo("project_changes/${updated.projectId}") {
                                                                inclusive = true
                                                            }
                                                        }
                                                    }
                                                } catch (e: Exception) {
                                                    submitError = e.message ?: "Error actualizando cambio"
                                                } finally {
                                                    isSubmitting = false
                                                }
                                            }
                                        },
                                        onBack = { navController.popBackStack() },
                                        showActionButtons = false,
                                        submitTrigger = changeEditSubmitTrigger,
                                        onCanSubmitChange = { canSubmit ->
                                            changeEditCanSubmit = canSubmit
                                        },
                                    )
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun ProjectSelectionForNewChangeDialog(
    isLoading: Boolean,
    errorMessage: String?,
    projects: List<Project>,
    onDismiss: () -> Unit,
    onProjectSelected: (Project) -> Unit,
) {
    var searchQuery by remember(projects) { mutableStateOf("") }
    var dropdownExpanded by remember { mutableStateOf(false) }
    val trimmedQuery = searchQuery.trim()
    val matchedProjects = remember(projects, trimmedQuery) {
        if (trimmedQuery.isBlank()) {
            projects
        } else {
            projects.filter { project ->
                project.name.contains(trimmedQuery, ignoreCase = true)
            }
        }
    }
    val maxVisibleProjects = 30
    val visibleProjects = matchedProjects.take(maxVisibleProjects)
    val hasMoreMatches = matchedProjects.size > visibleProjects.size
    val shouldShowDropdown = dropdownExpanded && visibleProjects.isNotEmpty()

    AlertDialog(
        onDismissRequest = onDismiss,
        title = {
            Text("Seleccionar proyecto")
        },
        text = {
            when {
                isLoading -> {
                    Text("Cargando proyectos...")
                }

                errorMessage != null -> {
                    Text("No se pudieron cargar proyectos: $errorMessage")
                }

                projects.isEmpty() -> {
                    Text("No hay proyectos disponibles para crear un cambio.")
                }

                else -> {
                    Column(
                        modifier = Modifier
                            .fillMaxWidth()
                            .heightIn(max = 360.dp),
                        verticalArrangement = Arrangement.spacedBy(8.dp),
                    ) {
                        ExposedDropdownMenuBox(
                            expanded = shouldShowDropdown,
                            onExpandedChange = { shouldExpand ->
                                dropdownExpanded = shouldExpand && matchedProjects.isNotEmpty()
                            },
                            modifier = Modifier.fillMaxWidth(),
                        ) {
                            OutlinedTextField(
                                value = searchQuery,
                                onValueChange = { value ->
                                    searchQuery = value
                                    dropdownExpanded = true
                                },
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .menuAnchor(
                                        type = MenuAnchorType.PrimaryEditable,
                                        enabled = matchedProjects.isNotEmpty(),
                                    ),
                                label = { Text("Proyecto") },
                                placeholder = { Text("Buscar y seleccionar") },
                                trailingIcon = {
                                    ExposedDropdownMenuDefaults.TrailingIcon(expanded = shouldShowDropdown)
                                },
                                singleLine = true,
                            )

                            ExposedDropdownMenu(
                                expanded = shouldShowDropdown,
                                onDismissRequest = { dropdownExpanded = false },
                                modifier = Modifier.heightIn(max = 280.dp),
                            ) {
                                visibleProjects.forEach { project ->
                                    DropdownMenuItem(
                                        text = { Text(project.name) },
                                        onClick = {
                                            searchQuery = project.name
                                            dropdownExpanded = false
                                            onProjectSelected(project)
                                        },
                                    )
                                }

                                if (hasMoreMatches) {
                                    DropdownMenuItem(
                                        text = {
                                            Text(
                                                "Mostrando ${visibleProjects.size} de ${matchedProjects.size}. Refina la busqueda.",
                                            )
                                        },
                                        onClick = {},
                                        enabled = false,
                                    )
                                }
                            }
                        }

                        if (matchedProjects.isEmpty()) {
                            Text("No hay coincidencias para \"$trimmedQuery\".")
                        } else {
                            if (trimmedQuery.isBlank()) {
                                Text("Escribe para filtrar o abre el selector.")
                            } else {
                                Text("Coincidencias: ${matchedProjects.size}")
                            }
                        }
                    }
                }
            }
        },
        confirmButton = {},
        dismissButton = {
            TextButton(onClick = onDismiss) {
                Text(
                    if (isLoading || errorMessage != null || projects.isEmpty()) "Cerrar" else "Cancelar",
                )
            }
        },
    )
}

private data class ScreenHeaderInfo(
    val title: String,
    val breadcrumb: String,
)

private fun projectDescriptionForEditor(rawDescription: String): String {
    val normalized = rawDescription.trim()
    return if (normalized == "(sin descripcion)") "" else rawDescription
}

private fun mapProjectNotesActionError(
    throwable: Throwable,
    actionLabel: String,
): String {
    val rawMessage = throwable.message.orEmpty()
    val normalized = rawMessage.lowercase()
    val rlsBlocked = normalized.contains("row-level security") &&
        normalized.contains("project_notes")
    val noteAssigneesRlsBlocked = normalized.contains("row-level security") &&
        normalized.contains("project_note_assignees")
    val missingSchemaColumns = normalized.contains("change_id") &&
        normalized.contains("project_notes") &&
        (normalized.contains("does not exist") || normalized.contains("column"))
    val missingNoteAssigneesTable = normalized.contains("project_note_assignees") &&
        (normalized.contains("does not exist") || normalized.contains("no existe"))
    val statusPermissionBlocked = normalized.contains("estado de la nota") &&
        normalized.contains("creador") &&
        normalized.contains("asignado")
    return when {
        statusPermissionBlocked ->
            "No tienes permiso para cambiar el estado de esta nota. " +
                "Solo puede hacerlo el creador, el asignado de la nota o un asignado del cambio."
        missingSchemaColumns ->
            "La tabla project_notes aun no tiene el schema esperado (change_id/created_by/assigned_to). " +
                "Aplica la migracion de regla de negocio y reintenta."
        missingNoteAssigneesTable ->
            "No se pudo $actionLabel la nota con multi-asignacion porque falta la tabla " +
                "project_note_assignees en la BD activa. Ejecuta la migracion SQL y reintenta."
        noteAssigneesRlsBlocked ->
            "No se pudo $actionLabel la nota con multi-asignacion por permisos RLS en " +
                "project_note_assignees. Activa policies SELECT/INSERT/DELETE para authenticated."
        rlsBlocked ->
        "No se pudo $actionLabel la nota TO-DO por permisos RLS en project_notes. " +
            "Activa policies INSERT/UPDATE/DELETE para authenticated."
        else ->
            rawMessage.ifBlank { "Error al $actionLabel nota TO-DO" }
    }
}

private fun isNoteMentioningUser(
    note: ProjectTodoNote,
    userId: String,
): Boolean {
    val normalizedUserId = userId.trim()
    if (normalizedUserId.isBlank()) return false

    val mentionedInAssigneeList = note.assigneeIds.any { assigneeId ->
        assigneeId.trim().equals(normalizedUserId, ignoreCase = true)
    }
    if (mentionedInAssigneeList) return true

    return note.assignedTo
        ?.trim()
        ?.equals(normalizedUserId, ignoreCase = true)
        ?: false
}

private fun isTodoNoteCompletedStatus(status: String): Boolean {
    val normalized = status
        .trim()
        .lowercase()
        .replace("\\s+".toRegex(), " ")
    return normalized in setOf(
        "completado",
        "completada",
        "completed",
        "done",
        "cerrado",
        "cerrada",
    )
}

private fun screenHeaderForRoute(route: String?): ScreenHeaderInfo {
    return when {
        route == "home" ->
            ScreenHeaderInfo(
                title = "Inicio",
                breadcrumb = "Inicio / Dashboard",
            )

        route == "projects" ->
            ScreenHeaderInfo(
                title = "Proyectos",
                breadcrumb = "Inicio / Proyectos",
            )

        route == "project_create" ->
            ScreenHeaderInfo(
                title = "Nuevo proyecto",
                breadcrumb = "Inicio / Proyectos / Nuevo",
            )

        route == "project_edit/{projectId}" || route?.startsWith("project_edit/") == true ->
            ScreenHeaderInfo(
                title = "Editar proyecto",
                breadcrumb = "Inicio / Proyectos / Detalle / Editar",
            )

        route == "profile" ->
            ScreenHeaderInfo(
                title = "Perfil",
                breadcrumb = "Inicio / Perfil",
            )

        route == "project_detail/{projectId}" || route?.startsWith("project_detail/") == true ->
            ScreenHeaderInfo(
                title = "Detalle de proyecto",
                breadcrumb = "Inicio / Proyectos / Detalle",
            )

        route == "project_changes/{projectId}" || route?.startsWith("project_changes/") == true ->
            ScreenHeaderInfo(
                title = "Cambios del proyecto",
                breadcrumb = "Inicio / Proyectos / Detalle / Cambios",
            )

        route == "change_detail/{changeId}" || route?.startsWith("change_detail/") == true ->
            ScreenHeaderInfo(
                title = "Detalle de cambio",
                breadcrumb = "Inicio / Proyectos / Detalle / Cambios / Detalle",
            )

        route == "change_create/{projectId}" || route?.startsWith("change_create/") == true ->
            ScreenHeaderInfo(
                title = "Nuevo cambio",
                breadcrumb = "Inicio / Proyectos / Detalle / Cambios / Nuevo",
            )

        route == "change_edit/{changeId}" || route?.startsWith("change_edit/") == true ->
            ScreenHeaderInfo(
                title = "Editar cambio",
                breadcrumb = "Inicio / Proyectos / Detalle / Cambios / Editar",
            )

        else ->
            ScreenHeaderInfo(
                title = "ProjectTrack",
                breadcrumb = "Inicio",
            )
    }
}
