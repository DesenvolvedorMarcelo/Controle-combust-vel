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

function getEl(id) {
  return document.getElementById(id);
}

function carregarDados() {
  try {
    const salvo = localStorage.getItem(STORAGE_KEY);
    return salvo ? JSON.parse(salvo) : [...dadosIniciais];
  } catch (error) {
    console.error("Erro ao carregar dados:", error);
    return [...dadosIniciais];
  }
}

function salvarDados(dados) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(dados));
  } catch (error) {
    console.error("Erro ao salvar dados:", error);
  }
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

function converterDataParaDate(data) {
  if (!data) return new Date(0);

  if (data.includes("/")) {
    const [dia, mes, ano] = data.split("/").map(Number);
    return new Date(ano, mes - 1, dia);
  }

  if (data.includes("-")) {
    const [ano, mes, dia] = data.split("-").map(Number);
    return new Date(ano, mes - 1, dia);
  }

  return new Date(data);
}

function normalizarData(data) {
  if (!data) return "";

  if (data.includes("-")) {
    const [ano, mes, dia] = data.split("-");
    return `${dia}/${mes}/${ano}`;
  }

  return data;
}

function processar(dados) {
  return dados
    .map((item) => {
      const kmInicio = Number(item.kmInicio || 0);
      const kmFinal = Number(item.kmFinal || 0);
      const litros = Number(item.litros || 0);
      const preco = Number(item.preco || 0);
      const tanquePercentual = Math.max(0, Math.min(100, Number(item.tanquePercentual || 0)));

      const kmRodado = kmFinal - kmInicio;
      const consumo = kmRodado >= 50 && litros >= 5 ? kmRodado / litros : null;
      const valorTotal = litros * preco;
      const custoKm = kmRodado > 0 ? valorTotal / kmRodado : null;

      return {
        ...item,
        data: normalizarData(item.data),
        kmInicio,
        kmFinal,
        litros,
        preco,
        tanquePercentual,
        kmRodado,
        consumo,
        valorTotal,
        custoKm
      };
    })
    .sort((a, b) => converterDataParaDate(b.data) - converterDataParaDate(a.data));
}

function statusClasse(item) {
  const texto = String(item.statusPlanilha || "").toLowerCase();

  if (texto.includes("ok") || texto.includes("✅")) return "status-green";
  if (texto.includes("❌") || texto.includes("alto")) return "status-red";
  return "status-yellow";
}

function atualizarGauges(consumoMedio, tanqueAtual) {
  const needleConsumo = getEl("needleConsumo");
  const needleTanque = getEl("needleTanque");

  if (!needleConsumo || !needleTanque) return;

  const percConsumo = Math.max(0, Math.min((consumoMedio / 15) * 100, 100));
  const grauConsumo = percConsumo * 1.8 - 180;
  const grauTanque = tanqueAtual * 1.8 - 180;

  needleConsumo.style.transform = `rotate(${grauConsumo}deg)`;
  needleTanque.style.transform = `rotate(${grauTanque}deg)`;
}

function atualizarGraficoSemanal(consumos) {
  const weeklyChart = getEl("weeklyChart");
  if (!weeklyChart) return;

  weeklyChart.innerHTML = "";

  const dias = ["SEG", "TER", "QUA", "QUI", "SEX", "SÁB", "DOM"];
  const semana = dias.map((dia, idx) => ({
    dia,
    valor: consumos[idx] || 0
  }));

  const max = Math.max(...semana.map((i) => i.valor), 1);

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
  const lista = getEl("listaAbastecimentos");
  if (!lista) return;

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

  const totalGasto = linhas.reduce((soma, item) => soma + item.valorTotal, 0);
  const kmRodados = linhas.reduce((soma, item) => soma + Math.max(item.kmRodado, 0), 0);
  const consumosValidos = linhas.filter((item) => item.consumo !== null).map((item) => item.consumo);
  const consumoMedio = consumosValidos.length
    ? consumosValidos.reduce((soma, valor) => soma + valor, 0) / consumosValidos.length
    : 0;

  const custoKm = kmRodados > 0 ? totalGasto / kmRodados : 0;
  const ultimo = linhas[0] || null;
  const tanqueAtual = ultimo ? ultimo.tanquePercentual : 0;
  const gastoMes = totalGasto;

  const gastosMes = getEl("gastosMes");
  const kmRodadosCard = getEl("kmRodadosCard");
  const consumoMedioEl = getEl("consumoMedio");
  const tanqueAtualEl = getEl("tanqueAtual");
  const ultimoLitros = getEl("ultimoLitros");
  const ultimoValor = getEl("ultimoValor");
  const custoKmEl = getEl("custoKm");

  if (gastosMes) gastosMes.textContent = formatarMoeda(gastoMes);
  if (kmRodadosCard) kmRodadosCard.innerHTML = `${formatarNumero(kmRodados, 0)} <span>km</span>`;
  if (consumoMedioEl) consumoMedioEl.textContent = formatarNumero(consumoMedio);
  if (tanqueAtualEl) tanqueAtualEl.textContent = formatarNumero(tanqueAtual, 0);
  if (ultimoLitros) ultimoLitros.textContent = ultimo ? formatarNumero(ultimo.litros, 0) : "0";
  if (ultimoValor) ultimoValor.textContent = ultimo ? formatarMoeda(ultimo.valorTotal) : formatarMoeda(0);
  if (custoKmEl) custoKmEl.textContent = formatarMoeda(custoKm);

  atualizarGauges(consumoMedio, tanqueAtual);
  atualizarGraficoSemanal(consumosValidos);
  atualizarHistorico(linhas);
}

function atualizarPrevia() {
  const kmInicio = Number(getEl("kmInicio")?.value || 0);
  const kmFinal = Number(getEl("kmFinal")?.value || 0);
  const litros = Number(getEl("litros")?.value || 0);
  const preco = Number(getEl("preco")?.value || 0);

  const kmRodado = kmFinal - kmInicio;
  const valorTotal = litros * preco;
  const consumo = kmRodado >= 50 && litros >= 5 ? kmRodado / litros : null;

  const prevKm = getEl("prevKm");
  const prevValor = getEl("prevValor");
  const prevConsumo = getEl("prevConsumo");

  if (prevKm) prevKm.textContent = `${formatarNumero(kmRodado, 0)} km`;
  if (prevValor) prevValor.textContent = formatarMoeda(valorTotal);
  if (prevConsumo) {
    prevConsumo.textContent = consumo
      ? `${formatarNumero(consumo)} km/L`
      : "Dados insuficientes";
  }
}

function limparFormulario() {
  editandoId = null;

  if (getEl("data")) getEl("data").value = "";
  if (getEl("kmInicio")) getEl("kmInicio").value = "";
  if (getEl("kmFinal")) getEl("kmFinal").value = "";
  if (getEl("litros")) getEl("litros").value = "";
  if (getEl("preco")) getEl("preco").value = "";
  if (getEl("tanquePercentual")) getEl("tanquePercentual").value = "";

  atualizarPrevia();
}

function salvarRegistro() {
  const data = getEl("data")?.value?.trim() || "";
  const kmInicio = Number(getEl("kmInicio")?.value || 0);
  const kmFinal = Number(getEl("kmFinal")?.value || 0);
  const litros = Number(getEl("litros")?.value || 0);
  const preco = Number(getEl("preco")?.value || 0);
  const tanquePercentual = Number(getEl("tanquePercentual")?.value || 0);

  if (!data || kmInicio <= 0 || kmFinal <= 0 || litros <= 0 || preco <= 0) {
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
    data: normalizarData(data),
    kmInicio,
    kmFinal,
    litros,
    preco,
    tanquePercentual,
    statusPlanilha: "✅ Registro salvo no app"
  };

  if (editandoId) {
    dados = dados.map((item) => (item.id === editandoId ? registro : item));
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
  const item = dados.find((registro) => registro.id === id);
  if (!item) return;

  editandoId = id;

  if (getEl("data")) {
    if (String(item.data).includes("/")) {
      const [dia, mes, ano] = item.data.split("/");
      getEl("data").value = `${ano}-${mes.padStart(2, "0")}-${dia.padStart(2, "0")}`;
    } else {
      getEl("data").value = item.data;
    }
  }

  if (getEl("kmInicio")) getEl("kmInicio").value = item.kmInicio;
  if (getEl("kmFinal")) getEl("kmFinal").value = item.kmFinal;
  if (getEl("litros")) getEl("litros").value = item.litros;
  if (getEl("preco")) getEl("preco").value = item.preco;
  if (getEl("tanquePercentual")) getEl("tanquePercentual").value = item.tanquePercentual || 0;

  atualizarPrevia();
  ativarAba("relatorios");
}

function excluirRegistro(id) {
  if (!confirm("Deseja excluir este abastecimento?")) return;

  const dados = carregarDados().filter((item) => item.id !== id);
  salvarDados(dados);
  atualizarDashboard();
}

function ativarAba(nome) {
  document.querySelectorAll(".aba").forEach((el) => el.classList.remove("ativa"));
  document.querySelectorAll(".nav-btn").forEach((el) => el.classList.remove("ativo"));

  const aba = getEl(`aba-${nome}`);
  const botao = document.querySelector(`.nav-btn[data-aba="${nome}"]`);

  if (aba) aba.classList.add("ativa");
  if (botao) botao.classList.add("ativo");
}

function iniciarApp() {
  document.querySelectorAll(".nav-btn").forEach((btn) => {
    btn.addEventListener("click", () => ativarAba(btn.dataset.aba));
  });

  ["kmInicio", "kmFinal", "litros", "preco", "tanquePercentual"].forEach((id) => {
    const campo = getEl(id);
    if (campo) {
      campo.addEventListener("input", atualizarPrevia);
    }
  });

  const salvarBtn = getEl("salvarBtn");
  if (salvarBtn) {
    salvarBtn.addEventListener("click", salvarRegistro);
  }

  window.editarRegistro = editarRegistro;
  window.excluirRegistro = excluirRegistro;

  atualizarPrevia();
  atualizarDashboard();

  const primeiraAba = document.querySelector(".aba.ativa");
  if (!primeiraAba) {
    ativarAba("inicio");
  }
}

document.addEventListener("DOMContentLoaded", iniciarApp);
