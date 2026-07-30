import type { Struktur, Tagesdatensatz } from './types';
import { getAllTrackers } from './records';

export const chatDays = (structure: Struktur): Tagesdatensatz[] => {
  const ids = Object.fromEntries(getAllTrackers(structure).map((item) => [item.name, item.id]));
  return [
    { id: 'chat-startdaten-2026-07-20', datum: '2026-07-20', messwerte: { [ids['Schlafdauer']]: 5.9, [ids['Beginn der Bettzeit']]: '23:00', [ids['Ende der Bettzeit']]: '05:00', [ids['subjektive Schlafqualität']]: 7, [ids['Energie']]: 8, [ids['Konzentration']]: 7, [ids['Stimmung']]: 7, [ids['Fahrradkilometer']]: 10, [ids['Anteil Hauptgericht']]: 1, [ids['geschätzte zusätzliche Kohlenhydrate']]: 110 }, ereignisse: { [ids['Mirtazapin']]: true, [ids['Training durchgeführt']]: false, [ids['Trainingsstufe']]: 'keine', [ids['Bulletproof Coffee']]: 2, [ids['Wildbeer-Protein-Smoothie']]: true, [ids['Hauptgericht']]: 'Gericht B', [ids['zusätzliche Lebensmittel']]: 'Etwa 500 g süßes Gebäck.' }, notizen: 'Nach Gericht B erneut hungrig. Tagsüber war der Hunger gut kontrollierbar.', erstelltAm: '2026-07-20T12:00:00.000Z', geaendertAm: '2026-07-20T12:00:00.000Z' },
    { id: 'chat-startdaten-2026-07-22', datum: '2026-07-22', messwerte: { [ids['Schlafdauer']]: 6.7, [ids['Beginn der Bettzeit']]: '22:00', [ids['Ende der Bettzeit']]: '05:00', [ids['subjektive Schlafqualität']]: 8, [ids['Energie']]: 8, [ids['Konzentration']]: 8, [ids['Stimmung']]: 9, [ids['Fahrradkilometer']]: 10, [ids['Anteil Hauptgericht']]: 0.75 }, ereignisse: { [ids['Mirtazapin']]: false, [ids['Training durchgeführt']]: true, [ids['Trainingsart']]: 'Bauchtraining', [ids['Trainingsstufe']]: 'Stufe 2', [ids['Bulletproof Coffee']]: 2, [ids['Hauptgericht']]: 'Gericht C' }, notizen: 'Zweiter aufeinanderfolgender Tag ohne Mirtazapin. Trotz 6,7 Stunden Schlaf waren Energie, Konzentration und Stimmung gut.', erstelltAm: '2026-07-22T12:00:00.000Z', geaendertAm: '2026-07-22T12:00:00.000Z' },
  ];
};
