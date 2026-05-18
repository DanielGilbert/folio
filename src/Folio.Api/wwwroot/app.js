const API = '/api/journal';

let journal = [];
let pendingTopicDate = null;

async function loadJournal() {
  const res = await fetch(API);
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

  for (const day of filtered) {
    container.appendChild(renderDay(day, query));
  }
}

function filterJournal(days, query) {
  return days
    .map(day => {
      const dateMatch = day.date.includes(query);
      const matchedTopics = day.topics.filter(t =>
        t.title.toLowerCase().includes(query) ||
        t.content.toLowerCase().includes(query)
      );
      if (dateMatch) return day;
      if (matchedTopics.length > 0) return { ...day, topics: matchedTopics };
      return null;
    })
    .filter(Boolean);
}

function highlight(text, query) {
  if (!query) return escapeHtml(text);
  const escaped = escapeHtml(text);
  const escapedQuery = escapeHtml(query).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return escaped.replace(new RegExp(escapedQuery, 'gi'), m => `<mark class="search-highlight">${m}</mark>`);
}

function escapeHtml(str) {
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

function renderDay(day, query = '') {
  const tpl = document.getElementById('tpl-day').content.cloneNode(true);
  const section = tpl.querySelector('.day-section');
  section.dataset.date = day.date;

  const heading = tpl.querySelector('.day-heading');
  if (query) heading.innerHTML = highlight(day.date, query);
  else heading.textContent = day.date;

  tpl.querySelector('.add-topic-btn').addEventListener('click', () => openAddTopicDialog(day.date));
  tpl.querySelector('.delete-day-btn').addEventListener('click', () => {
    if (confirm(`Tag "${day.date}" und alle Themen wirklich löschen?`)) deleteDay(day.date);
  });

  const topicsEl = tpl.querySelector('.topics');
  if (day.topics.length === 0) {
    topicsEl.innerHTML = '<p class="empty-state">Keine Themen – füge eines hinzu.</p>';
  } else {
    for (const topic of day.topics) {
      topicsEl.appendChild(renderTopic(day.date, topic, query));
    }
  }

  return tpl;
}

function renderTopic(date, topic, query = '') {
  const tpl = document.getElementById('tpl-topic').content.cloneNode(true);
  const article = tpl.querySelector('.topic-article');
  article.dataset.date = date;
  article.dataset.title = topic.title;

  const titleEl = tpl.querySelector('.topic-title');
  if (query) titleEl.innerHTML = highlight(topic.title, query);
  else titleEl.textContent = topic.title;

  const preview = tpl.querySelector('.topic-preview');
  preview.innerHTML = topic.content ? marked.parse(topic.content) : '<em class="empty-state">Kein Inhalt</em>';

  const editor = tpl.querySelector('.topic-editor');
  const textarea = editor.querySelector('textarea');
  textarea.value = topic.content;

  tpl.querySelector('.edit-btn').addEventListener('click', () => {
    preview.classList.add('hidden');
    editor.classList.remove('hidden');
    textarea.focus();
  });

  tpl.querySelector('.cancel-btn').addEventListener('click', () => {
    textarea.value = topic.content;
    editor.classList.add('hidden');
    preview.classList.remove('hidden');
  });

  tpl.querySelector('.save-btn').addEventListener('click', () => updateTopic(date, topic.title, textarea.value));

  tpl.querySelector('.delete-btn').addEventListener('click', () => {
    if (confirm(`Thema "${topic.title}" wirklich löschen?`)) deleteTopic(date, topic.title);
  });

  return tpl;
}

async function addDay(date) {
  if (journal.some(d => d.date === date)) {
    document.querySelector(`[data-date="${date}"]`)?.scrollIntoView({ behavior: 'smooth' });
    document.getElementById('dialog-day').close();
    return;
  }
  const res = await fetch(`${API}/day`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ date })
  });
  if (res.ok) { document.getElementById('dialog-day').close(); loadJournal(); }
  else showError('Tag konnte nicht erstellt werden.');
}

async function deleteDay(date) {
  const res = await fetch(`${API}/day?date=${encodeURIComponent(date)}`, { method: 'DELETE' });
  if (res.ok) loadJournal();
  else showError('Tag konnte nicht gelöscht werden.');
}

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

  const res = await fetch(`${API}/topic`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ date: pendingTopicDate, title, content })
  });
  if (res.ok) { document.getElementById('dialog-topic').close(); loadJournal(); }
  else showError('Thema konnte nicht hinzugefügt werden.');
}

async function updateTopic(date, title, content) {
  const res = await fetch(`${API}/topic`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ date, title, content })
  });
  if (res.ok) loadJournal();
  else showError('Änderung konnte nicht gespeichert werden.');
}

async function deleteTopic(date, title) {
  const res = await fetch(`${API}/topic?date=${encodeURIComponent(date)}&title=${encodeURIComponent(title)}`, {
    method: 'DELETE'
  });
  if (res.ok) loadJournal();
  else showError('Thema konnte nicht gelöscht werden.');
}

function showError(msg) { alert(msg); }

// Neuer-Tag-Dialog
document.getElementById('btn-new-day').addEventListener('click', () => {
  const today = new Date().toISOString().slice(0, 10);
  document.getElementById('input-day-date').value = today;
  document.getElementById('dialog-day').showModal();
});
document.getElementById('dialog-day-save').addEventListener('click', () => {
  const date = document.getElementById('input-day-date').value;
  if (!date) { alert('Bitte ein Datum wählen.'); return; }
  addDay(date);
});
document.getElementById('dialog-day-cancel').addEventListener('click', () =>
  document.getElementById('dialog-day').close());

// Thema-Dialog
document.getElementById('dialog-topic-save').addEventListener('click', saveTopic);
document.getElementById('dialog-topic-cancel').addEventListener('click', () =>
  document.getElementById('dialog-topic').close());

// Suche
document.getElementById('search').addEventListener('input', renderJournal);

document.addEventListener('DOMContentLoaded', loadJournal);
