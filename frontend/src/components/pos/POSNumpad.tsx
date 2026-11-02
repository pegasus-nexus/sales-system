import { useState } from 'react';
import { Delete } from 'lucide-react';
import type { CartItem } from '../../store/usePosStore';

export type NumpadMode = 'qty' | 'disc' | 'price';

interface POSNumpadProps {
    selectedItem: CartItem | null;
    onUpdateQty: (productId: string, almacenId: string, qty: number) => void;
    onUpdatePrice?: (productId: string, almacenId: string, price: number) => void;
    onRemoveItem: (productId: string, almacenId: string) => void;
}

export function POSNumpad({
    selectedItem,
    onUpdateQty,
    onUpdatePrice,
    onRemoveItem
}: POSNumpadProps) {
    const [mode, setMode] = useState<NumpadMode>('qty');
    const [inputBuffer, setInputBuffer] = useState<string>('');

    const handleNumberClick = (val: string) => {
        if (!selectedItem) return;

        let nextBuffer = inputBuffer;
        if (val === '.') {
            if (nextBuffer.includes('.')) return;
            nextBuffer = nextBuffer === '' ? '0.' : nextBuffer + '.';
        } else if (val === '+/-') {
            if (nextBuffer.startsWith('-')) nextBuffer = nextBuffer.slice(1);
            else if (nextBuffer) nextBuffer = '-' + nextBuffer;
        } else {
            nextBuffer = nextBuffer === '0' ? val : nextBuffer + val;
        }

        setInputBuffer(nextBuffer);
        const parsed = parseFloat(nextBuffer);
        if (isNaN(parsed)) return;

        if (mode === 'qty') {
            onUpdateQty(selectedItem.product._id, selectedItem.almacen_id, Math.max(1, parsed));
        } else if (mode === 'price' && onUpdatePrice) {
            onUpdatePrice(selectedItem.product._id, selectedItem.almacen_id, Math.max(0, parsed));
        }
    };

    const handleBackspace = () => {
        if (!selectedItem) return;

        if (inputBuffer.length > 1) {
            const nextBuffer = inputBuffer.slice(0, -1);
            setInputBuffer(nextBuffer);
            const parsed = parseFloat(nextBuffer);
            if (!isNaN(parsed) && mode === 'qty') {
                onUpdateQty(selectedItem.product._id, selectedItem.almacen_id, Math.max(1, parsed));
            }
        } else if (inputBuffer.length === 1) {
            setInputBuffer('');
        } else {
            // Empty buffer backspace: remove item from cart
            onRemoveItem(selectedItem.product._id, selectedItem.almacen_id);
        }
    };

    const handleModeChange = (newMode: NumpadMode) => {
        setMode(newMode);
        setInputBuffer('');
    };

    return (
        <div className="select-none bg-gray-100 p-2 rounded-2xl border border-gray-200 shadow-inner">
            <div className="grid grid-cols-4 gap-1.5">
                {/* Fila 1 */}
                <button
                    type="button"
                    onClick={() => handleNumberClick('1')}
                    className="h-11 rounded-xl bg-white hover:bg-gray-50 active:scale-95 font-bold text-base text-gray-800 shadow-sm border border-gray-200 flex items-center justify-center transition-all cursor-pointer"
                >
                    1
                </button>
                <button
                    type="button"
                    onClick={() => handleNumberClick('2')}
                    className="h-11 rounded-xl bg-white hover:bg-gray-50 active:scale-95 font-bold text-base text-gray-800 shadow-sm border border-gray-200 flex items-center justify-center transition-all cursor-pointer"
                >
                    2
                </button>
                <button
                    type="button"
                    onClick={() => handleNumberClick('3')}
                    className="h-11 rounded-xl bg-white hover:bg-gray-50 active:scale-95 font-bold text-base text-gray-800 shadow-sm border border-gray-200 flex items-center justify-center transition-all cursor-pointer"
                >
                    3
                </button>
                <button
                    type="button"
                    onClick={() => handleModeChange('qty')}
                    className={`h-11 rounded-xl font-bold text-xs shadow-sm flex items-center justify-center transition-all cursor-pointer border ${
                        mode === 'qty'
                            ? 'bg-indigo-600 text-white border-indigo-700 shadow-indigo-100'
                            : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                    }`}
                >
                    Cant.
                </button>

                {/* Fila 2 */}
                <button
                    type="button"
                    onClick={() => handleNumberClick('4')}
                    className="h-11 rounded-xl bg-white hover:bg-gray-50 active:scale-95 font-bold text-base text-gray-800 shadow-sm border border-gray-200 flex items-center justify-center transition-all cursor-pointer"
                >
                    4
                </button>
                <button
                    type="button"
                    onClick={() => handleNumberClick('5')}
                    className="h-11 rounded-xl bg-white hover:bg-gray-50 active:scale-95 font-bold text-base text-gray-800 shadow-sm border border-gray-200 flex items-center justify-center transition-all cursor-pointer"
                >
                    5
                </button>
                <button
                    type="button"
                    onClick={() => handleNumberClick('6')}
                    className="h-11 rounded-xl bg-white hover:bg-gray-50 active:scale-95 font-bold text-base text-gray-800 shadow-sm border border-gray-200 flex items-center justify-center transition-all cursor-pointer"
                >
                    6
                </button>
                <button
                    type="button"
                    onClick={() => handleModeChange('disc')}
                    className={`h-11 rounded-xl font-bold text-xs shadow-sm flex items-center justify-center transition-all cursor-pointer border ${
                        mode === 'disc'
                            ? 'bg-amber-600 text-white border-amber-700 shadow-amber-100'
                            : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                    }`}
                >
                    % Desc
                </button>

                {/* Fila 3 */}
                <button
                    type="button"
                    onClick={() => handleNumberClick('7')}
                    className="h-11 rounded-xl bg-white hover:bg-gray-50 active:scale-95 font-bold text-base text-gray-800 shadow-sm border border-gray-200 flex items-center justify-center transition-all cursor-pointer"
                >
                    7
                </button>
                <button
                    type="button"
                    onClick={() => handleNumberClick('8')}
                    className="h-11 rounded-xl bg-white hover:bg-gray-50 active:scale-95 font-bold text-base text-gray-800 shadow-sm border border-gray-200 flex items-center justify-center transition-all cursor-pointer"
                >
                    8
                </button>
                <button
                    type="button"
                    onClick={() => handleNumberClick('9')}
                    className="h-11 rounded-xl bg-white hover:bg-gray-50 active:scale-95 font-bold text-base text-gray-800 shadow-sm border border-gray-200 flex items-center justify-center transition-all cursor-pointer"
                >
                    9
                </button>
                <button
                    type="button"
                    onClick={() => handleModeChange('price')}
                    className={`h-11 rounded-xl font-bold text-xs shadow-sm flex items-center justify-center transition-all cursor-pointer border ${
                        mode === 'price'
                            ? 'bg-emerald-600 text-white border-emerald-700 shadow-emerald-100'
                            : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                    }`}
                >
                    Precio
                </button>

                {/* Fila 4 */}
                <button
                    type="button"
                    onClick={() => handleNumberClick('+/-')}
                    className="h-11 rounded-xl bg-amber-50 hover:bg-amber-100 active:scale-95 font-bold text-sm text-amber-800 border border-amber-200 flex items-center justify-center transition-all cursor-pointer"
                >
                    +/-
                </button>
                <button
                    type="button"
                    onClick={() => handleNumberClick('0')}
                    className="h-11 rounded-xl bg-white hover:bg-gray-50 active:scale-95 font-bold text-base text-gray-800 shadow-sm border border-gray-200 flex items-center justify-center transition-all cursor-pointer"
                >
                    0
                </button>
                <button
                    type="button"
                    onClick={() => handleNumberClick('.')}
                    className="h-11 rounded-xl bg-white hover:bg-gray-50 active:scale-95 font-bold text-base text-gray-800 shadow-sm border border-gray-200 flex items-center justify-center transition-all cursor-pointer"
                >
                    .
                </button>
                <button
                    type="button"
                    onClick={handleBackspace}
                    className="h-11 rounded-xl bg-red-50 hover:bg-red-100 active:scale-95 text-red-600 border border-red-200 flex items-center justify-center transition-all cursor-pointer"
                    title="Borrar dígito o ítem"
                >
                    <Delete size={18} />
                </button>
            </div>
        </div>
    );
}
