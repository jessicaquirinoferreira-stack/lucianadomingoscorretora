import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Send, X } from 'lucide-react';
import { BRAND_IMAGES } from '../data/seedData.ts';
import type { SiteSettings } from '../types.ts';
import { OfficialInstagramIcon, OfficialWhatsAppIcon } from './SocialIcons.tsx';

interface VirtualAssistantProps {
  settings: SiteSettings;
  propertiesCount: number;
  onNavigate: (path: string) => void;
}

interface ChatMessage {
  id: string;
  sender: 'sofia' | 'user';
  text: string;
  showChannels?: boolean;
}

const QUICK_QUESTIONS = [
  'Quais cidades vocês atendem?',
  'Como funciona o financiamento?',
  'Qual o Instagram e WhatsApp?',
  'Quero agenciar meu imóvel',
];

export const VirtualAssistant: React.FC<VirtualAssistantProps> = ({
  settings,
  propertiesCount,
  onNavigate,
}) => {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    {
      id: 'welcome',
      sender: 'sofia',
      text: `Olá! Eu sou a Sofia, assistente virtual da corretora ${settings.brokerName}. Posso responder dúvidas rápidas sobre imóveis em Estância Velha e Vale dos Sinos, financiamento ou direcionar você às redes oficiais dela.`,
      showChannels: true,
    },
  ]);

  const scrollRef = useRef<HTMLDivElement | null>(null);

  const cleanNumber = settings.whatsappNumber.replace(/\D/g, '');
  const cleanInsta =
    settings.instagramHandle.replace(/^@/, '').trim() || 'lucianadomingos.imoveis';
  const waHref = `https://wa.me/${cleanNumber}?text=${encodeURIComponent(
    'Olá Luciana! A Sofia me direcionou pelo site e gostaria de atendimento.'
  )}`;
  const instaHref = `https://instagram.com/${cleanInsta}`;

  useEffect(() => {
    if (open && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, open]);

  const sendQuestion = async (rawText: string) => {
    const question = rawText.trim();
    if (!question || loading) return;

    const userMsg: ChatMessage = {
      id: `user_${Date.now()}`,
      sender: 'user',
      text: question,
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    const buildFallbackReply = (q: string): string => {
      const lower = q.toLowerCase();
      if (lower.includes('instagram') || lower.includes('insta') || lower.includes('rede')) {
        return `Você pode acompanhar lançamentos, tours e novidades da ${settings.brokerName} no Instagram ${settings.instagramHandle} ou conversar diretamente pelo WhatsApp oficial (51) 99822-8587.`;
      }
      if (lower.includes('whatsapp') || lower.includes('whats') || lower.includes('contato') || lower.includes('falar')) {
        return `O atendimento direto com a ${settings.brokerName} (${settings.creci}) acontece pelo WhatsApp oficial (51) 99822-8587 e também no Instagram ${settings.instagramHandle}.`;
      }
      if (lower.includes('cidade') || lower.includes('regi') || lower.includes('estância') || lower.includes('estancia') || lower.includes('vale')) {
        return `Atendemos Estância Velha e todo o Vale dos Sinos — incluindo Novo Hamburgo (Feevale), São Leopoldo (Unisinos) e Campo Bom. Chame no WhatsApp (51) 99822-8587 ou acompanhe ${settings.instagramHandle}.`;
      }
      if (lower.includes('financ') || lower.includes('entrada') || lower.includes('parcela') || lower.includes('banco')) {
        return `Sim! Trabalhamos com financiamento bancário (SAC e Price) e uso de FGTS. Simule direto na página de cada imóvel ou envie seu perfil no WhatsApp (51) 99822-8587.`;
      }
      if (lower.includes('agenci') || lower.includes('vender') || lower.includes('alugar') || lower.includes('meu imóvel') || lower.includes('meu imovel')) {
        return `A ${settings.brokerName} faz agenciamento completo com apresentação editorial e divulgação estratégica no Instagram ${settings.instagramHandle}. Fale pelo WhatsApp (51) 99822-8587.`;
      }
      return `Temos ${propertiesCount > 0 ? `${propertiesCount} imóveis e lançamentos selecionados` : 'excelentes opções'} em Estância Velha e Vale dos Sinos. Fale com a ${settings.brokerName} pelo WhatsApp (51) 99822-8587 ou siga ${settings.instagramHandle} no Instagram.`;
    };

    try {
      const res = await fetch('/api/ai/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question,
          brokerName: settings.brokerName,
          creci: settings.creci,
          instagramHandle: settings.instagramHandle,
          whatsappNumber: settings.whatsappNumber,
          propertiesCount,
        }),
      });
      const ct = res.headers.get('content-type') || '';
      const data =
        res.ok && ct.includes('application/json')
          ? ((await res.json()) as { reply?: string })
          : {};
      setMessages((prev) => [
        ...prev,
        {
          id: `sofia_${Date.now()}`,
          sender: 'sofia',
          text: data.reply || buildFallbackReply(question),
          showChannels: true,
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `sofia_${Date.now()}`,
          sender: 'sofia',
          text: buildFallbackReply(question),
          showChannels: true,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void sendQuestion(input);
  };

  return (
    <div className="fixed bottom-5 left-5 z-50">
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.96 }}
            transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
            className="mb-3 w-[calc(100vw-2.5rem)] sm:w-[375px] bg-[#FAF9F6] border border-[#0F2936]/15 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[74vh]"
            role="dialog"
            aria-label="Assistente Virtual Sofia"
          >
            {/* Header with Sofia's Humanized Photo & Name */}
            <div className="bg-[#0F2936] text-white px-4 py-3.5 flex items-center justify-between gap-3 border-b border-white/10">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-11 h-11 rounded-full overflow-hidden border-2 border-[#D8B467] shrink-0 bg-[#163A4D]">
                  <img
                    src={BRAND_IMAGES.assistant}
                    alt="Sofia - Assistente Virtual"
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover object-top"
                  />
                </div>
                <div className="min-w-0">
                  <div className="font-serif text-lg font-semibold leading-tight text-white">
                    Sofia
                  </div>
                  <div className="text-[11px] text-[#D8B467] truncate">
                    Assistente da {settings.brokerName} · {settings.creci}
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Fechar assistente Sofia"
                className="w-9 h-9 rounded-full hover:bg-white/10 text-white/80 hover:text-white flex items-center justify-center transition-colors cursor-pointer shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Official Broker Social Channels Bar */}
            <div className="bg-white px-4 py-2.5 border-b border-[#0F2936]/10 flex items-center justify-between gap-2 text-xs">
              <span className="text-[#0F2936]/65 font-medium truncate">
                Canais da corretora:
              </span>
              <div className="flex items-center gap-2 shrink-0">
                <a
                  href={waHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#25D366]/12 hover:bg-[#25D366]/20 text-[#15803D] font-semibold transition-colors"
                >
                  <OfficialWhatsAppIcon className="w-3.5 h-3.5" />
                  WhatsApp
                </a>
                <a
                  href={instaHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#d6249f]/10 hover:bg-[#d6249f]/18 text-[#9D174D] font-semibold transition-colors"
                >
                  <OfficialInstagramIcon className="w-3.5 h-3.5" />
                  Instagram
                </a>
              </div>
            </div>

            {/* Conversation History */}
            <div
              ref={scrollRef}
              className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#FAF9F6]"
            >
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex flex-col ${
                    msg.sender === 'user' ? 'items-end' : 'items-start'
                  }`}
                >
                  <div
                    className={`max-w-[88%] rounded-2xl px-3.5 py-2.5 text-xs sm:text-sm leading-relaxed ${
                      msg.sender === 'user'
                        ? 'bg-[#0F2936] text-white rounded-br-sm'
                        : 'bg-white border border-[#0F2936]/10 text-[#0F2936] rounded-bl-sm'
                    }`}
                  >
                    {msg.text}

                    {msg.sender === 'sofia' && msg.showChannels && (
                      <div className="mt-2.5 pt-2 border-t border-[#0F2936]/8 flex flex-wrap items-center gap-2 text-[11px] font-semibold">
                        <a
                          href={waHref}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[#15803D] hover:underline"
                        >
                          <OfficialWhatsAppIcon className="w-3.5 h-3.5" />
                          WhatsApp Direto
                        </a>
                        <span aria-hidden="true" className="text-[#0F2936]/25">
                          ·
                        </span>
                        <a
                          href={instaHref}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[#B02472] hover:underline"
                        >
                          <OfficialInstagramIcon className="w-3.5 h-3.5" />
                          {settings.instagramHandle}
                        </a>
                        <span aria-hidden="true" className="text-[#0F2936]/25">
                          ·
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setOpen(false);
                            onNavigate('/imoveis');
                          }}
                          className="text-[#0F2936] hover:text-[#B08839] underline cursor-pointer"
                        >
                          Ver catálogo
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {loading && (
                <div className="flex items-start">
                  <div className="bg-white border border-[#0F2936]/10 text-[#0F2936]/65 rounded-2xl rounded-bl-sm px-3.5 py-2 text-xs">
                    Sofia está respondendo...
                  </div>
                </div>
              )}

              {/* Quick FAQ Buttons */}
              <div className="pt-1 flex flex-wrap gap-1.5">
                {QUICK_QUESTIONS.map((q) => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => void sendQuestion(q)}
                    disabled={loading}
                    className="px-2.5 py-1.5 bg-white hover:bg-[#0F2936] text-[#0F2936] hover:text-white border border-[#0F2936]/15 rounded-lg text-[11px] font-medium transition-colors cursor-pointer"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>

            {/* Input Form */}
            <form
              onSubmit={handleSubmit}
              className="p-3 bg-white border-t border-[#0F2936]/10 flex items-center gap-2"
            >
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Pergunte algo simples para a Sofia..."
                aria-label="Mensagem para a assistente Sofia"
                className="flex-1 px-3 py-2 bg-[#FAF9F6] border border-[#0F2936]/15 rounded-xl text-xs sm:text-sm text-[#0F2936] focus:outline-none focus:border-[#C59B48]"
              />
              <button
                type="submit"
                disabled={!input.trim() || loading}
                aria-label="Enviar mensagem"
                className="w-10 h-10 rounded-xl bg-[#0F2936] hover:bg-[#163A4D] disabled:opacity-45 text-white flex items-center justify-center transition-colors cursor-pointer shrink-0"
              >
                <Send className="w-4 h-4 text-[#D8B467]" />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Left-Side Humanized Launcher Button */}
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-label={open ? 'Fechar assistente Sofia' : 'Conversar com Sofia, assistente da corretora'}
        className="group flex items-center gap-3 bg-[#0F2936] hover:bg-[#163A4D] text-white border border-[#C59B48]/45 rounded-full pl-1.5 pr-4 py-1.5 shadow-xl transition-transform duration-200 hover:scale-[1.03] cursor-pointer"
      >
        <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full overflow-hidden border-2 border-[#D8B467] shrink-0">
          <img
            src={BRAND_IMAGES.assistant}
            alt="Sofia - Assistente Virtual"
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover object-top"
          />
        </div>
        <div className="text-left pr-1">
          <div className="text-xs sm:text-sm font-semibold text-white leading-tight">
            Sofia
          </div>
          <div className="text-[11px] text-[#D8B467] leading-tight whitespace-nowrap">
            {open ? 'Fechar conversa' : 'Assistente · Dúvidas'}
          </div>
        </div>
      </button>
    </div>
  );
};
