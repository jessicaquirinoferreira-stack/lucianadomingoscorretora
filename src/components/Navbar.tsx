import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Menu, X } from 'lucide-react';
import type { SiteSettings } from '../types.ts';
import { BrandLogo } from './BrandLogo.tsx';

interface NavbarProps {
  currentPath: string;
  onNavigate: (path: string) => void;
  settings: SiteSettings;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentPath,
  onNavigate,
  settings,
}) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const links = [
    { label: 'Busca IA', path: '/' },
    { label: 'Imóveis', path: '/imoveis' },
    { label: 'Empreendimentos', path: '/empreendimentos' },
    { label: 'Sobre', path: '/sobre' },
    { label: 'Contato', path: '/contato' },
  ];

  const handleLink = (path: string) => {
    setMobileOpen(false);
    onNavigate(path);
  };

  const waUrl = `https://wa.me/${settings.whatsappNumber.replace(/\D/g, '')}?text=${encodeURIComponent(
    'Olá Luciana! Gostaria de conversar sobre imóveis em Estância Velha e Vale dos Sinos.'
  )}`;

  return (
    <header
      className={`sticky top-0 z-40 transition-all duration-300 border-b ${
        scrolled
          ? 'bg-[#FAF9F6]/92 backdrop-blur-xl border-[#0F2936]/12 shadow-sm'
          : 'bg-[#FAF9F6]/98 backdrop-blur-md border-[#0F2936]/8'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between gap-8">
        {/* Zone 1: Single-line Brand Wordmark */}
        <button
          type="button"
          onClick={() => handleLink('/')}
          className="text-left focus-visible:outline-none cursor-pointer shrink-0"
          aria-label="Página inicial Luciana Domingos Imóveis"
        >
          <BrandLogo variant="horizontal" />
        </button>

        {/* Zone 2: 5 concise single-line nav links with animated gold underline */}
        <nav className="hidden lg:flex items-center gap-8 text-sm font-medium text-[#0F2936]/75">
          {links.map((item) => {
            const active =
              currentPath === item.path ||
              (item.path === '/imoveis' && currentPath === '/resultados');
            return (
              <button
                key={item.path}
                type="button"
                onClick={() => handleLink(item.path)}
                className={`relative whitespace-nowrap shrink-0 py-1.5 transition-colors cursor-pointer ${
                  active ? 'text-[#0F2936] font-semibold' : 'hover:text-[#0F2936]'
                }`}
              >
                {item.label}
                {active && (
                  <motion.span
                    layoutId="navbar-active-underline"
                    transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                    className="absolute inset-x-0 bottom-0 h-[2px] bg-[#C59B48]"
                  />
                )}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: Primary CTAs */}
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={() => handleLink('/admin')}
            className="hidden sm:inline-flex items-center justify-center px-3.5 py-2.5 text-xs font-semibold text-[#0F2936] border border-[#0F2936]/20 hover:border-[#C59B48] hover:bg-[#C59B48]/10 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            Painel Admin
          </button>

          <a
            href={waUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:inline-flex items-center justify-center px-5 py-2.5 text-sm font-semibold text-white bg-[#0F2936] hover:bg-[#163A4D] rounded-lg transition-all duration-200 border border-[#C59B48]/30 hover:border-[#C59B48] whitespace-nowrap shrink-0"
          >
            Falar com Luciana
          </a>

          <button
            type="button"
            onClick={() => setMobileOpen((prev) => !prev)}
            className="lg:hidden p-2.5 rounded-lg text-[#0F2936] hover:bg-[#0F2936]/5 cursor-pointer"
            aria-label={mobileOpen ? 'Fechar menu' : 'Abrir menu'}
          >
            {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      {mobileOpen && (
        <div className="lg:hidden bg-[#FAF9F6] border-t border-[#0F2936]/10 px-4 py-4 space-y-1">
          {links.map((item) => (
            <button
              key={item.path}
              type="button"
              onClick={() => handleLink(item.path)}
              className={`block w-full text-left px-3 py-3 rounded-lg text-base font-medium transition-colors cursor-pointer ${
                currentPath === item.path
                  ? 'bg-[#0F2936]/5 text-[#0F2936] font-semibold'
                  : 'text-[#0F2936]/80 hover:bg-[#0F2936]/5'
              }`}
            >
              {item.label}
            </button>
          ))}
          <div className="pt-3 space-y-2">
            <button
              type="button"
              onClick={() => handleLink('/admin')}
              className="block w-full text-center px-5 py-3 text-sm font-semibold text-[#0F2936] border border-[#0F2936]/20 rounded-lg cursor-pointer"
            >
              Entrar no Painel Admin
            </button>
            <a
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full text-center px-5 py-3 text-sm font-semibold text-white bg-[#0F2936] rounded-lg"
            >
              Atendimento via WhatsApp
            </a>
          </div>
        </div>
      )}
    </header>
  );
};
