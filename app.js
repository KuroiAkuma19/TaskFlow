const USERS = {
  'demo@taskflow.app': {
    name: 'Avery',
    password: 'task1234',
  },
};

const STORAGE_KEYS = {
  accounts: 'taskflow-accounts',
  session: 'taskflow-session',
  tasksPrefix: 'taskflow-tasks:',
};

const state = {
  user: null,
  tasks: [],
  filter: 'all',
  search: '',
  editingId: null,
  authMode: 'login',
};

const elements = {
  authScreen: document.getElementById('authScreen'),
  workspace: document.getElementById('workspace'),
  loginForm: document.getElementById('loginForm'),
  fillDemo: document.getElementById('fillDemo'),
  toggleAuthMode: document.getElementById('toggleAuthMode'),
  authKicker: document.getElementById('authKicker'),
  authTitle: document.getElementById('authTitle'),
  submitAuthButton: document.getElementById('submitAuthButton'),
  authSwitchLabel: document.getElementById('authSwitchLabel'),
  nameField: document.getElementById('nameField'),
  name: document.getElementById('name'),
  email: document.getElementById('email'),
  password: document.getElementById('password'),
  confirmPasswordField: document.getElementById('confirmPasswordField'),
  confirmPassword: document.getElementById('confirmPassword'),
  rememberMe: document.getElementById('rememberMe'),
  userName: document.getElementById('userName'),
  logoutButton: document.getElementById('logoutButton'),
  taskForm: document.getElementById('taskForm'),
  taskId: document.getElementById('taskId'),
  taskTitle: document.getElementById('taskTitle'),
  taskDescription: document.getElementById('taskDescription'),
  taskStatus: document.getElementById('taskStatus'),
  taskPriority: document.getElementById('taskPriority'),
  taskDueDate: document.getElementById('taskDueDate'),
  submitTaskButton: document.getElementById('submitTaskButton'),
  resetFormButton: document.getElementById('resetFormButton'),
  searchInput: document.getElementById('searchInput'),
  taskList: document.getElementById('taskList'),
  emptyState: document.getElementById('emptyState'),
  totalCount: document.getElementById('totalCount'),
  completedCount: document.getElementById('completedCount'),
  progressCount: document.getElementById('progressCount'),
  dueSoonCount: document.getElementById('dueSoonCount'),
  formKicker: document.getElementById('formKicker'),
  formTitle: document.getElementById('formTitle'),
};

function getTasksKey(email) {
  return `${STORAGE_KEYS.tasksPrefix}${email}`;
}

function saveSession(user) {
  localStorage.setItem(STORAGE_KEYS.session, JSON.stringify(user));
}

function clearSession() {
  localStorage.removeItem(STORAGE_KEYS.session);
}

function getStoredSession() {
  const raw = localStorage.getItem(STORAGE_KEYS.session);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function getStoredAccounts() {
  const raw = localStorage.getItem(STORAGE_KEYS.accounts);
  if (!raw) {
    return {};
  }

  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

function saveAccounts(accounts) {
  localStorage.setItem(STORAGE_KEYS.accounts, JSON.stringify(accounts));
}

function getAccount(email) {
  const normalizedEmail = email.trim().toLowerCase();
  if (USERS[normalizedEmail]) {
    return {
      email: normalizedEmail,
      name: USERS[normalizedEmail].name,
      password: USERS[normalizedEmail].password,
    };
  }

  const accounts = getStoredAccounts();
  return accounts[normalizedEmail] || null;
}

function createAccount({ name, email, password }) {
  const normalizedEmail = email.trim().toLowerCase();
  const accounts = getStoredAccounts();

  if (USERS[normalizedEmail] || accounts[normalizedEmail]) {
    return { ok: false, message: 'An account with that email already exists.' };
  }

  accounts[normalizedEmail] = {
    name: name.trim(),
    email: normalizedEmail,
    password,
  };

  saveAccounts(accounts);
  return { ok: true, user: { email: normalizedEmail, name: name.trim(), password } };
}

function createSeedTasks() {
  return [
    {
      id: crypto.randomUUID(),
      title: 'Finish login flow',
      description: 'Connect the sign-in screen and persist the user session.',
      status: 'progress',
      priority: 'high',
      dueDate: tomorrow(),
      createdAt: Date.now() - 86_400_000,
    },
    {
      id: crypto.randomUUID(),
      title: 'Review mobile layout',
      description: 'Check the board on smaller screens and tighten spacing.',
      status: 'todo',
      priority: 'medium',
      dueDate: inThreeDays(),
      createdAt: Date.now() - 52_000_000,
    },
    {
      id: crypto.randomUUID(),
      title: 'Ship task card actions',
      description: 'Add edit, complete, and delete controls to each card.',
      status: 'done',
      priority: 'low',
      dueDate: today(),
      createdAt: Date.now() - 121_000_000,
    },
  ];
}

function loadTasks(email) {
  const raw = localStorage.getItem(getTasksKey(email));
  if (raw) {
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  }

  const seed = createSeedTasks();
  localStorage.setItem(getTasksKey(email), JSON.stringify(seed));
  return seed;
}

function saveTasks() {
  if (!state.user) {
    return;
  }

  localStorage.setItem(getTasksKey(state.user.email), JSON.stringify(state.tasks));
}

function tomorrow() {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  return formatDateInput(date);
}

function inThreeDays() {
  const date = new Date();
  date.setDate(date.getDate() + 3);
  return formatDateInput(date);
}

function today() {
  return formatDateInput(new Date());
}

function formatDateInput(date) {
  return new Intl.DateTimeFormat('en-CA').format(date);
}

function formatDateLabel(dateString) {
  if (!dateString) {
    return 'No due date';
  }

  const date = new Date(`${dateString}T00:00:00`);
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
}

function getDaysRemaining(dateString) {
  if (!dateString) {
    return null;
  }

  const current = new Date();
  current.setHours(0, 0, 0, 0);

  const due = new Date(`${dateString}T00:00:00`);
  const diff = due.getTime() - current.getTime();
  return Math.ceil(diff / 86_400_000);
}

function getTaskLabel(task) {
  const days = getDaysRemaining(task.dueDate);
  if (days === null) {
    return 'No due date';
  }

  if (days < 0) {
    return `${Math.abs(days)} day${Math.abs(days) === 1 ? '' : 's'} overdue`;
  }

  if (days === 0) {
    return 'Due today';
  }

  return `${days} day${days === 1 ? '' : 's'} left`;
}

function login(email, password, rememberMe) {
  const userRecord = getAccount(email);
  if (!userRecord || userRecord.password !== password) {
    alert('Invalid credentials. Use the demo account or create a new account.');
    return false;
  }

  state.user = {
    email: email.trim().toLowerCase(),
    name: userRecord.name,
  };

  state.tasks = loadTasks(state.user.email);
  if (rememberMe) {
    saveSession(state.user);
  }

  renderWorkspace();
  return true;
}

function register(name, email, password, confirmPassword, rememberMe) {
  const trimmedName = name.trim();
  const trimmedEmail = email.trim().toLowerCase();

  if (!trimmedName) {
    alert('Please enter your name.');
    return false;
  }

  if (password.length < 4) {
    alert('Use a password with at least 4 characters.');
    return false;
  }

  if (password !== confirmPassword) {
    alert('Passwords do not match.');
    return false;
  }

  const result = createAccount({ name: trimmedName, email: trimmedEmail, password });
  if (!result.ok) {
    alert(result.message);
    return false;
  }

  state.user = {
    email: trimmedEmail,
    name: trimmedName,
  };

  state.tasks = loadTasks(state.user.email);
  if (rememberMe) {
    saveSession(state.user);
  }

  renderWorkspace();
  return true;
}

function logout() {
  state.user = null;
  state.tasks = [];
  state.editingId = null;
  clearSession();
  elements.taskForm.reset();
  elements.taskId.value = '';
  showAuth();
}

function showAuth() {
  elements.authScreen.classList.remove('hidden');
  elements.workspace.classList.add('hidden');
  document.title = 'TaskFlow - Login';
}

function setAuthMode(mode) {
  state.authMode = mode;
  const isRegister = mode === 'register';

  elements.authKicker.textContent = isRegister ? 'Join TaskFlow' : 'Welcome back';
  elements.authTitle.textContent = isRegister ? 'Create account' : 'Sign in';
  elements.submitAuthButton.textContent = isRegister ? 'Create account' : 'Log in';
  elements.authSwitchLabel.textContent = isRegister ? 'Already have an account?' : 'No account yet?';
  elements.toggleAuthMode.textContent = isRegister ? 'Sign in' : 'Create account';
  elements.nameField.classList.toggle('hidden', !isRegister);
  elements.confirmPasswordField.classList.toggle('hidden', !isRegister);
  elements.password.setAttribute('autocomplete', isRegister ? 'new-password' : 'current-password');
}

function renderWorkspace() {
  elements.userName.textContent = state.user.name;
  elements.authScreen.classList.add('hidden');
  elements.workspace.classList.remove('hidden');
  document.title = 'TaskFlow - Workspace';
  renderTasks();
  updateStats();
  resetTaskForm();
}

function updateStats() {
  const total = state.tasks.length;
  const completed = state.tasks.filter((task) => task.status === 'done').length;
  const inProgress = state.tasks.filter((task) => task.status === 'progress').length;
  const dueSoon = state.tasks.filter((task) => {
    const days = getDaysRemaining(task.dueDate);
    return days !== null && days >= 0 && days <= 3 && task.status !== 'done';
  }).length;

  elements.totalCount.textContent = total;
  elements.completedCount.textContent = completed;
  elements.progressCount.textContent = inProgress;
  elements.dueSoonCount.textContent = dueSoon;
}

function resetTaskForm() {
  state.editingId = null;
  elements.taskForm.reset();
  elements.taskId.value = '';
  elements.taskStatus.value = 'todo';
  elements.taskPriority.value = 'medium';
  elements.taskDueDate.value = today();
  elements.formKicker.textContent = 'Create task';
  elements.formTitle.textContent = 'Add a new task';
  elements.submitTaskButton.textContent = 'Save task';
}

function fillTaskForm(task) {
  state.editingId = task.id;
  elements.taskId.value = task.id;
  elements.taskTitle.value = task.title;
  elements.taskDescription.value = task.description;
  elements.taskStatus.value = task.status;
  elements.taskPriority.value = task.priority;
  elements.taskDueDate.value = task.dueDate;
  elements.formKicker.textContent = 'Editing task';
  elements.formTitle.textContent = 'Update task';
  elements.submitTaskButton.textContent = 'Update task';
}

function upsertTask(formData) {
  const payload = {
    title: formData.get('title').trim(),
    description: formData.get('description').trim(),
    status: formData.get('status'),
    priority: formData.get('priority'),
    dueDate: formData.get('dueDate'),
  };

  if (!payload.title || !payload.description || !payload.dueDate) {
    return;
  }

  if (state.editingId) {
    state.tasks = state.tasks.map((task) =>
      task.id === state.editingId
        ? {
            ...task,
            ...payload,
          }
        : task,
    );
  } else {
    state.tasks = [
      {
        id: crypto.randomUUID(),
        ...payload,
        createdAt: Date.now(),
      },
      ...state.tasks,
    ];
  }

  saveTasks();
  updateStats();
  renderTasks();
  resetTaskForm();
}

function deleteTask(taskId) {
  const task = state.tasks.find((item) => item.id === taskId);
  if (!task) {
    return;
  }

  const confirmed = confirm(`Delete “${task.title}”?`);
  if (!confirmed) {
    return;
  }

  state.tasks = state.tasks.filter((item) => item.id !== taskId);
  saveTasks();
  updateStats();
  renderTasks();
}

function toggleTaskStatus(taskId) {
  state.tasks = state.tasks.map((task) => {
    if (task.id !== taskId) {
      return task;
    }

    const nextStatus = task.status === 'done' ? 'progress' : 'done';
    return {
      ...task,
      status: nextStatus,
    };
  });

  saveTasks();
  updateStats();
  renderTasks();
}

function renderTasks() {
  const tasks = state.tasks.filter((task) => {
    const matchesFilter = state.filter === 'all' || task.status === state.filter;
    const search = state.search.trim().toLowerCase();
    const matchesSearch =
      !search ||
      task.title.toLowerCase().includes(search) ||
      task.description.toLowerCase().includes(search) ||
      task.priority.toLowerCase().includes(search);

    return matchesFilter && matchesSearch;
  });

  elements.taskList.innerHTML = '';
  elements.emptyState.classList.toggle('hidden', tasks.length !== 0);

  if (tasks.length === 0) {
    return;
  }

  const fragment = document.createDocumentFragment();

  tasks.forEach((task) => {
    const article = document.createElement('article');
    article.className = 'task-card';

    article.innerHTML = `
      <div class="task-card__header">
        <div>
          <span class="task-chip ${task.status}">${task.status.replace('progress', 'in progress')}</span>
          <h4>${escapeHtml(task.title)}</h4>
        </div>
        <strong>${escapeHtml(task.priority)}</strong>
      </div>
      <p>${escapeHtml(task.description)}</p>
      <div class="task-card__meta">
        <span>Due: ${formatDateLabel(task.dueDate)}</span>
        <span>${getTaskLabel(task)}</span>
      </div>
      <div class="task-card__actions">
        <button class="success" type="button" data-action="toggle">${task.status === 'done' ? 'Mark in progress' : 'Mark done'}</button>
        <button type="button" data-action="edit">Edit</button>
        <button class="danger" type="button" data-action="delete">Delete</button>
      </div>
    `;

    article.querySelector('[data-action="toggle"]').addEventListener('click', () => toggleTaskStatus(task.id));
    article.querySelector('[data-action="edit"]').addEventListener('click', () => fillTaskForm(task));
    article.querySelector('[data-action="delete"]').addEventListener('click', () => deleteTask(task.id));

    fragment.appendChild(article);
  });

  elements.taskList.appendChild(fragment);
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function setActiveFilter(filter) {
  state.filter = filter;
  document.querySelectorAll('.filter-chip').forEach((chip) => {
    chip.classList.toggle('active', chip.dataset.filter === filter);
  });
  renderTasks();
}

function hydrateSession() {
  const session = getStoredSession();
  if (!session || !getAccount(session.email)) {
    showAuth();
    setAuthMode('login');
    return;
  }

  state.user = session;
  state.tasks = loadTasks(session.email);
  renderWorkspace();
}

function bindEvents() {
  elements.loginForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const loginSucceeded = state.authMode === 'register'
      ? register(
          elements.name.value,
          elements.email.value,
          elements.password.value,
          elements.confirmPassword.value,
          elements.rememberMe.checked,
        )
      : login(elements.email.value, elements.password.value, elements.rememberMe.checked);

    if (loginSucceeded) {
      elements.loginForm.reset();
    }
  });

  elements.toggleAuthMode.addEventListener('click', () => {
    setAuthMode(state.authMode === 'login' ? 'register' : 'login');
    elements.loginForm.reset();
    elements.rememberMe.checked = true;
  });

  elements.fillDemo.addEventListener('click', () => {
    setAuthMode('login');
    elements.email.value = 'demo@taskflow.app';
    elements.password.value = 'task1234';
    elements.email.focus();
  });

  elements.logoutButton.addEventListener('click', logout);

  elements.taskForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const formData = new FormData(elements.taskForm);
    upsertTask(formData);
  });

  elements.resetFormButton.addEventListener('click', resetTaskForm);

  elements.searchInput.addEventListener('input', (event) => {
    state.search = event.target.value;
    renderTasks();
  });

  document.querySelectorAll('.filter-chip').forEach((chip) => {
    chip.addEventListener('click', () => setActiveFilter(chip.dataset.filter));
  });
}

bindEvents();
setAuthMode('login');
hydrateSession();
