import React, { useState } from 'react';
import { Award, CheckCircle2, Instagram, Mail, MapPin, MessageCircle } from 'lucide-react';
import { BRAND_IMAGES } from '../data/seedData.ts';
import { submitPublicLead } from '../lib/dataService.ts';
import type { SiteSettings } from '../types.ts';
import { ParallaxMedia, Reveal } from '../components/MotionPrimitives.tsx';
import { SafeImage } from '../components/SafeImage.tsx';

interface AboutPageProps {
  settings: SiteSettings;
  onNavigate: (path: string) => void;
}

export const AboutPage: React.FC<AboutPageProps> = ({ settings, onNavigate }) => {
  return (
    <div className="bg-[#FAF9F6] min-h-screen py-12 sm:py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-stretch">
          <Reveal className="lg:col-span-5">
            <ParallaxMedia
              className="h-full min-h-[420px] rounded-2xl border border-[#0F2936]/10"
              offsetRange={[-16, 20]}
            >
              <SafeImage
                src={BRAND_IMAGES.broker}
                alt="Luciana Domingos Corretora de Imóveis"
                className="w-full h-full object-cover object-top"
              />
            </ParallaxMedia>
          </Reveal>

          <Reveal delay={0.1} className="lg:col-span-7 flex flex-col justify-center space-y-6">
            <div className="text-xs font-semibold text-[#B08839]">
              Corretora de Imóveis · {settings.creci}
            </div>
            <h1 className="font-serif text-4xl sm:text-6xl font-semibold text-[#0F2936] leading-tight">
              Luciana Domingos
            </h1>
            <p className="font-serif italic text-2xl text-[#163A4D]">
              “{settings.slogan}”
            </p>
            <div className="space-y-4 text-base text-[#0F2936]/80 leading-relaxed">
              <p>
                Com atuação focada em agenciamentos e vendas de imóveis em Estância Velha e em todo o Vale dos Sinos, acredito que escolher um imóvel não começa em uma lista interminável de quartos e valores — começa ouvindo pessoas.
              </p>
              <p>
                Seja para uma família buscando mais espaço e natureza, para estudantes que precisam de praticidade perto da Feevale ou Unisinos, ou para investidores atentos à valorização regional, meu compromisso é entregar clareza, acolhimento e segurança em todas as etapas da negociação.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-5 border-t border-[#0F2936]/10">
              <div>
                <div className="text-xs text-[#0F2936]/55">Registro Profissional</div>
                <div className="text-base font-bold text-[#0F2936] mt-0.5">{settings.creci}</div>
              </div>
              <div>
                <div className="text-xs text-[#0F2936]/55">Região de Atuação</div>
                <div className="text-base font-bold text-[#0F2936] mt-0.5">
                  Estância Velha e Vale dos Sinos
                </div>
              </div>
              <div>
                <div className="text-xs text-[#0F2936]/55">Instagram</div>
                <div className="text-base font-bold text-[#0F2936] mt-0.5">
                  {settings.instagramHandle}
                </div>
              </div>
            </div>

            <div className="pt-2 flex flex-wrap gap-4">
              <button
                type="button"
                onClick={() => onNavigate('/')}
                className="px-6 py-3 bg-[#0F2936] hover:bg-[#163A4D] text-white text-sm font-semibold rounded-xl cursor-pointer transition-colors"
              >
                Iniciar Busca Inteligente
              </button>
              <button
                type="button"
                onClick={() => onNavigate('/contato')}
                className="px-6 py-3 border border-[#0F2936]/20 hover:border-[#C59B48] text-[#0F2936] text-sm font-semibold rounded-xl cursor-pointer transition-colors"
              >
                Entrar em Contato
              </button>
            </div>
          </Reveal>
        </div>

        {/* 4-Step Advisory Methodology */}
        <Reveal className="pt-8 border-t border-[#0F2936]/10 space-y-8">
          <div className="max-w-2xl">
            <div className="text-xs font-semibold text-[#B08839] mb-2">
              Método de Atendimento
            </div>
            <h2 className="font-serif text-3xl sm:text-4xl font-semibold text-[#0F2936]">
              Como conduzimos sua jornada imobiliária
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              {
                num: '01.',
                title: 'Escuta de Estilo de Vida',
                desc: 'Entendemos sua rotina, deslocamentos, faculdades ou família antes de sugerir qualquer endereço.',
              },
              {
                num: '02.',
                title: 'Seleção Direcionada',
                desc: 'Apresentamos apenas imóveis compatíveis com seu perfil real, evitando visitas cansativas e perda de tempo.',
              },
              {
                num: '03.',
                title: 'Análise Técnica e Local',
                desc: 'Avaliamos posição solar, histórico construtivo, potencial de valorização e custos reais de condomínio.',
              },
              {
                num: '04.',
                title: 'Segurança Até a Entrega',
                desc: 'Acompanhamento completo em simulação bancária, documentação, registro em cartório e entrega das chaves.',
              },
            ].map((step) => (
              <div
                key={step.num}
                className="bg-white border border-[#0F2936]/10 rounded-2xl p-6 space-y-2.5"
              >
                <div className="font-serif text-3xl font-semibold text-[#C59B48] tabular-nums">
                  {step.num}
                </div>
                <h3 className="font-serif text-xl font-semibold text-[#0F2936]">
                  {step.title}
                </h3>
                <p className="text-sm text-[#0F2936]/75 leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </Reveal>

        {/* Agenciamento / Seller Exclusive CTA */}
        <Reveal>
          <div className="bg-[#0F2936] text-white rounded-2xl border border-[#C59B48]/30 p-8 sm:p-12 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="max-w-2xl space-y-2">
              <div className="text-xs font-semibold text-[#D8B467]">
                Agenciamento e Avaliação
              </div>
              <h2 className="font-serif text-2xl sm:text-4xl font-semibold text-white">
                Quer vender ou alugar seu imóvel com apresentação editorial?
              </h2>
              <p className="text-sm sm:text-base text-white/75 leading-relaxed">
                Produzimos divulgação estratégica, filtramos compradores reais e acompanhamos toda a negociação com transparência no Vale dos Sinos.
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('/contato')}
              className="px-6 py-3.5 bg-[#C59B48] hover:bg-[#B08839] text-[#081820] text-sm font-semibold rounded-xl transition-colors whitespace-nowrap shrink-0 cursor-pointer self-start lg:self-auto"
            >
              Agenciar Meu Imóvel
            </button>
          </div>
        </Reveal>
      </div>
    </div>
  );
};

interface ContactPageProps {
  settings: SiteSettings;
}

export const ContactPage: React.FC<ContactPageProps> = ({ settings }) => {
  const [name, setName] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const waUrl = `https://wa.me/${settings.whatsappNumber.replace(/\D/g, '')}?text=${encodeURIComponent(
    'Olá Luciana! Gostaria de agendar um atendimento personalizado.'
  )}`;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !whatsapp.trim()) return;
    setSending(true);
    try {
      await submitPublicLead({
        name: name.trim(),
        whatsapp: whatsapp.trim(),
        email: email.trim(),
        message: message.trim(),
        source: 'contato',
        referenceTitle: 'Página de Contato',
      });
      setSent(true);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="bg-[#FAF9F6] min-h-screen py-12 sm:py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          <Reveal className="lg:col-span-5 space-y-6">
            <div className="text-xs font-semibold text-[#B08839]">
              Atendimento Personalizado
            </div>
            <h1 className="font-serif text-4xl sm:text-5xl font-semibold text-[#0F2936]">
              Vamos conversar sobre o seu próximo imóvel
            </h1>
            <p className="text-base text-[#0F2936]/75 leading-relaxed">
              Quer agenciar seu imóvel, agendar uma visita ou tirar dúvidas sobre financiamento e bairros em Estância Velha e Vale dos Sinos? Estou à disposição.
            </p>

            <div className="space-y-4 pt-4">
              <a
                href={waUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-4 p-4 bg-white border border-[#0F2936]/10 rounded-xl hover:border-[#C59B48] transition-colors"
              >
                <MessageCircle className="w-5 h-5 text-[#16A34A] shrink-0" />
                <div>
                  <div className="text-xs text-[#0F2936]/55">WhatsApp Direto</div>
                  <div className="text-sm font-semibold text-[#0F2936]">(51) 99822-8587</div>
                </div>
              </a>

              <div className="flex items-center gap-4 p-4 bg-white border border-[#0F2936]/10 rounded-xl">
                <Instagram className="w-5 h-5 text-[#C59B48] shrink-0" />
                <div>
                  <div className="text-xs text-[#0F2936]/55">Instagram</div>
                  <div className="text-sm font-semibold text-[#0F2936]">
                    {settings.instagramHandle}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4 p-4 bg-white border border-[#0F2936]/10 rounded-xl">
                <Mail className="w-5 h-5 text-[#C59B48] shrink-0" />
                <div>
                  <div className="text-xs text-[#0F2936]/55">E-mail</div>
                  <div className="text-sm font-semibold text-[#0F2936]">
                    {settings.contactEmail}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4 p-4 bg-white border border-[#0F2936]/10 rounded-xl">
                <MapPin className="w-5 h-5 text-[#C59B48] shrink-0" />
                <div>
                  <div className="text-xs text-[#0F2936]/55">Escritório Regional</div>
                  <div className="text-sm font-semibold text-[#0F2936]">
                    {settings.officeAddress}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 text-xs text-[#0F2936]/60 pt-2">
                <Award className="w-4 h-4 text-[#C59B48]" />
                <span>{settings.brokerName} · {settings.creci}</span>
              </div>
            </div>
          </Reveal>

          <Reveal delay={0.1} className="lg:col-span-7">
            <div className="bg-white border border-[#0F2936]/10 rounded-2xl p-6 sm:p-10 shadow-sm">
              {sent ? (
                <div className="py-12 text-center space-y-3">
                  <CheckCircle2 className="w-12 h-12 text-[#C59B48] mx-auto" />
                  <h2 className="font-serif text-2xl font-semibold text-[#0F2936]">
                    Mensagem enviada com sucesso!
                  </h2>
                  <p className="text-sm text-[#0F2936]/75 max-w-md mx-auto">
                    Obrigada pelo contato. Retornarei no seu WhatsApp o mais breve possível.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <h2 className="font-serif text-2xl sm:text-3xl font-semibold text-[#0F2936]">
                    Envie uma mensagem
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-[#0F2936]/70 mb-1.5">
                        Nome completo *
                      </label>
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Seu nome"
                        className="w-full px-4 py-3 bg-[#FAF9F6] border border-[#0F2936]/15 rounded-xl text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-[#0F2936]/70 mb-1.5">
                        WhatsApp *
                      </label>
                      <input
                        type="tel"
                        required
                        value={whatsapp}
                        onChange={(e) => setWhatsapp(e.target.value)}
                        placeholder="(51) 99999-9999"
                        className="w-full px-4 py-3 bg-[#FAF9F6] border border-[#0F2936]/15 rounded-xl text-sm"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#0F2936]/70 mb-1.5">
                      E-mail
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="seu@email.com"
                      className="w-full px-4 py-3 bg-[#FAF9F6] border border-[#0F2936]/15 rounded-xl text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#0F2936]/70 mb-1.5">
                      Como posso te ajudar?
                    </label>
                    <textarea
                      rows={4}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Conte o que você procura ou se deseja agenciar um imóvel..."
                      className="w-full px-4 py-3 bg-[#FAF9F6] border border-[#0F2936]/15 rounded-xl text-sm resize-none"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={sending}
                    className="w-full py-3.5 bg-[#0F2936] hover:bg-[#163A4D] text-white font-semibold text-sm rounded-xl transition-colors cursor-pointer"
                  >
                    {sending ? 'Enviando...' : 'Enviar Mensagem para Luciana'}
                  </button>
                </form>
              )}
            </div>
          </Reveal>
        </div>
      </div>
    </div>
  );
};
