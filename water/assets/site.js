/* ===========================================================================
   East Valley Soft Water — client script.

   Three jobs, no dependencies:
     1. mobile nav toggle
     2. the quote form (posts to an endpoint if configured; otherwise falls
        back to a pre-filled mailto so a lead is never silently lost)
     3. the install estimator on /pricing/
   =========================================================================== */
(function () {
  'use strict';

  /* --- 1. Nav ----------------------------------------------------------- */
  var toggle = document.querySelector('.nav-toggle');
  var nav = document.querySelector('.nav');
  if (toggle && nav) {
    toggle.addEventListener('click', function () {
      var open = nav.classList.toggle('open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
  }

  /* --- 2. Quote form ---------------------------------------------------- */
  var form = document.getElementById('quote-form');
  if (form) {
    var status = document.getElementById('form-status');
    var endpoint = form.dataset.endpoint || '';
    var fallback = form.dataset.email || '';

    /* Pre-fill the service dropdown from ?job= so service pages and the
       estimator can hand a visitor into the form already halfway done. */
    var params = new URLSearchParams(location.search);
    var preset = params.get('job');
    if (preset) {
      var sel = form.querySelector('[name="service"]');
      if (sel) {
        for (var i = 0; i < sel.options.length; i++) {
          if (sel.options[i].value === preset) { sel.selectedIndex = i; break; }
        }
      }
    }

    var say = function (msg, cls) {
      if (!status) return;
      status.textContent = msg;
      status.className = 'form-status ' + (cls || '');
    };

    var collect = function () {
      var d = {};
      new FormData(form).forEach(function (v, k) { d[k] = v; });
      return d;
    };

    var mailtoFallback = function (d) {
      var lines = Object.keys(d)
        .filter(function (k) { return k !== '_gotcha' && d[k]; })
        .map(function (k) { return k.replace(/_/g, ' ') + ': ' + d[k]; });
      var href = 'mailto:' + fallback +
        '?subject=' + encodeURIComponent('Quote request — ' + (d.city || 'East Valley')) +
        '&body=' + encodeURIComponent(lines.join('\n'));
      location.href = href;
      say('Opening your email app with the details filled in — just hit send. Or call us, we always answer.', 'ok');
    };

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var data = collect();
      if (data._gotcha) return;                    /* honeypot: silent drop */
      if (!data.name || !data.phone) {
        say('We need a name and a phone number to get back to you.', 'err');
        return;
      }
      say('Sending…');

      if (!endpoint) { mailtoFallback(data); return; }

      fetch(endpoint, {
        method: 'POST',
        headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
        .then(function (r) {
          if (!r.ok) throw new Error('bad status');
          form.reset();
          say('Got it. We reply to every request the same business day — usually within the hour.', 'ok');
        })
        .catch(function () { mailtoFallback(data); });
    });
  }

  /* --- 3. Estimator ------------------------------------------------------ */
  var est = document.getElementById('estimator');
  if (est) {
    var out = document.getElementById('est-result');
    var jobs = JSON.parse(est.dataset.jobs || '{}');

    var money = function (n) { return '$' + Math.round(n).toLocaleString('en-US'); };

    var render = function () {
      var jobId = est.querySelector('[name="est-job"]').value;
      var loop = est.querySelector('[name="est-loop"]').value;
      var equip = est.querySelector('[name="est-equip"]').value;

      /* No loop turns a standard softener install into the loop-build job. */
      var id = jobId;
      if (jobId === 'softener-loop' && loop === 'no') id = 'softener-noloop';
      var job = jobs[id];
      if (!job) { out.innerHTML = ''; return; }

      var low = job.low, high = job.high;
      var notes = [job.name + ' · ' + job.hours + ' on site'];

      if (equip && equip !== 'own') {
        var e = jobs.__equipment[equip];
        if (e) { low += e.price; high += e.price; notes.push('Equipment supplied by us: ' + e.name + ' (' + money(e.price) + ')'); }
      } else {
        notes.push('Using equipment you already own — no markup, no brand restriction.');
      }

      var amount = low === high ? money(low) : money(low) + '–' + money(high);
      out.innerHTML =
        '<span class="amount">' + amount + '</span>' +
        '<p class="detail">' + notes.join('<br>') + '</p>' +
        '<p class="detail"><strong>This is an estimate from published rates, not a quote.</strong> ' +
        'Send a photo of the space and we will fix the exact price in writing before anyone drives out.</p>' +
        '<p class="detail"><a class="btn btn-primary" style="margin-top:8px" href="' + est.dataset.quoteUrl + '?job=' + encodeURIComponent(id) + '">Get this price confirmed →</a></p>';
    };

    est.addEventListener('change', render);
    est.addEventListener('input', render);
    render();
  }
})();
