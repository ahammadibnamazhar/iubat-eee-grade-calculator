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
     Transcribed from the student's own IUBAT course list (course code, name
     and credit hours). Two corrections were made on the student's direct
     confirmation of their own program: that document printed ENG 101 and
     ENG 102 as 2 credit hours each; they are 4 and 3 respectively. Everything
     else here is reproduced as the source document listed it.

     Courses with 0 credit hours (workshops, tool certifications) are kept
     selectable — they carry no weight in a GPA either way.
     ------------------------------------------------------------------------ */

  var COURSE_CATALOG = [
    { group: 'Personal & career development', courses: [
      { code: 'APSY 101', name: 'Creating Healthy Relationships: Love & Intimacy', credit: 0 },
      { code: 'APSY 102', name: 'Stress Management', credit: 0 },
      { code: 'ART 102',  name: 'Educational Planning', credit: 1 },
      { code: 'ART 202',  name: 'Career Planning and Development-I', credit: 1 },
      { code: 'ART 203',  name: 'Career Planning and Development-II', credit: 1 },
      { code: 'ART 204',  name: 'Modern Living', credit: 2 }
    ]},
    { group: 'English', courses: [
      { code: 'ELP 005', name: 'Advanced Spoken English', credit: 1 },
      { code: 'ENG 101', name: 'Basic English Composition', credit: 4 },
      { code: 'ENG 102', name: 'English Comprehensions and Speaking', credit: 3 },
      { code: 'ENG 203', name: 'Advanced English Composition', credit: 2 },
      { code: 'ENG 250', name: 'Public Speaking', credit: 2 }
    ]},
    { group: 'Mathematics & statistics', courses: [
      { code: 'MAT 147', name: 'Applied Calculus', credit: 3 },
      { code: 'MAT 167', name: 'Calculus I', credit: 3 },
      { code: 'MAT 197', name: 'Calculus II', credit: 3 },
      { code: 'MAT 219', name: 'Linear Algebra', credit: 2 },
      { code: 'MAT 237', name: 'Calculus III', credit: 3 },
      { code: 'MAT 247', name: 'Numerical Analysis', credit: 3 },
      { code: 'STA 240', name: 'Statistics', credit: 3 }
    ]},
    { group: 'Physics & chemistry', courses: [
      { code: 'CHM 115', name: 'General Chemistry', credit: 3 },
      { code: 'CHM 116', name: 'Chemistry Lab', credit: 1 },
      { code: 'PHY 111', name: 'Physics', credit: 3 },
      { code: 'PHY 112', name: 'Physics Lab', credit: 1 },
      { code: 'PHY 121', name: 'Advanced Physics', credit: 3 }
    ]},
    { group: 'Computer science', courses: [
      { code: 'CSC 103', name: 'Fundamentals of Computers and Applications', credit: 3 },
      { code: 'CSC 104', name: 'Computer Applications Lab', credit: 1 },
      { code: 'CSC 183', name: 'Programming C', credit: 3 },
      { code: 'CSC 184', name: 'Programming C Lab', credit: 1 }
    ]},
    { group: 'Economics, psychology & humanities', courses: [
      { code: 'ECO 101', name: 'Principles of Micro Economics', credit: 3 },
      { code: 'ENV 103', name: 'Environmental Science', credit: 2 },
      { code: 'PHI 114', name: 'Introduction to Philosophy', credit: 3 },
      { code: 'PSY 105', name: 'General Psychology', credit: 3 }
    ]},
    { group: 'General engineering', courses: [
      { code: 'CEN 120', name: 'Civil Engineering Drawing', credit: 1 },
      { code: 'MEC 173', name: 'Introduction to Mechanical Engineering', credit: 3 }
    ]},
    { group: 'Electrical & Electronic Engineering (EEN)', courses: [
      { code: 'EEN 183', name: 'Circuit Analysis', credit: 3 },
      { code: 'EEN 184', name: 'Circuit Lab I', credit: 1 },
      { code: 'EEN 215', name: 'Engineering Ethics', credit: 1 },
      { code: 'EEN 225', name: 'Circuit Analysis II', credit: 3 },
      { code: 'EEN 226', name: 'Circuit Analysis II Lab', credit: 1 },
      { code: 'EEN 257', name: 'Electrical Machines I', credit: 3 },
      { code: 'EEN 258', name: 'Electrical Machines I Practice', credit: 1 },
      { code: 'EEN 265', name: 'Electronic Analysis and Design I', credit: 3 },
      { code: 'EEN 266', name: 'Electronic I Lab', credit: 1 },
      { code: 'EEN 275', name: 'Electric and Magnetic Fields', credit: 3 },
      { code: 'EEN 287', name: 'Electrical Machines II', credit: 3 },
      { code: 'EEN 288', name: 'Electrical Machines II Practice', credit: 1 },
      { code: 'EEN 303', name: 'Linear Circuits and Systems', credit: 3 },
      { code: 'EEN 315', name: 'Electronic Analysis and Design II', credit: 3 },
      { code: 'EEN 316', name: 'Electronic Analysis and Design II Lab', credit: 1 },
      { code: 'EEN 329', name: 'Digital Logic Design', credit: 3 },
      { code: 'EEN 330', name: 'Digital Logic Lab', credit: 1 },
      { code: 'EEN 347', name: 'Electrical Properties of Material', credit: 2 },
      { code: 'EEN 348', name: 'Electrical Wiring and Estimation', credit: 1 },
      { code: 'EEN 361', name: 'Power Transmission and Distribution', credit: 3 },
      { code: 'EEN 373', name: 'Microprocessor Systems and Interfacing', credit: 3 },
      { code: 'EEN 374', name: 'Microprocessor Interfacing Lab', credit: 1 },
      { code: 'EEN 403', name: 'Digital Signal Processing', credit: 3 },
      { code: 'EEN 404', name: 'Digital Signal Processing Lab', credit: 1 },
      { code: 'EEN 405', name: 'Industrial Electronics', credit: 3 },
      { code: 'EEN 406', name: 'Industrial Electronics Lab', credit: 1 },
      { code: 'EEN 407', name: 'Feedback System Analysis and Design', credit: 3 },
      { code: 'EEN 408', name: 'Feedback System Lab', credit: 1 },
      { code: 'EEN 413', name: 'Project Evaluation, Planning and Management', credit: 3 },
      { code: 'EEN 431', name: 'Transmission of Information', credit: 3 },
      { code: 'EEN 432', name: 'Communications Practice', credit: 1 },
      { code: 'EEN 441', name: 'Measurement and Instrumentation', credit: 3 },
      { code: 'EEN 442', name: 'Measurement and Instrumentation Lab', credit: 1 },
      { code: 'EEN 453', name: 'Power System Analysis', credit: 3 },
      { code: 'EEN 454', name: 'Power System Analysis Practice', credit: 1 },
      { code: 'EEN 455', name: 'Power Stations', credit: 3 },
      { code: 'EEN 463', name: 'Switchgear and Protective Relays', credit: 3 },
      { code: 'EEN 464', name: 'Switchgear and Protective Relays Lab', credit: 1 },
      { code: 'EEN 471', name: 'Digital and Satellite Communication Engineering', credit: 3 },
      { code: 'EEN 472', name: 'Digital and Satellite Communication Lab', credit: 1 },
      { code: 'EEN 483', name: 'VLSI', credit: 3 },
      { code: 'EEN 484', name: 'VLSI Lab', credit: 1 },
      { code: 'EEN 487', name: 'Biomedical Electronics', credit: 3 },
      { code: 'EEN 488', name: 'Thesis', credit: 3 },
      { code: 'EEN 490', name: 'Practicum', credit: 6 }
    ]},
    { group: 'Software & tool certifications', courses: [
      { code: 'AutoCAD', name: 'AutoCAD', credit: 0 },
      { code: 'GIS',     name: 'GIS', credit: 0 },
      { code: 'PDNA',    name: 'Power Distribution Network Analysis', credit: 0 },
      { code: 'PSNA',    name: 'Power System Network Analysis', credit: 0 },
      { code: 'SW',      name: 'SolidWorks', credit: 0 }
    ]}
  ];

  /* Flat lookup: course code -> { code, name, credit }. */
  var COURSE_CATALOG_BY_CODE = {};
  COURSE_CATALOG.forEach(function (group) {
    group.courses.forEach(function (course) {
      COURSE_CATALOG_BY_CODE[course.code] = course;
    });
  });

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

  /* Populates a <select data-field="code"> with the course catalog, grouped
     by subject area, plus a placeholder and a "custom" escape hatch for a
     course that isn't in the list. */
  function makeCourseSelect(select) {
    var placeholder = document.createElement('option');
    placeholder.value = '';
    placeholder.textContent = 'Course code';
    select.appendChild(placeholder);

    var custom = document.createElement('option');
    custom.value = '__custom__';
    custom.textContent = '✎ Custom / not in the list';
    select.appendChild(custom);

    COURSE_CATALOG.forEach(function (group) {
      var optgroup = document.createElement('optgroup');
      optgroup.label = group.group;
      group.courses.forEach(function (course) {
        var opt = document.createElement('option');
        opt.value = course.code;
        opt.textContent = course.code + ' — ' + course.name +
          ' (' + course.credit + (course.credit === 1 ? ' credit' : ' credits') + ')';
        optgroup.appendChild(opt);
      });
      select.appendChild(optgroup);
    });
  }

  /* Swaps the course-code <select> for a plain text input, so a course that
     isn't in the catalog can still be typed in. Works whether or not the
     select is attached to the document yet. Returns the new input. */
  function swapCodeToCustomInput(select, value) {
    var input = document.createElement('input');
    input.type = 'text';
    input.className = select.className;
    input.setAttribute('data-field', 'code');
    input.setAttribute('placeholder', 'Type a course code');
    input.setAttribute('autocomplete', 'off');
    var label = select.getAttribute('aria-label');
    if (label) { input.setAttribute('aria-label', label); }
    input.value = value || '';
    select.replaceWith(input);
    return input;
  }

  /* When a catalog course is chosen, fill in its name and credit hours —
     the person can still edit either afterward. Choosing "custom" swaps in
     a free-text field instead of guessing at an unlisted course's details. */
  function handleCourseCodeChange(select) {
    var value = select.value;

    if (value === '__custom__') {
      swapCodeToCustomInput(select, '').focus();
      return;
    }

    var course = COURSE_CATALOG_BY_CODE[value];
    if (!course) { return; }

    var row = select.closest('tr');
    var nameInput = row && row.querySelector('[data-field="name"]');
    var creditInput = row && row.querySelector('[data-field="credit"]');
    if (nameInput) { nameInput.value = course.name; }
    if (creditInput) { creditInput.value = String(course.credit); }
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
        row.querySelector('[data-field="code"]').setAttribute('aria-label', 'Course code, row ' + n);
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

      var codeSelect = row.querySelector('[data-field="code"]');
      makeCourseSelect(codeSelect);

      var nameInput = row.querySelector('[data-field="name"]');
      var creditInput = row.querySelector('[data-field="credit"]');

      if (data) {
        nameInput.value = data.name || '';
        creditInput.value = (data.credit === 0 || data.credit) ? String(data.credit) : '';
        select.value = data.grade || '';
        if (select.value !== (data.grade || '')) { select.value = ''; }

        var savedCode = data.code || '';
        if (savedCode && COURSE_CATALOG_BY_CODE[savedCode]) {
          codeSelect.value = savedCode;
        } else if (savedCode) {
          /* A code that predates the catalog, or one typed as custom. */
          swapCodeToCustomInput(codeSelect, savedCode);
        }
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

    tbody.addEventListener('input', function () { render(); persist(); });
    tbody.addEventListener('change', function (event) {
      var target = event.target;
      if (target && target.tagName === 'SELECT' && target.matches('[data-field="code"]')) {
        handleCourseCodeChange(target);
      }
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
      setText(msg, 'All saved data has been erased from this browser.');
      window.setTimeout(function () { setText(msg, ''); }, 6000);
    });
  }

  /* ------------------------------------------------------------------------
     13. Start
     ------------------------------------------------------------------------ */

  function init() {
    initTheme();
    initNav();
    buildGradeTable();
    initHeroDemo();
    initMarks();
    initTabs();
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
    initClearAll([gpa, semesterCGPA, courseCGPA, planner, required]);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
