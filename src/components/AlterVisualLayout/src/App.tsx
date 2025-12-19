import { useState } from 'react';
import { X, TrendingUp, BarChart3, Calculator } from 'lucide-react';
import { Button } from './components/ui/button';
import { Input } from './components/ui/input';
import { Label } from './components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './components/ui/select';

export default function App() {
  const [isOpen, setIsOpen] = useState(true);
  const [valor, setValor] = useState('');
  const [odd, setOdd] = useState('');
  const [bonus, setBonus] = useState('');

  const retornoPotencial = () => {
    const v = parseFloat(valor) || 0;
    const o = parseFloat(odd) || 0;
    const b = parseFloat(bonus) || 0;
    return ((v + b) * o).toFixed(2);
  };

  const lucroLiquido = () => {
    const ret = parseFloat(retornoPotencial());
    const v = parseFloat(valor) || 0;
    return (ret - v).toFixed(2);
  };

  const roi = () => {
    const lucro = parseFloat(lucroLiquido());
    const v = parseFloat(valor) || 0;
    if (v === 0) return '0.00';
    return ((lucro / v) * 100).toFixed(2);
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-6">
      {isOpen && (
        <div className="w-full max-w-6xl bg-slate-950 rounded-3xl border border-emerald-500/30 shadow-[0_0_100px_rgba(16,185,129,0.2)] overflow-hidden">
          {/* Header Futurista */}
          <div className="relative px-8 py-6 bg-gradient-to-r from-emerald-500/10 via-emerald-400/5 to-transparent border-b border-emerald-500/20">
            <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-emerald-400/50 to-transparent"></div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="relative w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-400 via-emerald-500 to-emerald-600 flex items-center justify-center shadow-xl shadow-emerald-500/40">
                  <BarChart3 className="w-7 h-7 text-black" />
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-400 rounded-full animate-ping"></div>
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-400 rounded-full"></div>
                </div>
                <div>
                  <h1 className="text-white text-3xl tracking-tight">Nova Aposta</h1>
                  <p className="text-emerald-400/70 text-sm mt-1">Registre e calcule seu investimento esportivo</p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="w-11 h-11 rounded-xl bg-slate-900 hover:bg-emerald-500/10 border border-slate-800 hover:border-emerald-500/40 text-slate-500 hover:text-emerald-400 flex items-center justify-center transition-all duration-300"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Grid Layout */}
          <div className="grid grid-cols-12 gap-8 p-8">
            {/* Coluna Esquerda - Formulário Principal */}
            <div className="col-span-8 space-y-6">
              {/* Section: Identificação */}
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-6 w-1 bg-gradient-to-b from-emerald-400 to-emerald-600 rounded-full"></div>
                  <h2 className="text-emerald-400 text-sm uppercase tracking-[0.2em]">Identificação</h2>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-slate-400 text-xs mb-2.5 block">Banca *</Label>
                    <Select>
                      <SelectTrigger className="h-12 bg-slate-900/80 border-slate-800 text-white hover:border-emerald-500/40 focus:border-emerald-500 transition-all duration-300 rounded-xl shadow-sm">
                        <SelectValue placeholder="Selecione a banca" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="banca1">Banca Principal</SelectItem>
                        <SelectItem value="banca2">Banca Secundária</SelectItem>
                        <SelectItem value="banca3">Banca de Teste</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-slate-400 text-xs mb-2.5 block">Casa de Aposta *</Label>
                    <Select>
                      <SelectTrigger className="h-12 bg-slate-900/80 border-slate-800 text-white hover:border-emerald-500/40 focus:border-emerald-500 transition-all duration-300 rounded-xl shadow-sm">
                        <SelectValue placeholder="Selecione a casa" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="bet365">Bet365</SelectItem>
                        <SelectItem value="betano">Betano</SelectItem>
                        <SelectItem value="betfair">Betfair</SelectItem>
                        <SelectItem value="sportingbet">Sportingbet</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Section: Evento */}
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-6 w-1 bg-gradient-to-b from-emerald-400 to-emerald-600 rounded-full"></div>
                  <h2 className="text-emerald-400 text-sm uppercase tracking-[0.2em]">Evento Esportivo</h2>
                </div>
                
                <div className="space-y-4">
                  <div className="grid grid-cols-4 gap-4">
                    <div>
                      <Label className="text-slate-400 text-xs mb-2.5 block">Esporte *</Label>
                      <Select>
                        <SelectTrigger className="h-12 bg-slate-900/80 border-slate-800 text-white hover:border-emerald-500/40 focus:border-emerald-500 transition-all duration-300 rounded-xl shadow-sm">
                          <SelectValue placeholder="Tipo" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="futebol">⚽ Futebol</SelectItem>
                          <SelectItem value="basquete">🏀 Basquete</SelectItem>
                          <SelectItem value="tenis">🎾 Tênis</SelectItem>
                          <SelectItem value="volei">🏐 Vôlei</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="col-span-3">
                      <Label className="text-slate-400 text-xs mb-2.5 block">Nome do Evento *</Label>
                      <Input
                        placeholder="Ex: Flamengo vs Palmeiras - Brasileirão 2025"
                        className="h-12 bg-slate-900/80 border-slate-800 text-white hover:border-emerald-500/40 focus:border-emerald-500 transition-all duration-300 rounded-xl shadow-sm placeholder:text-slate-600"
                      />
                    </div>
                  </div>

                  <div>
                    <Label className="text-slate-400 text-xs mb-2.5 block">Data do Evento *</Label>
                    <Input
                      type="text"
                      placeholder="DD/MM/AAAA"
                      className="h-12 bg-slate-900/80 border-slate-800 text-white hover:border-emerald-500/40 focus:border-emerald-500 transition-all duration-300 rounded-xl shadow-sm placeholder:text-slate-600"
                    />
                  </div>
                </div>
              </div>

              {/* Section: Aposta */}
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-6 w-1 bg-gradient-to-b from-emerald-400 to-emerald-600 rounded-full"></div>
                  <h2 className="text-emerald-400 text-sm uppercase tracking-[0.2em]">Detalhes da Aposta</h2>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-slate-400 text-xs mb-2.5 block">Descrição da Aposta *</Label>
                    <Input
                      placeholder="Ex: Vitória do Flamengo"
                      className="h-12 bg-slate-900/80 border-slate-800 text-white hover:border-emerald-500/40 focus:border-emerald-500 transition-all duration-300 rounded-xl shadow-sm placeholder:text-slate-600"
                    />
                  </div>

                  <div>
                    <Label className="text-slate-400 text-xs mb-2.5 block">Mercado *</Label>
                    <Input
                      placeholder="Ex: Resultado Final"
                      className="h-12 bg-slate-900/80 border-slate-800 text-white hover:border-emerald-500/40 focus:border-emerald-500 transition-all duration-300 rounded-xl shadow-sm placeholder:text-slate-600"
                    />
                  </div>

                  <div>
                    <Label className="text-slate-400 text-xs mb-2.5 block">Tipo de Aposta *</Label>
                    <Select>
                      <SelectTrigger className="h-12 bg-slate-900/80 border-slate-800 text-white hover:border-emerald-500/40 focus:border-emerald-500 transition-all duration-300 rounded-xl shadow-sm">
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="simples">Aposta Simples</SelectItem>
                        <SelectItem value="multipla">Aposta Múltipla</SelectItem>
                        <SelectItem value="sistema">Sistema</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-slate-400 text-xs mb-2.5 block">Status *</Label>
                    <Select>
                      <SelectTrigger className="h-12 bg-slate-900/80 border-slate-800 text-white hover:border-emerald-500/40 focus:border-emerald-500 transition-all duration-300 rounded-xl shadow-sm">
                        <SelectValue placeholder="Pendente" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pendente">⏳ Pendente</SelectItem>
                        <SelectItem value="ganho">✅ Ganho</SelectItem>
                        <SelectItem value="perdido">❌ Perdido</SelectItem>
                        <SelectItem value="cancelado">🚫 Cancelado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="col-span-2">
                    <Label className="text-slate-400 text-xs mb-2.5 block">Tipster</Label>
                    <Select>
                      <SelectTrigger className="h-12 bg-slate-900/80 border-slate-800 text-white hover:border-emerald-500/40 focus:border-emerald-500 transition-all duration-300 rounded-xl shadow-sm">
                        <SelectValue placeholder="Selecione um tipster (opcional)" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="tipster1">Tipster Premium</SelectItem>
                        <SelectItem value="tipster2">Tipster Expert</SelectItem>
                        <SelectItem value="tipster3">Tipster Pro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </div>

            {/* Coluna Direita - Valores e Cálculos */}
            <div className="col-span-4 space-y-5">
              {/* Card de Valores */}
              <div className="p-6 bg-gradient-to-br from-slate-900 to-slate-900/50 rounded-2xl border border-slate-800 shadow-xl">
                <div className="flex items-center gap-2 mb-5">
                  <Calculator className="w-4 h-4 text-emerald-400" />
                  <h3 className="text-emerald-400 text-sm uppercase tracking-[0.2em]">Valores</h3>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <Label className="text-slate-400 text-xs mb-2.5 block">Valor Apostado *</Label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-400 text-sm font-medium">R$</span>
                      <Input
                        type="number"
                        placeholder="0.00"
                        value={valor}
                        onChange={(e) => setValor(e.target.value)}
                        className="h-14 bg-slate-800 border-slate-700 text-white text-lg pl-11 focus:border-emerald-500 rounded-xl shadow-sm placeholder:text-slate-600"
                      />
                    </div>
                  </div>

                  <div>
                    <Label className="text-slate-400 text-xs mb-2.5 block">Odd *</Label>
                    <Input
                      type="number"
                      placeholder="0.00"
                      value={odd}
                      onChange={(e) => setOdd(e.target.value)}
                      className="h-14 bg-slate-800 border-slate-700 text-white text-lg focus:border-emerald-500 rounded-xl shadow-sm placeholder:text-slate-600"
                    />
                  </div>

                  <div>
                    <Label className="text-slate-400 text-xs mb-2.5 block">Bônus</Label>
                    <Input
                      type="number"
                      placeholder="0.00"
                      value={bonus}
                      onChange={(e) => setBonus(e.target.value)}
                      className="h-14 bg-slate-800 border-slate-700 text-white text-lg focus:border-emerald-500 rounded-xl shadow-sm placeholder:text-slate-600"
                    />
                  </div>
                </div>
              </div>

              {/* Card de Resultados */}
              <div className="p-6 bg-gradient-to-br from-emerald-500/15 via-emerald-500/10 to-emerald-500/5 rounded-2xl border border-emerald-500/30 shadow-xl relative overflow-hidden">
                <div className="absolute -top-20 -right-20 w-40 h-40 bg-emerald-400/10 rounded-full blur-3xl"></div>
                <div className="relative">
                  <div className="flex items-center gap-2 mb-5">
                    <TrendingUp className="w-4 h-4 text-emerald-400" />
                    <h3 className="text-emerald-400 text-sm uppercase tracking-[0.2em]">Projeção</h3>
                    <div className="ml-auto flex items-center gap-1.5">
                      <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
                      <span className="text-emerald-400 text-xs uppercase">Live</span>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <p className="text-slate-400 text-xs mb-1">Retorno Potencial</p>
                      <p className="text-emerald-400 text-4xl tracking-tight">R$ {retornoPotencial()}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-emerald-500/20">
                      <div>
                        <p className="text-slate-400 text-xs mb-1">Lucro</p>
                        <p className="text-emerald-400 text-xl">R$ {lucroLiquido()}</p>
                      </div>
                      <div>
                        <p className="text-slate-400 text-xs mb-1">ROI</p>
                        <p className="text-emerald-400 text-xl">{roi()}%</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-8 py-6 border-t border-emerald-500/20 bg-slate-950/50">
            <div className="flex items-center justify-between">
              <p className="text-slate-600 text-sm">* Campos obrigatórios</p>
              <div className="flex gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsOpen(false)}
                  className="h-12 px-8 bg-transparent border-slate-800 text-slate-400 hover:bg-slate-900 hover:text-white hover:border-slate-700 rounded-xl transition-all duration-300"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  className="h-12 px-10 bg-gradient-to-r from-emerald-400 via-emerald-500 to-emerald-600 hover:from-emerald-500 hover:via-emerald-600 hover:to-emerald-700 text-black rounded-xl shadow-lg shadow-emerald-500/30 transition-all duration-300"
                >
                  Criar Aposta
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
