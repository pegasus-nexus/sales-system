import { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getClientes } from '../api/api';
import { Search, User, Phone, X } from 'lucide-react';
import { useDebounceValue } from 'usehooks-ts';
import { motion, AnimatePresence } from 'framer-motion';

interface ClienteComboboxProps {
    onSelect: (cliente: any) => void;
    onClear: () => void;
    selectedClient: any;
    disabled?: boolean;
}

export function ClientCombobox({ onSelect, onClear, selectedClient, disabled }: ClienteComboboxProps) {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState('');
    const [debouncedSearch] = useDebounceValue(search, 300);
    const wrapperRef = useRef<HTMLDivElement>(null);

    const { data: clients = [], isLoading } = useQuery({
        queryKey: ['clientes', debouncedSearch],
        queryFn: () => getClientes(debouncedSearch),
        enabled: open, // solo busca si esta abierto
    });

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Filter local if we already fetched some
    const displayClients = clients.slice(0, 5); // limit to 5 results for clean UI

    if (selectedClient?.cliente_id || (selectedClient?.razon_social && selectedClient.razon_social.trim())) {
        const isHomonymOrNew = !selectedClient.cliente_id;
        return (
            <div className={`flex items-center justify-between border ${isHomonymOrNew ? 'border-amber-300 bg-amber-50/80' : 'border-indigo-200 bg-indigo-50'} rounded-lg px-3 py-2 ${disabled ? 'opacity-50' : ''}`}>
                <div className="flex items-center gap-2 overflow-hidden">
                    <div className={`w-6 h-6 rounded-full flex flex-shrink-0 items-center justify-center ${isHomonymOrNew ? 'bg-amber-200 text-amber-800' : 'bg-indigo-200 text-indigo-700'}`}>
                        <User size={12} />
                    </div>
                    <div className="flex flex-col min-w-0">
                        <span className="text-xs font-bold text-gray-900 truncate flex items-center gap-1.5">
                            {selectedClient.razon_social}
                            {isHomonymOrNew && (
                                <span className="text-[9px] font-bold bg-amber-200 text-amber-900 px-1.5 py-0.5 rounded border border-amber-300">
                                    Nuevo / Homónimo
                                </span>
                            )}
                        </span>
                        {selectedClient.telefono && <span className="text-[10px] text-gray-600 flex items-center gap-1"><Phone size={8}/> {selectedClient.telefono}</span>}
                    </div>
                    {selectedClient.is_miembro_comunidad && (
                        <div className="ml-2 px-1.5 py-0.5 bg-yellow-400 text-yellow-900 text-[9px] font-black uppercase rounded shadow-sm border border-yellow-500 whitespace-nowrap">
                            MIEMBRO COMUNIDAD
                        </div>
                    )}
                </div>
                {!disabled && (
                    <button onClick={onClear} className="w-6 h-6 rounded flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-gray-100 transition-colors" title="Limpiar cliente">
                        <X size={14} />
                    </button>
                )}
            </div>
        );
    }

    return (
        <div ref={wrapperRef} className="relative">
            <div className="relative">
                <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                    type="text"
                    value={search}
                    onChange={(e) => {
                        setSearch(e.target.value);
                        setOpen(true);
                    }}
                    onFocus={() => setOpen(true)}
                    disabled={disabled}
                    placeholder="Buscar cliente por teléfono, nombre o NIT..."
                    className="w-full pl-8 pr-2 py-2 border border-gray-200 rounded-lg text-xs text-gray-900 focus:ring-1 focus:ring-indigo-400 focus:border-indigo-400 outline-none placeholder:text-gray-400 bg-white"
                />
            </div>

            <AnimatePresence>
                {open && search.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden"
                    >
                        {isLoading ? (
                            <div className="p-3 text-center text-xs text-gray-500">Buscando...</div>
                        ) : displayClients.length === 0 ? (
                            <div className="p-4 text-center">
                                <p className="text-xs text-gray-500 mb-2">No se encontró "{search}"</p>
                                    <button 
                                        onClick={() => {
                                            onSelect({
                                                cliente_id: undefined,
                                                razon_social: search.trim().toUpperCase(),
                                                telefono: selectedClient?.telefono || '',
                                                nit: selectedClient?.nit || '',
                                                email: selectedClient?.email || '',
                                                es_factura: selectedClient?.es_factura || false,
                                                is_miembro_comunidad: selectedClient?.is_miembro_comunidad || false
                                            });
                                            setOpen(false);
                                        }}
                                        className="text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-lg hover:bg-indigo-100 w-full mb-2"
                                    >
                                        + Continuar como "{search.trim().toUpperCase()}" nuevo
                                    </button>
                                    <button 
                                        onClick={() => {
                                            onSelect({
                                                cliente_id: undefined,
                                                razon_social: search.trim().toUpperCase(),
                                                telefono: selectedClient?.telefono || '',
                                                nit: selectedClient?.nit || '',
                                                email: selectedClient?.email || '',
                                                es_factura: selectedClient?.es_factura || false,
                                                is_miembro_comunidad: true
                                            });
                                            setOpen(false);
                                        }}
                                        className="text-xs font-bold text-yellow-700 bg-yellow-50 border border-yellow-200 px-3 py-1.5 rounded-lg hover:bg-yellow-100 w-full flex items-center justify-center gap-1"
                                    >
                                        + Registrar como Miembro Comunidad
                                    </button>
                            </div>
                        ) : (
                            <>
                            <ul className="max-h-60 overflow-auto divide-y divide-gray-100">
                                {displayClients.map((c: any) => (
                                    <li 
                                        key={c._id}
                                        onClick={() => {
                                            onSelect({
                                                cliente_id: c._id,
                                                razon_social: c.nombre,
                                                telefono: c.telefono || selectedClient?.telefono || '',
                                                nit: c.nit_ci || selectedClient?.nit || '',
                                                email: c.email || selectedClient?.email || '',
                                                es_factura: selectedClient?.es_factura || !!c.nit_ci,
                                                is_miembro_comunidad: selectedClient?.is_miembro_comunidad || !!c.is_miembro_comunidad
                                            });
                                            setOpen(false);
                                            setSearch('');
                                        }}
                                        className="px-3 py-2 flex items-center justify-between hover:bg-gray-50 cursor-pointer group"
                                    >
                                        <div className="flex flex-col">
                                            <span className="text-xs font-bold text-gray-900 group-hover:text-indigo-600 transition-colors flex items-center gap-2">
                                                {c.nombre}
                                                {c.is_miembro_comunidad ? (
                                                    <span className="bg-yellow-100 text-yellow-800 text-[9px] px-1.5 py-0.5 rounded border border-yellow-200">
                                                        COMUNIDAD
                                                    </span>
                                                ) : (
                                                    <button 
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            onSelect({
                                                                cliente_id: c._id,
                                                                razon_social: c.nombre,
                                                                telefono: c.telefono || selectedClient?.telefono || '',
                                                                nit: c.nit_ci || selectedClient?.nit || '',
                                                                email: c.email || selectedClient?.email || '',
                                                                es_factura: selectedClient?.es_factura || !!c.nit_ci,
                                                                is_miembro_comunidad: true
                                                            });
                                                            setOpen(false);
                                                            setSearch('');
                                                        }}
                                                        className="text-[9px] font-bold px-1.5 py-0.5 bg-gray-100 text-gray-500 hover:bg-yellow-100 hover:text-yellow-700 hover:border-yellow-300 border border-transparent rounded transition-colors"
                                                    >
                                                        + Unir a Comunidad
                                                    </button>
                                                )}
                                            </span>
                                            <div className="flex items-center gap-2 mt-0.5">
                                                {c.telefono && <span className="text-[10px] text-gray-500 flex items-center gap-0.5"><Phone size={8}/> {c.telefono}</span>}
                                                {c.nit_ci && <span className="text-[10px] text-gray-500 border border-gray-200 rounded px-1">NIT: {c.nit_ci}</span>}
                                            </div>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                            <div className="p-2 border-t border-gray-100 bg-gray-50 flex flex-col gap-1.5">
                                <button 
                                    type="button"
                                    onClick={() => {
                                        onSelect({
                                            cliente_id: undefined,
                                            razon_social: search.trim().toUpperCase(),
                                            telefono: selectedClient?.telefono || '',
                                            nit: selectedClient?.nit || '',
                                            email: selectedClient?.email || '',
                                            es_factura: selectedClient?.es_factura || false,
                                            is_miembro_comunidad: selectedClient?.is_miembro_comunidad || false
                                        });
                                        setOpen(false);
                                        setSearch('');
                                    }}
                                    className="text-xs font-semibold text-indigo-700 bg-white border border-indigo-200 px-3 py-1.5 rounded-lg hover:bg-indigo-50 w-full text-left flex items-center justify-between transition-colors shadow-sm"
                                >
                                    <span>+ Registrar a <strong className="font-bold">"{search.trim().toUpperCase()}"</strong> como nuevo</span>
                                    <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-1.5 py-0.5 rounded border border-amber-200">
                                        Homónimo
                                    </span>
                                </button>
                                <button 
                                    type="button"
                                    onClick={() => {
                                        onSelect({
                                            cliente_id: undefined,
                                            razon_social: search.trim().toUpperCase(),
                                            telefono: selectedClient?.telefono || '',
                                            nit: selectedClient?.nit || '',
                                            email: selectedClient?.email || '',
                                            es_factura: selectedClient?.es_factura || false,
                                            is_miembro_comunidad: true
                                        });
                                        setOpen(false);
                                        setSearch('');
                                    }}
                                    className="text-xs font-bold text-yellow-800 bg-yellow-50 border border-yellow-200 px-3 py-1.5 rounded-lg hover:bg-yellow-100 w-full flex items-center justify-between"
                                >
                                    <span>+ Registrar como Miembro Comunidad</span>
                                    <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-1.5 py-0.5 rounded border border-amber-200">
                                        Homónimo
                                    </span>
                                </button>
                            </div>
                            </>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
