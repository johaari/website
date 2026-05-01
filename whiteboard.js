const WB_SUPABASE_URL = 'https://iwctbdkyqrmnnipvsvqy.supabase.co';
const WB_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml3Y3RiZGt5cXJtbm5pcHZzdnF5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc2MDgyMzksImV4cCI6MjA5MzE4NDIzOX0.LYARYhj1KojMPe24725dBdwOh44na8eLMfezruOPErw';

const wbClient = supabase.createClient(WB_SUPABASE_URL, WB_SUPABASE_ANON_KEY);

const canvas = document.getElementById('wb-canvas');
const ctx = canvas.getContext('2d');

// Fixed internal resolution — CSS scales it to fit the container
canvas.width = 800;
canvas.height = 480;
ctx.fillStyle = '#ffffff';
ctx.fillRect(0, 0, canvas.width, canvas.height);

let drawing = false;
let erasing = false;
let lastX = 0;
let lastY = 0;

function getPos(e) {
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  const src = e.touches ? e.touches[0] : e;
  return {
    x: (src.clientX - rect.left) * scaleX,
    y: (src.clientY - rect.top) * scaleY,
  };
}

function startDraw(e) {
  e.preventDefault();
  drawing = true;
  const { x, y } = getPos(e);
  lastX = x;
  lastY = y;
}

function draw(e) {
  e.preventDefault();
  if (!drawing) return;
  const { x, y } = getPos(e);
  ctx.beginPath();
  ctx.moveTo(lastX, lastY);
  ctx.lineTo(x, y);
  ctx.strokeStyle = erasing ? '#000000' : document.getElementById('wb-color').value;
  ctx.lineWidth = document.getElementById('wb-size').value;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.stroke();
  lastX = x;
  lastY = y;
}

function stopDraw() {
  drawing = false;
}

canvas.addEventListener('mousedown', startDraw);
canvas.addEventListener('mousemove', draw);
canvas.addEventListener('mouseup', stopDraw);
canvas.addEventListener('mouseleave', stopDraw);
canvas.addEventListener('touchstart', startDraw, { passive: false });
canvas.addEventListener('touchmove', draw, { passive: false });
canvas.addEventListener('touchend', stopDraw);

document.getElementById('wb-eraser').addEventListener('click', () => {
  erasing = !erasing;
  document.getElementById('wb-eraser').classList.toggle('active', erasing);
});

document.getElementById('wb-color').addEventListener('change', () => {
  erasing = false;
  document.getElementById('wb-eraser').classList.remove('active');
});

document.getElementById('wb-clear').addEventListener('click', () => {
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
});

document.getElementById('wb-save').addEventListener('click', async () => {
  const name = document.getElementById('wb-name').value.trim();
  if (!name) {
    document.getElementById('wb-name').focus();
    return;
  }

  const btn = document.getElementById('wb-save');
  btn.disabled = true;
  btn.textContent = 'Saving...';

  canvas.toBlob(async blob => {
    const filename = `painting-${Date.now()}.png`;
    const { error: uploadError } = await wbClient.storage
      .from('paintings')
      .upload(filename, blob, { contentType: 'image/png' });

    if (uploadError) {
      btn.textContent = 'Error — try again';
      btn.disabled = false;
      return;
    }

    const { data: urlData } = wbClient.storage.from('paintings').getPublicUrl(filename);
    const image_url = urlData.publicUrl;

    const { error: insertError } = await wbClient
      .from('whiteboard')
      .insert({ name, image_url });

    if (insertError) {
      btn.textContent = 'Error — try again';
      btn.disabled = false;
      return;
    }

    document.getElementById('wb-name').value = '';
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    btn.textContent = 'Save painting';
    btn.disabled = false;
    loadGallery();
  }, 'image/png');
});

async function loadGallery() {
  const gallery = document.getElementById('wb-gallery');
  gallery.textContent = '';

  const { data, error } = await wbClient
    .from('whiteboard')
    .select('name, image_url, created_at')
    .order('created_at', { ascending: false });

  if (error || !data.length) return;

  data.forEach(entry => {
    const div = document.createElement('div');
    div.className = 'wb-painting-wrap';
    const date = new Date(entry.created_at).toLocaleDateString('en-GB', {
      day: 'numeric', month: 'short', year: 'numeric'
    });
    div.innerHTML = `
      <img class="wb-painting" src="${entry.image_url}" alt="Painting by ${escapeHtml(entry.name)}" loading="lazy">
      <div class="wb-painting-meta">
        <span class="wb-painting-name">${escapeHtml(entry.name)}</span>
        <span class="wb-painting-date">${date}</span>
      </div>
    `;
    gallery.appendChild(div);
  });
}

function escapeHtml(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

loadGallery();
