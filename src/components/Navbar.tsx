import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { ChevronDown, Menu, X } from 'lucide-react';
import { DEFAULT_CATEGORIES } from '../data/seedData.ts';
import type { CatalogFilterPreset, SiteSettings } from '../types.ts';
import { BrandLogo } from './BrandLogo.tsx';

interface NavbarProps {
  currentPath: string;
  onNavigate: (path: string) => void;
  onBrowseCatalog?: (preset?: CatalogFilterPreset) => void;
  settings: SiteSettings;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentPath,
  onNavigate,
  onBrowseCatalog,
  settings,
}) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const dropdownTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const menuCategories = (
    settings.categories && settings.categories.length > 0
      ? settings.categories
      : DEFAULT_CATEGORIES
  ).filter((c) => c.showInMenu);

  const links = [
    { label: 'Busca IA', path: '/' },
    { label: 'Imóveis', path: '/imoveis', hasCategories: true },
    { label: 'Empreendimentos', path: '/empreendimentos' },
    { label: 'Sobre', path: '/sobre' },
    { label: 'Contato', path: '/contato' },
  ];

  const handleLink = (path: string) => {
    setMobileOpen(false);
    setCategoriesOpen(false);
    if (path === '/imoveis' && onBrowseCatalog) {
      onBrowseCatalog();
      return;
    }
    onNavigate(path);
  };

  const handleSelectCategory = (categoryName?: string) => {
    setMobileOpen(false);
    setCategoriesOpen(false);
    if (onBrowseCatalog) {
      onBrowseCatalog(categoryName ? { propertyType: categoryName } : undefined);
    } else {
      onNavigate('/imoveis');
    }
  };

  const openDropdown = () => {
    if (dropdownTimeoutRef.current) {
      window.clearTimeout(dropdownTimeoutRef.current);
      dropdownTimeoutRef.current = null;
    }
    setCategoriesOpen(true);
  };

  const scheduleCloseDropdown = () => {
    if (dropdownTimeoutRef.current) {
      window.clearTimeout(dropdownTimeoutRef.current);
    }
    dropdownTimeoutRef.current = window.setTimeout(() => {
      setCategoriesOpen(false);
    }, 150);
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

        {/* Zone 2: Concise single-line nav links + dynamic category menu under Imóveis */}
        <nav className="hidden lg:flex items-center gap-8 text-sm font-medium text-[#0F2936]/75">
          {links.map((item) => {
            const active =
              currentPath === item.path ||
              (item.path === '/imoveis' && currentPath === '/resultados');

            if (item.hasCategories) {
              return (
                <div
                  key={item.path}
                  className="relative"
                  onMouseEnter={openDropdown}
                  onMouseLeave={scheduleCloseDropdown}
                >
                  <div className="flex items-center gap-1">
                    <button
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
                    <button
                      type="button"
                      onClick={() => setCategoriesOpen((prev) => !prev)}
                      aria-label="Abrir categorias de imóveis"
                      aria-expanded={categoriesOpen}
                      className="p-1 text-[#0F2936]/60 hover:text-[#0F2936] cursor-pointer"
                    >
                      <ChevronDown
                        className={`w-3.5 h-3.5 transition-transform duration-200 ${
                          categoriesOpen ? 'rotate-180 text-[#C59B48]' : ''
                        }`}
                      />
                    </button>
                  </div>

                  {categoriesOpen && (
                    <div
                      onMouseEnter={openDropdown}
                      onMouseLeave={scheduleCloseDropdown}
                      className="absolute left-0 top-full pt-2 w-64 z-50"
                    >
                      <div className="bg-white border border-[#0F2936]/12 rounded-xl shadow-xl py-2 overflow-hidden">
                        <button
                          type="button"
                          onClick={() => handleSelectCategory()}
                          className="w-full text-left px-4 py-2 text-xs font-semibold text-[#B08839] hover:bg-[#FAF9F6] transition-colors cursor-pointer"
                        >
                          Todos os Imóveis
                        </button>
                        <div className="my-1 border-t border-[#0F2936]/8" />
                        <div className="max-h-72 overflow-y-auto">
                          {menuCategories.map((cat) => (
                            <button
                              key={cat.id}
                              type="button"
                              onClick={() => handleSelectCategory(cat.name)}
                              className="w-full text-left px-4 py-2 text-sm text-[#0F2936]/85 hover:bg-[#FAF9F6] hover:text-[#0F2936] flex items-center justify-between transition-colors cursor-pointer"
                            >
                              <span className="font-medium">{cat.name}</span>
                              {cat.kicker && (
                                <span className="text-[10px] text-[#0F2936]/45 truncate max-w-[110px]">
                                  {cat.kicker}
                                </span>
                              )}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            }

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
            <div key={item.path}>
              <button
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
              {item.hasCategories && menuCategories.length > 0 && (
                <div className="pl-3 pb-2 grid grid-cols-2 gap-1.5">
                  {menuCategories.map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => handleSelectCategory(cat.name)}
                      className="text-left px-3 py-2 rounded-lg text-xs font-medium text-[#0F2936]/75 bg-white border border-[#0F2936]/8 hover:border-[#C59B48] cursor-pointer truncate"
                    >
                      {cat.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
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
