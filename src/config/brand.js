/**
 * AZZ&CO LABS — Brand Constants (single source of truth)
 *
 * Every product (JobBoat web, JobBoat mobile, JobBoat extension, OutWings,
 * LongTerm) is owned and operated by AZZ&CO LABS SAS. This file is the
 * canonical place where the legal entity, contact, and brand strings live.
 *
 * Rules:
 *  - When you add a new visible "About", "Footer", "© 20xx" string, IMPORT
 *    from this file. Do not hardcode the company name elsewhere.
 *  - The legal entity object mirrors what is registered on RCS Versailles.
 *    DO NOT change the address, RCS, or capital without updating the official
 *    Kbis first.
 *  - The "tagline" + "productSubtitle" are deliberately short so they fit in
 *    sidebars / footers without breaking layout.
 */

export const PARENT_COMPANY = Object.freeze({
  // Display name (no "SAS" — keep clean for marketing surfaces).
  name: 'AZZ&CO LABS',

  // Full legal name (use on legal pages, contracts, invoices).
  legalName: 'AZZ&CO LABS SAS',
  legalForm: 'Société par actions simplifiée',
  capital: '200 €',
  rcs: 'RCS Versailles 100 667 021',
  siren: '100 667 021',
  vatNumber: 'FR00100667021',

  director: 'Rached AZER',
  address: {
    line1: 'Bâtiment Fougères',
    line2: 'Rue de Guyenne',
    postal: '78840',
    city: 'Freneuse',
    country: 'France',
    full: 'Bâtiment Fougères, Rue de Guyenne, 78840 Freneuse, France',
  },
  jurisdiction: 'Tribunal judiciaire de Versailles',

  contact: {
    email: 'rached.azer@azzcolabs.business',
    phone: '+33 6 02 56 02 29',
    linkedin: 'https://www.linkedin.com/company/azz-co-labs',
    website: 'https://www.azzcolabs.business',
  },

  // Used in marketing copy, footers, app stores.
  tagline: 'Nous sommes là pour vous servir',
  yearFounded: 2025,
});

/**
 * Catalogue of products under AZZ&CO LABS. Each product has its own marketing
 * site / app stores but legally rolls up to the parent company.
 *
 * "subtitle" is the short attribution shown in product UI (e.g. sidebar,
 * About page, app store metadata).
 */
export const PRODUCTS = Object.freeze({
  jobboat: {
    name: 'JobBoat',
    domain: 'jobboat.xyz',
    homepage: 'https://jobboat.xyz',
    api: 'https://api.jobboat.xyz',
    description: "Plateforme IA d'aide à la recherche d'emploi : CV builder, candidatures automatiques, coaching IA.",
    subtitle: 'by AZZ&CO LABS',
    fullAttribution: 'Un produit AZZ&CO LABS',
    appIds: {
      ios: 'xyz.jobboat.app',
      android: 'xyz.jobboat.app',
      chrome: null, // filled once Chrome Web Store ID is known
    },
  },
  outwings: {
    name: 'OutWings',
    domain: null, // not yet launched
    homepage: 'https://www.azzcolabs.business/outwings.html',
    description: "Application de sorties de groupe (en préparation).",
    subtitle: 'by AZZ&CO LABS',
    fullAttribution: 'Un produit AZZ&CO LABS',
    appIds: {},
  },
  longterm: {
    name: 'LongTerm',
    domain: 'azzco.life',
    homepage: 'https://www.azzco.life',
    description: 'Outil de planification de carrière long-terme — Standpoint after-gap.',
    subtitle: 'by AZZ&CO LABS',
    fullAttribution: 'Un produit AZZ&CO LABS',
    appIds: {},
  },
});

/**
 * Convenience: short copyright string ready to drop in any footer.
 *
 *   import { COPYRIGHT } from '@/config/brand';
 *   <footer>{COPYRIGHT}</footer>
 *
 * Year is computed at module load time. If you want a literal year embedded
 * in the bundle (no auto-update), export a function instead.
 */
export const COPYRIGHT = `© ${new Date().getFullYear()} ${PARENT_COMPANY.legalName} — Tous droits réservés`;

/**
 * Helper to format the legal entity in a single inline string for footers
 * that need RCS / SIREN visible (e.g. mentions légales links).
 */
export function legalEntityShort() {
  const c = PARENT_COMPANY;
  return `${c.legalName} · ${c.rcs}`;
}

export default PARENT_COMPANY;
