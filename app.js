const STORAGE_KEY = "fuel-app-premium";

let editandoId = null;

const dadosIniciais = [
  {
    id: 1,
    data: "17/03/2026",
    kmInicio: 163218,
    kmFinal: 163224,
    litros: 28.99,
    preco: 4.29,
    tanquePercentual: 45,
    statusPlanilha: "❌ Consumo muito alto, verificar"
  },
  {
    id: 2,
    data: "18/03/2026",
    kmInicio: 163224,
    kmFinal: 163666,
    litros: 51,
    preco: 5.0,
    tanquePercentual: 82,
    statusPlanilha: "✅ OK"
  }
];

function carregarDados() {
  const salvo = localStorage.getItem(STORAGE_KEY);
  return salvo ? JSON.parse(salvo) : dadosIniciais;
}

function salvarDados(dados) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(dados));
}

function formatarMoeda(valor) {
  return Number(valor || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL"
  });
}

function formatarNumero(valor, casas = 1) {
  return Number(valor || 0).toLocaleString("pt-BR", {
    minimumFractionDigits: casas,
    maximumFractionDigits: casas
  });
}

function processar(dados) {
  return dados
    .map((item) => {
      const kmRodado = Number(item.kmFinal) - Number(item.kmInicio);
      const litros = Number(item.litros);
      const preco = Number(item.preco);
      const tanquePercentual = Math.max(0, Math.min(100, Number(item.tanquePercentual || 0)));
      const consumo = kmRodado >= 50 && litros >= 5 ? kmRodado / litros : null;
      const valorTotal = litros * preco;
      const custoKm = kmRodado > 0 ? valorTotal / kmRodado : null;

      return {
        ...item,
        kmRodado,
        litros,
        preco,
        tanquePercentual,
        consumo,
        valorTotal,
        custoKm
      };
    })
    .sort((a, b) => {
      const [da, ma, aa] = a.data.split("/").map(Number);
      const [db, mb, ab] = b.data.split("/").map(Number);
      return new Date(ab, mb - 1, db) - new Date(aa, ma - 1, da);
    });
}

function statusClasse(item) {
  const texto = item.statusPlanilha || "";
  if (texto.includes("OK") || texto.includes("✅")) return "status-green";
  if (texto.includes("❌") || texto.toLowerCase().includes("alto")) return "status-red";
  return "status-yellow";
}

function atualizarGauges(consumoMedio, tanqueAtual) {
  const percConsumo = Math.max(0, Math.min((consumoMedio / 15) * 100, 100));
  const grauConsumo = (percConsumo * 1.8) - 180;
  const grauTanque = (tanqueAtual * 1.8) - 180;

  document.getElementById("needleConsumo").style.transform = `rotate(${grauConsumo}deg)`;
  document.getElementById("needleTanque").style.transform = `rotate(${grauTanque}deg)`;
}

function atualizarGraficoSemanal(consumos) {
  const weeklyChart = document.getElementById("weeklyChart");
  weeklyChart.innerHTML = "";

  const dias = ["SEG", "TER", "QUA", "QUI", "SEX", "SÁB", "DOM"];
  const semana = dias.map((dia, idx) => ({
    dia,
    valor: consumos[idx] || 0
  }));

  const max = Math.max(...semana.map(i => i.valor), 1);

  semana.forEach((item) => {
    const col = document.createElement("div");
    col.className = "bar-col";

    const bar = document.createElement("div");
    bar.className = "bar";
    bar.style.height = `${Math.max((item.valor / max) * 100, item.valor ? 22 : 6)}%`;

    const label = document.createElement("div");
    label.className = "bar-label";
    label.textContent = item.dia;

    col.appendChild(bar);
    col.appendChild(label);
    weeklyChart.appendChild(col);
  });
}

function atualizarHistorico(linhas) {
  const lista = document.getElementById("listaAbastecimentos");
  lista.innerHTML = "";

  if (!linhas.length) {
    lista.innerHTML = "<div class='panel-card'>Nenhum abastecimento salvo.</div>";
    return;
  }

  linhas.forEach((item) => {
    const div = document.createElement("div");
    div.className = "history-item";

    div.innerHTML = `
      <div class="history-top">
        <div>${item.data}</div>
        <div>${formatarMoeda(item.valorTotal)}</div>
      </div>

      <div class="history-grid">
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

      <div class="history-footer">
        <div class="status-pill ${statusClasse(item)}">${item.statusPlanilha || "Sem status"}</div>
        <div class="action-group">
          <button class="action-btn edit-btn" onclick="editarRegistro(${item.id})">Editar</button>
          <button class="action-btn delete-btn" onclick="excluirRegistro(${item.id})">Excluir</button>
        </div>
      </div>
    `;

    lista.appendChild(div);
  });
}

function atualizarDashboard() {
  const linhas = processar(carregarDados());

  const totalGasto = linhas.reduce((s, i) => s + i.valorTotal, 0);
  const kmRodados = linhas.reduce((s, i) => s + Math.max(i.kmRodado, 0), 0);
  const consumosValidos = linhas.filter(i => i.consumo !== null).map(i => i.consumo);
  const consumoMedio = consumosValidos.length
    ? consumosValidos.reduce((s, v) => s + v, 0) / consumosValidos.length
    : 0;
  const custoKm = kmRodados > 0 ? totalGasto / kmRodados : 0;
  const ultimo = linhas[0] || null;
  const tanqueAtual = ultimo ? ultimo.tanquePercentual : 0;
  const gastoMes = totalGasto;

  document.getElementById("gastosMes").textContent = formatarMoeda(gastoMes);
  document.getElementById("kmRodadosCard").innerHTML = `${formatarNumero(kmRodados, 0)} <span>km</span>`;
  document.getElementById("consumoMedio").textContent = formatarNumero(consumoMedio);
  document.getElementById("tanqueAtual").textContent = formatarNumero(tanqueAtual, 0);
  document.getElementById("ultimoLitros").textContent = ultimo ? formatarNumero(ultimo.litros, 0) : "0";
  document.getElementById("ultimoValor").textContent = ultimo ? formatarMoeda(ultimo.valorTotal) : formatarMoeda(0);
  document.getElementById("custoKm").textContent = formatarMoeda(custoKm);

  atualizarGauges(consumoMedio, tanqueAtual);
  atualizarGraficoSemanal(consumosValidos);
  atualizarHistorico(linhas);
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

function limparFormulario() {
  editandoId = null;
  document.getElementById("data").value = "";
  document.getElementById("kmInicio").value = "";
  document.getElementById("kmFinal").value = "";
  document.getElementById("litros").value = "";
  document.getElementById("preco").value = "";
  document.getElementById("tanquePercentual").value = "";
  atualizarPrevia();
}

function salvarRegistro() {
  const data = document.getElementById("data").value.trim();
  const kmInicio = Number(document.getElementById("kmInicio").value);
  const kmFinal = Number(document.getElementById("kmFinal").value);
  const litros = Number(document.getElementById("litros").value);
  const preco = Number(document.getElementById("preco").value);
  const tanquePercentual = Number(document.getElementById("tanquePercentual").value || 0);

  if (!data || !kmInicio || !kmFinal || !litros || !preco) {
    alert("Preencha os campos obrigatórios.");
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
    tanquePercentual,
    statusPlanilha: "✅ Registro salvo no app"
  };

  if (editandoId) {
    dados = dados.map((item) => item.id === editandoId ? registro : item);
  } else {
    dados.unshift(registro);
  }

  salvarDados(dados);
  limparFormulario();
  atualizarDashboard();
  ativarAba("abastecimentos");
}

function editarRegistro(id) {
  const dados = carregarDados();
  const item = dados.find(r => r.id === id);
  if (!item) return;

  editandoId = id;
  document.getElementById("data").value = item.data;
  document.getElementById("kmInicio").value = item.kmInicio;
  document.getElementById("kmFinal").value = item.kmFinal;
  document.getElementById("litros").value = item.litros;
  document.getElementById("preco").value = item.preco;
  document.getElementById("tanquePercentual").value = item.tanquePercentual || 0;
  atualizarPrevia();
  ativarAba("relatorios");
}

function excluirRegistro(id) {
  if (!confirm("Deseja excluir este abastecimento?")) return;
  const dados = carregarDados().filter(item => item.id !== id);
  salvarDados(dados);
  atualizarDashboard();
}

function ativarAba(nome) {
  document.querySelectorAll(".aba").forEach(el => el.classList.remove("ativa"));
  document.querySelectorAll(".nav-btn").forEach(el => el.classList.remove("ativo"));

  document.getElementById(`aba-${nome}`).classList.add("ativa");
  document.querySelector(`.nav-btn[data-aba="${nome}"]`).classList.add("ativo");
}

document.querySelectorAll(".nav-btn").forEach((btn) => {
  btn.addEventListener("click", () => ativarAba(btn.dataset.aba));
});

["kmInicio", "kmFinal", "litros", "preco", "tanquePercentual"].forEach((id) => {
  document.getElementById(id).addEventListener("input", atualizarPrevia);
});

document.getElementById("salvarBtn").addEventListener("click", salvarRegistro);

window.editarRegistro = editarRegistro;
window.excluirRegistro = excluirRegistro;

atualizarPrevia();
atualizarDashboard();
