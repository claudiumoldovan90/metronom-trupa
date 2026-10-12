// Metronom de trupă — server de sincronizare.
// Servește pagina și ține camerele: tempoul e păstrat aici, în ceasul serverului,
// iar fiecare telefon își calculează diferența de ceas față de server prin ping-pong.

const http = require('http');
const fs = require('fs');
const path = require('path');
const { WebSocketServer } = require('ws');

const PORT = process.env.PORT || 3000;
const now = () => performance.timeOrigin + performance.now();

// ---------- pagina ----------
const pagePath = path.join(__dirname, 'public', 'index.html');
const server = http.createServer((req, res) => {
  const url = req.url.split('?')[0];
  if (url === '/health') { res.writeHead(200, { 'content-type': 'text/plain' }); return res.end('ok'); }
  if (url === '/' || url === '/index.html') {
    fs.readFile(pagePath, (err, buf) => {
      if (err) { res.writeHead(500); return res.end('Pagina lipsește'); }
      res.writeHead(200, { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-cache' });
      res.end(buf);
    });
    return;
  }
  res.writeHead(404, { 'content-type': 'text/plain' }); res.end('Nu există');
});

// ---------- camere ----------
// room = { code, pin, leader: clientId|null, st, clients: Map<id, client> }
const rooms = new Map();
let nextId = 1;

const clean = (s, max) => String(s ?? '').replace(/[\u0000-\u001f\u007f]/g, '').trim().slice(0, max);
const roomCode = s => clean(s, 40).toLowerCase().replace(/[^a-z0-9_.-]+/g, '-').replace(/^[-_.]+/, '');

function newState() { return { bpm: 100, beats: 4, running: false, startAt: 0, beat0: 0, epoch: 0 }; }

function send(c, msg) { if (c.ws.readyState === 1) c.ws.send(JSON.stringify(msg)); }

function broadcast(room) {
  const peers = [...room.clients.values()].map(c => ({ id: c.id, name: c.name, rtt: c.rtt }));
  for (const c of room.clients.values()) {
    send(c, { t: 'state', st: room.st, leader: room.leader, hasPin: !!room.pin, peers, now: now() });
  }
}

function setTempo(room, bpm, beats) {
  const st = room.st;
  bpm = Math.max(30, Math.min(260, Math.round(Number(bpm) || st.bpm)));
  beats = Math.max(1, Math.min(12, Math.round(Number(beats) || st.beats)));
  const next = { ...st, bpm, beats, epoch: st.epoch + 1 };
  if (st.running) {
    // schimbarea intră pe primul timp al grilei vechi aflat la cel puțin 200 ms în viitor,
    // ca toată lumea să primească mesajul înainte -> fără pauză și fără timp dublat
    const p = 60000 / st.bpm;
    const i = Math.max(0, Math.ceil((now() + 200 - st.startAt) / p));
    next.startAt = st.startAt + i * p;
    next.beat0 = beats !== st.beats ? 0 : (st.beat0 + i) % st.beats;
  }
  room.st = next;
}

const wss = new WebSocketServer({ server, path: '/ws', maxPayload: 4096 });

wss.on('connection', ws => {
  const c = { id: String(nextId++), ws, name: 'Muzician', rtt: null, room: null };
  send(c, { t: 'hello', id: c.id });

  ws.on('message', raw => {
    let m; try { m = JSON.parse(raw); } catch { return; }
    if (!m || typeof m !== 'object') return;
    const room = c.room;

    switch (m.t) {
      case 'ping': // sincronizarea ceasului: răspunde imediat cu ora serverului
        if (Number.isFinite(m.c)) send(c, { t: 'pong', c: m.c, s: now() });
        return;

      case 'join': {
        const code = roomCode(m.room);
        if (!code) return send(c, { t: 'err', msg: 'Codul camerei e gol.' });
        if (c.room) leave(c);
        c.name = clean(m.name, 24) || 'Muzician';
        let r = rooms.get(code);
        if (!r) { r = { code, pin: clean(m.pin, 12) || null, leader: null, st: newState(), clients: new Map() }; rooms.set(code, r); }
        r.clients.set(c.id, c); c.room = r;
        if (m.lead) {
          if (!r.pin || clean(m.pin, 12) === r.pin) r.leader = c.id;
          else send(c, { t: 'err', msg: 'Camera are PIN și cel introdus e greșit. Ai intrat ca membru.' });
        }
        send(c, { t: 'joined', room: code });
        return broadcast(r);
      }

      case 'claim':
        if (!room) return;
        if (room.pin && clean(m.pin, 12) !== room.pin) return send(c, { t: 'err', msg: 'PIN greșit.' });
        room.leader = c.id;
        return broadcast(room);

      case 'rtt':
        if (!room || !Number.isFinite(m.v)) return;
        c.rtt = Math.max(0, Math.min(5000, Math.round(m.v)));
        return broadcast(room);

      case 'tempo':
        if (!room || room.leader !== c.id) return;
        setTempo(room, m.bpm, m.beats);
        return broadcast(room);

      case 'start':
        if (!room || room.leader !== c.id || room.st.running) return;
        room.st = { ...room.st, running: true, startAt: now() + 900, beat0: 0, epoch: room.st.epoch + 1 };
        return broadcast(room);

      case 'stop':
        if (!room || room.leader !== c.id || !room.st.running) return;
        room.st = { ...room.st, running: false, epoch: room.st.epoch + 1 };
        return broadcast(room);
    }
  });

  ws.on('close', () => leave(c));
});

function leave(c) {
  const r = c.room; if (!r) return;
  r.clients.delete(c.id); c.room = null;
  if (r.leader === c.id) r.leader = null; // tempoul continuă; altcineva poate prelua
  if (r.clients.size === 0) rooms.delete(r.code);
  else broadcast(r);
}

// conexiunile moarte (telefon blocat, rețea pierdută) sunt închise; ține și proxy-ul hostului treaz
setInterval(() => {
  for (const ws of wss.clients) {
    if (ws._mtDead) { ws.terminate(); continue; }
    ws._mtDead = true;
    ws.once('pong', () => { ws._mtDead = false; });
    try { ws.ping(); } catch {}
  }
}, 25000);

server.listen(PORT, () => console.log(`Metronom de trupă pornit pe portul ${PORT}`));
