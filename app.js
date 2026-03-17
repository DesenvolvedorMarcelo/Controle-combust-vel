const chaveStorage = "fuel-app-data";
let editandoId = null;

const dadosIniciais = [
  {
    id: 1,
    data: "17/03/2026",
    kmInicio: 163218,
    kmFinal: 163224,
    litros: 28.99,
    preco: 4.29,
    statusPlanilha: "❌ Consumo muito alto, verificar",
  },
  {
    id: 2,
    data: "18/03/2026",
    kmInicio: 163224,
    kmFinal: 163666,
    litros: 51,
    preco: 5.0,
    statusPlanilha: "✅ OK",
  },
];

function carregarDados() {
  const salvo = localStorage.getItem(chaveStorage);
  return salvo ? JSON.parse(salvo) : dadosIniciais;
}

function salvarDados(dados) {
  localStorage.setItem(chaveStorage, JSON.stringify(dados));
}

function formatarMoeda(v) {
  return Number(v || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function formatarNumero(v, casas = 2) {
  return Number(v || 0).toLocaleString("pt-BR", {
    minimumFractionDigits: casas,
    maximumFractionDigits: casas,
  });
}

function processar(dados) {
  return dados
    .map((item) => {
      const kmRodado = Number(item.kmFinal) - Number(item.kmInicio);
      const litros = Number(item.litros);
      const preco = Number(item.preco);
      const consumo = kmRodado >= 50 && litros >= 5 ? kmRodado / litros : null;
      const valorTotal = litros * preco;
      const custoKm = kmRodado > 0 ? valorTotal / kmRodado : null;
      return { ...item, kmRodado, consumo, valorTotal, custoKm };
    })
    .sort((a, b) => {
      const [da, ma, aa] = a.data.split("/").map(Number);
      const [db, mb, ab] = b.data.split("/").map(Number);
      return new Date(ab, mb - 1, db) - new Date(aa, ma - 1, da);
    });
}

function atualizarDashboard() {
  const dados = processar(carregarDados());

  const totalGasto = dados.reduce((s, i) => s + i.valorTotal, 0);
  const totalLitros = dados.reduce((s, i) => s + Number(i.litros), 0);
  const kmRodados = dados.reduce((s, i) => s + Math.max(i.kmRodado, 0), 0);
  const consumosValidos = dados.filter((i) => i.consumo !== null).map((i) => i.consumo);
  const consumoMedio = consumosValidos.length
    ? consumosValidos.reduce((s, v) => s + v, 0) / consumosValidos.length
    : 0;
  const custoKm = kmRodados > 0 ? totalGasto / kmRodados : 0;
  const autonomia = consumoMedio * 51;

  document.getElementById("totalGasto").textContent = formatarMoeda(totalGasto);
  document.getElementById("kmRodados").textContent = `${formatarNumero(kmRodados, 0)} km`;
  document.getElementById("consumoMedio").textContent = `${formatarNumero(consumoMedio)} km/L`;
  document.getElementById("custoKm").textContent = formatarMoeda(custoKm);
  document.getElementById("autonomia").textContent = `${formatarNumero(autonomia, 0)} km`;

  const badge = document.getElementById("statusBadge");
  badge.className = "badge";

  if (consumoMedio === 0) {
    badge.textContent = "Sem dados suficientes";
    badge.classList.add("cinza");
  } else if (consumoMedio < 5) {
    badge.textContent = "Alto consumo";
    badge.classList.add("vermelho");
  } else if (consumoMedio < 10) {
    badge.textContent = "Consumo médio";
    badge.classList.add("amarelo");
  } else {
    badge.textContent = "Econômico";
    badge.classList.add("verde");
  }

  atualizarGrafico(dados);
  atualizarHistorico(dados);
}

function atualizarGrafico(dados) {
  const grafico = document.getElementById("grafico");
  grafico.innerHTML = "";

  const validos = dados.filter((i) => i.consumo !== null);
  const max = Math.max(...validos.map((i) => i.consumo), 1);

  if (!dados.length) {
    grafico.innerHTML = "<p>Sem registros.</p>";
    return;
  }

  dados.forEach((item) => {
    const wrap = document.createElement("div");
    wrap.className = "barra-wrap";

    const rotulo = document.createElement("div");
    rotulo.className = "rotulo";
    rotulo.textContent = item.data.slice(0, 5);

    const barra = document.createElement("div");
    barra.className = "barra";
    barra.style.height = `${item.consumo ? Math.max((item.consumo / max) * 120, 8) : 8}px`;

    const valor = document.createElement("div");
    valor.className = "valor-barra";
    valor.textContent = item.consumo ? formatarNumero(item.consumo, 1) : "-";

    wrap.appendChild(rotulo);
    wrap.appendChild(barra);
    wrap.appendChild(valor);

    grafico.appendChild(wrap);
  });
}

function atualizarHistorico(dados) {
  const lista = document.getElementById("listaHistorico");
  lista.innerHTML = "";

  if (!dados.length) {
    lista.innerHTML = "<p>Nenhum abastecimento salvo.</p>";
    return;
  }

  dados.forEach((item) => {
    const div = document.createElement("div");
    div.className = "item";

    let classeStatus = "badge cinza";
    if ((item.statusPlanilha || "").includes("OK") || (item.statusPlanilha || "").includes("salvo")) {
      classeStatus = "badge verde";
    } else if ((item.statusPlanilha || "").includes("alto") || (item.statusPlanilha || "").includes("❌")) {
      classeStatus = "badge vermelho";
    } else if ((item.statusPlanilha || "").includes("⚠️")) {
      classeStatus = "badge amarelo";
    }

    div.innerHTML = `
      <div class="item-topo">
        <div>${item.data}</div>
        <div>${formatarMoeda(item.valorTotal)}</div>
      </div>

      <div class="item-grid">
        <div>
          <span>KM rodado</span>
          <strong>${formatarNumero(item.kmRodado, 0)} km</strong>
        </div>
        <div>
          <span>Litros</span>
          <strong>${formatarNumero(item.litros)} L</strong>
        </div>
        <div>
          <span>Consumo</span>
          <strong>${item.consumo ? `${formatarNumero(item.consumo)} km/L` : "Insuficiente"}</strong>
        </div>
      </div>

      <div class="item-acoes">
        <div class="${classeStatus}">${item.statusPlanilha || "Sem status"}</div>
        <div class="item-botoes">
          <button class="btn-editar" onclick="editarRegistro(${item.id})">Editar</button>
          <button class="btn-excluir" onclick="excluirRegistro(${item.id})">Excluir</button>
        </div>
      </div>
    `;

    lista.appendChild(div);
  });
}

function limparFormulario() {
  editandoId = null;
  document.getElementById("tituloFormulario").textContent = "Novo abastecimento";
  document.getElementById("data").value = "";
  document.getElementById("kmInicio").value = "";
  document.getElementById("kmFinal").value = "";
  document.getElementById("litros").value = "";
  document.getElementById("preco").value = "";
  atualizarPrevia();
}

function atualizarPrevia() {
  const kmInicio = Number(document.getElementById("kmInicio").value || 0);
  const kmFinal = Number(document.getElementById("kmFinal").value || 0);
  const litros = Number(document.getElementById("litros").value || 0);
  const preco = Number(document.getElementById("preco").value || 0);

  const kmRodado = kmFinal - kmInicio;
  const valorTotal = litros * preco;
  const consumo = kmRodado >= 50 && litros >= 5 ? kmRodado / litros : null;

  document.getElementById("prevKm").textContent = `${formatarNumero(kmRodado, 0)} km`;
  document.getElementById("prevValor").textContent = formatarMoeda(valorTotal);
  document.getElementById("prevConsumo").textContent = consumo
    ? `${formatarNumero(consumo)} km/L`
    : "Dados insuficientes";
}

function salvarRegistro() {
  const data = document.getElementById("data").value.trim();
  const kmInicio = Number(document.getElementById("kmInicio").value);
  const kmFinal = Number(document.getElementById("kmFinal").value);
  const litros = Number(document.getElementById("litros").value);
  const preco = Number(document.getElementById("preco").value);

  if (!data || !kmInicio || !kmFinal || !litros || !preco) {
    alert("Preencha todos os campos.");
    return;
  }

  if (kmFinal <= kmInicio) {
    alert("O KM final precisa ser maior que o KM início.");
    return;
  }

  let dados = carregarDados();

  const registro = {
    id: editandoId || Date.now(),
    data,
    kmInicio,
    kmFinal,
    litros,
    preco,
    statusPlanilha: "✅ Registro salvo no app",
  };

  if (editandoId) {
    dados = dados.map((item) => (item.id === editandoId ? registro : item));
  } else {
    dados.unshift(registro);
  }

  salvarDados(dados);
  limparFormulario();
  atualizarDashboard();
  ativarAba("historico");
}

function editarRegistro(id) {
  const dados = carregarDados();
  const item = dados.find((r) => r.id === id);
  if (!item) return;

  editandoId = id;
  document.getElementById("tituloFormulario").textContent = "Editar abastecimento";
  document.getElementById("data").value = item.data;
  document.getElementById("kmInicio").value = item.kmInicio;
  document.getElementById("kmFinal").value = item.kmFinal;
  document.getElementById("litros").value = item.litros;
  document.getElementById("preco").value = item.preco;
  atualizarPrevia();
  ativarAba("cadastro");
}

function excluirRegistro(id) {
  if (!confirm("Deseja excluir este abastecimento?")) return;
  const dados = carregarDados().filter((item) => item.id !== id);
  salvarDados(dados);
  atualizarDashboard();
}

function exportarBackup() {
  const dados = carregarDados();
  const blob = new Blob([JSON.stringify(dados, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "controle-combustivel-backup.json";
  a.click();
  URL.revokeObjectURL(url);
}

function ativarAba(nome) {
  document.querySelectorAll(".aba").forEach((el) => el.classList.remove("ativa"));
  document.querySelectorAll(".tab").forEach((el) => el.classList.remove("ativo"));

  document.getElementById(nome).classList.add("ativa");
  document.querySelector(`.tab[data-aba="${nome}"]`).classList.add("ativo");
}

document.querySelectorAll(".tab").forEach((btn) => {
  btn.addEventListener("click", () => ativarAba(btn.dataset.aba));
});

["kmInicio", "kmFinal", "litros", "preco"].forEach((id) => {
  document.getElementById(id).addEventListener("input", atualizarPrevia);
});

document.getElementById("salvarBtn").addEventListener("click", salvarRegistro);
document.getElementById("limparBtn").addEventListener("click", limparFormulario);
document.getElementById("exportarBtn").addEventListener("click", exportarBackup);

atualizarPrevia();
atualizarDashboard();

window.editarRegistro = editarRegistro;
window.excluirRegistro = excluirRegistro;
