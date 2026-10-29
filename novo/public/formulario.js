(function () {
  "use strict";
  const form = document.getElementById("formulario-estampa");
  if (!form) return;
  const $ = (sel) => form.querySelector(sel);
  const aviso = document.getElementById("aviso");
  const PRECOS = {
    qtdPromocao: 10,
    taxaArte: 2000,   
    malhas: [        
      { nome: "Malha tradicional",      normal: 3990, promo: 3790 },
      { nome: "Dryfit normal",          normal: 3990, promo: 3790 },
      { nome: "Dryfit com proteção UV", normal: 4290, promo: 4290 }
    ]
  };
  const ESTAMPA_COM_TABELA = "Sublimação total"; 
  const ARTE_PRONTA = "Já tenho a arte pronta";  
  const brl = (c) => (c / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" }).replace(/ /g, " ");
  const MODELOS = {
    "Camisetas": ["Básica", "colete", "Regata", "Manga longa", "Gola polo",  "Não sei / preciso de orientação"],
    "Uniformes": ["Camiseta", "Gola polo", "Colete", "Outro", "Não sei / preciso de orientação"],
    "Canecas": ["Branca",  "Não sei / preciso de orientação"],
    "Ecobags": ["Algodão cru", "Colorida", "Outro", "Não sei / preciso de orientação"],
    "Bolsas": ["Bolsa", "Necessaire", "Outro", "Não sei / preciso de orientação"],
    "Outro": []
  };
  const COM_MALHA = ["Camisetas", "Uniformes"];
  const COM_LOCAIS = ["Camisetas", "Uniformes", "Ecobags", "Bolsas", "Outro"];
  const malhaSel = $("#malha");
  PRECOS.malhas.forEach((m) => malhaSel.add(new Option(`${m.nome} — ${brl(m.normal)}`, m.nome)));
  $("#dica-malha").textContent = `Preço por peça na sublimação total. A partir de ${PRECOS.qtdPromocao} peças: ` +
    PRECOS.malhas.map((m) => `${m.nome} ${brl(m.promo)}`).join(" · ") + ".";
  $("#dica-arte").textContent = `Taxa de arte de ${brl(PRECOS.taxaArte)} se você ainda não tiver a arte pronta.`;
  const produto = $("#produto");
  const modelo = $("#modelo");
  const qtdAtual = () => parseInt($("#quantidade").value, 10) || 0;
  function atualizaProduto() {
    const p = produto.value;
    modelo.innerHTML = "";
    if (!p) {
      modelo.disabled = true;
      modelo.innerHTML = '<option value="">Escolha o produto primeiro</option>';
    } else if (!MODELOS[p] || !MODELOS[p].length) {
      modelo.disabled = true;
      modelo.innerHTML = '<option value="">Não se aplica</option>';
    } else {
      modelo.disabled = false;
      modelo.add(new Option("Selecione", ""));
      MODELOS[p].forEach((m) => modelo.add(new Option(m, m)));
    }
    $("#campo-outro").hidden = p !== "Outro";
    $("#campo-malha").hidden = !COM_MALHA.includes(p);
    $("#locais-wrap").hidden = p !== "" && !COM_LOCAIS.includes(p);
    atualizaProgresso();
    renderOrcamento();
  }
  produto.addEventListener("change", atualizaProduto);
  try {
    const q = new URLSearchParams(window.location.search).get("produto");
    if (q) {
      const opt = Array.from(produto.options).find((o) => o.value === q || o.text === q);
      if (opt) produto.value = opt.value;
    }
  } catch (e) {}
  function atualizaTipoCliente() {
    const emp = form.tipo_cliente.value === "Empresa / Instituição";
    $("#campo-empresa").hidden = !emp;
    atualizaProgresso();
  }
  form.querySelectorAll('input[name="tipo_cliente"]').forEach((r) => r.addEventListener("change", atualizaTipoCliente));
  function atualizaEntrega() {
    $("#campo-endereco").hidden = form.entrega.value !== "Entrega";
    atualizaProgresso();
  }
  form.querySelectorAll('input[name="entrega"]').forEach((r) => r.addEventListener("change", atualizaEntrega));
  const hoje = new Date();
  const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  const formataData = (v) => { if (!v) return ""; const [a, m, d] = v.split("-"); return `${d}/${m}/${a}`; };
  $("#prazo").min = iso(hoje);
  function calcula() {
    const p = produto.value;
    const qtd = qtdAtual();
    const arte = form.arte.value;
    const r = {
      produto: p, qtd, arte,
      taxaArte: arte && arte !== ARTE_PRONTA ? PRECOS.taxaArte : 0,
      tabela: COM_MALHA.includes(p) && $("#tipo_estampa").value === ESTAMPA_COM_TABELA,
      malha: null, unit: 0, promo: false, pecas: null, total: null, faltando: []
    };
    if (!r.tabela) return r;
    r.malha = PRECOS.malhas.find((m) => m.nome === $("#malha").value) || null;
    if (!r.malha) r.faltando.push("o tipo de malha");
    if (!qtd) r.faltando.push("a quantidade");
    if (!r.faltando.length) {
      r.promo = qtd >= PRECOS.qtdPromocao;
      r.unit = r.promo ? r.malha.promo : r.malha.normal;
      r.pecas = r.unit * qtd;
      r.total = r.pecas + r.taxaArte;
    }
    return r;
  }
  const orcEl = document.getElementById("orcamento-corpo");
  function renderOrcamento() {
    const r = calcula();
    orcEl.replaceChildren();
    const linha = (k, v, cls) => {
      const row = document.createElement("div");
      row.className = "orc-linha" + (cls ? " " + cls : "");
      const a = document.createElement("span"); a.textContent = k;
      const b = document.createElement("strong"); b.textContent = v;
      row.append(a, b); orcEl.append(row);
    };
    const nota = (t) => { const p = document.createElement("p"); p.className = "orc-aviso"; p.textContent = t; orcEl.append(p); };
    if (r.total !== null) {
      linha("Tipo de malha", r.malha.nome);
      linha("Valor por peça", brl(r.unit) + (r.promo ? ` (promoção ${PRECOS.qtdPromocao}+ peças)` : ""));
      linha("Peças", `${r.qtd} × ${brl(r.unit)} = ${brl(r.pecas)}`);
      if (r.arte) linha("Taxa de arte", r.taxaArte ? brl(r.taxaArte) : "isenta (arte pronta)");
      linha("Total estimado", brl(r.total), "total");
      if (!r.arte) nota(`Falta informar sobre a arte: se você não tiver a arte pronta, soma ${brl(PRECOS.taxaArte)} ao total.`);
      if (!r.promo && r.malha.promo < r.malha.normal) nota(`A partir de ${PRECOS.qtdPromocao} peças o valor por peça é menor (${brl(r.malha.promo)}).`);
      return;
    }
    if (r.tabela) {
      nota(`Escolha ${r.faltando.join(" e ")} para calcular o valor.`);
    } else if (!r.produto) {
      nota("Escolha o produto, o tipo de estampa e a malha para ver o valor.");
    } else if (!COM_MALHA.includes(r.produto)) {
      nota("O cálculo automático vale para camisetas e uniformes. Para este produto, o valor é confirmado pela Zart's no WhatsApp.");
    } else {
      nota(`O cálculo automático vale para sublimação total. Escolha "${ESTAMPA_COM_TABELA}" em Tipo de estampa para ver o valor — ou envie o pedido e confirmamos pelo WhatsApp.`);
    }
    if (r.taxaArte) linha("Taxa de arte", brl(r.taxaArte));
  }
  form.addEventListener("input", renderOrcamento);
  form.addEventListener("change", renderOrcamento);
  const naoVazio = (sel) => () => $(sel).value.trim() !== "";
  const regras = [
    { el: "#nome",     ok: () => $("#nome").value.trim().length >= 3 },
    { el: "#empresa",  ok: () => $("#empresa").value.trim().length >= 2 },
    { el: "#telefone", ok: () => $("#telefone").value.replace(/\D/g, "").length >= 10 },
    { el: "#cidade",   ok: naoVazio("#cidade") },
    { el: "#produto",  ok: naoVazio("#produto") },
    { el: "#modelo",   ok: () => modelo.disabled || modelo.value !== "" },
    { el: "#produto_outro", ok: naoVazio("#produto_outro") },
    { el: "#malha",    ok: naoVazio("#malha") },
    { el: "#quantidade", ok: () => qtdAtual() >= 1 },
    { el: "#cor_peca", ok: naoVazio("#cor_peca") },
    { el: "#tipo_estampa", ok: naoVazio("#tipo_estampa") },
    { el: "#locais-wrap",  ok: () => form.querySelectorAll('input[name="locais"]:checked').length > 0 },
    { el: "#campo-arte",   ok: () => form.arte.value !== "" },
    { el: "#prazo",    ok: () => $("#prazo").value !== "" && $("#prazo").value >= iso(new Date()),
      msg: () => $("#prazo").value ? "A data não pode ser anterior a hoje." : "Escolha a data desejada." },
    { el: "#urgencia", ok: naoVazio("#urgencia") },
    { el: "#endereco", ok: () => $("#endereco").value.trim().length >= 8 },
    { el: "#pagamento", ok: naoVazio("#pagamento") },
    { el: "#descricao", ok: () => $("#descricao").value.trim().length >= 10 },
    { el: "#consentimento", ok: () => $("#consentimento").checked }
  ];
  const ativa = (r) => { const el = $(r.el); return !!el && !el.closest("[hidden]"); };
  function atualizaProgresso() {
    const rs = regras.filter(ativa);
    const ok = rs.filter((r) => r.ok()).length;
    document.getElementById("progress-bar").style.width = Math.round((ok / rs.length) * 100) + "%";
  }
  form.addEventListener("input", atualizaProgresso);
  form.addEventListener("change", atualizaProgresso);
  function marca(el, invalido, msg) {
    const campo = el.closest(".campo");
    if (campo) {
      campo.classList.toggle("invalid", invalido);
      if (invalido && msg) { const e = campo.querySelector(".erro"); if (e) e.textContent = msg; }
    }
    if (el.matches("input,select,textarea")) el.setAttribute("aria-invalid", invalido ? "true" : "false");
  }
  function valida() {
    let primeiro = null;
    regras.forEach((r) => {
      const el = $(r.el);
      if (!el) return;
      if (!ativa(r)) { marca(el, false); return; }
      const ok = r.ok();
      marca(el, !ok, !ok && r.msg ? r.msg() : null);
      if (!ok && !primeiro) primeiro = el;
    });
    if (primeiro) {
      const campo = primeiro.closest(".campo") || primeiro;
      const alvo = primeiro.matches("input,select,textarea") ? primeiro : primeiro.querySelector("input,select,textarea");
      campo.scrollIntoView({ behavior: "smooth", block: "center" });
      if (alvo) alvo.focus({ preventScroll: true });
    }
    return !primeiro;
  }
  const limpaErro = (e) => { const c = e.target.closest(".campo"); if (c && c.classList.contains("invalid")) c.classList.remove("invalid"); };
  form.addEventListener("input", limpaErro);
  form.addEventListener("change", limpaErro);
  function montaMensagem() {
    const f = new FormData(form);
    const v = (n) => (f.get(n) || "").toString().trim();
    const linha = (rotulo, valor) => (valor ? `• ${rotulo}: ${valor}\n` : "");
    const locais = f.getAll("locais").join(", ");
    const nomeProduto = v("produto") === "Outro" && v("produto_outro") ? `Outro — ${v("produto_outro")}` : v("produto");
    const malhaPedido = COM_MALHA.includes(v("produto")) ? v("malha") : "";
    const o = calcula();
    let m = "*NOVO PEDIDO DE ORÇAMENTO — ZART'S* ✨\n\n";
    m += "*👤 DADOS DO CLIENTE*\n";
    m += linha("Tipo", v("tipo_cliente")) + linha("Nome", v("nome")) + linha("Empresa", v("empresa"));
    m += linha("Telefone", v("telefone")) + linha("Cidade/bairro", v("cidade"));
    m += "\n*🛍️ PEDIDO*\n";
    m += linha("Produto", nomeProduto) + linha("Modelo", v("modelo")) + linha("Tipo de malha", malhaPedido);
    m += linha("Quantidade total", v("quantidade")) + linha("Cor da peça", v("cor_peca"));
    m += "\n*🎨 PERSONALIZAÇÃO*\n";
    m += linha("Tipo de estampa", v("tipo_estampa")) + linha("Local da estampa", locais) + linha("Arte", v("arte"));
    if (v("nome_numero")) m += "• Nome/número personalizado em cada peça: Sim\n";
    if (v("vai_enviar_arquivos")) m += "• Vou enviar os arquivos da arte por aqui na conversa\n";
    m += "\n*💰 ORÇAMENTO ESTIMADO*\n";
    if (o.total !== null) {
      m += linha("Valor por peça", brl(o.unit) + (o.promo ? ` (promoção a partir de ${PRECOS.qtdPromocao} peças)` : ""));
      m += linha("Peças", `${o.qtd} × ${brl(o.unit)} = ${brl(o.pecas)}`);
      m += linha("Taxa de arte", o.taxaArte ? brl(o.taxaArte) : "isenta (arte pronta)");
      m += `• *Total estimado: ${brl(o.total)}*\n`;
    } else {
      m += "• Valor das peças: a confirmar\n";
      m += linha("Taxa de arte", o.taxaArte ? brl(o.taxaArte) : "");
    }
    m += "\n*📅 PRAZO, ENTREGA E PAGAMENTO*\n";
    m += linha("Data desejada", formataData(v("prazo"))) + linha("Urgência", v("urgencia"));
    m += linha("Recebimento", v("entrega")) + linha("Endereço", v("endereco")) + linha("Pagamento", v("pagamento"));
    if (v("descricao")) m += `\n*📝 DESCRIÇÃO / OBSERVAÇÕES*\n${v("descricao")}\n`;
    m += "\nEnviado pelo formulário do site.";
    return m;
  }
  function mostraAviso(texto, erro) {
    aviso.textContent = texto;
    aviso.hidden = false;
    aviso.classList.toggle("erro-geral", !!erro);
    aviso.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }
  const API_URL = (typeof ZARTS !== "undefined" && ZARTS.apiUrl) || "/api/pedido";
  let enviando = false;

  // Envia o pedido ao servidor (que manda o e-mail). Devolve true/false conforme o resultado real.
  async function enviaParaEmail(texto) {
    try {
      const resp = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mensagem: texto,
          nome: $("#nome").value.trim(),
          site: (form.querySelector("#site-hp") || {}).value || ""
        }),
        keepalive: true   // continua mesmo se a página mudar para o WhatsApp
      });
      if (!resp.ok) return false;
      const json = await resp.json().catch(() => ({}));
      return json.ok === true;
    } catch (e) {
      return false;
    }
  }

  const btnEnviar = document.getElementById("btn-enviar");
  const btnEnviarHtml = btnEnviar.innerHTML;

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    if (enviando) return;
    if (!valida()) { mostraAviso("Confira os campos destacados em vermelho para continuar.", true); return; }
    enviando = true;
    btnEnviar.disabled = true;
    btnEnviar.textContent = "Enviando...";

    const texto = montaMensagem();
    const url = `https://wa.me/${ZARTS.whatsapp}?text=${encodeURIComponent(texto)}`;

    // Os dois envios começam no MESMO clique:
    // 1) e-mail (requisição em andamento) e 2) WhatsApp (abre já, para o navegador não bloquear o pop-up).
    const emailPromise = enviaParaEmail(texto);
    const w = window.open(url, "_blank");
    if (w) { w.opener = null; }

    emailPromise.then((emailOk) => {
      enviando = false;
      btnEnviar.disabled = false;
      btnEnviar.innerHTML = btnEnviarHtml;
      if (!w) {
        // Pop-up bloqueado: abre o WhatsApp nesta mesma aba (o e-mail já foi enviado ou tentado antes).
        window.location.href = url;
        return;
      }
      if (emailOk) {
        mostraAviso("Tudo certo! Seu pedido foi enviado por e-mail e o WhatsApp foi aberto. Se tiver arquivos da arte, envie-os na própria conversa. 💚", false);
      } else {
        mostraAviso("O WhatsApp foi aberto com o seu pedido, mas não conseguimos enviar a cópia por e-mail agora. Basta enviar a mensagem no WhatsApp que recebemos do mesmo jeito.", true);
      }
    });
  });

  // "Limpar formulário": reaplica as regras de campos escondidos, progresso, orçamento e avisos.
  form.addEventListener("reset", () => {
    setTimeout(() => {
      form.querySelectorAll(".campo.invalid").forEach((c) => c.classList.remove("invalid"));
      form.querySelectorAll("[aria-invalid]").forEach((el) => el.removeAttribute("aria-invalid"));
      aviso.hidden = true;
      atualizaProduto(); atualizaTipoCliente(); atualizaEntrega(); atualizaProgresso();
    }, 0);
  });
  document.getElementById("btn-copiar").addEventListener("click", async () => {
    if (!valida()) { mostraAviso("Preencha todos os campos para gerar o resumo.", true); return; }
    const texto = montaMensagem();
    try {
      await navigator.clipboard.writeText(texto);
      mostraAviso("Resumo copiado! Você pode colar onde quiser.", false);
    } catch (err) {
      const ta = document.createElement("textarea");
      ta.value = texto; document.body.appendChild(ta); ta.select();
      try { document.execCommand("copy"); mostraAviso("Resumo copiado!", false); }
      catch (e2) { mostraAviso("Não foi possível copiar automaticamente.", true); }
      document.body.removeChild(ta);
    }
  });
  atualizaProduto(); atualizaTipoCliente(); atualizaEntrega(); atualizaProgresso();
})();