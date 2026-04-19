import type { BaseContent } from '../base';
import type { TechnicianUser } from '../../types';
import type { FileReference } from '../../file-validation';

// ── Sub-interfaces ──────────────────────────────────────────────────

export interface MaterialInstaladoData {
  pos: boolean;
  cpa: boolean;
  balanca: boolean;
  cctv: boolean;
  alarme: boolean;
  impressora: boolean;
  ups: boolean;
  router: boolean;
  switchEquip: boolean;
  rolos: boolean;
  rolosQuantidade: number;
}

// ── Phase interfaces ────────────────────────────────────────────────

export interface Phase1Data {
  tipoProgramacao: string;
  numeroSerie: string;
  numeroEquipamento: string;
  leiturasGuardadas: string;
  testeFinal: boolean;
}

export interface Phase2Data {
  checklist: Record<string, Record<string, boolean>>;
}

export interface Phase3Data {
  nrFatura: string;
  nrGuiaTransportes: string;
  dataInstalacao: string;
  horaInicialInstalacao: string;
  horaFinalInstalacao: string;
  dataFormacao: string;
  horaInicialFormacao: string;
  horaFinalFormacao: string;
  quemRecebeuFormacao: string;
  tecnicoFormacao: string;
  materialInstalado: MaterialInstaladoData;
}

export interface Phase4Data {
  anydeskTestado: boolean;
  anydeskCodigo: string;
  anydeskMotivo: string;
  vectronConnectTestado: boolean;
  vectronConnectCodigo: string;
  vectronConnectMotivo: string;
}

export interface Phase5Data {
  dumpLido: boolean;
  copiaSeguranca: boolean;
  fotoInstalacao: boolean;
  fotoURL: FileReference | null;
}

// ── Main data interface ─────────────────────────────────────────────

export interface InstallationsProgrammingData {
  technician: TechnicianUser;
  clientId: string;
  phase1: Phase1Data;
  phase2: Phase2Data;
  phase3: Phase3Data;
  phase4: Phase4Data;
  phase5: Phase5Data;
  completedPhases: number[];
  isCompleted: boolean;
}

// ── Derived interfaces ──────────────────────────────────────────────

export interface InstallationsProgramming extends BaseContent {
  contentType: 'installations-programming';
  data: InstallationsProgrammingData;
}

export interface InstallationsProgrammingCreationData extends InstallationsProgrammingData {}

export interface InstallationsProgrammingUpdateData extends Partial<InstallationsProgrammingData> {}

export interface InstallationsProgrammingDisplayData {
  uuid: string;
  clientName: string;
  technician: string;
  completedPhases: number[];
  isCompleted: boolean;
  createdAt: string;
  updatedAt: string;
}

// ── Constants ───────────────────────────────────────────────────────

export const CHECKLIST_CATEGORIES: Record<string, string[]> = {
  pos: ['caboPOS', 'wer', 'transformador', 'caboRede'],
  displayCliente: [
    'impressora',
    'rolo',
    'caboPower',
    'transformador',
    'caboLigacaoPOS',
    'fichaAdaptadorRS232',
    'autocolantes',
  ],
  gavetaMetalica: ['chaves', 'autocolantes'],
  cpa: [
    'base',
    'parafusos',
    'caboPower',
    'transformador',
    'caboComunicacaoMoedasNotas',
    'caboRede',
    'caboSerie',
    'caboUSB',
    'chaves',
    'siteGestiinforma',
    'folhaCodigos',
    'autocolantes',
  ],
  balancas: ['caboPower', 'transformador', 'folhaPrimeiraVerificacao', 'autocolante'],
  cctv: ['dvr', 'camaras', 'transformador', 'caboPower', 'fichas', 'placasLicenca', 'autocolantes'],
  routerSwitch: ['router', 'switchEquip', 'caboPower', 'transformador', 'caboRede', 'autocolante'],
  acessorios: [
    'bobineCabos',
    'fichasRede',
    'adaptadoresImpressora',
    'monitorInterno',
    'soprador',
    'alcool',
    'pincel',
    'panos',
    'bracadeiras',
    'mangueira',
    'malaFerramentas',
    'autocolantes',
  ],
};

export const CHECKLIST_LABELS: Record<string, Record<string, string>> = {
  pos: {
    caboPOS: 'Cabo POS',
    wer: 'WER',
    transformador: 'Transformador',
    caboRede: 'Cabo Rede',
  },
  displayCliente: {
    impressora: 'Impressora',
    rolo: 'Rolo',
    caboPower: 'Cabo Power',
    transformador: 'Transformador',
    caboLigacaoPOS: 'Cabo Ligação POS',
    fichaAdaptadorRS232: 'Ficha Adaptador RS232',
    autocolantes: 'Autocolantes',
  },
  gavetaMetalica: {
    chaves: 'Chaves',
    autocolantes: 'Autocolantes',
  },
  cpa: {
    base: 'Base',
    parafusos: 'Parafusos',
    caboPower: 'Cabo Power',
    transformador: 'Transformador',
    caboComunicacaoMoedasNotas: 'Cabo Comunicação Entre Moedas e Notas',
    caboRede: 'Cabo Rede',
    caboSerie: 'Cabo Série',
    caboUSB: 'Cabo USB',
    chaves: 'Chaves',
    siteGestiinforma: 'Site Gestiinforma no Display',
    folhaCodigos: 'Folha com Códigos',
    autocolantes: 'Autocolantes',
  },
  balancas: {
    caboPower: 'Cabo Power',
    transformador: 'Transformador',
    folhaPrimeiraVerificacao: 'Folha 1ª Verificação',
    autocolante: 'Autocolante',
  },
  cctv: {
    dvr: 'DVR',
    camaras: 'Câmaras',
    transformador: 'Transformador',
    caboPower: 'Cabo Power',
    fichas: 'Fichas',
    placasLicenca: 'Placas Licença',
    autocolantes: 'Autocolantes',
  },
  routerSwitch: {
    router: 'Router',
    switchEquip: 'Switch',
    caboPower: 'Cabo Power',
    transformador: 'Transformador',
    caboRede: 'Cabo Rede',
    autocolante: 'Autocolante',
  },
  acessorios: {
    bobineCabos: 'Bobine de Cabos',
    fichasRede: 'Fichas de Rede',
    adaptadoresImpressora: 'Adaptadores de Impressora',
    monitorInterno: 'Monitor Interno',
    soprador: 'Soprador',
    alcool: 'Álcool',
    pincel: 'Pincel',
    panos: 'Panos',
    bracadeiras: 'Braçadeiras',
    mangueira: 'Mangueira',
    malaFerramentas: 'Mala de Ferramentas',
    autocolantes: 'Autocolantes',
  },
};

export const PHASE_NAMES: Record<number, string> = {
  1: 'Programação',
  2: 'Preparação',
  3: 'Instalação no Cliente',
  4: 'Testes',
  5: 'Finalização',
};

export const CHECKLIST_CATEGORY_LABELS: Record<string, string> = {
  pos: 'POS',
  displayCliente: 'Display Cliente',
  gavetaMetalica: 'Gaveta Metálica',
  cpa: 'CPA',
  balancas: 'Balanças',
  cctv: 'CCTV',
  routerSwitch: 'Router/Switch',
  acessorios: 'Acessórios',
};
