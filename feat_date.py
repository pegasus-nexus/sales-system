import re

with open("frontend/src/pages/ComunidadPage.tsx", "r", encoding="utf-8") as f:
    content = f.read()

config_query = """
    const { data: webConfig } = useQuery({
        queryKey: ['web-config'],
        queryFn: async () => {
            const res = await client<any>('/web-config');
            return res;
        }
    });
"""

# inject config_query
content = re.sub(
    r"const \{ data: stats, refetch: refetchStats \} = useQuery",
    config_query.strip() + "\n\n    const { data: stats, refetch: refetchStats } = useQuery",
    content
)

prize_rendering_old = """
                                                        const dateIso = miembro.premios_canjeados_fechas?.[p];
                                                        const dateStr = dateIso ? new Date(dateIso).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : 'Fecha no registrada';
                                                        const prizeName = p === 'trufa' ? 'CHOCOLATE AMARGO' : p === 'choco' ? 'TRUFAS DE CHOCOLATE' : p === 'cupon2' ? 'GESTO 2%' : p === 'choco3' ? 'GESTO 3%' : p === 'cupon4' ? 'GESTO 4%' : p.toUpperCase();
                                                        return (
                                                            <div key={i} className="flex flex-col gap-0.5">
                                                                <span className="bg-yellow-50 text-yellow-700 border border-yellow-200 px-2 py-0.5 rounded text-[10px] font-bold w-fit whitespace-nowrap">
                                                                    {prizeName}
                                                                </span>
                                                                <span className="text-[10px] text-gray-400 font-medium">Canjeado: {dateStr}</span>
                                                            </div>
                                                        );
"""

prize_rendering_new = """
                                                        const dateIso = miembro.premios_canjeados_fechas?.[p];
                                                        const dateObj = dateIso ? new Date(dateIso) : null;
                                                        const dateStr = dateObj ? dateObj.toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : 'Fecha no registrada';
                                                        
                                                        const rewardConfig = webConfig?.rewards?.find((r: any) => r.id === p);
                                                        const prizeName = rewardConfig?.title || (p === 'trufa' ? 'CHOCOLATE AMARGO' : p === 'choco' ? 'TRUFAS DE CHOCOLATE' : p === 'cupon2' ? 'GESTO 2%' : p === 'choco3' ? 'GESTO 3%' : p === 'cupon4' ? 'GESTO 4%' : p.toUpperCase());
                                                        
                                                        let expiresStr = '';
                                                        let isExpired = false;
                                                        if (dateObj && rewardConfig?.validity_days) {
                                                            const expiresDate = new Date(dateObj.getTime() + rewardConfig.validity_days * 24 * 60 * 60 * 1000);
                                                            expiresStr = expiresDate.toLocaleString([], { dateStyle: 'short', timeStyle: 'short' });
                                                            isExpired = new Date() > expiresDate;
                                                        }

                                                        return (
                                                            <div key={i} className="flex flex-col gap-0.5 mb-1 bg-gray-50/50 p-1.5 rounded-lg border border-gray-100">
                                                                <div className="flex items-center justify-between gap-2">
                                                                    <span className="bg-yellow-50 text-yellow-700 border border-yellow-200 px-2 py-0.5 rounded text-[10px] font-bold w-fit whitespace-nowrap">
                                                                        {prizeName}
                                                                    </span>
                                                                    {expiresStr && (
                                                                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${isExpired ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
                                                                            {isExpired ? 'VENCIDO' : 'VIGENTE'}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                <span className="text-[10px] text-gray-500 font-medium mt-0.5">Canjeado: {dateStr}</span>
                                                                {expiresStr && (
                                                                    <span className="text-[10px] text-gray-400 font-medium">Válido hasta: {expiresStr}</span>
                                                                )}
                                                            </div>
                                                        );
"""
content = content.replace(prize_rendering_old.strip(), prize_rendering_new.strip())

with open("frontend/src/pages/ComunidadPage.tsx", "w", encoding="utf-8") as f:
    f.write(content)
