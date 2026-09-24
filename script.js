/* ==========================================================================
   IUBAT EEE Academic Calculator
   Independent student project. Not an official IUBAT website.

   All grading constants below are transcribed from the grading system table
   published on https://iubat.edu/academics/ and the academic rules notice at
   https://iubat.edu/academic-rules-effective-from-the-beginning-of-spring-2024/
   Verified 17 September 2026. Do not edit without re-checking the source.
   ========================================================================== */

'use strict';

(function () {

  /* ------------------------------------------------------------------------
     1. Grading constants
     ------------------------------------------------------------------------
     `min` is inclusive, `below` is exclusive. A mark qualifies for an entry
     when min <= marks < below. Ordered from highest band to lowest so that a
     simple top-down scan returns the correct band.
     ------------------------------------------------------------------------ */

  var GRADING_SCALE = [
    { grade: 'A+', point: 4.00, min: 80, below: Infinity, range: '80% and above' },
    { grade: 'A',  point: 3.75, min: 75, below: 80,       range: '75% to less than 80%' },
    { grade: 'A-', point: 3.50, min: 70, below: 75,       range: '70% to less than 75%' },
    { grade: 'B+', point: 3.25, min: 65, below: 70,       range: '65% to less than 70%' },
    { grade: 'B',  point: 3.00, min: 60, below: 65,       range: '60% to less than 65%' },
    { grade: 'B-', point: 2.75, min: 55, below: 60,       range: '55% to less than 60%' },
    { grade: 'C+', point: 2.50, min: 50, below: 55,       range: '50% to less than 55%' },
    { grade: 'C',  point: 2.25, min: 45, below: 50,       range: '45% to less than 50%' },
    { grade: 'D',  point: 2.00, min: 40, below: 45,       range: '40% to less than 45%' },
    { grade: 'F',  point: 0.00, min: 0,  below: 40,       range: 'Less than 40%' }
  ];

  var MAX_GRADE_POINT = 4.0;

  /* Grades selectable in the calculators.
     'F' carries zero points and, under the rule effective from Spring 2024,
     its credit hours are excluded from SGPA and CGPA altogether.
     'I' is an incomplete grade and carries no points and no credits until it
     is removed. Neither C- nor D+ appears here: the official grading table
     publishes no mark range or grade point for them. */
  var GRADE_OPTIONS = GRADING_SCALE.map(function (entry) {
    return { value: entry.grade, label: entry.grade + ' (' + entry.point.toFixed(2) + ')' };
  }).concat([
    { value: 'I', label: 'I (incomplete)' }
  ]);

  var EXCLUDED_FROM_GPA = { F: true, I: true };

  /* ------------------------------------------------------------------------
     1b. Course catalog
     ------------------------------------------------------------------------
     The course list itself lives entirely in data/courses.json — this file
     is the single source of truth for course codes, names and credit hours
     so the catalog can be corrected or extended without touching any code.
     script.js only adds a presentational "subject group" label (derived
     from the course code prefix) so the search list can show a grouped
     picker; it never invents or duplicates course facts.
     ------------------------------------------------------------------------ */

  var COURSE_DATA_URL = 'data/courses.json';

  var COURSE_CATALOG_FLAT = [];      /* [{ code, name, credit }, ...] as loaded from JSON */
  var COURSE_CATALOG_BY_CODE = {};   /* code -> { code, name, credit } */
  var COURSE_CATALOG_GROUPED = [];   /* [{ group, courses: [...] }, ...] for display */
  var COURSE_LABEL_TO_CODE = {};     /* "CODE — Name (n credits)" -> code, for the search box */
  var courseCatalogLoaded = false;

  /* Cosmetic grouping only — purely a label, not course data. Any course
     code prefix missing from this map is simply grouped under "Other". */
  var PREFIX_GROUPS = {
    APSY: 'Personal & career development',
    ART: 'Personal & career development',
    ELP: 'English',
    ENG: 'English',
    MAT: 'Mathematics',
    STA: 'Mathematics',
    CHM: 'Physics & chemistry',
    PHY: 'Physics & chemistry',
    CSC: 'Computer science',
    ECO: 'Economics & humanities',
    PHI: 'Economics & humanities',
    ENV: 'Economics & humanities',
    PSY: 'Economics & humanities',
    CEN: 'General engineering',
    MEC: 'General engineering',
    EEN: 'Electrical & Electronic Engineering (EEN)',
    AutoCAD: 'Software & tool certifications',
    GIS: 'Software & tool certifications',
    PDNA: 'Software & tool certifications',
    PSNA: 'Software & tool certifications',
    SW: 'Software & tool certifications'
  };
  var GROUP_ORDER = [
    'Personal & career development', 'English', 'Mathematics', 'Physics & chemistry',
    'Computer science', 'Economics & humanities', 'General engineering',
    'Electrical & Electronic Engineering (EEN)', 'Software & tool certifications', 'Other'
  ];

  function deriveGroupName(code) {
    var prefix = code.indexOf(' ') > -1 ? code.split(' ')[0] : code;
    return PREFIX_GROUPS[prefix] || 'Other';
  }

  function composeCourseLabel(course) {
    return course.code + ' — ' + course.name + ' (' + course.credit +
      (course.credit === 1 ? ' credit' : ' credits') + ')';
  }

  function buildCatalogGroups(list) {
    var buckets = {};
    list.forEach(function (course) {
      var g = deriveGroupName(course.code);
      if (!buckets[g]) { buckets[g] = []; }
      buckets[g].push(course);
    });
    return GROUP_ORDER.filter(function (g) { return buckets[g]; })
      .map(function (g) { return { group: g, courses: buckets[g] }; });
  }

  /* Loads data/courses.json. Resolves true on success, false on failure —
     the app keeps working either way (typed / custom courses always work),
     but a visible banner explains that the catalog could not be loaded. */
  function loadCourseCatalog() {
    return fetch(COURSE_DATA_URL, { cache: 'no-store' })
      .then(function (response) {
        if (!response.ok) { throw new Error('HTTP ' + response.status); }
        return response.json();
      })
      .then(function (list) {
        if (!Array.isArray(list)) { throw new Error('courses.json did not contain a list'); }
        var clean = list.filter(function (c) {
          return c && typeof c.code === 'string' && c.code.trim() !== '' &&
                 typeof c.name === 'string' && typeof c.credit === 'number' && isFinite(c.credit);
        });
        COURSE_CATALOG_FLAT = clean;
        COURSE_CATALOG_BY_CODE = {};
        COURSE_LABEL_TO_CODE = {};
        clean.forEach(function (c) {
          COURSE_CATALOG_BY_CODE[c.code] = c;
          COURSE_LABEL_TO_CODE[composeCourseLabel(c)] = c.code;
        });
        COURSE_CATALOG_GROUPED = buildCatalogGroups(clean);
        courseCatalogLoaded = true;
        return true;
      })
      .catch(function (err) {
        console.error('Could not load the course catalog (data/courses.json):', err);
        COURSE_CATALOG_FLAT = [];
        COURSE_CATALOG_BY_CODE = {};
        COURSE_LABEL_TO_CODE = {};
        COURSE_CATALOG_GROUPED = [];
        courseCatalogLoaded = false;
        var banner = document.getElementById('catalogBanner');
        if (banner) { banner.hidden = false; }
        return false;
      });
  }

  var STORAGE_PREFIX = 'iubat-eee-calc/v1/';

  /* ------------------------------------------------------------------------
     2. Small helpers
     ------------------------------------------------------------------------ */

  function $(selector, scope) {
    return (scope || document).querySelector(selector);
  }

  function round2(n) {
    return Math.round((n + Number.EPSILON) * 100) / 100;
  }

  function fmt2(n) {
    if (!isFinite(n)) { return '—'; }
    return round2(n).toFixed(2);
  }

  /* Credits print without trailing zeros: 13.5 stays 13.5, 12.0 becomes 12. */
  function fmtCredits(n) {
    if (!isFinite(n)) { return '0'; }
    return String(round2(n));
  }

  /* Parses a user-typed number. Returns a small record instead of NaN so that
     "empty" and "nonsense" can be told apart by the callers. */
  function parseNum(raw) {
    var text = String(raw == null ? '' : raw).trim();
    if (text === '') { return { empty: true, valid: false, value: 0 }; }
    var value = Number(text);
    if (!isFinite(value)) { return { empty: false, valid: false, value: 0 }; }
    return { empty: false, valid: true, value: value };
  }

  function gradePoint(grade) {
    for (var i = 0; i < GRADING_SCALE.length; i++) {
      if (GRADING_SCALE[i].grade === grade) { return GRADING_SCALE[i].point; }
    }
    return null;
  }

  function setText(el, text) {
    if (el) { el.textContent = text; }
  }

  /* A hint ("add a course") should not be dressed up as an error. */
  function setMsg(el, text, isHint) {
    if (!el) { return; }
    el.textContent = text;
    el.classList.toggle('msg--hint', Boolean(isHint) && text !== '');
  }

  function debounce(fn, wait) {
    var timer = null;
    return function () {
      var args = arguments, self = this;
      window.clearTimeout(timer);
      timer = window.setTimeout(function () { fn.apply(self, args); }, wait);
    };
  }

  /* ------------------------------------------------------------------------
     3. Storage — local only, never leaves the browser
     ------------------------------------------------------------------------ */

  var storageAvailable = (function () {
    try {
      var probe = STORAGE_PREFIX + 'probe';
      window.localStorage.setItem(probe, '1');
      window.localStorage.removeItem(probe);
      return true;
    } catch (err) {
      return false;
    }
  })();

  function saveData(key, value) {
    if (!storageAvailable) { return false; }
    try {
      window.localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(value));
      return true;
    } catch (err) {
      return false;
    }
  }

  function loadData(key, fallback) {
    if (!storageAvailable) { return fallback; }
    try {
      var raw = window.localStorage.getItem(STORAGE_PREFIX + key);
      if (raw === null) { return fallback; }
      var parsed = JSON.parse(raw);
      return (parsed === null || parsed === undefined) ? fallback : parsed;
    } catch (err) {
      return fallback;
    }
  }

  function clearData(key) {
    if (!storageAvailable) { return; }
    try { window.localStorage.removeItem(STORAGE_PREFIX + key); } catch (err) { /* ignore */ }
  }

  function clearAllData() {
    if (!storageAvailable) { return 0; }
    var doomed = [];
    try {
      for (var i = 0; i < window.localStorage.length; i++) {
        var k = window.localStorage.key(i);
        if (k && k.indexOf(STORAGE_PREFIX) === 0) { doomed.push(k); }
      }
      doomed.forEach(function (k) { window.localStorage.removeItem(k); });
    } catch (err) { /* ignore */ }
    return doomed.length;
  }

  /* ------------------------------------------------------------------------
     3b. Toast notifications — small, auto-dismissing, screen-reader friendly
     ------------------------------------------------------------------------ */

  function showToast(message, variant) {
    var container = $('#toasts');
    if (!container || !message) { return; }

    var toast = document.createElement('div');
    toast.className = 'toast' + (variant ? ' toast--' + variant : '');
    toast.setAttribute('role', variant === 'error' ? 'alert' : 'status');
    toast.textContent = message;
    container.appendChild(toast);

    window.requestAnimationFrame(function () { toast.classList.add('is-visible'); });

    window.setTimeout(function () {
      toast.classList.remove('is-visible');
      window.setTimeout(function () { toast.remove(); }, 260);
    }, 3600);
  }

  /* ------------------------------------------------------------------------
     4. Theme
     ------------------------------------------------------------------------ */

  var themeBtn = $('#themeToggle');
  var themeLabel = $('#themeLabel');

  function systemPrefersDark() {
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  }

  function effectiveTheme() {
    var stored = loadData('theme', null);
    if (stored === 'dark' || stored === 'light') { return stored; }
    return systemPrefersDark() ? 'dark' : 'light';
  }

  function applyTheme(mode, persist) {
    document.documentElement.setAttribute('data-theme', mode);
    if (persist) { saveData('theme', mode); }
    if (themeBtn) {
      var next = mode === 'dark' ? 'Light mode' : 'Dark mode';
      themeBtn.setAttribute('aria-pressed', mode === 'dark' ? 'true' : 'false');
      /* The visible label is hidden on narrow screens, so name the button too. */
      themeBtn.setAttribute('aria-label', 'Switch to ' + next.toLowerCase());
      setText(themeLabel, next);
    }
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) { meta.setAttribute('content', mode === 'dark' ? '#0d151d' : '#0b6e7a'); }
  }

  function initTheme() {
    applyTheme(effectiveTheme(), false);

    if (themeBtn) {
      themeBtn.addEventListener('click', function () {
        var next = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
        applyTheme(next, true);
        syncSettingsThemeSelect();
      });
    }

    var settingsTheme = $('#settingsTheme');
    function syncSettingsThemeSelect() {
      if (!settingsTheme) { return; }
      var stored = loadData('theme', null);
      settingsTheme.value = (stored === 'dark' || stored === 'light') ? stored : 'system';
    }
    if (settingsTheme) {
      syncSettingsThemeSelect();
      settingsTheme.addEventListener('change', function () {
        if (settingsTheme.value === 'system') {
          clearData('theme');
          applyTheme(systemPrefersDark() ? 'dark' : 'light', false);
        } else {
          applyTheme(settingsTheme.value, true);
        }
      });
    }

    /* Track the system setting only while the reader has not chosen one. */
    if (window.matchMedia) {
      var query = window.matchMedia('(prefers-color-scheme: dark)');
      var onChange = function () {
        var stored = loadData('theme', null);
        if (stored !== 'dark' && stored !== 'light') {
          applyTheme(systemPrefersDark() ? 'dark' : 'light', false);
        }
      };
      if (query.addEventListener) { query.addEventListener('change', onChange); }
      else if (query.addListener) { query.addListener(onChange); }
    }
  }

  /* ------------------------------------------------------------------------
     5. Navigation
     ------------------------------------------------------------------------ */

  function initNav() {
    var toggle = $('#navToggle');
    var nav = $('#primaryNav');
    if (!toggle || !nav) { return; }

    function closeNav() {
      nav.classList.remove('is-open');
      toggle.setAttribute('aria-expanded', 'false');
    }

    toggle.addEventListener('click', function () {
      var open = nav.classList.toggle('is-open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });

    nav.addEventListener('click', function (event) {
      if (event.target.closest('a')) { closeNav(); }
    });

    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && nav.classList.contains('is-open')) {
        closeNav();
        toggle.focus();
      }
    });

    /* Mark the section currently in view. */
    var links = Array.prototype.slice.call(nav.querySelectorAll('a[href^="#"]'));
    var map = {};
    var targets = [];
    links.forEach(function (link) {
      var id = link.getAttribute('href').slice(1);
      var section = document.getElementById(id);
      if (section) { map[id] = link; targets.push(section); }
    });

    if (!('IntersectionObserver' in window) || targets.length === 0) { return; }

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        var link = map[entry.target.id];
        if (!link) { return; }
        if (entry.isIntersecting) {
          links.forEach(function (other) { other.removeAttribute('aria-current'); });
          link.setAttribute('aria-current', 'true');
        }
      });
    }, { rootMargin: '-45% 0px -50% 0px', threshold: 0 });

    targets.forEach(function (section) { observer.observe(section); });
  }

  /* ------------------------------------------------------------------------
     5b. Global search / command palette (Ctrl+K)
     ------------------------------------------------------------------------
     Two kinds of results: a fixed list of sections/tools, matched by label
     or keyword, and live course-catalog matches (once the catalog has
     loaded) by code or name. Selecting a course scrolls to the Course
     Catalog section and drops its code into that section's own search box,
     rather than trying to maintain a second, separate rendering path. */

  var COMMAND_SECTIONS = [
    { id: 'dashboard', label: 'Dashboard', keywords: 'gpa cgpa credits progress summary' },
    { id: 'gpa', label: 'GPA calculator', keywords: 'semester gpa courses grades' },
    { id: 'cgpa', label: 'CGPA calculator', keywords: 'cumulative semester course cgpa' },
    { id: 'history', label: 'Academic history', keywords: 'semester record filter search log' },
    { id: 'marks', label: 'Marks to grade', keywords: 'marks percentage grade point' },
    { id: 'catalog', label: 'Course catalog', keywords: 'courses search browse eee' },
    { id: 'attendance', label: 'Attendance tracker', keywords: 'classes attended absences' },
    { id: 'grades', label: 'Grade table', keywords: 'grading scale letter grade points' },
    { id: 'required', label: 'Required GPA / Target CGPA', keywords: 'target required remaining' },
    { id: 'planner', label: 'Semester planner', keywords: 'plan future semester summer 2026' },
    { id: 'whatif', label: 'What-if CGPA simulator', keywords: 'hypothetical simulate projected' },
    { id: 'improve', label: 'Grade improvement simulator', keywords: 'retake improve old new grade' },
    { id: 'rules', label: 'Academic rules', keywords: 'policy attendance course load verified' },
    { id: 'about', label: 'About', keywords: 'disclaimer independent project' },
    { id: 'settings', label: 'Settings', keywords: 'theme dark light export import reset clear data' }
  ];

  function initCommandPalette() {
    var overlay = $('#commandPaletteOverlay');
    var palette = $('#commandPalette');
    var input = $('#cmdkInput');
    var resultsEl = $('#cmdkResults');
    var emptyEl = $('#cmdkEmpty');
    var trigger = $('#searchTrigger');
    if (!overlay || !palette || !input || !resultsEl) { return; }

    var activeIndex = -1;
    var currentResults = [];

    function buildResults(query) {
      var needle = query.trim().toLowerCase();
      var sectionMatches = COMMAND_SECTIONS
        .filter(function (item) {
          if (!needle) { return true; }
          return item.label.toLowerCase().indexOf(needle) > -1 || item.keywords.indexOf(needle) > -1;
        })
        .map(function (item) {
          return { type: 'section', label: item.label, meta: 'Section', id: item.id };
        });

      var courseMatches = [];
      if (needle && COURSE_CATALOG_FLAT.length > 0) {
        COURSE_CATALOG_FLAT.forEach(function (course) {
          if (course.code.toLowerCase().indexOf(needle) > -1 || course.name.toLowerCase().indexOf(needle) > -1) {
            courseMatches.push({ type: 'course', label: course.code + ' — ' + course.name, meta: 'Course', code: course.code });
          }
        });
      }

      return sectionMatches.concat(courseMatches.slice(0, 12)).slice(0, 20);
    }

    function render(query) {
      currentResults = buildResults(query);
      activeIndex = currentResults.length > 0 ? 0 : -1;
      resultsEl.innerHTML = '';
      currentResults.forEach(function (item, index) {
        var li = document.createElement('li');
        li.className = 'cmdk__item' + (index === 0 ? ' is-active' : '');
        li.setAttribute('role', 'option');
        li.setAttribute('data-index', String(index));
        li.innerHTML = '<span class="cmdk__item-label"></span><span class="cmdk__item-meta"></span>';
        li.querySelector('.cmdk__item-label').textContent = item.label;
        li.querySelector('.cmdk__item-meta').textContent = item.meta;
        li.addEventListener('click', function () { activate(item); });
        resultsEl.appendChild(li);
      });
      emptyEl.hidden = currentResults.length > 0;
    }

    function setActive(index) {
      var items = resultsEl.querySelectorAll('.cmdk__item');
      if (items.length === 0) { return; }
      activeIndex = (index + items.length) % items.length;
      items.forEach(function (el, i) { el.classList.toggle('is-active', i === activeIndex); });
      items[activeIndex].scrollIntoView({ block: 'nearest' });
    }

    function activate(item) {
      close();
      if (!item) { return; }
      if (item.type === 'section') {
        var target = document.getElementById(item.id);
        if (target) { target.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
      } else if (item.type === 'course') {
        var catalogTarget = document.getElementById('catalog');
        var catalogSearch = $('#catalogSearch');
        if (catalogTarget) { catalogTarget.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
        if (catalogSearch) {
          catalogSearch.value = item.code;
          catalogSearch.dispatchEvent(new Event('input', { bubbles: true }));
        }
      }
    }

    function open() {
      overlay.hidden = false;
      palette.hidden = false;
      input.value = '';
      render('');
      window.setTimeout(function () { input.focus(); }, 0);
      document.body.style.overflow = 'hidden';
    }
    function close() {
      overlay.hidden = true;
      palette.hidden = true;
      document.body.style.overflow = '';
    }

    if (trigger) { trigger.addEventListener('click', open); }
    overlay.addEventListener('click', close);

    input.addEventListener('input', function () { render(input.value); });
    input.addEventListener('keydown', function (event) {
      if (event.key === 'ArrowDown') { event.preventDefault(); setActive(activeIndex + 1); }
      else if (event.key === 'ArrowUp') { event.preventDefault(); setActive(activeIndex - 1); }
      else if (event.key === 'Enter') { event.preventDefault(); activate(currentResults[activeIndex]); }
      else if (event.key === 'Escape') { close(); }
    });

    document.addEventListener('keydown', function (event) {
      var isTypingTarget = /^(INPUT|TEXTAREA|SELECT)$/.test((event.target && event.target.tagName) || '');
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        if (palette.hidden) { open(); } else { close(); }
      } else if (event.key === 'Escape' && !palette.hidden) {
        close();
      } else if (event.key === '/' && !isTypingTarget && palette.hidden) {
        event.preventDefault();
        open();
      }
    });
  }

  /* ------------------------------------------------------------------------
     6. Marks to grade
     ------------------------------------------------------------------------ */

  /* Returns the matching scale entry, or null when the mark is out of range. */
  function calculateGradeFromMarks(marks) {
    if (typeof marks !== 'number' || !isFinite(marks)) { return null; }
    if (marks < 0 || marks > 100) { return null; }
    for (var i = 0; i < GRADING_SCALE.length; i++) {
      var band = GRADING_SCALE[i];
      if (marks >= band.min && marks < band.below) { return band; }
    }
    return null;
  }

  function buildGradeTable() {
    var body = $('#gradeTableBody');
    if (!body) { return; }
    GRADING_SCALE.forEach(function (band) {
      var tr = document.createElement('tr');

      var range = document.createElement('td');
      range.className = 'gtable__range';
      range.textContent = band.range;

      var grade = document.createElement('td');
      grade.className = 'gtable__grade' + (band.grade === 'F' ? ' gtable__grade--fail' : '');
      grade.textContent = band.grade;

      var point = document.createElement('td');
      point.className = 'gtable__point';
      point.textContent = band.point.toFixed(2);

      tr.appendChild(range);
      tr.appendChild(grade);
      tr.appendChild(point);
      body.appendChild(tr);
    });
  }

  function buildLadder() {
    var ladder = $('#ladder');
    if (!ladder) { return []; }
    var segments = [];
    /* Drawn low to high, left to right, so it reads like a number line. */
    GRADING_SCALE.slice().reverse().forEach(function (band) {
      var seg = document.createElement('div');
      seg.className = 'ladder__seg' + (band.grade === 'F' ? ' is-fail' : '');
      seg.textContent = band.grade;
      ladder.appendChild(seg);
      segments.push({ grade: band.grade, el: seg });
    });
    return segments;
  }

  function initMarks() {
    var input = $('#marksInput');
    var msg = $('#marksMsg');
    var gradeEl = $('#markGrade');
    var pointEl = $('#markPoint');
    var bandEl = $('#markBand');
    var segments = buildLadder();

    if (!input) { return; }

    function highlight(grade) {
      segments.forEach(function (seg) {
        seg.el.classList.toggle('is-on', seg.grade === grade);
      });
    }

    function update() {
      var parsed = parseNum(input.value);

      if (parsed.empty) {
        input.removeAttribute('aria-invalid');
        setText(msg, '');
        setText(gradeEl, '—');
        setText(pointEl, '—');
        setText(bandEl, '—');
        gradeEl.classList.remove('is-fail');
        highlight(null);
        clearData('marks');
        return;
      }

      if (!parsed.valid) {
        input.setAttribute('aria-invalid', 'true');
        setText(msg, 'Enter a number between 0 and 100.');
        setText(gradeEl, '—');
        setText(pointEl, '—');
        setText(bandEl, '—');
        gradeEl.classList.remove('is-fail');
        highlight(null);
        return;
      }

      if (parsed.value < 0 || parsed.value > 100) {
        input.setAttribute('aria-invalid', 'true');
        setText(msg, 'Marks must be between 0 and 100.');
        setText(gradeEl, '—');
        setText(pointEl, '—');
        setText(bandEl, '—');
        gradeEl.classList.remove('is-fail');
        highlight(null);
        return;
      }

      var band = calculateGradeFromMarks(parsed.value);
      input.removeAttribute('aria-invalid');
      setText(msg, '');
      setText(gradeEl, band.grade);
      setText(pointEl, band.point.toFixed(2));
      setText(bandEl, band.range);
      gradeEl.classList.toggle('is-fail', band.grade === 'F');
      highlight(band.grade);
      saveData('marks', input.value);
    }

    input.addEventListener('input', update);

    var saved = loadData('marks', '');
    if (typeof saved === 'string' && saved !== '') { input.value = saved; }
    update();
  }

  function initHeroDemo() {
    var input = $('#heroMarks');
    var gradeEl = $('#heroGrade');
    var pointEl = $('#heroPoint');
    var bandEl = $('#heroBand');
    if (!input) { return; }

    function update() {
      var parsed = parseNum(input.value);
      var band = parsed.valid ? calculateGradeFromMarks(parsed.value) : null;

      if (!band) {
        setText(gradeEl, '—');
        setText(pointEl, '0.00');
        setText(bandEl, parsed.empty ? 'Enter a mark between 0 and 100.' : 'Marks must be between 0 and 100.');
        gradeEl.classList.remove('is-fail');
        return;
      }

      setText(gradeEl, band.grade);
      setText(pointEl, band.point.toFixed(2));
      setText(bandEl, band.range);
      gradeEl.classList.toggle('is-fail', band.grade === 'F');
    }

    input.addEventListener('input', update);
    update();
  }

  /* ------------------------------------------------------------------------
     7. Weighted GPA engine
     ------------------------------------------------------------------------
     Official method, per the rules effective from Spring 2024: credit hours of
     courses with an 'F' grade are not counted in SGPA or CGPA, so an F course
     is removed from both the numerator and the denominator. An 'I' course is
     likewise left out until a final grade is awarded.
     ------------------------------------------------------------------------ */

  function calculateGPA(courses) {
    var points = 0;        /* Σ(credit × grade point) over counted courses */
    var counted = 0;       /* Σ(credit) over counted courses               */
    var attempted = 0;     /* Σ(credit) over every graded course           */
    var fCredits = 0;
    var iCount = 0;

    courses.forEach(function (course) {
      var credit = course.credit;
      var grade = course.grade;

      if (grade === 'I') { iCount += 1; return; }

      attempted += credit;

      if (grade === 'F') { fCredits += credit; return; }

      var point = gradePoint(grade);
      if (point === null) { return; }

      points += credit * point;
      counted += credit;
    });

    return {
      gpa: counted > 0 ? points / counted : null,
      points: points,
      counted: counted,
      attempted: attempted,
      fCredits: fCredits,
      iCount: iCount,
      /* What the GPA would be if F credits were counted as zero instead. */
      gpaWithF: (counted + fCredits) > 0 ? points / (counted + fCredits) : null
    };
  }

  /* ------------------------------------------------------------------------
     8. Reusable course-based calculator
     ------------------------------------------------------------------------ */

  function makeGradeSelect(select) {
    var placeholder = document.createElement('option');
    placeholder.value = '';
    placeholder.textContent = 'Grade';
    select.appendChild(placeholder);

    GRADE_OPTIONS.forEach(function (option) {
      var el = document.createElement('option');
      el.value = option.value;
      el.textContent = option.label;
      select.appendChild(el);
    });
  }

  /* Fills the shared <datalist> with every course in the catalog, grouped
     order first, as "CODE — Name (n credits)". Typing any part of the code
     or the name filters the list natively in every modern browser, on
     desktop and mobile alike — no custom dropdown code required. */
  function populateCourseDatalist() {
    var list = document.getElementById('courseCatalogList');
    if (!list) { return; }
    list.innerHTML = '';
    COURSE_CATALOG_GROUPED.forEach(function (group) {
      group.courses.forEach(function (course) {
        var opt = document.createElement('option');
        opt.value = composeCourseLabel(course);
        list.appendChild(opt);
      });
    });
  }

  /* Read-only, searchable/browsable view of the full course catalog — a
     lightweight "Course Catalog" that doesn't need semester/status filters
     of its own, since no per-student enrollment data (which semester a
     course was taken, its status) is tracked in courses.json. Search
     matches code or name; groups collapse to keep the page short. */
  function renderCourseCatalogBrowser(filterText) {
    var container = $('#catalogList');
    var countEl = $('#catalogCount');
    if (!container) { return; }

    var needle = (filterText || '').trim().toLowerCase();
    container.innerHTML = '';
    var totalShown = 0;

    COURSE_CATALOG_GROUPED.forEach(function (group) {
      var matches = group.courses.filter(function (course) {
        if (!needle) { return true; }
        return course.code.toLowerCase().indexOf(needle) > -1 ||
               course.name.toLowerCase().indexOf(needle) > -1;
      });
      if (matches.length === 0) { return; }
      totalShown += matches.length;

      var details = document.createElement('details');
      details.className = 'cataloggroup';
      details.open = Boolean(needle);
      var summary = document.createElement('summary');
      summary.className = 'cataloggroup__summary';
      summary.textContent = group.group + ' (' + matches.length + ')';
      details.appendChild(summary);

      var list = document.createElement('ul');
      list.className = 'cataloggroup__list';
      matches.forEach(function (course) {
        var item = document.createElement('li');
        item.className = 'catalogitem';
        item.innerHTML =
          '<span class="catalogitem__code">' + escapeHtml(course.code) + '</span>' +
          '<span class="catalogitem__name">' + escapeHtml(course.name) + '</span>' +
          '<span class="catalogitem__credit">' + course.credit + (course.credit === 1 ? ' credit' : ' credits') + '</span>';
        list.appendChild(item);
      });
      details.appendChild(list);
      container.appendChild(details);
    });

    if (countEl) {
      setText(countEl, totalShown + (totalShown === 1 ? ' course' : ' courses') +
        (needle ? ' matching “' + filterText.trim() + '”' : ' in the catalog'));
    }
    if (totalShown === 0) {
      container.innerHTML = '<p class="chartcard__empty">No course matches that search.</p>';
    }
  }

  function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, function (ch) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch];
    });
  }

  function initCourseCatalogBrowser() {
    var searchInput = $('#catalogSearch');
    renderCourseCatalogBrowser('');
    if (searchInput) {
      searchInput.addEventListener('input', debounce(function () {
        renderCourseCatalogBrowser(searchInput.value);
      }, 120));
    }
  }

  /* Foundation for a real prerequisite checker: courses.json doesn't carry
     a "prerequisites" field today, so this always falls through to the
     "not available" message for every course. If/when prerequisite arrays
     are added to the catalog (e.g. "prerequisites": ["EEN 183"]), this
     function needs no changes — it already reads course.prerequisites and
     cross-checks it against completed course codes. */
  function getCompletedCourseCodeSet() {
    var codes = {};
    ['#gpaRows', '#ccRows', '#historyRows'].forEach(function (selector) {
      var tbody = $(selector);
      if (!tbody) { return; }
      Array.prototype.slice.call(tbody.rows).forEach(function (row) {
        var codeField = row.querySelector('[data-field="code"]');
        var gradeField = row.querySelector('[data-field="grade"]');
        if (!codeField || !gradeField || !gradeField.value) { return; }
        var code = codeField.value.trim();
        if (code) { codes[code] = true; }
      });
    });
    return codes;
  }

  function renderPrerequisiteCheck(code) {
    var out = $('#prereqOut');
    if (!out) { return; }
    if (!code) { setText(out, 'Search a course to see its prerequisites.'); return; }

    var course = COURSE_CATALOG_BY_CODE[code];
    if (!course) { setText(out, 'Course not found in the catalog.'); return; }

    var prereqs = Array.isArray(course.prerequisites) ? course.prerequisites.filter(Boolean) : [];
    if (prereqs.length === 0) {
      setText(out, course.code + ' — ' + course.name + ': Prerequisite information not available.');
      return;
    }

    var completed = getCompletedCourseCodeSet();
    var missing = prereqs.filter(function (p) { return !completed[p]; });
    var line = course.code + ' — ' + course.name + '. Prerequisites: ' + prereqs.join(', ') + '. ';
    line += missing.length === 0 ? 'All completed — eligible.' : 'Missing: ' + missing.join(', ') + '.';
    setText(out, line);
  }

  function initPrerequisiteChecker() {
    var input = $('#prereqSearch');
    if (!input) { return; }
    input.addEventListener('input', debounce(function () {
      var code = COURSE_LABEL_TO_CODE[input.value];
      renderPrerequisiteCheck(code || null);
    }, 120));
  }


  /* The visible search box (data-field="codeSearch") is paired with a
     hidden input (data-field="code") that actually holds the value the
     calculators read and save. When the typed text matches a catalog
     entry exactly, the row's name and credit fields are auto-filled —
     both remain editable afterward. Anything that doesn't match a known
     course is kept as free text, so a course missing from the catalog can
     still be entered and calculated. */
  function handleCourseSearchInput(searchInput) {
    var row = searchInput.closest('tr');
    if (!row) { return; }
    var hidden = row.querySelector('[data-field="code"]');
    var value = searchInput.value;
    var code = COURSE_LABEL_TO_CODE[value];

    if (code && COURSE_CATALOG_BY_CODE[code]) {
      var course = COURSE_CATALOG_BY_CODE[code];
      hidden.value = code;
      var nameInput = row.querySelector('[data-field="name"]');
      var creditInput = row.querySelector('[data-field="credit"]');
      if (nameInput) { nameInput.value = course.name; }
      if (creditInput) { creditInput.value = String(course.credit); }
    } else {
      hidden.value = value.trim();
    }
  }

  /* Restores a row's search box + hidden code field from saved data. If the
     saved code still exists in the catalog, show its full descriptive
     label; otherwise show the raw text that was saved (a custom course, or
     one that has since been removed from courses.json). */
  function restoreCourseCode(row, savedCode) {
    var searchInput = row.querySelector('[data-field="codeSearch"]');
    var hidden = row.querySelector('[data-field="code"]');
    var code = savedCode || '';
    hidden.value = code;
    if (code && COURSE_CATALOG_BY_CODE[code]) {
      searchInput.value = composeCourseLabel(COURSE_CATALOG_BY_CODE[code]);
    } else {
      searchInput.value = code;
    }
  }

  function createCourseCalculator(config) {
    var tbody = $(config.rows);
    var addBtn = $(config.addBtn);
    var resetBtn = $(config.resetBtn);
    var msgEl = $(config.msg);
    var valueEl = $(config.value);
    var countedEl = $(config.counted);
    var attemptedEl = $(config.attempted);
    var pointsEl = $(config.points);
    var noteEl = $(config.note);
    var template = $('#tplCourseRow');

    if (!tbody || !template) { return null; }

    /* Labels are derived from position, so they stay correct after removals. */
    function relabel() {
      Array.prototype.slice.call(tbody.rows).forEach(function (row, index) {
        var n = index + 1;
        row.querySelector('[data-field="name"]').setAttribute('aria-label', 'Course name, row ' + n);
        row.querySelector('[data-field="codeSearch"]').setAttribute('aria-label', 'Search for a course, row ' + n);
        row.querySelector('[data-field="credit"]').setAttribute('aria-label', 'Credit hours, row ' + n);
        row.querySelector('[data-field="grade"]').setAttribute('aria-label', config.gradeLabel + ', row ' + n);
        row.querySelector('[data-action="remove"] .visually-hidden')
           .textContent = 'Remove course in row ' + n;
      });
    }

    function addCourse(data) {
      var fragment = template.content.cloneNode(true);
      var row = fragment.querySelector('tr');
      var select = row.querySelector('[data-field="grade"]');
      makeGradeSelect(select);

      var nameInput = row.querySelector('[data-field="name"]');
      var creditInput = row.querySelector('[data-field="credit"]');

      if (data) {
        nameInput.value = data.name || '';
        creditInput.value = (data.credit === 0 || data.credit) ? String(data.credit) : '';
        select.value = data.grade || '';
        if (select.value !== (data.grade || '')) { select.value = ''; }
        restoreCourseCode(row, data.code || '');
      }

      tbody.appendChild(fragment);
      relabel();
      return row;
    }

    function removeCourse(row) {
      row.remove();
      if (tbody.rows.length === 0) { addCourse(null); }
      relabel();
    }

    /* Reads every row, reporting the first validation problem it meets. */
    function readRows() {
      var courses = [];
      var error = '';
      var rows = Array.prototype.slice.call(tbody.rows);

      rows.forEach(function (row, index) {
        var nameInput = row.querySelector('[data-field="name"]');
        var creditInput = row.querySelector('[data-field="credit"]');
        var select = row.querySelector('[data-field="grade"]');

        var name = nameInput.value.trim();
        var grade = select.value;
        var creditRaw = creditInput.value.trim();
        var credit = parseNum(creditRaw);
        var label = name !== '' ? '“' + name + '”' : 'row ' + (index + 1);

        creditInput.removeAttribute('aria-invalid');
        select.removeAttribute('aria-invalid');

        /* A completely untouched row is simply ignored. */
        var untouched = name === '' && creditRaw === '' && grade === '' &&
                        row.querySelector('[data-field="code"]').value.trim() === '';
        if (untouched) { return; }

        if (creditRaw === '') {
          creditInput.setAttribute('aria-invalid', 'true');
          if (!error) { error = 'Enter the credit hours for ' + label + '.'; }
          return;
        }
        if (!credit.valid) {
          creditInput.setAttribute('aria-invalid', 'true');
          if (!error) { error = 'Credit hours for ' + label + ' must be a number.'; }
          return;
        }
        if (credit.value < 0) {
          creditInput.setAttribute('aria-invalid', 'true');
          if (!error) { error = 'Credit hours cannot be negative (' + label + ').'; }
          return;
        }
        if (credit.value === 0) {
          creditInput.setAttribute('aria-invalid', 'true');
          if (!error) { error = 'Credit hours for ' + label + ' must be greater than zero.'; }
          return;
        }
        if (credit.value > 30) {
          creditInput.setAttribute('aria-invalid', 'true');
          if (!error) { error = 'Credit hours for ' + label + ' look too high. Check the value.'; }
          return;
        }
        if (grade === '') {
          select.setAttribute('aria-invalid', 'true');
          if (!error) { error = 'Choose a grade for ' + label + '.'; }
          return;
        }

        courses.push({ credit: credit.value, grade: grade });
      });

      return { courses: courses, error: error, rowCount: rows.length };
    }

    function serialise() {
      return Array.prototype.slice.call(tbody.rows).map(function (row) {
        return {
          name: row.querySelector('[data-field="name"]').value,
          code: row.querySelector('[data-field="code"]').value,
          credit: row.querySelector('[data-field="credit"]').value,
          grade: row.querySelector('[data-field="grade"]').value
        };
      });
    }

    var persist = debounce(function () {
      saveData(config.key, serialise());
    }, 250);

    function render() {
      var read = readRows();
      var result = calculateGPA(read.courses);

      setText(countedEl, fmtCredits(result.counted));
      setText(attemptedEl, fmtCredits(result.attempted));
      setText(pointsEl, fmt2(result.points));

      valueEl.classList.remove('is-warn');

      if (read.error) {
        setMsg(msgEl, read.error, false);
      } else if (read.courses.length === 0) {
        setMsg(msgEl, config.emptyHint, true);
      } else {
        setMsg(msgEl, '', false);
      }

      if (result.gpa === null) {
        setText(valueEl, '—');
        valueEl.classList.add('is-muted');
      } else {
        setText(valueEl, fmt2(result.gpa));
        valueEl.classList.remove('is-muted');
      }

      /* Explain any credits that were left out of the average. */
      var notes = [];
      if (result.fCredits > 0) {
        var alt = result.gpaWithF === null ? '—' : fmt2(result.gpaWithF);
        notes.push(
          fmtCredits(result.fCredits) + ' credit hour' + (result.fCredits === 1 ? '' : 's') +
          ' with an F grade are excluded from this average, following the rule effective from ' +
          'Spring 2024. Counted as zero points instead, the result would be ' + alt + '.'
        );
      }
      if (result.iCount > 0) {
        notes.push(
          result.iCount + ' course' + (result.iCount === 1 ? '' : 's') +
          ' marked I are not included until a final grade is awarded.'
        );
      }

      if (noteEl) {
        if (notes.length > 0) {
          noteEl.textContent = notes.join(' ');
          noteEl.hidden = false;
        } else {
          noteEl.textContent = '';
          noteEl.hidden = true;
        }
      }
    }

    function resetCalculator() {
      while (tbody.rows.length > 0) { tbody.deleteRow(0); }
      for (var i = 0; i < config.defaultRows; i++) { addCourse(null); }
      clearData(config.key);
      render();
    }

    /* Events -------------------------------------------------------------- */

    tbody.addEventListener('input', function (event) {
      var target = event.target;
      if (target && target.matches && target.matches('[data-field="codeSearch"]')) {
        handleCourseSearchInput(target);
      }
      render();
      persist();
    });
    tbody.addEventListener('change', function () {
      render();
      persist();
    });

    tbody.addEventListener('click', function (event) {
      var button = event.target.closest('[data-action="remove"]');
      if (!button) { return; }
      removeCourse(button.closest('tr'));
      render();
      persist();
    });

    if (addBtn) {
      addBtn.addEventListener('click', function () {
        var row = addCourse(null);
        var field = row.querySelector('[data-field="name"]');
        if (field) { field.focus(); }
        render();
        persist();
        showToast('Course added.', 'success');
      });
    }

    if (resetBtn) {
      resetBtn.addEventListener('click', resetCalculator);
    }

    /* Initial state ------------------------------------------------------- */

    var saved = loadData(config.key, null);
    if (Array.isArray(saved) && saved.length > 0) {
      saved.slice(0, 60).forEach(function (item) {
        addCourse(item && typeof item === 'object' ? item : null);
      });
    } else {
      for (var i = 0; i < config.defaultRows; i++) { addCourse(null); }
    }
    render();

    return { reset: resetCalculator, render: render };
  }

  /* ------------------------------------------------------------------------
     9. CGPA from semester summaries
     ------------------------------------------------------------------------ */

  function calculateCGPA(semesters) {
    var points = 0;
    var credits = 0;

    semesters.forEach(function (semester) {
      points += semester.gpa * semester.credits;
      credits += semester.credits;
    });

    return {
      cgpa: credits > 0 ? points / credits : null,
      points: points,
      credits: credits,
      count: semesters.length
    };
  }

  function initSemesterCGPA() {
    var tbody = $('#semRows');
    var template = $('#tplSemesterRow');
    if (!tbody || !template) { return; }

    var msgEl = $('#semMsg');
    var valueEl = $('#semValue');
    var creditsEl = $('#semCredits');
    var countEl = $('#semCount');
    var pointsEl = $('#semPoints');
    function relabel() {
      Array.prototype.slice.call(tbody.rows).forEach(function (row, index) {
        var n = index + 1;
        row.querySelector('[data-field="name"]').setAttribute('aria-label', 'Semester name, row ' + n);
        row.querySelector('[data-field="credit"]').setAttribute('aria-label', 'Semester credits, row ' + n);
        row.querySelector('[data-field="gpa"]').setAttribute('aria-label', 'Semester GPA, row ' + n);
        row.querySelector('[data-action="remove"] .visually-hidden')
           .textContent = 'Remove semester in row ' + n;
      });
    }

    function addSemester(data) {
      var fragment = template.content.cloneNode(true);
      var row = fragment.querySelector('tr');

      if (data) {
        row.querySelector('[data-field="name"]').value = data.name || '';
        row.querySelector('[data-field="credit"]').value = data.credit || '';
        row.querySelector('[data-field="gpa"]').value = data.gpa || '';
      }

      tbody.appendChild(fragment);
      relabel();
      return row;
    }

    function readRows() {
      var semesters = [];
      var error = '';

      Array.prototype.slice.call(tbody.rows).forEach(function (row, index) {
        var nameInput = row.querySelector('[data-field="name"]');
        var creditInput = row.querySelector('[data-field="credit"]');
        var gpaInput = row.querySelector('[data-field="gpa"]');

        var name = nameInput.value.trim();
        var creditRaw = creditInput.value.trim();
        var gpaRaw = gpaInput.value.trim();
        var label = name !== '' ? '“' + name + '”' : 'row ' + (index + 1);

        creditInput.removeAttribute('aria-invalid');
        gpaInput.removeAttribute('aria-invalid');

        if (name === '' && creditRaw === '' && gpaRaw === '') { return; }

        var credit = parseNum(creditRaw);
        var gpa = parseNum(gpaRaw);

        if (!credit.valid || credit.value <= 0) {
          creditInput.setAttribute('aria-invalid', 'true');
          if (!error) {
            error = credit.valid && credit.value < 0
              ? 'Credits cannot be negative (' + label + ').'
              : 'Enter the credits for ' + label + ' as a number greater than zero.';
          }
          return;
        }
        if (credit.value > 60) {
          creditInput.setAttribute('aria-invalid', 'true');
          if (!error) { error = 'Credits for ' + label + ' look too high for one semester.'; }
          return;
        }
        if (!gpa.valid) {
          gpaInput.setAttribute('aria-invalid', 'true');
          if (!error) { error = 'Enter the GPA for ' + label + ' as a number.'; }
          return;
        }
        if (gpa.value < 0 || gpa.value > MAX_GRADE_POINT) {
          gpaInput.setAttribute('aria-invalid', 'true');
          if (!error) { error = 'GPA for ' + label + ' must be between 0.00 and 4.00.'; }
          return;
        }

        semesters.push({ credits: credit.value, gpa: gpa.value });
      });

      return { semesters: semesters, error: error };
    }

    var persist = debounce(function () {
      saveData('cgpa-semesters', Array.prototype.slice.call(tbody.rows).map(function (row) {
        return {
          name: row.querySelector('[data-field="name"]').value,
          credit: row.querySelector('[data-field="credit"]').value,
          gpa: row.querySelector('[data-field="gpa"]').value
        };
      }));
    }, 250);

    function render() {
      var read = readRows();
      var result = calculateCGPA(read.semesters);

      setText(creditsEl, fmtCredits(result.credits));
      setText(countEl, String(result.count));
      setText(pointsEl, fmt2(result.points));

      if (read.error) {
        setMsg(msgEl, read.error, false);
      } else if (read.semesters.length === 0) {
        setMsg(msgEl, 'Add at least one semester with its credits and GPA.', true);
      } else {
        setMsg(msgEl, '', false);
      }

      if (result.cgpa === null) {
        setText(valueEl, '—');
        valueEl.classList.add('is-muted');
      } else {
        setText(valueEl, fmt2(result.cgpa));
        valueEl.classList.remove('is-muted');
      }
    }

    function resetCalculator() {
      while (tbody.rows.length > 0) { tbody.deleteRow(0); }
      addSemester(null);
      addSemester(null);
      clearData('cgpa-semesters');
      render();
    }

    tbody.addEventListener('input', function () { render(); persist(); });
    tbody.addEventListener('click', function (event) {
      var button = event.target.closest('[data-action="remove"]');
      if (!button) { return; }
      button.closest('tr').remove();
      if (tbody.rows.length === 0) { addSemester(null); }
      relabel();
      render();
      persist();
    });

    $('#semAdd').addEventListener('click', function () {
      var row = addSemester(null);
      row.querySelector('[data-field="name"]').focus();
      render();
      persist();
    });
    $('#semReset').addEventListener('click', resetCalculator);

    var saved = loadData('cgpa-semesters', null);
    if (Array.isArray(saved) && saved.length > 0) {
      saved.slice(0, 40).forEach(function (item) {
        addSemester(item && typeof item === 'object' ? item : null);
      });
    } else {
      addSemester(null);
      addSemester(null);
    }
    render();

    return { reset: resetCalculator };
  }

  /* ------------------------------------------------------------------------
     10. CGPA tabs
     ------------------------------------------------------------------------ */

  function initTabs() {
    var tabs = [$('#tabSem'), $('#tabCourse')];
    var panels = [$('#panelSem'), $('#panelCourse')];
    if (!tabs[0] || !tabs[1]) { return; }

    function select(index) {
      tabs.forEach(function (tab, i) {
        var on = i === index;
        tab.setAttribute('aria-selected', on ? 'true' : 'false');
        tab.tabIndex = on ? 0 : -1;
        panels[i].hidden = !on;
      });
      saveData('cgpa-tab', index);
    }

    tabs.forEach(function (tab, i) {
      tab.addEventListener('click', function () { select(i); });
      tab.addEventListener('keydown', function (event) {
        var next = null;
        if (event.key === 'ArrowRight') { next = (i + 1) % tabs.length; }
        if (event.key === 'ArrowLeft') { next = (i - 1 + tabs.length) % tabs.length; }
        if (next === null) { return; }
        event.preventDefault();
        select(next);
        tabs[next].focus();
      });
    });

    var saved = loadData('cgpa-tab', 0);
    select(saved === 1 ? 1 : 0);
  }

  /* ------------------------------------------------------------------------
     11. Required GPA
     ------------------------------------------------------------------------
     Required GPA = (Target CGPA × total credits after completion
                     − Current CGPA × completed credits) ÷ remaining credits
     ------------------------------------------------------------------------ */

  function calculateRequiredGPA(current, completed, target, remaining) {
    var totalAfter = completed + remaining;
    var havePoints = current * completed;
    var needPoints = target * totalAfter;
    var missingPoints = needPoints - havePoints;

    return {
      required: missingPoints / remaining,
      missingPoints: missingPoints,
      totalAfter: totalAfter,
      maxFinal: (havePoints + MAX_GRADE_POINT * remaining) / totalAfter
    };
  }

  function initRequiredGPA() {
    var currentInput = $('#reqCurrent');
    var completedInput = $('#reqCompleted');
    var targetInput = $('#reqTarget');
    var remainingInput = $('#reqRemaining');
    if (!currentInput) { return; }

    var msgEl = $('#reqMsg');
    var valueEl = $('#reqValue');
    var totalEl = $('#reqTotal');
    var neededEl = $('#reqNeeded');
    var maxEl = $('#reqMax');
    var noteEl = $('#reqNote');

    var inputs = [currentInput, completedInput, targetInput, remainingInput];

    function blank() {
      setText(valueEl, '—');
      valueEl.classList.add('is-muted');
      valueEl.classList.remove('is-warn');
      setText(totalEl, '0');
      setText(neededEl, '0.00');
      setText(maxEl, '—');
      noteEl.hidden = true;
      noteEl.textContent = '';
    }

    function render() {
      inputs.forEach(function (input) { input.removeAttribute('aria-invalid'); });

      var current = parseNum(currentInput.value);
      var completed = parseNum(completedInput.value);
      var target = parseNum(targetInput.value);
      var remaining = parseNum(remainingInput.value);

      var allEmpty = current.empty && completed.empty && target.empty && remaining.empty;
      if (allEmpty) {
        setText(msgEl, '');
        blank();
        return;
      }

      /* Field-by-field validation, reporting one problem at a time. */
      if (!current.valid || current.value < 0 || current.value > MAX_GRADE_POINT) {
        currentInput.setAttribute('aria-invalid', 'true');
        setText(msgEl, 'Current CGPA must be a number between 0.00 and 4.00.');
        blank();
        return;
      }
      if (!completed.valid || completed.value < 0) {
        completedInput.setAttribute('aria-invalid', 'true');
        setText(msgEl, 'Completed credits must be zero or more.');
        blank();
        return;
      }
      if (!target.valid || target.value < 0 || target.value > MAX_GRADE_POINT) {
        targetInput.setAttribute('aria-invalid', 'true');
        setText(msgEl, 'Target CGPA must be a number between 0.00 and 4.00.');
        blank();
        return;
      }
      if (!remaining.valid || remaining.value <= 0) {
        remainingInput.setAttribute('aria-invalid', 'true');
        setText(msgEl, 'Remaining credits must be greater than zero.');
        blank();
        return;
      }
      if (completed.value > 400 || remaining.value > 400) {
        setText(msgEl, 'Credit values look too high. Check the numbers.');
        blank();
        return;
      }

      setText(msgEl, '');

      var out = calculateRequiredGPA(current.value, completed.value, target.value, remaining.value);

      setText(totalEl, fmtCredits(out.totalAfter));
      setText(neededEl, fmt2(Math.max(0, out.missingPoints)));
      setText(maxEl, fmt2(out.maxFinal));

      var notes = [];

      /* Rounded to two decimals first, so 4.001 does not read as impossible. */
      var required = round2(out.required);

      if (required > MAX_GRADE_POINT) {
        valueEl.classList.remove('is-muted');
        valueEl.classList.add('is-warn');
        setText(valueEl, 'Target CGPA is not mathematically achievable with the given remaining credits.');
        notes.push(
          'Reaching ' + fmt2(target.value) + ' would need an average of ' + fmt2(out.required) +
          ' across the remaining ' + fmtCredits(remaining.value) + ' credits, which is above the ' +
          'maximum grade point of 4.00. With straight A+ grades the highest CGPA you could finish ' +
          'on is ' + fmt2(out.maxFinal) + '. Adding more remaining credits raises that ceiling.'
        );
      } else if (required <= 0) {
        valueEl.classList.remove('is-muted', 'is-warn');
        setText(valueEl, '0.00');
        notes.push(
          'Your target is already secured by the credits you have completed, so any passing ' +
          'result in the remaining credits keeps you at or above ' + fmt2(target.value) + '. ' +
          'Remember that passing grades are still required course by course.'
        );
      } else {
        valueEl.classList.remove('is-muted', 'is-warn');
        setText(valueEl, fmt2(required));

        if (target.value < current.value) {
          notes.push(
            'Your target is below your current CGPA, so this figure is the average you can ' +
            'afford to drop to rather than one to aim for.'
          );
        }
        if (required > 3.75) {
          notes.push('This needs close to straight A+ results, so the margin for error is very small.');
        }
      }

      if (notes.length > 0) {
        noteEl.textContent = notes.join(' ');
        noteEl.hidden = false;
      } else {
        noteEl.hidden = true;
        noteEl.textContent = '';
      }

      saveData('required', {
        current: currentInput.value,
        completed: completedInput.value,
        target: targetInput.value,
        remaining: remainingInput.value
      });
    }

    inputs.forEach(function (input) { input.addEventListener('input', render); });

    function resetCalculator(moveFocus) {
      inputs.forEach(function (input) {
        input.value = '';
        input.removeAttribute('aria-invalid');
      });
      clearData('required');
      setText(msgEl, '');
      blank();
      if (moveFocus) { currentInput.focus(); }
    }

    $('#reqReset').addEventListener('click', function () { resetCalculator(true); });

    var saved = loadData('required', null);
    if (saved && typeof saved === 'object') {
      currentInput.value = saved.current || '';
      completedInput.value = saved.completed || '';
      targetInput.value = saved.target || '';
      remainingInput.value = saved.remaining || '';
    }
    render();

    return { reset: function () { resetCalculator(false); } };
  }

  /* ------------------------------------------------------------------------
     12. Clear everything
     ------------------------------------------------------------------------ */

  function initClearAll(instances) {
    var button = $('#clearAll');
    var msg = $('#clearMsg');
    if (!button) { return; }

    button.addEventListener('click', function () {
      var confirmed = window.confirm(
        'This erases every course, semester and setting this site has saved in your browser. Continue?'
      );
      if (!confirmed) { return; }

      clearAllData();
      instances.forEach(function (instance) {
        if (instance && typeof instance.reset === 'function') { instance.reset(); }
      });

      var marks = $('#marksInput');
      if (marks) {
        marks.value = '';
        marks.dispatchEvent(new Event('input', { bubbles: true }));
      }

      applyTheme(systemPrefersDark() ? 'dark' : 'light', false);
      var settingsThemeAfterClear = $('#settingsTheme');
      if (settingsThemeAfterClear) { settingsThemeAfterClear.value = 'system'; }
      setText(msg, 'All saved data has been erased from this browser.');
      showToast('All data cleared.', 'success');
      window.setTimeout(function () { setText(msg, ''); }, 6000);
      updateDashboard();
    });
  }

  /* ------------------------------------------------------------------------
     12b. Dashboard, charts, projected CGPA
     ------------------------------------------------------------------------
     Pull-based: rather than threading callbacks through every calculator,
     this reads the values the calculators have already rendered to the
     page (result values, table rows) whenever any relevant input changes.
     Keeps the existing calculators untouched and avoids duplicating their
     validation logic.
     ------------------------------------------------------------------------ */

  var dashboardCharts = { progress: null, distribution: null };
  var chartsAvailable = null; /* null = not checked yet */

  function cssVar(name, fallback) {
    var value = getComputedStyle(document.documentElement).getPropertyValue(name);
    return value && value.trim() !== '' ? value.trim() : fallback;
  }

  function ensureCharts() {
    if (chartsAvailable === null) {
      chartsAvailable = (typeof window.Chart !== 'undefined');
      if (!chartsAvailable) {
        console.warn('Chart.js did not load — dashboard charts are hidden, everything else still works.');
      }
    }
    if (!chartsAvailable) { return false; }

    var progressCanvas = $('#chartCgpaProgress');
    var distCanvas = $('#chartGradeDistribution');

    if (progressCanvas && !dashboardCharts.progress) {
      dashboardCharts.progress = new window.Chart(progressCanvas.getContext('2d'), {
        type: 'line',
        data: {
          labels: [],
          datasets: [
            {
              label: 'Semester GPA',
              data: [],
              borderColor: cssVar('--brand-500', '#4f5fe0'),
              backgroundColor: 'transparent',
              tension: 0.3,
              pointRadius: 3
            },
            {
              label: 'Cumulative CGPA',
              data: [],
              borderColor: cssVar('--brand-800', '#212a78'),
              backgroundColor: 'transparent',
              borderDash: [5, 4],
              tension: 0.3,
              pointRadius: 3
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          animation: { duration: 280 },
          scales: { y: { min: 0, max: 4, ticks: { stepSize: 0.5 } } },
          plugins: { legend: { position: 'bottom', labels: { boxWidth: 12 } } }
        }
      });
    }

    if (distCanvas && !dashboardCharts.distribution) {
      dashboardCharts.distribution = new window.Chart(distCanvas.getContext('2d'), {
        type: 'bar',
        data: { labels: [], datasets: [{ label: 'Courses', data: [], backgroundColor: cssVar('--brand-400', '#818cf8'), borderRadius: 4 }] },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          animation: { duration: 280 },
          plugins: { legend: { display: false } },
          scales: { y: { beginAtZero: true, ticks: { precision: 0 } } }
        }
      });
    }

    return true;
  }

  function readSemesterRowsForDashboard() {
    var tbody = $('#semRows');
    if (!tbody) { return []; }
    var list = [];
    Array.prototype.slice.call(tbody.rows).forEach(function (row) {
      var name = row.querySelector('[data-field="name"]').value.trim();
      var credit = parseNum(row.querySelector('[data-field="credit"]').value);
      var gpa = parseNum(row.querySelector('[data-field="gpa"]').value);
      if (credit.valid && credit.value > 0 && gpa.valid && gpa.value >= 0 && gpa.value <= MAX_GRADE_POINT) {
        list.push({ name: name || ('Semester ' + (list.length + 1)), credit: credit.value, gpa: gpa.value });
      }
    });
    return list;
  }

  function readGradedRowsFrom(selector) {
    var tbody = $(selector);
    if (!tbody) { return []; }
    var list = [];
    Array.prototype.slice.call(tbody.rows).forEach(function (row) {
      var credit = parseNum(row.querySelector('[data-field="credit"]').value);
      var grade = row.querySelector('[data-field="grade"]').value;
      if (credit.valid && credit.value > 0 && grade) { list.push({ credit: credit.value, grade: grade }); }
    });
    return list;
  }

  function readPlannerCoursesForDashboard() { return readGradedRowsFrom('#planRows'); }
  function readWhatIfCoursesForDashboard() { return readGradedRowsFrom('#whatifRows'); }

  /* Grade distribution comes from real, graded courses: the semester GPA
     table and the CGPA-by-course table. The planner is hypothetical, so it
     is deliberately excluded from this chart. */
  function readGradeCountsForDashboard() {
    var counts = {};
    ['#gpaRows', '#ccRows'].forEach(function (selector) {
      var tbody = $(selector);
      if (!tbody) { return; }
      Array.prototype.slice.call(tbody.rows).forEach(function (row) {
        var select = row.querySelector('[data-field="grade"]');
        var credit = parseNum(row.querySelector('[data-field="credit"]').value);
        if (!select || !select.value || !credit.valid || credit.value <= 0) { return; }
        counts[select.value] = (counts[select.value] || 0) + 1;
      });
    });
    return counts;
  }

  /* Prefers the semester method's totals for the dashboard's CGPA and
     completed-credits figures (it is what most students keep up to date);
     falls back to the by-course method when no semester data exists. */
  function getCompletedRecord() {
    var semCredits = parseNum(($('#semCredits') || {}).textContent || '0');
    var semPoints = parseNum(($('#semPoints') || {}).textContent || '0');
    var semCountText = ($('#semCount') || {}).textContent || '0';

    if (semCredits.valid && semCredits.value > 0) {
      return {
        credits: semCredits.value,
        points: semPoints.valid ? semPoints.value : 0,
        cgpaText: (($('#semValue') || {}).textContent || '—').trim(),
        semesterCount: parseInt(semCountText, 10) || 0
      };
    }

    var ccCounted = parseNum(($('#ccCounted') || {}).textContent || '0');
    var ccPoints = parseNum(($('#ccPoints') || {}).textContent || '0');
    return {
      credits: ccCounted.valid ? ccCounted.value : 0,
      points: ccPoints.valid ? ccPoints.value : 0,
      cgpaText: (($('#ccValue') || {}).textContent || '—').trim(),
      semesterCount: 0
    };
  }

  function toggleChartEmpty(canvasSelector, emptySelector, isEmpty) {
    var canvas = $(canvasSelector);
    var empty = $(emptySelector);
    if (canvas) { canvas.hidden = isEmpty; }
    if (empty) { empty.hidden = !isEmpty; }
  }

  /* Distinct completed courses across the GPA and CGPA-by-course tables
     (deduplicated by course code when a code was matched from the
     catalog, else by the typed name) — an approximation, since the same
     course could legitimately be typed slightly differently in two
     places. "Remaining courses" is deliberately not computed: it would
     need the full official semester-wise curriculum (total course count),
     which isn't part of this app's verified data yet. */
  function countDistinctCompletedCourses() {
    var seen = {};
    var count = 0;
    ['#gpaRows', '#ccRows'].forEach(function (selector) {
      var tbody = $(selector);
      if (!tbody) { return; }
      Array.prototype.slice.call(tbody.rows).forEach(function (row) {
        var grade = row.querySelector('[data-field="grade"]').value;
        var credit = parseNum(row.querySelector('[data-field="credit"]').value);
        if (!grade || !credit.valid || credit.value <= 0) { return; }
        var code = row.querySelector('[data-field="code"]').value.trim();
        var name = row.querySelector('[data-field="name"]').value.trim();
        var key = (code || name).toLowerCase();
        if (!key || seen[key]) { return; }
        seen[key] = true;
        count++;
      });
    });
    return count;
  }

  var updateDashboard = debounce(function () {
    var semesters = readSemesterRowsForDashboard();
    var record = getCompletedRecord();

    setText($('#dashGpa'), (($('#gpaValue') || {}).textContent || '—').trim());
    setText($('#dashCgpa'), record.cgpaText || '—');
    setText($('#dashCredits'), fmtCredits(record.credits || 0));
    setText($('#dashSemesters'), String(semesters.length > 0 ? semesters.length : record.semesterCount));

    /* Credits-toward-degree progress bar. Total is configurable because no
       officially verified total credit count for the EEE program was found
       in the current sources — the person sets it once for their catalog
       year and it is remembered. */
    var totalInput = $('#dashTotalCredits');
    var totalParsed = totalInput ? parseNum(totalInput.value) : { valid: false };
    var totalCredits = (totalParsed.valid && totalParsed.value > 0) ? totalParsed.value : 158;
    var pct = totalCredits > 0 ? Math.max(0, Math.min(100, (record.credits / totalCredits) * 100)) : 0;
    var fill = $('#dashProgressFill');
    if (fill) { fill.style.width = pct.toFixed(1) + '%'; }
    var remainingCredits = Math.max(0, totalCredits - (record.credits || 0));
    setText($('#dashRemaining'), fmtCredits(remainingCredits));
    setText($('#dashProgressText'),
      fmtCredits(record.credits || 0) + ' of ' + fmtCredits(totalCredits) + ' credits completed (' +
      Math.round(pct) + '%). ' + fmtCredits(remainingCredits) + ' credits remaining.');
    setText($('#settingsTotalCreditsDisplay'), fmtCredits(totalCredits));
    setText($('#dashCourseCounts'),
      'Completed courses: ' + countDistinctCompletedCourses() +
      '. Remaining courses: not available (needs the full official curriculum).');
    var bar = $('#dashProgressBar');
    if (bar) {
      bar.setAttribute('aria-valuenow', String(Math.round(pct)));
      bar.setAttribute('aria-valuetext', Math.round(pct) + ' percent of credits completed');
    }

    /* Target CGPA card mirrors whatever is entered in the Required GPA
       calculator further down the page — no separate input to keep in
       sync, and it disappears back to "—" if that field is cleared. */
    var targetInput = $('#reqTarget');
    var targetParsed = targetInput ? parseNum(targetInput.value) : { valid: false };
    var targetEl = $('#dashTarget');
    var targetSubEl = $('#dashTargetSub');
    if (targetParsed.valid && targetParsed.value >= 0 && targetParsed.value <= MAX_GRADE_POINT) {
      setText(targetEl, fmt2(targetParsed.value));
      var currentCgpaNum = parseNum(record.cgpaText);
      if (currentCgpaNum.valid) {
        var gap = targetParsed.value - currentCgpaNum.value;
        if (gap <= 0) {
          setText(targetSubEl, 'Already at or above target.');
        } else {
          setText(targetSubEl, fmt2(gap) + ' to go from your current CGPA.');
        }
      } else {
        setText(targetSubEl, 'Enter your CGPA above to see the gap.');
      }
    } else {
      setText(targetEl, '—');
      setText(targetSubEl, 'Set it in the Required GPA calculator below.');
    }

    /* Charts */
    if (ensureCharts()) {
      var labels = semesters.map(function (s) { return s.name; });
      var semGpas = semesters.map(function (s) { return round2(s.gpa); });
      var cumulative = [];
      var runCredits = 0, runPoints = 0;
      semesters.forEach(function (s) {
        runCredits += s.credit;
        runPoints += s.credit * s.gpa;
        cumulative.push(runCredits > 0 ? round2(runPoints / runCredits) : null);
      });

      if (dashboardCharts.progress) {
        dashboardCharts.progress.data.labels = labels;
        dashboardCharts.progress.data.datasets[0].data = semGpas;
        dashboardCharts.progress.data.datasets[1].data = cumulative;
        dashboardCharts.progress.update('none');
      }
      toggleChartEmpty('#chartCgpaProgress', '#chartCgpaProgressEmpty', semesters.length === 0);

      var gradeCounts = readGradeCountsForDashboard();
      var gradeOrder = GRADING_SCALE.map(function (g) { return g.grade; });
      var distLabels = gradeOrder.filter(function (g) { return gradeCounts[g]; });
      var distData = distLabels.map(function (g) { return gradeCounts[g]; });

      if (dashboardCharts.distribution) {
        dashboardCharts.distribution.data.labels = distLabels;
        dashboardCharts.distribution.data.datasets[0].data = distData;
        dashboardCharts.distribution.update('none');
      }
      toggleChartEmpty('#chartGradeDistribution', '#chartGradeDistributionEmpty', distLabels.length === 0);
    } else {
      toggleChartEmpty('#chartCgpaProgress', '#chartCgpaProgressEmpty', true);
      toggleChartEmpty('#chartGradeDistribution', '#chartGradeDistributionEmpty', true);
    }

    /* Planner: projected CGPA, clearly labelled as an estimate, combining
       the completed record above with the planned (hypothetical) courses. */
    var plannerCourses = readPlannerCoursesForDashboard();
    var plannerResult = calculateGPA(plannerCourses);
    var projectedEl = $('#planProjected');
    if (projectedEl) {
      if (plannerResult.counted > 0) {
        var combinedCredits = (record.credits || 0) + plannerResult.counted;
        var combinedPoints = (record.points || 0) + plannerResult.points;
        setText(projectedEl, combinedCredits > 0 ? fmt2(combinedPoints / combinedCredits) : '—');
      } else {
        setText(projectedEl, '—');
      }
    }

    if (totalInput) { saveData('dashboard-settings', { totalCredits: totalInput.value }); }

    /* What-if simulator: current vs projected CGPA, using the same
       completed-record fallback logic as the planner above. */
    var whatifCourses = readWhatIfCoursesForDashboard();
    var whatifResult = calculateGPA(whatifCourses);
    var whatifCurrentEl = $('#whatifCurrentCgpa');
    var whatifProjectedEl = $('#whatifProjectedCgpa');
    var whatifDeltaEl = $('#whatifDelta');
    if (whatifCurrentEl && whatifProjectedEl && whatifDeltaEl) {
      var currentCgpaForWhatif = parseNum(record.cgpaText);
      setText(whatifCurrentEl, currentCgpaForWhatif.valid ? fmt2(currentCgpaForWhatif.value) : '—');
      if (whatifResult.counted > 0 && record.credits > 0) {
        var wCombinedCredits = record.credits + whatifResult.counted;
        var wCombinedPoints = record.points + whatifResult.points;
        var wProjected = wCombinedPoints / wCombinedCredits;
        setText(whatifProjectedEl, fmt2(wProjected));
        if (currentCgpaForWhatif.valid) {
          var wDelta = wProjected - currentCgpaForWhatif.value;
          setText(whatifDeltaEl, (wDelta >= 0 ? '+' : '') + fmt2(wDelta));
        } else {
          setText(whatifDeltaEl, '—');
        }
      } else {
        setText(whatifProjectedEl, '—');
        setText(whatifDeltaEl, '—');
      }
    }

    /* Grade improvement simulator: swap one course's grade point for
       another inside the existing completed-credits total. Since it's the
       same course and the same credit count, only the grade-point term
       changes — no double counting of credits. */
    var impOldSelect = $('#impOldGrade');
    var impNewSelect = $('#impNewGrade');
    var impCreditInput = $('#impCredit');
    var impMsgEl = $('#impMsg');
    if (impOldSelect && impNewSelect && impCreditInput) {
      var impCredit = parseNum(impCreditInput.value);
      var oldPoint = impOldSelect.value ? gradePoint(impOldSelect.value) : null;
      var newPoint = impNewSelect.value ? gradePoint(impNewSelect.value) : null;
      var oldPointsEl = $('#impOldPoints');
      var newPointsEl = $('#impNewPoints');
      var deltaEl = $('#impDelta');
      var impProjectedEl = $('#impProjectedCgpa');
      var impCurrentEl = $('#impCurrentCgpa');
      var currentCgpaForImp = parseNum(record.cgpaText);

      setText(impCurrentEl, currentCgpaForImp.valid ? fmt2(currentCgpaForImp.value) : '—');

      if (!impCredit.valid || impCredit.value <= 0) {
        setText(oldPointsEl, '—'); setText(newPointsEl, '—'); setText(deltaEl, '—'); setText(impProjectedEl, '—');
        setText(impMsgEl, impCreditInput.value ? 'Enter a credit value greater than zero.' : '');
      } else if (oldPoint === null || newPoint === null) {
        setText(oldPointsEl, oldPoint === null ? '—' : fmt2(oldPoint * impCredit.value));
        setText(newPointsEl, newPoint === null ? '—' : fmt2(newPoint * impCredit.value));
        setText(deltaEl, '—'); setText(impProjectedEl, '—');
        setText(impMsgEl, 'Pick both a current grade and an improved grade.');
      } else if (!currentCgpaForImp.valid || !(record.credits > 0)) {
        setText(oldPointsEl, fmt2(oldPoint * impCredit.value));
        setText(newPointsEl, fmt2(newPoint * impCredit.value));
        setText(deltaEl, fmt2((newPoint - oldPoint) * impCredit.value));
        setText(impProjectedEl, '—');
        setText(impMsgEl, 'Add your CGPA data above (semester or course method) to see a projected CGPA.');
      } else {
        var oldPts = oldPoint * impCredit.value;
        var newPts = newPoint * impCredit.value;
        setText(oldPointsEl, fmt2(oldPts));
        setText(newPointsEl, fmt2(newPts));
        setText(deltaEl, (newPts - oldPts >= 0 ? '+' : '') + fmt2(newPts - oldPts));
        var afterPoints = record.points - oldPts + newPts;
        setText(impProjectedEl, fmt2(afterPoints / record.credits));
        setText(impMsgEl, '');
      }
    }
  }, 180);

  function initDashboard() {
    var totalInput = $('#dashTotalCredits');
    if (totalInput) {
      var savedSettings = loadData('dashboard-settings', null);
      if (savedSettings && typeof savedSettings === 'object' && savedSettings.totalCredits) {
        totalInput.value = savedSettings.totalCredits;
      }
      totalInput.addEventListener('input', updateDashboard);
    }

    /* Any change anywhere in the calculators can move a dashboard figure,
       so listen broadly and let the debounce keep it cheap. Event bubbling
       guarantees each calculator's own render() has already run by the
       time this reaches the document. */
    document.addEventListener('input', updateDashboard);
    document.addEventListener('change', updateDashboard);

    updateDashboard();
  }

  /* ------------------------------------------------------------------------
     12c. Export / import / print
     ------------------------------------------------------------------------ */

  function collectStoredAcademicData() {
    var data = {};
    if (!storageAvailable) { return data; }
    try {
      for (var i = 0; i < window.localStorage.length; i++) {
        var key = window.localStorage.key(i);
        if (key && key.indexOf(STORAGE_PREFIX) === 0) {
          var shortKey = key.slice(STORAGE_PREFIX.length);
          try { data[shortKey] = JSON.parse(window.localStorage.getItem(key)); }
          catch (err) { /* skip an unreadable entry rather than failing the whole export */ }
        }
      }
    } catch (err) { /* ignore */ }
    return data;
  }

  function exportAcademicData() {
    var payload = {
      app: 'iubat-eee-academic-dashboard',
      version: 1,
      exportedAt: new Date().toISOString(),
      data: collectStoredAcademicData()
    };
    try {
      var blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
      var url = URL.createObjectURL(blob);
      var link = document.createElement('a');
      link.href = url;
      link.download = 'iubat-eee-academic-data.json';
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
      showToast('Academic data exported.', 'success');
    } catch (err) {
      showToast('Could not export data in this browser.', 'error');
    }
  }

  function importAcademicData(file) {
    if (!file) { return; }

    var reader = new FileReader();
    reader.onerror = function () { showToast('Could not read this file.', 'error'); };
    reader.onload = function () {
      var parsed;
      try {
        parsed = JSON.parse(String(reader.result));
      } catch (err) {
        showToast('Invalid file.', 'error');
        return;
      }

      if (!parsed || typeof parsed !== 'object' || !parsed.data || typeof parsed.data !== 'object') {
        showToast('Invalid file.', 'error');
        return;
      }

      var confirmed = window.confirm(
        'Importing will overwrite the academic data currently saved in this browser. Continue?'
      );
      if (!confirmed) { return; }

      try {
        clearAllData();
        Object.keys(parsed.data).forEach(function (key) {
          saveData(key, parsed.data[key]);
        });
        showToast('Data imported successfully.', 'success');
        window.setTimeout(function () { window.location.reload(); }, 500);
      } catch (err) {
        showToast('Could not import this file.', 'error');
      }
    };
    reader.readAsText(file);
  }

  function csvEscape(value) {
    var str = String(value === undefined || value === null ? '' : value);
    if (/[",\n]/.test(str)) { return '"' + str.replace(/"/g, '""') + '"'; }
    return str;
  }

  function tableRowsToCsvLines(tbodySelector, fieldOrder, sectionLabel) {
    var tbody = $(tbodySelector);
    if (!tbody || tbody.rows.length === 0) { return []; }
    var lines = [];
    Array.prototype.slice.call(tbody.rows).forEach(function (row) {
      var record = { section: sectionLabel };
      fieldOrder.forEach(function (field) {
        var el = row.querySelector('[data-field="' + field + '"]');
        record[field] = el ? el.value : '';
      });
      lines.push(['section', 'name', 'code', 'credit', 'gpa', 'grade'].map(function (key) {
        return csvEscape(record[key]);
      }).join(','));
    });
    return lines;
  }

  /* A flat, spreadsheet-friendly export of every course/semester table on the
     page. JSON export (above) is the complete, re-importable backup; this CSV
     is for opening in Excel/Sheets or pasting elsewhere. */
  function exportAcademicDataCsv() {
    var header = 'section,name,code,credit,gpa,grade';
    var lines = [header];

    lines = lines.concat(tableRowsToCsvLines('#gpaRows', ['name', 'code', 'credit', 'grade'], 'GPA calculator'));
    lines = lines.concat(tableRowsToCsvLines('#ccRows', ['name', 'code', 'credit', 'grade'], 'CGPA by course'));
    lines = lines.concat(tableRowsToCsvLines('#planRows', ['name', 'code', 'credit', 'grade'], 'Planner'));
    lines = lines.concat(tableRowsToCsvLines('#semRows', ['name', 'credit', 'gpa'], 'CGPA by semester'));

    if (lines.length <= 1) {
      showToast('Nothing to export yet — add some courses or semesters first.', 'error');
      return;
    }

    try {
      var blob = new Blob([lines.join('\r\n')], { type: 'text/csv;charset=utf-8;' });
      var url = URL.createObjectURL(blob);
      var link = document.createElement('a');
      link.href = url;
      link.download = 'iubat-eee-academic-data.csv';
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
      showToast('Academic data exported as CSV.', 'success');
    } catch (err) {
      showToast('Could not export CSV in this browser.', 'error');
    }
  }

  function initDataTools() {
    var exportBtn = $('#exportData');
    var exportCsvBtn = $('#exportDataCsv');
    var importBtn = $('#importDataBtn');
    var importInput = $('#importDataFile');
    var printBtn = $('#printSummary');

    if (exportBtn) { exportBtn.addEventListener('click', exportAcademicData); }
    if (exportCsvBtn) { exportCsvBtn.addEventListener('click', exportAcademicDataCsv); }
    if (printBtn) { printBtn.addEventListener('click', function () { window.print(); }); }
    if (importBtn && importInput) {
      importBtn.addEventListener('click', function () { importInput.click(); });
      importInput.addEventListener('change', function () {
        var file = importInput.files && importInput.files[0];
        importAcademicData(file);
        importInput.value = '';
      });
    }
  }

  /* ------------------------------------------------------------------------
     13a. PWA — service worker registration
     ------------------------------------------------------------------------
     Registration only; the caching strategy itself lives in
     service-worker.js. Registering from a path relative to the page (not
     "/service-worker.js") keeps this working when the site is served from
     a GitHub Pages project path (username.github.io/repo-name/). Fails
     silently on browsers without support, or when served over plain
     http:// in local testing, since service workers require https or
     localhost. */
  function registerServiceWorker() {
    if (!('serviceWorker' in navigator)) { return; }
    window.addEventListener('load', function () {
      navigator.serviceWorker.register('service-worker.js').catch(function (err) {
        console.warn('Service worker registration skipped:', err.message);
      });
    });
  }

  /* ------------------------------------------------------------------------
     13b. Start
     ------------------------------------------------------------------------ */

  /* Small free-text "which semester is this plan for" field on the Planner.
     Not used in any calculation — purely a label the person sets once (e.g.
     "Summer 2026") so a saved plan stays identifiable. */
  function initPlannerSemesterField() {
    var input = $('#planSemester');
    if (!input) { return { reset: function () {} }; }

    var saved = loadData('planner-semester', '');
    if (typeof saved === 'string') { input.value = saved; }

    input.addEventListener('input', debounce(function () {
      saveData('planner-semester', input.value);
    }, 200));

    return {
      reset: function () {
        input.value = '';
        saveData('planner-semester', '');
      }
    };
  }

  /* ------------------------------------------------------------------------
     10b. Attendance tracker
     ------------------------------------------------------------------------
     Deliberately does not apply any official IUBAT attendance policy — no
     verified threshold was available, so the target percentage is always
     whatever the person types in. Pure arithmetic, nothing assumed.
     ------------------------------------------------------------------------ */

  /* ------------------------------------------------------------------------
     12d. Student profile
     ------------------------------------------------------------------------
     Purely local, editable, and never guessed on the person's behalf:
     student ID, admission year and current semester start out blank. Only
     Program/Department/University get sensible IUBAT EEE defaults, since
     that much is true for anyone using this specific project. */
  var PROFILE_DEFAULTS = {
    name: '',
    id: '',
    program: 'B.Sc. in Electrical & Electronic Engineering',
    department: 'Electrical & Electronic Engineering (EEE)',
    university: 'IUBAT — International University of Business Agriculture and Technology',
    admissionYear: '',
    semester: '',
    gradYear: ''
  };

  function initProfile() {
    var card = $('#profileCard');
    if (!card) { return; }
    var form = $('#profileForm');
    var editBtn = $('#profileEditBtn');
    var cancelBtn = $('#profileCancelBtn');
    var nameDisplay = $('#profileNameDisplay');
    var metaDisplay = $('#profileMetaDisplay');

    var fields = {
      name: $('#profName'), id: $('#profId'), program: $('#profProgram'),
      department: $('#profDept'), university: $('#profUniversity'),
      admissionYear: $('#profAdmissionYear'), semester: $('#profSemester'), gradYear: $('#profGradYear')
    };

    var STORAGE_KEY = 'profile';

    function currentProfile() {
      var saved = loadData(STORAGE_KEY, null);
      var profile = {};
      Object.keys(PROFILE_DEFAULTS).forEach(function (key) {
        profile[key] = (saved && typeof saved[key] === 'string') ? saved[key] : PROFILE_DEFAULTS[key];
      });
      return profile;
    }

    function renderDisplay() {
      var profile = currentProfile();
      setText(nameDisplay, profile.name.trim() ? profile.name.trim() : 'Add your name in Settings');
      var metaParts = [];
      if (profile.program) { metaParts.push(profile.program); }
      if (profile.semester) { metaParts.push('Currently: ' + profile.semester); }
      if (profile.id) { metaParts.push('ID ' + profile.id); }
      setText(metaDisplay, metaParts.length ? metaParts.join(' · ') : 'IUBAT — International University of Business Agriculture and Technology');
    }

    function fillForm() {
      var profile = currentProfile();
      Object.keys(fields).forEach(function (key) {
        if (fields[key]) { fields[key].value = profile[key] || ''; }
      });
    }

    function openForm() {
      fillForm();
      form.hidden = false;
      editBtn.setAttribute('aria-expanded', 'true');
      if (fields.name) { fields.name.focus(); }
    }
    function closeForm() {
      form.hidden = true;
      editBtn.setAttribute('aria-expanded', 'false');
    }

    if (editBtn) {
      editBtn.addEventListener('click', function () {
        if (form.hidden) { openForm(); } else { closeForm(); }
      });
    }
    if (cancelBtn) { cancelBtn.addEventListener('click', closeForm); }

    if (form) {
      form.addEventListener('submit', function (event) {
        event.preventDefault();
        var profile = {};
        Object.keys(fields).forEach(function (key) {
          profile[key] = fields[key] ? fields[key].value.trim() : '';
        });
        saveData(STORAGE_KEY, profile);
        renderDisplay();
        closeForm();
        showToast('Profile saved.', 'success');
      });
    }

    renderDisplay();

    return {
      reset: function () {
        saveData(STORAGE_KEY, PROFILE_DEFAULTS);
        renderDisplay();
        if (!form.hidden) { fillForm(); }
      }
    };
  }

  /* ------------------------------------------------------------------------
     12e. What-if simulator & grade improvement simulator
     ------------------------------------------------------------------------
     Both reuse the shared course-row calculator engine / grade list —
     the What-if table is a createCourseCalculator instance with its own
     storage key, kept entirely separate from the planner and real
     records. The improvement tool has no table of its own: its live
     numbers are computed inside updateDashboard() above (it needs the
     same "completed record" that the dashboard already reads), but the
     grade <select> elements are populated here. */

  function initWhatIfSimulator() {
    return createCourseCalculator({
      key: 'whatif-courses',
      rows: '#whatifRows',
      addBtn: '#whatifAdd',
      resetBtn: '#whatifReset',
      msg: '#whatifMsg',
      value: '#whatifValue',
      counted: '#whatifCounted',
      attempted: '#whatifAttempted',
      points: '#whatifPoints',
      note: '#whatifNote',
      defaultRows: 2,
      gradeLabel: 'Hypothetical grade',
      emptyHint: 'Add a hypothetical course to see the projected GPA.'
    });
  }

  function initGradeImprovementSimulator() {
    var oldSelect = $('#impOldGrade');
    var newSelect = $('#impNewGrade');
    var nameInput = $('#impName');
    var creditInput = $('#impCredit');
    if (!oldSelect || !newSelect) { return { reset: function () {} }; }

    makeGradeSelect(oldSelect);
    makeGradeSelect(newSelect);

    var STORAGE_KEY = 'grade-improvement';

    function persist() {
      saveData(STORAGE_KEY, {
        name: nameInput ? nameInput.value : '',
        credit: creditInput ? creditInput.value : '',
        oldGrade: oldSelect.value,
        newGrade: newSelect.value
      });
    }

    function reset() {
      if (nameInput) { nameInput.value = ''; }
      if (creditInput) { creditInput.value = ''; }
      oldSelect.value = '';
      newSelect.value = '';
      persist();
    }

    var saved = loadData(STORAGE_KEY, null);
    if (saved && typeof saved === 'object') {
      if (nameInput) { nameInput.value = saved.name || ''; }
      if (creditInput) { creditInput.value = saved.credit || ''; }
      oldSelect.value = saved.oldGrade || '';
      newSelect.value = saved.newGrade || '';
    }

    [oldSelect, newSelect, creditInput, nameInput].forEach(function (el) {
      if (el) { el.addEventListener('input', persist); el.addEventListener('change', persist); }
    });

    return { reset: reset };
  }

  /* ------------------------------------------------------------------------
     12f. Academic history
     ------------------------------------------------------------------------
     A course-level record tagged with a semester name (free text, so any
     term including Summer 2026 works). Independent of the GPA/CGPA
     calculators above by design — see the section's own hint text — so a
     person can keep one as their "working" calculator and the other as a
     longer-term log without them needing to match. Semester order for the
     rollup follows entry order in the table (top to bottom), since no
     actual dates are collected anywhere in this app. */

  function initAcademicHistory() {
    var tbody = $('#historyRows');
    var template = $('#tplHistoryRow');
    var addBtn = $('#historyAdd');
    var resetBtn = $('#historyReset');
    var msgEl = $('#historyMsg');
    var searchInput = $('#historySearch');
    var filterSelect = $('#historyFilter');
    var summaryBody = $('#historySummaryRows');
    if (!tbody || !template) { return { reset: function () {} }; }

    var STORAGE_KEY = 'history-records';

    function relabel() {
      Array.prototype.slice.call(tbody.rows).forEach(function (row, index) {
        var n = index + 1;
        var semesterField = row.querySelector('[data-field="semester"]');
        var nameField = row.querySelector('[data-field="name"]');
        var codeField = row.querySelector('[data-field="codeSearch"]');
        var creditField = row.querySelector('[data-field="credit"]');
        var gradeField = row.querySelector('[data-field="grade"]');
        if (semesterField) { semesterField.setAttribute('aria-label', 'Semester, row ' + n); }
        if (nameField) { nameField.setAttribute('aria-label', 'Course name, row ' + n); }
        if (codeField) { codeField.setAttribute('aria-label', 'Search for a course, row ' + n); }
        if (creditField) { creditField.setAttribute('aria-label', 'Credit hours, row ' + n); }
        if (gradeField) { gradeField.setAttribute('aria-label', 'Grade, row ' + n); }
        var removeLabel = row.querySelector('[data-action="remove"] .visually-hidden');
        if (removeLabel) { removeLabel.textContent = 'Remove record ' + n; }
      });
    }

    function addRecord(data) {
      var fragment = template.content.cloneNode(true);
      var row = fragment.querySelector('tr');
      var grade = row.querySelector('[data-field="grade"]');
      makeGradeSelect(grade);

      if (data) {
        var semesterField = row.querySelector('[data-field="semester"]');
        var nameField = row.querySelector('[data-field="name"]');
        var creditField = row.querySelector('[data-field="credit"]');
        if (semesterField) { semesterField.value = data.semester || ''; }
        if (nameField) { nameField.value = data.name || ''; }
        if (creditField) { creditField.value = (data.credit === 0 || data.credit) ? String(data.credit) : ''; }
        grade.value = data.grade || '';
        if (grade.value !== (data.grade || '')) { grade.value = ''; }
        restoreCourseCode(row, data.code || '');
      }

      tbody.appendChild(fragment);
      relabel();
      return row;
    }

    function readRecords() {
      return Array.prototype.slice.call(tbody.rows).map(function (row) {
        return {
          semester: row.querySelector('[data-field="semester"]').value.trim(),
          name: row.querySelector('[data-field="name"]').value.trim(),
          code: row.querySelector('[data-field="code"]').value.trim(),
          credit: row.querySelector('[data-field="credit"]').value,
          grade: row.querySelector('[data-field="grade"]').value
        };
      });
    }

    function persist() {
      var records = readRecords();
      var untouched = records.every(function (r) {
        return !r.semester && !r.name && !r.code && r.credit === '' && !r.grade;
      });
      if (untouched) { clearData(STORAGE_KEY); return; }
      saveData(STORAGE_KEY, records);
    }

    /* Builds the semester filter <select> options from distinct, non-empty
       semester names, in the order they first appear in the table. */
    function refreshFilterOptions() {
      if (!filterSelect) { return; }
      var current = filterSelect.value;
      var seen = {};
      var names = [];
      Array.prototype.slice.call(tbody.rows).forEach(function (row) {
        var value = row.querySelector('[data-field="semester"]').value.trim();
        if (value && !seen[value]) { seen[value] = true; names.push(value); }
      });
      filterSelect.innerHTML = '<option value="">All semesters</option>';
      names.forEach(function (name) {
        var opt = document.createElement('option');
        opt.value = name;
        opt.textContent = name;
        filterSelect.appendChild(opt);
      });
      if (names.indexOf(current) > -1) { filterSelect.value = current; }
    }

    /* Search + semester filter hide rows rather than removing them, so
       editing under a filter never loses data. */
    function applyFilters() {
      var needle = searchInput ? searchInput.value.trim().toLowerCase() : '';
      var semesterWanted = filterSelect ? filterSelect.value : '';
      var visibleCount = 0;
      Array.prototype.slice.call(tbody.rows).forEach(function (row) {
        var name = row.querySelector('[data-field="name"]').value.toLowerCase();
        var code = row.querySelector('[data-field="code"]').value.toLowerCase();
        var semester = row.querySelector('[data-field="semester"]').value;
        var matchesSearch = !needle || name.indexOf(needle) > -1 || code.indexOf(needle) > -1;
        var matchesSemester = !semesterWanted || semester === semesterWanted;
        var visible = matchesSearch && matchesSemester;
        row.hidden = !visible;
        if (visible) { visibleCount++; }
      });
      if (msgEl) {
        setText(msgEl, (needle || semesterWanted) ?
          (visibleCount + (visibleCount === 1 ? ' record matches.' : ' records match.')) : '');
      }
    }

    /* Per-semester rollup: groups valid rows (credit > 0, grade set) by
       semester in table order, computing that semester's GPA the same way
       the GPA calculator does (F/I excluded from both sides), then a
       running cumulative CGPA across semesters in that same order. */
    function renderSummary() {
      if (!summaryBody) { return; }
      var records = readRecords();
      var order = [];
      var bySemester = {};
      records.forEach(function (r) {
        var credit = parseNum(r.credit);
        if (!r.semester || !r.grade || !credit.valid || credit.value <= 0) { return; }
        if (!bySemester[r.semester]) { bySemester[r.semester] = []; order.push(r.semester); }
        bySemester[r.semester].push({ credit: credit.value, grade: r.grade });
      });

      summaryBody.innerHTML = '';
      if (order.length === 0) {
        summaryBody.innerHTML = '<tr><td colspan="5" class="msg msg--hint">Add records above to see semester GPA and cumulative CGPA here.</td></tr>';
        return;
      }

      var runCredits = 0, runPoints = 0;
      order.forEach(function (semesterName) {
        var courses = bySemester[semesterName];
        var result = calculateGPA(courses);
        runCredits += result.counted;
        runPoints += result.points;
        var cumulative = runCredits > 0 ? runPoints / runCredits : null;

        var tr = document.createElement('tr');
        [
          semesterName,
          String(courses.length),
          fmtCredits(result.counted),
          result.counted > 0 ? fmt2(result.points / result.counted) : '—',
          cumulative === null ? '—' : fmt2(cumulative)
        ].forEach(function (text) {
          var td = document.createElement('td');
          td.textContent = text;
          tr.appendChild(td);
        });
        summaryBody.appendChild(tr);
      });
    }

    function render() {
      refreshFilterOptions();
      applyFilters();
      renderSummary();
    }

    function resetHistory() {
      while (tbody.rows.length > 0) { tbody.deleteRow(0); }
      clearData(STORAGE_KEY);
      render();
      if (msgEl) { setText(msgEl, ''); }
    }

    tbody.addEventListener('input', function (event) {
      var target = event.target;
      if (target && target.matches && target.matches('[data-field="codeSearch"]')) {
        handleCourseSearchInput(target);
      }
      render();
      persist();
    });
    tbody.addEventListener('change', function () { render(); persist(); });
    tbody.addEventListener('click', function (event) {
      var button = event.target.closest('[data-action="remove"]');
      if (!button) { return; }
      button.closest('tr').remove();
      relabel();
      render();
      persist();
    });

    if (addBtn) {
      addBtn.addEventListener('click', function () {
        var row = addRecord(null);
        row.hidden = false;
        var field = row.querySelector('[data-field="semester"]');
        if (field) { field.focus(); }
        render();
        persist();
        showToast('Record added.', 'success');
      });
    }
    if (resetBtn) { resetBtn.addEventListener('click', resetHistory); }
    if (searchInput) { searchInput.addEventListener('input', debounce(applyFilters, 120)); }
    if (filterSelect) { filterSelect.addEventListener('change', applyFilters); }

    var saved = loadData(STORAGE_KEY, null);
    if (Array.isArray(saved) && saved.length > 0) {
      saved.slice(0, 200).forEach(function (item) {
        addRecord(item && typeof item === 'object' ? item : null);
      });
    }
    render();

    return { reset: resetHistory };
  }

  function initAttendance() {
    var totalInput = $('#attTotal');
    var attendedInput = $('#attAttended');
    var remainingInput = $('#attRemaining');
    var targetInput = $('#attTarget');
    if (!totalInput || !attendedInput || !remainingInput || !targetInput) { return { reset: function () {} }; }

    var msg = $('#attMsg');
    var currentEl = $('#attCurrent');
    var missedEl = $('#attMissed');
    var neededEl = $('#attNeeded');
    var slackEl = $('#attSlack');
    var noteEl = $('#attNote');
    var STORAGE_KEY = 'attendance';

    function persist() {
      saveData(STORAGE_KEY, {
        total: totalInput.value,
        attended: attendedInput.value,
        remaining: remainingInput.value,
        target: targetInput.value
      });
    }

    function reset() {
      [totalInput, attendedInput, remainingInput, targetInput].forEach(function (el) { el.value = ''; });
      persist();
    }

    var saved = loadData(STORAGE_KEY, null);
    if (saved && typeof saved === 'object') {
      totalInput.value = saved.total || '';
      attendedInput.value = saved.attended || '';
      remainingInput.value = saved.remaining || '';
      targetInput.value = saved.target || '';
    }

    function render() {
      [totalInput, attendedInput, remainingInput, targetInput].forEach(function (el) { el.removeAttribute('aria-invalid'); });
      setText(msg, '');
      noteEl.hidden = true;

      var total = parseNum(totalInput.value);
      var attended = parseNum(attendedInput.value);
      var remaining = parseNum(remainingInput.value);
      var target = parseNum(targetInput.value);

      if (totalInput.value.trim() === '' && attendedInput.value.trim() === '') {
        setText(currentEl, '—'); currentEl.classList.add('is-muted');
        setText(missedEl, '—'); setText(neededEl, '—'); setText(slackEl, '—');
        return;
      }

      if (!total.valid || total.value < 0) { totalInput.setAttribute('aria-invalid', 'true'); setText(msg, 'Enter total classes held as a number, 0 or more.'); return; }
      if (!attended.valid || attended.value < 0) { attendedInput.setAttribute('aria-invalid', 'true'); setText(msg, 'Enter classes attended as a number, 0 or more.'); return; }
      if (attended.value > total.value) { attendedInput.setAttribute('aria-invalid', 'true'); setText(msg, 'Classes attended cannot exceed total classes held.'); return; }
      if (remainingInput.value.trim() !== '' && (!remaining.valid || remaining.value < 0)) { remainingInput.setAttribute('aria-invalid', 'true'); setText(msg, 'Classes remaining must be 0 or more.'); return; }
      if (targetInput.value.trim() !== '' && (!target.valid || target.value <= 0 || target.value > 100)) { targetInput.setAttribute('aria-invalid', 'true'); setText(msg, 'Target attendance must be a percentage between 0 and 100.'); return; }

      var missed = total.value - attended.value;
      var currentPct = total.value > 0 ? (attended.value / total.value) * 100 : 0;

      currentEl.classList.remove('is-muted');
      setText(currentEl, total.value > 0 ? round2(currentPct) + '%' : '—');
      setText(missedEl, fmtCredits(missed));

      var remainingClasses = remaining.valid ? remaining.value : 0;
      var targetPct = target.valid ? target.value : null;

      if (targetPct === null || remainingClasses <= 0) {
        setText(neededEl, '—');
        setText(slackEl, '—');
        if (targetPct === null) {
          noteEl.hidden = false;
          setText(noteEl, 'Enter a target percentage to see how many of your remaining classes you need to attend.');
        }
        return;
      }

      var futureTotal = total.value + remainingClasses;
      var neededAttendedTotal = Math.ceil((targetPct / 100) * futureTotal - 1e-9);
      var neededFromRemaining = neededAttendedTotal - attended.value;

      if (neededFromRemaining <= 0) {
        setText(neededEl, '0 of ' + fmtCredits(remainingClasses));
      } else if (neededFromRemaining > remainingClasses) {
        setText(neededEl, 'Not achievable');
        noteEl.hidden = false;
        setText(noteEl, 'Even attending all ' + fmtCredits(remainingClasses) +
          ' remaining classes would not reach ' + round2(targetPct) + '% attendance.');
      } else {
        setText(neededEl, fmtCredits(neededFromRemaining) + ' of ' + fmtCredits(remainingClasses));
      }

      /* Maximum future absences while still ending at or above the target. */
      var maxAllowedAbsences = Math.floor(attended.value + remainingClasses - (targetPct / 100) * futureTotal + 1e-9);
      maxAllowedAbsences = Math.max(0, Math.min(remainingClasses, maxAllowedAbsences));
      setText(slackEl, fmtCredits(maxAllowedAbsences) + ' of ' + fmtCredits(remainingClasses));
    }

    [totalInput, attendedInput, remainingInput, targetInput].forEach(function (el) {
      el.addEventListener('input', debounce(function () { render(); persist(); }, 120));
    });

    render();
    return { reset: function () { reset(); render(); } };
  }

  function init() {
    initTheme();
    initNav();
    initCommandPalette();
    buildGradeTable();
    initHeroDemo();
    initMarks();
    initTabs();
    initDataTools();
    var profile = initProfile();
    var attendance = initAttendance();
    registerServiceWorker();

    /* The course catalog is fetched once, up front, so every calculator
       and the search datalist can rely on it being ready before any row
       is built or restored from storage. The app still finishes loading
       (with typed/custom courses only) if the fetch fails. */
    loadCourseCatalog().then(function () {
      populateCourseDatalist();
      initCourseCatalogBrowser();
      initPrerequisiteChecker();

      var semesterCGPA = initSemesterCGPA();

      var gpa = createCourseCalculator({
        key: 'gpa-courses',
        rows: '#gpaRows',
        addBtn: '#gpaAdd',
        resetBtn: '#gpaReset',
        msg: '#gpaMsg',
        value: '#gpaValue',
        counted: '#gpaCounted',
        attempted: '#gpaAttempted',
        points: '#gpaPoints',
        note: '#gpaNote',
        defaultRows: 4,
        gradeLabel: 'Grade',
        emptyHint: 'Add at least one course with credit hours and a grade.'
      });

      var courseCGPA = createCourseCalculator({
        key: 'cgpa-courses',
        rows: '#ccRows',
        addBtn: '#ccAdd',
        resetBtn: '#ccReset',
        msg: '#ccMsg',
        value: '#ccValue',
        counted: '#ccCounted',
        attempted: '#ccAttempted',
        points: '#ccPoints',
        note: '#ccNote',
        defaultRows: 4,
        gradeLabel: 'Grade',
        emptyHint: 'Add the courses from every completed semester.'
      });

      var planner = createCourseCalculator({
        key: 'planner-courses',
        rows: '#planRows',
        addBtn: '#planAdd',
        resetBtn: '#planReset',
        msg: '#planMsg',
        value: '#planValue',
        counted: '#planCounted',
        attempted: '#planAttempted',
        points: '#planPoints',
        note: '#planNote',
        defaultRows: 4,
        gradeLabel: 'Expected grade',
        emptyHint: 'Add the courses you plan to take, with the grade you expect.'
      });

      var required = initRequiredGPA();
      var plannerSemesterField = initPlannerSemesterField();
      var whatif = initWhatIfSimulator();
      var improvement = initGradeImprovementSimulator();
      var history = initAcademicHistory();
      initClearAll([gpa, semesterCGPA, courseCGPA, planner, required, plannerSemesterField, attendance, profile, whatif, improvement, history]);
      initDashboard();
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
