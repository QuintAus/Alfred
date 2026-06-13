"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { useJarvis } from "@/lib/store";
import { useCommand } from "@/lib/useCommand";

/**
 * VoiceProvider — the Phase 4 voice layer.
 *
 *  • STT  : Web Speech API (browser-native) turns speech into a command.
 *  • Mic  : Web Audio analyser feeds live amplitude into the store's
 *           `inputLevel`, so the visualizer ring reacts to your voice.
 *  • TTS  : speechSynthesis speaks JARVIS's replies (pulses the ring).
 *  • Wake : Picovoice Porcupine listens for "Jarvis" (opt-in: needs a free
 *           access key + the params model — see README). Push-to-talk always works.
 *
 * Everything degrades gracefully — unsupported / unconfigured pieces simply
 * switch off and the text command bar keeps working.
 */

// --- minimal Web Speech typings (not in lib.dom for the webkit-prefixed API) ---
interface SRResult {
  isFinal: boolean;
  0: { transcript: string };
}
interface SREvent {
  resultIndex: number;
  results: ArrayLike<SRResult>;
}
interface SpeechRecognitionLike {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  maxAlternatives: number;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((e: SREvent) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
}
type SRCtor = new () => SpeechRecognitionLike;

interface VoiceState {
  sttSupported: boolean;
  ttsSupported: boolean;
  enabled: boolean; // voice replies + wake word
  listening: boolean; // capturing a command right now
  wakeReady: boolean; // Porcupine running
  toggleEnabled: () => void;
  startListening: () => void;
  stopListening: () => void;
}

const Ctx = createContext<VoiceState | null>(null);
export const useVoice = () => useContext(Ctx);

const ACCESS_KEY = process.env.NEXT_PUBLIC_PICOVOICE_ACCESS_KEY;
const MODEL_PATH = process.env.NEXT_PUBLIC_PORCUPINE_MODEL_PATH ?? "/porcupine_params.pv";

function pickVoice(): SpeechSynthesisVoice | null {
  const voices = window.speechSynthesis.getVoices();
  if (!voices.length) return null;
  // Prefer a British English voice for the butler tone.
  return (
    voices.find((v) => /en-GB/i.test(v.lang) && /male|daniel|arthur|george/i.test(v.name)) ??
    voices.find((v) => /en-GB/i.test(v.lang)) ??
    voices.find((v) => /^en/i.test(v.lang)) ??
    voices[0]
  );
}

export function VoiceProvider({ children }: { children: React.ReactNode }) {
  const send = useCommand();

  const [sttSupported, setSttSupported] = useState(false);
  const [ttsSupported, setTtsSupported] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const [listening, setListening] = useState(false);
  const [wakeReady, setWakeReady] = useState(false);

  // mutable refs for things we must tear down
  const recRef = useRef<SpeechRecognitionLike | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioRef = useRef<AudioContext | null>(null);
  const rafRef = useRef<number>(0);
  const finalizedRef = useRef(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const spokenRef = useRef(0); // # of assistant turns already spoken

  useEffect(() => {
    setSttSupported(
      typeof window !== "undefined" &&
        Boolean(
          (window as unknown as { SpeechRecognition?: SRCtor }).SpeechRecognition ||
            (window as unknown as { webkitSpeechRecognition?: SRCtor }).webkitSpeechRecognition,
        ),
    );
    setTtsSupported(typeof window !== "undefined" && "speechSynthesis" in window);
  }, []);

  const stopMic = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    audioRef.current?.close().catch(() => {});
    audioRef.current = null;
    useJarvis.getState().setInputLevel(0);
  }, []);

  const stopListening = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    try {
      recRef.current?.stop();
    } catch {
      /* ignore */
    }
    recRef.current = null;
    stopMic();
    setListening(false);
    const s = useJarvis.getState();
    if (s.status === "listening") s.setStatus("idle");
  }, [stopMic]);

  const startMicMeter = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AudioCtx();
      audioRef.current = ctx;
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      const data = new Uint8Array(analyser.frequencyBinCount);
      const loop = () => {
        analyser.getByteTimeDomainData(data);
        let sum = 0;
        for (const v of data) {
          const x = (v - 128) / 128;
          sum += x * x;
        }
        const rms = Math.sqrt(sum / data.length);
        useJarvis.getState().setInputLevel(Math.min(1, rms * 2.4));
        rafRef.current = requestAnimationFrame(loop);
      };
      loop();
    } catch {
      /* mic permission denied — STT may still work without the meter */
    }
  }, []);

  const startListening = useCallback(() => {
    const Ctor =
      (window as unknown as { SpeechRecognition?: SRCtor }).SpeechRecognition ||
      (window as unknown as { webkitSpeechRecognition?: SRCtor }).webkitSpeechRecognition;
    if (!Ctor) return;
    if (useJarvis.getState().isProcessing) return;
    if (recRef.current) return; // already listening

    finalizedRef.current = false;
    const rec = new Ctor();
    rec.lang = "en-GB";
    rec.interimResults = true;
    rec.continuous = false;
    rec.maxAlternatives = 1;

    const finalize = (text: string) => {
      if (finalizedRef.current) return;
      finalizedRef.current = true;
      stopListening();
      const t = text.trim();
      if (t) void send(t);
    };

    rec.onresult = (e) => {
      let finalText = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i];
        if (r.isFinal) finalText += r[0].transcript;
      }
      if (finalText.trim()) finalize(finalText);
    };
    rec.onerror = () => stopListening();
    rec.onend = () => {
      if (!finalizedRef.current) stopListening();
    };

    recRef.current = rec;
    setListening(true);
    useJarvis.getState().setStatus("listening");
    void startMicMeter();
    try {
      rec.start();
    } catch {
      stopListening();
    }
    // safety auto-stop
    timeoutRef.current = setTimeout(() => stopListening(), 12000);
  }, [send, startMicMeter, stopListening]);

  // keep a live ref so the Porcupine callback always calls the latest fn
  const startRef = useRef(startListening);
  startRef.current = startListening;

  const toggleEnabled = useCallback(() => setEnabled((e) => !e), []);

  // --- TTS: speak new assistant replies while enabled ---
  useEffect(() => {
    if (!enabled || !ttsSupported) return;
    const speakLatest = () => {
      const { transcript, status } = useJarvis.getState();
      const assistantTurns = transcript.filter((t) => t.role === "assistant");
      if (assistantTurns.length <= spokenRef.current) return;
      spokenRef.current = assistantTurns.length;
      if (status === "error") return; // don't read out error text
      const text = assistantTurns[assistantTurns.length - 1].text;
      if (!text) return;
      const synth = window.speechSynthesis;
      synth.cancel();
      const u = new SpeechSynthesisUtterance(text);
      const v = pickVoice();
      if (v) u.voice = v;
      u.lang = v?.lang ?? "en-GB";
      u.rate = 1.02;
      u.pitch = 1;
      u.onstart = () => useJarvis.getState().setStatus("speaking");
      u.onend = () => {
        const s = useJarvis.getState();
        if (s.status === "speaking") s.setStatus("idle");
      };
      synth.speak(u);
    };
    // sync the counter to current length, then subscribe to future changes
    spokenRef.current = useJarvis
      .getState()
      .transcript.filter((t) => t.role === "assistant").length;
    const unsub = useJarvis.subscribe(speakLatest);
    return () => {
      unsub();
      window.speechSynthesis.cancel();
    };
  }, [enabled, ttsSupported]);

  // --- Wake word (Porcupine) while enabled, if configured ---
  useEffect(() => {
    if (!enabled || !ACCESS_KEY) {
      setWakeReady(false);
      return;
    }
    let released = false;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let worker: any = null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let wvp: any = null;

    (async () => {
      try {
        // Typed loosely: these are browser/WASM-only modules, not exercised at
        // build time. We match Picovoice's documented v4 API at runtime.
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const pico: any = await import("@picovoice/porcupine-web");
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const wvpMod: any = await import("@picovoice/web-voice-processor");
        worker = await pico.PorcupineWorker.create(
          ACCESS_KEY,
          pico.BuiltInKeyword.Jarvis,
          () => startRef.current(),
          { publicPath: MODEL_PATH },
        );
        if (released) {
          worker.release?.();
          worker.terminate?.();
          return;
        }
        wvp = wvpMod.WebVoiceProcessor;
        await wvp.subscribe(worker);
        setWakeReady(true);
      } catch {
        // missing model / bad key / unsupported — wake word stays off
        setWakeReady(false);
      }
    })();

    return () => {
      released = true;
      setWakeReady(false);
      (async () => {
        try {
          if (wvp && worker) await wvp.unsubscribe(worker);
          worker?.release?.();
          worker?.terminate?.();
        } catch {
          /* ignore */
        }
      })();
    };
  }, [enabled]);

  // cleanup on unmount
  useEffect(() => () => stopListening(), [stopListening]);

  return (
    <Ctx.Provider
      value={{
        sttSupported,
        ttsSupported,
        enabled,
        listening,
        wakeReady,
        toggleEnabled,
        startListening,
        stopListening,
      }}
    >
      {children}
    </Ctx.Provider>
  );
}
