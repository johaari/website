// TODO: replace these two values with your Supabase project URL and anon key
// Find them at: supabase.com → your project → Project Settings → API
const SUPABASE_URL = 'https://iwctbdkyqrmnnipvsvqy.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml3Y3RiZGt5cXJtbm5pcHZzdnF5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc2MDgyMzksImV4cCI6MjA5MzE4NDIzOX0.LYARYhj1KojMPe24725dBdwOh44na8eLMfezruOPErw';

const client = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function loadEntries() {
  const container = document.getElementById('guestbook-entries');
  container.textContent = '';

  const { data, error } = await client
    .from('guestbook')
    .select('name, message, created_at')
    .order('created_at', { ascending: false });

  if (error) {
    container.innerHTML = '<p class="gb-error">Could not load messages.</p>';
    return;
  }

  if (!data.length) {
    container.innerHTML = '<p class="gb-empty">No messages yet. Be the first!</p>';
    return;
  }

  data.forEach(entry => {
    const div = document.createElement('div');
    div.className = 'gb-entry';
    const date = new Date(entry.created_at).toLocaleDateString('en-GB', {
      day: 'numeric', month: 'short', year: 'numeric'
    });
    div.innerHTML = `
      <div class="gb-meta">
        <span class="gb-name">${escapeHtml(entry.name)}</span>
        <span class="gb-date">${date}</span>
      </div>
      <p class="gb-message">${escapeHtml(entry.message)}</p>
    `;
    container.appendChild(div);
  });
}

document.getElementById('guestbook-form').addEventListener('submit', async e => {
  e.preventDefault();
  const btn = e.target.querySelector('button');
  btn.disabled = true;
  btn.textContent = 'Sending...';

  const name = document.getElementById('gb-name').value.trim();
  const email = document.getElementById('gb-email').value.trim() || null;
  const message = document.getElementById('gb-message').value.trim();

  const { error } = await client.from('guestbook').insert({ name, email, message });

  if (error) {
    btn.textContent = 'Error — try again';
    btn.disabled = false;
    return;
  }

  e.target.reset();
  btn.textContent = 'Submit';
  btn.disabled = false;
  loadEntries();
});

function escapeHtml(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

loadEntries();
