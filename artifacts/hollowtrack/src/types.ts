export type Eingabetyp =
  | 'Zahl'
  | 'Dezimalzahl'
  | 'Text'
  | 'Mehrzeiliger Text'
  | 'Ja/Nein'
  | 'Bewertung 0 bis 10'
  | 'Auswahlliste'
  | 'Datum'
  | 'Uhrzeit'
  | 'Dauer'
  | 'Mehrfachauswahl';
export type TrackerDatentyp = 'Messwert' | 'Ereignis' | 'Notiz';
export type Datenquelle = 'manuell' | 'import' | 'externe-app';
export type Feldwert = string | number | boolean | string[];
export type Formularwert = Feldwert | undefined;

export type Wertebereich = { min?: number; max?: number; einheit?: string };
export type Tracker = {
  id: string;
  name: string;
  icon: string;
  farbe: string;
  aktiv: boolean;
  schnellnotiz: boolean;
  position: number;
  typ: Eingabetyp;
  datentyp: TrackerDatentyp;
  einheit?: string;
  untereinheit?: string;
  referenzbereich?: Wertebereich;
  zielbereich?: Wertebereich;
  benachrichtigung?: { aktiv: boolean; zeit?: string };
  schnelltracking: boolean;
  analyseAktiv: boolean;
  lueckenassistent: boolean;
  datenquelle: Datenquelle;
  optionen?: string[];
};

export type Kategorie = {
  id: string;
  name: string;
  icon: string;
  aktiv: boolean;
  position: number;
  bereichIds: string[];
};
export type Bereich = {
  id: string;
  name: string;
  aktiv: boolean;
  position: number;
  ansichtIds: string[];
};
export type Ansicht = {
  id: string;
  name: string;
  aktiv: boolean;
  position: number;
  trackerIds: string[];
};
export type DiaetModus = {
  id: string;
  name: string;
  start?: string;
  ende?: string;
  ernaehrungsform?: string;
  sport: boolean;
  besondererVerzicht?: string;
  referenzwerte?: Record<string, number | string>;
};
export type ExterneAnbindung = {
  id: 'android-health-connect' | 'apple-health' | 'fitbit' | 'garmin';
  name: string;
  aktiv: boolean;
  zuletztSynchronisiert?: string;
};
export type Struktur = {
  version: 2;
  kategorien: Kategorie[];
  bereiche: Bereich[];
  ansichten: Ansicht[];
  tracker: Tracker[];
  diaetModi: DiaetModus[];
  externeAnbindungen: ExterneAnbindung[];
};

export type Tagesdatensatz = {
  id: string;
  datum: string;
  messwerte: Record<string, Feldwert>;
  ereignisse: Record<string, Feldwert>;
  notizen: string;
  kategorieNotizen?: Record<string, string>;
  erstelltAm: string;
  geaendertAm: string;
};
export type Sicherungsinfo = { letzteSicherung?: string; letzterImport?: string; chatImportiert?: boolean };
export type ElementTyp = 'kategorie' | 'bereich' | 'ansicht' | 'tracker';
export type ModalState =
  | { mode: 'create'; type: ElementTyp }
  | { mode: 'rename'; type: 'kategorie' | 'bereich' | 'ansicht'; id: string }
  | { mode: 'move'; type: 'bereich'; id: string }
  | { mode: 'edit'; type: 'tracker'; id: string }
  | null;
export type PageId =
  | 'heute'
  | 'tracker'
  | 'verlauf'
  | 'statistik'
  | 'ernaehrung-sport'
  | 'einstellungen';

export type ImportKonflikt = 'behalten' | 'uebernehmen' | 'zusammenfuehren';
export type ImportVorschau = { tage: Tagesdatensatz[]; struktur?: Struktur; konfliktTage: string[]; neueTage: string[] };
