const FEED_SUPABASE_URL = 'https://iwctbdkyqrmnnipvsvqy.supabase.co';
const FEED_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml3Y3RiZGt5cXJtbm5pcHZzdnF5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc2MDgyMzksImV4cCI6MjA5MzE4NDIzOX0.LYARYhj1KojMPe24725dBdwOh44na8eLMfezruOPErw';

const feedClient = supabase.createClient(FEED_SUPABASE_URL, FEED_SUPABASE_ANON_KEY);

async function loadFeed() {
  const container = document.getElementById('feed-entries');

  const [{ data: messages }, { data: paintings }] = await Promise.all([
    feedClient.from('guestbook').select('name, message, created_at').order('created_at', { ascending: false }).limit(5),
    feedClient.from('whiteboard').select('name, image_url, created_at').order('created_at', { ascending: false }).limit(5),
  ]);

  const entries = [
    ...(messages || []).map(e => ({ ...e, kind: 'message' })),
    ...(paintings || []).map(e => ({ ...e, kind: 'painting' })),
  ].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 8);

  container.textContent = '';

  if (!entries.length) {
    container.innerHTML = '<p class="feed-empty">Nothing yet.</p>';
    return;
  }

  entries.forEach(entry => {
    const div = document.createElement('div');
    div.className = 'feed-item';
    const date = new Date(entry.created_at).toLocaleDateString('en-GB', {
      day: 'numeric', month: 'short',
    });

    if (entry.kind === 'painting') {
      div.innerHTML = `
        <img class="feed-thumb" src="${entry.image_url}" alt="painting by ${escapeHtml(entry.name)}" loading="lazy">
        <div class="feed-meta">
          <span class="feed-label">drew</span>
          <span class="feed-name">${escapeHtml(entry.name)}</span>
          <span class="feed-date">${date}</span>
        </div>
      `;
    } else {
      div.innerHTML = `
        <div class="feed-meta">
          <span class="feed-label">wrote</span>
          <span class="feed-name">${escapeHtml(entry.name)}</span>
          <span class="feed-date">${date}</span>
        </div>
        <p class="feed-preview">"${escapeHtml(entry.message.length > 60 ? entry.message.slice(0, 60) + '…' : entry.message)}"</p>
      `;
    }

    container.appendChild(div);
  });
}

function escapeHtml(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

loadFeed();
