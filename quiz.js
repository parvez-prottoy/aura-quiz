
// ══════════════════════════════════════════════════════════
// STATE
// ══════════════════════════════════════════════════════════
const answers = {};
let currentQ = 'q1';
let trackQueue = []; // which category tracks to run
let trackIndex = 0;

// ══════════════════════════════════════════════════════════
// QUESTION SEQUENCE MAP
// ══════════════════════════════════════════════════════════
const TOTAL_QUESTIONS = 12; // approximate for progress bar

// ══════════════════════════════════════════════════════════
// SHOW / HIDE
// ══════════════════════════════════════════════════════════
function showCard(id) {
  document.querySelectorAll('.question-card, .exit-card, .results-wrap').forEach(el => {
    el.classList.remove('active');
  });
  const el = document.getElementById(id);
  if (el) el.classList.add('active');
  currentQ = id;
  updateProgress();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function updateProgress() {
  // Per-track question sequences (ordered as shown to the user)
  const TRACK_SEQUENCES = {
    intro:      ['q1','q2b','q2'],
    goals:      ['q3','q4','q5'],
    weightloss: ['q6','q6a','q6b','q6c','q7','q8','q8b'],
    hormones:   ['q10','q11a_m','q11b_m','q11c_m','q11d_m','q11',
                       'q11a_f','q11b_f','q11c_f','q11d_f','q11f'],
    peptides:   ['q12','q13','q14','q15','q16','q17','q17a','q17b','q17c'],
    sexual:     ['q19','q19b','q19c'],
    aesthetics: ['q20','q21','q21a','q21b','q21c','q21d','q22a','q22b','q22c','q22d'],
    lifestyle:  ['q23'],
  };
  const TRACK_LABELS = {
    intro: 'Before We Begin', goals: 'Your Goals',
    weightloss: 'Weight Loss', hormones: 'Hormones',
    peptides: 'Peptides & Performance', sexual: 'Sexual Health',
    aesthetics: 'Aesthetics', lifestyle: 'Lifestyle',
  };

  const fill   = document.getElementById('progressFill');
  const label  = document.getElementById('progressText');
  const count  = document.getElementById('progressCount');

  if (currentQ === 'exitCard') {
    fill.style.width = '100%';
    label.textContent = 'Screening complete';
    count.textContent = '';
    return;
  }
  if (document.getElementById('resultsWrap')?.classList.contains('active')) {
    fill.style.width = '100%';
    label.textContent = 'Your Aura Match';
    count.textContent = '✓ Complete';
    return;
  }

  // Find which track this card belongs to
  let trackKey = null, posInTrack = 0, trackLen = 0;
  for (const [key, seq] of Object.entries(TRACK_SEQUENCES)) {
    const idx = seq.indexOf(currentQ);
    if (idx !== -1) { trackKey = key; posInTrack = idx + 1; trackLen = seq.length; break; }
  }

  if (!trackKey) {
    // Fallback — unknown card, just show quiz name
    label.textContent = 'Aura Discovery Quiz';
    count.textContent = '';
    fill.style.width = '0%';
    return;
  }

  // Overall percentage: weight intro+goals as ~20%, each active track as equal shares of the rest
  const activeTrackCount = Math.max(trackQueue.length, 1);
  const INTRO_PCT = 20;
  const TRACK_PCT = (100 - INTRO_PCT) / (activeTrackCount + 1); // +1 for lifestyle

  let pct = 0;
  if (trackKey === 'intro') {
    pct = Math.round((posInTrack / trackLen) * (INTRO_PCT / 2));
  } else if (trackKey === 'goals') {
    pct = Math.round(INTRO_PCT / 2 + (posInTrack / trackLen) * (INTRO_PCT / 2));
  } else if (trackKey === 'lifestyle') {
    pct = Math.round(INTRO_PCT + activeTrackCount * TRACK_PCT + (posInTrack / trackLen) * TRACK_PCT);
  } else {
    const tIdx = trackQueue.indexOf(trackKey);
    const base = tIdx !== -1 ? tIdx : 0;
    pct = Math.round(INTRO_PCT + base * TRACK_PCT + (posInTrack / trackLen) * TRACK_PCT);
  }
  pct = Math.min(pct, 99); // never hit 100 until results

  fill.style.width = pct + '%';
  label.textContent = TRACK_LABELS[trackKey] || 'Aura Discovery Quiz';
  count.textContent = `${posInTrack} of ${trackLen}`;
}

// ══════════════════════════════════════════════════════════
// SELECTION HELPERS
// ══════════════════════════════════════════════════════════
function selectSingle(el) {
  const q = el.dataset.q;
  el.closest('.options').querySelectorAll('.option').forEach(o => o.classList.remove('selected'));
  el.classList.add('selected');
  answers[q] = el.dataset.val;
  const btn = document.getElementById('btn-' + q);
  if (btn) btn.disabled = false;
}

function selectMulti(el) {
  // deselect any exclusive "none" option in this group
  el.closest('.options').querySelectorAll('.option').forEach(o => {
    if (o !== el && o.getAttribute('onclick') && o.getAttribute('onclick').includes('selectMultiExclusive')) {
      o.classList.remove('selected');
    }
  });
  el.classList.toggle('selected');
  const q = el.dataset.q;
  const selected = Array.from(el.closest('.options').querySelectorAll('.option.selected')).map(o => o.dataset.val);
  answers[q] = selected;
  const btn = document.getElementById('btn-' + q);
  if (btn) btn.disabled = selected.length === 0;
}

function selectMultiExclusive(el) {
  const q = el.dataset.q;
  el.closest('.options').querySelectorAll('.option').forEach(o => o.classList.remove('selected'));
  el.classList.add('selected');
  answers[q] = [el.dataset.val];
  const btn = document.getElementById('btn-' + q);
  if (btn) btn.disabled = false;
}

function nextQ(qid, nextId) {
  showCard(nextId);
}

function goBack(fromId, toId) {
  showCard(toId);
}

// ══════════════════════════════════════════════════════════
// Q1: Age gate
// ══════════════════════════════════════════════════════════
function nextFromQ1() {
  if (answers.q1 === 'no') { showCard('exitCard'); return; }
  showCard('q2b');
}

// ══════════════════════════════════════════════════════════
// Q2: Pregnancy gate
// ══════════════════════════════════════════════════════════
function nextFromQ2() {
  if (answers.q2 === 'yes') { showCard('exitCard'); return; }
  showCard('q3');
}

function nextFromQ2b() {
  if (answers.q2b === 'male') {
    showCard('q3');
  } else {
    showCard('q2');
  }
}

// ══════════════════════════════════════════════════════════
// Q3 → build track queue
// ══════════════════════════════════════════════════════════
function nextFromQ3() {
  const goals = Array.isArray(answers.q3) ? answers.q3 : [answers.q3];
  // build track queue based on selected goals
  trackQueue = [];
  if (goals.includes('weightloss')) trackQueue.push('weightloss');
  if (goals.includes('hormones')) trackQueue.push('hormones');
  if (goals.includes('peptides') || goals.includes('unsure')) trackQueue.push('peptides');
  if (goals.includes('unsure') && !trackQueue.includes('hormones')) trackQueue.push('hormones');
  if (goals.includes('sexual')) trackQueue.push('sexual');
  if (goals.includes('aesthetics')) trackQueue.push('aesthetics');
  // deduplicate
  trackQueue = [...new Set(trackQueue)];
  showCard('q4');
}

// ══════════════════════════════════════════════════════════
// Q4 + Q5 → route to first track
// ══════════════════════════════════════════════════════════
function nextFromQ4() { showCard('q5'); }
function nextFromQ5() {
  // supplement goals with frustration signals
  const goals = Array.isArray(answers.q3) ? answers.q3 : [answers.q3];
  const frustrations = Array.isArray(answers.q4) ? answers.q4 : [answers.q4];
  if (frustrations.includes('energy') || frustrations.includes('aging')) {
    // Only auto-add if patient already has a performance/wellness interest
    // Don't force peptides on someone who only wants skin or sexual health
    const hasWellnessGoal = goals.some(g => ['weightloss','hormones','peptides','unsure'].includes(g));
    if (hasWellnessGoal) {
      if (!trackQueue.includes('peptides')) trackQueue.push('peptides');
      if (!trackQueue.includes('hormones')) trackQueue.push('hormones');
    }
  }
  if (frustrations.includes('weight')) {
    if (!trackQueue.includes('weightloss')) trackQueue.unshift('weightloss');
  }
  if (frustrations.includes('brain') || frustrations.includes('recovery')) {
    const hasWellnessGoal = goals.some(g => ['weightloss','hormones','peptides','unsure'].includes(g));
    if (hasWellnessGoal && !trackQueue.includes('peptides')) trackQueue.push('peptides');
  }
  if (frustrations.includes('desire')) {
    if (!trackQueue.includes('sexual')) trackQueue.push('sexual');
  }
  if (frustrations.includes('confidence')) {
    if (!trackQueue.includes('aesthetics')) trackQueue.push('aesthetics');
  }
  trackQueue = [...new Set(trackQueue)];
  trackIndex = 0;
  routeToNextTrack();
}

function routeToNextTrack() {
  if (trackIndex >= trackQueue.length) {
    // all tracks done → lifestyle
    showCard('q23');
    return;
  }
  const track = trackQueue[trackIndex];
  trackIndex++;
  if (track === 'weightloss') showCard('q6');
  else if (track === 'hormones') { buildHormoneSymptoms(); showCard('q10'); }
  else if (track === 'peptides') showCard('q12');
  else if (track === 'sexual') { buildSexualConcerns(); showCard('q19'); }
  else if (track === 'aesthetics') showCard('q20');
  else routeToNextTrack(); // skip unknown
}

// ══════════════════════════════════════════════════════════
// WEIGHT LOSS track end → next track
// ══════════════════════════════════════════════════════════
function nextFromQ8() {
  showCard('q8b');
}

function nextFromQ6() {
  if (answers.q6 === 'skip_wl') {
    answers.q7 = null; answers.q8 = null; answers.q8b = null;
    trackQueue = trackQueue.filter(t => t !== 'weightloss');
    routeToNextTrack();
  } else {
    showCard('q6a');
  }
}

function nextFromWL() {
  routeToNextTrack();
}

// ══════════════════════════════════════════════════════════
// HORMONES — dynamic symptom options
// ══════════════════════════════════════════════════════════
function buildHormoneSymptoms() {
  const sex = answers.q2b;
  const container = document.getElementById('hormoneSymptomsOptions');
  const maleSymptoms = [
    { val: 'low_t_energy', label: 'Low energy and constant fatigue' },
    { val: 'low_libido', label: 'Reduced libido or sex drive' },
    { val: 'mood', label: 'Mood changes, irritability, or depression' },
    { val: 'body_comp', label: 'Increased body fat, especially belly fat' },
    { val: 'muscle_loss', label: 'Loss of muscle mass or strength' },
    { val: 'brain_fog', label: 'Brain fog or reduced mental sharpness' },
    { val: 'sleep_issues', label: 'Poor sleep quality' },
  ];
  const femaleSymptoms = [
    { val: 'hot_flashes', label: 'Hot flashes or night sweats' },
    { val: 'mood_swings', label: 'Mood swings, anxiety, or irritability' },
    { val: 'low_libido_f', label: 'Low libido or changes in arousal' },
    { val: 'sleep_f', label: 'Sleep disruption or insomnia' },
    { val: 'weight_f', label: 'Unexplained weight gain, especially midsection' },
    { val: 'skin_hair_f', label: 'Skin changes, hair thinning, or dryness' },
    { val: 'brain_fog_f', label: 'Brain fog or memory changes' },
  ];
  const symptoms = sex === 'male' ? maleSymptoms : femaleSymptoms;
  container.innerHTML = symptoms.map(s => `
    <div class="option multi" data-q="q10" data-val="${s.val}" onclick="selectMulti(this)">
      <div class="option-check"></div>
      <div class="option-label">${s.label}</div>
    </div>
  `).join('');
  // reset answer
  answers.q10 = [];
  document.getElementById('btn-q10').disabled = true;
}

function nextFromHormones() {
  // after q11 or q11f, continue to next track
  routeToNextTrack();
}

function nextFromQ11d_f() {
  // If cycle status already tells us menopause status, skip Q11f and infer the answer
  const cycleStatus = answers.q11b_f;
  if (cycleStatus === 'stopped_cycle' || cycleStatus === 'surgical_meno') {
    // Postmenopausal status already confirmed — pre-fill q11f and skip
    answers.q11f = 'post';
    nextFromHormones();
  } else {
    // Regular or irregular cycle — menopausal stage is still ambiguous, show Q11f
    showCard('q11f');
  }
}

// After q10, route to male or female followup
function nextFromQ10() {
  if (answers.q2b === 'male') showCard('q11a_m');
  else showCard('q11a_f');
}
// override nextQ for q10 — always use nextFromQ10
document.addEventListener('DOMContentLoaded', () => {
  const btn10 = document.getElementById('btn-q10');
  if (btn10) btn10.onclick = nextFromQ10;
});

// ══════════════════════════════════════════════════════════
// PEPTIDES track end → next track
// ══════════════════════════════════════════════════════════
function nextFromPeptides() {
  showCard('q17a');
}
function nextFromPeptidesExpanded() {
  // Handle upsell interests from Q17c
  const upsells = Array.isArray(answers.q17c) ? answers.q17c : [];
  if (upsells.includes('interested_hormones') && !trackQueue.includes('hormones')) trackQueue.push('hormones');
  if (upsells.includes('interested_wl') && !trackQueue.includes('weightloss')) trackQueue.push('weightloss');
  if (upsells.includes('interested_skin_pep') && !trackQueue.includes('aesthetics')) trackQueue.push('aesthetics');
  routeToNextTrack();
}

// ══════════════════════════════════════════════════════════
// SEXUAL — dynamic concern options
// ══════════════════════════════════════════════════════════
function buildSexualConcerns() {
  const sex = answers.q2b;
  const container = document.getElementById('sexualConcernOptions');
  const maleConcerns = [
    { val: 'ed', label: 'Difficulty getting or maintaining an erection', sub: 'ED, erectile function' },
    { val: 'libido_m', label: 'Low libido or reduced sexual desire', sub: 'I have function but low drive' },
    { val: 'performance', label: 'Performance anxiety or confidence', sub: 'The issue is mostly mental or situational' },
    { val: 'both_m', label: 'Both function and desire', sub: 'Multiple things going on at once' },
    { val: 'other_m', label: 'Something else — overall sexual wellness', sub: 'Not sure how to describe it' },
  ];
  const femaleConcerns = [
    { val: 'desire_f', label: 'Low desire or interest in sex', sub: 'Hypoactive sexual desire, rarely in the mood' },
    { val: 'arousal_f', label: 'Difficulty with arousal or lubrication', sub: 'The mind is willing but the body isn\'t responding' },
    { val: 'orgasm_f', label: 'Difficulty reaching orgasm or reduced sensation', sub: 'Takes too long or doesn\'t happen' },
    { val: 'both_f', label: 'Multiple things — desire, arousal, and sensation', sub: '' },
    { val: 'other_f', label: 'Something else — overall sexual wellness', sub: '' },
  ];
  const concerns = sex === 'male' ? maleConcerns : femaleConcerns;
  container.innerHTML = concerns.map(c => `
    <div class="option" data-q="q19" data-val="${c.val}" onclick="selectSingle(this)">
      <div class="option-check"><div class="option-check-inner"></div></div>
      <div>
        <div class="option-label">${c.label}</div>
        ${c.sub ? `<span class="option-sub">${c.sub}</span>` : ''}
      </div>
    </div>
  `).join('');
  answers.q19 = null;
  document.getElementById('btn-q19').disabled = true;
}

function buildQ19b() {
  const sex = answers.q2b;
  const concern = answers.q19;
  const container = document.getElementById('q19bOptions');
  let options = [];

  if (sex === 'male') {
    if (concern === 'ed') {
      options = [
        { val: 'cant_get', label: 'I can\'t get an erection at all', sub: 'Even with stimulation' },
        { val: 'cant_maintain', label: 'I can get one but lose it quickly', sub: 'Especially during sex' },
        { val: 'partial', label: 'I get partial erections but not fully firm', sub: '' },
        { val: 'morning_only', label: 'Morning erections are fine — it\'s situational or with a partner', sub: 'May be anxiety or psychological' },
        { val: 'inconsistent', label: 'It\'s inconsistent — sometimes fine, sometimes not', sub: '' },
      ];
    } else if (concern === 'libido_m') {
      options = [
        { val: 'no_desire', label: 'I rarely or never feel sexual desire', sub: 'It\'s mostly absent' },
        { val: 'less_than_before', label: 'My drive has noticeably dropped from what it used to be', sub: '' },
        { val: 'low_with_partner', label: 'Low desire specifically with my partner', sub: 'May be relational or situational' },
        { val: 'no_fantasy', label: 'I don\'t think about sex or initiate anymore', sub: '' },
      ];
    } else if (concern === 'performance') {
      options = [
        { val: 'anxiety', label: 'I get anxious before or during sex and lose my erection', sub: '' },
        { val: 'premature', label: 'I finish too quickly', sub: 'Premature ejaculation' },
        { val: 'delayed', label: 'I have difficulty finishing', sub: 'Delayed ejaculation or anorgasmia' },
        { val: 'confidence', label: 'General confidence or self-consciousness during sex', sub: '' },
      ];
    } else if (concern === 'both_m') {
      options = [
        { val: 'ed_primary', label: 'ED is the bigger issue — desire is secondary', sub: '' },
        { val: 'libido_primary', label: 'Low desire is the bigger issue — function is secondary', sub: '' },
        { val: 'equally_both', label: 'Both are equally affecting me', sub: '' },
      ];
    } else {
      options = [
        { val: 'general_wellness', label: 'I want to improve overall sexual performance and energy', sub: '' },
        { val: 'stamina', label: 'Stamina and endurance', sub: '' },
        { val: 'intensity', label: 'Reduced intensity or sensation', sub: '' },
      ];
    }
  } else {
    // Female
    if (concern === 'desire_f') {
      options = [
        { val: 'never_in_mood', label: 'I\'m almost never in the mood, even when conditions are right', sub: '' },
        { val: 'used_to_have', label: 'My desire has significantly decreased over time', sub: 'Hormonal or age-related' },
        { val: 'responsive_only', label: 'I only feel desire in response to physical touch — never spontaneous', sub: '' },
        { val: 'stress_related', label: 'Stress and mental load are killing my desire', sub: '' },
      ];
    } else if (concern === 'arousal_f') {
      options = [
        { val: 'no_lubrication', label: 'Dryness or insufficient lubrication', sub: 'Even when mentally aroused' },
        { val: 'slow_arousal', label: 'Takes very long to become physically aroused', sub: '' },
        { val: 'pain', label: 'Discomfort or pain during sex', sub: 'Dyspareunia' },
        { val: 'no_engorgement', label: 'Reduced sensitivity or engorgement', sub: '' },
      ];
    } else if (concern === 'orgasm_f') {
      options = [
        { val: 'cant_orgasm', label: 'I rarely or never reach orgasm', sub: '' },
        { val: 'takes_too_long', label: 'Takes much longer than it used to', sub: '' },
        { val: 'less_intense', label: 'Orgasms are less intense than before', sub: '' },
        { val: 'only_solo', label: 'I can with myself but not with a partner', sub: '' },
      ];
    } else {
      options = [
        { val: 'all_three', label: 'All of the above — desire, arousal, and orgasm are all affected', sub: '' },
        { val: 'emotional_disconnect', label: 'Emotional disconnect or feeling detached during sex', sub: '' },
        { val: 'hormonal_feeling', label: 'I think it\'s hormonal — menopause or hormonal changes', sub: '' },
        { val: 'general_wellness_f', label: 'General sexual wellness and vitality', sub: '' },
      ];
    }
  }

  container.innerHTML = options.map(o => `
    <div class="option" data-q="q19b" data-val="${o.val}" onclick="selectSingle(this)">
      <div class="option-check"><div class="option-check-inner"></div></div>
      <div>
        <div class="option-label">${o.label}</div>
        ${o.sub ? `<span class="option-sub">${o.sub}</span>` : ''}
      </div>
    </div>
  `).join('');
  answers.q19b = null;
  document.getElementById('btn-q19b').disabled = true;
}

function buildQ19c() {
  const sex = answers.q2b;
  const concern = answers.q19;
  const container = document.getElementById('q19cOptions');
  let options = [];

  if (sex === 'male') {
    options = [
      { val: 'tried_pde5', label: 'I\'ve tried Viagra or Cialis before', sub: 'With or without success' },
      { val: 'hasnt_tried', label: 'I haven\'t tried any ED medications yet', sub: '' },
      { val: 'pde5_didnt_work', label: 'PDE5 inhibitors (Viagra/Cialis) didn\'t work well for me', sub: 'Or stopped working' },
      { val: 'low_t_suspected', label: 'I suspect low testosterone may be part of the issue', sub: '' },
      { val: 'want_daily', label: 'I want something I can take daily, not just on demand', sub: '' },
    ];
  } else {
    options = [
      { val: 'post_menopause', label: 'This started or worsened around menopause', sub: '' },
      { val: 'post_pregnancy', label: 'This started or worsened after pregnancy or childbirth', sub: '' },
      { val: 'on_antidepressants', label: 'I\'m on antidepressants — this may be a side effect', sub: 'SSRIs are a common cause of sexual dysfunction' },
      { val: 'never_been_easy', label: 'This has always been difficult for me', sub: '' },
      { val: 'want_topical', label: 'I\'d prefer a topical option rather than something oral', sub: '' },
    ];
  }

  container.innerHTML = options.map(o => `
    <div class="option" data-q="q19c" data-val="${o.val}" onclick="selectSingle(this)">
      <div class="option-check"><div class="option-check-inner"></div></div>
      <div>
        <div class="option-label">${o.label}</div>
        ${o.sub ? `<span class="option-sub">${o.sub}</span>` : ''}
      </div>
    </div>
  `).join('');
  answers.q19c = null;
  // Q19c is optional context — enable button immediately
  document.getElementById('btn-q19c').disabled = false;
}

function nextFromQ19() {
  buildQ19b();
  showCard('q19b');
}

function nextFromQ19b() {
  buildQ19c();
  showCard('q19c');
}

function nextFromSexual() {
  routeToNextTrack();
}

// ══════════════════════════════════════════════════════════
// AESTHETICS track end → next track
// ══════════════════════════════════════════════════════════
function nextFromAesthetics() {
  const aesthetic = Array.isArray(answers.q20) ? answers.q20 : [answers.q20];
  const noneSelected = aesthetic.includes('none_ae');
  const needsSkin = !noneSelected && aesthetic.some(v => v === 'skin' || v === 'both_ae');
  const needsHair = !noneSelected && aesthetic.some(v => v === 'hair' || v === 'both_ae');

  if (noneSelected || (!needsSkin && !needsHair)) {
    answers.q21 = 'na_skin';
    answers.q22 = answers.q2b === 'male' ? 'male_hair' : 'female_hair';
    routeToNextTrack();
    return;
  }
  answers.q22 = answers.q2b === 'male' ? 'male_hair' : 'female_hair';
  if (!needsSkin) { answers.q21 = 'na_skin'; }

  if (needsSkin) {
    showCard('q21'); // Q21 → Q21a → Q21b → Q21c → Q21d(female) or nextFromAesthetics
  } else if (needsHair) {
    showCard('q22a'); // Hair expanded path
  } else {
    routeToNextTrack();
  }
}

function nextFromSkinExpanded() {
  // After Q21c — show hormonal question for females, or go to hair / next track
  const aesthetic = Array.isArray(answers.q20) ? answers.q20 : [answers.q20];
  const needsHair = aesthetic.some(v => v === 'hair' || v === 'both_ae');
  if (answers.q2b === 'female') {
    showCard('q21d');
  } else if (needsHair) {
    showCard('q22a');
  } else {
    routeToNextTrack();
  }
}

function nextFromQ21d() {
  // After Q21d (hormonal skin question) — go to hair if needed, else next track
  const aesthetic = Array.isArray(answers.q20) ? answers.q20 : [answers.q20];
  const needsHair = aesthetic.some(v => v === 'hair' || v === 'both_ae');
  if (needsHair) {
    showCard('q22a');
  } else {
    routeToNextTrack();
  }
}

function nextFromHairExpanded() {
  // After Q22c — show female cause question for females, else finish
  if (answers.q2b === 'female') {
    showCard('q22d');
  } else {
    routeToNextTrack();
  }
}

// ══════════════════════════════════════════════════════════
// LIFESTYLE
// ══════════════════════════════════════════════════════════
function goBackFromLifestyle() {
  // go back to last track question
  if (!trackQueue || trackQueue.length === 0) { showCard('q5'); return; }
  const lastTrack = trackQueue[trackQueue.length - 1];
  if (lastTrack === 'weightloss') showCard('q8b');
  else if (lastTrack === 'hormones') {
    if (answers.q2b === 'male') {
      showCard('q11');
    } else {
      // Q11f is skipped for stopped_cycle / surgical_meno — back goes to q11d_f in that case
      const cycleStatus = answers.q11b_f;
      const q11fWasSkipped = cycleStatus === 'stopped_cycle' || cycleStatus === 'surgical_meno';
      showCard(q11fWasSkipped ? 'q11d_f' : 'q11f');
    }
  }
  else if (lastTrack === 'peptides') showCard('q17c');
  else if (lastTrack === 'sexual') showCard('q19c');
  else if (lastTrack === 'aesthetics') {
    const ae = Array.isArray(answers.q20) ? answers.q20 : [answers.q20];
    const hadHair = ae.some(v => v === 'hair' || v === 'both_ae');
    const hadSkin = ae.some(v => v === 'skin' || v === 'both_ae');
    if (hadHair) showCard(answers.q2b === 'female' ? 'q22d' : 'q22c');
    else if (hadSkin) showCard(answers.q2b === 'female' ? 'q21d' : 'q21c');
    else showCard('q20');
  }
  else showCard('q5');
}

function nextFromLifestyle() {
  buildResults();
}

// ══════════════════════════════════════════════════════════
// RESULTS ENGINE
// ══════════════════════════════════════════════════════════
const PRODUCTS = {

  // ── WEIGHT LOSS — PRODUCTS ──
  sema_b12: {
    category: 'Weight Loss', name: 'Semaglutide + B12',
    desc: 'The most prescribed GLP-1 in telehealth. Semaglutide suppresses appetite and slows gastric emptying; B12 combats the fatigue common during caloric restriction. First-line GLP-1 with 10–15% average body weight reduction.',
    url: '/weight-loss', lifestyle: true
  },
  sema_glycine: {
    category: 'Weight Loss', name: 'Semaglutide + Glycine',
    desc: 'Semaglutide with glycine added to buffer GI side effects — nausea, bloating, cramping — the #1 reason patients stop GLP-1 therapy early. The smart choice for GI-sensitive patients or prior GLP-1 dropouts.',
    url: '/weight-loss', lifestyle: true
  },
  sema_carnitine: {
    category: 'Weight Loss', name: 'Semaglutide + L-Carnitine',
    desc: 'Semaglutide paired with L-Carnitine, which shuttles fatty acids into mitochondria for energy. Fat loss without the fatigue — ideal for active patients pairing weight loss with a fitness plan.',
    url: '/weight-loss', lifestyle: true
  },
  tirz_b12: {
    category: 'Weight Loss', name: 'Tirzepatide + B12',
    desc: 'Tirzepatide targets both GLP-1 and GIP receptors simultaneously, producing ~20–22% average body weight reduction in trials — nearly double semaglutide. B12 supports energy throughout treatment.',
    url: '/weight-loss', lifestyle: true
  },
  tirz_glycine: {
    category: 'Weight Loss', name: 'Tirzepatide + Glycine',
    desc: 'Tirzepatide\'s dual-receptor power with glycine for digestive comfort. Ideal for patients stepping up from semaglutide who experienced GI issues, or new patients who want tirzepatide\'s results with built-in GI support.',
    url: '/weight-loss', lifestyle: true
  },
  tirz_carnitine: {
    category: 'Weight Loss', name: 'Tirzepatide + L-Carnitine',
    desc: 'The strongest performance-oriented weight loss formula available. Tirzepatide\'s industry-leading fat loss paired with L-Carnitine for fat metabolism and cellular energy. For athletes and active professionals.',
    url: '/weight-loss', lifestyle: true
  },
  sema_oral: {
    category: 'Weight Loss', name: 'Semaglutide Oral (RDT / Sublingual)',
    desc: 'All the clinical efficacy of semaglutide with zero needles. Available as a rapid-dissolve tablet or sublingual liquid taken daily. The most accessible GLP-1 entry point — strong conversion product for needle-averse patients.',
    url: '/weight-loss', lifestyle: true
  },
  tirz_oral: {
    category: 'Weight Loss', name: 'Tirzepatide Oral (RDT / Sublingual)',
    desc: 'Tirzepatide\'s dual-receptor power in a fully needle-free format. The most effective weight loss molecule available, in the most accessible delivery method. No injections required.',
    url: '/weight-loss', lifestyle: true
  },
  sema_ondansetron: {
    category: 'Weight Loss', name: 'Semaglutide + Ondansetron ODT',
    desc: 'Semaglutide co-formulated with ondansetron in a single oral dissolving tablet. Ondansetron blocks nausea receptors at the receptor level — the smartest anti-dropout product for new GLP-1 patients.',
    url: '/weight-loss', lifestyle: true
  },
  bupropion_naltrexone: {
    category: 'Weight Loss', name: 'Bupropion / Naltrexone',
    desc: 'A non-GLP oral weight loss protocol targeting appetite and the brain\'s reward/craving pathways simultaneously. Addresses emotional eating and cravings — no injections required.',
    url: '/weight-loss', lifestyle: true
  },
  metformin: {
    category: 'Weight Loss', name: 'Metformin',
    desc: 'Improves insulin sensitivity and reduces hepatic glucose output. Used standalone for insulin-resistant patients or stacked with other weight loss protocols. Also considered for metabolic and thyroid conditions.',
    url: '/weight-loss', lifestyle: true
  },
  sema_microdose: {
    category: 'Weight Loss', name: 'Semaglutide (Microdose)',
    desc: 'Low-dose semaglutide (0.05–0.1mg/week) for metabolic support, weight maintenance post-loss, or dose-sensitive patients. A lower-commitment entry point or long-term maintenance protocol.',
    url: '/weight-loss', lifestyle: true
  },
  tirz_microdose: {
    category: 'Weight Loss', name: 'Tirzepatide (Microdose)',
    desc: 'Microdose tirzepatide for a gentler introduction to the dual GLP-1+GIP molecule — or for post-weight-loss maintenance. Same use case as sema microdose with tirzepatide\'s superior mechanism.',
    url: '/weight-loss', lifestyle: true
  },
  tesofensine: {
    category: 'Weight Loss', name: 'Tesofensine',
    desc: 'A triple monoamine reuptake inhibitor (dopamine, serotonin, norepinephrine) producing potent central appetite suppression — ~10–14% weight loss in trials. Rarely offered in telehealth. A true clinical differentiator.',
    url: '/weight-loss', lifestyle: true
  },
  phentermine_topiramate: {
    category: 'Weight Loss', name: 'Phentermine / Topiramate (Qsymia)',
    desc: 'FDA-approved combination: phentermine for appetite suppression plus topiramate for CNS satiety signaling. Stronger and longer-lasting than phentermine alone. Schedule IV controlled substance.',
    url: '/weight-loss', lifestyle: true
  },

  // ── WEIGHT LOSS — STACKS ──
  starter_pack: {
    category: 'Weight Loss', name: 'The Starter Pack',
    desc: 'Semaglutide + B12 with Ondansetron ODT — the most beginner-friendly GLP-1 protocol available. Appetite control plus pharmaceutical nausea prevention built in from day one. Recommended for all new GLP-1 patients.',
    url: '/weight-loss', lifestyle: true
  },
  tirzepatide_starter: {
    category: 'Weight Loss', name: 'The Tirzepatide Starter',
    desc: 'Tirzepatide + B12 with Ondansetron ODT — the strongest first-step protocol available. ~20–22% average body weight reduction in trials. Dropout protection on the strongest molecule we offer.',
    url: '/weight-loss', lifestyle: true
  },
  sema_oral_starter: {
    category: 'Weight Loss', name: 'The Sema Oral Starter',
    desc: 'Semaglutide Oral RDT with Ondansetron ODT — needle-free GLP-1 with nausea protection built in. Lowest-friction entry point for patients who won\'t inject. High-volume acquisition product.',
    url: '/weight-loss', lifestyle: true
  },
  performance_stack: {
    category: 'Weight Loss', name: 'The Performance Stack',
    desc: 'Semaglutide + L-Carnitine with CJC-1295 / Ipamorelin. GLP-1 fat loss, cellular fat metabolism, and muscle-preserving GH stimulation. A leaner, stronger physique — not just a smaller one. Best paired with an active fitness plan.',
    url: '/weight-loss', lifestyle: true
  },
  visceral_fat_stack: {
    category: 'Weight Loss', name: 'The Visceral Fat Stack',
    desc: 'Tirzepatide + B12, Tesamorelin, and AOD 9604 — three non-overlapping fat loss mechanisms in one protocol. Tirzepatide for systemic fat loss, tesamorelin (FDA-approved GHRH) for clinical visceral fat reduction, AOD 9604 for direct lipolysis. Not available at any major telehealth competitor.',
    url: '/weight-loss', lifestyle: true
  },
  metabolic_stack: {
    category: 'Weight Loss', name: 'The Metabolic Stack',
    desc: 'Semaglutide + B12, AOD 9604, and MOTS-C. GLP-1 appetite control + direct fat lipolysis + AMPK activation at the mitochondrial level. For patients who want weight loss and metabolic health improvement together.',
    url: '/weight-loss', lifestyle: true
  },
  oral_kit: {
    category: 'Weight Loss', name: 'The Oral Kit',
    desc: 'Bupropion/Naltrexone + Metformin — a complete needle-free weight loss protocol. Appetite and craving control plus metabolic correction in two oral medications. Covers the two main non-GLP drivers of weight gain.',
    url: '/weight-loss', lifestyle: true
  },
  non_glp_power_stack: {
    category: 'Weight Loss', name: 'The Non-GLP Power Stack',
    desc: 'Tesofensine + Metformin + AOD 9604 — the strongest non-GLP protocol available. Central appetite suppression, insulin/metabolic correction, and direct fat lipolysis. Not offered by any major telehealth competitor.',
    url: '/weight-loss', lifestyle: true
  },
  maintenance_stack: {
    category: 'Weight Loss', name: 'The GLP-1 Maintenance Stack',
    desc: 'AOD 9604 + CJC/Ipamorelin + L-Carnitine Injectable. Keeps fat metabolism, lean muscle preservation, and cellular energy running after tapering off GLP-1 therapy. Protects results long-term.',
    url: '/weight-loss', lifestyle: true
  },

  // ── HORMONES — MEN'S PRODUCTS ──
  testosterone: {
    category: 'Hormones — Men', name: 'Testosterone Cypionate (MCT Oil)',
    desc: 'Standard TRT workhorse. Cypionate ester in MCT oil carrier — SubQ-friendly, thinner needle, less injection site pain. The most commonly prescribed TRT product in telehealth. Weekly or twice-weekly SubQ injection.',
    url: '/hormones', lifestyle: false
  },
  testosterone_enanthate: {
    category: 'Hormones — Men', name: 'Testosterone Enanthate (MCT Oil)',
    desc: 'Slightly longer half-life than cypionate (~8 days). Some patients prefer it for more stable levels between injections. Same MCT oil advantages — SubQ compatible, low injection pain.',
    url: '/hormones', lifestyle: false
  },
  testosterone_cream_m: {
    category: 'Hormones — Men', name: 'Testosterone Cream / Gel',
    desc: 'Transdermal testosterone for needle-averse men. Applied daily to shoulders, upper arms, or inner thighs. Lower peak levels than injectable but steady daily absorption — good for patients who won\'t inject.',
    url: '/hormones', lifestyle: false
  },
  anastrozole: {
    category: 'Hormones — Men', name: 'Anastrozole',
    desc: 'The standard aromatase inhibitor in TRT protocols. Blocks excess testosterone-to-estrogen conversion, preventing water retention, mood changes, and libido reduction from estrogen dominance. Low-dose (0.25–1mg).',
    url: '/hormones', lifestyle: false
  },
  gonadorelin: {
    category: 'Hormones — Men', name: 'Gonadorelin',
    desc: 'Synthetic GnRH analog that maintains LH pulsatility during TRT — keeps testicular function, size, and fertility signal alive when exogenous testosterone suppresses the HPG axis. Preferred for fertility-conscious TRT patients.',
    url: '/hormones', lifestyle: false
  },
  hcg: {
    category: 'Hormones — Men', name: 'HCG',
    desc: 'Mimics LH to maintain testicular function and testosterone production during TRT. Prevents testicular atrophy and preserves fertility options. For patients who want fertility preservation or plan to come off TRT.',
    url: '/hormones', lifestyle: false
  },
  enclomiphene: {
    category: 'Hormones — Men', name: 'Enclomiphene',
    desc: 'A SERM that blocks estrogen\'s negative feedback on the hypothalamus, stimulating natural LH/FSH/testosterone production without suppressing the HPG axis. Ideal for younger men or those who want optimized T without shutting down their own production.',
    url: '/hormones', lifestyle: false
  },
  anastrozole_enclomiphene: {
    category: 'Hormones — Men', name: 'Anastrozole + Enclomiphene',
    desc: 'Enclomiphene raises testosterone naturally; anastrozole manages any resulting estrogen increase. Commonly prescribed together as a fertility-safe alternative to testosterone injections — the cleaner protocol for younger men.',
    url: '/hormones', lifestyle: false
  },
  dhea_men: {
    category: 'Hormones — Men', name: 'DHEA',
    desc: 'Adrenal precursor hormone that declines with age. Supports testosterone production, energy, mood, and libido. Often added as foundational support in TRT protocols, especially for older patients.',
    url: '/hormones', lifestyle: false
  },
  pregnenolone_men: {
    category: 'Hormones — Men', name: 'Pregnenolone',
    desc: 'The master precursor hormone — sits at the top of the steroid hormone cascade. Prescribed at premium TRT clinics (Defy, Hone) for cognitive function, mood, and neurosteroid support alongside TRT.',
    url: '/hormones', lifestyle: false
  },
  progesterone_men: {
    category: 'Hormones — Men', name: 'Progesterone (Men, Low Dose)',
    desc: 'Low-dose progesterone for men on TRT. Supports sleep quality, reduces estrogen-driven symptoms, and helps balance the HPG axis. Increasingly standard in premium TRT protocols.',
    url: '/hormones', lifestyle: false
  },

  // ── HORMONES — MEN'S STACKS ──
  mens_starter_trt: {
    category: 'Hormones — Men', name: 'Men\'s Starter TRT',
    desc: 'Testosterone Cypionate + Anastrozole + Gonadorelin — the complete, clinically sound TRT protocol. Testosterone restored, estrogen managed, testicular function preserved. This is how TRT should be done.',
    url: '/hormones', lifestyle: false
  },
  mens_fertility_trt: {
    category: 'Hormones — Men', name: 'Men\'s Fertility-Safe TRT',
    desc: 'Enclomiphene + Anastrozole + Gonadorelin — testosterone optimization without shutting down natural production. Stimulates natural LH/FSH/T production. Full T optimization, intact HPG axis, preserved fertility.',
    url: '/hormones', lifestyle: false
  },
  mens_optimization_stack: {
    category: 'Hormones — Men', name: 'Men\'s Optimization Stack',
    desc: 'Testosterone Cypionate + Anastrozole + Gonadorelin + Pregnenolone. Starter TRT plus the cognitive and neurosteroid layer. For patients who want everything addressed — testosterone levels and how they think and feel day-to-day.',
    url: '/hormones', lifestyle: false
  },

  // ── HORMONES — WOMEN'S PRODUCTS ──
  biest: {
    category: 'Hormones — Women', name: 'Bi-Est Cream (50:50)',
    desc: 'Bioidentical estrogen cream — 50% estradiol / 50% estriol. Gentler ratio, better for patients early in HRT or estrogen-sensitive. Applied topically for consistent daily absorption.',
    url: '/hormones', lifestyle: false
  },
  biest_8020: {
    category: 'Hormones — Women', name: 'Bi-Est Cream (80:20)',
    desc: '80% estradiol / 20% estriol. Stronger estrogen support for perimenopausal/postmenopausal women with more significant symptoms. More aggressive symptom relief than 50:50.',
    url: '/hormones', lifestyle: false
  },
  estradiol: {
    category: 'Hormones — Women', name: 'Estradiol Cream',
    desc: 'Pure bioidentical estradiol in topical cream. The most potent and most clinically studied bioidentical estrogen. Daily application to skin. Preferred for patients who want estradiol without the estriol component.',
    url: '/hormones', lifestyle: false
  },
  estradiol_patch: {
    category: 'Hormones — Women', name: 'Estradiol Patch',
    desc: 'Twice-weekly transdermal estradiol patch. Set-and-forget dosing with consistent serum levels and good adherence. Popular with patients who want minimal daily routine involvement.',
    url: '/hormones', lifestyle: false
  },
  vaginal_estriol: {
    category: 'Hormones — Women', name: 'Vaginal Estrogen Cream (Estriol)',
    desc: 'Localized estriol cream applied vaginally. Treats GSM — vaginal dryness, discomfort, painful sex, and recurrent UTIs — without significant systemic absorption. High demand; commonly prescribed alongside systemic HRT.',
    url: '/hormones', lifestyle: false
  },
  progesterone: {
    category: 'Hormones — Women', name: 'Progesterone Capsule (IR)',
    desc: 'Immediate-release oral bioidentical progesterone. Faster onset — good for sleep support and acute symptom relief. Balances estrogen, protects the uterine lining, and supports mood and anxiety.',
    url: '/hormones', lifestyle: false
  },
  prog_sr: {
    category: 'Hormones — Women', name: 'Progesterone Capsule (SR)',
    desc: 'Sustained-release oral progesterone for smoother hormone levels throughout the day. Better for patients who experience hormonal peaks/valleys or need all-day mood and anxiety support.',
    url: '/hormones', lifestyle: false
  },
  prog_cream: {
    category: 'Hormones — Women', name: 'Progesterone Cream',
    desc: 'Topical bioidentical progesterone applied to skin daily. Option for patients who prefer not to swallow capsules. Same hormonal benefits as oral progesterone in a localized application.',
    url: '/hormones', lifestyle: false
  },
  testosterone_women: {
    category: 'Hormones — Women', name: 'Testosterone Cream (Women\'s Dose)',
    desc: 'Low-dose bioidentical testosterone (0.5–5mg/mL) for women. Restores libido, energy, cognitive function, and muscle tone at physiologic female doses. Off-label — no FDA-approved women\'s testosterone product exists.',
    url: '/hormones', lifestyle: false
  },
  dhea_women: {
    category: 'Hormones — Women', name: 'DHEA',
    desc: 'Adrenal precursor that converts to estrogen and testosterone as needed. Supports energy, libido, mood, and skin. Levels drop significantly after menopause — often the missing piece in protocols that don\'t fully address energy and desire.',
    url: '/hormones', lifestyle: false
  },
  pregnenolone_women: {
    category: 'Hormones — Women', name: 'Pregnenolone',
    desc: 'Master precursor hormone for all steroid hormones. Prescribed at premium HRT clinics as an adjunct for cognitive function, mood, and energy. Commonly requested by patients who\'ve done their research.',
    url: '/hormones', lifestyle: false
  },

  // ── HORMONES — WOMEN'S STACKS ──
  womens_hormone_balance: {
    category: 'Hormones — Women', name: 'Women\'s Hormone Balance',
    desc: 'Bi-Est Cream + Progesterone (IR) + DHEA — the core women\'s HRT trifecta. Estrogen support for hot flashes, mood, sleep, and bone density. Progesterone for balance and uterine protection. DHEA for energy and libido foundation.',
    url: '/hormones', lifestyle: false
  },
  womens_complete_hrt: {
    category: 'Hormones — Women', name: 'Women\'s Complete HRT',
    desc: 'Bi-Est Cream + Progesterone (IR) + Testosterone (Women\'s Dose) + DHEA. Full-spectrum women\'s hormone optimization. Adds low-dose testosterone — the most overlooked hormone in women\'s health — for libido, mental sharpness, and vitality.',
    url: '/hormones', lifestyle: false
  },
  womens_peri_entry: {
    category: 'Hormones — Women', name: 'Women\'s Perimenopause Entry',
    desc: 'Estradiol Patch + Progesterone Capsule (SR). Low-friction entry for early perimenopause. Twice-weekly patch and smooth SR progesterone — simple two-product protocol for symptom management at the start of the hormonal transition.',
    url: '/hormones', lifestyle: false
  },
  womens_optimization_stack: {
    category: 'Hormones — Women', name: 'Women\'s Optimization Stack',
    desc: 'Bi-Est Cream + Progesterone (IR) + Testosterone (Women\'s Dose) + DHEA + Pregnenolone. Complete HRT plus the master precursor layer. Full-spectrum optimization — equivalent to what a premium functional medicine clinic would prescribe.',
    url: '/hormones', lifestyle: false
  },

  // ── PEPTIDES — PRODUCTS ──
  bpc157: {
    category: 'Peptides', name: 'BPC-157',
    desc: 'The most discussed recovery peptide in functional medicine. Accelerates healing of tendons, ligaments, muscles, and gut tissue. Injectable for systemic effects; oral capsule for gut-specific healing.',
    url: '/peptides', lifestyle: false
  },
  tb500: {
    category: 'Peptides', name: 'TB-500',
    desc: 'Promotes muscle regeneration and tissue flexibility by upregulating actin. Effective for chronic injuries, post-surgical recovery, and recurring soft tissue issues.',
    url: '/peptides', lifestyle: false
  },
  ghk_cu: {
    category: 'Peptides', name: 'GHK-Cu',
    desc: 'Copper peptide — stimulates collagen and elastin synthesis, promotes angiogenesis, and modulates inflammation. Available as injectable (systemic), topical (skin/hair), and oral troche for needle-averse patients.',
    url: '/peptides', lifestyle: false
  },
  kpv: {
    category: 'Peptides', name: 'KPV',
    desc: 'Tripeptide targeting NF-κB to reduce systemic and localized inflammation. Effective for gut inflammation (IBD, colitis), skin conditions, and post-injury recovery.',
    url: '/peptides', lifestyle: false
  },
  cjc_ipamorelin: {
    category: 'Peptides', name: 'CJC-1295 / Ipamorelin',
    desc: 'The most prescribed GH peptide combination in telehealth. Sustained GH pulse without cortisol spikes — improved sleep, lean muscle, fat reduction, and recovery. Taken at bedtime.',
    url: '/peptides', lifestyle: false
  },
  sermorelin: {
    category: 'Peptides', name: 'Sermorelin',
    desc: 'GHRH analog with the longest clinical prescribing history of any GH peptide. Stimulates pituitary to produce GH naturally. The most established and safest GH option — best entry-level choice.',
    url: '/peptides', lifestyle: false
  },
  tesamorelin: {
    category: 'Peptides', name: 'Tesamorelin',
    desc: 'The only FDA-approved GHRH analog. Strongest clinical data of any GH peptide for visceral and abdominal fat reduction. Cross-listed in Weight Loss.',
    url: '/peptides', lifestyle: false
  },
  igf_lr3: {
    category: 'Peptides', name: 'IGF-LR3',
    desc: 'Long-acting IGF-1 analog acting directly on muscle cells for protein synthesis, nutrient uptake, and hyperplasia. Different mechanism from GH secretagogues. For advanced body composition patients.',
    url: '/peptides', lifestyle: false
  },
  ibutamoren: {
    category: 'Peptides', name: 'Ibutamoren / MK-677',
    desc: 'Oral GH secretagogue — stimulates GH release through the ghrelin receptor. Best option for patients who want GH optimization without any injections. Improves sleep, lean muscle, and recovery.',
    url: '/peptides', lifestyle: false
  },
  aod9604: {
    category: 'Peptides', name: 'AOD 9604',
    desc: 'HGH fragment stimulating fat cell lipolysis via beta-3 adrenergic receptors. No GH growth effects. Targets visceral fat. Often stacked with GLP-1s for enhanced body composition.',
    url: '/peptides', lifestyle: false
  },
  nad: {
    category: 'Peptides', name: 'NAD+ Injectable',
    desc: 'The most in-demand longevity compound. Restores cellular energy, DNA repair, and sirtuin activation. Levels decline 50% by age 50. Injectable for full systemic effect.',
    url: '/peptides', lifestyle: false
  },
  nad_nasal: {
    category: 'Peptides', name: 'NAD+ Nasal Spray',
    desc: 'NAD+ delivered via nasal spray for rapid brain uptake. Mental clarity, focus, and energy typically felt within 15–30 minutes. Ideal for needle-averse patients, or as a daily complement to injectable NAD+.',
    url: '/peptides', lifestyle: false
  },
  epithalon: {
    category: 'Peptides', name: 'Epithalon',
    desc: 'Tetrapeptide supporting telomere maintenance and circadian regulation. Restores pineal melatonin production, improves sleep quality, and supports cellular lifespan. Used in defined cycles (10–14 days).',
    url: '/peptides', lifestyle: false
  },
  mots_c: {
    category: 'Peptides', name: 'MOTS-C',
    desc: 'Mitochondria-derived peptide activating AMPK to improve insulin sensitivity, energy metabolism, and cellular resilience. Mimics the metabolic benefits of exercise at the cellular level.',
    url: '/peptides', lifestyle: false
  },
  methylene_blue: {
    category: 'Peptides', name: 'Methylene Blue',
    desc: 'At low doses, increases mitochondrial respiration efficiency. Clinical benefits for memory, mood, and neuroprotection. Fully oral — no injections. Available in multiple doses.',
    url: '/peptides', lifestyle: false
  },
  ldn: {
    category: 'Peptides', name: 'Low Dose Naltrexone (LDN)',
    desc: 'Off-label immune modulator at sub-therapeutic doses. Reduces systemic inflammation, supports immune function, and improves mood and sleep. Fully oral — no injections.',
    url: '/peptides', lifestyle: false
  },
  slu_pp_332: {
    category: 'Peptides', name: 'SLU-PP 332',
    desc: 'Exercise-mimetic compound activating ERR receptors — improves endurance, fat metabolism, and mitochondrial biogenesis without exercise. Cutting edge — almost no mainstream telehealth platforms carry this.',
    url: '/peptides', lifestyle: false
  },
  five_amino_1mq: {
    category: 'Peptides', name: '5-Amino-1MQ',
    desc: 'NNMT inhibitor that raises intracellular NAD+ and activates fat-burning metabolic pathways. Oral capsule available for needle-averse patients. Growing demand in metabolic and longevity patients.',
    url: '/peptides', lifestyle: false
  },
  glutathione: {
    category: 'Peptides', name: 'Glutathione',
    desc: 'Master antioxidant — neutralizes free radicals, supports liver detoxification, and boosts cellular immune defense. Injectable or nasal spray. Commonly stacked with NAD+ in longevity protocols.',
    url: '/peptides', lifestyle: false
  },
  thymosin_alpha: {
    category: 'Peptides', name: 'Thymosin Alpha-1',
    desc: 'Approved in 30+ countries as immune-modulating therapy. Activates T-cell maturation and dendritic cell function — enhancing the body\'s ability to fight infections and modulate autoimmune activity.',
    url: '/peptides', lifestyle: false
  },
  semax: {
    category: 'Peptides', name: 'Semax',
    desc: 'Synthetic ACTH analog — increases BDNF, enhances focus, memory, and cognitive processing speed. Neuroprotection without stimulant effects. Injectable or nasal spray.',
    url: '/peptides', lifestyle: false
  },
  selank: {
    category: 'Peptides', name: 'Selank',
    desc: 'Modulates GABAergic and serotonergic systems — reduces anxiety and improves stress resilience without sedation or dependence. Injectable or nasal spray. Pairs naturally with Semax.',
    url: '/peptides', lifestyle: false
  },
  dsip: {
    category: 'Peptides', name: 'DSIP',
    desc: 'Delta Sleep Inducing Peptide — promotes slow-wave deep sleep without sedation or dependence. Reduces sleep onset, increases duration, improves sleep architecture. Also modulates HPA axis stress response.',
    url: '/peptides', lifestyle: false
  },
  dihexa: {
    category: 'Peptides', name: 'Dihexa',
    desc: 'Promotes synaptogenesis — formation of new neural connections. Research suggests potent pro-cognitive effects on memory formation and recall. Fully oral — no injections needed.',
    url: '/peptides', lifestyle: false
  },

  // ── PEPTIDES — STACKS ──
  wolverine_stack: {
    category: 'Peptides', name: 'The Wolverine Stack',
    desc: 'BPC-157/KPV/TB-500 premixed blend + GHK-Cu Injectable. Systemic recovery and inflammation from one vial, plus collagen synthesis and structural remodeling on top. Four mechanisms, two injections.',
    url: '/peptides', lifestyle: false
  },
  body_recomp_stack: {
    category: 'Peptides', name: 'The Body Recomp Stack',
    desc: 'CJC-1295/Ipamorelin + Tesamorelin/Ipamorelin blend + IGF-LR3. Triple-axis GH and IGF optimization for simultaneous fat reduction and lean muscle growth. The most comprehensive body composition protocol available.',
    url: '/peptides', lifestyle: false
  },
  optimizer_stack: {
    category: 'Peptides', name: 'The Optimizer Stack',
    desc: 'CJC/Ipamorelin + NAD+ + Glutathione — GH pulse optimization, cellular energy, and master antioxidant defense. Covers hormonal, metabolic, and oxidative stress aging mechanisms.',
    url: '/peptides', lifestyle: false
  },
  longevity_stack: {
    category: 'Peptides', name: 'The Longevity Stack',
    desc: 'NAD+ Injectable + Epithalon + MOTS-C. Anti-aging trifecta: NAD+ restores cellular energy and DNA repair, Epithalon supports telomere maintenance, MOTS-C activates AMPK mimicking caloric restriction.',
    url: '/peptides', lifestyle: false
  },
  cognitive_stack: {
    category: 'Peptides', name: 'The Cognitive Stack',
    desc: 'Semax/Selank premixed blend + DSIP + Dihexa. Focus and anxiety in one injection, deep sleep ensured, synaptogenesis added. The complete brain protocol for executives and high performers.',
    url: '/peptides', lifestyle: false
  },
  sleep_stack: {
    category: 'Peptides', name: 'The Sleep Stack',
    desc: 'DSIP + Epithalon + Selank — three distinct sleep mechanisms. DSIP for slow-wave deep sleep, Epithalon for circadian melatonin restoration, Selank for anxiety reduction. No sedatives, no dependence.',
    url: '/peptides', lifestyle: false
  },
  performance_peptide_stack: {
    category: 'Peptides', name: 'The Performance Stack',
    desc: 'CJC-1295/Ipamorelin + NAD+ + Methylene Blue. GH optimization for sleep and body composition, NAD+ for cellular energy and DNA repair, Methylene Blue for mitochondrial efficiency and neuroprotection.',
    url: '/peptides', lifestyle: false
  },

  // ── SEXUAL HEALTH — PRODUCTS ──
  tadalafil: {
    category: 'Sexual Health', name: 'Tadalafil',
    desc: 'Gold standard for daily erectile support. A 36-hour half-life means consistent readiness without timing a dose. The most prescribed ED medication in telehealth. Available as tablet, troche, RDT, or gummy.',
    url: '/sexual-wellness', lifestyle: false
  },
  sildenafil: {
    category: 'Sexual Health', name: 'Sildenafil',
    desc: 'On-demand ED. Works in 30–60 minutes, lasts 4–6 hours. The most recognized ED medication globally. Available as RDT, troche, and gummy for patient preference.',
    url: '/sexual-wellness', lifestyle: false
  },
  vardenafil: {
    category: 'Sexual Health', name: 'Vardenafil',
    desc: 'PDE5 inhibitor with slightly faster onset than sildenafil. A valuable alternative for patients who don\'t respond optimally to sildenafil or tadalafil, or who experience side effects.',
    url: '/sexual-wellness', lifestyle: false
  },
  combo_troches: {
    category: 'Sexual Health', name: 'Sildenafil + Tadalafil + Oxytocin Troche',
    desc: 'Dual PDE5 plus oxytocin — sildenafil for fast onset, tadalafil for sustained duration, oxytocin for emotional connection and performance anxiety reduction. Addresses the physical and psychological dimensions of ED simultaneously.',
    url: '/sexual-wellness', lifestyle: false
  },
  tadalafil_pt141_troche: {
    category: 'Sexual Health', name: 'Tadalafil + Oxytocin + PT-141 Troche',
    desc: 'Triple-mechanism combo: tadalafil for blood flow, oxytocin for emotional connection and anxiety reduction, PT-141 for CNS-level libido activation. For patients where desire and performance are both concerns.',
    url: '/sexual-wellness', lifestyle: false
  },
  trimix: {
    category: 'Sexual Health', name: 'Trimix',
    desc: 'For patients who don\'t respond to oral PDE5s. Papaverine + phentolamine + alprostadil injected into the corpus cavernosum. Erection within 5–15 minutes. Multiple concentrations available for dose titration.',
    url: '/sexual-wellness', lifestyle: false
  },
  sertraline: {
    category: 'Sexual Health', name: 'Sertraline (Low Dose)',
    desc: 'Off-label SSRI for premature ejaculation — the most widely used pharmacological PE treatment in telehealth. Delays ejaculation via serotonin modulation. Daily or on-demand (4–8 hours before).',
    url: '/sexual-wellness', lifestyle: false
  },
  pt141: {
    category: 'Sexual Health', name: 'PT-141 (Bremelanotide)',
    desc: 'FDA-approved for HSDD in women. Also widely used off-label for men. Activates melanocortin receptors in the brain to increase dopamine-driven sexual desire. Multiple delivery formats available.',
    url: '/sexual-wellness', lifestyle: false
  },
  oxytocin: {
    category: 'Sexual Health', name: 'Oxytocin',
    desc: 'Enhances emotional connection, reduces performance anxiety, and intensifies orgasm when taken before sexual activity. Nasal spray for fastest absorption; oral strip for convenience.',
    url: '/sexual-wellness', lifestyle: false
  },
  arousal_cream: {
    category: 'Sexual Health', name: 'Sildenafil Arousal Cream',
    desc: 'Sildenafil 1% / Arginine 6% / Pentoxifylline 5% — compounded topical applied directly before sexual activity. Increases local clitoral and vaginal blood flow, sensitivity, and lubrication. Prescription-only.',
    url: '/sexual-wellness', lifestyle: false
  },
  tadalafil_women: {
    category: 'Sexual Health', name: 'Tadalafil (Women\'s Dose)',
    desc: 'Low-dose tadalafil (5mg) for women — increases clitoral and vaginal blood flow, enhances arousal and lubrication, and improves orgasm intensity. Significantly lower dose than men\'s protocols.',
    url: '/sexual-wellness', lifestyle: false
  },
  flibanserin: {
    category: 'Sexual Health', name: 'Flibanserin (Addyi)',
    desc: 'FDA-approved for HSDD in premenopausal women. Balances dopamine, serotonin, and norepinephrine to support sexual desire. The only FDA-approved non-hormonal libido treatment for women. Taken nightly.',
    url: '/sexual-wellness', lifestyle: false
  },
  kisspeptin: {
    category: 'Sexual Health', name: 'Kisspeptin',
    desc: 'Neuropeptide stimulating GnRH release — directly influences libido, arousal, and sexual motivation. Growing clinical use in women with HSDD and in men as part of hormonal optimization.',
    url: '/sexual-wellness', lifestyle: false
  },

  // ── SEXUAL HEALTH — STACKS ──
  daily_performance_stack: {
    category: 'Sexual Health', name: 'The Daily Performance Stack',
    desc: 'Tadalafil 5mg (daily) + Oxytocin Nasal Spray. Daily tadalafil maintains baseline erectile readiness — no timing required. Oxytocin adds the psychological layer: reduced performance anxiety, deepened connection, intensified orgasm.',
    url: '/sexual-wellness', lifestyle: false
  },
  mens_performance: {
    category: 'Sexual Health', name: 'Men\'s Performance Stack',
    desc: 'Tadalafil (daily) + PT-141 + Oxytocin. Three layers: physical function, neurological desire, and emotional intimacy. PDE5s address blood flow — PT-141 is what adds the libido dimension.',
    url: '/sexual-wellness', lifestyle: false
  },
  performance_troche_stack: {
    category: 'Sexual Health', name: 'The Performance Troche Stack',
    desc: 'Tadalafil + Oxytocin + PT-141 Troche, with optional Sertraline for PE. Everything in one sublingual dose — blood flow, CNS arousal, and emotional connection. Maximum effect with minimal management.',
    url: '/sexual-wellness', lifestyle: false
  },
  womens_desire: {
    category: 'Sexual Health', name: 'Women\'s Desire Stack',
    desc: 'PT-141 Strip + Oxytocin Nasal Spray + Tadalafil (Women\'s Dose). Three dimensions of women\'s sexual health: PT-141 (FDA-approved for HSDD), Oxytocin for intimacy and orgasm intensity, low-dose tadalafil for blood flow and sensitivity.',
    url: '/sexual-wellness', lifestyle: false
  },
  womens_arousal_stack: {
    category: 'Sexual Health', name: 'Women\'s Arousal + Desire Stack',
    desc: 'Sildenafil Arousal Cream + PT-141 Strip + Oxytocin Strip. Local and central arousal addressed simultaneously. Topical blood flow and sensitivity, CNS arousal and desire pathways, plus connection and orgasm enhancement.',
    url: '/sexual-wellness', lifestyle: false
  },

  // ── AESTHETICS — SKIN PRODUCTS ──
  tretinoin: {
    category: 'Aesthetics — Skin', name: 'Tretinoin Cream',
    desc: 'The most clinically proven topical anti-aging compound available. Increases collagen synthesis, accelerates cell turnover, fades hyperpigmentation, and reduces fine lines. Available in 0.025%, 0.05%, and 0.1% strengths.',
    url: '/aesthetics', lifestyle: false
  },
  tretinoin_ha: {
    category: 'Aesthetics — Skin', name: 'Tretinoin + Niacinamide + Hyaluronic Acid Cream',
    desc: 'Hydrating tretinoin formula. Niacinamide strengthens barrier and reduces irritation; HA provides moisture. Retinoid results without dryness or peeling. The best entry-level anti-aging product for hesitant or sensitive-skin patients.',
    url: '/aesthetics', lifestyle: false
  },
  ghk_topical: {
    category: 'Aesthetics — Skin', name: 'GHK-Cu Cream',
    desc: 'Copper peptide topical stimulating collagen and elastin synthesis, promoting skin remodeling. Standalone or paired with tretinoin for a two-layer regenerative protocol.',
    url: '/aesthetics', lifestyle: false
  },
  estriol_quad_cream: {
    category: 'Aesthetics — Skin', name: 'Estriol / Niacinamide / GHK-Cu / HA Cream',
    desc: 'Premium quad-ingredient anti-aging cream. Estriol for hormonal skin support, niacinamide for barrier and brightening, GHK-Cu for collagen and remodeling, HA for deep hydration. Best for peri/postmenopausal skin.',
    url: '/aesthetics', lifestyle: false
  },
  estriol_cream: {
    category: 'Aesthetics — Skin', name: 'Estriol Facial Cream',
    desc: 'Bioidentical estriol for facial skin. Supports collagen density, hydration, and elasticity lost with estrogen decline. Prescribed standalone or alongside systemic HRT. High-converting cross-sell from women\'s HRT patients.',
    url: '/aesthetics', lifestyle: false
  },
  nad_cream: {
    category: 'Aesthetics — Skin', name: 'NAD+ Cream',
    desc: 'Topical NAD+ (10%) for cellular energy and DNA repair in skin cells. Antioxidant and mitochondrial support layer. Pairs well with tretinoin for patients interested in the longevity angle in their skin protocol.',
    url: '/aesthetics', lifestyle: false
  },
  acne_cream: {
    category: 'Aesthetics — Skin', name: 'Clindamycin + Niacinamide + Tretinoin Cream',
    desc: 'Best all-around topical acne formula. Clindamycin (antibacterial) + niacinamide (anti-inflammatory, barrier support) + tretinoin (pore clearing, cell turnover). Three mechanisms in one cream. Default acne prescription.',
    url: '/aesthetics', lifestyle: false
  },
  clindamycin_spiro_cream: {
    category: 'Aesthetics — Skin', name: 'Clindamycin + Spironolactone Cream',
    desc: 'For hormonal acne specifically. Spironolactone blocks androgen receptors at the skin level, reducing androgen-driven sebum production. Better than standard acne creams for adult female hormonal breakouts.',
    url: '/aesthetics', lifestyle: false
  },
  azelaic_niacinamide: {
    category: 'Aesthetics — Skin', name: 'Azelaic Acid + Niacinamide Cream',
    desc: 'Gentle non-retinoid formula for rosacea-prone or sensitive skin. Also treats post-acne hyperpigmentation. Good as a daytime complement to a retinoid night routine. No sun sensitivity.',
    url: '/aesthetics', lifestyle: false
  },
  spiro_oral: {
    category: 'Aesthetics — Skin', name: 'Spironolactone Oral',
    desc: 'Systemic androgen blocker for hormonal acne in women. Reduces sebum at the hormonal root cause level. Standard of care for persistent adult female acne in telehealth derm.',
    url: '/aesthetics', lifestyle: false
  },
  doxycycline: {
    category: 'Aesthetics — Skin', name: 'Doxycycline',
    desc: 'Oral antibiotic for moderate-to-severe inflammatory acne. Short-term use (8–12 weeks). Often prescribed alongside topical tretinoin for faster initial clearing of active breakouts.',
    url: '/aesthetics', lifestyle: false
  },
  hq_brightening: {
    category: 'Aesthetics — Skin', name: 'Hydroquinone + Tretinoin + Fluocinolone Cream',
    desc: 'The gold standard for melasma and stubborn hyperpigmentation. HQ suppresses melanin production, tretinoin drives cell turnover, fluocinolone reduces the inflammation that triggers melanin. Best result for most pigmentation patients.',
    url: '/aesthetics', lifestyle: false
  },
  kojic_azelaic: {
    category: 'Aesthetics — Skin', name: 'Azelaic Acid + Kojic Acid + Niacinamide Cream',
    desc: 'Non-HQ brightening formula. Multi-pathway pigment reduction for patients who can\'t use hydroquinone long-term, or as a maintenance protocol after HQ treatment.',
    url: '/aesthetics', lifestyle: false
  },
  hq_standalone: {
    category: 'Aesthetics — Skin', name: 'Hydroquinone Cream',
    desc: 'Prescription-strength hydroquinone (6% or 8%) standalone. For cases where a standalone lightening agent is indicated, or where the clinician prefers actives prescribed separately.',
    url: '/aesthetics', lifestyle: false
  },
  skin_lightening: {
    category: 'Aesthetics — Skin', name: 'Brightening Stack (AM + PM)',
    desc: 'Hydroquinone/Tretinoin/Fluocinolone PM cream + Azelaic Acid/Niacinamide AM cream. Day and night brightening protocol attacking pigment through multiple pathways simultaneously.',
    url: '/aesthetics', lifestyle: false
  },

  // ── AESTHETICS — HAIR PRODUCTS ──
  finasteride: {
    category: 'Aesthetics — Hair', name: 'Finasteride (Oral)',
    desc: 'FDA-approved DHT blocker for male androgenetic alopecia. 80–90% halt progression; ~65% see regrowth at 12 months. Standard first-line oral treatment.',
    url: '/aesthetics', lifestyle: false
  },
  dutasteride: {
    category: 'Aesthetics — Hair', name: 'Dutasteride (Oral)',
    desc: 'More potent than finasteride — blocks both type 1 and type 2 5-alpha reductase. For patients who haven\'t responded to finasteride or with advanced/resistant androgenetic alopecia.',
    url: '/aesthetics', lifestyle: false
  },
  minoxidil_oral: {
    category: 'Aesthetics — Hair', name: 'Minoxidil (Oral)',
    desc: 'Low-dose oral minoxidil outperforms topical in multiple studies. Systemic follicle stimulation across the scalp. Suitable for men and women. The fastest-growing hair loss product in telehealth.',
    url: '/aesthetics', lifestyle: false
  },
  finasteride_minoxidil_oral: {
    category: 'Aesthetics — Hair', name: 'Finasteride + Minoxidil (Oral Combo)',
    desc: 'Single daily capsule for both oral actives. Better compliance than two separate prescriptions. Maximum oral coverage without multiple pills.',
    url: '/aesthetics', lifestyle: false
  },
  minoxidil_finasteride_topical: {
    category: 'Aesthetics — Hair', name: 'Minoxidil + Finasteride Topical',
    desc: 'Most widely prescribed compounded hair topical. Minoxidil for follicle stimulation, finasteride at the scalp for DHT blockade with lower systemic absorption. Available in 5%/0.1% and 5%/0.3%.',
    url: '/aesthetics', lifestyle: false
  },
  minoxidil_dutasteride_topical: {
    category: 'Aesthetics — Hair', name: 'Minoxidil + Dutasteride Topical',
    desc: 'Stronger topical than the finasteride variant — dutasteride blocks both 5AR isoforms at the follicle. For patients who haven\'t responded to Fin/Min topical, or with more aggressive androgenetic alopecia.',
    url: '/aesthetics', lifestyle: false
  },
  minoxidil_4mech_spray: {
    category: 'Aesthetics — Hair', name: 'Minoxidil + Finasteride + Latanoprost + Ketoconazole Spray',
    desc: '4-mechanism topical spray. Minoxidil (growth stimulation), finasteride (local DHT block), latanoprost (extends anagen phase), ketoconazole (reduces scalp DHT and inflammation). The most comprehensive single topical available.',
    url: '/aesthetics', lifestyle: false
  },
  minoxidil_spiro: {
    category: 'Aesthetics — Hair', name: 'Minoxidil + Spironolactone Topical',
    desc: 'Women\'s hormonal hair loss formula. Spironolactone blocks androgen receptors at the follicle — addresses the hormonal root cause of female pattern hair loss. Minoxidil drives direct follicle stimulation.',
    url: '/aesthetics', lifestyle: false
  },
  ghk_hair: {
    category: 'Aesthetics — Hair', name: 'Minoxidil + GHK-Cu Topical',
    desc: 'Minoxidil plus copper peptide. GHK-Cu activates follicle stem cells, extends the growth phase, and reduces scalp inflammation. Premium option not available at standard hair loss platforms.',
    url: '/aesthetics', lifestyle: false
  },
  minoxidil_ghk: {
    category: 'Aesthetics — Hair', name: 'Minoxidil + GHK-Cu (Topical)',
    desc: 'Minoxidil + GHK-Cu copper peptide in one daily application. Blood flow and follicle stimulation plus stem cell activation and inflammation reduction. Premium — not available at standard hair loss platforms.',
    url: '/aesthetics', lifestyle: false
  },

  // ── AESTHETICS — STACKS ──
  glow_protocol: {
    category: 'Aesthetics — Skin', name: 'The Glow Protocol',
    desc: 'Tretinoin (0.05%) + GHK-Cu Cream + Estriol Facial Cream. Three mechanisms for the three pillars of skin aging: cell turnover, collagen remodeling, and hormonal skin support. Strong cross-sell from HRT patients.',
    url: '/aesthetics', lifestyle: false
  },
  hydrated_glow: {
    category: 'Aesthetics — Skin', name: 'The Hydrated Glow',
    desc: 'Tretinoin + Niacinamide + HA Cream with GHK-Cu Cream. Eliminates the dryness and peeling objection to tretinoin. Built-in barrier and moisture support with structural collagen remodeling on top. High-conversion entry stack.',
    url: '/aesthetics', lifestyle: false
  },
  acne_clear_stack: {
    category: 'Aesthetics — Skin', name: 'The Acne Clear Stack',
    desc: 'Clindamycin + Niacinamide + Tretinoin Cream + Spironolactone Oral (100mg). Targets hormonal acne from two angles: topical handles surface bacteria and pore congestion; oral spironolactone addresses androgen-driven sebum at the root cause.',
    url: '/aesthetics', lifestyle: false
  },
  brightening_stack: {
    category: 'Aesthetics — Skin', name: 'The Brightening Stack',
    desc: 'HQ + Tretinoin + Fluocinolone (PM) + Azelaic Acid + Niacinamide (AM). Tri-Luma formula at night attacks pigment through three pathways. Azelaic + Niacinamide in the morning maintains and protects. Comprehensive hyperpigmentation protocol.',
    url: '/aesthetics', lifestyle: false
  },
  mens_anti_aging_skin: {
    category: 'Aesthetics — Skin', name: 'Men\'s Anti-Aging Skin Stack',
    desc: 'Tretinoin + GHK-Cu Cream. Cell turnover, collagen synthesis, and structural skin remodeling. The male-focused anti-aging protocol.',
    url: '/aesthetics', lifestyle: false
  },
  skin_wl_bundle: {
    category: 'Aesthetics — Skin', name: 'The GLP-1 Skin Recovery Bundle',
    desc: 'Tretinoin (0.05%) + GHK-Cu Cream + HQ/Tretinoin/Fluocinolone Cream. Natural cross-sell for every weight loss patient. Addresses the skin laxity, uneven tone, and hyperpigmentation that come with rapid GLP-1-induced fat loss.',
    url: '/aesthetics', lifestyle: false
  },
  mens_hair_stack: {
    category: 'Aesthetics — Hair', name: 'Men\'s Hair Stack',
    desc: 'Finasteride 1mg (oral) + Minoxidil/Finasteride/Latanoprost/Ketoconazole Spray. Oral DHT suppression plus the most comprehensive topical available — local DHT blockade, follicle stimulation, anagen phase extension, and inflammation reduction.',
    url: '/aesthetics', lifestyle: false
  },
  mens_advanced_hair_stack: {
    category: 'Aesthetics — Hair', name: 'Men\'s Advanced Hair Stack',
    desc: 'Dutasteride 0.5mg (oral) + Minoxidil + Dutasteride Topical. Full dutasteride protocol — blocks both 5AR isoforms systemically and locally. For patients who\'ve tried finasteride and want stronger results.',
    url: '/aesthetics', lifestyle: false
  },
  womens_hair_stack: {
    category: 'Aesthetics — Hair', name: 'Women\'s Hair Stack',
    desc: 'Minoxidil + Spironolactone Topical + Minoxidil + GHK-Cu Topical. Women\'s-specific protocol — not a male formula adapted for women. Androgen receptor blockade at the follicle plus stem cell activation and direct follicle stimulation.',
    url: '/aesthetics', lifestyle: false
  },

  // ── LIFESTYLE ──
  lifestyle_plan: {
    category: 'Lifestyle Coaching', name: 'Aura Lifestyle Plan',
    desc: 'Licensed personal trainer and clinical nutritionist, working alongside your medical protocol. The patients who see the best results pair their prescription with professional coaching.',
    url: '/plans', lifestyle: false
  }
};

function buildResults() {
  const primary = [];
  const secondary = [];
  const tertiary = [];
  const sex = answers.q2b;

  // ── CLINICIAN FLAGS ──
  const clinicianFlags = [];

  // ── WEIGHT LOSS ──
  if (trackQueue.includes('weightloss')) {
    const glp = answers.q6;
    const goalAmt = answers.q6a;
    const history = Array.isArray(answers.q6b) ? answers.q6b : [];
    const metabolic = Array.isArray(answers.q6c) ? answers.q6c : [];
    const gi = answers.q7;
    const active = answers.q8;
    const skinConcern = answers.q8b;
    const outcome = answers.q5;
    const needsMetformin = metabolic.some(v => ['type2_diabetes','insulin_resistance','pcos'].includes(v));
    const heavyLoss = goalAmt === 'over_100' || goalAmt === '50_100';
    const triedGLP = history.includes('glp1_before');
    const triedRxNonGLP = history.includes('rx_non_glp');
    const giSensitive = gi === 'yes_strong' || gi === 'somewhat';

    if (glp === 'currently') {
      primary.push('maintenance_stack');
      secondary.push('aod9604');
      tertiary.push('visceral_fat_stack');
    } else if (glp === 'needle_averse') {
      if (outcome === 'speed' || outcome === 'performance') {
        primary.push('tirz_oral');
        secondary.push('sema_oral_starter');
        tertiary.push('sema_oral');
      } else {
        primary.push('sema_oral_starter');
        secondary.push('tirz_oral');
        tertiary.push('oral_kit');
      }
    } else if (heavyLoss && glp === 'never') {
      if (giSensitive) {
        primary.push('tirzepatide_starter');  // tirz + ondansetron — best dropout protection
        secondary.push('tirz_glycine');
        tertiary.push('visceral_fat_stack');
      } else {
        primary.push('tirzepatide_starter');
        secondary.push('tirz_b12');
        tertiary.push('visceral_fat_stack');
      }
    } else if (glp === 'tried_stopped') {
      if (giSensitive) {
        primary.push('tirzepatide_starter');  // stepped up + GI protection
        secondary.push('sema_ondansetron');
        tertiary.push('tirz_glycine');
      } else {
        primary.push('tirzepatide_starter');
        secondary.push('tirz_b12');
        tertiary.push('metabolic_stack');
      }
    } else {
      // First timer
      if (active === 'very_active' || active === 'somewhat_active') {
        if (outcome === 'speed' || outcome === 'performance') {
          primary.push('performance_stack');
          secondary.push('tirzepatide_starter');
          tertiary.push('metabolic_stack');
        } else {
          primary.push('performance_stack');
          secondary.push('sema_carnitine');
          tertiary.push('tirzepatide_starter');
        }
      } else if (giSensitive) {
        primary.push('starter_pack');
        secondary.push('sema_ondansetron');
        tertiary.push('sema_microdose');
      } else if (outcome === 'speed' || outcome === 'performance') {
        primary.push('tirzepatide_starter');
        secondary.push('tirz_b12');
        tertiary.push('visceral_fat_stack');
      } else {
        primary.push('starter_pack');
        secondary.push('tirzepatide_starter');
        tertiary.push('sema_microdose');
      }
    }

    // Metformin for metabolic conditions
    if (needsMetformin && !primary.some(k => k === 'oral_kit' || k === 'metformin')) {
      tertiary.push('metformin');
    }
    // Non-GLP oral fallback for non-needle-averse
    if (glp !== 'needle_averse' && glp !== 'currently') {
      if (!secondary.includes('oral_kit') && !primary.includes('oral_kit')) {
        tertiary.push('oral_kit');
      }
    }

    // Thyroid / high BP clinician flags
    if (metabolic.includes('thyroid')) clinicianFlags.push('thyroid');
    if (metabolic.includes('high_bp_chol')) clinicianFlags.push('high_bp_chol');
    if ((metabolic.includes('thyroid') || metabolic.includes('high_bp_chol')) &&
        !needsMetformin && !tertiary.includes('metformin')) {
      tertiary.push('metformin');
    }

    // Bariatric flag
    if (history.includes('bariatric')) {
      clinicianFlags.push('bariatric');
      if (!primary.includes('maintenance_stack') && !secondary.includes('maintenance_stack')) {
        tertiary.push('maintenance_stack');
      }
    }

    // Skin cross-sell for WL patients
    if (skinConcern === 'yes') tertiary.push('skin_wl_bundle');
  }

  // ── HORMONES ──
  if (trackQueue.includes('hormones')) {
    const fertility = answers.q11;
    const meno = answers.q11f;
    const symptoms = Array.isArray(answers.q10) ? answers.q10 : [];
    const highSymptoms = symptoms.some(s => ['hot_flashes','skin_hair_f','brain_fog_f','low_libido_f','low_libido','muscle_loss'].includes(s));
    const symPriority = sex === 'male' ? answers.q11a_m : answers.q11a_f;
    const duration = answers.q11b_m;
    const tested = answers.q11c_m;
    const deliveryPref = answers.q11d_m;
    const cycleStatus = answers.q11b_f;
    const uterus = answers.q11c_f;
    const hormGoal = answers.q11d_f;
    const onTRTNow = tested === 'on_trt_now';
    const noUterus = uterus === 'uterus_no' || uterus === 'oophorectomy';
    const libidoPriority = symPriority === 'libido_worst' || symPriority === 'libido_worst_f';
    const bodyCompPriority = symPriority === 'body_comp_worst' || symPriority === 'body_worst_f';
    const cognitiveGoal = hormGoal === 'longevity_f' || hormGoal === 'all_f';

    if (sex === 'male') {
      const testedNormal = tested === 'tested_normal';
      const testedLow = tested === 'tested_low';
      const notTested = tested === 'not_tested' || !tested;
      const prefersTopical = deliveryPref === 'cream';
      const prefersOral = deliveryPref === 'oral';
      const shortDuration = duration === 'under_6mo';
      const longDuration = duration === 'over_2yr';
      const wantsCognitive = symptoms.some(s => ['brain_fog','brain_fog_f','low_t_energy'].includes(s));

      if (onTRTNow) {
        primary.push('mens_starter_trt');
        secondary.push('mens_optimization_stack');
        tertiary.push('anastrozole');
      } else if (testedNormal && !testedLow) {
        if (trackQueue.includes('peptides')) {
          secondary.push('dhea_men');
          tertiary.push('enclomiphene');
        } else {
          primary.push('enclomiphene');
          secondary.push('anastrozole_enclomiphene');
          tertiary.push('dhea_men');
        }
      } else if (fertility === 'yes') {
        primary.push('mens_fertility_trt');
        secondary.push('enclomiphene');
        tertiary.push('gonadorelin');
      } else if (shortDuration && !longDuration) {
        primary.push('enclomiphene');
        secondary.push('anastrozole_enclomiphene');
        tertiary.push('mens_starter_trt');
      } else if (libidoPriority) {
        primary.push(prefersTopical ? 'testosterone_cream_m' : 'mens_starter_trt');
        secondary.push(prefersTopical ? 'mens_starter_trt' : 'testosterone_cream_m');
        tertiary.push('dhea_men');
        if (!trackQueue.includes('sexual')) tertiary.push('pt141');
      } else if (bodyCompPriority) {
        primary.push(prefersTopical ? 'testosterone_cream_m' : 'mens_starter_trt');
        secondary.push('mens_optimization_stack');
        tertiary.push('dhea_men');
      } else if (notTested) {
        if (prefersOral || shortDuration) {
          primary.push('enclomiphene');
          secondary.push('mens_starter_trt');
          tertiary.push('dhea_men');
        } else {
          primary.push('mens_starter_trt');
          secondary.push('enclomiphene');
          tertiary.push('dhea_men');
        }
      } else {
        // Tested low
        if (prefersTopical) {
          primary.push('testosterone_cream_m');
          secondary.push('mens_starter_trt');
          tertiary.push('dhea_men');
        } else if (prefersOral) {
          primary.push('enclomiphene');
          secondary.push('mens_starter_trt');
          tertiary.push('anastrozole_enclomiphene');
        } else {
          primary.push('mens_starter_trt');
          secondary.push(wantsCognitive ? 'mens_optimization_stack' : 'testosterone');
          tertiary.push('dhea_men');
        }
      }
    } else {
      // Female
      const wantsVitality = hormGoal === 'vitality_f' || libidoPriority;
      const postMeno = meno === 'post' || cycleStatus === 'stopped_cycle' || cycleStatus === 'surgical_meno';
      const periMeno = cycleStatus === 'regular_cycle' || cycleStatus === 'irregular_cycle' || meno === 'peri';

      if (noUterus) {
        // No uterus — estrogen-only is safe, progesterone optional
        primary.push('estradiol');
        secondary.push('testosterone_women');
        tertiary.push('dhea_women');
      } else if (postMeno || highSymptoms) {
        if (wantsVitality) {
          primary.push('womens_complete_hrt');
          secondary.push(cognitiveGoal ? 'womens_optimization_stack' : 'testosterone_women');
          tertiary.push('womens_hormone_balance');
        } else {
          primary.push('womens_complete_hrt');
          secondary.push('womens_hormone_balance');
          tertiary.push(cognitiveGoal ? 'womens_optimization_stack' : 'testosterone_women');
        }
      } else if (periMeno) {
        // Early perimenopause — entry-level first, upsell path clear
        if (wantsVitality) {
          primary.push('womens_hormone_balance');
          secondary.push('womens_peri_entry');
          tertiary.push('testosterone_women');
        } else {
          primary.push('womens_peri_entry');
          secondary.push('womens_hormone_balance');
          tertiary.push('prog_sr');
        }
      } else {
        if (wantsVitality) {
          primary.push('womens_hormone_balance');
          secondary.push('testosterone_women');
          tertiary.push('dhea_women');
        } else {
          primary.push('womens_hormone_balance');
          secondary.push('biest');
          tertiary.push('progesterone');
        }
      }
      // Cross-sells
      if (!trackQueue.includes('aesthetics') && symptoms.includes('skin_hair_f')) {
        tertiary.push('estriol_cream');
      }
      if (!trackQueue.includes('sexual') && (libidoPriority || wantsVitality)) {
        tertiary.push('vaginal_estriol');
      }
    }
  }

  // ── PEPTIDES ──
  if (trackQueue.includes('peptides')) {
    const energy = answers.q12;
    const physical = Array.isArray(answers.q13) ? answers.q13 : [];
    const sleep = answers.q14;
    const bodyComp = answers.q15;
    const cognitive = answers.q16;
    const philosophy = answers.q17;
    const ageRange = answers.q17a;
    const currentProtocols = Array.isArray(answers.q17b) ? answers.q17b : [];
    const outcome = answers.q5;
    const olderPatient = ageRange === 'over_65' || ageRange === '50_65';
    const youngerPatient = ageRange === 'under_35';
    const onTRTPep = currentProtocols.includes('on_trt_pep');
    const onGLPPep = currentProtocols.includes('on_glp1_pep');
    const hasInjury = physical.some(v => ['injuries','postsurgical','joints'].includes(v));
    const hasGut = physical.includes('gut');

    if (cognitive === 'top' || energy === 'foggy') {
      primary.push('cognitive_stack');
      secondary.push('semax');
      tertiary.push('dihexa');
    } else if (bodyComp === 'both') {
      primary.push('body_recomp_stack');
      secondary.push('tesamorelin');
      tertiary.push('igf_lr3');
    } else if (bodyComp === 'lose_fat') {
      primary.push('tesamorelin');
      secondary.push('aod9604');
      tertiary.push('body_recomp_stack');
    } else if (bodyComp === 'build_muscle') {
      primary.push('body_recomp_stack');
      secondary.push('cjc_ipamorelin');
      tertiary.push('igf_lr3');
    } else if (sleep === 'cant_fall' || sleep === 'wake_up') {
      primary.push('sleep_stack');
      secondary.push('dsip');
      tertiary.push('selank');
    } else if (sleep === 'tired_despite') {
      primary.push('optimizer_stack');
      secondary.push('cjc_ipamorelin');
      tertiary.push('nad');
    } else if (philosophy === 'comprehensive' || outcome === 'all') {
      primary.push('optimizer_stack');
      secondary.push('longevity_stack');
      tertiary.push('nad');
    } else if (olderPatient || philosophy === 'cutting_edge' || outcome === 'longevity') {
      primary.push('longevity_stack');
      secondary.push(olderPatient ? 'epithalon' : 'five_amino_1mq');
      tertiary.push('mots_c');
    } else if (philosophy === 'proven' || outcome === 'myself') {
      primary.push('sermorelin');
      secondary.push('cjc_ipamorelin');
      tertiary.push('optimizer_stack');
    } else {
      primary.push('optimizer_stack');
      secondary.push('cjc_ipamorelin');
      tertiary.push('nad');
    }

    // GLP-1 cross-synergy
    if (onGLPPep && !primary.includes('body_recomp_stack') && !primary.includes('tesamorelin')) {
      if (!secondary.includes('aod9604')) tertiary.push('aod9604');
    }
    // Injury secondaries
    if (hasInjury) {
      if (!primary.includes('wolverine_stack')) secondary.push('wolverine_stack');
      if (!secondary.includes('bpc157') && !primary.includes('wolverine_stack')) tertiary.push('bpc157');
    }
    if (hasGut && !primary.includes('kpv')) tertiary.push('kpv');

    // Energy / NAD secondaries
    if ((energy === 'very_low' || energy === 'crashes') && !primary.includes('nad') && !secondary.includes('nad')) {
      tertiary.push('nad');
    }

    // Needle-averse path — surface oral/nasal ahead of injectables
    if (answers.q6 === 'needle_averse') {
      const injectablePrimaries = ['cjc_ipamorelin','sermorelin','tesamorelin','body_recomp_stack',
        'optimizer_stack','longevity_stack','wolverine_stack','cognitive_stack','sleep_stack',
        'performance_peptide_stack','bpc157','tb500','ghk_cu','nad','igf_lr3','aod9604',
        'epithalon','mots_c','thymosin_alpha','semax','selank','dsip','kpv'];
      if (injectablePrimaries.some(k => primary.includes(k))) {
        if (!primary.includes('ibutamoren') && !secondary.includes('ibutamoren')) secondary.unshift('ibutamoren');
        if (!secondary.includes('nad_nasal') && !primary.includes('nad_nasal')) tertiary.unshift('nad_nasal');
      } else {
        if (!primary.includes('ibutamoren') && !secondary.includes('ibutamoren')) secondary.unshift('ibutamoren');
        if (!tertiary.includes('nad_nasal') && !primary.includes('nad_nasal') && !secondary.includes('nad_nasal')) tertiary.unshift('nad_nasal');
      }
    } else if (!trackQueue.includes('weightloss') && philosophy === 'proven') {
      if (!primary.includes('ibutamoren') && !secondary.includes('ibutamoren')) tertiary.push('ibutamoren');
    }

    // Cognitive add-on
    if (cognitive === 'important' && !primary.includes('methylene_blue') && !secondary.includes('methylene_blue')) {
      tertiary.push('methylene_blue');
    }
    // Longevity + glutathione add-on
    if ((outcome === 'longevity' || philosophy === 'cutting_edge') && !tertiary.includes('glutathione')) {
      tertiary.push('glutathione');
    }
  }

  // ── SEXUAL HEALTH ──
  if (trackQueue.includes('sexual')) {
    const concern = answers.q19;
    const detail = answers.q19b;
    const context = answers.q19c;

    if (sex === 'male') {
      const pde5Failed = context === 'pde5_didnt_work';
      const wantsDaily = context === 'want_daily';
      const lowTSuspected = context === 'low_t_suspected';

      if (concern === 'ed') {
        if (pde5Failed) {
          primary.push('trimix');
          secondary.push('tadalafil_pt141_troche');
          tertiary.push('vardenafil');
        } else if (detail === 'cant_get') {
          primary.push('tadalafil');
          secondary.push('sildenafil');
          tertiary.push('tadalafil_pt141_troche');
        } else if (detail === 'cant_maintain') {
          primary.push('daily_performance_stack');
          secondary.push('combo_troches');
          tertiary.push('sildenafil');
        } else if (detail === 'morning_only' || detail === 'inconsistent') {
          // Psychological/anxiety component likely
          primary.push('performance_troche_stack');
          secondary.push('daily_performance_stack');
          tertiary.push('oxytocin');
        } else if (detail === 'partial') {
          primary.push('tadalafil');
          secondary.push('vardenafil');
          tertiary.push('combo_troches');
        } else {
          primary.push(wantsDaily ? 'daily_performance_stack' : 'sildenafil');
          secondary.push('tadalafil');
          tertiary.push('combo_troches');
        }
      } else if (concern === 'libido_m') {
        if (lowTSuspected) {
          primary.push('pt141');
          secondary.push('mens_performance');
          tertiary.push('oxytocin');
          if (!trackQueue.includes('hormones')) tertiary.push('mens_starter_trt');
        } else if (detail === 'no_desire' || detail === 'no_fantasy') {
          primary.push('pt141');
          secondary.push('kisspeptin');
          tertiary.push('mens_performance');
        } else {
          primary.push('pt141');
          secondary.push('oxytocin');
          tertiary.push('mens_performance');
        }
      } else if (concern === 'performance') {
        if (detail === 'anxiety') {
          primary.push('performance_troche_stack');
          secondary.push('oxytocin');
          tertiary.push('daily_performance_stack');
        } else if (detail === 'premature') {
          primary.push('sertraline');
          secondary.push('performance_troche_stack');
          tertiary.push('tadalafil');
        } else if (detail === 'delayed') {
          primary.push('pt141');
          secondary.push('combo_troches');
          tertiary.push('oxytocin');
        } else {
          primary.push('performance_troche_stack');
          secondary.push('daily_performance_stack');
          tertiary.push('oxytocin');
        }
      } else if (concern === 'both_m') {
        if (detail === 'ed_primary') {
          primary.push('mens_performance');
          secondary.push('daily_performance_stack');
          tertiary.push('pt141');
        } else if (detail === 'libido_primary') {
          primary.push('mens_performance');
          secondary.push('pt141');
          tertiary.push('oxytocin');
        } else {
          primary.push('mens_performance');
          secondary.push('performance_troche_stack');
          tertiary.push('pt141');
        }
      } else {
        primary.push('mens_performance');
        secondary.push('daily_performance_stack');
        tertiary.push('pt141');
      }

    } else {
      // Female
      const wantsTopical = context === 'want_topical';
      const hormonal = context === 'post_menopause' || context === 'hormonal_feeling';
      const onAntidepressants = context === 'on_antidepressants';
      const postMenoSex = meno === 'post' || answers.q11b_f === 'stopped_cycle';

      if (concern === 'desire_f') {
        if (onAntidepressants) {
          // Flibanserin contraindicated with SSRIs — lead with PT-141
          primary.push('pt141');
          secondary.push('kisspeptin');
          tertiary.push('womens_desire');
        } else if (hormonal || postMenoSex) {
          primary.push('womens_desire');
          secondary.push('pt141');
          if (!trackQueue.includes('hormones')) tertiary.push('womens_complete_hrt');
          else tertiary.push('flibanserin');
        } else if (detail === 'never_in_mood' || detail === 'used_to_have') {
          primary.push('pt141');
          secondary.push('womens_desire');
          tertiary.push('flibanserin');
        } else {
          primary.push('pt141');
          secondary.push('oxytocin');
          tertiary.push('womens_desire');
        }
      } else if (concern === 'arousal_f') {
        if (wantsTopical || detail === 'no_lubrication') {
          primary.push('womens_arousal_stack');
          secondary.push('tadalafil_women');
          tertiary.push('arousal_cream');
        } else if (detail === 'pain') {
          primary.push('tadalafil_women');
          secondary.push('arousal_cream');
          tertiary.push('vaginal_estriol');
        } else {
          primary.push('tadalafil_women');
          secondary.push('womens_arousal_stack');
          tertiary.push('womens_desire');
        }
      } else if (concern === 'orgasm_f') {
        if (detail === 'cant_orgasm' || detail === 'takes_too_long') {
          primary.push('womens_arousal_stack');
          secondary.push('pt141');
          tertiary.push('tadalafil_women');
        } else if (detail === 'less_intense') {
          primary.push('womens_desire');
          secondary.push('arousal_cream');
          tertiary.push('oxytocin');
        } else {
          primary.push('womens_desire');
          secondary.push('pt141');
          tertiary.push('arousal_cream');
        }
      } else if (concern === 'both_f') {
        primary.push('womens_desire');
        secondary.push('womens_arousal_stack');
        tertiary.push('pt141');
      } else {
        primary.push('womens_desire');
        secondary.push('pt141');
        tertiary.push('tadalafil_women');
      }
    }
  }

  // ── AESTHETICS ──
  if (trackQueue.includes('aesthetics')) {
    const skinConcern = answers.q21;
    const needsSkin = skinConcern && skinConcern !== 'na_skin';
    const aesthetic = Array.isArray(answers.q20) ? answers.q20 : [];
    const needsHair = !aesthetic.includes('none_ae') && aesthetic.some(v => v === 'hair' || v === 'both_ae');
    const skinDuration = answers.q21a;
    const currentRx = answers.q21b;
    const skinSensitivity = answers.q21c;
    const hormonalSkin = answers.q21d;
    const hairSeverity = answers.q22a;
    const hairPattern = answers.q22b;
    const hairHistory = Array.isArray(answers.q22c) ? answers.q22c : [];
    const hairCause = Array.isArray(answers.q22d) ? answers.q22d : [];
    const alreadyOnTret = currentRx === 'using_tret';
    const onOtherRx = currentRx === 'using_other_rx';
    const sensitivePatient = skinSensitivity === 'sensitive_skin';
    const hormonalSkinYes = hormonalSkin === 'yes_hormonal_skin' || hormonalSkin === 'possibly_hormonal';
    const advancedHairLoss = hairSeverity === 'significant_loss';
    const triedHairRx = hairHistory.some(v => ['tried_minoxidil','tried_finasteride','tried_hims_ro'].includes(v));
    const hormonalHairF = hairCause.some(v => ['menopause_hair','pcos_hair'].includes(v));
    const skinConcernNew = skinDuration === 'skin_new';

    if (needsSkin) {
      if (skinConcern === 'aging') {
        if (sex === 'female') {
          if (hormonalSkinYes) {
            primary.push('glow_protocol');
            secondary.push('estriol_quad_cream');
            tertiary.push(alreadyOnTret ? 'ghk_topical' : 'tretinoin');
          } else if (sensitivePatient || skinConcernNew) {
            primary.push(alreadyOnTret ? 'hydrated_glow' : 'tretinoin_ha');
            secondary.push('ghk_topical');
            tertiary.push('glow_protocol');
          } else {
            primary.push(alreadyOnTret ? 'glow_protocol' : 'tretinoin');
            secondary.push('ghk_topical');
            tertiary.push('hydrated_glow');
          }
        } else {
          if (sensitivePatient || skinConcernNew) {
            primary.push('tretinoin_ha');
            secondary.push(alreadyOnTret ? 'mens_anti_aging_skin' : 'tretinoin');
            tertiary.push('ghk_topical');
          } else {
            primary.push(alreadyOnTret ? 'mens_anti_aging_skin' : 'tretinoin');
            secondary.push('ghk_topical');
            tertiary.push('tretinoin_ha');
          }
        }
      } else if (skinConcern === 'pigmentation') {
        primary.push('brightening_stack');
        secondary.push('hq_brightening');
        tertiary.push(onOtherRx ? 'kojic_azelaic' : 'hq_standalone');
      } else if (skinConcern === 'acne') {
        if (onOtherRx) {
          primary.push('acne_cream');
          secondary.push('azelaic_niacinamide');
          tertiary.push('tretinoin');
        } else if (sex === 'female' && hormonalSkinYes) {
          // Hormonal acne in female — stack with spiro
          primary.push('acne_clear_stack');
          secondary.push(alreadyOnTret ? 'clindamycin_spiro_cream' : 'acne_cream');
          tertiary.push('spiro_oral');
        } else {
          primary.push(alreadyOnTret ? 'acne_cream' : 'tretinoin');
          secondary.push('acne_cream');
          tertiary.push('azelaic_niacinamide');
        }
      } else if (skinConcern === 'overall') {
        if (onOtherRx) {
          primary.push('ghk_topical');
          secondary.push(sex === 'female' ? 'glow_protocol' : 'mens_anti_aging_skin');
          tertiary.push('tretinoin_ha');
        } else {
          primary.push(sex === 'female' ? 'glow_protocol' : 'mens_anti_aging_skin');
          secondary.push('tretinoin');
          tertiary.push('ghk_topical');
        }
      }
    }

    if (needsHair) {
      if (sex === 'male') {
        if (advancedHairLoss || triedHairRx) {
          primary.push('mens_advanced_hair_stack');
          secondary.push(triedHairRx ? 'dutasteride' : 'mens_hair_stack');
          tertiary.push('minoxidil_dutasteride_topical');
        } else {
          primary.push('mens_hair_stack');
          secondary.push('minoxidil_finasteride_topical');
          tertiary.push('finasteride_minoxidil_oral');
        }
      } else {
        if (hormonalHairF) {
          primary.push('womens_hair_stack');
          secondary.push('minoxidil_spiro');
          tertiary.push('ghk_hair');
          if (!trackQueue.includes('hormones')) tertiary.push('womens_hormone_balance');
        } else if (advancedHairLoss) {
          primary.push('womens_hair_stack');
          secondary.push('minoxidil_oral');
          tertiary.push('minoxidil_ghk');
        } else {
          primary.push('minoxidil_ghk');
          secondary.push('womens_hair_stack');
          tertiary.push('ghk_hair');
        }
      }
    }
  }

  // ── LIFESTYLE ──
  const addLifestyle = answers.q23 === 'want_help' ||
    (answers.q23 === 'some_help' && trackQueue.includes('weightloss'));

  // ── DE-DUPLICATE all arrays ──
  const dedupe = arr => [...new Set(arr)].filter(k => PRODUCTS[k]);
  const finalPrimary   = dedupe(primary);
  const finalSecondary = dedupe(secondary).filter(k => !finalPrimary.includes(k));
  const finalTertiary  = dedupe(tertiary).filter(k => !finalPrimary.includes(k) && !finalSecondary.includes(k));

  const container = document.getElementById('recCards');
  container.innerHTML = '';

  const showLifestyle = addLifestyle && !finalPrimary.includes('lifestyle_plan') && !finalSecondary.includes('lifestyle_plan');

  finalPrimary.forEach((key, i) => {
    const p = PRODUCTS[key];
    if (p) container.innerHTML += renderRecCard(p, key, 'primary', i === 0, showLifestyle && i === 0);
  });
  finalSecondary.slice(0, 2).forEach(key => {
    const p = PRODUCTS[key];
    if (p) container.innerHTML += renderRecCard(p, key, 'secondary', false, false);
  });
  finalTertiary.slice(0, 2).forEach(key => {
    const p = PRODUCTS[key];
    if (p) container.innerHTML += renderRecCard(p, key, 'secondary', false, false);
  });
  if (showLifestyle) {
    container.innerHTML += renderRecCard(PRODUCTS.lifestyle_plan, 'lifestyle_plan', 'secondary', false, false);
  }

  // ── PERSONALIZE RESULTS HEADER from Q4 frustrations ──
  const q4vals = Array.isArray(answers.q4) ? answers.q4 : (answers.q4 ? [answers.q4] : []);
  const frustrationPhrases = {
    energy:     'low energy',
    weight:     'difficulty losing weight',
    confidence: 'confidence and appearance',
    desire:     'low sex drive',
    aging:      'feeling like you\'re aging faster than you should',
    brain:      'brain fog and mental performance',
    recovery:   'slow recovery and chronic pain',
  };
  const frustrationList = q4vals.map(v => frustrationPhrases[v]).filter(Boolean);
  const titleEl = document.querySelector('.results-title');
  if (titleEl) {
    if (frustrationList.length === 0) {
      titleEl.innerHTML = 'Based on your goals,<br><em>here\'s what we\'d recommend.</em>';
    } else if (frustrationList.length === 1) {
      titleEl.innerHTML = `Based on your goals around <em>${frustrationList[0]}</em>,<br>here's what we'd recommend.`;
    } else {
      const last = frustrationList.pop();
      const joined = frustrationList.join(', ') + ' and ' + last;
      titleEl.innerHTML = `Based on your goals around <em>${joined}</em>,<br>here's what we'd recommend.`;
    }
  }

  document.querySelectorAll('.question-card, .exit-card').forEach(el => el.classList.remove('active'));
  document.getElementById('resultsWrap').classList.add('active');
  document.getElementById('progressFill').style.width = '100%';
  document.getElementById('progressText').textContent = 'Your Aura Match';
  document.getElementById('progressCount').textContent = '✓ Complete';

  // ── RENDER CLINICIAN FLAGS ──
  renderClinicianFlags(clinicianFlags);

  window.scrollTo({ top: 0, behavior: 'smooth' });
}


function updateProgress() {
  // Per-track question sequences (ordered as shown to the user)
  const TRACK_SEQUENCES = {
    intro:      ['q1','q2b','q2'],
    goals:      ['q3','q4','q5'],
    weightloss: ['q6','q6a','q6b','q6c','q7','q8','q8b'],
    hormones:   ['q10','q11a_m','q11b_m','q11c_m','q11d_m','q11',
                       'q11a_f','q11b_f','q11c_f','q11d_f','q11f'],
    peptides:   ['q12','q13','q14','q15','q16','q17','q17a','q17b','q17c'],
    sexual:     ['q19','q19b','q19c'],
    aesthetics: ['q20','q21','q21a','q21b','q21c','q21d','q22a','q22b','q22c','q22d'],
    lifestyle:  ['q23'],
  };
  const TRACK_LABELS = {
    intro: 'Before We Begin', goals: 'Your Goals',
    weightloss: 'Weight Loss', hormones: 'Hormones',
    peptides: 'Peptides & Performance', sexual: 'Sexual Health',
    aesthetics: 'Aesthetics', lifestyle: 'Lifestyle',
  };

  const fill   = document.getElementById('progressFill');
  const label  = document.getElementById('progressText');
  const count  = document.getElementById('progressCount');

  if (currentQ === 'exitCard') {
    fill.style.width = '100%';
    label.textContent = 'Screening complete';
    count.textContent = '';
    return;
  }
  if (document.getElementById('resultsWrap')?.classList.contains('active')) {
    fill.style.width = '100%';
    label.textContent = 'Your Aura Match';
    count.textContent = '✓ Complete';
    return;
  }

  // Find which track this card belongs to
  let trackKey = null, posInTrack = 0, trackLen = 0;
  for (const [key, seq] of Object.entries(TRACK_SEQUENCES)) {
    const idx = seq.indexOf(currentQ);
    if (idx !== -1) { trackKey = key; posInTrack = idx + 1; trackLen = seq.length; break; }
  }

  if (!trackKey) {
    // Fallback — unknown card, just show quiz name
    label.textContent = 'Aura Discovery Quiz';
    count.textContent = '';
    fill.style.width = '0%';
    return;
  }

  // Overall percentage: weight intro+goals as ~20%, each active track as equal shares of the rest
  const activeTrackCount = Math.max(trackQueue.length, 1);
  const INTRO_PCT = 20;
  const TRACK_PCT = (100 - INTRO_PCT) / (activeTrackCount + 1); // +1 for lifestyle

  let pct = 0;
  if (trackKey === 'intro') {
    pct = Math.round((posInTrack / trackLen) * (INTRO_PCT / 2));
  } else if (trackKey === 'goals') {
    pct = Math.round(INTRO_PCT / 2 + (posInTrack / trackLen) * (INTRO_PCT / 2));
  } else if (trackKey === 'lifestyle') {
    pct = Math.round(INTRO_PCT + activeTrackCount * TRACK_PCT + (posInTrack / trackLen) * TRACK_PCT);
  } else {
    const tIdx = trackQueue.indexOf(trackKey);
    const base = tIdx !== -1 ? tIdx : 0;
    pct = Math.round(INTRO_PCT + base * TRACK_PCT + (posInTrack / trackLen) * TRACK_PCT);
  }
  pct = Math.min(pct, 99); // never hit 100 until results

  fill.style.width = pct + '%';
  label.textContent = TRACK_LABELS[trackKey] || 'Aura Discovery Quiz';
  count.textContent = `${posInTrack} of ${trackLen}`;
}

// ══════════════════════════════════════════════════════════
// SELECTION HELPERS
// ══════════════════════════════════════════════════════════
function selectSingle(el) {
  const q = el.dataset.q;
  el.closest('.options').querySelectorAll('.option').forEach(o => o.classList.remove('selected'));
  el.classList.add('selected');
  answers[q] = el.dataset.val;
  const btn = document.getElementById('btn-' + q);
  if (btn) btn.disabled = false;
}

function selectMulti(el) {
  // deselect any exclusive "none" option in this group
  el.closest('.options').querySelectorAll('.option').forEach(o => {
    if (o !== el && o.getAttribute('onclick') && o.getAttribute('onclick').includes('selectMultiExclusive')) {
      o.classList.remove('selected');
    }
  });
  el.classList.toggle('selected');
  const q = el.dataset.q;
  const selected = Array.from(el.closest('.options').querySelectorAll('.option.selected')).map(o => o.dataset.val);
  answers[q] = selected;
  const btn = document.getElementById('btn-' + q);
  if (btn) btn.disabled = selected.length === 0;
}

function selectMultiExclusive(el) {
  const q = el.dataset.q;
  el.closest('.options').querySelectorAll('.option').forEach(o => o.classList.remove('selected'));
  el.classList.add('selected');
  answers[q] = [el.dataset.val];
  const btn = document.getElementById('btn-' + q);
  if (btn) btn.disabled = false;
}

function nextQ(qid, nextId) {
  showCard(nextId);
}

function goBack(fromId, toId) {
  showCard(toId);
}

// ══════════════════════════════════════════════════════════
// Q1: Age gate
// ══════════════════════════════════════════════════════════
function nextFromQ1() {
  if (answers.q1 === 'no') { showCard('exitCard'); return; }
  showCard('q2b');
}

// ══════════════════════════════════════════════════════════
// Q2: Pregnancy gate
// ══════════════════════════════════════════════════════════
function nextFromQ2() {
  if (answers.q2 === 'yes') { showCard('exitCard'); return; }
  showCard('q3');
}

function nextFromQ2b() {
  if (answers.q2b === 'male') {
    showCard('q3');
  } else {
    showCard('q2');
  }
}

// ══════════════════════════════════════════════════════════
// Q3 → build track queue
// ══════════════════════════════════════════════════════════
function nextFromQ3() {
  const goals = Array.isArray(answers.q3) ? answers.q3 : [answers.q3];
  // build track queue based on selected goals
  trackQueue = [];
  if (goals.includes('weightloss')) trackQueue.push('weightloss');
  if (goals.includes('hormones')) trackQueue.push('hormones');
  if (goals.includes('peptides') || goals.includes('unsure')) trackQueue.push('peptides');
  if (goals.includes('unsure') && !trackQueue.includes('hormones')) trackQueue.push('hormones');
  if (goals.includes('sexual')) trackQueue.push('sexual');
  if (goals.includes('aesthetics')) trackQueue.push('aesthetics');
  // deduplicate
  trackQueue = [...new Set(trackQueue)];
  showCard('q4');
}

// ══════════════════════════════════════════════════════════
// Q4 + Q5 → route to first track
// ══════════════════════════════════════════════════════════
function nextFromQ4() { showCard('q5'); }
function nextFromQ5() {
  // supplement goals with frustration signals
  const goals = Array.isArray(answers.q3) ? answers.q3 : [answers.q3];
  const frustrations = Array.isArray(answers.q4) ? answers.q4 : [answers.q4];
  if (frustrations.includes('energy') || frustrations.includes('aging')) {
    // Only auto-add if patient already has a performance/wellness interest
    // Don't force peptides on someone who only wants skin or sexual health
    const hasWellnessGoal = goals.some(g => ['weightloss','hormones','peptides','unsure'].includes(g));
    if (hasWellnessGoal) {
      if (!trackQueue.includes('peptides')) trackQueue.push('peptides');
      if (!trackQueue.includes('hormones')) trackQueue.push('hormones');
    }
  }
  if (frustrations.includes('weight')) {
    if (!trackQueue.includes('weightloss')) trackQueue.unshift('weightloss');
  }
  if (frustrations.includes('brain') || frustrations.includes('recovery')) {
    const hasWellnessGoal = goals.some(g => ['weightloss','hormones','peptides','unsure'].includes(g));
    if (hasWellnessGoal && !trackQueue.includes('peptides')) trackQueue.push('peptides');
  }
  if (frustrations.includes('desire')) {
    if (!trackQueue.includes('sexual')) trackQueue.push('sexual');
  }
  if (frustrations.includes('confidence')) {
    if (!trackQueue.includes('aesthetics')) trackQueue.push('aesthetics');
  }
  trackQueue = [...new Set(trackQueue)];
  trackIndex = 0;
  routeToNextTrack();
}

function routeToNextTrack() {
  if (trackIndex >= trackQueue.length) {
    // all tracks done → lifestyle
    showCard('q23');
    return;
  }
  const track = trackQueue[trackIndex];
  trackIndex++;
  if (track === 'weightloss') showCard('q6');
  else if (track === 'hormones') { buildHormoneSymptoms(); showCard('q10'); }
  else if (track === 'peptides') showCard('q12');
  else if (track === 'sexual') { buildSexualConcerns(); showCard('q19'); }
  else if (track === 'aesthetics') showCard('q20');
  else routeToNextTrack(); // skip unknown
}

// ══════════════════════════════════════════════════════════
// WEIGHT LOSS track end → next track
// ══════════════════════════════════════════════════════════
function nextFromQ8() {
  showCard('q8b');
}

function nextFromQ6() {
  if (answers.q6 === 'skip_wl') {
    answers.q7 = null; answers.q8 = null; answers.q8b = null;
    trackQueue = trackQueue.filter(t => t !== 'weightloss');
    routeToNextTrack();
  } else {
    showCard('q6a');
  }
}

function nextFromWL() {
  routeToNextTrack();
}

// ══════════════════════════════════════════════════════════
// HORMONES — dynamic symptom options
// ══════════════════════════════════════════════════════════
function buildHormoneSymptoms() {
  const sex = answers.q2b;
  const container = document.getElementById('hormoneSymptomsOptions');
  const maleSymptoms = [
    { val: 'low_t_energy', label: 'Low energy and constant fatigue' },
    { val: 'low_libido', label: 'Reduced libido or sex drive' },
    { val: 'mood', label: 'Mood changes, irritability, or depression' },
    { val: 'body_comp', label: 'Increased body fat, especially belly fat' },
    { val: 'muscle_loss', label: 'Loss of muscle mass or strength' },
    { val: 'brain_fog', label: 'Brain fog or reduced mental sharpness' },
    { val: 'sleep_issues', label: 'Poor sleep quality' },
  ];
  const femaleSymptoms = [
    { val: 'hot_flashes', label: 'Hot flashes or night sweats' },
    { val: 'mood_swings', label: 'Mood swings, anxiety, or irritability' },
    { val: 'low_libido_f', label: 'Low libido or changes in arousal' },
    { val: 'sleep_f', label: 'Sleep disruption or insomnia' },
    { val: 'weight_f', label: 'Unexplained weight gain, especially midsection' },
    { val: 'skin_hair_f', label: 'Skin changes, hair thinning, or dryness' },
    { val: 'brain_fog_f', label: 'Brain fog or memory changes' },
  ];
  const symptoms = sex === 'male' ? maleSymptoms : femaleSymptoms;
  container.innerHTML = symptoms.map(s => `
    <div class="option multi" data-q="q10" data-val="${s.val}" onclick="selectMulti(this)">
      <div class="option-check"></div>
      <div class="option-label">${s.label}</div>
    </div>
  `).join('');
  // reset answer
  answers.q10 = [];
  document.getElementById('btn-q10').disabled = true;
}

function nextFromHormones() {
  // after q11 or q11f, continue to next track
  routeToNextTrack();
}

function nextFromQ11d_f() {
  // If cycle status already tells us menopause status, skip Q11f and infer the answer
  const cycleStatus = answers.q11b_f;
  if (cycleStatus === 'stopped_cycle' || cycleStatus === 'surgical_meno') {
    // Postmenopausal status already confirmed — pre-fill q11f and skip
    answers.q11f = 'post';
    nextFromHormones();
  } else {
    // Regular or irregular cycle — menopausal stage is still ambiguous, show Q11f
    showCard('q11f');
  }
}

// After q10, route to male or female followup
function nextFromQ10() {
  if (answers.q2b === 'male') showCard('q11a_m');
  else showCard('q11a_f');
}
// override nextQ for q10 — always use nextFromQ10
document.addEventListener('DOMContentLoaded', () => {
  const btn10 = document.getElementById('btn-q10');
  if (btn10) btn10.onclick = nextFromQ10;
});

// ══════════════════════════════════════════════════════════
// PEPTIDES track end → next track
// ══════════════════════════════════════════════════════════
function nextFromPeptides() {
  showCard('q17a');
}
function nextFromPeptidesExpanded() {
  // Handle upsell interests from Q17c
  const upsells = Array.isArray(answers.q17c) ? answers.q17c : [];
  if (upsells.includes('interested_hormones') && !trackQueue.includes('hormones')) trackQueue.push('hormones');
  if (upsells.includes('interested_wl') && !trackQueue.includes('weightloss')) trackQueue.push('weightloss');
  if (upsells.includes('interested_skin_pep') && !trackQueue.includes('aesthetics')) trackQueue.push('aesthetics');
  routeToNextTrack();
}

// ══════════════════════════════════════════════════════════
// SEXUAL — dynamic concern options
// ══════════════════════════════════════════════════════════
function buildSexualConcerns() {
  const sex = answers.q2b;
  const container = document.getElementById('sexualConcernOptions');
  const maleConcerns = [
    { val: 'ed', label: 'Difficulty getting or maintaining an erection', sub: 'ED, erectile function' },
    { val: 'libido_m', label: 'Low libido or reduced sexual desire', sub: 'I have function but low drive' },
    { val: 'performance', label: 'Performance anxiety or confidence', sub: 'The issue is mostly mental or situational' },
    { val: 'both_m', label: 'Both function and desire', sub: 'Multiple things going on at once' },
    { val: 'other_m', label: 'Something else — overall sexual wellness', sub: 'Not sure how to describe it' },
  ];
  const femaleConcerns = [
    { val: 'desire_f', label: 'Low desire or interest in sex', sub: 'Hypoactive sexual desire, rarely in the mood' },
    { val: 'arousal_f', label: 'Difficulty with arousal or lubrication', sub: 'The mind is willing but the body isn\'t responding' },
    { val: 'orgasm_f', label: 'Difficulty reaching orgasm or reduced sensation', sub: 'Takes too long or doesn\'t happen' },
    { val: 'both_f', label: 'Multiple things — desire, arousal, and sensation', sub: '' },
    { val: 'other_f', label: 'Something else — overall sexual wellness', sub: '' },
  ];
  const concerns = sex === 'male' ? maleConcerns : femaleConcerns;
  container.innerHTML = concerns.map(c => `
    <div class="option" data-q="q19" data-val="${c.val}" onclick="selectSingle(this)">
      <div class="option-check"><div class="option-check-inner"></div></div>
      <div>
        <div class="option-label">${c.label}</div>
        ${c.sub ? `<span class="option-sub">${c.sub}</span>` : ''}
      </div>
    </div>
  `).join('');
  answers.q19 = null;
  document.getElementById('btn-q19').disabled = true;
}

function buildQ19b() {
  const sex = answers.q2b;
  const concern = answers.q19;
  const container = document.getElementById('q19bOptions');
  let options = [];

  if (sex === 'male') {
    if (concern === 'ed') {
      options = [
        { val: 'cant_get', label: 'I can\'t get an erection at all', sub: 'Even with stimulation' },
        { val: 'cant_maintain', label: 'I can get one but lose it quickly', sub: 'Especially during sex' },
        { val: 'partial', label: 'I get partial erections but not fully firm', sub: '' },
        { val: 'morning_only', label: 'Morning erections are fine — it\'s situational or with a partner', sub: 'May be anxiety or psychological' },
        { val: 'inconsistent', label: 'It\'s inconsistent — sometimes fine, sometimes not', sub: '' },
      ];
    } else if (concern === 'libido_m') {
      options = [
        { val: 'no_desire', label: 'I rarely or never feel sexual desire', sub: 'It\'s mostly absent' },
        { val: 'less_than_before', label: 'My drive has noticeably dropped from what it used to be', sub: '' },
        { val: 'low_with_partner', label: 'Low desire specifically with my partner', sub: 'May be relational or situational' },
        { val: 'no_fantasy', label: 'I don\'t think about sex or initiate anymore', sub: '' },
      ];
    } else if (concern === 'performance') {
      options = [
        { val: 'anxiety', label: 'I get anxious before or during sex and lose my erection', sub: '' },
        { val: 'premature', label: 'I finish too quickly', sub: 'Premature ejaculation' },
        { val: 'delayed', label: 'I have difficulty finishing', sub: 'Delayed ejaculation or anorgasmia' },
        { val: 'confidence', label: 'General confidence or self-consciousness during sex', sub: '' },
      ];
    } else if (concern === 'both_m') {
      options = [
        { val: 'ed_primary', label: 'ED is the bigger issue — desire is secondary', sub: '' },
        { val: 'libido_primary', label: 'Low desire is the bigger issue — function is secondary', sub: '' },
        { val: 'equally_both', label: 'Both are equally affecting me', sub: '' },
      ];
    } else {
      options = [
        { val: 'general_wellness', label: 'I want to improve overall sexual performance and energy', sub: '' },
        { val: 'stamina', label: 'Stamina and endurance', sub: '' },
        { val: 'intensity', label: 'Reduced intensity or sensation', sub: '' },
      ];
    }
  } else {
    // Female
    if (concern === 'desire_f') {
      options = [
        { val: 'never_in_mood', label: 'I\'m almost never in the mood, even when conditions are right', sub: '' },
        { val: 'used_to_have', label: 'My desire has significantly decreased over time', sub: 'Hormonal or age-related' },
        { val: 'responsive_only', label: 'I only feel desire in response to physical touch — never spontaneous', sub: '' },
        { val: 'stress_related', label: 'Stress and mental load are killing my desire', sub: '' },
      ];
    } else if (concern === 'arousal_f') {
      options = [
        { val: 'no_lubrication', label: 'Dryness or insufficient lubrication', sub: 'Even when mentally aroused' },
        { val: 'slow_arousal', label: 'Takes very long to become physically aroused', sub: '' },
        { val: 'pain', label: 'Discomfort or pain during sex', sub: 'Dyspareunia' },
        { val: 'no_engorgement', label: 'Reduced sensitivity or engorgement', sub: '' },
      ];
    } else if (concern === 'orgasm_f') {
      options = [
        { val: 'cant_orgasm', label: 'I rarely or never reach orgasm', sub: '' },
        { val: 'takes_too_long', label: 'Takes much longer than it used to', sub: '' },
        { val: 'less_intense', label: 'Orgasms are less intense than before', sub: '' },
        { val: 'only_solo', label: 'I can with myself but not with a partner', sub: '' },
      ];
    } else {
      options = [
        { val: 'all_three', label: 'All of the above — desire, arousal, and orgasm are all affected', sub: '' },
        { val: 'emotional_disconnect', label: 'Emotional disconnect or feeling detached during sex', sub: '' },
        { val: 'hormonal_feeling', label: 'I think it\'s hormonal — menopause or hormonal changes', sub: '' },
        { val: 'general_wellness_f', label: 'General sexual wellness and vitality', sub: '' },
      ];
    }
  }

  container.innerHTML = options.map(o => `
    <div class="option" data-q="q19b" data-val="${o.val}" onclick="selectSingle(this)">
      <div class="option-check"><div class="option-check-inner"></div></div>
      <div>
        <div class="option-label">${o.label}</div>
        ${o.sub ? `<span class="option-sub">${o.sub}</span>` : ''}
      </div>
    </div>
  `).join('');
  answers.q19b = null;
  document.getElementById('btn-q19b').disabled = true;
}

function buildQ19c() {
  const sex = answers.q2b;
  const concern = answers.q19;
  const container = document.getElementById('q19cOptions');
  let options = [];

  if (sex === 'male') {
    options = [
      { val: 'tried_pde5', label: 'I\'ve tried Viagra or Cialis before', sub: 'With or without success' },
      { val: 'hasnt_tried', label: 'I haven\'t tried any ED medications yet', sub: '' },
      { val: 'pde5_didnt_work', label: 'PDE5 inhibitors (Viagra/Cialis) didn\'t work well for me', sub: 'Or stopped working' },
      { val: 'low_t_suspected', label: 'I suspect low testosterone may be part of the issue', sub: '' },
      { val: 'want_daily', label: 'I want something I can take daily, not just on demand', sub: '' },
    ];
  } else {
    options = [
      { val: 'post_menopause', label: 'This started or worsened around menopause', sub: '' },
      { val: 'post_pregnancy', label: 'This started or worsened after pregnancy or childbirth', sub: '' },
      { val: 'on_antidepressants', label: 'I\'m on antidepressants — this may be a side effect', sub: 'SSRIs are a common cause of sexual dysfunction' },
      { val: 'never_been_easy', label: 'This has always been difficult for me', sub: '' },
      { val: 'want_topical', label: 'I\'d prefer a topical option rather than something oral', sub: '' },
    ];
  }

  container.innerHTML = options.map(o => `
    <div class="option" data-q="q19c" data-val="${o.val}" onclick="selectSingle(this)">
      <div class="option-check"><div class="option-check-inner"></div></div>
      <div>
        <div class="option-label">${o.label}</div>
        ${o.sub ? `<span class="option-sub">${o.sub}</span>` : ''}
      </div>
    </div>
  `).join('');
  answers.q19c = null;
  // Q19c is optional context — enable button immediately
  document.getElementById('btn-q19c').disabled = false;
}

function nextFromQ19() {
  buildQ19b();
  showCard('q19b');
}

function nextFromQ19b() {
  buildQ19c();
  showCard('q19c');
}

function nextFromSexual() {
  routeToNextTrack();
}

// ══════════════════════════════════════════════════════════
// AESTHETICS track end → next track
// ══════════════════════════════════════════════════════════
function nextFromAesthetics() {
  const aesthetic = Array.isArray(answers.q20) ? answers.q20 : [answers.q20];
  const noneSelected = aesthetic.includes('none_ae');
  const needsSkin = !noneSelected && aesthetic.some(v => v === 'skin' || v === 'both_ae');
  const needsHair = !noneSelected && aesthetic.some(v => v === 'hair' || v === 'both_ae');

  if (noneSelected || (!needsSkin && !needsHair)) {
    answers.q21 = 'na_skin';
    answers.q22 = answers.q2b === 'male' ? 'male_hair' : 'female_hair';
    routeToNextTrack();
    return;
  }
  answers.q22 = answers.q2b === 'male' ? 'male_hair' : 'female_hair';
  if (!needsSkin) { answers.q21 = 'na_skin'; }

  if (needsSkin) {
    showCard('q21'); // Q21 → Q21a → Q21b → Q21c → Q21d(female) or nextFromAesthetics
  } else if (needsHair) {
    showCard('q22a'); // Hair expanded path
  } else {
    routeToNextTrack();
  }
}

function nextFromSkinExpanded() {
  // After Q21c — show hormonal question for females, or go to hair / next track
  const aesthetic = Array.isArray(answers.q20) ? answers.q20 : [answers.q20];
  const needsHair = aesthetic.some(v => v === 'hair' || v === 'both_ae');
  if (answers.q2b === 'female') {
    showCard('q21d');
  } else if (needsHair) {
    showCard('q22a');
  } else {
    routeToNextTrack();
  }
}

function nextFromQ21d() {
  // After Q21d (hormonal skin question) — go to hair if needed, else next track
  const aesthetic = Array.isArray(answers.q20) ? answers.q20 : [answers.q20];
  const needsHair = aesthetic.some(v => v === 'hair' || v === 'both_ae');
  if (needsHair) {
    showCard('q22a');
  } else {
    routeToNextTrack();
  }
}

function nextFromHairExpanded() {
  // After Q22c — show female cause question for females, else finish
  if (answers.q2b === 'female') {
    showCard('q22d');
  } else {
    routeToNextTrack();
  }
}

// ══════════════════════════════════════════════════════════
// LIFESTYLE
// ══════════════════════════════════════════════════════════
function goBackFromLifestyle() {
  // go back to last track question
  if (!trackQueue || trackQueue.length === 0) { showCard('q5'); return; }
  const lastTrack = trackQueue[trackQueue.length - 1];
  if (lastTrack === 'weightloss') showCard('q8b');
  else if (lastTrack === 'hormones') {
    if (answers.q2b === 'male') {
      showCard('q11');
    } else {
      // Q11f is skipped for stopped_cycle / surgical_meno — back goes to q11d_f in that case
      const cycleStatus = answers.q11b_f;
      const q11fWasSkipped = cycleStatus === 'stopped_cycle' || cycleStatus === 'surgical_meno';
      showCard(q11fWasSkipped ? 'q11d_f' : 'q11f');
    }
  }
  else if (lastTrack === 'peptides') showCard('q17c');
  else if (lastTrack === 'sexual') showCard('q19c');
  else if (lastTrack === 'aesthetics') {
    const ae = Array.isArray(answers.q20) ? answers.q20 : [answers.q20];
    const hadHair = ae.some(v => v === 'hair' || v === 'both_ae');
    const hadSkin = ae.some(v => v === 'skin' || v === 'both_ae');
    if (hadHair) showCard(answers.q2b === 'female' ? 'q22d' : 'q22c');
    else if (hadSkin) showCard(answers.q2b === 'female' ? 'q21d' : 'q21c');
    else showCard('q20');
  }
  else showCard('q5');
}

function nextFromLifestyle() {
  buildResults();
}

// ══════════════════════════════════════════════════════════
// RESULTS ENGINE
// ══════════════════════════════════════════════════════════

function renderRecCard(p, key, type, isFirst, showLifestyle) {
  const badgeLabel = type === 'primary' && isFirst ? 'Your Top Match' : type === 'primary' ? 'Recommended' : 'Also Consider';
  const badgeClass = type === 'primary' ? 'primary-badge' : 'secondary-badge';
  const cardClass = type === 'primary' && isFirst ? 'rec-card primary' : 'rec-card ' + type;
  const lifestyleTag = showLifestyle ? `<div class="lifestyle-tag"><span class="lifestyle-tag-icon">🏃</span><div class="lifestyle-tag-text">We also recommend pairing this with an <strong>Aura Lifestyle Plan</strong> — coaching and nutrition alongside your protocol for the best results.</div></div>` : '';
  const nextStepsTag = (type === 'primary' && isFirst) ? `<div class="rec-next-steps">Every recommendation is reviewed by a licensed clinician before anything is prescribed. They'll confirm this is the right fit for you — or suggest an alternative.</div>` : '';
  return `<div class="${cardClass}"><span class="rec-badge ${badgeClass}">${badgeLabel}</span><span class="rec-category">${p.category}</span><div class="rec-name">${p.name}</div><p class="rec-desc">${p.desc}</p><div class="coming-soon-cta"><span class="coming-soon-badge">Launching Soon</span><span class="coming-soon-hint">Save your email below to be first in line →</span></div>${nextStepsTag}${lifestyleTag}</div>`;
}

// ══════════════════════════════════════════════════════════
// CLINICIAN FLAGS
// ══════════════════════════════════════════════════════════
function renderClinicianFlags(flags) {
  const container = document.getElementById('clinicianNotices');
  if (!container) return;
  container.innerHTML = '';
  if (!flags || flags.length === 0) return;

  const messages = [];

  if (flags.includes('thyroid')) {
    messages.push('You indicated a <strong>thyroid condition</strong>. Your clinician will review this as part of your intake — thyroid status can affect how hormonal and metabolic protocols are dosed and monitored. Metformin may also be considered for broader metabolic support depending on your full history.');
  }
  if (flags.includes('high_bp_chol')) {
    messages.push('You indicated <strong>high blood pressure or elevated cholesterol</strong>. Your clinician will review this as part of your intake — certain protocols may require coordination with your primary care provider. Metformin may be considered as part of a metabolic support approach.');
  }
  if (flags.includes('bariatric')) {
    messages.push('You indicated a history of <strong>bariatric surgery</strong>. Your clinician will factor this into your protocol — nutrient absorption, medication dosing, and supplement needs can differ significantly post-bariatric surgery. A maintenance or nutritional support stack may be recommended alongside any primary protocol.');
  }

  if (messages.length === 0) return;

  container.innerHTML = `
    <div class="clinician-notice">
      <div class="clinician-notice-icon">⚕️</div>
      <div class="clinician-notice-body">
        <div class="clinician-notice-title">A note for your clinician intake</div>
        <div class="clinician-notice-text">${messages.join('<br><br>')}</div>
      </div>
    </div>`;
}


function submitEmail() {
  const input = document.getElementById('emailInput');
  const email = input.value.trim();
  if (!email || !email.includes('@')) {
    input.style.borderColor = 'rgba(255,100,100,0.6)';
    input.focus();
    setTimeout(() => { input.style.borderColor = ''; }, 1500);
    return;
  }
  // In production: POST to GHL webhook or your backend here
  // fetch('/api/save-quiz-email', { method:'POST', body: JSON.stringify({ email, answers }) });
  document.getElementById('emailForm').style.display = 'none';
  document.getElementById('emailSuccess').style.display = 'flex';
}

// ══════════════════════════════════════════════════════════
// RESTART
// ══════════════════════════════════════════════════════════
function restartQuiz() {
  // clear all state
  Object.keys(answers).forEach(k => delete answers[k]);
  trackQueue = [];
  trackIndex = 0;
  // clear all selections
  document.querySelectorAll('.option.selected').forEach(o => o.classList.remove('selected'));
  document.querySelectorAll('.btn-next').forEach(b => b.disabled = true);
  document.getElementById('recCards').innerHTML = '';
  showCard('q1');
}

// ══════════════════════════════════════════════════════════
// INIT
// ══════════════════════════════════════════════════════════
document.addEventListener('DOMContentLoaded', () => {
  showCard('q1');
  // patch q10 next button after DOM ready
  const btn10 = document.getElementById('btn-q10');
  if (btn10) btn10.onclick = nextFromQ10;
  // q18 (sex question) is now removed from flow — sexual track goes directly to q19
  // buildSexualConcerns() is called in routeToNextTrack instead
});
