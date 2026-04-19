import type { InstallationsProgrammingData } from './types';

function isNonEmpty(value: string): boolean {
  return value.trim().length > 0;
}

function isPhase1Complete(data: InstallationsProgrammingData): boolean {
  const { phase1 } = data;
  const textFields = [
    phase1.tipoProgramacao,
    phase1.numeroSerie,
    phase1.numeroEquipamento,
    phase1.leiturasGuardadas,
  ];
  return textFields.some(isNonEmpty) || phase1.testeFinal === true;
}

function isPhase2Complete(data: InstallationsProgrammingData): boolean {
  const { checklist } = data.phase2;
  for (const category of Object.values(checklist)) {
    for (const checked of Object.values(category)) {
      if (checked === true) return true;
    }
  }
  return false;
}

function isPhase3Complete(data: InstallationsProgrammingData): boolean {
  const hasClient = isNonEmpty(data.clientId);
  const hasDate = isNonEmpty(data.phase3.dataInstalacao) || isNonEmpty(data.phase3.dataFormacao);
  return hasClient && hasDate;
}

function isPhase4Complete(data: InstallationsProgrammingData): boolean {
  const { phase4 } = data;

  const anydeskDefined = typeof phase4.anydeskTestado === 'boolean';
  const vectronDefined = typeof phase4.vectronConnectTestado === 'boolean';
  if (!anydeskDefined || !vectronDefined) return false;

  const anydeskOk = phase4.anydeskTestado
    ? isNonEmpty(phase4.anydeskCodigo)
    : isNonEmpty(phase4.anydeskMotivo);

  const vectronOk = phase4.vectronConnectTestado
    ? isNonEmpty(phase4.vectronConnectCodigo)
    : isNonEmpty(phase4.vectronConnectMotivo);

  return anydeskOk && vectronOk;
}

function isPhase5Complete(data: InstallationsProgrammingData): boolean {
  const { phase5 } = data;

  if (!phase5.dumpLido || !phase5.copiaSeguranca) return false;

  if (phase5.fotoInstalacao) {
    return phase5.fotoURL !== null;
  }

  return true;
}

export function calculateCompletedPhases(data: InstallationsProgrammingData): number[] {
  const completed: number[] = [];

  if (isPhase1Complete(data)) completed.push(1);
  if (isPhase2Complete(data)) completed.push(2);
  if (isPhase3Complete(data)) completed.push(3);
  if (isPhase4Complete(data)) completed.push(4);
  if (isPhase5Complete(data)) completed.push(5);

  return completed;
}

export function calculateIsCompleted(completedPhases: number[]): boolean {
  return completedPhases.length === 5;
}
