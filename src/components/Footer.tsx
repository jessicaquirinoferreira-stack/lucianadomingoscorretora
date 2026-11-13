import React from 'react';
import { DEFAULT_CATEGORIES } from '../data/seedData.ts';
import type { CatalogFilterPreset, SiteSettings } from '../types.ts';
import { BrandLogo } from './BrandLogo.tsx';
import { OfficialInstagramIcon, OfficialWhatsAppIcon } from './SocialIcons.tsx';

interface FooterProps {
  settings: SiteSettings;
  onNavigate: (path: string) => void;
  onBrowseCatalog?: (preset?: CatalogFilterPreset) => void;
}

export const Footer: React.FC<FooterProps> = ({
  settings,
  onNavigate,
  onBrowseCatalog,
}) => {
  const footerCategories = (
    settings.categories && settings.categories.length > 0
      ? settings.categories
      : DEFAULT_CATEGORIES
  ).filter((c) => c.showInMenu);

  return (
    <footer className="bg-[#0F2936] text-[#FAF9F6] border-t border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 pb-10 border-b border-white/10">
          <div className="md:col-span-4 space-y-4">
            <BrandLogo variant="light" />
            <p className="text-sm text-[#FAF9F6]/75 leading-relaxed max-w-md">
              {settings.slogan}. Atendimento humano, transparente e especializado em Estância Velha e Vale dos Sinos, Rio Grande do Sul.
            </p>
            <div className="text-xs text-[#D8B467] font-medium">
              {settings.creci} · {settings.instagramHandle}
            </div>
          </div>

          <div className="md:col-span-2 space-y-3">
            <h4 className="text-sm font-semibold text-white">Navegação</h4>
            <ul className="space-y-2 text-sm text-[#FAF9F6]/70">
              <li>
                <button type="button" onClick={() => onNavigate('/')} className="hover:text-[#D8B467] cursor-pointer">
                  Busca Inteligente
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => (onBrowseCatalog ? onBrowseCatalog() : onNavigate('/imoveis'))}
                  className="hover:text-[#D8B467] cursor-pointer"
                >
                  Imóveis Selecionados
                </button>
              </li>
              <li>
                <button type="button" onClick={() => onNavigate('/empreendimentos')} className="hover:text-[#D8B467] cursor-pointer">
                  Empreendimentos
                </button>
              </li>
              <li>
                <button type="button" onClick={() => onNavigate('/sobre')} className="hover:text-[#D8B467] cursor-pointer">
                  Sobre Luciana Domingos
                </button>
              </li>
              <li>
                <button type="button" onClick={() => onNavigate('/contato')} className="hover:text-[#D8B467] cursor-pointer">
                  Contato
                </button>
              </li>
            </ul>
          </div>

          <div className="md:col-span-3 space-y-3">
            <h4 className="text-sm font-semibold text-white">Categorias</h4>
            <ul className="grid grid-cols-2 gap-x-3 gap-y-2 text-sm text-[#FAF9F6]/70">
              {footerCategories.map((cat) => (
                <li key={cat.id}>
                  <button
                    type="button"
                    onClick={() =>
                      onBrowseCatalog
                        ? onBrowseCatalog({ propertyType: cat.name })
                        : onNavigate('/imoveis')
                    }
                    className="hover:text-[#D8B467] cursor-pointer text-left truncate max-w-full"
                  >
                    {cat.name}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div className="md:col-span-3 space-y-3">
            <h4 className="text-sm font-semibold text-white">Atendimento Regional</h4>
            <p className="text-sm text-[#FAF9F6]/70 leading-relaxed">
              {settings.officeAddress}
            </p>
            <p className="text-sm text-[#FAF9F6]/70">
              E-mail: {settings.contactEmail}
            </p>
            <a
              href={`https://wa.me/${settings.whatsappNumber.replace(/\D/g, '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm font-semibold text-[#D8B467] hover:text-white transition-colors"
            >
              WhatsApp: (51) 99822-8587
            </a>
          </div>
        </div>

        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#FAF9F6]/55">
          <span>
            © {new Date().getFullYear()} Luciana Domingos Imóveis · {settings.creci}. Todos os direitos reservados.
          </span>
          <button
            type="button"
            onClick={() => onNavigate('/admin')}
            className="text-[#FAF9F6]/60 hover:text-[#D8B467] transition-colors cursor-pointer"
          >
            Painel Administrativo
          </button>
        </div>
      </div>
    </footer>
  );
};

interface WhatsAppFloatProps {
  whatsappNumber: string;
  instagramHandle?: string;
}

export const WhatsAppFloat: React.FC<WhatsAppFloatProps> = ({
  whatsappNumber,
  instagramHandle = '@lucianadomingos.imoveis',
}) => {
  const cleanNumber = whatsappNumber.replace(/\D/g, '');
  const cleanInsta = instagramHandle.replace(/^@/, '').trim() || 'lucianadomingos.imoveis';
  const waHref = `https://wa.me/${cleanNumber}?text=${encodeURIComponent(
    'Olá Luciana! Vim pelo site e gostaria de ajuda para encontrar o imóvel ideal.'
  )}`;
  const instaHref = `https://instagram.com/${cleanInsta}`;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end gap-3">
      <a
        href={instaHref}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`Seguir ${instagramHandle} no Instagram`}
        title={`Instagram ${instagramHandle}`}
        className="w-12 h-12 sm:w-13 sm:h-13 rounded-full text-white shadow-lg flex items-center justify-center transition-transform duration-200 hover:scale-105"
        style={{
          background:
            'radial-gradient(circle at 30% 107%, #fdf497 0%, #fdf497 5%, #fd5949 45%, #d6249f 60%, #285AEB 90%)',
        }}
      >
        <OfficialInstagramIcon className="w-6 h-6" />
      </a>

      <a
        href={waHref}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Conversar com Luciana Domingos no WhatsApp"
        title="WhatsApp Luciana Domingos"
        className="w-12 h-12 sm:w-13 sm:h-13 rounded-full bg-[#25D366] hover:bg-[#1EBE5B] text-white shadow-lg flex items-center justify-center transition-transform duration-200 hover:scale-105"
      >
        <OfficialWhatsAppIcon className="w-6 h-6" />
      </a>
    </div>
  );
};
