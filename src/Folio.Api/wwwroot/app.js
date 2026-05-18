const API = '/api/journal';

let journal = [];
let pendingTopicDate = null;
let activeEditor = null;

// ── API helpers ──────────────────────────────────────────────────────────────

async function apiFetch(url, options = {}) {
  const res = await fetch(url, options);
  if (res.status === 401) { location.href = '/auth/login'; return null; }
  return res;
}

// ── Load & render ────────────────────────────────────────────────────────────

async function loadJournal() {
  const res = await apiFetch(API);
  if (!res) return;
  if (!res.ok) { showError('Fehler beim Laden des Journals.'); return; }
  journal = await res.json();
  renderJournal();
}

function renderJournal() {
  const query = document.getElementById('search').value.trim().toLowerCase();
  const container = document.getElementById('journal');
  container.innerHTML = '';

  const filtered = query ? filterJournal(journal, query) : journal;

  if (filtered.length === 0) {
    container.innerHTML = query
      ? '<p class="empty-state">Keine Ergebnisse.</p>'
      : '<p class="empty-state">Noch keine Einträge. Starte mit "+ Neuer Tag".</p>';
    return;
  }

  for (const day of filtered) container.appendChild(renderDay(day, query));
}

function filterJournal(days, query) {
  return days.map(day => {
    if (day.date.includes(query)) return day;
    const topics = day.topics.filter(t =>
      t.title.toLowerCase().includes(query) || t.content.toLowerCase().includes(query));
    return topics.length ? { ...day, topics } : null;
  }).filter(Boolean);
}

// ── Day rendering ────────────────────────────────────────────────────────────

function renderDay(day, query = '') {
  const tpl = document.getElementById('tpl-day').content.cloneNode(true);
  const section = tpl.querySelector('.day-section');
  section.dataset.date = day.date;

  const heading = tpl.querySelector('.day-heading');
  heading.innerHTML = query ? highlight(day.date, query) : escapeHtml(day.date);

  tpl.querySelector('.add-topic-btn').addEventListener('click', () => openAddTopicDialog(day.date));
  tpl.querySelector('.delete-day-btn').addEventListener('click', () => {
    if (confirm(`Tag "${day.date}" und alle Themen wirklich löschen?`)) deleteDay(day.date);
  });

  const topicsEl = tpl.querySelector('.topics');
  if (day.topics.length === 0) {
    topicsEl.innerHTML = '<p class="empty-state">Keine Themen – füge eines hinzu.</p>';
  } else {
    for (const topic of day.topics) topicsEl.appendChild(renderTopic(day.date, topic, query));
  }

  return tpl;
}

// ── Topic rendering ──────────────────────────────────────────────────────────

function renderTopic(date, topic, query = '') {
  const tpl = document.getElementById('tpl-topic').content.cloneNode(true);
  const article = tpl.querySelector('.topic-article');

  const titleEl = tpl.querySelector('.topic-title');
  titleEl.innerHTML = query ? highlight(topic.title, query) : escapeHtml(topic.title);

  const titleInput = tpl.querySelector('.topic-title-input');
  const preview = tpl.querySelector('.topic-preview');
  const editorWrap = tpl.querySelector('.topic-editor');
  const textarea = editorWrap.querySelector('textarea');

  preview.innerHTML = topic.content ? marked.parse(topic.content) : '<em class="empty-state">Kein Inhalt</em>';

  // ── Rename ──
  tpl.querySelector('.rename-btn').addEventListener('click', () => {
    titleEl.classList.add('hidden');
    titleInput.value = topic.title;
    titleInput.classList.remove('hidden');
    titleInput.focus();
    titleInput.select();
  });

  titleInput.addEventListener('keydown', async e => {
    if (e.key === 'Enter') await commitRename();
    if (e.key === 'Escape') cancelRename();
  });

  titleInput.addEventListener('blur', () => {
    if (!titleInput.classList.contains('hidden')) commitRename();
  });

  async function commitRename() {
    const newTitle = titleInput.value.trim();
    if (!newTitle || newTitle === topic.title) { cancelRename(); return; }
    await renameTopic(date, topic.title, newTitle);
  }

  function cancelRename() {
    titleInput.classList.add('hidden');
    titleEl.classList.remove('hidden');
  }

  // ── Edit with EasyMDE ──
  tpl.querySelector('.edit-btn').addEventListener('click', () => {
    destroyActiveEditor();
    preview.classList.add('hidden');
    editorWrap.classList.remove('hidden');
    textarea.value = topic.content;

    activeEditor = new EasyMDE({
      element: textarea,
      spellChecker: false,
      autosave: { enabled: false },
      status: false,
      toolbar: false,
    });

    const toolbarActions = {
      bold:          EasyMDE.toggleBold,
      italic:        EasyMDE.toggleItalic,
      strikethrough: EasyMDE.toggleStrikethrough,
      heading2:      EasyMDE.toggleHeading2,
      heading3:      EasyMDE.toggleHeading3,
      ul:            EasyMDE.toggleUnorderedList,
      ol:            EasyMDE.toggleOrderedList,
      link:          EasyMDE.drawLink,
      code:          EasyMDE.toggleCodeBlock,
    };

    editorWrap.querySelectorAll('.md-toolbar [data-action]').forEach(btn => {
      btn.addEventListener('mousedown', e => {
        e.preventDefault();
        toolbarActions[btn.dataset.action]?.(activeEditor);
      });
    });
  });

  tpl.querySelector('.save-btn').addEventListener('click', async () => {
    const content = activeEditor ? activeEditor.value() : textarea.value;
    await updateTopic(date, topic.title, content);
  });

  tpl.querySelector('.cancel-btn').addEventListener('click', () => {
    destroyActiveEditor();
    editorWrap.classList.add('hidden');
    preview.classList.remove('hidden');
  });

  tpl.querySelector('.delete-btn').addEventListener('click', () => {
    if (confirm(`Thema "${topic.title}" wirklich löschen?`)) deleteTopic(date, topic.title);
  });

  return tpl;
}

function destroyActiveEditor() {
  if (activeEditor) {
    activeEditor.toTextArea();
    activeEditor = null;
  }
}

// ── Day operations ───────────────────────────────────────────────────────────

async function addDay(date) {
  if (journal.some(d => d.date === date)) {
    document.getElementById('dialog-day').close();
    document.querySelector(`[data-date="${date}"]`)?.scrollIntoView({ behavior: 'smooth' });
    return;
  }
  const res = await apiFetch(`${API}/day`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ date })
  });
  if (res?.ok) { document.getElementById('dialog-day').close(); loadJournal(); }
  else showError('Tag konnte nicht erstellt werden.');
}

async function deleteDay(date) {
  const res = await apiFetch(`${API}/day?date=${encodeURIComponent(date)}`, { method: 'DELETE' });
  if (res?.ok) loadJournal();
  else showError('Tag konnte nicht gelöscht werden.');
}

// ── Topic operations ─────────────────────────────────────────────────────────

function openAddTopicDialog(date) {
  pendingTopicDate = date;
  document.getElementById('input-topic-title').value = '';
  document.getElementById('input-topic-content').value = '';
  document.getElementById('dialog-topic').showModal();
  document.getElementById('input-topic-title').focus();
}

async function saveTopic() {
  const title = document.getElementById('input-topic-title').value.trim();
  if (!title) { alert('Bitte einen Titel eingeben.'); return; }
  const content = document.getElementById('input-topic-content').value;
  const res = await apiFetch(`${API}/topic`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ date: pendingTopicDate, title, content })
  });
  if (res?.ok) { document.getElementById('dialog-topic').close(); loadJournal(); }
  else showError('Thema konnte nicht hinzugefügt werden.');
}

async function updateTopic(date, title, content) {
  const res = await apiFetch(`${API}/topic`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ date, title, content })
  });
  if (res?.ok) { destroyActiveEditor(); loadJournal(); }
  else showError('Änderung konnte nicht gespeichert werden.');
}

async function renameTopic(date, title, newTitle) {
  const res = await apiFetch(`${API}/topic`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ date, title, content: '', newTitle })
  });
  if (res?.ok) loadJournal();
  else showError('Umbenennen fehlgeschlagen.');
}

async function deleteTopic(date, title) {
  const res = await apiFetch(`${API}/topic?date=${encodeURIComponent(date)}&title=${encodeURIComponent(title)}`, {
    method: 'DELETE'
  });
  if (res?.ok) loadJournal();
  else showError('Thema konnte nicht gelöscht werden.');
}

// ── Utilities ────────────────────────────────────────────────────────────────

function escapeHtml(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function highlight(text, query) {
  const escaped = escapeHtml(text);
  const safe = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return escaped.replace(new RegExp(safe, 'gi'), m => `<mark class="search-highlight">${m}</mark>`);
}

function showError(msg) { alert(msg); }

// ── Event wiring ─────────────────────────────────────────────────────────────

document.getElementById('btn-new-day').addEventListener('click', () => {
  document.getElementById('input-day-date').value = new Date().toISOString().slice(0, 10);
  document.getElementById('dialog-day').showModal();
});
document.getElementById('dialog-day-save').addEventListener('click', () => {
  const date = document.getElementById('input-day-date').value;
  if (!date) { alert('Bitte ein Datum wählen.'); return; }
  addDay(date);
});
document.getElementById('dialog-day-cancel').addEventListener('click', () =>
  document.getElementById('dialog-day').close());

document.getElementById('dialog-topic-save').addEventListener('click', saveTopic);
document.getElementById('dialog-topic-cancel').addEventListener('click', () =>
  document.getElementById('dialog-topic').close());

document.getElementById('search').addEventListener('input', renderJournal);

document.addEventListener('DOMContentLoaded', loadJournal);
