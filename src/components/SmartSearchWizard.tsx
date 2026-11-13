import React, { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Search,
  Sparkles,
} from 'lucide-react';
import type { SmartSearchAnswers } from '../types.ts';

interface SmartSearchWizardProps {
  onSubmit: (answers: SmartSearchAnswers) => Promise<void>;
  isSearching: boolean;
}

const STEPS = [
  {
    key: 'peopleCount' as const,
    number: '01',
    question: 'Para quantas pessoas é o imóvel?',
    subtitle: 'Definimos metragem ideal e distribuição de dormitórios para sua rotina.',
    options: [
      'Apenas 1 pessoa',
      '2 pessoas (casal ou amigos)',
      'Família de 3 a 4 pessoas',
      'Família grande (5 ou mais pessoas)',
    ],
  },
  {
    key: 'studentOrUniversity' as const,
    number: '02',
    question: 'Você é estudante ou busca próximo de faculdade?',
    subtitle: 'Consideramos deslocamento ágil para Feevale, Unisinos e vias principais.',
    options: [
      'Sim, quero ficar próximo à Feevale ou Unisinos',
      'Sim, estudo ou trabalho híbrido com fácil acesso',
      'Não é prioridade no momento',
    ],
  },
  {
    key: 'occupancyPreference' as const,
    number: '03',
    question: 'Prefere apartamento compartilhado ou exclusivo?',
    subtitle: 'Temos opções com suítes independentes perfeitas para dividir ou viver só.',
    options: [
      'Exclusivo para mim ou minha família',
      'Compartilhado (dividir custos com privacidade)',
      'Aberto às melhores sugestões',
    ],
  },
  {
    key: 'lifestyle' as const,
    number: '04',
    question: 'Qual o estilo de vida desejado?',
    subtitle: 'Escolha a atmosfera que mais combina com o seu dia a dia.',
    options: [
      'Tranquilidade e contato com a natureza',
      'Praticidade urbana perto de serviços e cafés',
      'Condomínio com lazer completo e segurança',
      'Casa com pátio, jardim e privacidade',
    ],
  },
  {
    key: 'region' as const,
    number: '05',
    question: 'Preferência de região em Estância Velha ou Vale dos Sinos?',
    subtitle: 'Selecionamos bairros com excelente liquidez e qualidade de vida.',
    options: [
      'Estância Velha (Floresta, Centro, Encosta do Sol)',
      'Novo Hamburgo / Eixo Feevale',
      'São Leopoldo / Próximo à Unisinos',
      'Campo Bom ou qualquer cidade do Vale dos Sinos',
    ],
  },
  {
    key: 'budgetRange' as const,
    number: '06',
    question: 'Faixa de investimento aproximada (opcional)',
    subtitle: 'Escolha uma referência ou avance direto para ver a seleção personalizada.',
    options: [
      'Até R$ 350 mil',
      'Entre R$ 350 mil e R$ 700 mil',
      'Entre R$ 700 mil e R$ 1,2 milhão',
      'Acima de R$ 1,2 milhão',
      'Busco locação ou prefiro conversar com a Luciana',
    ],
  },
];

export const SmartSearchWizard: React.FC<SmartSearchWizardProps> = ({
  onSubmit,
  isSearching,
}) => {
  const [freeText, setFreeText] = useState('');
  const [wizardOpen, setWizardOpen] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const [answers, setAnswers] = useState<SmartSearchAnswers>({
    freeText: '',
    peopleCount: '',
    studentOrUniversity: '',
    occupancyPreference: '',
    lifestyle: '',
    region: '',
    budgetRange: '',
  });

  const currentStep = STEPS[stepIndex];

  const goToStep = (nextIdx: number) => {
    setDirection(nextIdx >= stepIndex ? 1 : -1);
    setStepIndex(nextIdx);
  };

  const handleOptionSelect = (value: string) => {
    const updated = { ...answers, [currentStep.key]: value, freeText };
    setAnswers(updated);
    if (stepIndex < STEPS.length - 1) {
      setTimeout(() => goToStep(stepIndex + 1), 170);
    }
  };

  const handleQuickSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit({ ...answers, freeText });
  };

  const handleFinishWizard = async () => {
    await onSubmit({ ...answers, freeText });
  };

  return (
    <div className="bg-white/95 backdrop-blur-xl border border-[#C59B48]/30 rounded-2xl shadow-2xl p-6 sm:p-8 lg:p-10">
      {/* Main Conversational Prompt */}
      <form onSubmit={handleQuickSearch} className="space-y-4">
        <label
          htmlFor="smart-search-input"
          className="block font-serif text-2xl sm:text-3xl font-semibold text-[#0F2936]"
        >
          Me conta o que você precisa no seu próximo imóvel?
        </label>
        <p className="text-sm text-[#0F2936]/70 max-w-2xl">
          Descreva com suas palavras ou responda às 6 perguntas guiadas para nossa inteligência consultiva revelar as opções certas.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 pt-1">
          <div className="relative flex-1">
            <Search className="w-5 h-5 text-[#C59B48] absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              id="smart-search-input"
              type="text"
              value={freeText}
              onChange={(e) => setFreeText(e.target.value)}
              placeholder="Ex: Apartamento para 2 pessoas perto da Feevale ou casa tranquila em Estância Velha..."
              className="w-full pl-12 pr-4 py-4 bg-[#FAF9F6] border border-[#0F2936]/15 rounded-xl text-sm sm:text-base text-[#0F2936] placeholder:text-[#0F2936]/45 focus:border-[#C59B48] focus:bg-white transition-colors"
            />
          </div>
          <button
            type="submit"
            disabled={isSearching}
            className="px-7 py-4 bg-[#0F2936] hover:bg-[#163A4D] disabled:opacity-60 text-white font-semibold text-sm rounded-xl transition-all flex items-center justify-center gap-2 whitespace-nowrap shrink-0 cursor-pointer border border-[#C59B48]/40"
          >
            <Sparkles className="w-4 h-4 text-[#D8B467]" />
            {isSearching ? 'Analisando perfil...' : 'Encontrar imóveis'}
          </button>
        </div>
      </form>

      {/* Guided Discovery Toggle / Animated Cards */}
      <div className="mt-6 pt-5 border-t border-[#0F2936]/10">
        {!wizardOpen ? (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="text-sm text-[#0F2936]/75">
              Prefere um atendimento passo a passo? Responda em 6 cards rápidos.
            </div>
            <button
              type="button"
              onClick={() => setWizardOpen(true)}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border border-[#C59B48] text-[#0F2936] font-semibold text-sm hover:bg-[#C59B48]/12 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              Iniciar Busca Guiada (6 etapas)
              <ArrowRight className="w-4 h-4 text-[#B08839]" />
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Progress Header */}
            <div className="flex items-center justify-between gap-4">
              <div className="text-xs font-semibold text-[#B08839] tabular-nums">
                Etapa {String(stepIndex + 1).padStart(2, '0')} de{' '}
                {String(STEPS.length).padStart(2, '0')}
              </div>
              <div className="flex items-center gap-1.5 flex-1 max-w-xs">
                {STEPS.map((s, idx) => (
                  <button
                    key={s.key}
                    type="button"
                    onClick={() => goToStep(idx)}
                    aria-label={`Ir para etapa ${idx + 1}`}
                    className="h-1.5 flex-1 rounded-full bg-[#0F2936]/10 overflow-hidden cursor-pointer"
                  >
                    <motion.div
                      initial={false}
                      animate={{ scaleX: idx <= stepIndex ? 1 : 0 }}
                      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                      style={{ transformOrigin: '0% 50%' }}
                      className="w-full h-full bg-[#C59B48]"
                    />
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={() => setWizardOpen(false)}
                className="text-xs text-[#0F2936]/55 hover:text-[#0F2936] cursor-pointer"
              >
                Minimizar
              </button>
            </div>

            {/* Choreographed Question Card */}
            <div className="overflow-hidden">
              <AnimatePresence mode="wait" custom={direction}>
                <motion.div
                  key={currentStep.key}
                  custom={direction}
                  initial={{ opacity: 0, x: direction * 24 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: direction * -24 }}
                  transition={{ duration: 0.26, ease: [0.16, 1, 0.3, 1] }}
                >
                  <h3 className="font-serif text-xl sm:text-2xl font-semibold text-[#0F2936]">
                    {currentStep.number}. {currentStep.question}
                  </h3>
                  <p className="text-xs sm:text-sm text-[#0F2936]/65 mt-1">
                    {currentStep.subtitle}
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
                    {currentStep.options.map((opt) => {
                      const selected = answers[currentStep.key] === opt;
                      return (
                        <motion.button
                          key={opt}
                          type="button"
                          whileHover={{ y: -1 }}
                          whileTap={{ scale: 0.99 }}
                          onClick={() => handleOptionSelect(opt)}
                          className={`text-left px-4 py-3.5 rounded-xl border text-sm font-medium transition-colors flex items-center justify-between gap-3 cursor-pointer ${
                            selected
                              ? 'border-[#C59B48] bg-[#0F2936] text-white shadow-sm'
                              : 'border-[#0F2936]/12 bg-[#FAF9F6] text-[#0F2936] hover:border-[#C59B48]/75 hover:bg-white'
                          }`}
                        >
                          <span>{opt}</span>
                          {selected && <Check className="w-4 h-4 text-[#D8B467] shrink-0" />}
                        </motion.button>
                      );
                    })}
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Wizard Navigation */}
            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={() => goToStep(Math.max(0, stepIndex - 1))}
                disabled={stepIndex === 0}
                className="inline-flex items-center gap-1.5 text-sm font-medium text-[#0F2936]/70 hover:text-[#0F2936] disabled:opacity-35 cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                Voltar
              </button>

              {stepIndex < STEPS.length - 1 ? (
                <button
                  type="button"
                  onClick={() => goToStep(stepIndex + 1)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-[#0F2936] hover:text-[#B08839] cursor-pointer"
                >
                  Pular / Próxima
                  <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleFinishWizard}
                  disabled={isSearching}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-[#C59B48] hover:bg-[#B08839] text-[#081820] font-semibold text-sm rounded-xl transition-colors cursor-pointer"
                >
                  <Sparkles className="w-4 h-4" />
                  {isSearching ? 'Montando seleção ideal...' : 'Ver Minhas Opções Ideais'}
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
