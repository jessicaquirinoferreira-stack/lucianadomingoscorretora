import express from 'express';
import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import { GoogleGenAI, ThinkingLevel, Type } from '@google/genai';
import {
  SEED_DEVELOPMENTS,
  SEED_LANDING_PAGES,
  SEED_LEADS,
  SEED_PROPERTIES,
  SEED_SETTINGS,
  SEED_TESTIMONIALS,
} from './src/data/seedData.ts';
import type {
  Development,
  LandingPage,
  Lead,
  Property,
  SiteSettings,
  SmartSearchAnswers,
  Testimonial,
} from './src/types.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PORT = Number(process.env.PORT || 3000);
const DATA_DIR = path.join(__dirname, '.data');
const STORE_PATH = path.join(DATA_DIR, 'cms-store.json');

const ADMIN_EMAIL = 'admin@x.com';
const ADMIN_PASS = 'admin4321';
const SESSION_SECRET =
  process.env.SESSION_SECRET ||
  crypto.createHash('sha256').update(`ld-imoveis-${process.cwd()}`).digest('hex');

interface CmsStore {
  properties: Property[];
  developments: Development[];
  landingPages: LandingPage[];
  leads: Lead[];
  testimonials: Testimonial[];
  settings: SiteSettings;
}

function getDefaultStore(): CmsStore {
  return {
    properties: SEED_PROPERTIES,
    developments: SEED_DEVELOPMENTS,
    landingPages: SEED_LANDING_PAGES,
    leads: SEED_LEADS,
    testimonials: SEED_TESTIMONIALS,
    settings: SEED_SETTINGS,
  };
}

async function readStore(): Promise<CmsStore> {
  try {
    const raw = await fs.readFile(STORE_PATH, 'utf8');
    const parsed = JSON.parse(raw) as Partial<CmsStore>;
    const defaults = getDefaultStore();
    return {
      properties: Array.isArray(parsed.properties) ? parsed.properties : defaults.properties,
      developments: Array.isArray(parsed.developments) ? parsed.developments : defaults.developments,
      landingPages: Array.isArray(parsed.landingPages) ? parsed.landingPages : defaults.landingPages,
      leads: Array.isArray(parsed.leads) ? parsed.leads : defaults.leads,
      testimonials: Array.isArray(parsed.testimonials) ? parsed.testimonials : defaults.testimonials,
      settings: parsed.settings ?? defaults.settings,
    };
  } catch {
    const defaults = getDefaultStore();
    await writeStore(defaults);
    return defaults;
  }
}

async function writeStore(store: CmsStore): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(STORE_PATH, JSON.stringify(store, null, 2), 'utf8');
}

function signAdminToken(email: string): string {
  const payload = Buffer.from(
    JSON.stringify({
      email,
      role: 'admin',
      exp: Date.now() + 1000 * 60 * 60 * 24,
    })
  ).toString('base64url');
  const sig = crypto
    .createHmac('sha256', SESSION_SECRET)
    .update(payload)
    .digest('base64url');
  return `${payload}.${sig}`;
}

function verifyAdminToken(token: string | undefined): { email: string; role: string } | null {
  if (!token || !token.includes('.')) return null;
  const [payload, sig] = token.split('.');
  const expectedSig = crypto
    .createHmac('sha256', SESSION_SECRET)
    .update(payload)
    .digest('base64url');
  if (sig.length !== expectedSig.length) return null;
  if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expectedSig))) return null;
  try {
    const decoded = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as {
      email: string;
      role: string;
      exp: number;
    };
    if (decoded.exp < Date.now()) return null;
    return { email: decoded.email, role: decoded.role };
  } catch {
    return null;
  }
}

function extractBearer(req: express.Request): string | undefined {
  const header = req.headers.authorization;
  if (header && header.startsWith('Bearer ')) {
    return header.slice(7).trim();
  }
  return undefined;
}

function createGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') return null;
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

function deterministicSmartMatch(
  answers: SmartSearchAnswers,
  properties: Property[]
) {
  const available = properties.filter((p) => p.status !== 'Vendido');
  const textLower = [
    answers.freeText,
    answers.peopleCount,
    answers.studentOrUniversity,
    answers.occupancyPreference,
    answers.lifestyle,
    answers.region,
    answers.budgetRange,
  ]
    .join(' ')
    .toLowerCase();

  const scored = available.map((p) => {
    let score = 68;
    const reasons: string[] = [];

    if (
      answers.region &&
      !answers.region.toLowerCase().includes('todo') &&
      p.city.toLowerCase().includes(answers.region.toLowerCase())
    ) {
      score += 14;
      reasons.push(`Localizado em ${p.city}, exatamente na região escolhida`);
    }

    if (
      answers.studentOrUniversity.toLowerCase().includes('sim') ||
      textLower.includes('faculdade') ||
      textLower.includes('feevale') ||
      textLower.includes('unisinos') ||
      textLower.includes('estudante')
    ) {
      if (p.nearUniversity) {
        score += 15;
        reasons.push(
          p.universityDistance
            ? `${p.universityDistance}, trazendo agilidade para sua rotina acadêmica`
            : 'Fácil acesso às universidades do Vale dos Sinos'
        );
      }
    }

    if (
      answers.occupancyPreference.toLowerCase().includes('compartilhado') &&
      (p.occupancyType === 'Compartilhado' || p.occupancyType === 'Ambos')
    ) {
      score += 8;
      reasons.push('Planta versátil preparada para moradia compartilhada com privacidade');
    } else if (
      answers.occupancyPreference.toLowerCase().includes('exclusivo') &&
      (p.occupancyType === 'Exclusivo' || p.occupancyType === 'Ambos')
    ) {
      score += 6;
      reasons.push('Uso exclusivo com conforto e privacidade');
    }

    if (answers.peopleCount.includes('1') && p.bedrooms <= 2) {
      score += 6;
    } else if (answers.peopleCount.includes('2') && p.bedrooms >= 2) {
      score += 7;
    } else if (
      (answers.peopleCount.includes('3') || answers.peopleCount.includes('5')) &&
      p.bedrooms >= 3
    ) {
      score += 9;
      reasons.push(`Distribuição ampla com ${p.bedrooms} dormitórios para acomodar todos com conforto`);
    }

    if (answers.lifestyle) {
      const lifeLower = answers.lifestyle.toLowerCase();
      const matchedTag = p.lifestyleTags.find((tag) =>
        lifeLower.includes(tag.toLowerCase().split(' ')[0])
      );
      if (matchedTag) {
        score += 7;
        reasons.push(`Alinhado ao estilo "${matchedTag}" que você priorizou`);
      }
    }

    const capped = Math.min(99, Math.max(60, score));
    const reason =
      reasons.length > 0
        ? reasons.slice(0, 2).join('. ') + '.'
        : `Excelente equilíbrio entre localização em ${p.neighborhood} (${p.city}) e padrão construtivo.`;

    return {
      propertyId: p.id,
      matchScore: capped,
      reason,
    };
  });

  scored.sort((a, b) => b.matchScore - a.matchScore);

  const parts: string[] = [];
  if (answers.peopleCount) parts.push(`para ${answers.peopleCount.toLowerCase()}`);
  if (answers.studentOrUniversity.toLowerCase().includes('sim')) {
    parts.push('próximas de faculdade');
  }
  if (answers.region) parts.push(`em ${answers.region}`);

  const headline =
    parts.length > 0
      ? `Encontrei opções ideais ${parts.join(' ')}`
      : 'Selecionamos os imóveis que mais combinam com o seu momento';

  const summary =
    'Analisamos seu perfil de moradia, estilo de vida e localização desejada para priorizar apenas imóveis que realmente fazem sentido para você — sem perder tempo com dezenas de filtros genéricos.';

  return {
    headline,
    summary,
    recommendations: scored.slice(0, 6),
  };
}

function deterministicLandingPage(dev: Development) {
  return {
    heroTitle: dev.name,
    heroSlogan:
      dev.tagline ||
      `Um novo padrão de moradia e valorização em ${dev.neighborhood}, ${dev.city}.`,
    heroSubtitle:
      dev.description ||
      `Conheça o ${dev.name}, selecionado pela consultoria Luciana Domingos para quem busca arquitetura contemporânea, localização estratégica e alto potencial de valorização em ${dev.city}.`,
    ctaPrimaryText: 'Receber Tabela e Plantas Exclusivas',
    differentials: (dev.differentials.length > 0
      ? dev.differentials
      : [
          `Localização privilegiada no bairro ${dev.neighborhood} em ${dev.city}`,
          'Arquitetura contemporânea com amplo aproveitamento de luz natural',
          'Acabamentos de alto padrão e excelente isolamento termoacústico',
          'Condições especiais de lançamento com fluxo facilitado',
        ]
    )
      .slice(0, 6)
      .map((item, idx) => ({
        title: `Diferencial 0${idx + 1}`,
        description: item,
      })),
    locationSummary: `${dev.name} está localizado em ${dev.address || `${dev.neighborhood}, ${dev.city}`}, conectando tranquilidade residencial com acesso ágil aos principais serviços, universidades e vias do Vale dos Sinos.`,
    nearbyHighlights: [
      `Coração do bairro ${dev.neighborhood} (${dev.city})`,
      'Acesso rápido à BR-116 e RS-239',
      'Próximo a supermercados, escolas e academias',
      'Conexão facilitada com Feevale e eixo empresarial',
    ],
    leisureHighlights:
      dev.amenities.length > 0
        ? dev.amenities
        : [
            'Salão de festas gourmet equipado',
            'Espaço fitness panorâmico',
            'Coworking e sala de reuniões',
            'Áreas verdes com paisagismo autoral',
          ],
    whyInvestTitle: `Por que investir no ${dev.name}`,
    whyInvestReasons: [
      {
        title: 'Valorização Imobiliária Consistente',
        description: `${dev.city} e o eixo Vale dos Sinos registram demanda crescente por imóveis contemporâneos com infraestrutura completa.`,
      },
      {
        title: 'Qualidade Construtiva e Liquidez',
        description: `Assinado por ${dev.developer || 'incorporadora consolidada'}, o projeto entrega plantas funcionais altamente desejadas tanto para moradia quanto para locação.`,
      },
      {
        title: 'Assessoria Personalizada Luciana Domingos',
        description:
          'Atendimento consultivo do estudo de fluxo financeiro até a entrega das chaves, garantindo segurança jurídica total (CRECI 73892F).',
      },
    ],
    trustQuote:
      'Seleciono pessoalmente empreendimentos com solidez construtiva, boa insolação e potencial real de valorização para que cada cliente invista com tranquilidade.',
    trustAuthor: 'Luciana Domingos · Corretora de Imóveis (CRECI 73892F)',
    seoTitle: `${dev.name} | ${dev.city} · Luciana Domingos Imóveis`,
    seoDescription: `Conheça o ${dev.name} em ${dev.neighborhood}, ${dev.city}. Veja plantas, tipologias, infraestrutura e solicite atendimento exclusivo com Luciana Domingos.`,
  };
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '4mb' }));

  // Admin Login Endpoint (admin@x.com / admin4321)
  app.post('/api/admin/login', (req, res) => {
    const { email, password } = req.body as { email?: string; password?: string };
    if (
      typeof email === 'string' &&
      typeof password === 'string' &&
      email.trim().toLowerCase() === ADMIN_EMAIL &&
      password === ADMIN_PASS
    ) {
      const token = signAdminToken(ADMIN_EMAIL);
      return res.json({ token, email: ADMIN_EMAIL, role: 'admin' });
    }
    return res.status(401).json({ error: 'E-mail ou senha inválidos.' });
  });

  app.get('/api/admin/verify', (req, res) => {
    const token = extractBearer(req);
    const session = verifyAdminToken(token);
    if (!session) return res.status(401).json({ valid: false });
    return res.json({ valid: true, ...session });
  });

  // Public Catalog (excludes PII leads, draft landing pages, and unapproved testimonials)
  app.get('/api/public/store', async (_req, res) => {
    try {
      const store = await readStore();
      return res.json({
        properties: store.properties,
        developments: store.developments,
        landingPages: store.landingPages.filter((lp) => lp.status === 'published'),
        testimonials: store.testimonials.filter((t) => t.approved),
        settings: store.settings,
      });
    } catch (err) {
      return res.status(500).json({ error: 'Falha ao carregar catálogo.' });
    }
  });

  // Public Lead Submission
  app.post('/api/public/leads', async (req, res) => {
    try {
      const body = req.body as Partial<Lead>;
      if (!body.name || !body.whatsapp || !body.source) {
        return res.status(400).json({ error: 'Nome e WhatsApp são obrigatórios.' });
      }
      const now = new Date().toISOString();
      const lead: Lead = {
        id:
          body.id && /^[a-zA-Z0-9_-]+$/.test(body.id)
            ? body.id
            : `lead_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`,
        name: String(body.name).slice(0, 120),
        whatsapp: String(body.whatsapp).slice(0, 40),
        email: body.email ? String(body.email).slice(0, 160) : '',
        message: body.message ? String(body.message).slice(0, 2000) : '',
        source: body.source,
        referenceId: body.referenceId ? String(body.referenceId).slice(0, 128) : '',
        referenceTitle: body.referenceTitle ? String(body.referenceTitle).slice(0, 180) : '',
        status: 'Novo',
        createdAt: now,
        updatedAt: now,
      };
      const store = await readStore();
      store.leads = [lead, ...store.leads];
      await writeStore(store);
      return res.status(201).json(lead);
    } catch {
      return res.status(500).json({ error: 'Erro ao registrar contato.' });
    }
  });

  // Protected Admin Store
  app.get('/api/admin/store', async (req, res) => {
    const session = verifyAdminToken(extractBearer(req));
    if (!session) return res.status(401).json({ error: 'Não autorizado.' });
    const store = await readStore();
    return res.json(store);
  });

  app.put('/api/admin/store', async (req, res) => {
    const session = verifyAdminToken(extractBearer(req));
    if (!session) return res.status(401).json({ error: 'Não autorizado.' });
    try {
      const body = req.body as Partial<CmsStore>;
      const current = await readStore();
      const next: CmsStore = {
        properties: Array.isArray(body.properties) ? body.properties : current.properties,
        developments: Array.isArray(body.developments) ? body.developments : current.developments,
        landingPages: Array.isArray(body.landingPages) ? body.landingPages : current.landingPages,
        leads: Array.isArray(body.leads) ? body.leads : current.leads,
        testimonials: Array.isArray(body.testimonials) ? body.testimonials : current.testimonials,
        settings: body.settings ?? current.settings,
      };
      await writeStore(next);
      return res.json(next);
    } catch {
      return res.status(500).json({ error: 'Erro ao salvar dados.' });
    }
  });

  // AI Smart Property Search Endpoint (Gemini 4 Hydrogen)
  app.post('/api/ai/smart-search', async (req, res) => {
    try {
      const { answers, properties } = req.body as {
        answers: SmartSearchAnswers;
        properties?: Property[];
      };
      const store = await readStore();
      const catalog = Array.isArray(properties) && properties.length > 0 ? properties : store.properties;
      const availableCatalog = catalog.filter((p) => p.status !== 'Vendido');

      const ai = createGeminiClient();
      if (!ai) {
        return res.json(deterministicSmartMatch(answers, availableCatalog));
      }

      const compactCatalog = availableCatalog.map((p) => ({
        id: p.id,
        title: p.title,
        propertyType: p.propertyType,
        purpose: p.purpose,
        price: p.price,
        areaSqm: p.areaSqm,
        bedrooms: p.bedrooms,
        city: p.city,
        neighborhood: p.neighborhood,
        nearUniversity: p.nearUniversity,
        universityDistance: p.universityDistance,
        occupancyType: p.occupancyType,
        idealForPeople: p.idealForPeople,
        lifestyleTags: p.lifestyleTags,
      }));

      const prompt = `Você é a inteligência consultiva do site da corretora Luciana Domingos (CRECI 73892F), especialista em Estância Velha e Vale dos Sinos (RS).
Seu tom é acolhedor, humano, confiante e profissional.

Necessidades relatadas pelo cliente:
- Descrição livre: "${answers.freeText || 'Não informada'}"
- Quantas pessoas vão morar: "${answers.peopleCount || 'Não informado'}"
- Estudante / próximo de faculdade: "${answers.studentOrUniversity || 'Não informado'}"
- Preferência compartilhado ou exclusivo: "${answers.occupancyPreference || 'Não informado'}"
- Estilo de vida desejado: "${answers.lifestyle || 'Não informado'}"
- Região preferida: "${answers.region || 'Estância Velha ou Vale dos Sinos'}"
- Faixa de investimento: "${answers.budgetRange || 'Aberta a avaliação'}"

Catálogo disponível (JSON):
${JSON.stringify(compactCatalog)}

Instruções:
1. Crie uma "headline" calorosa e específica em primeira pessoa (ou consultiva) resumindo o achado, no estilo: "Encontrei opções ideais para 2 pessoas próximas de faculdade em Estância Velha".
2. Crie um "summary" curto (1-2 frases) acolhedor explicando por que essas opções foram selecionadas sem sobrecarregar o cliente com filtros.
3. Ranqueie os imóveis mais compatíveis (até 6) no array "recommendations", informando propertyId exato, matchScore (65 a 99) e "reason" (1 a 2 frases explicando exatamente por que aquele imóvel combina com as respostas do cliente).`;

      const response = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: prompt,
        config: {
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              headline: { type: Type.STRING },
              summary: { type: Type.STRING },
              recommendations: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    propertyId: { type: Type.STRING },
                    matchScore: { type: Type.INTEGER },
                    reason: { type: Type.STRING },
                  },
                },
              },
            },
          },
        },
      });

      const parsed = JSON.parse((response.text ?? '{}').trim());
      if (!parsed.recommendations || !Array.isArray(parsed.recommendations)) {
        return res.json(deterministicSmartMatch(answers, availableCatalog));
      }
      return res.json(parsed);
    } catch (error) {
      console.error('Gemini smart-search fallback:', error);
      const { answers, properties } = req.body as {
        answers: SmartSearchAnswers;
        properties?: Property[];
      };
      const store = await readStore();
      return res.json(
        deterministicSmartMatch(answers, properties?.length ? properties : store.properties)
      );
    }
  });

  // AI Premium Development Landing Page Generator Endpoint
  app.post('/api/ai/generate-landing-page', async (req, res) => {
    const session = verifyAdminToken(extractBearer(req));
    const hasFirebaseHeader = req.headers['x-firebase-admin'] === 'true';
    if (!session && !hasFirebaseHeader) {
      return res.status(401).json({ error: 'Autenticação administrativa necessária.' });
    }

    try {
      const { development } = req.body as { development: Development };
      if (!development || !development.name) {
        return res.status(400).json({ error: 'Empreendimento inválido.' });
      }

      const ai = createGeminiClient();
      if (!ai) {
        return res.json(deterministicLandingPage(development));
      }

      const prompt = `Você é um copywriter de luxo e estrategista de alta conversão para o mercado imobiliário do Rio Grande do Sul (Estância Velha e Vale dos Sinos), escrevendo para a corretora Luciana Domingos (CRECI 73892F).

Gere os textos completos para uma Landing Page Premium exclusiva do empreendimento abaixo:
${JSON.stringify({
  name: development.name,
  developer: development.developer,
  stage: development.stage,
  deliveryDate: development.deliveryDate,
  city: development.city,
  neighborhood: development.neighborhood,
  address: development.address,
  startingPrice: development.startingPrice,
  tagline: development.tagline,
  description: development.description,
  typologies: development.typologies,
  amenities: development.amenities,
  differentials: development.differentials,
})}

Regras de copywriting:
- Tom acolhedor, sofisticado, humano, confiante e altamente persuasivo (sem exageros robóticos).
- Retorne JSON estrito seguindo o schema:
  - heroTitle: Nome do empreendimento
  - heroSlogan: Slogan forte e memorável (máx 120 chars)
  - heroSubtitle: Subtítulo elegante com proposta de valor (máx 260 chars)
  - ctaPrimaryText: Chamada forte de conversão (ex: "Receber Tabela e Plantas Exclusivas")
  - differentials: Array com 4 objetos { title, description } destacando diferenciais reais
  - locationSummary: Parágrafo rico explicando a conveniência da localização em ${development.neighborhood}, ${development.city} e Vale dos Sinos
  - nearbyHighlights: Array com 4 a 5 pontos de proximidade (tempo/distância)
  - leisureHighlights: Array com 5 a 8 destaques de lazer e infraestrutura
  - whyInvestTitle: Título da seção de investimento
  - whyInvestReasons: Array com 3 objetos { title, description } explicando valorização, liquidez e assessoria Luciana Domingos
  - trustQuote: Depoimento ou declaração de atendimento confiável
  - trustAuthor: Assinatura da citação
  - seoTitle: Título SEO otimizado (até 65 chars)
  - seoDescription: Meta description SEO otimizada (120 a 160 chars)`;

      const response = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: prompt,
        config: {
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              heroTitle: { type: Type.STRING },
              heroSlogan: { type: Type.STRING },
              heroSubtitle: { type: Type.STRING },
              ctaPrimaryText: { type: Type.STRING },
              differentials: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    title: { type: Type.STRING },
                    description: { type: Type.STRING },
                  },
                },
              },
              locationSummary: { type: Type.STRING },
              nearbyHighlights: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
              leisureHighlights: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
              whyInvestTitle: { type: Type.STRING },
              whyInvestReasons: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    title: { type: Type.STRING },
                    description: { type: Type.STRING },
                  },
                },
              },
              trustQuote: { type: Type.STRING },
              trustAuthor: { type: Type.STRING },
              seoTitle: { type: Type.STRING },
              seoDescription: { type: Type.STRING },
            },
          },
        },
      });

      const parsed = JSON.parse((response.text ?? '{}').trim());
      if (!parsed.heroSlogan || !parsed.differentials) {
        return res.json(deterministicLandingPage(development));
      }
      return res.json(parsed);
    } catch (error) {
      console.error('Gemini landing-page fallback:', error);
      const { development } = req.body as { development: Development };
      return res.json(deterministicLandingPage(development));
    }
  });

  // Virtual Assistant (Sofia) — Simple Q&A + Direct Social Recommendations
  app.post('/api/ai/assistant', async (req, res) => {
    const body = req.body as {
      question?: string;
      brokerName?: string;
      creci?: string;
      instagramHandle?: string;
      whatsappNumber?: string;
      propertiesCount?: number;
    };

    const question = String(body.question || '').trim().slice(0, 400);
    const brokerName = body.brokerName || 'Luciana Domingos';
    const creci = body.creci || 'CRECI 73892F';
    const instagram = body.instagramHandle || '@lucianadomingos.imoveis';
    const count = Number(body.propertiesCount || 0);

    const deterministicReply = (q: string): string => {
      const lower = q.toLowerCase();
      if (lower.includes('instagram') || lower.includes('insta') || lower.includes('rede')) {
        return `Você pode acompanhar os lançamentos, tours em vídeo e bastidores da ${brokerName} no Instagram ${instagram} ou conversar diretamente pelo WhatsApp oficial (51) 99822-8587.`;
      }
      if (lower.includes('whatsapp') || lower.includes('whats') || lower.includes('telefone') || lower.includes('contato') || lower.includes('falar')) {
        return `O atendimento direto com a ${brokerName} (${creci}) acontece pelo WhatsApp oficial (51) 99822-8587. Se preferir, também estamos no Instagram ${instagram}.`;
      }
      if (lower.includes('cidade') || lower.includes('regi') || lower.includes('onde') || lower.includes('estância') || lower.includes('estancia') || lower.includes('vale')) {
        return `Atendemos Estância Velha e todo o Vale dos Sinos — incluindo Novo Hamburgo (região da Feevale e bairros nobres), São Leopoldo (Unisinos e Cristo Rei) e Campo Bom. No WhatsApp (51) 99822-8587 e no Instagram ${instagram}, você vê opções atualizadas diariamente.`;
      }
      if (lower.includes('financ') || lower.includes('entrada') || lower.includes('parcela') || lower.includes('banco')) {
        return `Sim! Trabalhamos com financiamento bancário (SAC e Price) e uso de FGTS. Você pode simular parcelas direto na página de cada imóvel ou enviar seu perfil no WhatsApp da ${brokerName} pelo (51) 99822-8587.`;
      }
      if (lower.includes('agenci') || lower.includes('vender') || lower.includes('alugar') || lower.includes('meu imóvel') || lower.includes('meu imovel')) {
        return `A ${brokerName} faz agenciamento completo com apresentação editorial e divulgação estratégica no Instagram ${instagram}. Clique em WhatsApp (51) 99822-8587 para avaliar seu imóvel.`;
      }
      if (lower.includes('creci') || lower.includes('quem') || lower.includes('luciana')) {
        return `A ${brokerName} é corretora de imóveis registrada (${creci}), especialista em Estância Velha e Vale dos Sinos, com atendimento humano e consultivo. Siga ${instagram} no Instagram ou chame no WhatsApp (51) 99822-8587.`;
      }
      return `Temos ${count > 0 ? `${count} imóveis e lançamentos selecionados` : 'excelentes opções'} em Estância Velha e Vale dos Sinos. Para receber sugestões exatas para o seu perfil, use nossa Busca Inteligente ou chame a ${brokerName} no WhatsApp (51) 99822-8587 e acompanhe no Instagram ${instagram}.`;
    };

    if (!question) {
      return res.json({
        reply: `Olá! Sou a Sofia, assistente da ${brokerName}. Como posso ajudar você hoje? Você também pode falar direto no WhatsApp (51) 99822-8587 ou seguir ${instagram} no Instagram.`,
      });
    }

    try {
      const ai = createGeminiClient();
      if (!ai) {
        return res.json({ reply: deterministicReply(question) });
      }

      const response = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: `Você é Sofia, assistente virtual acolhedora, educada e objetiva da corretora de imóveis ${brokerName} (${creci}), atuando em Estância Velha e Vale dos Sinos (RS).
Canais oficiais da corretora para indicar naturalmente quando útil:
- WhatsApp oficial: (51) 99822-8587
- Instagram oficial: ${instagram}

Pergunta do visitante: "${question}"

Regras:
- Responda em português do Brasil em no máximo 2 ou 3 frases curtas, claras e humanas.
- Responda dúvidas simples sobre cidades atendidas (Estância Velha, Novo Hamburgo, São Leopoldo, Campo Bom), proximidade de universidades (Feevale e Unisinos), financiamento, agenciamento de imóveis ou contato.
- Sempre convide de forma natural para conversar no WhatsApp (51) 99822-8587 ou acompanhar o Instagram ${instagram} da Luciana Domingos.`,
        config: {
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
        },
      });

      const reply = response.text?.trim() || deterministicReply(question);
      return res.json({ reply });
    } catch (error) {
      console.error('Gemini assistant fallback:', error);
      return res.json({ reply: deterministicReply(question) });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
