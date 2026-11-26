/* =========================================================
   TikTok LIVE HỌC TOÁN — Game Engine (Plain ES6+ JS)
   Clone từ game Đoán Từ (26/11): giữ nguyên toàn bộ cơ chế
   (bình luận đáp án, vòng 15s, điểm +3/+2/+1, Top 3, quà + perk,
   giọng MC vi-VN, dọc 1080x1920, Pages + Ably) — chỉ đổi nội
   dung sang toán cộng/trừ/nhân/chia dưới 1000 (chia hết).
   Works 100% standalone via index.html (Demo Mode) OR with
   Ably realtime (server-ably.js publishes comments via Ably
   REST, this page subscribes via the Ably JS SDK).
   ========================================================= */

(() => {
  'use strict';

  // -----------------------------
  // DOM References
  // -----------------------------
  const els = {
    appShell: document.getElementById('app-shell'),
    stageViewport: document.getElementById('stage-viewport'),
    gameStage: document.getElementById('game-stage'),
    confettiCanvas: document.getElementById('confetti-canvas'),

    winnerToast: document.getElementById('winner-toast'),
    winnerToastText: document.getElementById('winner-toast-text'),

    giftToast: document.getElementById('gift-toast'),
    giftToastText: document.getElementById('gift-toast-text'),
    giftToastAvatar: document.getElementById('gift-toast-avatar'),

    connectionPill: document.getElementById('connection-pill'),
    connectionLabel: document.getElementById('connection-label'),

    questionStage: document.getElementById('question-stage'),
    teaseLayer: document.getElementById('tease-layer'),
    teacherFigure: document.querySelector('.teacher-figure'),
    teacherScream: document.getElementById('teacher-scream'),
    questionNumber: document.getElementById('question-number'),
    directionBadge: document.getElementById('direction-badge'),
    roundStatusPill: document.getElementById('round-status-pill'),
    topicBadge: document.getElementById('topic-badge'),
    questionText: document.getElementById('question-text'),
    letterBoxes: document.getElementById('letter-boxes'),

    hintChips: document.getElementById('hint-chips'),
    hintInstruction: document.getElementById('hint-instruction'),
    hintWordType: document.getElementById('hint-word-type'),
    hintLetterCount: document.getElementById('hint-letter-count'),
    hintFirstLetter: document.getElementById('hint-first-letter'),

    guessingStatus: document.getElementById('guessing-status'),
    guessingStatusIcon: document.getElementById('guessing-status-icon'),
    guessingStatusText: document.getElementById('guessing-status-text'),

    revealCard: document.getElementById('reveal-card'),
    revealIpa: document.getElementById('reveal-ipa'),
    revealMeaning: document.getElementById('reveal-meaning'),
    revealExample: document.getElementById('reveal-example'),
    revealWinnerLine: document.getElementById('reveal-winner-line'),
    nextCountdownPill: document.getElementById('next-countdown-pill'),

    timerSection: document.getElementById('timer-section'),
    timerValue: document.getElementById('timer-value'),
    timerTrack: document.getElementById('timer-track'),
    timerBarFill: document.getElementById('timer-bar-fill'),

    totalPlayersLabel: document.getElementById('total-players-label'),
    top3Slots: [
      document.getElementById('top3-slot-1'),
      document.getElementById('top3-slot-2'),
      document.getElementById('top3-slot-3')
    ],
    leaderboardList: document.getElementById('leaderboard-list'),
    donorList: document.getElementById('donor-list'),
    commentFeed: document.getElementById('comment-feed'),
    commentCount: document.getElementById('comment-count'),

    endScreen: document.getElementById('end-screen'),
    endPodium: document.getElementById('end-podium'),
    endCountdown: document.getElementById('end-countdown'),
    statQuestions: document.getElementById('stat-questions'),
    statPlayers: document.getElementById('stat-players'),
    statComments: document.getElementById('stat-comments'),
    btnReplay: document.getElementById('btn-replay'),

    // Host Controls
    hostPanel: document.getElementById('host-panel'),
    btnHidePanel: document.getElementById('btn-hide-panel'),
    btnShowPanel: document.getElementById('btn-show-panel'),
    btnStartPause: document.getElementById('btn-start-pause'),
    btnNext: document.getElementById('btn-next'),
    btnReveal: document.getElementById('btn-reveal'),
    btnReset: document.getElementById('btn-reset'),
    inputDuration: document.getElementById('input-duration'),
    btnApplyDuration: document.getElementById('btn-apply-duration'),
    durationDisplay: document.getElementById('duration-display'),
    presetBtns: document.querySelectorAll('.preset-btn'),
    inputJumpQuestion: document.getElementById('input-jump-question'),
    btnJumpQuestion: document.getElementById('btn-jump-question'),
    currentQDisplay: document.getElementById('current-q-display'),
    toggleDemo: document.getElementById('toggle-demo'),
    toggleAutoNext: document.getElementById('toggle-auto-next'),
    toggleSfx: document.getElementById('toggle-sfx'),
    toggleMusic: document.getElementById('toggle-music'),
    toggleVoice: document.getElementById('toggle-voice'),
    wsStatus: document.getElementById('ws-status'),
    inputTiktokUser: document.getElementById('input-tiktok-user'),
    btnConnectTiktok: document.getElementById('btn-connect-tiktok'),
    inputTestUser: document.getElementById('input-test-user'),
    inputTestComment: document.getElementById('input-test-comment'),
    btnSendTest: document.getElementById('btn-send-test')
  };

  // -----------------------------
  // Demo Mode Data Pools
  // -----------------------------
  const DEMO_PLAYERS = [
    'Minh Anh', 'Hùng Nguyễn', 'Thảo Vy', 'Tuấn Kiệt', 'Bảo Ngọc',
    'Quốc Bảo', 'Lan Phương', 'Đức Huy', 'Ngọc Trâm', 'Gia Hưng',
    'Khánh Linh', 'Hoàng Nam', 'Phương Thảo', 'Trung Hiếu', 'Mỹ Duyên',
    'Anh Thư', 'Nhật Minh', 'Thanh Trúc', 'Văn Lâm', 'Tường Vi',
    'Bích Ngọc', 'Hải Đăng', 'Yến Nhi', 'Đăng Khoa'
  ];

  const DEMO_CHATTER = [
    'Bài này quen quá!',
    'Đợi xíu đang tính...',
    'Khó nha ad ơi 😅',
    'Gần ra rồi!',
    'Ai tính ra chưa?',
    'Học toán vui ghê 🔥'
  ];

  const AVATAR_COLORS = [
    '#ffd43b', '#38bdf8', '#4ade80', '#fb923c', '#f472b6', '#a3e635', '#22d3ee', '#facc15'
  ];

  // -----------------------------
  // Application State
  // -----------------------------
  const REVEAL_DURATION_SEC = 8.5; // +3s sau khi hết giờ để đọc người trả lời nhanh nhất / giao lưu (Cơ 24/11 20:12).
  const END_SCREEN_AUTO_RESTART_SEC = 10; // honour Top 3, then auto-start a fresh round
  const MAX_VISIBLE_COMMENTS = 10;

  const state = {
    questions: [],
    currentIndex: 0,
    phase: 'playing', // 'playing' | 'revealing' | 'ended'
    isRunning: true,
    questionDuration: 45,
    timeLeft: 45,
    revealTimeLeft: REVEAL_DURATION_SEC,
    roundWinner: null,
    roundScorers: [], // [{ name, points }] in correct-guess order, max 10 per round
    scores: new Map(), // key: lowerName -> { name, score, lastScoredAt }
    totalComments: 0,
    demoMode: true,
    autoNext: true,
    sfxEnabled: true,
    musicOn: true,
    voiceOn: true,
    lastUtteranceAt: 0, // mốc lần speak gần nhất — để nhận biết hàng đợi bị kẹt
    voiceCache: {},
    lastSpeak: 0,
    commenters: new Map(), // lowerName -> { name, count, lastCheer }
    greetedUsers: new Set(),
    voiceFlags: { p10: false, p5: false },
    standingsTimer: null,
    revealCheerTimer: null,
    obsMode: false,
    tiktokConnected: false,
    tiktokUsername: '',
    viewerCount: 0,
    lastTickWholeSec: 45,
    demoTimers: [],
    toastTimer: null,
    endScreenTimer: null,
    endScreenAt: 0,
    ably: null,
    ablyChannel: null,
    ablyConnected: false,
    ablyAttachedOnce: false,
    pageLoadTs: Date.now(), // lọc bình luận cũ khi (re)subscribe
    seenMsgIds: new Set(), // chống trùng khi Ably replay sau reconnect
    // --- Quà tặng + chủ đề (THÊM 24/11) ---
    bonusSecondsThisRound: 0, // tổng số giây đã cộng thêm trong vòng này (trần 20s)
    revealedDigitIdx: new Set(), // index ký tự đáp án đã hé lộ (ô chữ)
    hardModeQuestionsLeft: 0, // số câu tiếp theo còn ẩn gợi ý
    hintsHidden: false, // câu hiện tại có đang ẩn gợi ý không
    topics: [], // tên chủ đề theo thứ tự xuất hiện trong questions.json
    topicIndices: {}, // topic -> [index câu]
    giftToastTimer: null,
    donors: new Map() // key: lowerName -> { name, avatar, totalCoins, giftCount, firstGiftAt }
  };

  // -----------------------------
  // URL Query Parameters
  // -----------------------------
  const params = new URLSearchParams(window.location.search);
  if (params.get('obs') === '1' || params.get('clean') === '1') {
    state.obsMode = true;
  }
  if (params.get('demo') === '0' || params.get('live') === '1') {
    state.demoMode = false;
  }
  const paramTime = parseInt(params.get('time') || params.get('duration') || '', 10);
  if (!Number.isNaN(paramTime) && paramTime >= 5 && paramTime <= 180) {
    state.questionDuration = paramTime;
    state.timeLeft = paramTime;
  }
  const paramStart = parseInt(params.get('start') || '', 10);
  // ?tease=N: tự trêu cô giáo 1 lần sau khi tải (N = số xu, 1–99) — chỉ để
  // kiểm chứng trực quan, không ảnh hưởng game thật (không có tham số thì thôi).
  const paramTease = parseInt(params.get('tease') || '', 10);

  // -----------------------------
  // Web Audio Synthesized SFX
  // -----------------------------
  let audioCtx = null;

  function ensureAudioCtx() {
    if (!state.sfxEnabled) return null;
    try {
      if (!audioCtx) {
        const Ctx = window.AudioContext || window.webkitAudioContext;
        if (Ctx) audioCtx = new Ctx();
      }
      if (audioCtx && audioCtx.state === 'suspended') {
        audioCtx.resume().catch(() => {});
      }
      return audioCtx;
    } catch {
      return null;
    }
  }

  function playTone(freq, duration, type = 'sine', volume = 0.12, delay = 0) { // +50% (Cơ 24/11 20:49).
    const ctx = ensureAudioCtx();
    if (!ctx) return;
    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const start = ctx.currentTime + delay;
      osc.type = type;
      osc.frequency.setValueAtTime(freq, start);
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(volume, start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(start);
      osc.stop(start + duration + 0.02);
    } catch {
      // Ignore autoplay blocks gracefully
    }
  }

  function playCorrectSfx() {
    playTone(587.33, 0.14, 'triangle', 0.18, 0);
    playTone(880.0, 0.24, 'triangle', 0.21, 0.1);
  }

  function playRevealSfx() {
    playTone(523.25, 0.14, 'triangle', 0.15, 0);
    playTone(659.25, 0.14, 'triangle', 0.15, 0.09);
    playTone(783.99, 0.16, 'triangle', 0.165, 0.18);
    playTone(1046.5, 0.34, 'triangle', 0.195, 0.27);
  }

  function playTickSfx() {
    playTone(720, 0.06, 'sine', 0.075, 0);
  }

  // Trượt tần số (boing / rơi) — dùng cho trò trêu cô giáo.
  function playSlide(freqFrom, freqTo, duration, type = 'sine', volume = 0.12, delay = 0) {
    const ctx = ensureAudioCtx();
    if (!ctx) return;
    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const start = ctx.currentTime + delay;
      osc.type = type;
      osc.frequency.setValueAtTime(freqFrom, start);
      osc.frequency.linearRampToValueAtTime(freqTo, start + duration);
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(volume, start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(start);
      osc.stop(start + duration + 0.02);
    } catch {
      // Ignore autoplay blocks gracefully
    }
  }

  // Đáp án sai: tiếng "bụp" trầm 2 nốt đi xuống (chống spam 2s).
  function playWrongSfx() {
    const now = Date.now();
    if (now - (state.lastWrongSfxAt || 0) < 2000) return;
    state.lastWrongSfxAt = now;
    playTone(233.08, 0.18, 'sawtooth', 0.07, 0);
    playTone(174.61, 0.26, 'sawtooth', 0.07, 0.12);
  }

  // Quà tới: chuông 3 nốt; quà lớn thêm nốt cao (chống spam 1,5s với quà nhỏ).
  function playGiftSfx(coins) {
    const now = Date.now();
    if (coins < 10 && now - (state.lastGiftSfxAt || 0) < 1500) return;
    state.lastGiftSfxAt = now;
    playTone(523.25, 0.12, 'triangle', 0.16, 0);
    playTone(659.25, 0.12, 'triangle', 0.16, 0.07);
    playTone(783.99, 0.2, 'triangle', 0.18, 0.14);
    if (coins >= 10) playTone(1046.5, 0.3, 'triangle', 0.18, 0.21);
    if (coins >= 20) {
      playTone(1318.5, 0.3, 'triangle', 0.16, 0.3);
      playTone(1567.98, 0.35, 'triangle', 0.15, 0.38);
    }
  }

  // Tiếng trò trêu cô giáo theo mức quà — MỖI TRÒ CÓ TIẾNG RIÊNG (Cơ 26/11):
  // gián rơi (trượt xuống) + cô la "Á!" bằng giọng MC; chuột chíu 3 tiếng +
  // boing khi cô nhảy; nhện (trượt rợn) + tiếng nhịp thục dầu; mức 20 xu+
  // gộp cả bộ. Tiếng la "Á!" nằm trong câu cảm ơn của MC (cùng 1 lần đọc).
  function playTeaseSfx(tierMin) {
    if (tierMin >= 20) {
      playTone(1400, 0.05, 'sine', 0.12, 0);
      playTone(1650, 0.05, 'sine', 0.12, 0.07);
      playTone(1400, 0.05, 'sine', 0.12, 0.14);
      playSlide(700, 220, 0.28, 'sine', 0.12, 0.05);
      playSlide(300, 750, 0.22, 'sine', 0.12, 0.15);
      playTone(160, 0.3, 'triangle', 0.12, 0.2);
      // Nhịp thục dầu: 5 tiếng thump theo nhịp chống đẩy (bắt đầu sau cú nhảy)
      [1.4, 2.2, 3.0, 3.8, 4.6].forEach((d) => playTone(90, 0.12, 'sine', 0.14, d));
    } else if (tierMin >= 10) {
      playTone(160, 0.3, 'triangle', 0.12, 0);
      playSlide(420, 150, 0.3, 'sine', 0.1, 0.05);
      // Nhịp thục dầu: 5 tiếng thump theo nhịp chống đẩy
      [0.5, 1.35, 2.25, 3.15, 4.0].forEach((d) => playTone(90, 0.12, 'sine', 0.14, d));
    } else if (tierMin >= 2) {
      playTone(1400, 0.05, 'sine', 0.12, 0);
      playTone(1650, 0.05, 'sine', 0.12, 0.07);
      playTone(1400, 0.05, 'sine', 0.12, 0.14);
      playSlide(300, 750, 0.22, 'sine', 0.12, 0.05);
    } else {
      playSlide(700, 250, 0.25, 'sine', 0.12, 0);
    }
  }

  // Nhạc nền (Cơ 26/11): vòng nhạc hộp 8 giây, hợp âm C–G–Am–F, rất nhỏ
  // (0.045) để nằm dưới giọng MC. Chạy bằng setInterval; tắt/mở bằng
  // toggle "Nhạc nền" (cần bật cả "Âm thanh hiệu ứng" vì chung AudioContext).
  const MUSIC_BAR_MS = 8000;
  const MUSIC_MELODY = [659.25, 783.99, 1046.5, 783.99, 880.0, 783.99, 659.25, 523.25,
                        587.33, 659.25, 698.46, 659.25, 587.33, 523.25, 587.33, 659.25];
  const MUSIC_BASS = [130.81, 98.0, 110.0, 87.31]; // C3 G2 A2 F2, mỗi ô 2s
  function scheduleMusicBar() {
    if (!state.musicOn) return;
    const ctx = ensureAudioCtx();
    if (!ctx || ctx.state !== 'running') return;
    for (let i = 0; i < MUSIC_MELODY.length; i++) {
      playTone(MUSIC_MELODY[i], 0.42, 'triangle', 0.045, i * 0.5);
    }
    for (let b = 0; b < MUSIC_BASS.length; b++) {
      playTone(MUSIC_BASS[b], 1.8, 'sine', 0.05, b * 2);
    }
  }
  function startMusic() {
    if (state.musicTimer) return;
    scheduleMusicBar();
    state.musicTimer = setInterval(scheduleMusicBar, MUSIC_BAR_MS);
  }
  function stopMusic() {
    if (state.musicTimer) { clearInterval(state.musicTimer); state.musicTimer = null; }
  }

  // -----------------------------
  // Voice (BLV / TTS) — speechSynthesis
  // Same pattern as the zombie game (proven): vi-VN, rate 1.4, pitch 1.12.
  // Normal lines: at most 1 per 8s and never over a line already speaking.
  // Priority lines (new question, correct answer, end screen) cut in.
  // -----------------------------
  const VOICE_THROTTLE_MS = 8000;

  function pickVoice(lang) {
    try {
      if (!('speechSynthesis' in window)) return null;
      const want = String(lang || 'vi-VN').toLowerCase();
      if (state.voiceCache[want]) return state.voiceCache[want];
      const voices = speechSynthesis.getVoices() || [];
      const exact = voices.find((v) => (v.lang || '').toLowerCase() === want);
      const prefix = voices.find((v) => (v.lang || '').toLowerCase().startsWith(want.slice(0, 2)));
      const found = exact || prefix || null;
      state.voiceCache[want] = found;
      return found;
    } catch (e) { return null; }
  }

  if ('speechSynthesis' in window) {
    try { speechSynthesis.addEventListener('voiceschanged', () => { state.voiceCache = {}; }); } catch (e) {}
  }

  // Ưu tiên GIỌNG NỮ cho mọi câu đọc (Cơ 26/11: MC là cô giáo).
  // Trước đây chỉ câu tiếng Anh mới ưu tiên giọng nữ; giờ cả tiếng Việt
  // cũng vậy. speechSynthesis voices carry no gender flag, so match
  // well-known female voice names; fall back to the default pick when
  // no female voice is installed (giọng nghe được trên máy Cơ phụ thuộc
  // vào voice đã cài trên máy đó).
  const FEMALE_VOICE_HINTS = [
    'zira', 'samantha', 'aria', 'jenny', 'ava', 'allison', 'susan',
    'karen', 'moira', 'tessa', 'fiona', 'veena', 'google us english',
    'female',
    // Giọng nữ tiếng Việt (chỉ khớp trong voice cùng ngôn ngữ vi-VN):
    'linh', 'thu', 'ngan', 'lan', 'hoa', 'mai', 'huong', 'hanh',
    'google tiếng việt',
  ];

  function pickFemaleVoice(lang) {
    try {
      if (!('speechSynthesis' in window)) return null;
      const want = String(lang || 'en-US').toLowerCase();
      const key = 'female:' + want;
      if (state.voiceCache[key]) return state.voiceCache[key];
      const voices = speechSynthesis.getVoices() || [];
      const sameLang = voices.filter((v) => (v.lang || '').toLowerCase() === want
        || (v.lang || '').toLowerCase().startsWith(want.slice(0, 2)));
      const female = sameLang.find((v) => FEMALE_VOICE_HINTS.some((h) => (v.name || '').toLowerCase().includes(h)));
      const found = female || pickVoice(want);
      state.voiceCache[key] = found;
      return found;
    } catch (e) { return null; }
  }

  // Dọn hàng đợi giọng bị kẹt (có câu chờ mà không câu nào đang đọc —
  // lỗi quen thuộc của Chrome). Chỉ dọn khi lần speak gần nhất đã cách
  // đây >3s: các mảnh của 1 câu hỏi được đọc liền nhau trong vài ms nên
  // không bao giờ chạm tới ngưỡng này.
  function clearStalledSpeechQueue() {
    try {
      if (!('speechSynthesis' in window)) return;
      if (speechSynthesis.pending && !speechSynthesis.speaking) {
        const last = state.lastUtteranceAt || 0;
        if (!last || performance.now() - last > 3000) speechSynthesis.cancel();
      }
    } catch (e) {}
  }

  function speakRaw(text, lang, voiceOverride) {
    try {
      if (!state.voiceOn || !('speechSynthesis' in window)) return false;
      const clean = String(text || '').replace(/[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}]/gu, '').trim();
      if (!clean) return false;
      const useLang = lang || 'vi-VN';
      const u = new SpeechSynthesisUtterance(clean);
      u.lang = useLang; u.rate = 1.15; u.pitch = 1.12; u.volume = 1.0; // Tốc độ 1.15 (Cơ 25/11 03:14: giảm từ 1.4 về mức trước lúc tăng tối 24/11). Âm lượng 1.0 là tối đa trình duyệt cho phép (Cơ 24/11 20:49: +50% từ 0.75 = 1.125, vượt trần 1.0 nên lấy 1.0, thực tăng ~33%).
      const voice = voiceOverride || pickFemaleVoice(useLang); // MC cô giáo: ưu tiên giọng nữ, không có thì lấy giọng mặc định
      if (voice) u.voice = voice;
      // Tự cứu khi hàng đợi giọng bị kẹt từ lần đọc trước.
      clearStalledSpeechQueue();
      speechSynthesis.speak(u);
      state.lastUtteranceAt = performance.now();
      return true;
    } catch (e) { return false; }
  }

  function speak(text, prio, lang, voiceOverride) {
    if (!state.voiceOn) return false;
    try {
      if (!('speechSynthesis' in window)) return false;
      const now = performance.now();
      if (!prio && now - state.lastSpeak < VOICE_THROTTLE_MS) return false;
      if (!prio && speechSynthesis.speaking) return false;
      // Không bắt đầu câu thường khi vòng sắp hết (còn ≤4s): câu đó sẽ bị
      // cắt ngang khi hết giờ. Chỉ câu ưu tiên (câu hỏi mới, đáp án, tổng kết)
      // mới được cắt vào.
      if (!prio && state.phase === 'playing' && state.timeLeft <= 4) return false;
      if (prio) speechSynthesis.cancel();
      const ok = speakRaw(text, lang, voiceOverride);
      // Chỉ câu giao lưu (không ưu tiên) mới đặt lại đồng hồ throttle:
      // câu hỏi/đáp án (ưu tiên) không được chiếm mất khoảng trống, để
      // trong vòng 10s vẫn còn cửa cho 1 câu chúc mừng/cảm ơn sau khi
      // câu hỏi đọc xong (Cơ 24/11 20:01: để dành thời gian cho voice
      // giao lưu). Chắn chống cắt ngang vẫn còn: không nói đè lên câu
      // đang đọc, và không bắt đầu câu thường khi vòng còn ≤4s.
      if (ok && !prio) state.lastSpeak = now;
      return ok;
    } catch (e) { return false; }
  }

  // Spoken-text cleanup: drop IPA notation (/.../) and turn a "/"
  // synonym separator ("chăn / mền") into "hay", so the voice never
  // reads a slash or a phonetic transcription.
  function cleanSpoken(text) {
    return String(text || '')
      .replace(/\/[^/]+\//g, ' ')
      .replace(/\//g, ' hay ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  // Đọc số 0..999 thành tiếng Việt (dùng khi đọc đáp án lúc hết giờ).
  // Đề bài đã có sẵn trường `spoken` trong dữ liệu (sinh bởi gen-questions.js).
  const VI_DIGIT = ['không', 'một', 'hai', 'ba', 'bốn', 'năm', 'sáu', 'bảy', 'tám', 'chín'];
  function numToVi(n) {
    n = Math.floor(Number(n));
    if (!Number.isFinite(n) || n < 0 || n > 999) return String(n);
    if (n < 10) return VI_DIGIT[n];
    if (n < 20) return n === 10 ? 'mười' : 'mười ' + (n === 15 ? 'lăm' : VI_DIGIT[n - 10]);
    if (n < 100) {
      const t = Math.floor(n / 10), u = n % 10;
      let s = VI_DIGIT[t] + ' mươi';
      if (u === 1) s += ' mốt';
      else if (u === 4) s += ' tư';
      else if (u === 5) s += ' lăm';
      else if (u > 0) s += ' ' + VI_DIGIT[u];
      return s;
    }
    const h = Math.floor(n / 100), r = n % 100;
    let s = VI_DIGIT[h] + ' trăm';
    if (r === 0) return s;
    if (r < 10) return s + ' lẻ ' + VI_DIGIT[r];
    return s + ' ' + numToVi(r);
  }

  // Học Toán: đọc đề bằng tiếng Việt từ trường `spoken`
  // ("một trăm hai mươi lăm cộng ba trăm bốn mươi bảy bằng bao nhiêu?"),
  // rồi đọc gợi ý chữ số đầu. Không đọc loại phép và số chữ số.
  function voiceReadQuestion() {
    const q = state.questions[state.currentIndex];
    if (!q) return;
    const n = state.currentIndex + 1;
    const hint = `Chữ số đầu là ${q.hint.firstLetter}.`;
    if (!speak(`Câu ${n}:`, true)) return;
    speakRaw(String(q.spoken || q.question), 'vi-VN');
    // Độ khó đang bật: chỉ đọc đề, không đọc phần gợi ý.
    if (!state.hintsHidden) speakRaw(hint);
  }

  // After every 5th question, read the standings (delayed so the question
  // reading finishes first). Skipped silently if the voice is busy.
  function voiceScheduleStandings() {
    if (state.standingsTimer) { clearTimeout(state.standingsTimer); state.standingsTimer = null; }
    // Vòng ngắn (≤20s) không đủ chỗ cho câu đọc bảng (5–6s): nó luôn bị cắt
    // ngang khi hết giờ. Bỏ qua; bảng vẫn được đọc ở màn tổng kết.
    if (state.questionDuration <= 20) return;
    const n = state.currentIndex + 1;
    if (n % 5 !== 0 || n <= 0) return;
    state.standingsTimer = setTimeout(() => {
      const sorted = getSortedLeaderboard();
      if (sorted.length === 0) {
        speak('Chưa ai ghi điểm, câu này dễ lắm, thử đoán đi!', false);
        return;
      }
      const top = sorted[0];
      const second = sorted[1];
      if (second) {
        speak(`Sau ${n} câu, ${top.name} đang dẫn đầu với ${top.score} điểm, ${second.name} bám sát với ${second.score} điểm, chỉ kém ${top.score - second.score} điểm!`, false);
      } else {
        speak(`Sau ${n} câu, ${top.name} đang dẫn đầu với ${top.score} điểm!`, false);
      }
    }, 7000);
  }

  function voiceOnCorrect(name, prevLeaderName, wasFirstPoint, points = 1, guessNum = null) {
    // Chỉ chúc mừng khi giọng đang rảnh — KHÔNG cắt ngang câu hỏi đang đọc.
    // Vòng 10s không đủ chỗ cho nhiều câu chúc mừng cắt nhau (đó là tiếng
    // "lặp lại rồi nhảy loạn xạ" Cơ nghe thấy): trước đây mỗi người đoán đúng
    // (hạng 1–2) đều cắt ngang bằng speechSynthesis.cancel() rồi đọc chúc mừng
    // + thêm 1 câu dẫn đầu nữa. Giờ chỉ 1 câu chúc mừng, nói khi rảnh thì thôi;
    // toast + bảng điểm vẫn báo ngay cho mọi người đoán đúng.
    // Học Toán (Cơ 26/11): đọc to cả con số đáp án người đó vừa gõ.
    if (guessNum != null) {
      speak(`Chúc mừng ${name} đã đoán đúng, đáp án ${numToVi(guessNum)}, cộng ${points} điểm!`, false);
    } else {
      speak(`Chúc mừng ${name} đã đoán đúng, cộng ${points} điểm!`, false);
    }
  }

  // Continuous commenter interaction: greet first-time commenters, cheer on
  // repeat commenters with no points yet, and call out anyone 1 point away
  // from the Top 3. Throttled: at most 1 cheer per person per 30s.
  // Học Toán (Cơ 26/11): MC đọc to đáp án số người xem vừa gõ.
  // Chống loạn tiếng: chỉ đọc khi giọng đang rảnh — speak() đã chặn
  // 1 câu thường/8s + không đè câu đang đọc + không đọc khi vòng còn ≤4s —
  // và mỗi người tối đa 1 lần đọc/30s.
  function voiceOnComment(user, awarded, guessNum = null) {
    if (awarded || state.phase !== 'playing') return;
    const key = String(user || '').toLowerCase();
    if (!key) return;
    const e = state.commenters.get(key) || { name: user, count: 0, lastCheer: 0 };
    e.count += 1;
    e.name = user;
    state.commenters.set(key, e);
    if (guessNum != null) {
      const now = Date.now();
      if (now - (e.lastGuessRead || 0) >= 30000) {
        if (speak(`${user} đoán ${numToVi(guessNum)}`, false)) e.lastGuessRead = now;
      }
      return;
    }
    if (!state.greetedUsers.has(key)) {
      state.greetedUsers.add(key);
      speak(`Chào ${user}, lần đầu bình luận. Thử đoán câu này đi!`, false);
      return;
    }
    const now = Date.now();
    if (now - e.lastCheer < 30000) return;
    if (!state.scores.has(key) && e.count >= 3) {
      e.lastCheer = now;
      speak(`${user} đã bình luận ${e.count} lần mà chưa đúng. Cố lên, câu này dễ!`, false);
      return;
    }
    if (state.scores.has(key)) {
      const sorted = getSortedLeaderboard();
      const rank = sorted.findIndex((p) => p.name.toLowerCase() === key);
      if (rank >= 3) {
        const third = sorted[2];
        const me = sorted[rank];
        if (third && me && third.score - me.score <= 1) {
          e.lastCheer = now;
          speak(`${user} chỉ cần đúng 1 câu nữa là vào Top 3!`, false);
        }
      }
    }
  }

  // -----------------------------
  // Confetti Engine (Canvas 2D)
  // -----------------------------
  const confetti = {
    ctx: els.confettiCanvas.getContext('2d'),
    particles: [],
    rafId: null,
    colors: ['#ffd43b', '#22c55e', '#38bdf8', '#ff7a00', '#ff3352', '#ffffff', '#fde047']
  };

  function launchConfetti() {
    const origins = [
      { x: 180, y: 580, angleMin: -85, angleMax: -35 },
      { x: 540, y: 520, angleMin: -125, angleMax: -55 },
      { x: 900, y: 580, angleMin: -145, angleMax: -95 }
    ];

    origins.forEach((origin) => {
      for (let i = 0; i < 48; i++) {
        const deg = origin.angleMin + Math.random() * (origin.angleMax - origin.angleMin);
        const rad = (deg * Math.PI) / 180;
        const speed = 11 + Math.random() * 17;
        confetti.particles.push({
          x: origin.x + (Math.random() - 0.5) * 80,
          y: origin.y + (Math.random() - 0.5) * 60,
          vx: Math.cos(rad) * speed,
          vy: Math.sin(rad) * speed - 4,
          w: 11 + Math.random() * 12,
          h: 6 + Math.random() * 8,
          color: confetti.colors[Math.floor(Math.random() * confetti.colors.length)],
          rotation: Math.random() * Math.PI * 2,
          vRot: (Math.random() - 0.5) * 0.26,
          gravity: 0.36 + Math.random() * 0.14,
          drag: 0.985,
          life: 1.0,
          decay: 0.0055 + Math.random() * 0.004
        });
      }
    });

    if (!confetti.rafId) {
      animateConfetti();
    }
  }

  function animateConfetti() {
    const ctx = confetti.ctx;
    ctx.clearRect(0, 0, 1080, 1920);

    for (let i = confetti.particles.length - 1; i >= 0; i--) {
      const p = confetti.particles[i];
      p.vx *= p.drag;
      p.vy = p.vy * p.drag + p.gravity;
      p.x += p.vx;
      p.y += p.vy;
      p.rotation += p.vRot;
      p.life -= p.decay;

      if (p.life <= 0 || p.y > 1960) {
        confetti.particles.splice(i, 1);
        continue;
      }

      ctx.save();
      ctx.globalAlpha = Math.max(0, Math.min(1, p.life));
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      ctx.restore();
    }

    if (confetti.particles.length > 0) {
      confetti.rafId = requestAnimationFrame(animateConfetti);
    } else {
      confetti.rafId = null;
      ctx.clearRect(0, 0, 1080, 1920);
    }
  }

  // -----------------------------
  // Responsive Exact 1080x1920 Stage Scaling
  // -----------------------------
  function updateStageScale() {
    const rect = els.stageViewport.getBoundingClientRect();
    const scaleX = rect.width / 1080;
    const scaleY = rect.height / 1920;
    const scale = Math.min(scaleX, scaleY);
    els.gameStage.style.transform = `scale(${scale})`;
  }

  window.addEventListener('resize', updateStageScale);

  // -----------------------------
  // Normalization & Answer Checking
  // -----------------------------
  function normalizeText(raw) {
    return String(raw || '')
      .trim()
      .replace(/^[\s.,!?:;"'()[\]{}]+|[\s.,!?:;"'()[\]{}]+$/g, '')
      .replace(/\s+/g, ' ')
      .toLowerCase();
  }

  function stripDiacritics(str) {
    return str
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/Đ/g, 'D');
  }

  // Học Toán: trích con số đáp án đầu tiên trong bình luận (0..999).
  // Trả về null khi không có số, hoặc số >999 (không thể là đáp án).
  function extractGuessNumber(text) {
    const groups = String(text || '').match(/\d+/g) || [];
    if (groups.length === 0) return null;
    const n = Number(groups[0]);
    return Number.isFinite(n) && n >= 0 && n <= 999 ? n : null;
  }

  // Học Toán: đáp án là con số. Bình luận đúng khi chứa nhóm chữ số
  // bằng đáp án ("472", "đáp án 472", "472!" đều đúng; "47" sai).
  function isCorrectGuess(commentText, question) {
    if (!question) return false;
    const text = String(commentText || '');
    if (!text.trim()) return false;
    const target = String(question.answer).trim();
    const groups = text.match(/\d+/g) || [];
    if (groups.some((g) => Number(g) === Number(target))) return true;
    // Fallback: khớp nguyên văn (giữ acceptedAnswers hoạt động).
    const normalizedInput = normalizeText(text);
    const candidates = new Set([normalizeText(question.answer)]);
    if (Array.isArray(question.acceptedAnswers)) {
      question.acceptedAnswers.forEach((a) => candidates.add(normalizeText(a)));
    }
    return candidates.has(normalizedInput);
  }

  // -----------------------------
  // Formatting Helpers
  // -----------------------------
  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function formatQuestionHtml(q) {
    const safeQ = escapeHtml(q.question);
    if (!q.keyword) return safeQ;
    const safeKw = escapeHtml(q.keyword);
    const idx = safeQ.toLowerCase().indexOf(safeKw.toLowerCase());
    if (idx === -1) return safeQ;
    const before = safeQ.slice(0, idx);
    const match = safeQ.slice(idx, idx + safeKw.length);
    const after = safeQ.slice(idx + safeKw.length);
    return `${before}<span class="kw">${match}</span>${after}`;
  }

  function getAvatarColor(name) {
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = (hash * 31 + name.charCodeAt(i)) | 0;
    }
    return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
  }

  function getInitials(name) {
    const parts = String(name || '?').trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return String(name || '?').slice(0, 2).toUpperCase();
  }

  // -----------------------------
  // Rendering: Question & Letter Boxes
  // -----------------------------
  // Ô chữ đáp án: mỗi chữ cái là 1 ô; ô nào nằm trong revealedIdxSet
  // thì hiện chữ, còn lại để trống. Khoảng trắng giữa các từ giữ nguyên.
  // revealAnswer() truyền Set chứa toàn bộ index chữ cái.
  function renderLetterBoxes(answer, revealedIdxSet) {
    const container = els.letterBoxes;
    container.innerHTML = '';

    const chars = Array.from(answer.trim());
    const letterCount = chars.filter((c) => c !== ' ').length;
    const hasSpaces = chars.includes(' ');
    const effectiveSlots = letterCount + (hasSpaces ? 0.5 : 0);

    container.classList.remove('size-md', 'size-sm');
    if (effectiveSlots >= 9.5) {
      container.classList.add('size-sm');
    } else if (effectiveSlots >= 7.5) {
      container.classList.add('size-md');
    }

    let tileIndex = 0;
    chars.forEach((ch, charIdx) => {
      if (ch === ' ') {
        const gap = document.createElement('div');
        gap.className = 'letter-word-gap';
        gap.setAttribute('aria-hidden', 'true');
        container.appendChild(gap);
        return;
      }

      const box = document.createElement('div');
      const isRevealed = Boolean(revealedIdxSet && revealedIdxSet.has(charIdx));
      box.className = isRevealed ? 'letter-box revealed' : 'letter-box is-blank';
      box.textContent = isRevealed ? ch.toUpperCase() : '';
      if (isRevealed) {
        box.style.animationDelay = `${tileIndex * 55}ms`;
      }
      container.appendChild(box);
      tileIndex++;
    });
  }

  // Hé lộ chữ số tiếp theo chưa lộ của đáp án (quà 1 xu). Chữ số đầu lộ rồi
  // thì lộ chữ số kế tiếp. Trả về true nếu lộ được thêm 1 chữ số.
  function revealNextDigit() {
    if (state.phase !== 'playing') return false;
    const q = state.questions[state.currentIndex];
    if (!q) return false;
    const chars = Array.from(q.answer.trim());
    for (let i = 0; i < chars.length; i++) {
      if (chars[i] === ' ') continue;
      if (!state.revealedDigitIdx.has(i)) {
        state.revealedDigitIdx.add(i);
        renderLetterBoxes(q.answer, state.revealedDigitIdx);
        return true;
      }
    }
    return false;
  }

  // Ẩn/hiện chip gợi ý theo trạng thái độ khó của câu hiện tại.
  function applyHintsVisibility() {
    els.hintChips.classList.toggle('hints-hidden', state.hintsHidden);
    els.hintInstruction.textContent = state.hintsHidden
      ? '🔒 Độ khó đã tăng — không còn gợi ý!'
      : 'Bình luận con số đáp án nhé!';
  }

  function renderTopicBadge() {
    const q = state.questions[state.currentIndex];
    els.topicBadge.textContent = q && q.topic ? `CHỦ ĐỀ: ${q.topic}` : '';
  }

  function renderCurrentQuestion() {
    const q = state.questions[state.currentIndex];
    if (!q) return;

    els.questionStage.classList.remove('is-revealed');
    els.questionNumber.textContent = `CÂU ${state.currentIndex + 1} / ${state.questions.length}`;
    els.directionBadge.textContent = 'TÍNH NHANH';
    els.roundStatusPill.textContent = 'ĐANG ĐOÁN';
    els.roundStatusPill.className = 'round-status-pill';

    els.questionText.innerHTML = formatQuestionHtml(q);
    renderLetterBoxes(q.answer, state.revealedDigitIdx);
    renderTopicBadge();

    // Hint chips (toán: số chữ số + chữ số đầu của đáp án)
    const countLabel = `${q.hint.letterCount} chữ số`;
    els.hintWordType.textContent = q.hint.wordType;
    els.hintLetterCount.textContent = countLabel;
    els.hintFirstLetter.textContent = `Chữ số đầu: ${q.hint.firstLetter}`;
    applyHintsVisibility();

    // Reset bottom status area
    els.revealCard.classList.add('hidden');
    els.guessingStatus.classList.remove('hidden', 'winner-found');
    els.guessingStatusIcon.textContent = '⚡';
    els.guessingStatusText.innerHTML = 'Ai sẽ là người đoán đúng đầu tiên để nhận <strong>+3 điểm</strong>?';

    // Sync host control jump indicator
    els.currentQDisplay.textContent = `#${state.currentIndex + 1}`;
    els.inputJumpQuestion.value = state.currentIndex + 1;
  }

  // -----------------------------
  // Rendering: Timer
  // -----------------------------
  function renderTimer() {
    const secDisplay = Math.max(0, Math.ceil(state.timeLeft));
    const pct = Math.max(0, Math.min(100, (state.timeLeft / state.questionDuration) * 100));

    els.timerValue.textContent = `${secDisplay}s`;
    els.timerBarFill.style.width = `${pct}%`;
    els.timerTrack.setAttribute('aria-valuemax', String(state.questionDuration));
    els.timerTrack.setAttribute('aria-valuenow', String(secDisplay));

    els.timerSection.classList.remove('is-warning', 'is-urgent');
    if (state.phase === 'playing') {
      if (secDisplay <= 10) {
        els.timerSection.classList.add('is-urgent');
      } else if (secDisplay <= 18) {
        els.timerSection.classList.add('is-warning');
      }
    }
  }

  // -----------------------------
  // Rendering: Toast
  // -----------------------------
  function showWinnerToast(playerName, points = 1) {
    els.winnerToastText.textContent = `${playerName} đoán đúng! +${points} điểm`;
    els.winnerToast.classList.add('show');

    if (state.toastTimer) clearTimeout(state.toastTimer);
    state.toastTimer = setTimeout(() => {
      els.winnerToast.classList.remove('show');
    }, 3400);
  }

  // -----------------------------
  // Rendering: Leaderboard & TOP 3
  // -----------------------------
  function getSortedLeaderboard() {
    return Array.from(state.scores.values()).sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return a.lastScoredAt - b.lastScoredAt;
    });
  }

  function renderLeaderboard(justScoredName = null) {
    const sorted = getSortedLeaderboard();
    els.totalPlayersLabel.textContent = `${sorted.length} người ghi điểm`;

    // Update TOP 3 Cards
    for (let i = 0; i < 3; i++) {
      const slot = els.top3Slots[i];
      const player = sorted[i];
      const nameEl = slot.querySelector('.top3-name');
      const scoreEl = slot.querySelector('.top3-score');

      if (player) {
        nameEl.textContent = player.name;
        scoreEl.textContent = `${player.score} điểm`;
        if (justScoredName && player.name.toLowerCase() === justScoredName.toLowerCase()) {
          slot.classList.remove('score-pop');
          void slot.offsetWidth;
          slot.classList.add('score-pop');
        }
      } else {
        nameEl.textContent = 'Chưa có';
        scoreEl.textContent = '0 điểm';
      }
    }

    // Update TOP CAO THỦ List (top 5: Top 3 + 2 người sau, vừa khung không cần cuộn)
    const list = els.leaderboardList;
    if (sorted.length === 0) {
      list.innerHTML = '<li class="empty-state">Bình luận đáp án đúng để ghi danh lên bảng vàng!</li>';
      return;
    }

    const topRows = sorted.slice(0, 5);
    list.innerHTML = topRows
      .map((p, idx) => {
        const rank = idx + 1;
        const rankClass = rank <= 3 ? `lb-top${rank}` : '';
        const flashClass =
          justScoredName && p.name.toLowerCase() === justScoredName.toLowerCase()
            ? 'lb-just-scored'
            : '';
        return `
          <li class="lb-row ${rankClass} ${flashClass}">
            <span class="lb-rank">${rank}</span>
            <span class="lb-name">${escapeHtml(p.name)}</span>
            <span class="lb-score">${p.score} đ</span>
          </li>
        `;
      })
      .join('');
  }

  // -----------------------------
  // Rendering: TOP TẶNG QUÀ (donor board)
  // -----------------------------
  function getSortedDonors() {
    return Array.from(state.donors.values()).sort((a, b) => {
      if (b.totalCoins !== a.totalCoins) return b.totalCoins - a.totalCoins;
      return a.firstGiftAt - b.firstGiftAt; // hòa xu: ai tặng trước xếp trước
    });
  }

  function recordDonation(user, coins, avatar) {
    const key = user.toLowerCase();
    const existing = state.donors.get(key);
    if (existing) {
      existing.totalCoins += coins;
      existing.giftCount += 1;
      existing.name = user; // giữ tên hiển thị mới nhất
      if (avatar) existing.avatar = avatar; // lấy avatar mới nhất
    } else {
      state.donors.set(key, {
        name: user,
        avatar: avatar || '',
        totalCoins: coins,
        giftCount: 1,
        firstGiftAt: Date.now()
      });
    }
    renderDonors(user);
  }

  function renderDonors(justGiftedName = null) {
    const list = els.donorList;
    if (!list) return;
    const sorted = getSortedDonors();
    if (sorted.length === 0) {
      list.innerHTML = '<li class="empty-state">Chưa có ai tặng quà — tặng quà để lên bảng!</li>';
      return;
    }
    list.innerHTML = sorted
      .slice(0, 3)
      .map((d, idx) => {
        const rank = idx + 1;
        const rankClass = rank <= 3 ? `lb-top${rank}` : '';
        const flashClass =
          justGiftedName && d.name.toLowerCase() === justGiftedName.toLowerCase()
            ? 'lb-just-scored'
            : '';
        const avatarHtml = d.avatar
          ? `<span class="donor-avatar"><img src="${escapeHtml(d.avatar)}" alt="" /></span>`
          : `<span class="donor-avatar" style="background:${getAvatarColor(d.name)}">${escapeHtml(
              getInitials(d.name)
            )}</span>`;
        return `
          <li class="donor-row ${rankClass} ${flashClass}">
            <span class="lb-rank">${rank}</span>
            ${avatarHtml}
            <span class="donor-info">
              <span class="donor-name">${escapeHtml(d.name)}</span>
              <span class="donor-meta">${d.totalCoins} xu • ${d.giftCount} quà</span>
            </span>
          </li>
        `;
      })
      .join('');
  }

  // -----------------------------
  // Rendering: Comment Feed
  // -----------------------------
  function appendCommentToFeed(user, text, isWinningGuess, points) {
    const feed = els.commentFeed;
    const emptyEl = feed.querySelector('.empty-state');
    if (emptyEl) emptyEl.remove();

    const li = document.createElement('li');
    li.className = isWinningGuess ? 'comment-item is-correct' : 'comment-item';

    const avatarBg = getAvatarColor(user);
    const initials = getInitials(user);

    // Một dòng / bình luận (tên + nội dung + huy hiệu nếu đúng): 7 dòng mới
    // vừa khung 1080x1920. Bình luận dài tự cắt bằng dấu ... ở cuối.
    li.innerHTML = `
      <div class="comment-avatar" style="background:${avatarBg}">${escapeHtml(initials)}</div>
      <div class="comment-body">
        <span class="comment-author">${escapeHtml(user)}</span>
        <span class="comment-text">${escapeHtml(text)}</span>
        ${isWinningGuess ? `<span class="comment-badge-win">✓ ĐÚNG +${points || 1}</span>` : ''}
      </div>
    `;

    // Prepend newest comments at the top so viewers always see fresh activity immediately
    feed.prepend(li);

    while (feed.children.length > MAX_VISIBLE_COMMENTS) {
      feed.lastElementChild.remove();
    }

    els.commentCount.textContent = String(state.totalComments);
  }

  // -----------------------------
  // Core Comment Ingestion (Demo, Manual, or Real TikTok LIVE)
  // -----------------------------
  function handleIncomingComment(user, text) {
    const cleanUser = String(user || 'Khán giả').trim();
    const cleanText = String(text || '').trim();
    if (!cleanText) return;

    state.totalComments += 1;

    // Học Toán: con số đáp án trong bình luận (để MC đọc to).
    const guessNum = extractGuessNumber(cleanText);

    const currentQ = state.questions[state.currentIndex];
    let awarded = false;
    let awardedPoints = 0;

    // Scoring: the 10 fastest correct guessers per round score —
    // 1st +3, 2nd +2, 3rd–10th +1 each. One score per person per round.
    // The round stays open until the timer ends, so later guessers can
    // still score (the answer is only revealed at the timer).
    const alreadyScored = state.roundScorers.some(
      (s) => s.name.toLowerCase() === cleanUser.toLowerCase()
    );
    if (
      state.phase === 'playing' &&
      currentQ &&
      isCorrectGuess(cleanText, currentQ) &&
      !alreadyScored &&
      state.roundScorers.length < 10
    ) {
      awarded = true;
      const rank = state.roundScorers.length + 1;
      const points = rank === 1 ? 3 : rank === 2 ? 2 : 1;
      awardedPoints = points;
      state.roundScorers.push({ name: cleanUser, points });
      if (!state.roundWinner) state.roundWinner = cleanUser;

      const prevTop = getSortedLeaderboard()[0];
      const prevLeaderName = prevTop ? prevTop.name : null;
      const wasFirstPoint = !state.scores.has(cleanUser.toLowerCase());

      const key = cleanUser.toLowerCase();
      const prev = state.scores.get(key);
      if (prev) {
        prev.score += points;
        prev.lastScoredAt = Date.now();
      } else {
        state.scores.set(key, {
          name: cleanUser,
          score: points,
          lastScoredAt: Date.now()
        });
      }

      // Live UI updates
      playCorrectSfx();
      showWinnerToast(cleanUser, points);
      renderLeaderboard(cleanUser);
      // Voice the big moments only (1st +3, 2nd +2); later +1 scorers get
      // toast + leaderboard to keep the audio clean in a 10s round.
      if (rank <= 2) voiceOnCorrect(cleanUser, prevLeaderName, wasFirstPoint, points, guessNum);

      els.roundStatusPill.textContent = 'ĐÃ CÓ NGƯỜI ĐÚNG!';
      els.roundStatusPill.className = 'round-status-pill has-winner';
      els.guessingStatus.classList.add('winner-found');
      els.guessingStatusIcon.textContent = '🏆';
      const rankText = rank === 1
        ? 'đoán đúng đầu tiên'
        : rank === 2 ? 'đoán đúng thứ 2' : `đoán đúng thứ ${rank}`;
      els.guessingStatusText.innerHTML =
        `<strong>${escapeHtml(cleanUser)}</strong> ${rankText} (+${points} điểm)! Chờ hết giờ xem đáp án nhé!`;
    }

    // Đáp án sai (chỉ khi gõ số mà sai, không phải tán gẫu): tiếng "bụp".
    if (state.phase === 'playing' && currentQ && guessNum != null && !awarded) playWrongSfx();

    appendCommentToFeed(cleanUser, cleanText, awarded, awardedPoints);
    voiceOnComment(cleanUser, awarded, guessNum);
  }

  // -----------------------------
  // Topics & Gift Perks (THÊM 24/11 — xem gifts-catalog-2026-11-24.md)
  // 4 chủ đề theo thứ tự trong questions.json; quà tặng kích hoạt perk
  // theo số xu: <=1 → +5s + hé lộ chữ số đầu; 2–9 → xáo trộn chủ đề;
  // 10–14 → thay đổi chủ đề; 15–19 → nâng độ khó; >=20 → khó + đổi chủ đề.
  // -----------------------------
  const MAX_BONUS_SECONDS_PER_ROUND = 20; // tổng cộng thêm tối đa 20s/vòng

  function buildTopicIndex() {
    state.topics = [];
    state.topicIndices = {};
    state.questions.forEach((q, idx) => {
      const t = q.topic || 'Chung';
      if (!state.topicIndices[t]) {
        state.topicIndices[t] = [];
        state.topics.push(t);
      }
      state.topicIndices[t].push(idx);
    });
  }

  function jumpToTopicFirstQuestion(topic) {
    const list = state.topicIndices[topic];
    if (!list || list.length === 0) return false;
    startQuestion(list[0]);
    return true;
  }

  // Thay đổi chủ đề: nhảy tới câu đầu của chủ đề TIẾP THEO theo thứ tự;
  // hết chủ đề cuối thì quay về chủ đề đầu.
  function changeTopic() {
    if (state.topics.length === 0) return false;
    const cur = state.questions[state.currentIndex];
    const pos = state.topics.indexOf(cur ? cur.topic : null);
    const next = state.topics[(pos + 1) % state.topics.length];
    return jumpToTopicFirstQuestion(next);
  }

  // Xáo trộn chủ đề: nhảy tới câu đầu của một chủ đề NGẪU NHIÊN
  // (khác chủ đề hiện tại nếu có lựa chọn khác).
  function shuffleTopic() {
    if (state.topics.length === 0) return false;
    const cur = state.questions[state.currentIndex];
    const curTopic = cur ? cur.topic : null;
    let candidates = state.topics.filter((t) => t !== curTopic);
    if (candidates.length === 0) candidates = state.topics;
    const pick = candidates[Math.floor(Math.random() * candidates.length)];
    return jumpToTopicFirstQuestion(pick);
  }

  // Nâng độ khó: ẩn toàn bộ chip gợi ý (loại phép, số chữ số, chữ số đầu) cho
  // câu hiện tại + 2 câu tiếp theo; các ô chữ đã lộ vẫn hiện.
  function raiseDifficulty() {
    if (state.phase === 'playing') {
      state.hintsHidden = true;
      applyHintsVisibility();
      state.hardModeQuestionsLeft = Math.max(state.hardModeQuestionsLeft, 2);
    } else {
      state.hardModeQuestionsLeft = Math.max(state.hardModeQuestionsLeft, 3);
    }
  }

  // +5 giây suy nghĩ: cộng vào đồng hồ vòng hiện tại; tổng cộng thêm
  // tối đa 20 giây/vòng (quà 1 xu thứ 5 trở đi trong cùng vòng không cộng).
  // Trả về số giây thực sự đã cộng.
  function addBonusSeconds(sec) {
    if (state.phase !== 'playing') return 0;
    const add = Math.max(0, Math.min(sec, MAX_BONUS_SECONDS_PER_ROUND - state.bonusSecondsThisRound));
    if (add <= 0) return 0;
    state.bonusSecondsThisRound += add;
    state.timeLeft += add;
    state.lastTickWholeSec = Math.max(state.lastTickWholeSec, Math.ceil(state.timeLeft));
    // Đồng hồ nhảy lên lại trên ngưỡng thì cho phép đọc "Còn 10/5 giây" lại
    if (state.timeLeft > 10) state.voiceFlags.p10 = false;
    if (state.timeLeft > 5) state.voiceFlags.p5 = false;
    renderTimer();
    return add;
  }

  function showGiftToast(user, giftName, coins, avatar) {
    if (avatar) {
      els.giftToastAvatar.innerHTML = `<img src="${escapeHtml(avatar)}" alt="" />`;
    } else {
      els.giftToastAvatar.textContent = '🎁';
    }
    els.giftToastText.textContent = `${user} đã tặng ${giftName} (${coins} xu)`;
    els.giftToast.classList.add('show');
    if (state.giftToastTimer) clearTimeout(state.giftToastTimer);
    state.giftToastTimer = setTimeout(() => {
      els.giftToast.classList.remove('show');
    }, 4000);
  }

  // Trêu ghẹo cô giáo khi có quà (Cơ 26/11) — quà càng lớn trò càng mạnh:
  // 1 xu: gián rơi + cô nhảy nhẹ + la "Á!" + né sang trái.
  // 2–9 xu: chuột chạy + cô nhảy + la "Á!" + né mạnh.
  // 10–19 xu: nhện rơi + cô la "Á!" + né + thục dầu.
  // 20 xu+: gián + chuột + nhện + cô nhảy cao + la "Á á á!" + né + thục dầu.
  // Cô PHẢI phản ứng lại trò trêu (la/nhảy/né), không đứng yên (Cơ 26/11).
  // MỖI TRÒ HIỆN 5 GIÂY rồi hết.
  // Chống loạn: trò đang chạy thì quà nhỏ hơn không chen ngang, quà lớn
  // hơn được nâng cấp (quà 1 xu cũng phải chờ đủ 5s mới trêu lại).
  const TEASE_TIERS = [
    { min: 20, critters: ['🪳', '🐭', '🕷️'], teacherClass: 'tease-mega', scream: 'Á á á!', voice: ' Á á á! Gián, chuột, nhện luôn!' },
    { min: 10, critters: ['🕷️'], teacherClass: 'tease-pushup', scream: 'Á!', voice: ' Á! Có nhện kìa!' },
    { min: 2, critters: ['🐭'], teacherClass: 'tease-jump', scream: 'Á!', voice: ' Có chuột kìa, cô sợ quá!' },
    { min: 1, critters: ['🪳'], teacherClass: 'tease-jump-small', scream: 'Á!', voice: ' Á!' },
  ];
  const TEASE_CLASSES = ['tease-jump-small', 'tease-jump', 'tease-pushup', 'tease-mega'];

  function triggerTeacherTease(coins) {
    const n = Number(coins) || 0;
    if (n < 1) return null;
    const tier = TEASE_TIERS.find((t) => n >= t.min);
    if (!tier) return null;
    const now = Date.now();
    if ((state.teacherTeaseUntil || 0) > now && tier.min <= (state.teacherTeaseTier || 0)) return null;
    const layer = els.teaseLayer;
    const fig = els.teacherFigure;
    const scream = els.teacherScream;
    if (!layer || !fig) return null;
    if (state.teacherTeaseTimer) clearTimeout(state.teacherTeaseTimer);
    fig.classList.remove(...TEASE_CLASSES);
    void fig.offsetWidth; // khởi động lại animation
    const single = tier.critters.length === 1;
    layer.innerHTML = tier.critters.map((c, i) =>
      `<span class="tease-critter ${single && tier.min === 2 ? 'run' : 'drop'}" style="animation-delay:${i * 0.25}s">${c}</span>`
    ).join('');
    fig.classList.add(tier.teacherClass);
    playTeaseSfx(tier.min);
    if (scream) {
      if (tier.scream) {
        scream.textContent = tier.scream;
        scream.classList.add('show');
      } else {
        scream.classList.remove('show');
      }
    }
    state.lastTeacherTeaseAt = now;
    state.teacherTeaseTier = tier.min;
    state.teacherTeaseUntil = now + 5000; // mỗi trò hiện 5 giây (Cơ 26/11)
    state.teacherTeaseTimer = setTimeout(() => {
      layer.innerHTML = '';
      fig.classList.remove(...TEASE_CLASSES);
      if (scream) scream.classList.remove('show');
      state.teacherTeaseUntil = 0;
      state.teacherTeaseTier = 0;
    }, 5000);
    return tier;
  }

  // 1 event quà (từ Ably hoặc test): banner + giọng cảm ơn cho mọi quà,
  // rồi áp perk theo số xu.
  function handleIncomingGift(gift) {
    if (!gift) return;
    const user = String(gift.user || gift.username || 'Khán giả').trim() || 'Khán giả';
    const giftName = String(gift.giftName || gift.gift || 'Quà');
    const coins = Math.max(0, Number(gift.coins ?? gift.diamondCount ?? 0) || 0);
    const avatar = gift.avatar || '';

    showGiftToast(user, giftName, coins, avatar);
    playGiftSfx(coins);
    const teaseTier = triggerTeacherTease(coins);
    // Chỉ cảm ơn bằng giọng khi đang trong vòng (câu cảm ơn nói lúc hết giờ
    // hoặc tổng kết sẽ bị câu sau cắt ngang). Quà lớn thì MC nói thêm 1 câu
    // trêu trong CÙNG 1 lần đọc (không thêm lần đọc mới — vẫn chống chồng tiếng).
    if (state.phase === 'playing') {
      speak(`Cảm ơn ${user} đã tặng ${giftName}!${teaseTier ? teaseTier.voice : ''}`, false);
    }

    // Ghi vào bảng TOP TẶNG QUÀ (cập nhật trực tiếp, trước khi áp perk)
    recordDonation(user, coins, avatar);

    if (coins <= 1) {
      addBonusSeconds(5);
      revealNextDigit();
    } else if (coins <= 9) {
      shuffleTopic();
    } else if (coins <= 14) {
      changeTopic();
    } else if (coins <= 19) {
      raiseDifficulty();
    } else {
      raiseDifficulty();
      changeTopic();
    }
  }

  // -----------------------------
  // Demo Mode Comment Scheduler
  // -----------------------------
  function clearDemoTimers() {
    state.demoTimers.forEach((id) => clearTimeout(id));
    state.demoTimers = [];
  }

  function pickRandom(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  // Số đoán sai cho demo: đáp án lệch ±1..3, ±10, hoặc số ngẫu nhiên 2–3 chữ số.
  function demoWrongNumber(q) {
    const ans = Number(q.answer);
    const r = Math.random();
    let n;
    if (r < 0.6) n = ans + pickRandom([-3, -2, -1, 1, 2, 3, 10, -10]);
    else n = 10 + Math.floor(Math.random() * 990);
    if (n === ans || n < 0) n = ans + 7;
    return String(n);
  }

  function scheduleDemoCommentsForRound() {
    clearDemoTimers();
    if (!state.demoMode || state.phase !== 'playing' || !state.isRunning) return;

    const q = state.questions[state.currentIndex];
    if (!q) return;

    const remainingMs = Math.max(2500, state.timeLeft * 1000);

    // Decide when the winning simulated guess fires (between 32% and 55% of remaining time)
    const winDelayMs = Math.round(remainingMs * (0.32 + Math.random() * 0.22));
    const totalEvents = Math.max(4, Math.min(10, Math.round(state.timeLeft / 4.2)));

    // Schedule wrong guesses & chatter distributed across the round
    for (let i = 0; i < totalEvents; i++) {
      const ratio = (i + 0.5) / totalEvents;
      const delayMs = Math.max(900, Math.round(remainingMs * ratio * 0.92));

      // Skip if too close to the winning guess moment
      if (!state.roundWinner && Math.abs(delayMs - winDelayMs) < 900) continue;

      const timerId = setTimeout(() => {
        if (!state.demoMode || state.phase !== 'playing' || !state.isRunning) return;
        const player = pickRandom(DEMO_PLAYERS);
        let msg = '';
        if (Math.random() < 0.25) {
          msg = pickRandom(DEMO_CHATTER);
        } else {
          // Đoán sai: một con số gần đáp án (lệch vài đơn vị/chục) hoặc số ngẫu nhiên.
          msg = demoWrongNumber(q);
        }
        handleIncomingComment(player, msg);
      }, delayMs);

      state.demoTimers.push(timerId);
    }

    // Schedule 1 winning simulated guess if nobody has won this round yet
    if (!state.roundWinner) {
      const winTimerId = setTimeout(() => {
        if (!state.demoMode || state.phase !== 'playing' || !state.isRunning || state.roundWinner) {
          return;
        }
        const winner = pickRandom(DEMO_PLAYERS);
        // Thử nhiều cách viết đáp án số để chứng minh chấm thông minh
        const styles = [
          q.answer,
          `  ${q.answer}  `,
          `${q.answer}!`,
          `đáp án ${q.answer}`
        ];
        handleIncomingComment(winner, pickRandom(styles));
      }, winDelayMs);

      state.demoTimers.push(winTimerId);
    }
  }

  // -----------------------------
  // Round Lifecycle: Start, Reveal, Next, End
  // -----------------------------
  function startQuestion(index) {
    clearDemoTimers();
    if (state.endScreenTimer) { clearTimeout(state.endScreenTimer); state.endScreenTimer = null; }
    if (state.revealCheerTimer) { clearTimeout(state.revealCheerTimer); state.revealCheerTimer = null; }

    if (index >= state.questions.length) {
      showEndScreen();
      return;
    }

    state.currentIndex = index;
    state.phase = 'playing';
    state.roundWinner = null;
    state.roundScorers = [];
    state.timeLeft = state.questionDuration;
    state.lastTickWholeSec = state.questionDuration;
    state.bonusSecondsThisRound = 0;
    state.revealedDigitIdx = new Set();
    // Độ khó: nếu còn lượt ẩn gợi ý thì câu này ẩn + trừ 1 lượt
    // (quà 15/20 xu: câu hiện tại + 2 câu tiếp theo).
    if (state.hardModeQuestionsLeft > 0) {
      state.hintsHidden = true;
      state.hardModeQuestionsLeft -= 1;
    } else {
      state.hintsHidden = false;
    }

    els.endScreen.classList.add('hidden');
    renderCurrentQuestion();
    renderTimer();
    state.voiceFlags = { p10: false, p5: false };

    if (state.isRunning) {
      scheduleDemoCommentsForRound();
      voiceReadQuestion();
      voiceScheduleStandings();
    }
  }

  // One line for the reveal card listing this round's scorers in order.
  function formatRoundScorersLine() {
    const list = state.roundScorers || [];
    if (list.length === 0) return '';
    if (list.length === 1) return `🎉 Chúc mừng ${list[0].name} đoán đúng đầu tiên (+3 điểm)!`;
    const shown = list.slice(0, 5).map((s) => `${s.name} +${s.points}`).join(', ');
    const extra = list.length > 5 ? ` +${list.length - 5} người nữa` : '';
    return `🎉 Đoán đúng nhanh nhất: ${shown}${extra}!`;
  }

  function revealAnswer() {
    if (state.phase !== 'playing') return;

    clearDemoTimers();
    state.phase = 'revealing';
    state.timeLeft = 0;
    state.revealTimeLeft = REVEAL_DURATION_SEC;

    const q = state.questions[state.currentIndex];
    if (!q) return;

    renderTimer();
    els.questionStage.classList.add('is-revealed');
    els.roundStatusPill.textContent = 'ĐÁP ÁN';
    els.roundStatusPill.className = 'round-status-pill is-answer';

    // Flip letter boxes to green with answer characters
    const allIdx = new Set();
    Array.from(q.answer.trim()).forEach((ch, i) => { if (ch !== ' ') allIdx.add(i); });
    state.revealedDigitIdx = allIdx;
    renderLetterBoxes(q.answer, allIdx);

    // Show IPA, meaning & example sentence
    els.guessingStatus.classList.add('hidden');
    els.revealCard.classList.remove('hidden');

    // Học Toán: thẻ đáp án hiện "phép tính = kết quả", ví dụ là phép tính đọc bằng lời.
    els.revealIpa.textContent = String(q.question).replace(' = ?', '');
    els.revealMeaning.textContent = q.answer;
    els.revealExample.textContent = `“${q.example}”`;

    if (state.roundWinner) {
      els.revealWinnerLine.textContent = formatRoundScorersLine();
      // Đọc người trả lời nhanh nhất trong lúc chờ trước câu sau (Cơ 24/11 20:12).
      speak(`Chúc mừng ${state.roundWinner} trả lời nhanh nhất, cộng 3 điểm!`, true);
    } else {
      els.revealWinnerLine.textContent = '⏰ Hết giờ! Cùng ghi nhớ phép tính này nhé!';
      // Học Toán: đọc đáp án là con số bằng tiếng Việt.
      speak('Hết giờ, chưa ai đúng. Đáp án là', true);
      speakRaw(numToVi(Number(q.answer)), 'vi-VN');
      // Không ai đúng: đợi đáp án đọc xong (~3s) rồi nói 1 câu giao lưu
      // trong lúc chờ câu sau (Cơ 24/11 20:12).
      if (state.revealCheerTimer) clearTimeout(state.revealCheerTimer);
      state.revealCheerTimer = setTimeout(() => {
        state.revealCheerTimer = null;
        speak('Nhớ phép tính này nhé, câu sau thử lại!', false);
      }, 3000);
    }

    updateRevealCountdownUI();
    launchConfetti();
    playRevealSfx();
  }

  function updateEndCountdownUI() {
    if (!els.endCountdown) return;
    const elapsed = (Date.now() - state.endScreenAt) / 1000;
    const sec = Math.max(0, Math.ceil(END_SCREEN_AUTO_RESTART_SEC - elapsed));
    els.endCountdown.textContent = `Ván mới bắt đầu sau ${sec} giây…`;
  }

  function updateRevealCountdownUI() {
    if (!state.autoNext) {
      els.nextCountdownPill.textContent = 'Bấm Câu tiếp ⏭';
      return;
    }
    const sec = Math.max(0, Math.ceil(state.revealTimeLeft));
    const isLast = state.currentIndex >= state.questions.length - 1;
    els.nextCountdownPill.textContent = isLast ? `Tổng kết: ${sec}s` : `Câu tiếp: ${sec}s`;
  }

  function nextQuestion() {
    if (state.revealCheerTimer) { clearTimeout(state.revealCheerTimer); state.revealCheerTimer = null; }
    if (state.currentIndex + 1 >= state.questions.length) {
      showEndScreen();
    } else {
      startQuestion(state.currentIndex + 1);
    }
  }

  function showEndScreen() {
    clearDemoTimers();
    state.phase = 'ended';
    els.endScreen.classList.remove('hidden');

    const sorted = getSortedLeaderboard();
    els.statQuestions.textContent = String(state.questions.length);
    els.statPlayers.textContent = String(sorted.length);
    els.statComments.textContent = String(state.totalComments);

    const medals = ['🥇', '🥈', '🥉'];
    if (sorted.length === 0) {
      els.endPodium.innerHTML =
        '<div class="end-podium-row"><span>Hẹn gặp lại các bạn ở buổi LIVE tiếp theo!</span></div>';
    } else {
      els.endPodium.innerHTML = sorted
        .slice(0, 3)
        .map(
          (p, i) => `
          <div class="end-podium-row rank-${i + 1}">
            <span>${medals[i]} ${escapeHtml(p.name)}</span>
            <span style="color:#ffd43b">${p.score} điểm</span>
          </div>
        `
        )
        .join('');
    }

    if (sorted.length > 0) {
      const top3line = sorted.slice(0, 3).map((p, i) => `top ${i + 1} là ${p.name} với ${p.score} điểm`).join(', ');
      speak(`Kết thúc! ${top3line}. Chúc mừng cả nhà!`, true);
    }

    launchConfetti();
    playRevealSfx();

    // Auto-restart: honour Top 3 for ~10s, then start a fresh round from Q1.
    state.endScreenAt = Date.now();
    if (state.endScreenTimer) clearTimeout(state.endScreenTimer);
    updateEndCountdownUI();
    state.endScreenTimer = setTimeout(() => {
      if (state.phase === 'ended') resetScoresAndRestart(true);
    }, END_SCREEN_AUTO_RESTART_SEC * 1000);
  }

  function resetScoresAndRestart(restartQuestions = false) {
    if (state.endScreenTimer) { clearTimeout(state.endScreenTimer); state.endScreenTimer = null; }
    state.commenters.clear();
    state.greetedUsers.clear();
    if (state.standingsTimer) { clearTimeout(state.standingsTimer); state.standingsTimer = null; }
    state.scores.clear();
    state.donors.clear();
    state.totalComments = 0;
    els.commentCount.textContent = '0';
    els.commentFeed.innerHTML = '<li class="empty-state">Đang chờ bình luận từ người xem...</li>';
    renderLeaderboard();
    renderDonors();

    if (restartQuestions || state.phase === 'ended') {
      state.isRunning = true;
      updateStartPauseButton();
      startQuestion(0);
    } else if (state.phase === 'playing') {
      // Allow scoring again cleanly on current question
      state.roundWinner = null;
      state.roundScorers = [];
      state.bonusSecondsThisRound = 0;
      state.revealedDigitIdx = new Set();
      state.hintsHidden = false;
      state.hardModeQuestionsLeft = 0;
      const cq = state.questions[state.currentIndex];
      if (cq) renderLetterBoxes(cq.answer, state.revealedDigitIdx);
      applyHintsVisibility();
      els.roundStatusPill.textContent = 'ĐANG ĐOÁN';
      els.roundStatusPill.className = 'round-status-pill';
      els.guessingStatus.classList.remove('winner-found');
      els.guessingStatusIcon.textContent = '⚡';
      els.guessingStatusText.innerHTML =
        'Ai sẽ là người đoán đúng đầu tiên để nhận <strong>+3 điểm</strong>?';
    }
  }

  // -----------------------------
  // Main 100ms Game Clock
  // -----------------------------
  let lastFrameTs = performance.now();

  function gameClockTick() {
    const now = performance.now();
    const dt = Math.min(0.5, (now - lastFrameTs) / 1000);
    lastFrameTs = now;

    if (!state.isRunning) return;

    if (state.phase === 'playing') {
      state.timeLeft = Math.max(0, state.timeLeft - dt);
      renderTimer();

      if (state.questionDuration > 10 && !state.voiceFlags.p10 && state.timeLeft <= 10) {
        state.voiceFlags.p10 = true;
        speak('Còn 10 giây, ai biết đáp án bình luận nhanh nào!', false);
      }
      if (state.questionDuration > 5 && !state.voiceFlags.p5 && state.timeLeft <= 5) {
        state.voiceFlags.p5 = true;
        speak('Còn 5 giây, nhanh tay nào!', false);
      }

      const wholeSec = Math.ceil(state.timeLeft);
      if (wholeSec < state.lastTickWholeSec) {
        state.lastTickWholeSec = wholeSec;
        if (wholeSec > 0 && wholeSec <= 5) {
          playTickSfx();
        }
      }

      if (state.timeLeft <= 0) {
        revealAnswer();
      }
    } else if (state.phase === 'revealing' && state.autoNext) {
      state.revealTimeLeft = Math.max(0, state.revealTimeLeft - dt);
      updateRevealCountdownUI();
      if (state.revealTimeLeft <= 0) {
        nextQuestion();
      }
    } else if (state.phase === 'ended') {
      updateEndCountdownUI();
    }
  }

  setInterval(gameClockTick, 100);

  // -----------------------------
  // Connection Pill & Ably Client (TikTok LIVE)
  // Bản tách kiến trúc: trang tĩnh subscribe Ably, KHÔNG còn WebSocket nội bộ.
  // -----------------------------
  function updateConnectionPill() {
    if (state.tiktokConnected && state.tiktokUsername) {
      els.connectionPill.classList.add('is-live');
      const viewers = state.viewerCount > 0 ? ` • ${state.viewerCount} xem` : '';
      els.connectionLabel.textContent = `@${state.tiktokUsername}${viewers}`;
    } else if (state.demoMode) {
      els.connectionPill.classList.remove('is-live');
      els.connectionLabel.textContent = 'DEMO MODE';
    } else {
      els.connectionPill.classList.remove('is-live');
      els.connectionLabel.textContent = 'CHỜ KẾT NỐI LIVE';
    }
  }

  function setWsBadge(text, variant = '') {
    els.wsStatus.textContent = text;
    els.wsStatus.className = variant ? `ws-badge ${variant}` : 'ws-badge';
  }

  // Chạy local (node server-ably.js) thì trang gọi được /api/connect;
  // trên GitHub Pages thì server tự nối TikTok, nút Kết nối bị vô hiệu.
  const IS_LOCAL_API =
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1';

  function getAblyConfig() {
    const fromFile = window.ABLY_CONFIG || {};
    return {
      key: params.get('ablyKey') || fromFile.key || '',
      channel: params.get('ablyChannel') || fromFile.channel || 'hoc-toan-live'
    };
  }

  // Ably tự reconnect: rớt < ~2 phút thì resume + replay đúng thứ tự các
  // message bị miss; rớt lâu hơn thì channel attach lại với resumed=false
  // (xem channel 'attached' bên dưới) — lúc đó chỉ nhận message mới.
  // SDK: @ably/pubsub-device 3.x (global AblyPubSub, API createClient).
  // SDK cổ điển `ably` v2 bị tài khoản MAU pricing từ chối (lỗi 40168).
  function connectAbly() {
    if (typeof AblyPubSub === 'undefined' || typeof AblyPubSub.createClient !== 'function') {
      setWsBadge('Không tải được Ably SDK', 'error');
      return;
    }
    const cfg = getAblyConfig();
    if (!cfg.key) {
      setWsBadge('Chưa cấu hình Ably key', 'error');
      return;
    }

    // Tài khoản MAU bắt buộc clientId trên device (không có thì 401).
    const realtime = AblyPubSub.createClient({
      key: cfg.key,
      clientId: 'obs-' + Math.random().toString(36).slice(2, 8)
    });
    state.ably = realtime;

    realtime.connection.on('connected', () => {
      state.ablyConnected = true;
      setWsBadge('Ably: Đã nối', 'connected');
    });
    realtime.connection.on('disconnected', () => {
      state.ablyConnected = false;
      setWsBadge('Ably: Đang nối lại…', '');
    });
    realtime.connection.on('suspended', () => {
      state.ablyConnected = false;
      setWsBadge('Ably: Tạm mất nối', 'error');
    });
    realtime.connection.on('failed', (err) => {
      state.ablyConnected = false;
      setWsBadge('Ably: Lỗi kết nối', 'error');
      console.error('[Ably] connection failed:', err && err.message ? err.message : err);
    });

    const channel = realtime.channels.get(cfg.channel);
    state.ablyChannel = channel;

    channel.on('attached', (change) => {
      // Lần attach đầu resumed=false là bình thường. Attach lại sau mà
      // resumed=false nghĩa là Ably không resume được — có thể đã miss
      // vài bình luận trong lúc rớt (hơn ~2 phút); game vẫn chạy tiếp
      // với bình luận mới.
      if (state.ablyAttachedOnce && change && change.resumed === false) {
        console.warn('[Ably] channel re-attached without resume — có thể thiếu vài bình luận');
        setWsBadge('Ably: Đã nối lại (có thể thiếu vài bình luận)', '');
      }
      state.ablyAttachedOnce = true;
    });
    channel.on('failed', (err) => {
      setWsBadge('Ably: Không attach được channel', 'error');
      console.error('[Ably] channel failed:', err && err.message ? err.message : err);
    });

    channel.subscribe('comment', onAblyComment);
    channel.subscribe('status', onAblyStatus);
    channel.subscribe('gift', onAblyGift);
  }

  function parseAblyData(raw) {
    if (raw && typeof raw === 'object') return raw;
    if (typeof raw === 'string') {
      try { return JSON.parse(raw); } catch { return null; }
    }
    return null;
  }

  function onAblyComment(msg) {
    // Chống trùng khi Ably replay sau reconnect (mỗi message có id duy nhất)
    if (msg.id) {
      if (state.seenMsgIds.has(msg.id)) return;
      state.seenMsgIds.add(msg.id);
      if (state.seenMsgIds.size > 500) {
        const first = state.seenMsgIds.values().next().value;
        state.seenMsgIds.delete(first);
      }
    }
    const data = parseAblyData(msg.data);
    if (!data || typeof data.text !== 'string') return;
    // Chỉ nhận bình luận từ sau lúc trang tải (trừ 10s sai lệch đồng hồ):
    // Ably có thể replay message trong ~2 phút khi resume sau rớt mạng.
    const ts = Number(data.timestamp || msg.timestamp || 0);
    if (ts && ts < state.pageLoadTs - 10000) return;
    handleIncomingComment(data.user || data.username || 'Khán giả', data.text);
  }

  function onAblyGift(msg) {
    // Chống trùng + lọc quà cũ: cùng cơ chế như bình luận.
    if (msg.id) {
      if (state.seenMsgIds.has(msg.id)) return;
      state.seenMsgIds.add(msg.id);
      if (state.seenMsgIds.size > 500) {
        const first = state.seenMsgIds.values().next().value;
        state.seenMsgIds.delete(first);
      }
    }
    const data = parseAblyData(msg.data);
    if (!data || typeof data.giftName !== 'string') return;
    const ts = Number(data.timestamp || msg.timestamp || 0);
    if (ts && ts < state.pageLoadTs - 10000) return;
    handleIncomingGift(data);
  }

  function onAblyStatus(msg) {
    const data = parseAblyData(msg.data);
    if (!data) return;
    state.tiktokConnected = Boolean(data.connected);
    state.tiktokUsername = data.username || '';
    state.viewerCount = Number(data.viewerCount || 0);

    if (state.tiktokConnected) {
      setWsBadge(`Ably: @${state.tiktokUsername}`, 'connected');
      if (IS_LOCAL_API) els.btnConnectTiktok.textContent = 'Ngắt';
      if (state.demoMode) {
        state.demoMode = false;
        els.toggleDemo.checked = false;
        clearDemoTimers();
      }
    } else {
      setWsBadge(data.message ? `Ably: ${data.message}` : 'Ably: Chưa có live', state.ablyConnected ? 'connected' : '');
      if (IS_LOCAL_API) els.btnConnectTiktok.textContent = 'Kết nối';
    }
    updateConnectionPill();
  }

  // -----------------------------
  // Host Controls Wiring
  // -----------------------------
  function updateStartPauseButton() {
    els.btnStartPause.textContent = state.isRunning ? '⏸ Tạm dừng' : '▶ Tiếp tục';
  }

  function applyDuration(seconds) {
    const val = Math.max(5, Math.min(180, parseInt(seconds, 10) || 45));
    state.questionDuration = val;
    els.inputDuration.value = val;
    els.durationDisplay.textContent = `${val}s`;

    els.presetBtns.forEach((btn) => {
      btn.classList.toggle('active', parseInt(btn.dataset.seconds, 10) === val);
    });

    if (state.phase === 'playing') {
      state.timeLeft = val;
      state.lastTickWholeSec = val;
      renderTimer();
      scheduleDemoCommentsForRound();
    }
  }

  function toggleHostPanel(forceHide = null) {
    const shouldHide =
      forceHide !== null ? forceHide : !els.hostPanel.classList.contains('hidden');
    els.hostPanel.classList.toggle('hidden', shouldHide);
    els.btnShowPanel.classList.toggle('hidden', !shouldHide || state.obsMode);
    setTimeout(updateStageScale, 20);
  }

  function bindHostControls() {
    els.btnStartPause.addEventListener('click', () => {
      ensureAudioCtx();
      if (state.phase === 'ended') {
        resetScoresAndRestart(true);
        return;
      }
      state.isRunning = !state.isRunning;
      updateStartPauseButton();
      if (state.isRunning) {
        lastFrameTs = performance.now();
        scheduleDemoCommentsForRound();
      } else {
        clearDemoTimers();
      }
    });

    els.btnNext.addEventListener('click', () => {
      ensureAudioCtx();
      nextQuestion();
    });

    els.btnReveal.addEventListener('click', () => {
      ensureAudioCtx();
      if (state.phase === 'playing') {
        revealAnswer();
      }
    });

    els.btnReset.addEventListener('click', () => {
      ensureAudioCtx();
      resetScoresAndRestart(false);
    });

    els.btnReplay.addEventListener('click', () => {
      ensureAudioCtx();
      resetScoresAndRestart(true);
    });

    els.presetBtns.forEach((btn) => {
      btn.addEventListener('click', () => applyDuration(btn.dataset.seconds));
    });

    els.btnApplyDuration.addEventListener('click', () => {
      applyDuration(els.inputDuration.value);
    });

    els.btnJumpQuestion.addEventListener('click', () => {
      const target = parseInt(els.inputJumpQuestion.value, 10);
      if (!Number.isNaN(target) && target >= 1 && target <= state.questions.length) {
        startQuestion(target - 1);
      }
    });

    els.toggleDemo.checked = state.demoMode;
    els.toggleDemo.addEventListener('change', () => {
      state.demoMode = els.toggleDemo.checked;
      updateConnectionPill();
      if (state.demoMode && state.phase === 'playing' && state.isRunning) {
        scheduleDemoCommentsForRound();
      } else {
        clearDemoTimers();
      }
    });

    els.toggleAutoNext.checked = state.autoNext;
    els.toggleAutoNext.addEventListener('change', () => {
      state.autoNext = els.toggleAutoNext.checked;
      if (state.phase === 'revealing') updateRevealCountdownUI();
    });

    els.toggleSfx.checked = state.sfxEnabled;
    els.toggleSfx.addEventListener('change', () => {
      state.sfxEnabled = els.toggleSfx.checked;
    });

    els.toggleMusic.checked = state.musicOn;
    els.toggleMusic.addEventListener('change', () => {
      state.musicOn = els.toggleMusic.checked;
      if (state.musicOn) startMusic();
      else stopMusic();
    });

    els.toggleVoice.checked = state.voiceOn;
    els.toggleVoice.addEventListener('change', () => {
      state.voiceOn = els.toggleVoice.checked;
      if (!state.voiceOn && ('speechSynthesis' in window)) speechSynthesis.cancel();
    });

    els.btnHidePanel.addEventListener('click', () => toggleHostPanel(true));
    els.btnShowPanel.addEventListener('click', () => toggleHostPanel(false));

    // Manual test comment submission
    function submitManualTest() {
      const user = els.inputTestUser.value.trim() || 'Host Test';
      const text = els.inputTestComment.value.trim();
      if (!text) return;
      ensureAudioCtx();
      handleIncomingComment(user, text);
      els.inputTestComment.value = '';
    }

    els.btnSendTest.addEventListener('click', submitManualTest);
    els.inputTestComment.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        submitManualTest();
      }
    });

    // Kết nối / ngắt TikTok LIVE — chỉ khi chạy local (server-ably.js cùng
    // origin). Trên GitHub Pages server tự nối qua env, nút bị vô hiệu.
    if (!IS_LOCAL_API) {
      els.btnConnectTiktok.disabled = true;
      els.btnConnectTiktok.title = 'Chỉ dùng khi chạy local — trên GitHub Pages server tự nối TikTok';
      els.btnConnectTiktok.textContent = 'Tự nối';
    }
    els.btnConnectTiktok.addEventListener('click', async () => {
      if (!IS_LOCAL_API) return;
      if (state.tiktokConnected) {
        try { await fetch('/api/disconnect', { method: 'POST' }); } catch { /* ignore */ }
        return;
      }

      const username = els.inputTiktokUser.value.trim().replace(/^@+/, '');
      if (!username) {
        setWsBadge('Nhập username!', 'error');
        els.inputTiktokUser.focus();
        return;
      }

      setWsBadge('Đang kết nối...', '');
      try {
        const res = await fetch('/api/connect', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username })
        });
        if (!res.ok) setWsBadge('Không nối được server local', 'error');
      } catch {
        setWsBadge('Không nối được server local', 'error');
      }
    });

    // Keyboard shortcuts (ignored when typing in inputs)
    window.addEventListener('keydown', (e) => {
      const tag = document.activeElement?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;

      if (e.code === 'Space') {
        e.preventDefault();
        els.btnStartPause.click();
      } else if (e.key === 'n' || e.key === 'N') {
        els.btnNext.click();
      } else if (e.key === 'a' || e.key === 'A') {
        els.btnReveal.click();
      } else if (e.key === 'r' || e.key === 'R') {
        els.btnReset.click();
      } else if (e.key === 'h' || e.key === 'H') {
        if (!state.obsMode) toggleHostPanel();
      }
    });
  }

  // -----------------------------
  // Data Loader & Bootstrap
  // -----------------------------
  async function loadQuestions() {
    // Try fetching questions.json when running over HTTP(S) so user edits load live
    if (window.location.protocol === 'http:' || window.location.protocol === 'https:') {
      try {
        const res = await fetch('./questions.json', { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            return data;
          }
        }
      } catch {
        // Fallback below
      }
    }

    // Fallback to questions-data.js (works cleanly when opening index.html via file://)
    if (Array.isArray(window.QUESTIONS_DATA) && window.QUESTIONS_DATA.length > 0) {
      return window.QUESTIONS_DATA;
    }

    throw new Error('Không tìm thấy dữ liệu câu hỏi (questions.json / questions-data.js).');
  }

  async function init() {
    if (state.obsMode) {
      els.appShell.classList.add('obs-mode');
    }

    // Apply initial duration display & presets
    els.inputDuration.value = state.questionDuration;
    els.durationDisplay.textContent = `${state.questionDuration}s`;
    els.presetBtns.forEach((btn) => {
      btn.classList.toggle('active', parseInt(btn.dataset.seconds, 10) === state.questionDuration);
    });

    bindHostControls();
    updateStageScale();
    updateConnectionPill();
    renderLeaderboard();
    renderDonors();

    try {
      state.questions = await loadQuestions();
      buildTopicIndex();
      els.inputJumpQuestion.max = String(state.questions.length);

      const startIdx =
        !Number.isNaN(paramStart) && paramStart >= 1 && paramStart <= state.questions.length
          ? paramStart - 1
          : 0;

      startQuestion(startIdx);
      startMusic();
      if (!Number.isNaN(paramTease) && paramTease >= 1 && paramTease <= 99) {
        setTimeout(() => triggerTeacherTease(paramTease), 1500);
      }

      // Kết nối Ably để nhận bình luận thật (trang tĩnh GitHub Pages cũng dùng đường này)
      connectAbly();
    } catch (err) {
      els.questionText.textContent = err.message;
    }
  }

  // Expose minimal debug hooks for testing / OBS scripting
  window.HocToanGame = {
    getState: () => ({
      currentIndex: state.currentIndex,
      phase: state.phase,
      timeLeft: state.timeLeft,
      roundWinner: state.roundWinner,
      totalQuestions: state.questions.length,
      totalComments: state.totalComments,
      leaderboard: getSortedLeaderboard(),
      topic: state.questions[state.currentIndex] ? state.questions[state.currentIndex].topic : null,
      topics: state.topics.slice(),
      bonusSecondsThisRound: state.bonusSecondsThisRound,
      hardModeQuestionsLeft: state.hardModeQuestionsLeft,
      hintsHidden: state.hintsHidden,
      revealedDigits: state.revealedDigitIdx.size,
      voiceOn: state.voiceOn,
      musicOn: state.musicOn,
      donors: getSortedDonors().map((d) => ({
        name: d.name,
        totalCoins: d.totalCoins,
        giftCount: d.giftCount
      }))
    }),
    submitComment: handleIncomingComment,
    submitGift: handleIncomingGift,
    teaseTeacher: triggerTeacherTease,
    ably: () => ({
      connected: state.ablyConnected,
      channel: state.ablyChannel ? state.ablyChannel.name : null,
      pageLoadTs: state.pageLoadTs
    }),
    revealNow: revealAnswer,
    nextQuestion,
    setDuration: applyDuration,
    jumpTo: (num) => startQuestion(Math.max(0, Math.min(state.questions.length - 1, num - 1)))
  };

  init();
})();
