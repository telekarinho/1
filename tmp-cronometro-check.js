
    const TARGET = 10.0;
    const NEAR = 0.05;
    const CLOSE = 0.1;
    const RANKING_KEY = 'milkypot_challenge_ranking_v2';
    const ATTEMPTS_KEY = 'milkypot_challenge_attempts_v2';
    const els = {
      counter: document.getElementById('counterValue'),
      status: document.getElementById('statusMessage'),
      mainAction: document.getElementById('mainAction'),
      retryAction: document.getElementById('retryAction'),
      copyStoryAction: document.getElementById('copyStoryAction'),
      shareAction: document.getElementById('shareAction'),
      resultTime: document.getElementById('resultTime'),
      resultDiff: document.getElementById('resultDiff'),
      resultDirection: document.getElementById('resultDirection'),
      resultTier: document.getElementById('resultTier'),
      resultFlavor: document.getElementById('resultFlavor'),
      attemptsDisplay: document.getElementById('attemptsDisplay'),
      winnerCard: document.getElementById('winnerCard'),
      confettiLayer: document.getElementById('confettiLayer'),
      idleCopy: document.getElementById('idleCopy'),
      storyPhrase: document.getElementById('storyPhrase'),
      prizeTitle: document.getElementById('prizeTitle'),
      prizeHint: document.getElementById('prizeHint'),
      prizeHeroText: document.getElementById('heroPrizeText'),
      rankingList: document.getElementById('rankingList'),
      cameraToggle: document.getElementById('cameraToggle'),
      photoAction: document.getElementById('photoAction'),
      videoAction: document.getElementById('videoAction'),
      cameraStream: document.getElementById('cameraStream'),
      photoPreview: document.getElementById('photoPreview'),
      cameraPlaceholder: document.getElementById('cameraPlaceholder'),
      cameraHint: document.getElementById('cameraHint'),
      captureCanvas: document.getElementById('captureCanvas')
    };
    let running = false, rafId = null, startTime = 0, elapsed = 0;
    let attempts = Number(localStorage.getItem(ATTEMPTS_KEY) || 0);
    let ranking = loadRanking();
    let idleIndex = 0, idleTimer = null;
    let currentPrize = 'Brinde especial Milkypot';
    let currentPrizeHint = 'Consulte o time da loja para validar a acao do dia.';
    let stream = null, mediaRecorder = null, recordedChunks = [], recordedUrl = '', cameraEnabled = false;
    const idleMessages = [
      () => 'Tente agora. A loja toda vai ver se voce sente o tempo melhor que todo mundo.',
      () => 'Quase levaram agora ha pouco. Seu toque pode ser o da virada.',
      () => 'Desafio oficial Milkypot no ar. Quem chega perto sempre quer mais uma.',
      () => ranking[0] ? `${ranking[0].name} lidera com diferenca de ${formatScore(ranking[0].diff)}.` : 'Ninguem lidera forte ainda. Pode ser a sua vez de aparecer no topo.'
    ];
    function formatTime(value) { return value.toFixed(3).padStart(6, '0'); }
    function formatScore(value) { return Number(value).toFixed(3); }
    function loadRanking() { try { return JSON.parse(localStorage.getItem(RANKING_KEY) || '[]'); } catch { return []; } }
    function saveRanking() { localStorage.setItem(RANKING_KEY, JSON.stringify(ranking.slice(0, 5))); }
    function updateAttempts() { els.attemptsDisplay.textContent = String(attempts); localStorage.setItem(ATTEMPTS_KEY, String(attempts)); }
    function renderRanking() {
      if (!ranking.length) {
        els.rankingList.innerHTML = '<div class="list-item"><div class="position">1</div><div><div class="entry-name">Sua loja ainda esta esperando a primeira lenda</div><div class="entry-meta">Jogue e inaugure o topo do dia.</div></div><strong>10.000</strong></div>';
        return;
      }
      els.rankingList.innerHTML = ranking.slice(0, 5).map((entry, index) => `
        <div class="list-item">
          <div class="position">${index + 1}</div>
          <div><div class="entry-name">${entry.name}</div><div class="entry-meta">Parou em ${formatTime(entry.time)} | diferenca ${formatScore(entry.diff)}</div></div>
          <strong>${formatScore(entry.diff)}</strong>
        </div>`).join('');
    }
    function setStoryPhrase(latestTime = null) {
      const phrase = latestTime === null
        ? 'Eu tentei acertar 10.000 na Milkypot. Voce consegue?'
        : `Eu parei em ${formatTime(latestTime)} no desafio Acerte 10.000 da Milkypot. Voce consegue chegar mais perto?`;
      els.storyPhrase.textContent = phrase;
      return phrase;
    }
    function updateIdleCopy() { els.idleCopy.textContent = idleMessages[idleIndex % idleMessages.length](); idleIndex += 1; }
    function startIdleRotation() { stopIdleRotation(); updateIdleCopy(); idleTimer = setInterval(updateIdleCopy, 4600); }
    function stopIdleRotation() { if (idleTimer) { clearInterval(idleTimer); idleTimer = null; } }
    function createConfetti() {
      els.confettiLayer.innerHTML = '';
      const colors = ['#ff5db4', '#ffcf6f', '#66b8ff', '#7f5bff', '#77e4b4'];
      for (let i = 0; i < 34; i += 1) {
        const piece = document.createElement('span');
        piece.className = 'confetti-piece';
        piece.style.left = `${Math.random() * 100}%`;
        piece.style.top = `${Math.random() * 12}%`;
        piece.style.background = colors[i % colors.length];
        piece.style.animationDelay = `${Math.random() * .35}s`;
        els.confettiLayer.appendChild(piece);
      }
      setTimeout(() => { els.confettiLayer.innerHTML = ''; }, 2200);
    }
    function setStatus(message, mode = '') {
      els.status.textContent = message;
      els.status.classList.toggle('hot', mode === 'hot');
      els.status.classList.toggle('win', mode === 'win');
    }
    function loop(now) {
      elapsed = (now - startTime) / 1000;
      els.counter.textContent = formatTime(elapsed);
      rafId = requestAnimationFrame(loop);
    }
    function resetVisualState() {
      els.counter.classList.remove('running', 'win');
      els.winnerCard.classList.remove('show');
      els.mainAction.classList.remove('secondary');
    }
    function startChallenge() {
      running = true;
      elapsed = 0;
      startTime = performance.now();
      resetVisualState();
      stopIdleRotation();
      els.counter.textContent = '00.000';
      els.counter.classList.add('running');
      els.mainAction.textContent = 'Parar em 10.000';
      els.mainAction.classList.add('secondary');
      setStatus('Valendo. Sinta o tempo e toque no instante perfeito.', 'hot');
      if (cameraEnabled) startRecording();
      rafId = requestAnimationFrame(loop);
    }
    function stopChallenge() {
      running = false;
      cancelAnimationFrame(rafId);
      els.counter.classList.remove('running');
      els.mainAction.textContent = 'Comecar desafio';
      els.mainAction.classList.remove('secondary');
      attempts += 1;
      updateAttempts();
      if (cameraEnabled) stopRecording();
      const diff = Math.abs(elapsed - TARGET);
      const direction = elapsed < TARGET ? `Faltaram ${formatScore(TARGET - elapsed)} para a meta.` : `Passou ${formatScore(elapsed - TARGET)} da meta.`;
      els.resultTime.textContent = formatTime(elapsed);
      els.resultDiff.textContent = formatScore(diff);
      els.resultDirection.textContent = direction;
      setStoryPhrase(elapsed);
      let tier = 'De novo';
      let flavor = 'Agora voce ja sentiu o ritmo. A proxima quase sempre vem mais afiada.';
      let status = 'Foi forte, mas ainda da para lapidar mais.';
      let mode = '';
      if (diff === 0) {
        tier = 'Premio';
        flavor = `Voce cravou a meta e desbloqueou ${currentPrize}.`;
        status = 'VOCE ACERTOU 10.000!';
        mode = 'win';
        els.counter.classList.add('win');
        els.winnerCard.classList.add('show');
        createConfetti();
      } else if (diff <= NEAR) {
        tier = 'Quase levou';
        flavor = 'Foi por muito pouco. Essa foi tentativa de quem esta perigando ganhar.';
        status = 'Nossa. Foi por um sopro.';
        mode = 'hot';
      } else if (diff <= CLOSE) {
        tier = 'Muito perto';
        flavor = 'Esse resultado ja deixa todo mundo querendo ver a revanche.';
        status = 'Passou perto de verdade.';
        mode = 'hot';
      }
      els.resultTier.textContent = tier;
      els.resultFlavor.textContent = flavor;
      setStatus(status, mode);
      pushRanking(elapsed, diff);
      startIdleRotation();
    }
    function pushRanking(time, diff) {
      const name = diff === 0 ? 'Lenda Milkypot' : randomName();
      ranking.push({ name, time, diff, createdAt: Date.now() });
      ranking.sort((a, b) => a.diff - b.diff || a.createdAt - b.createdAt);
      ranking = ranking.slice(0, 5);
      saveRanking();
      renderRanking();
    }
    function randomName() {
      const first = ['Cliente', 'Visitante', 'Milkylover', 'Desafiante', 'Streamer', 'Craque'];
      const second = ['Rosa', 'Brilho', 'Doce', 'Lucky', 'Candy', 'Pop'];
      return `${first[Math.floor(Math.random() * first.length)]} ${second[Math.floor(Math.random() * second.length)]}`;
    }
    async function copyStory() {
      try {
        await navigator.clipboard.writeText(els.storyPhrase.textContent);
        setStatus('Frase copiada. Agora e so mandar no grupo e desafiar alguem.', 'hot');
      } catch {
        setStatus('Nao consegui copiar aqui. Mas a frase ja esta pronta na tela.', 'hot');
      }
    }
    async function shareStory() {
      const text = els.storyPhrase.textContent;
      if (navigator.share) {
        try { await navigator.share({ title: 'Acerte 10.000 | Milkypot', text, url: window.location.href }); return; } catch {}
      }
      copyStory();
    }
    async function toggleCamera() {
      if (cameraEnabled) { disableCamera(); return; }
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: true });
        cameraEnabled = true;
        els.cameraStream.srcObject = stream;
        els.cameraStream.style.display = 'block';
        els.cameraPlaceholder.style.display = 'none';
        els.photoAction.disabled = false;
        els.cameraToggle.textContent = 'Desativar camera';
        els.cameraHint.textContent = 'Foto antes da rodada e gravacao automatica durante o jogo ativadas.';
      } catch {
        els.cameraHint.textContent = 'Permissao negada ou camera indisponivel. O desafio continua sem camera.';
      }
    }
    function disableCamera() {
      cameraEnabled = false;
      if (stream) { stream.getTracks().forEach(track => track.stop()); stream = null; }
      if (recordedUrl) { URL.revokeObjectURL(recordedUrl); recordedUrl = ''; }
      els.cameraStream.srcObject = null;
      els.cameraStream.style.display = 'none';
      els.photoPreview.style.display = 'none';
      els.cameraPlaceholder.style.display = 'grid';
      els.photoAction.disabled = true;
      els.videoAction.disabled = true;
      els.cameraToggle.textContent = 'Ativar camera';
      els.cameraHint.textContent = 'A camera e opcional. Sem permissao, o desafio continua normal.';
    }
    function takePhoto() {
      if (!stream) return;
      const video = els.cameraStream;
      const canvas = els.captureCanvas;
      canvas.width = video.videoWidth || 1080;
      canvas.height = video.videoHeight || 1440;
      canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height);
      els.photoPreview.src = canvas.toDataURL('image/jpeg', 0.92);
      els.photoPreview.style.display = 'block';
      els.cameraHint.textContent = 'Foto capturada. Agora comeca a rodada e a sua reacao pode ser gravada.';
    }
    function startRecording() {
      if (!stream || typeof MediaRecorder === 'undefined') return;
      recordedChunks = [];
      try {
        mediaRecorder = new MediaRecorder(stream, { mimeType: 'video/webm;codecs=vp8,opus' });
      } catch {
        mediaRecorder = new MediaRecorder(stream);
      }
      mediaRecorder.ondataavailable = event => { if (event.data && event.data.size > 0) recordedChunks.push(event.data); };
      mediaRecorder.onstop = () => {
        if (!recordedChunks.length) return;
        if (recordedUrl) URL.revokeObjectURL(recordedUrl);
        recordedUrl = URL.createObjectURL(new Blob(recordedChunks, { type: 'video/webm' }));
        els.videoAction.disabled = false;
        els.cameraHint.textContent = 'Video da reacao pronto para baixar.';
      };
      mediaRecorder.start();
    }
    function stopRecording() { if (mediaRecorder && mediaRecorder.state !== 'inactive') mediaRecorder.stop(); }
    function downloadVideo() {
      if (!recordedUrl) return;
      const link = document.createElement('a');
      link.href = recordedUrl;
      link.download = `milkypot-reacao-${Date.now()}.webm`;
      link.click();
    }
    function bindEvents() {
      els.mainAction.addEventListener('click', () => { if (running) stopChallenge(); else startChallenge(); });
      els.retryAction.addEventListener('click', () => {
        cancelAnimationFrame(rafId);
        running = false;
        elapsed = 0;
        resetVisualState();
        els.counter.textContent = '00.000';
        els.resultTime.textContent = '--.---';
        els.resultDiff.textContent = '--.---';
        els.resultDirection.textContent = 'Ainda sem tentativa.';
        els.resultTier.textContent = 'Valendo';
        els.resultFlavor.textContent = 'Toda lenda comeca na primeira tentativa.';
        setStatus('Respira, sorri e tenta de novo. O 10.000 ainda esta te esperando.');
        startIdleRotation();
      });
      els.copyStoryAction.addEventListener('click', copyStory);
      els.shareAction.addEventListener('click', shareStory);
      els.cameraToggle.addEventListener('click', toggleCamera);
      els.photoAction.addEventListener('click', takePhoto);
      els.videoAction.addEventListener('click', downloadVideo);
    }
    function applyChallengeSettings(settings = {}) {
      currentPrize = settings.challengePrize || currentPrize;
      currentPrizeHint = settings.challengePrizeHint || currentPrizeHint;
      els.prizeTitle.textContent = currentPrize;
      els.prizeHint.textContent = currentPrizeHint;
      els.prizeHeroText.textContent = currentPrize;
      if (!running) setStoryPhrase();
    }
    async function loadChallengeSettings() {
      try {
        if (window.DataStore && typeof DataStore.get === 'function') {
          const settings = await DataStore.get('settings');
          if (settings) applyChallengeSettings(settings);
          return;
        }
      } catch {}
      try {
        if (window.DataStore && DataStore._db) {
          const snap = await DataStore._db.collection('datastore').doc('settings').get();
          if (snap.exists) {
            const payload = snap.data();
            const value = JSON.parse(payload.value || '{}');
            applyChallengeSettings(value);
          }
        }
      } catch {}
    }
    function init() {
      bindEvents();
      updateAttempts();
      renderRanking();
      setStoryPhrase();
      setStatus('Um toque para comecar. Um toque para tentar entrar para a historia da loja.');
      startIdleRotation();
      loadChallengeSettings();
    }
    init();
  