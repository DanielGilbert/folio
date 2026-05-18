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
  const container = document.getElementById('journal');
  container.innerHTML = '';

  if (journal.length === 0) {
    container.innerHTML = '<p class="empty-state">Noch keine Einträge. Starte mit "Neuer Tag".</p>';
    return;
  }

  for (const day of journal) {
    container.appendChild(renderDay(day));
  }
}

function renderDay(day) {
  const tpl = document.getElementById('tpl-day').content.cloneNode(true);
  const section = tpl.querySelector('.day-section');
  section.dataset.date = day.date;
  tpl.querySelector('.day-heading').textContent = day.date;

  const addBtn = tpl.querySelector('.add-topic-btn');
  addBtn.addEventListener('click', () => openAddTopicDialog(day.date));

  const topicsEl = tpl.querySelector('.topics');
  if (day.topics.length === 0) {
    topicsEl.innerHTML = '<p class="empty-state">Keine Themen – füge eines hinzu.</p>';
  } else {
    for (const topic of day.topics) {
      topicsEl.appendChild(renderTopic(day.date, topic));
    }
  }

  return tpl;
}

function renderTopic(date, topic) {
  const tpl = document.getElementById('tpl-topic').content.cloneNode(true);
  const article = tpl.querySelector('.topic-article');
  article.dataset.date = date;
  article.dataset.title = topic.title;

  tpl.querySelector('.topic-title').textContent = topic.title;

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

async function addToday() {
  const today = new Date().toISOString().slice(0, 10);
  if (journal.some(d => d.date === today)) {
    document.querySelector(`[data-date="${today}"]`)?.scrollIntoView({ behavior: 'smooth' });
    return;
  }
  const res = await fetch(`${API}/day`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ date: today })
  });
  if (res.ok) loadJournal();
  else showError('Tag konnte nicht erstellt werden.');
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

function showError(msg) {
  alert(msg);
}

document.getElementById('btn-new-day').addEventListener('click', addToday);
document.getElementById('dialog-save').addEventListener('click', saveTopic);
document.getElementById('dialog-cancel').addEventListener('click', () => document.getElementById('dialog-topic').close());

document.addEventListener('DOMContentLoaded', loadJournal);
