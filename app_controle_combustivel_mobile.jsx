import React from 'react';
import {
  Download,
  PlusCircle,
  BarChart3,
  History,
  CarFront,
  Fuel,
  Wallet,
  Gauge,
  Trash2,
  Pencil,
  Smartphone,
  CalendarDays,
} from 'lucide-react';

export default function FuelControlApp() {
  const STORAGE_KEY = 'fuel-app-data-v2';

  const dadosIniciais = [
    {
      id: 1,
      data: '17/03/2026',
      kmInicio: 163218,
      kmFinal: 163224,
      litros: 28.99,
      preco: 4.29,
      tanquePercentual: 45,
      statusPlanilha: '❌ Consumo muito alto, verificar',
    },
    {
      id: 2,
      data: '18/03/2026',
      kmInicio: 163224,
      kmFinal: 163480,
      litros: 24,
      preco: 4.99,
      tanquePercentual: 78,
      statusPlanilha: '✅ Registro salvo no app',
    },
  ];

  function normalizarData(valor) {
    if (!valor) return '';
    if (valor.includes('-')) {
      const [ano, mes, dia] = valor.split('-');
      return `${dia}/${mes}/${ano}`;
    }
    return valor;
  }

  function dataParaInput(valor) {
    if (!valor) return '';
    if (valor.includes('/')) {
      const [dia, mes, ano] = valor.split('/');
      return `${ano}-${mes.padStart(2, '0')}-${dia.padStart(2, '0')}`;
    }
    return valor;
  }

  function converterDataParaDate(data) {
    if (!data) return new Date(0);

    if (data.includes('/')) {
      const [dia, mes, ano] = data.split('/').map(Number);
      return new Date(ano, mes - 1, dia);
    }

    if (data.includes('-')) {
      const [ano, mes, dia] = data.split('-').map(Number);
      return new Date(ano, mes - 1, dia);
    }

    return new Date(data);
  }

  const [aba, setAba] = React.useState('dashboard');
  const [abastecimentos, setAbastecimentos] = React.useState(() => {
    if (typeof window === 'undefined') return dadosIniciais;
    try {
      const salvo = window.localStorage.getItem(STORAGE_KEY);
      return salvo ? JSON.parse(salvo) : dadosIniciais;
    } catch {
      return dadosIniciais;
    }
  });

  const [editandoId, setEditandoId] = React.useState(null);
  const [form, setForm] = React.useState({
    data: '',
    kmInicio: '',
    kmFinal: '',
    litros: '',
    preco: '',
    tanquePercentual: '0',
  });

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(abastecimentos));
    }
  }, [abastecimentos]);

  const linhas = abastecimentos
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
        custoKm,
      };
    })
    .sort((a, b) => converterDataParaDate(b.data) - converterDataParaDate(a.data));

  const totalGasto = linhas.reduce((s, i) => s + i.valorTotal, 0);
  const totalLitros = linhas.reduce((s, i) => s + i.litros, 0);
  const kmRodados = linhas.reduce((s, i) => s + Math.max(i.kmRodado, 0), 0);
  const consumosValidos = linhas.filter((i) => i.consumo !== null).map((i) => i.consumo);
  const consumoMedio = consumosValidos.length
    ? consumosValidos.reduce((s, v) => s + v, 0) / consumosValidos.length
    : 0;
  const custoKmMedio = kmRodados > 0 ? totalGasto / kmRodados : 0;
  const ultimoRegistro = linhas[0] || null;
  const tanqueAtual = ultimoRegistro ? ultimoRegistro.tanquePercentual : 0;
  const autonomia = consumoMedio * 51;

  const status =
    consumoMedio === 0
      ? { texto: 'Sem dados suficientes', classe: 'bg-slate-200 text-slate-700' }
      : consumoMedio < 5
        ? { texto: 'Alto consumo', classe: 'bg-red-100 text-red-700' }
        : consumoMedio < 10
          ? { texto: 'Consumo médio', classe: 'bg-yellow-100 text-yellow-700' }
          : { texto: 'Econômico', classe: 'bg-green-100 text-green-700' };

  const maxConsumo = Math.max(...consumosValidos, 1);

  const formatarMoeda = (v) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0);

  const formatarNumero = (v, casas = 2) =>
    Number(v || 0).toLocaleString('pt-BR', {
      minimumFractionDigits: casas,
      maximumFractionDigits: casas,
    });

  function Card({ titulo, valor, subtitulo, icon: Icon, destaque = false }) {
    return (
      <div
        className={`rounded-3xl border p-4 shadow-sm ${
          destaque
            ? 'bg-slate-900 text-white border-slate-900'
            : 'bg-white text-slate-900 border-slate-200'
        }`}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className={`text-sm ${destaque ? 'text-white/70' : 'text-slate-500'}`}>{titulo}</div>
            <div className="text-2xl font-bold mt-1 break-words">{valor}</div>
            {subtitulo ? (
              <div className={`text-xs mt-1 ${destaque ? 'text-white/70' : 'text-slate-500'}`}>
                {subtitulo}
              </div>
            ) : null}
          </div>
          {Icon ? (
            <div className={`rounded-2xl p-3 ${destaque ? 'bg-white/10' : 'bg-slate-100'}`}>
              <Icon className={`w-5 h-5 ${destaque ? 'text-white' : 'text-slate-700'}`} />
            </div>
          ) : null}
        </div>
      </div>
    );
  }

  function Campo({ label, value, onChange, type = 'text', placeholder, min, max, step }) {
    return (
      <label className="block">
        <div className="text-sm text-slate-500 mb-2">{label}</div>
        <input
          type={type}
          value={value}
          placeholder={placeholder}
          min={min}
          max={max}
          step={step}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none focus:ring-2 focus:ring-slate-300"
        />
      </label>
    );
  }

  const kmPreview = Number(form.kmFinal || 0) - Number(form.kmInicio || 0);
  const litrosPreview = Number(form.litros || 0);
  const precoPreview = Number(form.preco || 0);
  const consumoPreview = kmPreview >= 50 && litrosPreview >= 5 ? kmPreview / litrosPreview : null;
  const valorPreview = litrosPreview * precoPreview;

  function limparFormulario() {
    setForm({
      data: '',
      kmInicio: '',
      kmFinal: '',
      litros: '',
      preco: '',
      tanquePercentual: '0',
    });
    setEditandoId(null);
  }

  function validarFormulario() {
    if (!form.data || !form.kmInicio || !form.kmFinal || !form.litros || !form.preco) {
      alert('Preencha todos os campos obrigatórios.');
      return false;
    }

    if (Number(form.kmFinal) <= Number(form.kmInicio)) {
      alert('O KM final precisa ser maior que o KM início.');
      return false;
    }

    if (Number(form.litros) <= 0 || Number(form.preco) <= 0) {
      alert('Litros e preço por litro devem ser maiores que zero.');
      return false;
    }

    if (Number(form.tanquePercentual || 0) < 0 || Number(form.tanquePercentual || 0) > 100) {
      alert('O tanque deve estar entre 0% e 100%.');
      return false;
    }

    return true;
  }

  function salvarAbastecimento() {
    if (!validarFormulario()) return;

    const payload = {
      id: editandoId ?? Date.now(),
      data: normalizarData(form.data),
      kmInicio: Number(form.kmInicio),
      kmFinal: Number(form.kmFinal),
      litros: Number(form.litros),
      preco: Number(form.preco),
      tanquePercentual: Number(form.tanquePercentual || 0),
      statusPlanilha: '✅ Registro salvo no app',
    };

    if (editandoId) {
      setAbastecimentos((atual) => atual.map((item) => (item.id === editandoId ? payload : item)));
    } else {
      setAbastecimentos((atual) => [payload, ...atual]);
    }

    limparFormulario();
    setAba('historico');
  }

  function editar(item) {
    setForm({
      data: dataParaInput(item.data),
      kmInicio: String(item.kmInicio),
      kmFinal: String(item.kmFinal),
      litros: String(item.litros),
      preco: String(item.preco),
      tanquePercentual: String(item.tanquePercentual || 0),
    });
    setEditandoId(item.id);
    setAba('cadastro');
  }

  function excluir(id) {
    if (typeof window !== 'undefined') {
      const ok = window.confirm('Deseja excluir este abastecimento?');
      if (!ok) return;
    }

    setAbastecimentos((atual) => atual.filter((item) => item.id !== id));
    if (editandoId === id) limparFormulario();
  }

  function restaurarBase() {
    if (typeof window !== 'undefined') {
      const ok = window.confirm('Deseja restaurar os dados iniciais do arquivo?');
      if (!ok) return;
    }

    setAbastecimentos(dadosIniciais);
    limparFormulario();
    setAba('dashboard');
  }

  function exportarDados() {
    const conteudo = JSON.stringify(abastecimentos, null, 2);
    const blob = new Blob([conteudo], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'controle-combustivel-backup.json';
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-200 via-slate-100 to-white flex justify-center p-3 sm:p-4 lg:p-8">
      <div className="w-full max-w-md lg:max-w-6xl">
        <div className="grid grid-cols-1 lg:grid-cols-[380px_minmax(0,1fr)] gap-5">
          <div className="lg:sticky lg:top-8 lg:self-start">
            <div className="rounded-[2rem] bg-slate-900 text-white p-5 shadow-xl border border-slate-800 overflow-hidden relative">
              <div className="absolute -right-8 -top-8 w-32 h-32 rounded-full bg-white/10" />
              <div className="absolute right-10 bottom-0 w-24 h-24 rounded-full bg-white/5" />

              <div className="relative z-10">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm opacity-80">Controle de Combustível</div>
                    <div className="text-3xl font-bold mt-1">Ford Ka 2026</div>
                    <div className="mt-2 text-xs text-white/70">
                      Versão responsiva com dashboard, cadastro e histórico
                    </div>
                  </div>
                  <div className="rounded-2xl bg-white/10 p-3">
                    <CarFront className="w-6 h-6" />
                  </div>
                </div>

                <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-3">
                  <Card
                    titulo="Total gasto"
                    valor={formatarMoeda(totalGasto)}
                    icon={Wallet}
                    destaque
                  />
                  <Card
                    titulo="Tanque atual"
                    valor={`${formatarNumero(tanqueAtual, 0)}%`}
                    subtitulo="baseado no último registro"
                    icon={Fuel}
                    destaque
                  />
                </div>

                <div className="mt-4 flex gap-2 flex-wrap">
                  <button
                    onClick={exportarDados}
                    className="inline-flex items-center gap-2 px-3 py-2 rounded-full text-sm font-medium bg-white text-slate-900"
                  >
                    <Download className="w-4 h-4" /> Exportar backup
                  </button>
                  <button
                    onClick={restaurarBase}
                    className="inline-flex items-center gap-2 px-3 py-2 rounded-full text-sm font-medium bg-white/10 text-white border border-white/10"
                  >
                    <History className="w-4 h-4" /> Restaurar base
                  </button>
                </div>

                <div className="rounded-3xl bg-white/10 border border-white/10 p-4 mt-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="text-sm text-white/70">Instalar no celular</div>
                      <div className="font-semibold mt-1">
                        Abra no navegador e use “Adicionar à tela inicial”.
                      </div>
                    </div>
                    <div className="rounded-2xl bg-white/10 p-3">
                      <Smartphone className="w-6 h-6" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 mt-4">
              <button
                onClick={() => setAba('dashboard')}
                className={`rounded-2xl px-3 py-3 text-sm font-semibold border flex items-center justify-center gap-2 ${
                  aba === 'dashboard'
                    ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                    : 'bg-white text-slate-700 border-slate-200'
                }`}
              >
                <BarChart3 className="w-4 h-4" /> Dashboard
              </button>

              <button
                onClick={() => setAba('cadastro')}
                className={`rounded-2xl px-3 py-3 text-sm font-semibold border flex items-center justify-center gap-2 ${
                  aba === 'cadastro'
                    ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                    : 'bg-white text-slate-700 border-slate-200'
                }`}
              >
                <PlusCircle className="w-4 h-4" /> Cadastro
              </button>

              <button
                onClick={() => setAba('historico')}
                className={`rounded-2xl px-3 py-3 text-sm font-semibold border flex items-center justify-center gap-2 ${
                  aba === 'historico'
                    ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                    : 'bg-white text-slate-700 border-slate-200'
                }`}
              >
                <History className="w-4 h-4" /> Histórico
              </button>
            </div>
          </div>

          <div>
            {aba === 'dashboard' ? (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                  <Card titulo="KM rodados" valor={`${formatarNumero(kmRodados, 0)} km`} icon={Gauge} />
                  <Card titulo="Consumo médio" valor={`${formatarNumero(consumoMedio)} km/L`} icon={Fuel} />
                  <Card
                    titulo="Custo por KM"
                    valor={formatarMoeda(custoKmMedio)}
                    subtitulo="por quilômetro"
                    icon={BarChart3}
                  />
                  <Card
                    titulo="Total litros"
                    valor={`${formatarNumero(totalLitros)} L`}
                    subtitulo="abastecidos"
                    icon={Wallet}
                  />
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 mt-4">
                  <div className="rounded-3xl bg-white shadow-sm border border-slate-200 p-5">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <div className="text-sm text-slate-500">Status inteligente</div>
                        <div
                          className={`inline-flex mt-2 px-3 py-1 rounded-full text-sm font-semibold ${status.classe}`}
                        >
                          {status.texto}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-slate-500">Autonomia</div>
                        <div className="text-xl font-bold text-slate-900">
                          {formatarNumero(autonomia, 0)} km
                        </div>
                        <div className="text-[10px] text-slate-500">tanque estimado de 51 L</div>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-3xl bg-white shadow-sm border border-slate-200 p-5">
                    <div className="text-sm text-slate-500">Último abastecimento</div>
                    {ultimoRegistro ? (
                      <div className="mt-3 grid grid-cols-2 gap-3">
                        <div className="rounded-2xl bg-slate-50 border border-slate-200 p-3">
                          <div className="text-slate-400 text-xs">Data</div>
                          <div className="font-bold text-slate-900 flex items-center gap-2 mt-1">
                            <CalendarDays className="w-4 h-4" />
                            {ultimoRegistro.data}
                          </div>
                        </div>
                        <div className="rounded-2xl bg-slate-50 border border-slate-200 p-3">
                          <div className="text-slate-400 text-xs">Valor</div>
                          <div className="font-bold text-slate-900 mt-1">
                            {formatarMoeda(ultimoRegistro.valorTotal)}
                          </div>
                        </div>
                        <div className="rounded-2xl bg-slate-50 border border-slate-200 p-3">
                          <div className="text-slate-400 text-xs">Litros</div>
                          <div className="font-bold text-slate-900 mt-1">
                            {formatarNumero(ultimoRegistro.litros)} L
                          </div>
                        </div>
                        <div className="rounded-2xl bg-slate-50 border border-slate-200 p-3">
                          <div className="text-slate-400 text-xs">Consumo</div>
                          <div className="font-bold text-slate-900 mt-1">
                            {ultimoRegistro.consumo
                              ? `${formatarNumero(ultimoRegistro.consumo)} km/L`
                              : 'Insuficiente'}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-sm text-slate-500 mt-3">Nenhum registro encontrado.</div>
                    )}
                  </div>
                </div>

                <div className="rounded-3xl bg-white shadow-sm border border-slate-200 p-5 mt-4">
                  <div className="text-sm text-slate-500 mb-3">Consumo ao longo do tempo</div>
                  <div className="text-xs text-slate-400 mb-4">Baseado nos registros salvos no app</div>

                  <div className="h-56 flex items-end gap-3 overflow-x-auto">
                    {linhas.length ? (
                      linhas.map((item) => {
                        const altura = item.consumo ? Math.max((item.consumo / maxConsumo) * 100, 8) : 8;
                        return (
                          <div key={item.id} className="min-w-[64px] flex-1 flex flex-col items-center gap-2">
                            <div className="text-[10px] text-slate-500">{item.data.slice(0, 5)}</div>
                            <div
                              className="w-full rounded-t-2xl bg-slate-900 transition-all"
                              style={{ height: `${altura}%` }}
                            />
                            <div className="text-[10px] text-slate-600">
                              {item.consumo ? formatarNumero(item.consumo, 1) : '-'}
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="text-sm text-slate-500">Sem registros.</div>
                    )}
                  </div>
                </div>
              </>
            ) : null}

            {aba === 'cadastro' ? (
              <div className="rounded-3xl bg-white shadow-sm border border-slate-200 p-4 sm:p-5 space-y-4">
                <div>
                  <div className="text-lg font-bold text-slate-900">
                    {editandoId ? 'Editar abastecimento' : 'Novo abastecimento'}
                  </div>
                  <div className="text-sm text-slate-500">
                    Os dados ficam salvos no navegador deste dispositivo.
                  </div>
                </div>

                <Campo
                  label="Data"
                  value={form.data}
                  onChange={(v) => setForm({ ...form, data: v })}
                  type="date"
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Campo
                    label="KM início"
                    value={form.kmInicio}
                    onChange={(v) => setForm({ ...form, kmInicio: v })}
                    type="number"
                  />
                  <Campo
                    label="KM final"
                    value={form.kmFinal}
                    onChange={(v) => setForm({ ...form, kmFinal: v })}
                    type="number"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <Campo
                    label="Litros"
                    value={form.litros}
                    onChange={(v) => setForm({ ...form, litros: v })}
                    type="number"
                    step="0.01"
                  />
                  <Campo
                    label="R$/Litro"
                    value={form.preco}
                    onChange={(v) => setForm({ ...form, preco: v })}
                    type="number"
                    step="0.01"
                  />
                  <Campo
                    label="Tanque (%)"
                    value={form.tanquePercentual}
                    onChange={(v) => setForm({ ...form, tanquePercentual: v })}
                    type="number"
                    min="0"
                    max="100"
                  />
                </div>

                <div className="rounded-2xl bg-slate-50 border border-slate-200 p-4">
                  <div className="text-sm text-slate-500 mb-2">Prévia automática</div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                    <div className="rounded-2xl bg-white border border-slate-200 p-3">
                      <div className="text-slate-400">KM rodado</div>
                      <div className="font-bold text-slate-900">{formatarNumero(kmPreview, 0)} km</div>
                    </div>
                    <div className="rounded-2xl bg-white border border-slate-200 p-3">
                      <div className="text-slate-400">Valor total</div>
                      <div className="font-bold text-slate-900">{formatarMoeda(valorPreview)}</div>
                    </div>
                    <div className="rounded-2xl bg-white border border-slate-200 p-3 sm:col-span-2">
                      <div className="text-slate-400">Consumo estimado</div>
                      <div className="font-bold text-slate-900">
                        {consumoPreview
                          ? `${formatarNumero(consumoPreview)} km/L`
                          : 'Dados insuficientes para cálculo'}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    onClick={salvarAbastecimento}
                    className="w-full rounded-2xl bg-slate-900 text-white py-3 font-semibold shadow-sm flex items-center justify-center gap-2"
                  >
                    <PlusCircle className="w-4 h-4" /> {editandoId ? 'Atualizar' : 'Salvar'}
                  </button>
                  <button
                    onClick={limparFormulario}
                    className="w-full rounded-2xl bg-white border border-slate-200 text-slate-900 py-3 font-semibold"
                  >
                    Limpar
                  </button>
                </div>
              </div>
            ) : null}

            {aba === 'historico' ? (
              <div className="rounded-3xl bg-white shadow-sm border border-slate-200 p-4 sm:p-5">
                <div className="flex items-center justify-between mb-4 gap-3">
                  <div className="text-sm text-slate-500">Abastecimentos salvos</div>
                  <div className="text-sm font-medium text-slate-900">{formatarNumero(totalLitros)} L</div>
                </div>

                <div className="space-y-3">
                  {linhas.length ? (
                    linhas.map((item) => (
                      <div key={item.id} className="rounded-2xl bg-slate-50 border border-slate-200 p-3 sm:p-4">
                        <div className="flex items-center justify-between gap-3 flex-wrap">
                          <div className="font-semibold text-slate-900">{item.data}</div>
                          <div className="text-sm font-semibold text-slate-900">
                            {formatarMoeda(item.valorTotal)}
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3 text-sm text-slate-600">
                          <div>
                            <div className="text-slate-400">KM rodado</div>
                            <div className="font-semibold text-slate-800">
                              {formatarNumero(item.kmRodado, 0)} km
                            </div>
                          </div>
                          <div>
                            <div className="text-slate-400">Litros</div>
                            <div className="font-semibold text-slate-800">
                              {formatarNumero(item.litros)} L
                            </div>
                          </div>
                          <div>
                            <div className="text-slate-400">Consumo</div>
                            <div className="font-semibold text-slate-800">
                              {item.consumo ? `${formatarNumero(item.consumo)} km/L` : 'Insuficiente'}
                            </div>
                          </div>
                        </div>

                        <div className="mt-3 flex items-start sm:items-center justify-between gap-3 flex-col sm:flex-row">
                          <span
                            className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                              item.statusPlanilha?.includes('OK') || item.statusPlanilha?.includes('salvo')
                                ? 'bg-green-100 text-green-700'
                                : item.statusPlanilha?.includes('alto') || item.statusPlanilha?.includes('❌')
                                  ? 'bg-red-100 text-red-700'
                                  : 'bg-yellow-100 text-yellow-700'
                            }`}
                          >
                            {item.statusPlanilha || 'Sem status'}
                          </span>

                          <div className="flex gap-2 w-full sm:w-auto">
                            <button
                              onClick={() => editar(item)}
                              className="flex-1 sm:flex-none px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-900 inline-flex items-center justify-center gap-1"
                            >
                              <Pencil className="w-3.5 h-3.5" /> Editar
                            </button>
                            <button
                              onClick={() => excluir(item.id)}
                              className="flex-1 sm:flex-none px-3 py-2 rounded-xl bg-red-600 text-white text-xs font-semibold inline-flex items-center justify-center gap-1"
                            >
                              <Trash2 className="w-3.5 h-3.5" /> Excluir
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-sm text-slate-500">Nenhum abastecimento salvo.</div>
                  )}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
