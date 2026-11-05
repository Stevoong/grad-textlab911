/*! GradResearchModel — SVG path overlay for every source hypothesis */
(function (root) {
  'use strict';

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function itemLabel(x) {
    if (x == null) return '';
    if (typeof x === 'string') return x;
    if (typeof x === 'object') return x.label || x.name || x.text || '';
    return String(x);
  }
  function itemSub(x) {
    if (x && typeof x === 'object') return x.sub || x.note || '';
    return '';
  }
  function flat(list) {
    if (!list) return [];
    var out = [];
    (Array.isArray(list) ? list : [list]).forEach(function (x) {
      if (Array.isArray(x)) out = out.concat(flat(x));
      else if (x != null && x !== '') out.push(x);
    });
    return out;
  }

  function norm(s) {
    return String(s || '')
      .toLowerCase()
      .replace(/[\s\-–—_/·•]/g, '')
      .replace(/[()（）\[\]{}「」『』]/g, '')
      .replace(/e-?wom/g, 'ewom');
  }

  var ROLE_KO = {
    iv: '독립변수',
    med: '매개변수',
    dv: '종속변수',
    mod: '조절변수',
    ctrl: '통제변수'
  };

  function rolePill(role) {
    var lab = ROLE_KO[role];
    if (!lab) return '';
    return '<span class="rm-role rm-role-' + role + '">' + esc(lab) + '</span>';
  }

  function roleLegend(roles) {
    if (!roles || !roles.length) return '';
    return '<div class="rm-legend" aria-label="변수 역할">' + roles.map(function (role) {
      return '<span class="rm-leg-item rm-leg-' + role + '"><i class="rm-swatch" aria-hidden="true"></i>' +
        esc(ROLE_KO[role]) + '</span>';
    }).join('') + '</div>';
  }

  function boxHtml(item, role, id) {
    var label = itemLabel(item);
    var sub = itemSub(item);
    return '<div class="rm-box rm-' + role + '" data-rm-id="' + esc(id) + '" data-rm-label="' + esc(label) + '">' +
      '<span class="rm-lab">' + esc(label) + '</span>' +
      (sub ? '<small>' + esc(sub) + '</small>' : '') + '</div>';
  }

  function colHtml(items, role, prefix, withHeader) {
    if (!items.length) return '';
    var head = withHeader ? rolePill(role) : '';
    return '<div class="rm-col rm-col-' + role + '" data-rm-col="' + role + '">' +
      head +
      items.map(function (lab, i) {
        return boxHtml(lab, role, prefix + i);
      }).join('') + '</div>';
  }

  function pathListHtml(paths) {
    if (!paths || !paths.length) return '';
    return '<ul class="rm-paths">' + paths.map(function (p) {
      var note = p.note ? ' <em>(' + esc(p.note) + ')</em>' : '';
      return '<li><span class="rm-h">' + esc(p.label) + '</span>' +
        esc(p.from) + ' → ' + esc(p.to) + note + '</li>';
    }).join('') + '</ul>';
  }

  function renderFlow(m) {
    var steps = m.steps || [];
    if (!steps.length) return '';
    var html = '<div class="rm rm-flow-wrap"><div class="rm-title">' + esc(m.title || '연구 절차') + '</div>';
    if (m.note) html += '<p class="rm-note">' + esc(m.note) + '</p>';
    html += '<div class="rm-flow">';
    steps.forEach(function (st, i) {
      if (i) html += '<div class="rm-flow-arrow" aria-hidden="true"></div>';
      var lab = typeof st === 'string' ? st : (st.label || st.name || '');
      var subTxt = typeof st === 'object' ? itemSub(st) : '';
      var sub = subTxt ? '<small>' + esc(subTxt) + '</small>' : '';
      html += '<div class="rm-flow-step"><span class="rm-flow-n">' + (i + 1) + '</span>' +
        '<span class="rm-lab">' + esc(lab) + '</span>' + sub + '</div>';
    });
    html += '</div></div>';
    return html;
  }

  function renderPath(m) {
    var iv = flat(m.iv);
    var meds = [];
    (m.mediators || []).forEach(function (x) {
      if (Array.isArray(x)) meds.push(flat(x));
      else if (x) meds.push([x]);
    });
    var dv = flat(m.dv);
    var mods = flat(m.moderators || m.moderator);
    var ctrls = flat(m.controls);
    var paths = m.paths || [];

    var html = '<div class="rm rm-path-wrap" data-rm-path="1">';
    html += '<div class="rm-title">' + esc(m.title || '연구 모형') + '</div>';
    if (m.note) html += '<p class="rm-note">' + esc(m.note) + '</p>';

    html += '<p class="rm-scroll-hint" aria-hidden="true">← 좌우로 밀어 연구모형을 보세요 →</p>';
    html += '<div class="rm-diagram">';
    html += '<svg class="rm-svg" aria-hidden="true"></svg>';

    if (mods.length) {
      html += '<div class="rm-mods">' +
        '<div class="rm-mod-wrap">' + rolePill('mod') +
        mods.map(function (lab, i) {
          return boxHtml(lab, 'mod', 'mod' + i);
        }).join('') + '</div></div>';
    }

    html += '<div class="rm-stage">';
    html += colHtml(iv, 'iv', 'iv', true);
    meds.forEach(function (col, mi) {
      /* header on every mediator column — all are 매개변수 in source */
      html += colHtml(col, 'med', 'med' + mi + '_', true);
    });
    html += colHtml(dv, 'dv', 'dv', true);
    html += '</div>';

    if (ctrls.length) {
      html += '<div class="rm-ctrls">' + rolePill('ctrl') +
        ctrls.map(function (lab, i) {
          return boxHtml(lab, 'ctrl', 'ctrl' + i);
        }).join('') + '</div>';
    }
    html += '</div>'; /* diagram */

    var present = [];
    if (iv.length) present.push('iv');
    if (meds.length) present.push('med');
    if (mods.length) present.push('mod');
    if (dv.length) present.push('dv');
    if (ctrls.length) present.push('ctrl');
    html += roleLegend(present);
    html += pathListHtml(paths);
    html += '</div>';

    /* stash model for layout */
    return { html: html, model: m };
  }

  function render(model) {
    if (!model || !model.type) return '';
    if (model.type === 'flow') return renderFlow(model);
    if (model.type === 'path') {
      var r = renderPath(model);
      /* encode model on a wrapper via data attribute for post-layout */
      var payload = esc(JSON.stringify(model));
      return '<div class="rm-host" data-rm-json="' + payload + '">' + r.html + '</div>';
    }
    return '';
  }

  /* ---------- SVG layout ---------- */

  function boxesIn(rootEl) {
    return Array.prototype.slice.call(rootEl.querySelectorAll('.rm-box[data-rm-id]'));
  }

  function findBox(rootEl, name, preferRoles) {
    var n = norm(name);
    if (!n) return null;
    var boxes = boxesIn(rootEl);
    var scored = [];
    boxes.forEach(function (el) {
      var lab = norm(el.getAttribute('data-rm-label'));
      var role = '';
      if (el.classList.contains('rm-iv')) role = 'iv';
      else if (el.classList.contains('rm-med')) role = 'med';
      else if (el.classList.contains('rm-dv')) role = 'dv';
      else if (el.classList.contains('rm-mod')) role = 'mod';
      else if (el.classList.contains('rm-ctrl')) role = 'ctrl';
      var score = 0;
      if (lab === n) score = 100;
      else if (lab.indexOf(n) >= 0 || n.indexOf(lab) >= 0) score = 60;
      else {
        /* token overlap */
        var a = lab, b = n;
        if (a.length >= 2 && b.indexOf(a.slice(0, Math.min(4, a.length))) >= 0) score = 30;
      }
      if (preferRoles && preferRoles.indexOf(role) >= 0) score += 5;
      if (score > 0) scored.push({ el: el, score: score, role: role });
    });
    scored.sort(function (a, b) { return b.score - a.score; });
    return scored.length ? scored[0].el : null;
  }

  function findGroup(rootEl, path, model) {
    if (path.fromGroup === 'iv') {
      return boxesIn(rootEl).filter(function (el) { return el.classList.contains('rm-iv'); });
    }
    var from = String(path.from || '').trim();
    /* exact group labels only — never suffix-match individual IV names like '정보 추구 동기' */
    var GROUP = {
      '이용 동기': 'iv',
      '광고 특성': 'iv',
      '숏폼 콘텐츠 특성': 'iv',
      '숏폼 콘텐츠': 'iv',
      '틱톡 영상 광고 특성': 'iv',
      '틱톡 광고 특성': 'iv'
    };
    if (GROUP[from]) {
      var role = GROUP[from];
      return boxesIn(rootEl).filter(function (el) { return el.classList.contains('rm-' + role); });
    }
    return [];
  }

  function relRect(diagram, el) {
    var d = diagram.getBoundingClientRect();
    var r = el.getBoundingClientRect();
    return {
      left: r.left - d.left,
      top: r.top - d.top,
      right: r.right - d.left,
      bottom: r.bottom - d.top,
      width: r.width,
      height: r.height,
      cx: r.left - d.left + r.width / 2,
      cy: r.top - d.top + r.height / 2
    };
  }

  function sidePoint(r, towardX) {
    if (towardX >= r.cx) return { x: r.right, y: r.cy };
    return { x: r.left, y: r.cy };
  }

  function midpoint(a, b) {
    return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
  }

  function placeLabels(candidates, minDist) {
    /* estimate mono width ~6px/char at 10px; greedy 2D deconflict */
    minDist = minDist || 12;
    function approxW(lab) { return Math.max(18, String(lab).length * 6.2); }
    var placed = candidates.map(function (c) {
      return { x: c.x, y: c.y, label: c.label, color: c.color, key: c.key, w: approxW(c.label), h: 12 };
    });
    placed.sort(function (a, b) { return a.y - b.y || a.x - b.x; });
    for (var pass = 0; pass < 8; pass++) {
      for (var i = 0; i < placed.length; i++) {
        for (var j = i + 1; j < placed.length; j++) {
          var a = placed[i], b = placed[j];
          var ax0 = a.x - a.w / 2, ax1 = a.x + a.w / 2;
          var bx0 = b.x - b.w / 2, bx1 = b.x + b.w / 2;
          var ay0 = a.y - a.h / 2, ay1 = a.y + a.h / 2;
          var by0 = b.y - b.h / 2, by1 = b.y + b.h / 2;
          if (ax0 < bx1 + 2 && ax1 + 2 > bx0 && ay0 < by1 + 2 && ay1 + 2 > by0) {
            /* push apart vertically primarily, then horizontally */
            var gapY = (a.h + b.h) / 2 + minDist - Math.abs(a.y - b.y);
            if (gapY > 0) {
              if (b.y >= a.y) b.y += gapY / 2 + 1;
              else a.y += gapY / 2 + 1;
            }
            var overlapX = Math.min(ax1, bx1) - Math.max(ax0, bx0);
            if (overlapX > a.w * 0.4) {
              if (b.x >= a.x) b.x += 6;
              else a.x += 6;
            }
          }
        }
      }
    }
    return placed;
  }

  function arrowMarker(svg, id, color) {
    var defs = svg.querySelector('defs') || svg.appendChild(document.createElementNS('http://www.w3.org/2000/svg', 'defs'));
    if (defs.querySelector('#' + id)) return;
    var m = document.createElementNS('http://www.w3.org/2000/svg', 'marker');
    m.setAttribute('id', id);
    m.setAttribute('markerWidth', '8');
    m.setAttribute('markerHeight', '8');
    m.setAttribute('refX', '6');
    m.setAttribute('refY', '3');
    m.setAttribute('orient', 'auto');
    m.setAttribute('markerUnits', 'strokeWidth');
    var p = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    p.setAttribute('d', 'M0,0 L6,3 L0,6 Z');
    p.setAttribute('fill', color);
    m.appendChild(p);
    defs.appendChild(m);
  }

  function layoutOne(host) {
    var diagram = host.querySelector('.rm-diagram');
    var svg = host.querySelector('.rm-svg');
    if (!diagram || !svg) return { drawn: 0, labels: [] };
    var raw = host.getAttribute('data-rm-json');
    var model;
    try { model = JSON.parse(raw); } catch (e) { return { drawn: 0, labels: [] }; }

    host.classList.remove('rm-mobile');
    svg.style.display = '';

    var w = diagram.clientWidth;
    var h = diagram.clientHeight;
    if (w < 40 || h < 40) return { drawn: 0, labels: [] };
    svg.setAttribute('width', w);
    svg.setAttribute('height', h);
    svg.setAttribute('viewBox', '0 0 ' + w + ' ' + h);
    svg.innerHTML = '';

    arrowMarker(svg, 'rm-ah', '#3d4a5c');
    arrowMarker(svg, 'rm-ah-acc', '#2440d8');
    arrowMarker(svg, 'rm-ah-amber', '#9a6b12');
    arrowMarker(svg, 'rm-ah-teal', '#0f766e');

    var paths = model.paths || [];
    var labelCands = [];
    var drawn = 0;
    var arcSlot = { above: 0, below: 0, dashAbove: 0, dashBelow: 0 };

    paths.forEach(function (p, pi) {
      if (p.moderator || p.moderates) {
        /* moderator dashed amber to moderated path midpoint */
        var modBox = findBox(diagram, p.from, ['mod']) || diagram.querySelector('.rm-mod');
        var aName = (p.moderates && p.moderates[0]) || '';
        var bName = (p.moderates && p.moderates[1]) || '';
        var aEl = findBox(diagram, aName, ['iv', 'med']);
        var bEl = findBox(diagram, bName, ['med', 'dv']);
        if (!modBox || !aEl || !bEl) {
          /* fallback: tip of first IV→first med */
          aEl = aEl || diagram.querySelector('.rm-iv');
          bEl = bEl || diagram.querySelector('.rm-med');
        }
        if (!modBox || !aEl || !bEl) return;
        var mr = relRect(diagram, modBox);
        var ar = relRect(diagram, aEl);
        var br = relRect(diagram, bEl);
        var mid = { x: (ar.right + br.left) / 2, y: (ar.cy + br.cy) / 2 };
        var start = { x: mr.cx, y: mr.bottom };
        var pathEl = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        var cpx = (start.x + mid.x) / 2;
        var cpy = (start.y + mid.y) / 2;
        pathEl.setAttribute('d', 'M' + start.x + ',' + start.y + ' Q' + cpx + ',' + cpy + ' ' + mid.x + ',' + mid.y);
        pathEl.setAttribute('fill', 'none');
        pathEl.setAttribute('stroke', '#9a6b12');
        pathEl.setAttribute('stroke-width', '1.6');
        pathEl.setAttribute('stroke-dasharray', '5 4');
        pathEl.setAttribute('marker-end', 'url(#rm-ah-amber)');
        svg.appendChild(pathEl);
        labelCands.push({ x: (start.x + mid.x) / 2 + 8, y: (start.y + mid.y) / 2 - 4, label: p.label, color: '#9a6b12', key: p.label + ':' + pi });
        drawn++;
        return;
      }

      var style = p.style || '';
      var isArc = style === 'arc' || style === 'arc-dash';
      var isDash = style === 'arc-dash' || style === 'dash';
      var fromBoxes = [];
      if (p.fromGroup || findGroup(diagram, p, model).length) {
        fromBoxes = findGroup(diagram, p, model);
      }
      if (!fromBoxes.length) {
        var fb = findBox(diagram, p.from, ['iv', 'med', 'mod']);
        if (fb) fromBoxes = [fb];
      }
      var toBox = findBox(diagram, p.to, ['med', 'dv', 'iv']);
      if (!fromBoxes.length || !toBox) return;

      /* group bracket: one arrow from vertical midpoint of group to target */
      if (fromBoxes.length > 1 && (p.fromGroup || isArc && isDash)) {
        var rs = fromBoxes.map(function (el) { return relRect(diagram, el); });
        var top = Math.min.apply(null, rs.map(function (r) { return r.top; }));
        var bot = Math.max.apply(null, rs.map(function (r) { return r.bottom; }));
        var right = Math.max.apply(null, rs.map(function (r) { return r.right; }));
        var left = Math.min.apply(null, rs.map(function (r) { return r.left; }));
        var tr = relRect(diagram, toBox);
        var start = { x: right, y: (top + bot) / 2 };
        var end = sidePoint(tr, start.x);
        /* bracket stem */
        var bracket = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        bracket.setAttribute('d',
          'M' + right + ',' + top + ' L' + (right + 10) + ',' + top +
          ' L' + (right + 10) + ',' + bot + ' L' + right + ',' + bot);
        bracket.setAttribute('fill', 'none');
        bracket.setAttribute('stroke', isDash ? '#2440d8' : '#3d4a5c');
        bracket.setAttribute('stroke-width', '1.4');
        if (isDash) bracket.setAttribute('stroke-dasharray', '5 4');
        svg.appendChild(bracket);
        var start2 = { x: right + 10, y: (top + bot) / 2 };
        var bulge = isArc ? (arcSlot.dashBelow++ % 2 === 0 ? 36 + arcSlot.dashBelow * 10 : -(36 + arcSlot.dashBelow * 10)) : 0;
        var pathEl = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        if (isArc) {
          var mx = (start2.x + end.x) / 2;
          var my = (start2.y + end.y) / 2 + bulge;
          pathEl.setAttribute('d', 'M' + start2.x + ',' + start2.y + ' Q' + mx + ',' + my + ' ' + end.x + ',' + end.y);
        } else {
          pathEl.setAttribute('d', 'M' + start2.x + ',' + start2.y + ' L' + end.x + ',' + end.y);
        }
        pathEl.setAttribute('fill', 'none');
        pathEl.setAttribute('stroke', isDash ? '#2440d8' : '#3d4a5c');
        pathEl.setAttribute('stroke-width', '1.5');
        if (isDash) pathEl.setAttribute('stroke-dasharray', '5 4');
        pathEl.setAttribute('marker-end', 'url(#rm-ah-acc)');
        svg.appendChild(pathEl);
        var mid = isArc
          ? { x: mx, y: my - (bulge > 0 ? 8 : -8) }
          : midpoint(start2, end);
        labelCands.push({ x: mid.x, y: mid.y - 6, label: p.label, color: '#2440d8', key: p.label + ':' + pi });
        drawn++;
        return;
      }

      fromBoxes.forEach(function (fromBox, fi) {
        var fr = relRect(diagram, fromBox);
        var tr = relRect(diagram, toBox);
        var start = sidePoint(fr, tr.cx);
        var end = sidePoint(tr, fr.cx);
        /* keep endpoints slightly inset so arrowhead clears box */
        if (start.x < end.x) { start.x += 1; end.x -= 2; }
        else { start.x -= 1; end.x += 2; }

        var pathEl = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        var mid;
        if (isArc) {
          var slot = isDash ? arcSlot.dashBelow++ : arcSlot.above++;
          var sign = isDash ? 1 : -1;
          var mag = (isDash ? 40 : 36) + slot * 22;
          var mx = (start.x + end.x) / 2;
          var my = (start.y + end.y) / 2 + sign * mag;
          pathEl.setAttribute('d', 'M' + start.x + ',' + start.y + ' Q' + mx + ',' + my + ' ' + end.x + ',' + end.y);
          /* spread labels along arc: shift x by slot so H1a–d don't stack */
          var lx = mx + (slot - 1.5) * 22;
          mid = { x: lx, y: my + (sign < 0 ? -10 : 12) };
        } else {
          var t = 0.35 + (pi % 5) * 0.08;
          if (fromBoxes.length > 1) t = 0.35 + fi * 0.12;
          start.y += 0;
          end.y += 0;
          pathEl.setAttribute('d', 'M' + start.x + ',' + start.y + ' L' + end.x + ',' + end.y);
          mid = {
            x: start.x + (end.x - start.x) * t,
            y: start.y + (end.y - start.y) * t - 9
          };
        }
        pathEl.setAttribute('fill', 'none');
        var stroke = isDash ? '#2440d8' : '#3d4a5c';
        pathEl.setAttribute('stroke', stroke);
        pathEl.setAttribute('stroke-width', '1.5');
        if (isDash) pathEl.setAttribute('stroke-dasharray', '5 4');
        pathEl.setAttribute('marker-end', isDash ? 'url(#rm-ah-acc)' : 'url(#rm-ah)');
        pathEl.setAttribute('opacity', '0.85');
        svg.appendChild(pathEl);

        var lab = p.label;
        /* if multiple fromBoxes sharing one label (shouldn't for expanded), keep label once for group */
        if (fromBoxes.length > 1 && !p.fromGroup) {
          /* each gets same label only if label is shared like 직접경로 — still draw once per arrow */
        }
        labelCands.push({
          x: mid.x,
          y: mid.y,
          label: lab,
          color: isDash ? '#2440d8' : '#2440d8',
          key: lab + ':' + pi + ':' + fi
        });
        drawn++;
      });
    });

    var placed = placeLabels(labelCands, 13);
    placed.forEach(function (L) {
      var t = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      t.setAttribute('x', L.x);
      t.setAttribute('y', L.y);
      t.setAttribute('text-anchor', 'middle');
      t.setAttribute('class', 'rm-svg-h');
      t.setAttribute('fill', L.color || '#2440d8');
      t.textContent = L.label;
      svg.appendChild(t);
    });

    svg.setAttribute('overflow', 'visible');

    /* Expand diagram padding so arcs/H-labels never clip the SVG viewBox */
    try {
      var bb = svg.getBBox();
      var pad = 14;
      var needTop = Math.max(0, pad - bb.y);
      var needBot = Math.max(0, (bb.y + bb.height + pad) - h);
      var needLeft = Math.max(0, pad - bb.x);
      var needRight = Math.max(0, (bb.x + bb.width + pad) - w);
      var stage = diagram.querySelector('.rm-stage');
      if (stage) {
        var needW = Math.ceil(stage.scrollWidth + 24);
        if (needW > (parseInt(diagram.style.minWidth, 10) || 0) && needW > 560) {
          diagram.style.minWidth = needW + 'px';
        }
      }
      if ((needTop > 0.5 || needBot > 0.5 || needLeft > 0.5 || needRight > 0.5) &&
          host.getAttribute('data-rm-fit') !== '1') {
        host.setAttribute('data-rm-fit', '1');
        var cs = window.getComputedStyle(diagram);
        diagram.style.paddingTop = (parseFloat(cs.paddingTop) || 0) + needTop + 'px';
        diagram.style.paddingBottom = (parseFloat(cs.paddingBottom) || 0) + needBot + 'px';
        diagram.style.paddingLeft = (parseFloat(cs.paddingLeft) || 0) + needLeft + 'px';
        diagram.style.paddingRight = (parseFloat(cs.paddingRight) || 0) + needRight + 'px';
        return layoutOne(host);
      }
    } catch (e) { /* getBBox can throw if not rendered */ }
    host.removeAttribute('data-rm-fit');

    return { drawn: drawn, labels: placed.map(function (L) { return L.label; }) };
  }

  function layoutAll() {
    var hosts = document.querySelectorAll('.rm-host[data-rm-json]');
    var report = [];
    hosts.forEach(function (h) {
      h.removeAttribute('data-rm-fit');
      var diagram = h.querySelector('.rm-diagram');
      if (diagram) {
        diagram.style.paddingTop = '';
        diagram.style.paddingBottom = '';
        diagram.style.paddingLeft = '';
        diagram.style.paddingRight = '';
        /* keep minWidth if content needs it — cleared then recomputed */
        diagram.style.minWidth = '';
      }
      report.push(layoutOne(h));
    });
    return report;
  }

  var resizeTimer;
  function onResize() {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(layoutAll, 80);
  }

  function boot() {
    layoutAll();
    window.addEventListener('resize', onResize);
    /* re-layout after fonts / late images */
    setTimeout(layoutAll, 200);
    setTimeout(layoutAll, 800);
  }

  /* Patch: theses.html calls GradResearchModel.render inside row(); after render() sets innerHTML, layout */
  var _origRender = null;
  function afterDomPaint() {
    requestAnimationFrame(function () { layoutAll(); });
  }

  root.GradResearchModel = {
    render: render,
    layout: layoutAll,
    layoutOne: layoutOne,
    boot: boot
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

  /* observe #out mutations from theses.html render() */
  function watch() {
    var out = document.getElementById('out');
    if (!out || typeof MutationObserver === 'undefined') return;
    var mo = new MutationObserver(function () { afterDomPaint(); });
    mo.observe(out, { childList: true, subtree: false });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', watch);
  else watch();
})(typeof window !== 'undefined' ? window : this);
