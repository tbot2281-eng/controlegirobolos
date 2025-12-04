/* =============================
   URL DO WEBAPP DO GOOGLE SCRIPT
   ============================= */
const WEBAPP_URL = "https://script.google.com/macros/s/AKfycbyof16LxCFJYwa7O9oBttHAe7nnNM8JhtHpyCfavvLY4GEx1tSyYbnqzbFyCOHBoDHVyQ/exec";


/* =============================
   Função genérica da API
   ============================= */
async function api(acao, dados = {}) {
  const resp = await fetch(WEBAPP_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ acao, ...dados })
  });

  return resp.json();
}

/* ALERTA */
function alerta(msg) {
  document.getElementById("alertMsg").textContent = msg;
  document.getElementById("alertFundo").style.display = "flex";
}
function fecharAlerta() {
  document.getElementById("alertFundo").style.display = "none";
}

/* VARIÁVEIS GLOBAIS */
let dados = {};
let historico = {};
let abaExisteHoje = false;

/* ===============================
   INICIALIZAÇÃO
   =============================== */
(async function init() {
  const titulo = await api("getTitulo");
  document.getElementById("tituloPagina").textContent =
    typeof titulo === "string" ? titulo : titulo.msg;

  abaExisteHoje = !document.getElementById("tituloPagina").textContent.includes("NÃO EXISTE");

  const d = await api("getDados");
  dados = d;
  historico = d.historico || {};

  mostrarTelaSetores();
})();

/* ===============================
   TELA SETORES
   =============================== */
function mostrarTelaSetores() {
  const app = document.getElementById("app");
  app.innerHTML = "";

  const btnCriar = document.createElement("div");
  btnCriar.className = "btn-historico";
  btnCriar.style.background = "#0275d8";
  btnCriar.style.borderColor = "#0275d8";
  btnCriar.textContent = "CRIAR ABA DO DIA";
  btnCriar.onclick = criarAbaHoje;
  app.appendChild(btnCriar);

  const histBtn = document.createElement("div");
  histBtn.className = "btn-historico";
  histBtn.textContent = "HISTÓRICO POR DATA";
  histBtn.onclick = telaBuscaHistorico;
  app.appendChild(histBtn);

  dados.ordem.forEach(id => {
    const b = document.createElement("div");
    b.className = "btn-setor";
    b.textContent = dados.setores[id].titulo;

    b.onclick = () => {
      if (!abaExisteHoje) return alerta("A aba do dia não existe");
      mostrarTelaSetor(id);
    };

    app.appendChild(b);
  });
}

/* ===============================
   Criar aba
   =============================== */
function criarAbaHoje() {
  api("criarAba").then(res => {
    if (res.status === "ok") {
      alerta("Aba criada com sucesso!");
      abaExisteHoje = true;
      return;
    }
    alerta(res.msg);
  });
}

/* ===============================
   Setor / Sabores
   =============================== */
function mostrarTelaSetor(setorId) {
  const app = document.getElementById("app");
  app.innerHTML = "";

  const voltar = document.createElement("div");
  voltar.className = "voltar";
  voltar.textContent = "← VOLTAR";
  voltar.onclick = mostrarTelaSetores;
  app.appendChild(voltar);

  const tit = document.createElement("h2");
  tit.textContent = dados.setores[setorId].titulo;
  tit.style.textAlign = "center";
  app.appendChild(tit);

  dados.setores[setorId].sabores.forEach(s =>
    montarBlocoSabor(app, setorId, s)
  );
}

function montarBlocoSabor(app, setorId, sabor) {
  const bloco = document.createElement("div");
  bloco.className = "sabor";

  const h = document.createElement("h3");
  h.textContent = sabor.nome;
  bloco.appendChild(h);

  const histDiv = document.createElement("div");
  histDiv.id = "hist_" + setorId + "_" + sabor.slug;
  bloco.appendChild(histDiv);

  const ed = document.createElement("span");
  ed.className = "edit-btn";
  ed.textContent = "EDITAR";
  bloco.appendChild(ed);

  const lotesArea = document.createElement("div");
  dados.lotes.forEach(l => {
    const b = document.createElement("button");
    b.className = "btn-lote";
    b.textContent = l;
    b.onclick = () => toggleBtn(b);
    lotesArea.appendChild(b);
  });
  bloco.appendChild(lotesArea);

  const qtdArea = document.createElement("div");
  for (let i = 1; i <= 25; i++) {
    const b = document.createElement("button");
    b.className = "btn";
    b.textContent = "+" + i;
    b.onclick = () => toggleBtn(b);
    qtdArea.appendChild(b);
  }
  bloco.appendChild(qtdArea);

  const enviar = document.createElement("button");
  enviar.className = "btn enviar-btn";
  enviar.textContent = "ENVIAR";
  enviar.onclick = () => {
    const lote = lotesArea.querySelector(".selecionado");
    if (!lote) return alerta("Selecione um lote");

    const qtdSel = qtdArea.querySelector(".selecionado");
    const qtd = qtdSel ? Number(qtdSel.textContent.replace("+", "")) : null;

    api("registrarEntrada", {
      setor: setorId,
      slug: sabor.slug,
      lote: lote.textContent,
      qtd
    }).then(novo => {
      historico = novo;
      renderHist(setorId, sabor.slug);
    });

    lotesArea.querySelectorAll(".selecionado")
      .forEach(x => x.classList.remove("selecionado"));
    qtdArea.querySelectorAll(".selecionado")
      .forEach(x => x.classList.remove("selecionado"));
  };

  bloco.appendChild(enviar);

  app.appendChild(bloco);
}

function toggleBtn(btn) {
  [...btn.parentNode.children].forEach(x => x.classList.remove("selecionado"));
  btn.classList.add("selecionado");
}

/* ===============================
   Histórico na tela
   =============================== */
function renderHist(setor, slug) {
  const box = document.getElementById("hist_" + setor + "_" + slug);
  if (!box) return;

  box.innerHTML = "";

  const lista = (historico[setor] || [])
    .filter(e => e.saborSlug === slug)
    .sort((a, b) => a.col - b.col)
    .map(
      e => e.lote + (e.qtd ? "/" + e.qtd : "")
    );

  if (!lista.length) return;

  const d = document.createElement("div");
  d.className = "hist-item";
  d.textContent = lista.join(" – ");
  box.appendChild(d);
}

