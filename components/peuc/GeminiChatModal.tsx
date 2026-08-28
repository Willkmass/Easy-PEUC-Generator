'use client';

import { usePeucForm } from '@/app/peuc/criar/usePeucForm';

export function GeminiChatModal({ form }: { form: ReturnType<typeof usePeucForm> }) {
  if (!form.chatAberto) return null;

  return (
    <div className="fixed bottom-6 right-6 w-96 max-w-[calc(100vw-3rem)] h-[520px] bg-slate-900 border border-purple-500/30 rounded-2xl shadow-2xl flex flex-col z-50 overflow-hidden backdrop-blur-xl">
      <div className="p-4 bg-slate-950/80 border-b border-slate-800 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
          <h3 className="font-bold text-sm text-slate-100">Assistente Gemini AI</h3>
        </div>
        <button
          onClick={() => form.setChatAberto(false)}
          className="text-slate-400 hover:text-white text-sm font-bold w-7 h-7 flex items-center justify-center rounded-lg hover:bg-slate-800"
        >
          ✕
        </button>
      </div>

      <div className="flex-1 p-4 overflow-y-auto space-y-4 text-xs">
        {form.mensagensChat.map((msg, idx) => (
          <div
            key={idx}
            className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
          >
            <div
              className={`max-w-[85%] p-3 rounded-xl ${
                msg.role === 'user'
                  ? 'bg-purple-600 text-white rounded-br-none'
                  : 'bg-slate-800 border border-slate-700/70 text-slate-200 rounded-bl-none'
              }`}
            >
              <p className="whitespace-pre-wrap">{msg.texto}</p>

              {msg.dadosGerados && (
                <button
                  type="button"
                  onClick={() => form.aplicarDadosNoFormulario(msg.dadosGerados!)}
                  className="mt-3 w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2 px-3 rounded-lg text-[11px] transition shadow flex items-center justify-center gap-1.5"
                >
                  <span>✓</span>
                  <span>Aplicar no Formulário</span>
                </button>
              )}
            </div>
          </div>
        ))}
        {form.enviandoChat && (
          <div className="flex items-center gap-2 text-slate-400 text-xs italic">
            <span className="animate-spin">🌀</span> Pensando na Situação de Aprendizagem...
          </div>
        )}
        <div ref={form.chatBottomRef} />
      </div>

      <div className="p-3 bg-slate-950/90 border-t border-slate-800 flex gap-2">
        <input
          type="text"
          value={form.inputChat}
          onChange={(e) => form.setInputChat(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), form.enviarMensagemGemini())}
          placeholder="Digite o que deseja ajustar na SA..."
          className="flex-1 bg-slate-900 border border-slate-800 text-slate-100 text-xs px-3 py-2 rounded-xl outline-none focus:border-purple-500"
        />
        <button
          type="button"
          onClick={() => form.enviarMensagemGemini()}
          disabled={form.enviandoChat}
          className="bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white px-3.5 py-2 rounded-xl font-bold text-xs transition"
        >
          Enviar
        </button>
      </div>
    </div>
  );
}
