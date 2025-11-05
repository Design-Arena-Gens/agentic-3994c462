(function() {
  const qs = (sel, el=document) => el.querySelector(sel);
  const qsa = (sel, el=document) => Array.from(el.querySelectorAll(sel));
  const storage = {
    get(key, fallback) {
      try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; } catch { return fallback; }
    },
    set(key, value) {
      try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
    }
  };

  // Theme
  const themeKey = 'agentic_theme';
  const savedTheme = storage.get(themeKey, 'dark');
  if (savedTheme === 'light') document.documentElement.classList.add('light');
  qs('#switch-theme').addEventListener('click', () => {
    document.documentElement.classList.toggle('light');
    const next = document.documentElement.classList.contains('light') ? 'light' : 'dark';
    storage.set(themeKey, next);
  });

  // CTA scroll
  qs('#get-started').addEventListener('click', () => {
    qs('#tools').scrollIntoView({ behavior: 'smooth', block: 'start' });
  });

  // Footer year
  qs('#year').textContent = new Date().getFullYear();

  // Todo List
  const todoKey = 'agentic_todos';
  let todos = storage.get(todoKey, []);
  const list = qs('#todo-list');
  const count = qs('#todo-count');
  function renderTodos() {
    list.innerHTML = '';
    todos.forEach((t, idx) => {
      const li = document.createElement('li');
      li.className = 'todo-item' + (t.done ? ' completed' : '');
      li.innerHTML = `
        <input type="checkbox" aria-label="toggle" ${t.done ? 'checked' : ''} />
        <span>${escapeHtml(t.text)}</span>
        <div class="row gap">
          <button aria-label="edit">Edit</button>
          <button aria-label="delete">Delete</button>
        </div>
      `;
      const [checkbox, span] = [qs('input', li), qs('span', li)];
      checkbox.addEventListener('change', () => { t.done = checkbox.checked; persist(); });
      qsa('button', li)[0].addEventListener('click', () => editTodo(idx));
      qsa('button', li)[1].addEventListener('click', () => { todos.splice(idx, 1); persist(); });
      list.appendChild(li);
    });
    count.textContent = `${todos.length} ${todos.length === 1 ? 'item' : 'items'}`;
  }
  function persist() { storage.set(todoKey, todos); renderTodos(); }
  function editTodo(idx) {
    const next = prompt('Edit task:', todos[idx].text);
    if (next !== null) { todos[idx].text = next.trim(); persist(); }
  }
  function escapeHtml(s) {
    return s.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;','\'':'&#39;'}[c]));
  }
  qs('#todo-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const input = qs('#todo-input');
    const text = input.value.trim();
    if (!text) return;
    todos.unshift({ text, done: false, id: crypto.randomUUID ? crypto.randomUUID() : Date.now()+'' });
    input.value = '';
    persist();
  });
  qs('#todo-clear').addEventListener('click', () => {
    todos = todos.filter(t => !t.done); persist();
  });
  renderTodos();

  // Notes (autosave)
  const notesKey = 'agentic_notes';
  const notes = qs('#notes');
  notes.value = storage.get(notesKey, '');
  let notesDebounce;
  notes.addEventListener('input', () => {
    clearTimeout(notesDebounce);
    notesDebounce = setTimeout(() => storage.set(notesKey, notes.value), 250);
  });
  qs('#notes-export').addEventListener('click', () => {
    const blob = new Blob([JSON.stringify({ notes: notes.value, savedAt: new Date().toISOString() }, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'agentic-notes.json'; a.click();
    setTimeout(() => URL.revokeObjectURL(url), 5000);
  });

  // JSON formatter
  const inEl = qs('#json-input');
  const outEl = qs('#json-output');
  function setOutput(text, isError=false) {
    outEl.textContent = text;
    outEl.style.borderColor = isError ? '#ef4444' : 'var(--border)';
  }
  qs('#format-json').addEventListener('click', () => {
    try { const obj = JSON.parse(inEl.value); setOutput(JSON.stringify(obj, null, 2)); }
    catch (e) { setOutput('Invalid JSON: ' + e.message, true); }
  });
  qs('#minify-json').addEventListener('click', () => {
    try { const obj = JSON.parse(inEl.value); setOutput(JSON.stringify(obj)); }
    catch (e) { setOutput('Invalid JSON: ' + e.message, true); }
  });
  qs('#copy-json').addEventListener('click', async () => {
    try { await navigator.clipboard.writeText(outEl.textContent || ''); }
    catch {}
  });
})();
