import { useCallback } from 'react';

/**
 * Hook para sintetizar sonidos de escáner de código de barras (estilo pistola Honeywell/Zebra/Odoo Barcode)
 * Utiliza Web Audio API nativo sin requerir archivos de audio externos.
 */
export function useBarcodeSound() {
    const playSuccessBeep = useCallback(() => {
        try {
            const AudioContext = window.AudioContext || (window as unknown as { webkitAudioContext: typeof window.AudioContext }).webkitAudioContext;
            if (!AudioContext) return;
            const ctx = new AudioContext();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();

            osc.type = 'sine';
            osc.frequency.setValueAtTime(1400, ctx.currentTime); // 1400Hz (tono agudo limpio)
            gain.gain.setValueAtTime(0.15, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.08); // 80ms

            osc.connect(gain);
            gain.connect(ctx.destination);

            osc.start();
            osc.stop(ctx.currentTime + 0.08);
        } catch {
            // Silencioso si el navegador bloquea audio
        }
    }, []);

    const playErrorBeep = useCallback(() => {
        try {
            const AudioContext = window.AudioContext || (window as unknown as { webkitAudioContext: typeof window.AudioContext }).webkitAudioContext;
            if (!AudioContext) return;
            const ctx = new AudioContext();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();

            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(320, ctx.currentTime); // 320Hz (tono grave de advertencia)
            gain.gain.setValueAtTime(0.2, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.18); // 180ms

            osc.connect(gain);
            gain.connect(ctx.destination);

            osc.start();
            osc.stop(ctx.currentTime + 0.18);
        } catch {
            // Silencioso
        }
    }, []);

    return { playSuccessBeep, playErrorBeep };
}
