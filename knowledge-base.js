/* ============================================================
   SITE ASSISTANT WIDGET
   ============================================================
   Floating chat bubble. Pure client-side keyword search against
   SITE_KB (see knowledge-base.js) — no external calls, no API
   key, nothing that can be stolen from view-source. If nothing
   scores well enough, it points the person to ASSIST.
   ============================================================ */

(function(){
  const STOPWORDS = new Set(['the','a','an','is','are','do','i','my','to','for','of','in','on','how','what','when','where','who','why','can','does','it','and','or','be','if','me','you','your','this','that','with','from','need','should']);

  function tokenize(str){
    return (str.toLowerCase().match(/[a-z0-9]+/g) || []).filter(w => !STOPWORDS.has(w) && w.length > 1);
  }

  function score(queryTokens, entry){
    const haystack = tokenize(entry.q + ' ' + entry.a + ' ' + (entry.keywords||''));
    const haystackSet = new Set(haystack);
    let s = 0;
    queryTokens.forEach(t=>{
      if(haystackSet.has(t)) s += 2;
      else if(haystack.some(h => h.includes(t) || t.includes(h))) s += 1;
    });
    return s;
  }

  function search(query){
    const qTokens = tokenize(query);
    if(qTokens.length === 0) return [];
    const scored = SITE_KB.map(e => ({entry:e, s:score(qTokens, e)}))
      .filter(x => x.s > 0)
      .sort((a,b) => b.s - a.s);
    return scored;
  }

  const ASSIST_MSG = `I couldn't find a confident answer to that in the SOP, FAQ, or training materials. Please open an <b>ASSIST ticket with Operations</b> (search "Debtor Management" or "Accounts Receivable" as the category) so the team can help directly.`;

  const SUGGESTIONS = [
    "Payment timeframes",
    "Doubtful debt approval thresholds",
    "5 steps of bank reconciliation",
    "Invoice adjustment lock period",
  ];

  function injectStyles(){
    const css = `
    .sa-bubble{position:fixed;bottom:22px;right:22px;width:58px;height:58px;border-radius:50%;background:#1B4F8C;color:#fff;display:flex;align-items:center;justify-content:center;font-size:1.5rem;cursor:pointer;box-shadow:0 4px 16px rgba(0,0,0,.25);z-index:9999;border:none;transition:transform .15s;}
    .sa-bubble:hover{transform:scale(1.06);}
    .sa-panel{position:fixed;bottom:92px;right:22px;width:360px;max-width:calc(100vw - 32px);height:480px;max-height:calc(100vh - 130px);background:#fff;border-radius:12px;box-shadow:0 10px 40px rgba(0,0,0,.28);z-index:9999;display:none;flex-direction:column;overflow:hidden;font-family:'Segoe UI',Arial,sans-serif;}
    .sa-panel.open{display:flex;}
    .sa-head{background:#1B4F8C;color:#fff;padding:14px 16px;border-left:5px solid #028090;}
    .sa-head h4{font-size:.92rem;margin-bottom:2px;}
    .sa-head p{font-size:.72rem;color:#A8D4DF;}
    .sa-close{position:absolute;top:12px;right:14px;background:none;border:none;color:#A8D4DF;font-size:1.1rem;cursor:pointer;}
    .sa-body{flex:1;overflow-y:auto;padding:14px 16px;background:#F4F6F9;}
    .sa-msg{margin-bottom:14px;}
    .sa-msg.user{text-align:right;}
    .sa-bubble-text{display:inline-block;max-width:85%;padding:9px 13px;border-radius:10px;font-size:.85rem;line-height:1.5;text-align:left;}
    .sa-msg.user .sa-bubble-text{background:#1B4F8C;color:#fff;border-bottom-right-radius:2px;}
    .sa-msg.bot .sa-bubble-text{background:#fff;color:#1C2B3A;border:1px solid #D6E0EB;border-bottom-left-radius:2px;}
    .sa-msg.bot .sa-src{font-size:.68rem;color:#028090;font-weight:700;margin-top:6px;}
    .sa-chips{display:flex;flex-wrap:wrap;gap:6px;padding:0 16px 12px;background:#F4F6F9;}
    .sa-chip{background:#fff;border:1px solid #D6E0EB;color:#1B4F8C;font-size:.72rem;font-weight:700;padding:6px 10px;border-radius:14px;cursor:pointer;}
    .sa-chip:hover{background:#EEF2F8;}
    .sa-inputrow{display:flex;gap:8px;padding:12px;border-top:1px solid #D6E0EB;background:#fff;}
    .sa-inputrow input{flex:1;border:1px solid #D6E0EB;border-radius:20px;padding:9px 14px;font-size:.85rem;outline:none;}
    .sa-inputrow input:focus{border-color:#028090;}
    .sa-send{background:#028090;color:#fff;border:none;width:38px;height:38px;border-radius:50%;cursor:pointer;font-size:.95rem;flex-shrink:0;}
    .sa-send:hover{background:#026e75;}
    `;
    const style = document.createElement('style');
    style.textContent = css;
    document.head.appendChild(style);
  }

  function buildWidget(){
    const bubble = document.createElement('button');
    bubble.className = 'sa-bubble';
    bubble.innerHTML = '💬';
    bubble.title = 'Ask about debtor management';

    const panel = document.createElement('div');
    panel.className = 'sa-panel';
    panel.innerHTML = `
      <div class="sa-head">
        <button class="sa-close" id="saClose">✕</button>
        <h4>Debtor Management Assistant</h4>
        <p>Answers from the SOP, FAQ &amp; training content</p>
      </div>
      <div class="sa-body" id="saBody"></div>
      <div class="sa-chips" id="saChips"></div>
      <div class="sa-inputrow">
        <input type="text" id="saInput" placeholder="Ask a question…">
        <button class="sa-send" id="saSend">➤</button>
      </div>
    `;
    document.body.appendChild(bubble);
    document.body.appendChild(panel);

    const body = panel.querySelector('#saBody');
    const chips = panel.querySelector('#saChips');
    const input = panel.querySelector('#saInput');

    function addMsg(text, who, source){
      const div = document.createElement('div');
      div.className = 'sa-msg ' + who;
      div.innerHTML = `<div class="sa-bubble-text">${text}${source ? `<div class="sa-src">📄 ${source}</div>` : ''}</div>`;
      body.appendChild(div);
      body.scrollTop = body.scrollHeight;
    }

    function greet(){
      body.innerHTML = '';
      addMsg("Hi! Ask me anything about the debtor management SOP, FAQ, or training content — payment timeframes, write-off thresholds, Nookal steps, that sort of thing.", 'bot');
    }

    function renderChips(){
      chips.innerHTML = '';
      SUGGESTIONS.forEach(s=>{
        const c = document.createElement('button');
        c.className = 'sa-chip';
        c.textContent = s;
        c.onclick = ()=> ask(s);
        chips.appendChild(c);
      });
    }

    function ask(query){
      addMsg(query, 'user');
      input.value = '';
      const results = search(query);
      if(results.length === 0 || results[0].s < 2){
        addMsg(ASSIST_MSG, 'bot');
      } else {
        const top = results[0].entry;
        addMsg(top.a, 'bot', top.q);
      }
    }

    panel.querySelector('#saClose').onclick = ()=> panel.classList.remove('open');
    panel.querySelector('#saSend').onclick = ()=>{ if(input.value.trim()) ask(input.value.trim()); };
    input.addEventListener('keydown', e=>{ if(e.key==='Enter' && input.value.trim()) ask(input.value.trim()); });

    bubble.onclick = ()=>{
      panel.classList.toggle('open');
      if(panel.classList.contains('open') && body.innerHTML === ''){
        greet();
        renderChips();
        input.focus();
      }
    };
  }

  function init(){
    injectStyles();
    buildWidget();
  }

  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
