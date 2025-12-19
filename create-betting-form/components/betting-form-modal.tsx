"use client"

import { useState } from "react"
import { X, Zap, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export function BettingFormModal() {
  const [valorapostado, setValorApostado] = useState("")
  const [odd, setOdd] = useState("")
  const [bonus, setBonus] = useState("")

  const calculateReturn = () => {
    const valor = Number.parseFloat(valorapostado) || 0
    const oddValue = Number.parseFloat(odd) || 0
    const bonusValue = Number.parseFloat(bonus) || 0

    const potentialReturn = valor * oddValue + bonusValue
    const potentialProfit = potentialReturn - valor

    return {
      return: potentialReturn,
      profit: potentialProfit,
    }
  }

  const { return: totalReturn, profit } = calculateReturn()

  return (
    <div className="w-full max-w-4xl bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950 rounded-2xl shadow-2xl border border-slate-700/50">
      <div className="flex items-center justify-between p-3 border-b border-slate-700/50">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center">
            <Zap className="w-5 h-5 text-black fill-black" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">Nova Aposta</h2>
            <p className="text-xs text-emerald-500">Configure sua entrada</p>
          </div>
        </div>
        <button className="w-10 h-10 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center transition-colors">
          <X className="w-5 h-5 text-slate-400" />
        </button>
      </div>

      <div className="p-3">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-4">
            {/* IDENTIFICAÇÃO Section */}
            <div className="space-y-2">
              <div className="flex items-center gap-1.5">
                <div className="w-1 h-5 bg-emerald-500 rounded" />
                <h3 className="text-emerald-500 font-semibold text-sm tracking-wide">IDENTIFICAÇÃO</h3>
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                <div className="space-y-1.5">
                  <Label className="text-slate-300 text-sm">Banca</Label>
                  <Select>
                    <SelectTrigger className="bg-slate-700/50 border-slate-600 text-slate-400">
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="banca1">Banca 1</SelectItem>
                      <SelectItem value="banca2">Banca 2</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-slate-300 text-sm">Casa de Aposta</Label>
                  <Select>
                    <SelectTrigger className="bg-slate-700/50 border-slate-600 text-slate-400">
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="casa1">Casa 1</SelectItem>
                      <SelectItem value="casa2">Casa 2</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* EVENTO Section */}
            <div className="space-y-2">
              <div className="flex items-center gap-1.5">
                <div className="w-1 h-5 bg-emerald-500 rounded" />
                <h3 className="text-emerald-500 font-semibold text-sm tracking-wide">EVENTO</h3>
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                <div className="space-y-1.5">
                  <Label className="text-slate-300 text-sm">Esporte</Label>
                  <Select>
                    <SelectTrigger className="bg-slate-700/50 border-slate-600 text-slate-400">
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="futebol">Futebol</SelectItem>
                      <SelectItem value="basquete">Basquete</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-slate-300 text-sm">Nome do Evento</Label>
                  <Input
                    placeholder="Ex: Flamengo vs Palmeiras"
                    className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-500"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-slate-300 text-sm">Data do Evento</Label>
                <Input
                  placeholder="DD/MM/AAAA"
                  className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-500"
                />
              </div>
            </div>

            {/* DETALHES DA APOSTA Section */}
            <div className="space-y-2">
              <div className="flex items-center gap-1.5">
                <div className="w-1 h-5 bg-emerald-500 rounded" />
                <h3 className="text-emerald-500 font-semibold text-sm tracking-wide">DETALHES DA APOSTA</h3>
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                <div className="space-y-1.5">
                  <Label className="text-slate-300 text-sm">Tipo de Aposta</Label>
                  <Select>
                    <SelectTrigger className="bg-slate-700/50 border-slate-600 text-slate-400">
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="simples">Simples</SelectItem>
                      <SelectItem value="multipla">Múltipla</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-slate-300 text-sm">Mercado</Label>
                  <Input
                    placeholder="Ex: Resultado Final"
                    className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-500"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-slate-300 text-sm">Descrição da Aposta</Label>
                <Input
                  placeholder="Vitória do Mandante"
                  className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                <div className="space-y-1.5">
                  <Label className="text-slate-300 text-sm">Tipster</Label>
                  <Select>
                    <SelectTrigger className="bg-slate-700/50 border-slate-600 text-slate-400">
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="tipster1">Tipster 1</SelectItem>
                      <SelectItem value="tipster2">Tipster 2</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-slate-300 text-sm">Status</Label>
                  <Select defaultValue="pendente">
                    <SelectTrigger className="bg-slate-700/50 border-slate-600 text-slate-400">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pendente">Pendente</SelectItem>
                      <SelectItem value="concluido">Concluído</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - VALORES */}
          <div className="space-y-3">
            <div className="flex items-center gap-1.5">
              <div className="w-1 h-5 bg-emerald-500 rounded" />
              <h3 className="text-emerald-500 font-semibold text-sm tracking-wide">VALORES</h3>
            </div>
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label className="text-slate-300 text-sm">Valor Apostado</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-500 font-semibold">R$</span>
                  <Input
                    type="number"
                    placeholder="0.00"
                    value={valorapostado}
                    onChange={(e) => setValorApostado(e.target.value)}
                    className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-500 pl-10"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-slate-300 text-sm">Odd</Label>
                <Input
                  type="number"
                  placeholder="0.00"
                  value={odd}
                  onChange={(e) => setOdd(e.target.value)}
                  className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-500"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-slate-300 text-sm">Bônus (Opcional)</Label>
                <Input
                  type="number"
                  placeholder="0.00"
                  value={bonus}
                  onChange={(e) => setBonus(e.target.value)}
                  className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-500"
                />
              </div>
            </div>

            {/* Return Calculation Box */}
            <div className="bg-slate-800/50 rounded-xl p-3 border border-slate-700/50 mt-3">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-sm text-slate-400">RETORNO</span>
                <span className="text-xs bg-emerald-500 text-white px-2 py-1 rounded-full font-semibold">LIVE</span>
              </div>
              <div className="text-2xl font-bold text-emerald-500 mb-1.5">R$ {totalReturn.toFixed(2)}</div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-400">Lucro potencial</span>
                <span className="text-emerald-500 font-semibold">R$ {profit.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-700/50">
          <p className="text-xs text-slate-500">Todos os campos são obrigatórios</p>
          <div className="flex gap-2">
            <Button variant="outline" className="bg-transparent border-slate-600 text-slate-300 hover:bg-slate-800">
              Cancelar
            </Button>
            <Button className="bg-emerald-500 hover:bg-emerald-600 text-black font-semibold">
              Criar Aposta
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
