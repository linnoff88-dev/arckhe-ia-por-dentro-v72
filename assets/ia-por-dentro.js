/* ia-por-dentro-v72: simulações próprias do curso (simpacote, simtokens, simproximo; sec_* em gerar.py).
   Todo texto visível vem do JSON (data-sim). Ilustrativas: nada é enviado a modelo nenhum. */
(function () {
  function dados(el) { try { return JSON.parse(el.getAttribute("data-sim")); } catch (e) { return null; } }
  function fmt(n) { return Math.round(n).toLocaleString("pt-BR"); }
  function troca(t, o) { return String(t).replace(/\{(\w)\}/g, function (m, k) { return k in o ? o[k] : m; }); }
  var CORES = ["c0", "c1", "c2", "c3", "c4", "c5"];

  /* ---------- montar o pacote do envio ---------- */
  document.querySelectorAll(".simpacote").forEach(function (sim) {
    var d = dados(sim); if (!d) return;
    var caixas = [].slice.call(sim.querySelectorAll(".pk-peca"));
    var barra = sim.querySelector(".pk-barra"), total = sim.querySelector(".pk-total"), envios = sim.querySelector(".pk-envios");
    var log = sim.querySelector(".sim-log"), n = 1;
    var minha = String(d.mensagem).trim().split(/\s+/).length;
    function tam(i) {
      var p = d.pecas[i];
      return p.conversa ? (n - 1) * d.conversa.por_envio : p.palavras;
    }
    function desenha() {
      var soma = minha, partes = [];
      caixas.forEach(function (c, i) {
        var lig = c.querySelector("input").checked, v = tam(i);
        c.classList.toggle("off", !lig);
        c.querySelector(".pk-n").textContent = lig ? fmt(v) : "0";
        c.querySelector(".pk-cor").className = "pk-cor " + CORES[i % CORES.length];
        if (lig && v > 0) { soma += v; partes.push([i, v]); }
      });
      barra.innerHTML = "";
      partes.concat([[-1, minha]]).forEach(function (p) {
        var s = document.createElement("span");
        s.className = p[0] < 0 ? "pk-seg sua" : "pk-seg " + CORES[p[0] % CORES.length];
        s.style.flexGrow = String(p[1]);
        barra.appendChild(s);
      });
      total.innerHTML = troca(d.rot.total, { s: fmt(minha), p: fmt(soma) });
      envios.textContent = troca(d.rot.envios, { n: n });
      var longo = soma >= d.limite;
      sim.classList.toggle("longo", longo);
      log.textContent = longo ? d.msg.aviso : (n > 1 ? d.msg.cresce : d.msg.inicio);
    }
    caixas.forEach(function (c) { c.querySelector("input").addEventListener("change", desenha); });
    sim.querySelector('[data-acao="enviar"]').addEventListener("click", function () { n += 1; desenha(); });
    sim.querySelector('[data-acao="zerar"]').addEventListener("click", function () {
      n = 1;
      caixas.forEach(function (c, i) { var inp = c.querySelector("input"); if (!inp.disabled) inp.checked = d.pecas[i].ligado !== false; });
      desenha();
    });
    desenha();
  });

  /* ---------- ver uma frase virar tokens ---------- */
  document.querySelectorAll(".simtokens").forEach(function (sim) {
    var d = dados(sim); if (!d) return;
    var bts = [].slice.call(sim.querySelectorAll(".tk-ex"));
    var txt = sim.querySelector(".tk-texto"), pecas = sim.querySelector(".tk-pecas");
    var conta = sim.querySelector(".tk-conta"), nota = sim.querySelector(".tk-nota");
    function mostra(i) {
      var e = d.exemplos[i];
      bts.forEach(function (b, k) { b.classList.toggle("on", k === i); b.setAttribute("aria-pressed", k === i ? "true" : "false"); });
      txt.textContent = e.texto;
      pecas.innerHTML = "";
      e.pecas.forEach(function (p, k) {
        var s = document.createElement("span");
        s.className = "tk-p " + CORES[k % CORES.length];
        s.textContent = p.replace(/ /g, "·");
        pecas.appendChild(s);
      });
      conta.innerHTML = troca(d.rot.conta, { t: e.pecas.length, c: Array.from(e.texto).length });
      nota.innerHTML = e.nota || "";
    }
    bts.forEach(function (b, k) { b.addEventListener("click", function () { mostra(k); }); });
    mostra(0);
  });

  /* ---------- gerar token por token ---------- */
  document.querySelectorAll(".simproximo").forEach(function (sim) {
    var d = dados(sim); if (!d) return;
    var resp = sim.querySelector(".px-txt"), lista = sim.querySelector(".px-lista"), pass = sim.querySelector(".px-passadas");
    var log = sim.querySelector(".sim-log"), rodar = sim.querySelector('[data-acao="rodar"]');
    var i = 0, errou = false;
    function escolhe(c) {
      resp.textContent += c.t;
      if (c.errada) errou = true;
      i += 1;
      desenha();
    }
    function desenha() {
      pass.textContent = troca(d.rot.passadas, { n: i });
      lista.innerHTML = "";
      if (i >= d.passos.length) {
        rodar.disabled = true;
        if (d.rot.parou) { var fim = document.createElement("li"); fim.className = "px-parou"; fim.textContent = d.rot.parou; lista.appendChild(fim); }
        sim.classList.toggle("errou", errou); sim.classList.toggle("acertou", !errou);
        log.textContent = errou ? d.msg.fim_errado : d.msg.fim_certo;
        return;
      }
      rodar.disabled = false; sim.classList.remove("errou", "acertou");
      var passo = d.passos[i];
      passo.cands.forEach(function (c, k) {
        var li = document.createElement("li");
        var pode = k === 0 || passo.ramo;
        var el = document.createElement(pode ? "button" : "span");
        if (pode) { el.type = "button"; el.addEventListener("click", function () { escolhe(c); }); }
        el.className = "px-c" + (k === 0 ? " top" : "");
        el.innerHTML = '<span class="px-ct"></span><span class="px-pct"></span><i style="width:' + Math.max(2, c.p) + '%"></i>';
        el.querySelector(".px-ct").textContent = c.t.trim() || "·";
        el.querySelector(".px-pct").textContent = c.p + "%";
        li.appendChild(el); lista.appendChild(li);
      });
      log.textContent = passo.ramo ? d.msg.ramo : (i === 0 ? d.msg.inicio : d.msg.segue);
    }
    rodar.addEventListener("click", function () { if (i < d.passos.length) escolhe(d.passos[i].cands[0]); });
    sim.querySelector('[data-acao="zerar"]').addEventListener("click", function () { i = 0; errou = false; resp.textContent = ""; desenha(); });
    desenha();
  });
})();
