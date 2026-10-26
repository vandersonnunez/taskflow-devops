const $ = (selector) => document.querySelector(selector);

const form = $('#task-form');
const taskIdInput = $('#task-id');
const titleInput = $('#titulo');
const descriptionInput = $('#descricao');
const statusInput = $('#status');
const priorityInput = $('#prioridade');
const dueDateInput = $('#data_vencimento');
const submitButton = $('#submit-btn');
const cancelButton = $('#cancel-edit');
const formHeading = $('#form-heading');
const formMessage = $('#form-message');
const listMessage = $('#list-message');
const taskList = $('#task-list');
const filterStatus = $('#filter-status');
const filterPriority = $('#filter-priority');
const apiStatus = $('#api-status');

let tasks = [];

const STATUS_LABELS = {
  pendente: 'Pendente',
  em_andamento: 'Em andamento',
  concluida: 'Concluída'
};

const PRIORITY_LABELS = {
  baixa: 'Baixa',
  media: 'Média',
  alta: 'Alta'
};

async function apiRequest(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: {
      ...(options.headers ?? {}),
      ...(options.body ? { 'Content-Type': 'application/json' } : {})
    }
  });

  if (response.status === 204) {
    return null;
  }

  const contentType = response.headers.get('content-type') ?? '';
  const payload = contentType.includes('application/json')
    ? await response.json()
    : await response.text();

  if (!response.ok) {
    const message = payload && typeof payload === 'object'
      ? payload.erro || payload.error || `Erro HTTP ${response.status}`
      : `Erro HTTP ${response.status}`;

    throw new Error(message);
  }

  return payload;
}

function showFormMessage(message, type = '') {
  formMessage.textContent = message;
  formMessage.className = `form-message ${type}`.trim();
}

function setApiStatus(online) {
  apiStatus.textContent = online
    ? 'API e banco conectados'
    : 'API indisponível';

  const statusBox = $('.connection-status');
  const statusDot = $('.status-dot');

  statusBox.style.backgroundColor = online ? '#f0faf5' : '#fff0f0';
  statusBox.style.color = online ? '#176b4b' : '#b42318';
  statusDot.style.backgroundColor = online ? '#16a36b' : '#d92d20';
}

async function checkApiHealth() {
  try {
    const health = await apiRequest('/health');
    setApiStatus(health.status === 'ok' && health.database === 'ok');
  } catch {
    setApiStatus(false);
  }
}

function renderStats() {
  $('#total-count').textContent = tasks.length;
  $('#pending-count').textContent =
    tasks.filter((task) => task.status === 'pendente').length;
  $('#progress-count').textContent =
    tasks.filter((task) => task.status === 'em_andamento').length;
  $('#done-count').textContent =
    tasks.filter((task) => task.status === 'concluida').length;
}

function formatDate(value) {
  if (!value) return 'Sem data definida';

  const dateOnly = String(value).slice(0, 10);
  const [year, month, day] = dateOnly.split('-');

  if (!year || !month || !day) return 'Data inválida';

  return `${day}/${month}/${year}`;
}

function createBadge(text, className) {
  const badge = document.createElement('span');
  badge.className = `badge ${className}`;
  badge.textContent = text;
  return badge;
}

function showEmptyState(title, description) {
  const empty = document.createElement('div');
  empty.className = 'empty-state';

  const icon = document.createElement('span');
  icon.className = 'empty-icon';
  icon.textContent = '▤';

  const heading = document.createElement('h3');
  heading.textContent = title;

  const paragraph = document.createElement('p');
  paragraph.textContent = description;

  empty.append(icon, heading, paragraph);
  taskList.replaceChildren(empty);
}

function createTaskCard(task) {
  const card = document.createElement('article');
  card.className = 'task-card';

  const top = document.createElement('div');
  top.className = 'task-top';

  const title = document.createElement('h3');
  title.className = 'task-title';
  title.textContent = task.titulo;

  top.append(title);
  card.append(top);

  if (task.descricao) {
    const description = document.createElement('p');
    description.className = 'task-description';
    description.textContent = task.descricao;
    card.append(description);
  }

  const meta = document.createElement('div');
  meta.className = 'task-meta';

  meta.append(
    createBadge(
      STATUS_LABELS[task.status] ?? task.status,
      `status-${task.status}`
    ),
    createBadge(
      `Prioridade: ${PRIORITY_LABELS[task.prioridade] ?? task.prioridade}`,
      `priority-${task.prioridade}`
    )
  );

  const date = document.createElement('span');
  date.className = 'task-date';
  date.textContent = `Vencimento: ${formatDate(task.data_vencimento)}`;
  meta.append(date);

  card.append(meta);

  const actions = document.createElement('div');
  actions.className = 'task-actions';

  const editButton = document.createElement('button');
  editButton.type = 'button';
  editButton.className = 'action-button';
  editButton.textContent = 'Editar';
  editButton.addEventListener('click', () => startEditing(task));

  const deleteButton = document.createElement('button');
  deleteButton.type = 'button';
  deleteButton.className = 'action-button danger';
  deleteButton.textContent = 'Excluir';
  deleteButton.addEventListener('click', () => removeTask(task));

  actions.append(editButton, deleteButton);
  card.append(actions);

  return card;
}

function renderTasks() {
  const selectedStatus = filterStatus.value;
  const selectedPriority = filterPriority.value;

  const filteredTasks = tasks.filter((task) => {
    const matchesStatus =
      !selectedStatus || task.status === selectedStatus;

    const matchesPriority =
      !selectedPriority || task.prioridade === selectedPriority;

    return matchesStatus && matchesPriority;
  });

  taskList.replaceChildren();

  if (filteredTasks.length === 0) {
    showEmptyState(
      tasks.length === 0 ? 'Nenhuma tarefa cadastrada' : 'Nenhuma tarefa encontrada',
      tasks.length === 0
        ? 'Cadastre sua primeira tarefa usando o formulário ao lado.'
        : 'Altere os filtros para visualizar outras tarefas.'
    );
    return;
  }

  for (const task of filteredTasks) {
    taskList.append(createTaskCard(task));
  }
}

async function loadTasks() {
  try {
    const result = await apiRequest('/api/tarefas');

    if (!Array.isArray(result)) {
      throw new Error('A API retornou uma resposta inesperada.');
    }

    tasks = result;
    renderStats();
    renderTasks();
    listMessage.textContent = '';
    listMessage.className = 'list-message';
  } catch (error) {
    listMessage.textContent = `Não foi possível carregar as tarefas: ${error.message}`;
    listMessage.className = 'list-message error';

    showEmptyState(
      'Não foi possível carregar as tarefas',
      'Verifique se a API está funcionando e tente atualizar.'
    );
  }
}

function resetForm() {
  form.reset();
  taskIdInput.value = '';
  formHeading.textContent = 'Nova tarefa';
  submitButton.innerHTML = '<span>＋</span> Salvar tarefa';
  cancelButton.hidden = true;
  showFormMessage('');
}

function startEditing(task) {
  taskIdInput.value = task.id;
  titleInput.value = task.titulo;
  descriptionInput.value = task.descricao ?? '';
  statusInput.value = task.status ?? 'pendente';
  priorityInput.value = task.prioridade ?? 'media';
  dueDateInput.value = task.data_vencimento
    ? String(task.data_vencimento).slice(0, 10)
    : '';

  formHeading.textContent = 'Editar tarefa';
  submitButton.textContent = 'Salvar alterações';
  cancelButton.hidden = false;

  showFormMessage('Editando a tarefa selecionada.');
  titleInput.focus();

  form.scrollIntoView({
    behavior: 'smooth',
    block: 'start'
  });
}

async function handleFormSubmit(event) {
  event.preventDefault();

  const id = taskIdInput.value;

  const payload = {
    titulo: titleInput.value.trim(),
    descricao: descriptionInput.value.trim() || null,
    status: statusInput.value,
    prioridade: priorityInput.value,
    data_vencimento: dueDateInput.value || null
  };

  submitButton.disabled = true;
  showFormMessage(id ? 'Salvando alterações...' : 'Cadastrando tarefa...');

  try {
    await apiRequest(
      id ? `/api/tarefas/${encodeURIComponent(id)}` : '/api/tarefas',
      {
        method: id ? 'PUT' : 'POST',
        body: JSON.stringify(payload)
      }
    );

    resetForm();

    showFormMessage(
      id ? 'Tarefa atualizada com sucesso!' : 'Tarefa cadastrada com sucesso!',
      'success'
    );

    await loadTasks();
  } catch (error) {
    showFormMessage(error.message, 'error');
  } finally {
    submitButton.disabled = false;
  }
}

async function removeTask(task) {
  const confirmed = window.confirm(
    `Deseja realmente excluir a tarefa "${task.titulo}"?`
  );

  if (!confirmed) return;

  try {
    await apiRequest(`/api/tarefas/${encodeURIComponent(task.id)}`, {
      method: 'DELETE'
    });

    if (taskIdInput.value === String(task.id)) {
      resetForm();
    }

    await loadTasks();

    listMessage.textContent = 'Tarefa excluída com sucesso.';
    listMessage.className = 'list-message';
  } catch (error) {
    listMessage.textContent = `Não foi possível excluir: ${error.message}`;
    listMessage.className = 'list-message error';
  }
}

form.addEventListener('submit', handleFormSubmit);

cancelButton.addEventListener('click', resetForm);
$('#refresh-btn').addEventListener('click', async () => {
  await Promise.all([checkApiHealth(), loadTasks()]);
});

filterStatus.addEventListener('change', renderTasks);
filterPriority.addEventListener('change', renderTasks);

$('#current-date').textContent = new Intl.DateTimeFormat('pt-BR', {
  dateStyle: 'full'
}).format(new Date());

resetForm();
checkApiHealth();
loadTasks();
