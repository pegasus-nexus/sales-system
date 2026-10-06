with open('frontend/src/components/MonthlyEvolutionView.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Add to Transacciones section
old_tx_section = '''<div className="flex items-center gap-2 text-xs font-bold pt-2 border-t border-gray-100">
                        <div className={cn(
                            "flex items-center gap-0.5 px-2 py-1 rounded-md",
                            isTxPositive ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"
                        )}>
                            {isTxPositive ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                            <span>{isTxPositive ? '+' : ''}{resumen_mom.diferencia_tx_pct}%</span>
                        </div>
                        <span className="text-gray-400">vs {resumen_mom.transacciones_anterior.toLocaleString()} {resumen_mom.periodo_anterior ? MESES[parseInt(resumen_mom.periodo_anterior.split('-')[1]) - 1] : 'mes ant.'}</span>
                    </div>'''

new_tx_section = '''<div className="flex items-center gap-2 text-xs font-bold pt-2 border-t border-gray-100">
                        <div className={cn(
                            "flex items-center gap-0.5 px-2 py-1 rounded-md",
                            isTxPositive ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"
                        )}>
                            {isTxPositive ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                            <span>{isTxPositive ? '+' : ''}{resumen_mom.diferencia_tx_pct}%</span>
                        </div>
                        <span className="text-gray-400">vs {resumen_mom.transacciones_anterior.toLocaleString()} {resumen_mom.periodo_anterior ? MESES[parseInt(resumen_mom.periodo_anterior.split('-')[1]) - 1] : 'mes ant.'}</span>
                    </div>
                    
                    <div className="mt-3 pt-3 border-t border-gray-100 flex justify-between items-center text-sm">
                        <span className="text-gray-500 font-medium">Prod. Vendidos</span>
                        <div className="flex items-center gap-2">
                            <span className="font-bold text-gray-900">{resumen_mom.unidades_actual.toLocaleString()}</span>
                            <div className={cn(
                                "flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold",
                                resumen_mom.diferencia_unidades_pct >= 0 ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"
                            )}>
                                {resumen_mom.diferencia_unidades_pct >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                                {resumen_mom.diferencia_unidades_pct >= 0 ? '+' : ''}{resumen_mom.diferencia_unidades_pct}%
                            </div>
                        </div>
                    </div>'''

# Add to Ticket Promedio section
old_tkt_section = '''<div className="flex items-center gap-2 text-xs font-bold pt-2 border-t border-gray-100">
                        <div className={cn(
                            "flex items-center gap-0.5 px-2 py-1 rounded-md",
                            isTktPositive ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"
                        )}>
                            {isTktPositive ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                            <span>{isTktPositive ? '+' : ''}{resumen_mom.diferencia_tkt_pct}%</span>
                        </div>
                        <span className="text-gray-400">vs {formatBs(resumen_mom.ticket_promedio_anterior)} {resumen_mom.periodo_anterior ? MESES[parseInt(resumen_mom.periodo_anterior.split('-')[1]) - 1] : 'ant.'}</span>
                    </div>'''

new_tkt_section = '''<div className="flex items-center gap-2 text-xs font-bold pt-2 border-t border-gray-100">
                        <div className={cn(
                            "flex items-center gap-0.5 px-2 py-1 rounded-md",
                            isTktPositive ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"
                        )}>
                            {isTktPositive ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                            <span>{isTktPositive ? '+' : ''}{resumen_mom.diferencia_tkt_pct}%</span>
                        </div>
                        <span className="text-gray-400">vs {formatBs(resumen_mom.ticket_promedio_anterior)} {resumen_mom.periodo_anterior ? MESES[parseInt(resumen_mom.periodo_anterior.split('-')[1]) - 1] : 'ant.'}</span>
                    </div>
                    
                    <div className="mt-3 pt-3 border-t border-gray-100 flex justify-between items-center text-sm">
                        <span className="text-gray-500 font-medium">Ticket Prom. (Prod)</span>
                        <div className="flex items-center gap-2">
                            <span className="font-bold text-gray-900">{resumen_mom.ticket_promedio_productos_actual.toLocaleString()} u.</span>
                            <div className={cn(
                                "flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold",
                                resumen_mom.diferencia_tkt_prod_pct >= 0 ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"
                            )}>
                                {resumen_mom.diferencia_tkt_prod_pct >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                                {resumen_mom.diferencia_tkt_prod_pct >= 0 ? '+' : ''}{resumen_mom.diferencia_tkt_prod_pct}%
                            </div>
                        </div>
                    </div>'''

content = content.replace(old_tx_section, new_tx_section)
content = content.replace(old_tkt_section, new_tkt_section)

with open('frontend/src/components/MonthlyEvolutionView.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Replaced successfully")
