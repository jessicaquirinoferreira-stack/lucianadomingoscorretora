import type {
  Development,
  LandingPage,
  Lead,
  Property,
  SiteCategory,
  SiteSettings,
  Testimonial,
} from '../types.ts';

const BLOB_SITE_BASE = 'https://vmyn8cm8axjnihyn.public.blob.vercel-storage.com/site-assets';

export const BRAND_IMAGES = {
  hero: `${BLOB_SITE_BASE}/hero_architecture_sinos_1794521105207.jpg`,
  broker: 'https://i.postimg.cc/kX3LpCsv/3524.jpg',
  brokerPortrait: 'https://i.postimg.cc/kX3LpCsv/3524.jpg',
  assistant: `${BLOB_SITE_BASE}/assistant_avatar_sofia_1794569265266.jpg`,
  devReserva: `${BLOB_SITE_BASE}/dev_reserva_bosque_1794521106578.jpg`,
  devVista: `${BLOB_SITE_BASE}/dev_vista_universitaria_1794521106898.jpg`,
  interiorLiving: `${BLOB_SITE_BASE}/prop_interior_living_1794521107024.jpg`,
  leisureAmenities: `${BLOB_SITE_BASE}/prop_leisure_amenities_1794521107705.jpg`,
};

export function normalizeAssetImageUrl(url?: string): string {
  if (!url) return '';
  if (url.startsWith('/src/assets/images/')) {
    const file = url.replace('/src/assets/images/', '');
    return `${BLOB_SITE_BASE}/${file}`;
  }
  if (url.startsWith('/images/')) {
    const file = url.replace('/images/', '');
    return `${BLOB_SITE_BASE}/${file}`;
  }
  if (
    url === 'https://i.postimg.cc/J7Nj4FY9/Retrato-corporativo-de-mulher-sorridente.png' ||
    url === 'https://i.postimg.cc/kX3LpCsv/3524.jpg'
  ) {
    return 'https://i.postimg.cc/kX3LpCsv/3524.jpg';
  }
  return url;
}

export function getLocalFallbackImageUrl(url?: string): string | null {
  if (!url) return null;
  if (url.startsWith(`${BLOB_SITE_BASE}/`)) {
    return `/images/${url.slice(BLOB_SITE_BASE.length + 1)}`;
  }
  return null;
}

const NOW = '2026-11-10T12:00:00.000Z';

export const DEFAULT_CATEGORIES: SiteCategory[] = [
  {
    id: 'cat_apartamento',
    name: 'Apartamento',
    slug: 'apartamento',
    kicker: 'Arquitetura & Conforto',
    description: 'Plantas funcionais, sacadas gourmet e infraestrutura completa de condomínio.',
    image: BRAND_IMAGES.interiorLiving,
    showInMenu: true,
    showOnHome: true,
  },
  {
    id: 'cat_casa',
    name: 'Casa',
    slug: 'casa',
    kicker: 'Espaço & Privacidade',
    description: 'Residências térreas e em condomínio com pátio, área verde e conforto familiar.',
    image: BRAND_IMAGES.hero,
    showInMenu: true,
    showOnHome: true,
  },
  {
    id: 'cat_sobrado',
    name: 'Sobrado',
    slug: 'sobrado',
    kicker: 'Amplitude & Design',
    description: 'Projetos modernos em dois pavimentos com excelente aproveitamento solar.',
    image: BRAND_IMAGES.devReserva,
    showInMenu: true,
    showOnHome: true,
  },
  {
    id: 'cat_cobertura',
    name: 'Cobertura',
    slug: 'cobertura',
    kicker: 'Exclusividade & Vista',
    description: 'Terraços privativos e ambientes amplos para receber com sofisticação.',
    image: BRAND_IMAGES.leisureAmenities,
    showInMenu: true,
    showOnHome: true,
  },
  {
    id: 'cat_studio',
    name: 'Studio',
    slug: 'studio',
    kicker: 'Praticidade Urbana',
    description: 'Unidades compactas e inteligentes perto de universidades e serviços essenciais.',
    image: BRAND_IMAGES.devVista,
    showInMenu: true,
    showOnHome: true,
  },
  {
    id: 'cat_terreno',
    name: 'Terreno',
    slug: 'terreno',
    kicker: 'Construa do Seu Jeito',
    description: 'Lotes urbanos planos e terrenos em condomínio fechado para morar ou investir.',
    image: BRAND_IMAGES.devReserva,
    showInMenu: true,
    showOnHome: true,
  },
  {
    id: 'cat_comercial',
    name: 'Comercial',
    slug: 'comercial',
    kicker: 'Negócios & Investimento',
    description: 'Salas e pontos comerciais estratégicos nos principais eixos do Vale dos Sinos.',
    image: BRAND_IMAGES.devVista,
    showInMenu: true,
    showOnHome: false,
  },
];

export const SEED_SETTINGS: SiteSettings = {
  id: 'main',
  brokerName: 'Luciana Domingos',
  creci: 'CRECI 73892F',
  slogan: 'Especialista em encontrar o imóvel perfeito para realizar seu sonho',
  heroHeadline: 'O imóvel certo começa entendendo a sua história.',
  heroSubheadline:
    'Aqui a gente não te joga um monte de filtro. A gente entende o que você realmente precisa e te mostra as melhores opções em Estância Velha e Vale dos Sinos.',
  whatsappNumber: '5551998228587',
  instagramHandle: '@lucianadomingos.imoveis',
  contactEmail: 'contato@lucianadomingos.com.br',
  officeAddress: 'Av. Presidente Vargas, 1240 · Centro, Estância Velha · RS',
  categories: DEFAULT_CATEGORIES,
  updatedAt: NOW,
};

export const SEED_PROPERTIES: Property[] = [
  {
    id: 'prop_floresta_residence',
    title: 'Apartamento Jardim das Araucárias com Sacada Gourmet',
    slug: 'apartamento-jardim-das-araucarias-estancia-velha',
    description:
      'Projeto contemporâneo no coração do Bairro Floresta em Estância Velha. Planta inteligente com ampla integração entre estar, jantar e sacada com churrasqueira a carvão, iluminação natural privilegiada e vista permanente para área verde preservada.',
    propertyType: 'Apartamento',
    purpose: 'Venda',
    status: 'Disponível',
    price: 685000,
    condoFee: 490,
    iptu: 1450,
    areaSqm: 112,
    bedrooms: 3,
    suites: 1,
    bathrooms: 2,
    parkingSpaces: 2,
    city: 'Estância Velha',
    neighborhood: 'Floresta',
    address: 'Rua das Araucárias, 380 · Floresta, Estância Velha',
    nearUniversity: false,
    universityDistance: '12 min da Universidade Feevale',
    occupancyType: 'Exclusivo',
    idealForPeople: '3 a 4 pessoas (família)',
    lifestyleTags: [
      'Tranquilidade e natureza',
      'Condomínio com lazer completo',
      'Família',
      'Sacada gourmet',
    ],
    features: [
      'Churrasqueira na sacada',
      'Piso vinílico nas áreas íntimas',
      'Espera para split em todos os cômodos',
      '2 vagas cobertas lado a lado',
      'Salão de festas e piscina aquecida',
    ],
    images: [
      BRAND_IMAGES.interiorLiving,
      BRAND_IMAGES.devReserva,
      BRAND_IMAGES.leisureAmenities,
    ],
    featured: true,
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    id: 'prop_vista_feevale_2q',
    title: 'Apartamento 2 Dormitórios no Eixo Feevale · Ideal para Estudantes ou Casal',
    slug: 'apartamento-2-dormitorios-eixo-feevale',
    description:
      'Localização estratégica a poucos minutos do Campus II da Universidade Feevale e com acesso rápido à RS-239 para Estância Velha. Planta versátil que funciona perfeitamente tanto para moradia exclusiva de casal quanto para dois estudantes dividirem com total privacidade.',
    propertyType: 'Apartamento',
    purpose: 'Venda',
    status: 'Disponível',
    price: 410000,
    condoFee: 340,
    iptu: 920,
    areaSqm: 68,
    bedrooms: 2,
    suites: 1,
    bathrooms: 2,
    parkingSpaces: 1,
    city: 'Novo Hamburgo',
    neighborhood: 'Vila Nova (Divisa Estância Velha)',
    address: 'Rua Dr. Maurício Cardoso, 1850 · Eixo Feevale',
    nearUniversity: true,
    universityDistance: '4 min a pé da Universidade Feevale',
    occupancyType: 'Ambos',
    idealForPeople: '2 pessoas',
    lifestyleTags: [
      'Próximo de faculdade',
      'Praticidade urbana',
      'Compartilhado ou exclusivo',
      'Coworking no condomínio',
    ],
    features: [
      '2 banheiros completos (ideal para dividir)',
      'Espaço coworking e sala de estudos no térreo',
      'Lavanderia compartilhada equipada',
      'Fechadura eletrônica',
      'Bicicletário e tomada para carro elétrico',
    ],
    images: [
      BRAND_IMAGES.devVista,
      BRAND_IMAGES.interiorLiving,
      BRAND_IMAGES.leisureAmenities,
    ],
    featured: true,
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    id: 'prop_casa_encosta_sol',
    title: 'Casa Contemporânea com Piscina Borda Infinita na Encosta do Sol',
    slug: 'casa-contemporanea-encosta-do-sol-estancia-velha',
    description:
      'Residência térrea e superior com arquitetura autoral em pedra travertino, madeira nobre e amplos panos de vidro integrados à mata nativa. Privacidade absoluta em uma das regiões mais valorizadas de Estância Velha.',
    propertyType: 'Casa',
    purpose: 'Venda',
    status: 'Disponível',
    price: 1490000,
    condoFee: 0,
    iptu: 3200,
    areaSqm: 285,
    bedrooms: 4,
    suites: 3,
    bathrooms: 5,
    parkingSpaces: 4,
    city: 'Estância Velha',
    neighborhood: 'Encosta do Sol',
    address: 'Alameda dos Ipês, 92 · Encosta do Sol, Estância Velha',
    nearUniversity: false,
    universityDistance: '10 min da Feevale',
    occupancyType: 'Exclusivo',
    idealForPeople: '4 ou mais pessoas (família)',
    lifestyleTags: [
      'Casa com pátio e privacidade',
      'Tranquilidade e natureza',
      'Alto padrão',
      'Piscina privativa',
    ],
    features: [
      'Piscina aquecida com deck em madeira cumaru',
      'Energia solar fotovoltaica instalada',
      'Espaço gourmet com lareira e adega',
      'Escritório privativo para home office',
      'Pátio arborizado com 640m² de terreno',
    ],
    images: [
      BRAND_IMAGES.hero,
      BRAND_IMAGES.interiorLiving,
      BRAND_IMAGES.leisureAmenities,
    ],
    featured: true,
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    id: 'prop_studio_estancia_centro',
    title: 'Studio Exclusivo Mobiliado no Centro de Estância Velha',
    slug: 'studio-mobiliado-centro-estancia-velha',
    description:
      'Praticidade máxima para quem vive sozinho, estuda na região ou busca rotina ágil no Centro de Estância Velha. Totalmente mobiliado sob medida, a 2 quadras de supermercados, cafés, academia e parada direta para Feevale e Unisinos.',
    propertyType: 'Studio',
    purpose: 'Locação',
    status: 'Disponível',
    price: 2350,
    condoFee: 260,
    iptu: 110,
    areaSqm: 41,
    bedrooms: 1,
    suites: 1,
    bathrooms: 1,
    parkingSpaces: 1,
    city: 'Estância Velha',
    neighborhood: 'Centro',
    address: 'Av. Sete de Setembro, 610 · Centro, Estância Velha',
    nearUniversity: true,
    universityDistance: '8 min da Feevale · acesso direto BR-116',
    occupancyType: 'Exclusivo',
    idealForPeople: '1 pessoa',
    lifestyleTags: [
      'Próximo de faculdade',
      'Praticidade urbana',
      'Exclusivo',
      'Mobiliado',
    ],
    features: [
      'Móveis planejados e eletrodomésticos completos',
      'Bancada de estudos iluminada',
      'Ar-condicionado inverter instalado',
      'Portaria virtual 24h',
      'Vaga de garagem coberta',
    ],
    images: [
      BRAND_IMAGES.interiorLiving,
      BRAND_IMAGES.devVista,
    ],
    featured: false,
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    id: 'prop_cobertura_vila_rosa',
    title: 'Cobertura Linear Exclusiva com Terraço e Lazer Completo',
    slug: 'cobertura-linear-vila-rosa-estancia-velha',
    description:
      'Elegância e amplitude em Estância Velha. Cobertura com pé-direito duplo no living, terraço descoberto para receber amigos ao pôr do sol e condomínio clube completo com piscina térmica e salão gourmet.',
    propertyType: 'Cobertura',
    purpose: 'Venda',
    status: 'Disponível',
    price: 1120000,
    condoFee: 680,
    iptu: 2100,
    areaSqm: 194,
    bedrooms: 3,
    suites: 3,
    bathrooms: 4,
    parkingSpaces: 3,
    city: 'Estância Velha',
    neighborhood: 'Vila Rosa',
    address: 'Rua Monteiro Lobato, 420 · Vila Rosa, Estância Velha',
    nearUniversity: false,
    universityDistance: '11 min da Feevale',
    occupancyType: 'Exclusivo',
    idealForPeople: '2 a 4 pessoas',
    lifestyleTags: [
      'Condomínio com lazer completo',
      'Alto padrão',
      'Exclusivo',
      'Terraço gourmet',
    ],
    features: [
      '3 suítes amplas com persianas automatizadas',
      'Terraço privativo com espera para spa',
      'Elevador codificado direto no hall',
      '3 vagas de garagem + depósito privativo',
    ],
    images: [
      BRAND_IMAGES.leisureAmenities,
      BRAND_IMAGES.devReserva,
      BRAND_IMAGES.interiorLiving,
    ],
    featured: true,
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    id: 'prop_residencial_unisinos_2q',
    title: 'Apartamento 2 Quartos Próximo à Unisinos · Opção Compartilhada ou Casal',
    slug: 'apartamento-proximo-unisinos-sao-leopoldo',
    description:
      'Ideal para estudantes da Unisinos ou jovens profissionais no Vale dos Sinos. Planta com 2 dormitórios equidistantes para máxima privacidade, a 600 metros da estação Trensurb e do campus universitário.',
    propertyType: 'Apartamento',
    purpose: 'Venda',
    status: 'Disponível',
    price: 339000,
    condoFee: 310,
    iptu: 750,
    areaSqm: 62,
    bedrooms: 2,
    suites: 0,
    bathrooms: 1,
    parkingSpaces: 1,
    city: 'São Leopoldo',
    neighborhood: 'Cristo Rei',
    address: 'Av. Unisinos, 980 · Cristo Rei, São Leopoldo',
    nearUniversity: true,
    universityDistance: '5 min a pé da Unisinos',
    occupancyType: 'Ambos',
    idealForPeople: '2 pessoas',
    lifestyleTags: [
      'Próximo de faculdade',
      'Praticidade urbana',
      'Compartilhado ou exclusivo',
      'Investimento com alta liquidez',
    ],
    features: [
      'A 5 minutos da Unisinos e Estação Trensurb',
      'Sacada integrada com churrasqueira',
      'Salão de festas e espaço estudos',
      'Excelente potencial de rentabilidade para locação',
    ],
    images: [
      BRAND_IMAGES.devVista,
      BRAND_IMAGES.interiorLiving,
    ],
    featured: false,
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    id: 'prop_terreno_lago_azul',
    title: 'Terreno Plano de Esquina em Condomínio Fechado no Bairro Lago Azul',
    slug: 'terreno-plano-esquina-lago-azul-estancia-velha',
    description:
      'Excelente lote plano com 420 m² (14m x 30m) em rua tranquila e arborizada no Bairro Lago Azul, Estância Velha. Orientação solar frente norte, pronto para construir residência contemporânea com ampla área de lazer.',
    propertyType: 'Terreno',
    purpose: 'Venda',
    status: 'Disponível',
    price: 365000,
    condoFee: 320,
    iptu: 890,
    areaSqm: 420,
    bedrooms: 0,
    suites: 0,
    bathrooms: 0,
    parkingSpaces: 0,
    city: 'Estância Velha',
    neighborhood: 'Lago Azul',
    address: 'Rua das Paineiras, Lote 18 · Lago Azul, Estância Velha',
    nearUniversity: false,
    universityDistance: '14 min da Universidade Feevale',
    occupancyType: 'Exclusivo',
    idealForPeople: 'Projeto residencial ou investimento',
    lifestyleTags: [
      'Tranquilidade e natureza',
      'Construção personalizada',
      'Condomínio fechado',
      'Frente norte',
    ],
    features: [
      'Terreno 100% plano pronto para construir',
      'Matrícula individualizada e escritura imediata',
      'Frente solar norte com vista para área verde',
      'Infraestrutura completa com portaria e salão de festas',
    ],
    images: [
      BRAND_IMAGES.devReserva,
      BRAND_IMAGES.hero,
    ],
    featured: true,
    createdAt: NOW,
    updatedAt: NOW,
  },
];

export const SEED_DEVELOPMENTS: Development[] = [
  {
    id: 'dev_reserva_do_bosque',
    name: 'Reserva do Bosque Residences',
    slug: 'reserva-do-bosque-residences',
    developer: 'Construtora Serra & Sinos',
    tagline: 'Arquitetura autoral abraçada pela natureza no bairro mais desejado de Estância Velha.',
    description:
      'Um empreendimento boutique com apenas 24 unidades exclusivas, pensado para quem valoriza silêncio, luz natural e acabamentos nobres em pedra natural e brises de madeira. Localizado em rua arborizada no Bairro Floresta, a 3 minutos do Centro de Estância Velha.',
    stage: 'Em Obras',
    deliveryDate: 'Dezembro de 2027',
    city: 'Estância Velha',
    neighborhood: 'Floresta',
    address: 'Rua das Araucárias, 450 · Floresta, Estância Velha - RS',
    startingPrice: 640000,
    heroImage: BRAND_IMAGES.devReserva,
    galleryImages: [
      BRAND_IMAGES.devReserva,
      BRAND_IMAGES.interiorLiving,
      BRAND_IMAGES.leisureAmenities,
      BRAND_IMAGES.hero,
    ],
    floorPlanImages: [
      BRAND_IMAGES.interiorLiving,
    ],
    typologies: [
      {
        name: 'Apartamento Tipo · 2 Suítes + Lavabo',
        areaSqm: '98 m² privativos',
        bedrooms: '2 Suítes',
        parking: '2 vagas cobertas',
        priceFrom: 640000,
      },
      {
        name: 'Apartamento Garden · 3 Dormitórios (1 Suíte)',
        areaSqm: '138 m² privativos',
        bedrooms: '3 Dormitórios',
        parking: '2 vagas cobertas',
        priceFrom: 820000,
      },
      {
        name: 'Cobertura Penthouse · 3 Suítes',
        areaSqm: '196 m² privativos',
        bedrooms: '3 Suítes',
        parking: '3 vagas cobertas',
        priceFrom: 1280000,
      },
    ],
    amenities: [
      'Piscina aquecida com raia e deck solar',
      'Salão Gourmet envidraçado integrado ao bosque',
      'Academia panorâmica equipada',
      'Coworking privativo com salas de reunião',
      'Espaço Kids e Pet Place cercado',
      'Garagem com infraestrutura para recarga elétrica',
    ],
    differentials: [
      'Apenas 2 apartamentos por andar para máxima privacidade',
      'Esquadrias termoacústicas com vidro duplo',
      'Brises móveis em madeira certificada para controle solar',
      'Valorização histórica superior a 14% ao ano no Bairro Floresta',
    ],
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    id: 'dev_vista_universitaria',
    name: 'Vista Universitária Smart Living',
    slug: 'vista-universitaria-smart-living',
    developer: 'Grupo Sinos Incorporações',
    tagline: 'Moradia inteligente, conectada e a passos da Feevale e do eixo Estância Velha.',
    description:
      'Desenvolvido para a nova geração de estudantes, jovens profissionais e investidores do Vale dos Sinos. Plantas flexíveis de 1 e 2 dormitórios com coworking aberto 24h, lavanderia compartilhada e alta liquidez de locação.',
    stage: 'Lançamento',
    deliveryDate: 'Agosto de 2028',
    city: 'Novo Hamburgo',
    neighborhood: 'Vila Nova · Eixo Feevale',
    address: 'Av. Dr. Maurício Cardoso, 2100 · Novo Hamburgo / Divisa Estância Velha',
    startingPrice: 315000,
    heroImage: BRAND_IMAGES.devVista,
    galleryImages: [
      BRAND_IMAGES.devVista,
      BRAND_IMAGES.interiorLiving,
      BRAND_IMAGES.leisureAmenities,
    ],
    floorPlanImages: [
      BRAND_IMAGES.interiorLiving,
    ],
    typologies: [
      {
        name: 'Studio Smart · Planta Integrada',
        areaSqm: '38 m² privativos',
        bedrooms: '1 Dormitório',
        parking: '1 vaga opcional',
        priceFrom: 315000,
      },
      {
        name: 'Apartamento Dual · 2 Suítes (Ideal para dividir)',
        areaSqm: '66 m² privativos',
        bedrooms: '2 Suítes',
        parking: '1 vaga coberta',
        priceFrom: 448000,
      },
    ],
    amenities: [
      'Pavilhão Coworking & Café com internet fibra redundante',
      'Rooftop Lounge com vista para o Vale dos Sinos',
      'Lavanderia Smart OMO compartilhada',
      'Mini mercado autônomo 24h no hall',
      'Bicicletário com oficina rápida',
    ],
    differentials: [
      'A 400 metros do Campus II da Universidade Feevale',
      'Acesso em 6 minutos ao Centro de Estância Velha via RS-239',
      'Plantas Dual-Suite pensadas para compartilhar sem perder privacidade',
      'Condições facilitadas de fluxo direto na planta',
    ],
    createdAt: NOW,
    updatedAt: NOW,
  },
];

export const SEED_LANDING_PAGES: LandingPage[] = [
  {
    id: 'lp_reserva_do_bosque',
    developmentId: 'dev_reserva_do_bosque',
    slug: 'reserva-do-bosque-residences',
    status: 'published',
    heroTitle: 'Reserva do Bosque Residences',
    heroSlogan: 'Onde a arquitetura contemporânea encontra a serenidade de Estância Velha.',
    heroSubtitle:
      'Apenas 24 residências exclusivas no Bairro Floresta, com amplas sacadas gourmet, vista permanente para a mata nativa e infraestrutura de clube privado.',
    heroImage: BRAND_IMAGES.devReserva,
    ctaPrimaryText: 'Receber Tabela e Plantas Exclusivas',
    differentials: [
      {
        title: 'Exclusividade Real: 2 por Andar',
        description:
          'Privacidade acústica e visual com elevador codificado e ventilação cruzada em todas as plantas.',
      },
      {
        title: 'Arquitetura Biofílica e Materiais Nobres',
        description:
          'Fachada em pedra ardósia escura, brises de cedro natural e guarda-corpos em vidro laminado.',
      },
      {
        title: 'Conforto Termoacústico Superior',
        description:
          'Esquadrias de alto desempenho, manta acústica entre lajes e espera para automação residencial.',
      },
      {
        title: 'Localização Nobre no Bairro Floresta',
        description:
          'Rua tranquila e arborizada a 3 minutos do Centro de Estância Velha e com acesso rápido à BR-116 e Feevale.',
      },
    ],
    galleryImages: [
      BRAND_IMAGES.devReserva,
      BRAND_IMAGES.interiorLiving,
      BRAND_IMAGES.leisureAmenities,
      BRAND_IMAGES.hero,
    ],
    floorPlanImages: [BRAND_IMAGES.interiorLiving],
    typologies: SEED_DEVELOPMENTS[0].typologies,
    locationSummary:
      'Situado no ponto mais valorizado do Bairro Floresta em Estância Velha, o Reserva do Bosque une o sossego de uma vizinhança residencial arborizada com a conveniência de estar a minutos de escolas, supermercados e do eixo universitário e empresarial do Vale dos Sinos.',
    nearbyHighlights: [
      '3 min do Centro de Estância Velha',
      '10 min da Universidade Feevale (Campus II)',
      '12 min do Centro de Novo Hamburgo',
      '8 min de acesso à BR-116',
    ],
    mapQuery: 'Bairro Floresta, Estância Velha, RS',
    leisureHighlights: [
      'Piscina aquecida com raia e deck em madeira nobre',
      'Salão Gourmet envidraçado integrado ao jardim',
      'Academia panorâmica com equipamentos de ponta',
      'Coworking privativo para trabalho remoto',
      'Espaço Kids e Pet Place cercado',
      'Tomadas individuais para veículos elétricos',
    ],
    whyInvestTitle: 'Por que investir no Reserva do Bosque Residences',
    whyInvestReasons: [
      {
        title: 'Escassez de Terrenos Nobres em Estância Velha',
        description:
          'Projetos boutique com baixa densidade de unidades possuem alta demanda de revenda e valorização acelerada até a entrega das chaves.',
      },
      {
        title: 'Fluxo de Pagamento Inteligente Durante a Obra',
        description:
          'Parcelamento direto com a construtora até dezembro de 2027, otimizando seu capital sem descapitalização imediata.',
      },
      {
        title: 'Assessoria Completa Luciana Domingos (CRECI 73892F)',
        description:
          'Acompanhamento jurídico, análise de valorização e negociação direta das melhores unidades solares disponíveis.',
      },
    ],
    trustQuote:
      'A Luciana entendeu exatamente o que nossa família buscava em Estância Velha. Em vez de mandar dezenas de links aleatórios, ela nos apresentou o Reserva do Bosque e cuidou de cada detalhe da negociação com total transparência.',
    trustAuthor: 'Mariana e Rafael Becker · Compradores no Bairro Floresta',
    seoTitle: 'Reserva do Bosque Residences | Estância Velha · Luciana Domingos',
    seoDescription:
      'Conheça o Reserva do Bosque Residences em Estância Velha. Apartamentos de 2 e 3 suítes com lazer completo no Bairro Floresta. Atendimento exclusivo com Luciana Domingos.',
    createdAt: NOW,
    updatedAt: NOW,
  },
];

export const SEED_TESTIMONIALS: Testimonial[] = [
  {
    id: 'test_1',
    clientName: 'Mariana & Rafael Becker',
    clientRole: 'Compradores de Apartamento 3 Dormitórios',
    city: 'Estância Velha · RS',
    quote:
      'Passamos meses perdidos em portais cheios de filtros que não faziam sentido. A Luciana nos ouviu por 15 minutos, entendeu nossa rotina com crianças e apresentou o apartamento certo na segunda visita.',
    approved: true,
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    id: 'test_2',
    clientName: 'Gabriel Silveira',
    clientRole: 'Mestrando na Feevale & Investidor',
    city: 'Novo Hamburgo · RS',
    quote:
      'Eu precisava de um imóvel funcional perto da Feevale para morar com segurança e manter valor de revenda. O atendimento da Luciana foi humano, direto e impecável na documentação.',
    approved: true,
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    id: 'test_3',
    clientName: 'Camila Dornelles',
    clientRole: 'Proprietária de Casa no Encosta do Sol',
    city: 'Estância Velha · RS',
    quote:
      'Vendi meu apartamento e comprei nossa casa em condomínio com a consultoria da Luciana. Ela conduziu tudo com calma, clareza nos números e muita sensibilidade com o momento da nossa família.',
    approved: true,
    createdAt: NOW,
    updatedAt: NOW,
  },
];

export const SEED_LEADS: Lead[] = [
  {
    id: 'lead_demo_1',
    name: 'Fernanda Martins',
    whatsapp: '51999123456',
    email: 'fernanda.martins@exemplo.com',
    message: 'Busco apartamento para 2 pessoas próximo à Feevale com vaga coberta.',
    source: 'busca_inteligente',
    referenceId: 'prop_vista_feevale_2q',
    referenceTitle: 'Apartamento 2 Dormitórios no Eixo Feevale',
    status: 'Novo',
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    id: 'lead_demo_2',
    name: 'Henrique Almeida',
    whatsapp: '51998445566',
    email: 'henrique@exemplo.com',
    message: 'Gostaria de receber a tabela de disponibilidade do Reserva do Bosque.',
    source: 'landing_page',
    referenceId: 'lp_reserva_do_bosque',
    referenceTitle: 'Reserva do Bosque Residences',
    status: 'Em Atendimento',
    createdAt: NOW,
    updatedAt: NOW,
  },
];
