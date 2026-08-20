/* =========================================================
   APPLICATION STATE
========================================================= */

const state = {
    tasks: [],
    currentPage: "tasks"
};


/* =========================================================
   DOM ELEMENTS
========================================================= */

const mainContent =
    document.getElementById("main-content");

const modalOverlay =
    document.getElementById("modal-overlay");

const modalContent =
    document.getElementById("modal-content");

const modalClose =
    document.getElementById("modal-close");

const toastContainer =
    document.getElementById("toast-container");


/* =========================================================
   INITIALIZE APPLICATION
========================================================= */

document.addEventListener("DOMContentLoaded", () => {

    setupNavigation();

    setupModal();

    setupMobileMenu();

    loadTasks();

});


/* =========================================================
   NAVIGATION
========================================================= */

function setupNavigation() {

    const navItems =
        document.querySelectorAll(".nav-item");

    navItems.forEach(item => {

        item.addEventListener("click", () => {

            const page =
                item.dataset.page;

            navigateTo(page);

        });

    });

}


function navigateTo(page) {

    state.currentPage = page;

    updateActiveNavigation(page);

    if (page === "overview") {

        renderOverview();

    } else {

        renderTasksPage();

    }

}


function updateActiveNavigation(page) {

    document
        .querySelectorAll(".nav-item")
        .forEach(item => {

            item.classList.toggle(
                "active",
                item.dataset.page === page
            );

        });

}


/* =========================================================
   LOAD TASKS
========================================================= */

async function loadTasks() {

    showLoading();

    try {

        const response =
            await fetch("/api/tasks");

        if (!response.ok) {

            throw new Error(
                "Unable to load tasks"
            );

        }

        let data =
            await response.json();


        /*
         * Defensive handling:
         * If backend accidentally returns a
         * JSON string instead of an object,
         * convert it here.
         */

        if (typeof data === "string") {

            try {

                data = JSON.parse(data);

            } catch {

                throw new Error(
                    "Invalid API response"
                );

            }

        }


        state.tasks =
            Array.isArray(data)
                ? data
                : [];


        if (state.currentPage === "overview") {

            renderOverview();

        } else {

            renderTasksPage();

        }

    } catch (error) {

        console.error(error);

        showError(
            "Unable to load tasks. Please check the server."
        );

    }

}


/* =========================================================
   TASKS PAGE
========================================================= */

function renderTasksPage() {

    const recentTasks =
        getSortedTasks()
            .slice(0, 3);


    mainContent.innerHTML = `

        <div class="page-header">

            <div>

                <div class="breadcrumb">
                    Workspace / Tasks
                </div>

                <h1>
                    Tasks
                </h1>

                <p>
                    Keep track of everything you're working on.
                </p>

            </div>

            <button
                class="secondary-button"
                id="refresh-button"
            >
                ↻
                Refresh
            </button>

        </div>


        <!-- CREATE TASK -->

        <section class="create-card">

            <div class="create-card-header">

                <h2>
                    Create a task
                </h2>

                <p>
                    Add something you want to get done.
                </p>

            </div>


            <form
                class="create-form"
                id="create-task-form"
            >

                <div class="form-row">

                    <div class="form-group">

                        <label class="form-label">
                            Title
                        </label>

                        <input
                            class="form-input"
                            id="task-title"
                            type="text"
                            placeholder="e.g. Complete Flask API"
                            maxlength="120"
                            required
                        >

                    </div>


                    <div class="form-group">

                        <label class="form-label">
                            Status
                        </label>

                        <select
                            class="form-select"
                            id="task-status"
                        >

                            <option value="Pending">
                                Pending
                            </option>

                            <option value="In Progress">
                                In Progress
                            </option>

                            <option value="Completed">
                                Completed
                            </option>

                        </select>

                    </div>

                </div>


                <div class="form-group full-width">

                    <label class="form-label">
                        Description
                    </label>

                    <textarea
                        class="form-textarea"
                        id="task-description"
                        placeholder="Add a short description..."
                        maxlength="500"
                        required
                    ></textarea>

                </div>


                <div class="create-form-footer">

                    <span class="form-hint">
                        Keep your tasks clear and actionable.
                    </span>

                    <button
                        class="primary-button"
                        type="submit"
                    >
                        +
                        Create task
                    </button>

                </div>

            </form>

        </section>


        <!-- RECENT TASKS -->

        <section>

            <div class="section-header">

                <div class="section-title">

                    <h2>
                        Your tasks
                    </h2>

                    <p>
                        Your most recent work.
                    </p>

                </div>


                <div class="task-count">
                    ${state.tasks.length}
                    ${state.tasks.length === 1 ? "task" : "tasks"}
                </div>

            </div>


            <div
                class="task-list"
                id="recent-task-list"
            >

                ${
                    recentTasks.length === 0
                        ? renderEmptyState()
                        : recentTasks
                            .map(renderTaskCard)
                            .join("")
                }

            </div>


            ${
                state.tasks.length > 3
                    ? `
                        <div class="view-all-wrapper">

                            <button
                                class="text-button"
                                id="view-all-button"
                            >
                                View all tasks →
                            </button>

                        </div>
                    `
                    : ""
            }

        </section>

    `;


    document
        .getElementById("create-task-form")
        .addEventListener(
            "submit",
            handleCreateTask
        );


    document
        .getElementById("refresh-button")
        .addEventListener(
            "click",
            loadTasks
        );


    const viewAllButton =
        document.getElementById(
            "view-all-button"
        );

    if (viewAllButton) {

        viewAllButton.addEventListener(
            "click",
            renderAllTasksPage
        );

    }


    setupTaskActions();

}


/* =========================================================
   ALL TASKS PAGE
========================================================= */

function renderAllTasksPage() {

    state.currentPage = "all-tasks";

    mainContent.innerHTML = `

        <div class="page-header">

            <div>

                <div class="breadcrumb">
                    Workspace / Tasks / All Tasks
                </div>

                <h1>
                    All Tasks
                </h1>

                <p>
                    Search, filter and organize your tasks.
                </p>

            </div>

        </div>


        <section class="filter-card">

            <div class="filter-grid">

                <input
                    class="filter-input"
                    id="search-filter"
                    type="search"
                    placeholder="Search by title or description..."
                >


                <select
                    class="filter-select"
                    id="status-filter"
                >

                    <option value="all">
                        All statuses
                    </option>

                    <option value="Pending">
                        Pending
                    </option>

                    <option value="In Progress">
                        In Progress
                    </option>

                    <option value="Completed">
                        Completed
                    </option>

                </select>


                <select
                    class="filter-select"
                    id="date-filter"
                >

                    <option value="all">
                        All dates
                    </option>

                    <option value="today">
                        Today
                    </option>

                    <option value="7">
                        Last 7 days
                    </option>

                    <option value="30">
                        Last 30 days
                    </option>

                </select>


                <select
                    class="filter-select"
                    id="sort-filter"
                >

                    <option value="newest">
                        Newest first
                    </option>

                    <option value="oldest">
                        Oldest first
                    </option>

                    <option value="title-asc">
                        Title A-Z
                    </option>

                    <option value="title-desc">
                        Title Z-A
                    </option>

                </select>

            </div>

        </section>


        <section>

            <div class="results-header">

                <div class="section-title">

                    <h2>
                        Tasks
                    </h2>

                </div>

                <div
                    class="results-count"
                    id="results-count"
                ></div>

            </div>


            <div
                class="task-list"
                id="all-task-list"
            ></div>

        </section>

    `;


    setupFilters();

    renderFilteredTasks();

}


/* =========================================================
   FILTERS
========================================================= */

function setupFilters() {

    const filters = [
        "search-filter",
        "status-filter",
        "date-filter",
        "sort-filter"
    ];


    filters.forEach(id => {

        document
            .getElementById(id)
            .addEventListener(
                "input",
                renderFilteredTasks
            );

        document
            .getElementById(id)
            .addEventListener(
                "change",
                renderFilteredTasks
            );

    });

}


function renderFilteredTasks() {

    const search =
        document
            .getElementById("search-filter")
            .value
            .trim()
            .toLowerCase();


    const status =
        document
            .getElementById("status-filter")
            .value;


    const dateFilter =
        document
            .getElementById("date-filter")
            .value;


    const sort =
        document
            .getElementById("sort-filter")
            .value;


    let filtered =
        [...state.tasks];


    /* SEARCH */

    if (search) {

        filtered =
            filtered.filter(task => {

                const title =
                    (task.title || "")
                        .toLowerCase();

                const description =
                    (task.description || "")
                        .toLowerCase();

                return (
                    title.includes(search) ||
                    description.includes(search)
                );

            });

    }


    /* STATUS */

    if (status !== "all") {

        filtered =
            filtered.filter(task =>
                normalizeStatus(task.status)
                === normalizeStatus(status)
            );

    }


    /* DATE */

    if (dateFilter !== "all") {

        const now =
            new Date();

        const today =
            new Date(
                now.getFullYear(),
                now.getMonth(),
                now.getDate()
            );


        filtered =
            filtered.filter(task => {

                const taskDate =
                    new Date(task.created_at);


                if (Number.isNaN(taskDate.getTime())) {
                    return false;
                }


                if (dateFilter === "today") {

                    return (
                        taskDate >= today
                    );

                }


                const days =
                    Number(dateFilter);

                const cutoff =
                    new Date(today);

                cutoff.setDate(
                    cutoff.getDate() - days
                );

                return (
                    taskDate >= cutoff
                );

            });

    }


    /* SORT */

    filtered.sort((a, b) => {

        if (sort === "title-asc") {

            return (
                (a.title || "")
                    .localeCompare(
                        b.title || ""
                    )
            );

        }


        if (sort === "title-desc") {

            return (
                (b.title || "")
                    .localeCompare(
                        a.title || ""
                    )
            );

        }


        const dateA =
            new Date(a.created_at).getTime();

        const dateB =
            new Date(b.created_at).getTime();


        if (sort === "oldest") {

            return dateA - dateB;

        }


        return dateB - dateA;

    });


    const list =
        document.getElementById(
            "all-task-list"
        );


    const count =
        document.getElementById(
            "results-count"
        );


    count.textContent =
        `${filtered.length} ${
            filtered.length === 1
                ? "task"
                : "tasks"
        }`;


    if (filtered.length === 0) {

        list.innerHTML =
            renderEmptyState(
                "No matching tasks",
                "Try changing your search or filters."
            );

        return;

    }


    list.innerHTML =
        filtered
            .map(renderTaskCard)
            .join("");


    setupTaskActions();

}


/* =========================================================
   OVERVIEW
========================================================= */

function renderOverview() {

    const total =
        state.tasks.length;


    const completed =
        state.tasks.filter(
            task =>
                normalizeStatus(task.status)
                === "completed"
        ).length;


    const pending =
        state.tasks.filter(
            task =>
                normalizeStatus(task.status)
                !== "completed"
        ).length;


    const percentage =
        total === 0
            ? 0
            : Math.round(
                (completed / total) * 100
            );


    const recent =
        getSortedTasks()
            .slice(0, 5);


    mainContent.innerHTML = `

        <div class="page-header">

            <div>

                <div class="breadcrumb">
                    Workspace / Overview
                </div>

                <h1>
                    Overview
                </h1>

                <p>
                    A quick look at your task progress.
                </p>

            </div>

        </div>


        <section class="overview-grid">

            <div class="stat-card">

                <div class="stat-label">
                    Total Tasks
                </div>

                <div class="stat-value">
                    ${total}
                </div>

                <div class="stat-description">
                    Everything in your workspace
                </div>

            </div>


            <div class="stat-card">

                <div class="stat-label">
                    Pending
                </div>

                <div class="stat-value">
                    ${pending}
                </div>

                <div class="stat-description">
                    Tasks still in progress
                </div>

            </div>


            <div class="stat-card">

                <div class="stat-label">
                    Completed
                </div>

                <div class="stat-value">
                    ${completed}
                </div>

                <div class="stat-description">
                    Finished tasks
                </div>

            </div>

        </section>


        <section class="overview-card">

            <div class="overview-card-header">

                <div>

                    <h2>
                        Task completion
                    </h2>

                    <p>
                        Your overall completion progress.
                    </p>

                </div>

                <div class="completion-percentage">
                    ${percentage}%
                </div>

            </div>


            <div class="progress-track">

                <div
                    class="progress-bar"
                    style="width: ${percentage}%"
                ></div>

            </div>

        </section>


        <section class="overview-card">

            <div class="overview-card-header">

                <div>

                    <h2>
                        Recent activity
                    </h2>

                    <p>
                        Your latest tasks.
                    </p>

                </div>

            </div>


            <div class="activity-list">

                ${
                    recent.length === 0

                        ? `
                            <div class="empty-state">
                                <div class="empty-icon">
                                    ✓
                                </div>

                                <h3>
                                    No activity yet
                                </h3>

                                <p>
                                    Create your first task to get started.
                                </p>
                            </div>
                        `

                        : recent
                            .map(task => `

                                <div class="activity-item">

                                    <div class="activity-icon">
                                        ${
                                            normalizeStatus(
                                                task.status
                                            ) === "completed"
                                                ? "✓"
                                                : "○"
                                        }
                                    </div>

                                    <div>

                                        <div class="activity-title">
                                            ${escapeHtml(task.title)}
                                        </div>

                                        <div class="activity-meta">
                                            ${escapeHtml(task.status)}
                                            ·
                                            ${formatDate(task.created_at)}
                                        </div>

                                    </div>

                                </div>

                            `)
                            .join("")
                }

            </div>

        </section>

    `;

}


/* =========================================================
   TASK CARD
========================================================= */

function renderTaskCard(task) {

    const status =
        normalizeStatus(task.status);


    const statusClass =
        status === "completed"
            ? "status-completed"
            : "status-pending";


    return `

        <article
            class="task-card"
            data-task-id="${task.id}"
        >

            <div class="task-top">

                <div>

                    <div class="task-title">
                        ${escapeHtml(task.title)}
                    </div>

                    ${
                        task.description
                            ? `
                                <div class="task-description">
                                    ${escapeHtml(
                                        task.description
                                    )}
                                </div>
                            `
                            : ""
                    }

                </div>


                <span
                    class="status-badge ${statusClass}"
                >
                    ${escapeHtml(task.status)}
                </span>

            </div>


            <div class="task-bottom">

                <div class="task-date">
                    Created ${formatDate(task.created_at)}
                </div>


                <div class="task-actions">

                    <button
                        class="icon-button edit-task"
                        data-id="${task.id}"
                        title="Edit task"
                        aria-label="Edit task"
                    >
                        ✎
                    </button>


                    <button
                        class="icon-button delete delete-task"
                        data-id="${task.id}"
                        title="Delete task"
                        aria-label="Delete task"
                    >
                        ♜
                    </button>

                </div>

            </div>

        </article>

    `;

}


/* =========================================================
   TASK ACTIONS
========================================================= */

function setupTaskActions() {

    document
        .querySelectorAll(".edit-task")
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    const id =
                        Number(button.dataset.id);

                    openEditModal(id);

                }
            );

        });


    document
        .querySelectorAll(".delete-task")
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    const id =
                        Number(button.dataset.id);

                    openDeleteModal(id);

                }
            );

        });

}


/* =========================================================
   CREATE TASK
========================================================= */

async function handleCreateTask(event) {

    event.preventDefault();


    const title =
        document
            .getElementById("task-title")
            .value
            .trim();


    const description =
        document
            .getElementById("task-description")
            .value
            .trim();


    const status =
        document
            .getElementById("task-status")
            .value;


    if (!title) {

        showToast(
            "Please enter a task title.",
            "error"
        );

        return;

    }


    if (!description) {

        showToast(
            "Please enter a task description.",
            "error"
        );

        return;

    }


    const button =
        event.target.querySelector(
            "button[type='submit']"
        );


    button.disabled = true;

    button.textContent =
        "Creating...";


    try {

        const response =
            await fetch(
                "/api/tasks",
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({
                        title,
                        description,
                        status
                    })
                }
            );


        if (!response.ok) {

            throw new Error(
                "Unable to create task"
            );

        }


        showToast(
            "Task created successfully.",
            "success"
        );


        await loadTasks();


    } catch (error) {

        console.error(error);

        showToast(
            "Could not create the task.",
            "error"
        );


    } finally {

        button.disabled = false;

        button.textContent =
            "+ Create task";

    }

}


/* =========================================================
   EDIT MODAL
========================================================= */

function openEditModal(taskId) {

    const task =
        state.tasks.find(
            task =>
                Number(task.id) === taskId
        );


    if (!task) {

        showToast(
            "Task not found.",
            "error"
        );

        return;

    }


    modalContent.innerHTML = `

        <h2 class="modal-title">
            Edit task
        </h2>

        <p class="modal-description">
            Update the information you want to change.
        </p>


        <form
            class="modal-form"
            id="edit-task-form"
        >

            <div class="form-group">

                <label class="form-label">
                    Title
                </label>

                <input
                    class="form-input"
                    id="edit-title"
                    type="text"
                    maxlength="120"
                    value="${escapeAttribute(
                        task.title
                    )}"
                    required
                >

            </div>


            <div class="form-group">

                <label class="form-label">
                    Description
                </label>

                <textarea
                    class="form-textarea"
                    id="edit-description"
                    maxlength="500"
                    required
                >${escapeHtml(
                    task.description || ""
                )}</textarea>

            </div>


            <div class="form-group">

                <label class="form-label">
                    Status
                </label>

                <select
                    class="form-select"
                    id="edit-status"
                >

                    <option
                        value="Pending"
                        ${
                            normalizeStatus(
                                task.status
                            ) === "pending"
                                ? "selected"
                                : ""
                        }
                    >
                        Pending
                    </option>

                    <option
                        value="In Progress"
                        ${
                            normalizeStatus(
                                task.status
                            ) === "in progress"
                                ? "selected"
                                : ""
                        }
                    >
                        In Progress
                    </option>

                    <option
                        value="Completed"
                        ${
                            normalizeStatus(
                                task.status
                            ) === "completed"
                                ? "selected"
                                : ""
                        }
                    >
                        Completed
                    </option>

                </select>

            </div>


            <div class="modal-actions">

                <button
                    type="button"
                    class="secondary-button"
                    id="cancel-edit"
                >
                    Cancel
                </button>

                <button
                    type="submit"
                    class="primary-button"
                >
                    Save changes
                </button>

            </div>

        </form>

    `;


    openModal();


    document
        .getElementById("cancel-edit")
        .addEventListener(
            "click",
            closeModal
        );


    document
        .getElementById("edit-task-form")
        .addEventListener(
            "submit",
            event =>
                handleEditTask(
                    event,
                    taskId
                )
        );

}


/* =========================================================
   PATCH TASK
========================================================= */

async function handleEditTask(
    event,
    taskId
) {

    event.preventDefault();


    const title =
        document
            .getElementById("edit-title")
            .value
            .trim();


    const description =
        document
            .getElementById("edit-description")
            .value
            .trim();


    const status =
        document
            .getElementById("edit-status")
            .value;


    if (!title) {

        showToast(
            "Title cannot be empty.",
            "error"
        );

        return;

    }


    if (!description) {

        showToast(
            "Description cannot be empty.",
            "error"
        );

        return;

    }


    try {

        const response =
            await fetch(
                `/api/tasks/${taskId}`,
                {
                    method: "PATCH",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({
                        title,
                        description,
                        status
                    })
                }
            );


        if (!response.ok) {

            throw new Error(
                "Unable to update task"
            );

        }


        closeModal();


        showToast(
            "Task updated successfully.",
            "success"
        );


        await loadTasks();


    } catch (error) {

        console.error(error);

        showToast(
            "Could not update the task.",
            "error"
        );

    }

}


/* =========================================================
   DELETE MODAL
========================================================= */

function openDeleteModal(taskId) {

    const task =
        state.tasks.find(
            task =>
                Number(task.id) === taskId
        );


    if (!task) {

        return;

    }


    modalContent.innerHTML = `

        <div class="confirm-icon">
            !
        </div>

        <h2 class="modal-title">
            Delete this task?
        </h2>

        <p class="modal-description">

            You're about to permanently delete
            <strong>
                ${escapeHtml(task.title)}
            </strong>.

            This action cannot be undone.

        </p>


        <div class="modal-actions">

            <button
                type="button"
                class="secondary-button"
                id="cancel-delete"
            >
                Cancel
            </button>


            <button
                type="button"
                class="danger-button"
                id="confirm-delete"
            >
                Delete task
            </button>

        </div>

    `;


    openModal();


    document
        .getElementById("cancel-delete")
        .addEventListener(
            "click",
            closeModal
        );


    document
        .getElementById("confirm-delete")
        .addEventListener(
            "click",
            () =>
                deleteTask(taskId)
        );

}


/* =========================================================
   DELETE TASK
========================================================= */

async function deleteTask(taskId) {

    const button =
        document.getElementById(
            "confirm-delete"
        );


    if (button) {

        button.disabled = true;

        button.textContent =
            "Deleting...";

    }


    try {

        const response =
            await fetch(
                `/api/tasks/${taskId}`,
                {
                    method: "DELETE"
                }
            );


        if (!response.ok) {

            throw new Error(
                "Unable to delete task"
            );

        }


        closeModal();


        showToast(
            "Task deleted successfully.",
            "success"
        );


        await loadTasks();


    } catch (error) {

        console.error(error);

        showToast(
            "Could not delete the task.",
            "error"
        );


        if (button) {

            button.disabled = false;

            button.textContent =
                "Delete task";

        }

    }

}


/* =========================================================
   MODAL MANAGEMENT
========================================================= */

function setupModal() {

    modalClose.addEventListener(
        "click",
        closeModal
    );


    modalOverlay.addEventListener(
        "click",
        event => {

            if (
                event.target === modalOverlay
            ) {

                closeModal();

            }

        }
    );


    document.addEventListener(
        "keydown",
        event => {

            if (
                event.key === "Escape"
            ) {

                closeModal();

            }

        }
    );

}


function openModal() {

    modalOverlay.classList.remove(
        "hidden"
    );

    document.body.style.overflow =
        "hidden";

}


function closeModal() {

    modalOverlay.classList.add(
        "hidden"
    );

    modalContent.innerHTML = "";

    document.body.style.overflow =
        "";

}


/* =========================================================
   MOBILE MENU
========================================================= */

function setupMobileMenu() {

    const button =
        document.getElementById(
            "mobile-menu-button"
        );


    button.addEventListener(
        "click",
        () => {

            document
                .querySelector(".sidebar")
                .classList.toggle(
                    "mobile-open"
                );

        }
    );

}


/* =========================================================
   LOADING
========================================================= */

function showLoading() {

    mainContent.innerHTML = `

        <div class="loading-state">
            Loading your workspace...
        </div>

    `;

}


/* =========================================================
   ERROR
========================================================= */

function showError(message) {

    mainContent.innerHTML = `

        <div class="empty-state">

            <div class="empty-icon">
                !
            </div>

            <h3>
                Something went wrong
            </h3>

            <p>
                ${escapeHtml(message)}
            </p>

        </div>

    `;

}


/* =========================================================
   EMPTY STATE
========================================================= */

function renderEmptyState(
    title = "No tasks yet",
    message = "Create a task to get started."
) {

    return `

        <div class="empty-state">

            <div class="empty-icon">
                ✓
            </div>

            <h3>
                ${escapeHtml(title)}
            </h3>

            <p>
                ${escapeHtml(message)}
            </p>

        </div>

    `;

}


/* =========================================================
   UTILITIES
========================================================= */

function getSortedTasks() {

    return [...state.tasks].sort(
        (a, b) => {

            const dateA =
                new Date(
                    a.created_at
                ).getTime();


            const dateB =
                new Date(
                    b.created_at
                ).getTime();


            return dateB - dateA;

        }
    );

}


function normalizeStatus(status) {

    return String(status || "")
        .trim()
        .toLowerCase();

}


function formatDate(dateString) {

    if (!dateString) {

        return "Unknown date";

    }


    const date =
        new Date(dateString);


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return "Unknown date";

    }


    return date.toLocaleDateString(
        "en-GB",
        {
            day: "2-digit",
            month: "2-digit",
            year: "numeric"
        }
    );

}


function escapeHtml(value) {

    const div =
        document.createElement("div");

    div.textContent =
        value ?? "";

    return div.innerHTML;

}


function escapeAttribute(value) {

    return escapeHtml(value)
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

}


/* =========================================================
   TOAST
========================================================= */

function showToast(
    message,
    type = "default"
) {

    const toast =
        document.createElement("div");


    toast.className =
        `toast ${type}`;


    toast.textContent =
        message;


    toastContainer.appendChild(
        toast
    );


    setTimeout(
        () => {

            toast.remove();

        },
        3000
    );

}