(() => {
  'use strict';
  const KEY = 'studytrack.tasks.v1';
  const $ = id => document.getElementById(id);
  const el = {
    list: $('taskList'),
    empty: $('emptyState'),
    form: $('taskForm'),
    modal: $('taskModal'),
    search: $('searchInput'),
    status: $('statusFilter'),
    priority: $('priorityFilter'),
    total: $('totalCount'),
    pending: $('pendingCount'),
    completed: $('completedCount'),
    overdue: $('overdueCount'),
    todayNav: $('todayNavCount'),
    visible: $('visibleTaskCount'),
    upcoming: $('upcomingList'),
    overlay: $('sidebarOverlay'),
    sidebar: $('sidebar'),
    menu: $('mobileMenu'),
    notes: $('taskDescription'),
    notesCount: $('notesCount')
  };
  let toastTimer = null;
  let tasks = load();
  let view = 'all';

  function load() {
    try {
      const x = JSON.parse(localStorage.getItem(KEY) || '[]');
      return Array.isArray(x)
        ? x.filter(t => t && typeof t.id === 'string' && typeof t.title === 'string' && typeof t.subject === 'string' && typeof t.dueDate === 'string' && ['low', 'medium', 'high'].includes(t.priority) && typeof t.completed === 'boolean')
        : [];
    } catch (e) {
      return [];
    }
  }

  function save() {
    try {
      localStorage.setItem(KEY, JSON.stringify(tasks));
      return true;
    } catch (e) {
      notify('Could not save. Check browser storage settings.');
      return false;
    }
  }

  function today() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }

  function status(t) {
    if (t.completed) return 'completed';
    if (t.dueDate < today()) return 'overdue';
    if (t.dueDate === today()) return 'today';
    return 'pending';
  }

  function fmt(s, opt = { day: 'numeric', month: 'short', year: 'numeric' }) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(s || '')) return 'No date';
    const [y, m, d] = s.split('-').map(Number);
    return new Intl.DateTimeFormat(undefined, opt).format(new Date(y, m - 1, d));
  }

  function esc(s) {
    return String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  function notify(msg) {
    const toastEl = $('appToast');
    $('toastMessage').textContent = msg;
    toastEl.classList.add('is-open');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove('is-open'), 2600);
  }

  function showModal() {
    el.modal.classList.add('is-open');
    el.modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }

  function hideModal() {
    el.modal.classList.remove('is-open');
    el.modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  function setSidebar(open) {
    el.sidebar.classList.toggle('open', open);
    el.menu.setAttribute('aria-expanded', String(open));
    el.overlay.classList.toggle('is-visible', open);
  }

  function updateNotesCount() {
    el.notesCount.textContent = `${el.notes.value.length} / 500`;
  }

  function greeting() {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning, learner';
    if (h < 18) return 'Good afternoon, learner';
    return 'Good evening, learner';
  }

  function setView(next, label) {
    view = next;
    document.querySelectorAll('.nav-item').forEach(b => b.classList.toggle('active', b.dataset.view === next));
    $('pageHeading').textContent = label;
    $('taskSectionTitle').textContent = next === 'all' ? 'Your tasks' : label;
    el.status.value = 'all';
    render();
    if (innerWidth <= 991) setSidebar(false);
  }

  function updateStats() {
    const done = tasks.filter(t => t.completed).length;
    const overdue = tasks.filter(t => status(t) === 'overdue').length;
    const pending = tasks.length - done;
    const n = Math.max(tasks.length, 1);
    el.total.textContent = tasks.length;
    el.pending.textContent = pending;
    el.completed.textContent = done;
    el.overdue.textContent = overdue;
    el.todayNav.textContent = tasks.filter(t => status(t) === 'today').length;
    $('totalBar').style.width = '100%';
    $('pendingBar').style.width = `${Math.round((pending / n) * 100)}%`;
    $('completedBar').style.width = `${Math.round((done / n) * 100)}%`;
    $('overdueBar').style.width = `${Math.round((overdue / n) * 100)}%`;
  }

  function matches(t) {
    const q = el.search.value.trim().toLowerCase();
    const s = view !== 'all' ? view : el.status.value;
    const p = el.priority.value;
    const st = status(t);
    if (q && !`${t.title} ${t.subject} ${t.description || ''}`.toLowerCase().includes(q)) return false;
    if (p !== 'all' && t.priority !== p) return false;
    if (s === 'pending' && st !== 'pending') return false;
    if (s === 'completed' && st !== 'completed') return false;
    if (s === 'overdue' && st !== 'overdue') return false;
    if (s === 'today' && st !== 'today') return false;
    if (s === 'upcoming' && !(st === 'pending' || st === 'today')) return false;
    return true;
  }

  function render() {
    const order = { overdue: 0, today: 1, pending: 2, completed: 3 };
    const prio = { high: 0, medium: 1, low: 2 };
    const list = tasks.filter(matches).sort((a, b) => order[status(a)] - order[status(b)] || a.dueDate.localeCompare(b.dueDate) || prio[a.priority] - prio[b.priority]);
    el.list.innerHTML = list.map(t => {
      const st = status(t);
      const labels = { completed: 'Completed', overdue: 'Overdue', today: 'Due today', pending: 'Pending' };
      const due = st === 'overdue' ? `Overdue · ${fmt(t.dueDate)}` : st === 'today' ? `Due today · ${fmt(t.dueDate)}` : `Due ${fmt(t.dueDate)}`;
      return `<article class="task-item ${t.completed ? 'is-completed' : ''}">
        <div class="task-main">
          <input class="task-check" type="checkbox" data-action="toggle" data-id="${esc(t.id)}" aria-label="${t.completed ? 'Reopen' : 'Complete'} ${esc(t.title)}" ${t.completed ? 'checked' : ''}>
          <div class="task-copy">
            <div class="task-title">${esc(t.title)}</div>
            <div class="task-subject">${esc(t.subject)}</div>
            ${t.description ? `<div class="task-description">${esc(t.description)}</div>` : ''}
            <div class="task-meta">
              <span class="priority-badge priority-${t.priority}">${t.priority} priority</span>
              <span class="status-badge status-${st}">${labels[st]}</span>
            </div>
            <div class="task-due ${st === 'overdue' ? 'overdue-text' : ''}">${due}</div>
          </div>
        </div>
        <div class="task-actions">
          <button class="icon-btn" type="button" data-action="edit" data-id="${esc(t.id)}" aria-label="Edit ${esc(t.title)}" title="Edit task">✎</button>
          <button class="icon-btn delete" type="button" data-action="delete" data-id="${esc(t.id)}" aria-label="Delete ${esc(t.title)}" title="Delete task">×</button>
        </div>
      </article>`;
    }).join('');
    el.empty.hidden = list.length > 0;
    el.list.hidden = list.length === 0;
    el.visible.textContent = `${list.length} ${list.length === 1 ? 'task' : 'tasks'}`;
    updateStats();
    renderUpcoming();
  }

  function renderUpcoming() {
    const upcoming = tasks.filter(t => !t.completed && t.dueDate >= today()).sort((a, b) => a.dueDate.localeCompare(b.dueDate)).slice(0, 4);
    el.upcoming.innerHTML = upcoming.length
      ? upcoming.map(t => {
          const [y, m, d] = t.dueDate.split('-').map(Number);
          const date = new Date(y, m - 1, d);
          const mon = new Intl.DateTimeFormat(undefined, { month: 'short' }).format(date);
          return `<div class="upcoming-item">
            <div class="date-square"><strong>${d}</strong><small>${mon}</small></div>
            <div class="upcoming-copy">
              <strong>${esc(t.title)}</strong>
              <small>${esc(t.subject)} · ${status(t) === 'today' ? 'Today' : fmt(t.dueDate, { weekday: 'short', month: 'short', day: 'numeric' })}</small>
            </div>
          </div>`;
        }).join('')
      : '<div class="upcoming-empty">Nothing coming up just yet. Add a task when you are ready.</div>';
  }

  function openForm(t = null) {
    el.form.reset();
    el.form.classList.remove('was-validated');
    $('formError').textContent = '';
    $('taskId').value = t ? t.id : '';
    $('taskTitle').value = t ? t.title : '';
    $('taskSubject').value = t ? t.subject : '';
    $('taskDueDate').value = t ? t.dueDate : today();
    $('taskPriority').value = t ? t.priority : 'medium';
    $('taskDescription').value = t ? (t.description || '') : '';
    $('taskModalLabel').textContent = t ? 'Edit task' : 'Add a new task';
    $('saveTaskBtn').textContent = t ? 'Save changes →' : 'Save task →';
    updateNotesCount();
    showModal();
    setTimeout(() => $('taskTitle').focus(), 150);
  }

  el.form.addEventListener('submit', e => {
    e.preventDefault();
    el.form.classList.add('was-validated');
    const title = $('taskTitle').value.trim();
    const subject = $('taskSubject').value.trim();
    const dueDate = $('taskDueDate').value;
    if (!title || !subject || !dueDate) {
      $('formError').textContent = 'Please complete all required fields.';
      return;
    }
    $('formError').textContent = '';
    const id = $('taskId').value;
    const old = tasks.find(t => t.id === id);
    const task = {
      id: old ? old.id : (crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`),
      title,
      subject,
      dueDate,
      priority: $('taskPriority').value,
      description: $('taskDescription').value.trim(),
      completed: old ? old.completed : false,
      createdAt: old ? old.createdAt : new Date().toISOString()
    };
    tasks = old ? tasks.map(t => t.id === id ? task : t) : [...tasks, task];
    save();
    hideModal();
    render();
    notify(old ? 'Task updated successfully.' : 'Task added successfully.');
  });

  el.list.addEventListener('click', e => {
    const b = e.target.closest('[data-action]');
    if (!b || b.dataset.action === 'toggle') return;
    const t = tasks.find(x => x.id === b.dataset.id);
    if (!t) return;
    if (b.dataset.action === 'edit') openForm(t);
    if (b.dataset.action === 'delete' && confirm(`Delete "${t.title}"? This cannot be undone.`)) {
      tasks = tasks.filter(x => x.id !== t.id);
      save();
      render();
      notify('Task deleted.');
    }
  });

  el.list.addEventListener('change', e => {
    const b = e.target.closest('[data-action="toggle"]');
    if (!b) return;
    const t = tasks.find(x => x.id === b.dataset.id);
    if (t) {
      t.completed = b.checked;
      save();
      render();
      notify(t.completed ? 'Task marked as completed.' : 'Task reopened.');
    }
  });

  $('openAddTask').addEventListener('click', () => openForm());
  $('emptyAddTask').addEventListener('click', () => openForm());
  el.search.addEventListener('input', render);
  el.priority.addEventListener('change', render);
  el.notes.addEventListener('input', updateNotesCount);

  el.status.addEventListener('change', () => {
    view = 'all';
    document.querySelectorAll('.nav-item').forEach(b => b.classList.toggle('active', b.dataset.view === 'all'));
    $('pageHeading').textContent = 'Overview';
    $('taskSectionTitle').textContent = 'Your tasks';
    render();
  });

  document.querySelectorAll('.nav-item').forEach(b => b.addEventListener('click', () => {
    const label = b.querySelector('span:last-of-type')?.textContent || b.textContent.trim();
    setView(b.dataset.view, label);
  }));

  document.querySelectorAll('[data-stat-filter]').forEach(card => {
    card.addEventListener('click', () => {
      const filter = card.dataset.statFilter;
      const labels = { all: 'Overview', pending: 'Pending', completed: 'Completed', overdue: 'Overdue' };
      if (filter === 'pending') {
        view = 'all';
        document.querySelectorAll('.nav-item').forEach(b => b.classList.toggle('active', b.dataset.view === 'all'));
        $('pageHeading').textContent = 'Overview';
        $('taskSectionTitle').textContent = 'Pending';
        el.status.value = 'pending';
        render();
        return;
      }
      const nav = document.querySelector(`.nav-item[data-view="${filter === 'all' ? 'all' : filter}"]`);
      setView(filter === 'all' ? 'all' : filter, labels[filter] || 'Overview');
      if (nav) nav.focus();
    });
  });

  el.menu.addEventListener('click', () => setSidebar(!el.sidebar.classList.contains('open')));
  el.overlay.addEventListener('click', () => setSidebar(false));
  el.modal.addEventListener('click', e => {
    if (e.target === el.modal || e.target.closest('[data-close-modal]')) hideModal();
  });
  $('toastClose').addEventListener('click', () => $('appToast').classList.remove('is-open'));
  document.addEventListener('keydown', e => {
    if (e.key !== 'Escape') return;
    if (el.modal.classList.contains('is-open')) hideModal();
    if (el.sidebar.classList.contains('open')) setSidebar(false);
  });
  $('focusButton').addEventListener('click', () => notify('Focus tip: choose one important task and start with the next small step.'));

  $('greeting').innerHTML = `${greeting()} <span class="wave" aria-hidden="true">✦</span>`;
  $('todayDate').textContent = new Intl.DateTimeFormat(undefined, { weekday: 'short', month: 'short', day: 'numeric' }).format(new Date());
  $('year').textContent = new Date().getFullYear();
  updateNotesCount();

  try {
    if (!localStorage.getItem(KEY + '.initialized')) {
      const future = n => {
        const d = new Date();
        d.setDate(d.getDate() + n);
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      };
      tasks = [
        { id: 'demo-1', title: 'Review cloud architecture notes', subject: 'Cloud Computing', dueDate: future(1), priority: 'high', description: 'Revise the main AWS services before the group meeting.', completed: false },
        { id: 'demo-2', title: 'Finish research outline', subject: 'Research Methods', dueDate: today(), priority: 'medium', description: 'Complete the introduction and objectives.', completed: false },
        { id: 'demo-3', title: 'Submit weekly reflection', subject: 'Professional Development', dueDate: future(3), priority: 'low', description: '', completed: true }
      ];
      save();
      localStorage.setItem(KEY + '.initialized', 'true');
    }
  } catch (e) {
    console.warn('Demo data could not be initialized', e);
  }

  render();
})();
