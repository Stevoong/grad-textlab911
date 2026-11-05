/* Grad research-model renderer — unified rule set
 * Layout: left→right = IV → mediator(s) → DV.
 * Moderator sits above and points at the moderated path.
 * Controls: muted small boxes at bottom (if stated).
 * Roles use site tokens: IV=navy, mediator=teal, DV=acc blue, moderator=amber.
 * Hypothesis labels (H1…) only when present in the JSON spec (source-backed).
 * type:"path" = causal boxes+arrows; type:"flow" = qualitative procedure steps.
 * Never invent variables/paths — omit diagram when model is null/empty.
 */
(function (global) {
  const ROLE = { iv: 'rm-iv', med: 'rm-med', dv: 'rm-dv', mod: 'rm-mod', ctrl: 'rm-ctrl' };

  function esc(s) {
    return String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  function box(label, role, sub) {
    return `<div class="rm-box ${ROLE[role] || ''}"><span class="rm-lab">${esc(label)}</span>${sub ? `<small>${esc(sub)}</small>` : ''}</div>`;
  }

  function col(items, role) {
    if (!items || !items.length) return '';
    return `<div class="rm-col">${items.map(it => {
      if (typeof it === 'string') return box(it, role);
      return box(it.label || it.name, role, it.sub || it.note || '');
    }).join('')}</div>`;
  }

  function pathArrow(label) {
    return `<div class="rm-arrow" aria-hidden="true"><span class="rm-line"></span>${label ? `<span class="rm-h">${esc(label)}</span>` : ''}<span class="rm-head"></span></div>`;
  }

  function renderPath(model) {
    const iv = model.iv || [];
    const meds = model.mediators || [];
    // mediators may be nested groups (serial mediation columns)
    const medCols = Array.isArray(meds[0]) ? meds : (meds.length ? [meds] : []);
    const dv = model.dv || [];
    const mods = model.moderators || [];
    const ctrls = model.controls || [];
    const paths = model.paths || [];

    // Pick a representative path label between columns when provided
    function edgeLabel(fromRole, toRole) {
      const hit = paths.find(p => (p.fromRole === fromRole && p.toRole === toRole) || p.between === `${fromRole}->${toRole}`);
      return hit ? (hit.label || '') : '';
    }

    let html = '<div class="rm-path">';
    if (mods.length) {
      html += `<div class="rm-mods">${mods.map(m => {
        const lab = typeof m === 'string' ? m : (m.label || m.name);
        const hl = typeof m === 'object' ? (m.hyp || m.label_h || '') : '';
        return `<div class="rm-mod-wrap">${box(lab, 'mod', hl ? String(hl) : '조절변수')}<div class="rm-mod-arrow" aria-hidden="true"></div></div>`;
      }).join('')}</div>`;
    }
    html += '<div class="rm-row">';
    html += col(iv, 'iv');
    if (iv.length && (medCols.length || dv.length)) html += pathArrow(edgeLabel('iv', medCols.length ? 'med' : 'dv') || (paths[0] && paths[0].label) || '');
    medCols.forEach((mc, i) => {
      html += col(mc, 'med');
      const nextIsMed = i < medCols.length - 1;
      html += pathArrow(edgeLabel('med', nextIsMed ? 'med' : 'dv') || '');
    });
    html += col(dv, 'dv');
    html += '</div>';
    if (ctrls.length) {
      html += `<div class="rm-ctrls"><span class="rm-ctrl-k">통제변수</span>${ctrls.map(c => box(typeof c === 'string' ? c : c.label, 'ctrl')).join('')}</div>`;
    }
    if (paths.length) {
      const labeled = paths.filter(p => p.label && (p.from || p.to));
      if (labeled.length) {
        html += `<ul class="rm-paths">${labeled.map(p => `<li><span class="rm-h">${esc(p.label)}</span> ${esc(p.from || '')} → ${esc(p.to || '')}${p.note ? ` <em>${esc(p.note)}</em>` : ''}</li>`).join('')}</ul>`;
      }
    }
    html += '</div>';
    return html;
  }

  function renderFlow(model) {
    const steps = model.steps || [];
    if (!steps.length) return '';
    return `<div class="rm-flow">${steps.map((s, i) => {
      const lab = typeof s === 'string' ? s : (s.label || s.name);
      const note = typeof s === 'object' ? (s.note || '') : '';
      return `${i ? '<div class="rm-flow-arrow" aria-hidden="true"></div>' : ''}<div class="rm-flow-step"><span class="rm-flow-n">${i + 1}</span><span class="rm-lab">${esc(lab)}</span>${note ? `<small>${esc(note)}</small>` : ''}</div>`;
    }).join('')}</div>`;
  }

  function render(model) {
    if (!model || typeof model !== 'object') return '';
    const title = model.title ? `<div class="rm-title">${esc(model.title)}</div>` : '';
    const note = model.note ? `<p class="rm-note">${esc(model.note)}</p>` : '';
    const body = model.type === 'flow' ? renderFlow(model) : renderPath(model);
    if (!body) return '';
    return `<div class="rm">${title}${note}${body}</div>`;
  }

  global.GradResearchModel = { render };
})(typeof window !== 'undefined' ? window : globalThis);
