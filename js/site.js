(function () {
  var d = document.documentElement;
  var THEMES = ['daylight', 'paper', 'midnight', 'terminal'];
  var DARK = ['midnight', 'terminal'];

  function save(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  function setTheme(t) { d.setAttribute('data-theme', t); save('ua-theme', t); }
  function setBg(b) { d.setAttribute('data-bg', b); save('ua-bg', b); }
  function theme() { return d.getAttribute('data-theme'); }
  function cycleTheme() { setTheme(THEMES[(THEMES.indexOf(theme()) + 1) % THEMES.length]); }
  function toggleMode() { setTheme(DARK.indexOf(theme()) < 0 ? 'midnight' : 'daylight'); }
  function toggleBg() { setBg(d.getAttribute('data-bg') === 'off' ? 'graph' : 'off'); }

  var $ = function (id) { return document.getElementById(id); };
  if ($('mode-toggle')) $('mode-toggle').onclick = toggleMode;
  if ($('theme-toggle')) $('theme-toggle').onclick = cycleTheme;

  // work list: newest first, chip + text filtering
  var list = $('worklist'), kind = 'all', query = '';
  if (list) {
    Array.prototype.slice.call(list.children)
      .sort(function (a, b) { return b.dataset.date.localeCompare(a.dataset.date); })
      .forEach(function (li) { list.appendChild(li); });
    document.querySelectorAll('.chip').forEach(function (c) {
      c.onclick = function () {
        document.querySelectorAll('.chip').forEach(function (x) { x.classList.toggle('on', x === c); });
        kind = c.dataset.kind; filter();
      };
    });
  }
  function filter() {
    if (!list) return 0;
    var shown = 0;
    Array.prototype.forEach.call(list.children, function (li) {
      var ok = (kind === 'all' || li.dataset.kind === kind) &&
               (!query || li.textContent.toLowerCase().indexOf(query) >= 0);
      li.hidden = !ok; if (ok) shown++;
    });
    return shown;
  }

  // command box: plain text filters work, ":" runs a command
  var cmd = $('cmd'), out = $('cmd-out');
  function say(s) { if (out) out.textContent = s; }
  if (cmd) {
    cmd.addEventListener('input', function () {
      if (cmd.value.charAt(0) === ':') return;
      query = cmd.value.trim().toLowerCase();
      var n = filter();
      say(query ? n + ' match' + (n === 1 ? '' : 'es') + ' in work ↓' : '');
    });
    cmd.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') { cmd.value = ''; query = ''; filter(); say(''); cmd.blur(); return; }
      if (e.key !== 'Enter') return;
      var v = cmd.value.trim(), parts = v.slice(1).split(/\s+/);
      if (v.charAt(0) !== ':') { if (query) $('work').scrollIntoView(); return; }
      if (parts[0] === 'theme' && THEMES.indexOf(parts[1]) >= 0) { setTheme(parts[1]); say('theme → ' + parts[1]); }
      else if (parts[0] === 'bg' && (parts[1] === 'graph' || parts[1] === 'off')) { setBg(parts[1]); say('background → ' + parts[1]); }
      else if (parts[0] === 'help') say(':theme ' + THEMES.join('|') + ' · :bg graph|off · type anything to filter work');
      else say('unknown command, try :help');
      cmd.value = '';
    });
  }

  document.addEventListener('keydown', function (e) {
    var tag = (e.target.tagName || '').toLowerCase();
    if (tag === 'input' || tag === 'textarea' || e.metaKey || e.ctrlKey || e.altKey) return;
    if (e.key === '/' && cmd) { e.preventDefault(); cmd.focus(); }
    else if (e.key === 'd') toggleMode();
    else if (e.key === 't') cycleTheme();
    else if (e.key === 'b') toggleBg();
  });

  // background: drifting nodes joined by nearby edges
  var cv = $('bg-canvas');
  if (!cv || !cv.getContext) return;
  var ctx = cv.getContext('2d'), nodes = [], W = 0, H = 0, dpr = window.devicePixelRatio || 1;
  var still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function resize() {
    W = window.innerWidth; H = window.innerHeight;
    cv.width = W * dpr; cv.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    var count = Math.min(70, Math.round(W * H / 22000));
    nodes = [];
    for (var i = 0; i < count; i++) nodes.push({ x: Math.random() * W, y: Math.random() * H, vx: (Math.random() - .5) * .25, vy: (Math.random() - .5) * .25 });
  }
  function frame() {
    if (d.getAttribute('data-bg') !== 'off') {
      var rgb = getComputedStyle(d).getPropertyValue('--edge').trim(), R = 130;
      ctx.clearRect(0, 0, W, H);
      for (var i = 0; i < nodes.length; i++) {
        var a = nodes[i];
        if (!still) { a.x += a.vx; a.y += a.vy; if (a.x < 0 || a.x > W) a.vx *= -1; if (a.y < 0 || a.y > H) a.vy *= -1; }
        for (var j = i + 1; j < nodes.length; j++) {
          var b = nodes[j], dist = Math.hypot(a.x - b.x, a.y - b.y);
          if (dist < R) {
            ctx.strokeStyle = 'rgba(' + rgb + ',' + (0.16 * (1 - dist / R)) + ')';
            ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
          }
        }
        ctx.fillStyle = 'rgba(' + rgb + ',.35)';
        ctx.beginPath(); ctx.arc(a.x, a.y, 1.6, 0, 6.283); ctx.fill();
      }
    }
    if (!still) requestAnimationFrame(frame);
  }
  window.addEventListener('resize', function () { resize(); if (still) frame(); });
  resize(); frame();
}());
