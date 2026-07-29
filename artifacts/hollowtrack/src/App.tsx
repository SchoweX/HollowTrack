import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  Activity,
  ArrowDown,
  ArrowUp,
  CalendarDays,
  Check,
  ChevronDown,
  CircleHelp,
  CircleOff,
  Clock3,
  Download,
  Dumbbell,
  Eye,
  FileJson,
  Folder,
  FolderOpen,
  History,
  Import,
  Leaf,
  Moon,
  Palette,
  Pencil,
  Plus,
  RotateCcw,
  Save,
  Settings,
  ShieldCheck,
  Trash2,
  Upload,
  Utensils,
  X,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Route, Switch, Router as WouterRouter, useLocation } from 'wouter';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';

import type {
  Ansicht,
  Bereich,
  Datenquelle,
  DiaetModus,
  Eingabetyp,
  ElementTyp,
  ExterneAnbindung,
  Feldwert,
  Formularwert,
  ImportKonflikt,
  ImportVorschau,
  Kategorie,
  ModalState,
  PageId,
  Sicherungsinfo,
  Struktur,
  Tagesdatensatz,
  Tracker,
  TrackerDatentyp,
  Wertebereich,
} from './types';

type NavItem = { id: PageId; label: string; icon: LucideIcon };

const STORAGE_STRUKTUR = 'hollowtrack-tracker-struktur';
const STORAGE_TAGE = 'hollowtrack-tagesdaten';
const STORAGE_SICHERUNG = 'hollowtrack-sicherungsinfo';

const navigation: NavItem[] = [
  { id: 'heute', label: 'Heute', icon: CalendarDays },
  { id: 'tracker', label: 'Tracker', icon: Activity },
  { id: 'verlauf', label: 'Verlauf', icon: History },
  { id: 'ernaehrung-sport', label: 'Ernährung & Sport', icon: Dumbbell },
  { id: 'einstellungen', label: 'Einstellungen', icon: Settings },
];

const externalDefaults: ExterneAnbindung[] = [
  { id: 'android-health-connect', name: 'Android Health Connect', aktiv: false },
  { id: 'apple-health', name: 'Apple Health', aktiv: false },
  { id: 'fitbit', name: 'Fitbit', aktiv: false },
  { id: 'garmin', name: 'Garmin', aktiv: false },
];

const categoryIconMap: Record<string, LucideIcon> = {
  Activity,
  FolderOpen,
  Leaf,
  ShieldCheck,
};

function categoryIcon(icon: string): LucideIcon {
  return categoryIconMap[icon] || FolderOpen;
}

import {
  clone,
  formatDate,
  formatDateTime,
  formatNumber,
  localDate,
  newId,
  slug,
  sorted,
  valueExists,
} from './utils';

function makeTracker(id: string, name: string, typ: Eingabetyp, datentyp: TrackerDatentyp, position: number, einheit?: string, optionen?: string[]): Tracker {
  return {
    id: `tracker-${id}`, name, icon: 'Activity', farbe: '#1e6b65', aktiv: true, schnellnotiz: false, position, typ, datentyp,
    einheit, optionen, schnelltracking: false, analyseAktiv: true, lueckenassistent: false, datenquelle: 'manuell',
    benachrichtigung: { aktiv: false },
  };
}

type DefaultArea = { name: string; trackers: Tracker[] };
const defaultAreas: { category: string; areas: DefaultArea[] }[] = [
  {
    category: 'Körper & Gesundheit',
    areas: [
      { name: 'Schlaf', trackers: [makeTracker('schlafdauer', 'Schlafdauer', 'Dezimalzahl', 'Messwert', 1, 'Stunden'), makeTracker('bettzeit-beginn', 'Beginn der Bettzeit', 'Uhrzeit', 'Messwert', 2), makeTracker('bettzeit-ende', 'Ende der Bettzeit', 'Uhrzeit', 'Messwert', 3), makeTracker('schlafqualitaet', 'subjektive Schlafqualität', 'Bewertung 0 bis 10', 'Messwert', 4), makeTracker('mirtazapin', 'Mirtazapin', 'Ja/Nein', 'Ereignis', 5)] },
      { name: 'Wohlbefinden', trackers: [makeTracker('energie', 'Energie', 'Bewertung 0 bis 10', 'Messwert', 1), makeTracker('konzentration', 'Konzentration', 'Bewertung 0 bis 10', 'Messwert', 2), makeTracker('stimmung', 'Stimmung', 'Bewertung 0 bis 10', 'Messwert', 3)] },
      { name: 'Training & Aktivität', trackers: [makeTracker('training-durchgefuehrt', 'Training durchgeführt', 'Ja/Nein', 'Ereignis', 1), makeTracker('trainingsart', 'Trainingsart', 'Text', 'Ereignis', 2), makeTracker('trainingsstufe', 'Trainingsstufe', 'Auswahlliste', 'Ereignis', 3, undefined, ['keine', 'Stufe 1', 'Stufe 2', 'Stufe 3']), makeTracker('fahrradkilometer', 'Fahrradkilometer', 'Dezimalzahl', 'Messwert', 4, 'km')] },
      { name: 'Ernährung', trackers: [makeTracker('bulletproof-coffee', 'Bulletproof Coffee', 'Zahl', 'Ereignis', 1, 'Portionen'), makeTracker('wildbeer-smoothie', 'Wildbeer-Protein-Smoothie', 'Ja/Nein', 'Ereignis', 2), makeTracker('hauptgericht', 'Hauptgericht', 'Auswahlliste', 'Ereignis', 3, undefined, ['keines', 'Gericht A', 'Gericht B', 'Gericht C', 'Gericht D']), makeTracker('anteil-hauptgericht', 'Anteil Hauptgericht', 'Dezimalzahl', 'Messwert', 4, 'Portionen'), makeTracker('zusaetzliche-lebensmittel', 'zusätzliche Lebensmittel', 'Mehrzeiliger Text', 'Ereignis', 5), makeTracker('zusaetzliche-kohlenhydrate', 'geschätzte zusätzliche Kohlenhydrate', 'Dezimalzahl', 'Messwert', 6, 'g')] },
      { name: 'Hunger & Sättigung', trackers: [makeTracker('hunger-nach-essen', 'körperlicher Hunger nach dem Essen', 'Bewertung 0 bis 10', 'Messwert', 1), makeTracker('suessappetit-nach-essen', 'Süßappetit nach dem Essen', 'Bewertung 0 bis 10', 'Messwert', 2), makeTracker('saettigung-direkt', 'Sättigung direkt nach dem Essen', 'Bewertung 0 bis 10', 'Messwert', 3), makeTracker('spaeterer-hunger', 'späterer Hunger', 'Bewertung 0 bis 10', 'Messwert', 4)] },
      { name: 'Körperwerte', trackers: [] },
    ],
  },
  { category: 'Garten', areas: [{ name: 'Wetter & Umwelt', trackers: [] }, { name: 'Pflanzen', trackers: [] }, { name: 'Pflege', trackers: [] }, { name: 'Arbeiten & Kosten', trackers: [] }] },
];

function initialStructure(): Struktur {
  const kategorien: Kategorie[] = [];
  const bereiche: Bereich[] = [];
  const ansichten: Ansicht[] = [];
  const tracker: Tracker[] = [];
  defaultAreas.forEach((category, categoryIndex) => {
    const categoryId = `kategorie-${slug(category.category)}`;
    const categoryAreaIds: string[] = [];
    category.areas.forEach((area, areaIndex) => {
      const areaId = `bereich-${slug(area.name)}`;
      const viewId = `ansicht-${slug(area.name)}-tagesuebersicht`;
      categoryAreaIds.push(areaId);
      bereiche.push({ id: areaId, name: area.name, aktiv: true, position: areaIndex + 1, ansichtIds: [viewId] });
      ansichten.push({ id: viewId, name: 'Tagesübersicht', aktiv: true, position: 1, trackerIds: area.trackers.map((item) => item.id) });
      tracker.push(...area.trackers);
    });
    kategorien.push({ id: categoryId, name: category.category, icon: categoryIndex ? 'Leaf' : 'ShieldCheck', aktiv: true, position: categoryIndex + 1, bereichIds: categoryAreaIds });
  });
  return { version: 2, kategorien, bereiche, ansichten, tracker, diaetModi: [], externeAnbindungen: clone(externalDefaults) };
}

function migrateLegacy(legacy: { oberordner?: Array<{ id: string; name: string; aktiv: boolean; position: number; unterordner?: Array<{ id: string; name: string; aktiv: boolean; position: number; tracker?: Tracker[] }> }> }): Struktur {
  const result: Struktur = { version: 2, kategorien: [], bereiche: [], ansichten: [], tracker: [], diaetModi: [], externeAnbindungen: clone(externalDefaults) };
  (legacy.oberordner || []).forEach((folder, folderIndex) => {
    const categoryId = folder.id || newId('kategorie');
    const category: Kategorie = { id: categoryId, name: folder.name, icon: 'FolderOpen', aktiv: folder.aktiv !== false, position: folder.position || folderIndex + 1, bereichIds: [] };
    (folder.unterordner || []).forEach((subfolder, subIndex) => {
      const areaId = subfolder.id || newId('bereich');
      const viewId = `${areaId}-tagesuebersicht`;
      category.bereichIds.push(areaId);
      result.bereiche.push({ id: areaId, name: subfolder.name, aktiv: subfolder.aktiv !== false, position: subfolder.position || subIndex + 1, ansichtIds: [viewId] });
      const ids: string[] = [];
      (subfolder.tracker || []).forEach((oldItem, trackerIndex) => {
        const existing = result.tracker.find((item) => item.id === oldItem.id);
        if (existing) ids.push(existing.id);
        else {
          result.tracker.push({
            ...makeTracker(oldItem.id.replace(/^tracker-/, ''), oldItem.name, oldItem.typ, oldItem.datentyp, oldItem.position || trackerIndex + 1, oldItem.einheit, oldItem.optionen),
            ...oldItem,
            icon: oldItem.icon || 'Activity', farbe: oldItem.farbe || '#1e6b65', schnellnotiz: oldItem.schnellnotiz || false,
            schnelltracking: oldItem.schnelltracking || false, analyseAktiv: oldItem.analyseAktiv !== false, lueckenassistent: oldItem.lueckenassistent || false, datenquelle: oldItem.datenquelle || 'manuell',
          });
          ids.push(oldItem.id);
        }
      });
      result.ansichten.push({ id: viewId, name: 'Tagesübersicht', aktiv: true, position: 1, trackerIds: ids });
    });
    result.kategorien.push(category);
  });
  return result;
}

function mergeStructure(current: Struktur, incoming: Struktur): Struktur {
  const result = clone(current);
  incoming.kategorien.forEach((category) => {
    let targetCategory = result.kategorien.find((item) => item.id === category.id);
    if (!targetCategory) { result.kategorien.push(clone(category)); return; }
    category.bereichIds.forEach((areaId) => { if (!targetCategory!.bereichIds.includes(areaId)) targetCategory!.bereichIds.push(areaId); });
  });
  incoming.bereiche.forEach((area) => {
    if (!result.bereiche.some((item) => item.id === area.id)) result.bereiche.push(clone(area));
    else {
      const target = result.bereiche.find((item) => item.id === area.id)!;
      area.ansichtIds.forEach((id) => { if (!target.ansichtIds.includes(id)) target.ansichtIds.push(id); });
    }
  });
  incoming.ansichten.forEach((view) => {
    if (!result.ansichten.some((item) => item.id === view.id)) result.ansichten.push(clone(view));
    else {
      const target = result.ansichten.find((item) => item.id === view.id)!;
      view.trackerIds.forEach((id) => { if (!target.trackerIds.includes(id)) target.trackerIds.push(id); });
    }
  });
  incoming.tracker.forEach((item) => { if (!result.tracker.some((currentItem) => currentItem.id === item.id)) result.tracker.push(clone(item)); });
  result.diaetModi = result.diaetModi || [];
  result.externeAnbindungen = result.externeAnbindungen?.length ? result.externeAnbindungen : clone(externalDefaults);
  return result;
}

function normalizeStructure(saved: unknown): Struktur {
  const base = initialStructure();
  if (saved && typeof saved === 'object' && Array.isArray((saved as Struktur).kategorien)) return mergeStructure(base, saved as Struktur);
  if (saved && typeof saved === 'object' && Array.isArray((saved as { oberordner?: unknown }).oberordner)) return mergeStructure(base, migrateLegacy(saved as { oberordner: Array<{ id: string; name: string; aktiv: boolean; position: number; unterordner?: Array<{ id: string; name: string; aktiv: boolean; position: number; tracker?: Tracker[] }> }> }));
  return base;
}
function loadStructure(): Struktur { try { const saved = window.localStorage.getItem(STORAGE_STRUKTUR); return normalizeStructure(saved ? JSON.parse(saved) : null); } catch { return initialStructure(); } }
function loadDays(): Tagesdatensatz[] { try { const saved = window.localStorage.getItem(STORAGE_TAGE); const parsed = saved ? JSON.parse(saved) : []; return Array.isArray(parsed) ? parsed : []; } catch { return []; } }
function loadBackupInfo(): Sicherungsinfo { try { return JSON.parse(window.localStorage.getItem(STORAGE_SICHERUNG) || '{}') as Sicherungsinfo; } catch { return {}; } }
import {
  emptyRecord,
  getAllTrackers,
  getViewTrackers,
  mergeRecords,
  recordValue,
  summaryFor,
} from './records';

import { EmptyState, SectionHeader } from './components/Common';

import { TreeView } from './components/TreeView';

import { InputField } from './components/InputField';

import { DayForm } from './components/DayForm';

function DayDetail({ record, structure, onClose, onEdit, onDelete }: { record: Tagesdatensatz; structure: Struktur; onClose: () => void; onEdit: () => void; onDelete: () => void }) {
  const entries = getAllTrackers(structure).map((item) => ({ item, value: recordValue(record, item) })).filter(({ value }) => valueExists(value));
  return <div className="modal-backdrop" role="presentation"><section className="modal modal--wide" role="dialog" aria-modal="true" aria-labelledby="detail-title"><div className="modal__header"><div><p className="module__eyebrow">Gespeicherter Tag</p><h2 className="modal__title" id="detail-title">{formatDate(record.datum)}</h2><p className="modal__description">{summaryFor(record, structure)}</p></div><button className="icon-button" type="button" onClick={onClose} aria-label="Tagesansicht schließen"><X size={17} /></button></div><div className="detail-list">{entries.length ? entries.map(({ item, value }) => <div className="detail-row" key={item.id}><span>{item.name}</span><strong>{value === true ? 'Ja' : value === false ? 'Nein' : Array.isArray(value) ? value.join(', ') : String(value)}{item.einheit ? ` ${item.einheit}` : ''}</strong></div>) : <p className="hinweis">Für diesen Tag sind keine Trackerwerte gespeichert.</p>}</div>{record.notizen ? <div className="detail-notes"><strong>Notizen</strong><p>{record.notizen}</p></div> : null}<div className="modal__actions"><button className="button button--quiet" type="button" onClick={onClose}>Schließen</button><button className="button button--danger" type="button" onClick={onDelete}><Trash2 size={14} />Eintrag löschen</button><button className="button button--primary" type="button" onClick={onEdit}><Pencil size={14} />Tag bearbeiten</button></div></section></div>;
}

function Modal({ modal, structure, name, parentId, inputType, dataType, setName, setParentId, setInputType, setDataType, onClose, onSubmit }: { modal: Exclude<ModalState, null>; structure: Struktur; name: string; parentId: string; inputType: Eingabetyp; dataType: TrackerDatentyp; setName: (value: string) => void; setParentId: (value: string) => void; setInputType: (value: Eingabetyp) => void; setDataType: (value: TrackerDatentyp) => void; onClose: () => void; onSubmit: () => void }) {
  const isTracker = modal.type === 'tracker'; const isRename = modal.mode === 'rename'; const isMove = modal.mode === 'move';
  const categories = structure.kategorien.filter((item) => item.aktiv); const areas = structure.bereiche.filter((item) => item.aktiv); const views = structure.ansichten.filter((item) => item.aktiv);
  const title = isMove ? 'Bereich verschieben' : isRename ? 'Element umbenennen' : modal.mode === 'edit' ? 'Tracker bearbeiten' : modal.type === 'kategorie' ? 'Kategorie anlegen' : modal.type === 'bereich' ? 'Bereich anlegen' : modal.type === 'ansicht' ? 'Ansicht anlegen' : 'Tracker anlegen';
  const needsParent = isMove || (!isRename && modal.type !== 'kategorie');
  const parentOptions = isMove ? categories.filter((category) => !category.bereichIds.includes(modal.id)).map((item) => ({ id: item.id, name: item.name })) : modal.type === 'bereich' ? categories.map((item) => ({ id: item.id, name: item.name })) : modal.type === 'ansicht' ? areas.map((item) => ({ id: item.id, name: item.name })) : views.map((item) => ({ id: item.id, name: item.name }));
  return <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}><section className="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title"><div className="modal__header"><div><h2 className="modal__title" id="modal-title">{title}</h2><p className="modal__description">{isMove ? 'Der Bereich bleibt erhalten und wird einer anderen Kategorie zugeordnet.' : isTracker ? 'Tracker werden zentral gespeichert und können mehreren Ansichten zugeordnet werden.' : 'Änderungen werden direkt auf diesem Gerät gespeichert.'}</p></div><button className="icon-button" type="button" onClick={onClose} aria-label="Dialog schließen"><X size={17} /></button></div><form className="modal__form" onSubmit={(event) => { event.preventDefault(); onSubmit(); }}>{!isMove ? <label className="field"><span className="field__label">Name</span><input autoFocus value={name} onChange={(event) => setName(event.target.value)} placeholder="Name des Elements" /></label> : null}{needsParent ? <label className="field"><span className="field__label">{isMove ? 'Neue Kategorie' : modal.type === 'bereich' ? 'Kategorie' : modal.type === 'ansicht' ? 'Bereich' : 'Ansicht'}</span><select value={parentId} onChange={(event) => setParentId(event.target.value)}>{parentOptions.map((option) => <option value={option.id} key={option.id}>{option.name}</option>)}</select></label> : null}{isTracker ? <><label className="field"><span className="field__label">Datentyp</span><select value={dataType} onChange={(event) => setDataType(event.target.value as TrackerDatentyp)}><option>Messwert</option><option>Ereignis</option><option>Notiz</option></select></label><label className="field"><span className="field__label">Eingabetyp</span><select value={inputType} onChange={(event) => setInputType(event.target.value as Eingabetyp)}>{['Zahl', 'Dezimalzahl', 'Text', 'Mehrzeiliger Text', 'Ja/Nein', 'Bewertung 0 bis 10', 'Auswahlliste', 'Datum', 'Uhrzeit', 'Dauer', 'Mehrfachauswahl'].map((option) => <option key={option}>{option}</option>)}</select></label></> : null}<div className="modal__actions"><button className="button button--quiet" type="button" onClick={onClose}>Abbrechen</button><button className="button button--primary" type="submit" disabled={(!isMove && !name.trim()) || (needsParent && !parentId)}><Check size={15} />Speichern</button></div></form></section></div>;
}

function DeleteModal({ name, onClose, onConfirm }: { name: string; onClose: () => void; onConfirm: () => void }) { return <div className="modal-backdrop" role="presentation"><section className="modal modal--confirm" role="dialog" aria-modal="true" aria-labelledby="delete-title"><div className="modal__header"><div><h2 className="modal__title" id="delete-title">Element löschen?</h2><p className="modal__description">„{name}“ wird aus der lokalen Struktur entfernt. Die Daten des globalen Trackers bleiben erhalten, bis der Tracker selbst gelöscht wird.</p></div><button className="icon-button" type="button" onClick={onClose} aria-label="Dialog schließen"><X size={17} /></button></div><div className="modal__actions"><button className="button button--quiet" type="button" onClick={onClose}>Abbrechen</button><button className="button button--danger" type="button" onClick={onConfirm}><Trash2 size={15} />Löschen</button></div></section></div>; }

const chatDays = (structure: Struktur): Tagesdatensatz[] => {
  const ids = Object.fromEntries(getAllTrackers(structure).map((item) => [item.name, item.id]));
  return [
    { id: 'chat-startdaten-2026-07-20', datum: '2026-07-20', messwerte: { [ids['Schlafdauer']]: 5.9, [ids['Beginn der Bettzeit']]: '23:00', [ids['Ende der Bettzeit']]: '05:00', [ids['subjektive Schlafqualität']]: 7, [ids['Energie']]: 8, [ids['Konzentration']]: 7, [ids['Stimmung']]: 7, [ids['Fahrradkilometer']]: 10, [ids['Anteil Hauptgericht']]: 1, [ids['geschätzte zusätzliche Kohlenhydrate']]: 110 }, ereignisse: { [ids['Mirtazapin']]: true, [ids['Training durchgeführt']]: false, [ids['Trainingsstufe']]: 'keine', [ids['Bulletproof Coffee']]: 2, [ids['Wildbeer-Protein-Smoothie']]: true, [ids['Hauptgericht']]: 'Gericht B', [ids['zusätzliche Lebensmittel']]: 'Etwa 500 g süßes Gebäck.' }, notizen: 'Nach Gericht B erneut hungrig. Tagsüber war der Hunger gut kontrollierbar.', erstelltAm: '2026-07-20T12:00:00.000Z', geaendertAm: '2026-07-20T12:00:00.000Z' },
    { id: 'chat-startdaten-2026-07-22', datum: '2026-07-22', messwerte: { [ids['Schlafdauer']]: 6.7, [ids['Beginn der Bettzeit']]: '22:00', [ids['Ende der Bettzeit']]: '05:00', [ids['subjektive Schlafqualität']]: 8, [ids['Energie']]: 8, [ids['Konzentration']]: 8, [ids['Stimmung']]: 9, [ids['Fahrradkilometer']]: 10, [ids['Anteil Hauptgericht']]: 0.75 }, ereignisse: { [ids['Mirtazapin']]: false, [ids['Training durchgeführt']]: true, [ids['Trainingsart']]: 'Bauchtraining', [ids['Trainingsstufe']]: 'Stufe 2', [ids['Bulletproof Coffee']]: 2, [ids['Hauptgericht']]: 'Gericht C' }, notizen: 'Zweiter aufeinanderfolgender Tag ohne Mirtazapin. Trotz 6,7 Stunden Schlaf waren Energie, Konzentration und Stimmung gut.', erstelltAm: '2026-07-22T12:00:00.000Z', geaendertAm: '2026-07-22T12:00:00.000Z' },
  ];
};

function Home() {
  const [location, setLocation] = useLocation();
  const [structure, setStructure] = useState<Struktur>(loadStructure);
  const [days, setDays] = useState<Tagesdatensatz[]>(loadDays);
  const [backupInfo, setBackupInfo] = useState<Sicherungsinfo>(loadBackupInfo);
  const [ready, setReady] = useState(false);
  const [selectedDate, setSelectedDate] = useState(localDate);
  const [success, setSuccess] = useState('');
  const [modal, setModal] = useState<ModalState>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ type: ElementTyp; id: string; name: string } | null>(null);
  const [detailRecord, setDetailRecord] = useState<Tagesdatensatz | null>(null);
  const [modalName, setModalName] = useState('');
  const [parentId, setParentId] = useState('');
  const [inputType, setInputType] = useState<Eingabetyp>('Text');
  const [dataType, setDataType] = useState<TrackerDatentyp>('Messwert');
  const [importPreview, setImportPreview] = useState<ImportVorschau | null>(null);
  const [importDecisions, setImportDecisions] = useState<Record<string, ImportKonflikt>>({});
  const [importMessage, setImportMessage] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const page: PageId = (['heute', 'tracker', 'verlauf', 'ernaehrung-sport', 'einstellungen'] as string[]).includes(location.slice(1)) ? location.slice(1) as PageId : 'heute';
  const go = (next: PageId) => setLocation(next === 'heute' ? '/' : `/${next}`);

  useEffect(() => { window.localStorage.setItem(STORAGE_STRUKTUR, JSON.stringify(structure)); setReady(true); }, [structure]);
  useEffect(() => { window.localStorage.setItem(STORAGE_TAGE, JSON.stringify(days)); }, [days]);
  useEffect(() => { window.localStorage.setItem(STORAGE_SICHERUNG, JSON.stringify(backupInfo)); }, [backupInfo]);
  useEffect(() => { document.title = `HollowTrack – ${navigation.find((item) => item.id === page)?.label || 'Heute'}`; }, [page]);
  const counts = useMemo(() => ({ categories: structure.kategorien.length, areas: structure.bereiche.length, views: structure.ansichten.length, trackers: structure.tracker.length }), [structure]);
  const activeTrackerCount = structure.tracker.filter((item) => item.aktiv).length;
  const sortedDays = useMemo(() => [...days].sort((a, b) => b.datum.localeCompare(a.datum)), [days]);
  const flattenedItems = useMemo(() => structure.kategorien.flatMap((category) => [
    { type: 'kategorie' as ElementTyp, id: category.id, name: category.name, active: category.aktiv, label: 'Kategorie', className: '' },
    ...category.bereichIds.flatMap((areaId) => { const area = structure.bereiche.find((item) => item.id === areaId); if (!area) return []; return [{ type: 'bereich' as ElementTyp, id: area.id, name: area.name, active: area.aktiv, label: `Bereich in „${category.name}“`, className: 'verwaltungseintrag--unterordner' }, ...area.ansichtIds.flatMap((viewId) => { const view = structure.ansichten.find((item) => item.id === viewId); if (!view) return []; return [{ type: 'ansicht' as ElementTyp, id: view.id, name: view.name, active: view.aktiv, label: `Ansicht in „${area.name}“`, className: 'verwaltungseintrag--unterordner' }]; })]; }),
  ]), [structure]);
  const trackerItems = structure.tracker.map((item) => ({ type: 'tracker' as ElementTyp, id: item.id, name: item.name, active: item.aktiv, label: `${item.typ} · ${structure.ansichten.filter((view) => view.trackerIds.includes(item.id)).length} Ansichten`, className: 'verwaltungseintrag--tracker' }));

  useEffect(() => {
    if (page !== 'einstellungen') return;
    const list = document.querySelector('.verwaltungsliste');
    if (!list) return;
    const items = [...flattenedItems, ...trackerItems];
    const created: HTMLButtonElement[] = [];
    list.querySelectorAll<HTMLElement>('.verwaltungseintrag__aktionen').forEach((actions, index) => {
      const item = items[index];
      if (!item || (item.type !== 'kategorie' && item.type !== 'bereich')) return;
      const addAction = (label: string, handler: () => void) => {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'aktions-button';
        button.textContent = label;
        button.addEventListener('click', handler);
        actions.insertBefore(button, actions.lastElementChild);
        created.push(button);
      };
      if (item.type === 'kategorie') {
        addAction('Icon wechseln', () => cycleCategoryIcon(item.id));
        addAction('Nach oben', () => moveCategory(item.id, -1));
        addAction('Nach unten', () => moveCategory(item.id, 1));
      } else {
        addAction('Verschieben', () => openMoveArea(item.id));
      }
    });
    return () => created.forEach((button) => button.remove());
  }, [page, structure, flattenedItems, trackerItems]);

  const showSuccess = (message: string) => { setSuccess(message); window.setTimeout(() => setSuccess(''), 3500); };
  const openCreate = (type: ElementTyp) => { const category = structure.kategorien.find((item) => item.aktiv); const area = structure.bereiche.find((item) => item.aktiv); const view = structure.ansichten.find((item) => item.aktiv); setModalName(''); setParentId(type === 'bereich' ? category?.id || '' : type === 'ansicht' ? area?.id || '' : type === 'tracker' ? view?.id || '' : ''); setInputType('Text'); setDataType('Messwert'); setModal({ mode: 'create', type }); };
  const openRename = (type: ElementTyp, id: string, name: string) => { if (type === 'tracker') return; setModalName(name); setParentId(''); setModal({ mode: 'rename', type, id }); };
  const openMoveArea = (id: string) => {
    const currentCategory = structure.kategorien.find((category) => category.bereichIds.includes(id));
    const target = structure.kategorien.find((category) => category.aktiv && category.id !== currentCategory?.id);
    if (!target) { showSuccess('Es gibt keine andere aktive Kategorie zum Verschieben.'); return; }
    setModalName('');
    setParentId(target.id);
    setModal({ mode: 'move', type: 'bereich', id });
  };
  const openEditTracker = (item: Tracker) => { setModalName(item.name); setParentId(structure.ansichten.find((view) => view.trackerIds.includes(item.id))?.id || ''); setInputType(item.typ); setDataType(item.datentyp); setModal({ mode: 'edit', type: 'tracker', id: item.id }); };
  const cycleCategoryIcon = (id: string) => setStructure((current) => {
    const next = clone(current);
    const icons = Object.keys(categoryIconMap);
    const target = next.kategorien.find((category) => category.id === id);
    if (target) target.icon = icons[(icons.indexOf(target.icon) + 1) % icons.length];
    return next;
  });
  const moveCategory = (id: string, direction: -1 | 1) => setStructure((current) => {
    const next = clone(current);
    const ordered = sorted(next.kategorien);
    const index = ordered.findIndex((category) => category.id === id);
    const swapIndex = index + direction;
    if (index < 0 || swapIndex < 0 || swapIndex >= ordered.length) return next;
    const currentPosition = ordered[index].position;
    ordered[index].position = ordered[swapIndex].position;
    ordered[swapIndex].position = currentPosition;
    return next;
  });

  const submitModal = () => {
    const value = modalName.trim(); if (!modal || (modal.mode !== 'move' && !value)) return;
    setStructure((current) => {
      const next = clone(current);
      if (modal.mode === 'move') {
        const sourceCategory = next.kategorien.find((category) => category.bereichIds.includes(modal.id));
        const targetCategory = next.kategorien.find((category) => category.id === parentId);
        if (sourceCategory && targetCategory && sourceCategory.id !== targetCategory.id) {
          sourceCategory.bereichIds = sourceCategory.bereichIds.filter((areaId) => areaId !== modal.id);
          targetCategory.bereichIds.push(modal.id);
          const area = next.bereiche.find((item) => item.id === modal.id);
          if (area) area.position = targetCategory.bereichIds.length;
        }
      } else if (modal.mode === 'rename') {
        const target = modal.type === 'kategorie' ? next.kategorien.find((item) => item.id === modal.id) : modal.type === 'bereich' ? next.bereiche.find((item) => item.id === modal.id) : next.ansichten.find((item) => item.id === modal.id);
        if (target) target.name = value;
      } else if (modal.mode === 'edit') {
        const target = next.tracker.find((item) => item.id === modal.id);
        if (target) { target.name = value; target.typ = inputType; target.datentyp = dataType; if (parentId) { const view = next.ansichten.find((item) => item.id === parentId); if (view && !view.trackerIds.includes(target.id)) view.trackerIds.push(target.id); } }
      } else if (modal.type === 'kategorie') next.kategorien.push({ id: newId('kategorie'), name: value, icon: 'FolderOpen', aktiv: true, position: next.kategorien.length + 1, bereichIds: [] });
      else if (modal.type === 'bereich') { const category = next.kategorien.find((item) => item.id === parentId); if (category) { const id = newId('bereich'); const viewId = newId('ansicht'); category.bereichIds.push(id); next.bereiche.push({ id, name: value, aktiv: true, position: category.bereichIds.length, ansichtIds: [viewId] }); next.ansichten.push({ id: viewId, name: 'Tagesübersicht', aktiv: true, position: 1, trackerIds: [] }); } }
      else if (modal.type === 'ansicht') { const area = next.bereiche.find((item) => item.id === parentId); if (area) { const id = newId('ansicht'); area.ansichtIds.push(id); next.ansichten.push({ id, name: value, aktiv: true, position: area.ansichtIds.length, trackerIds: [] }); } }
      else { const view = next.ansichten.find((item) => item.id === parentId); const item = makeTracker(newId('tracker'), value, inputType, dataType, next.tracker.length + 1); next.tracker.push(item); if (view && !view.trackerIds.includes(item.id)) view.trackerIds.push(item.id); }
      return next;
    });
    setModal(null);
  };
  const toggleStatus = (type: ElementTyp, id: string) => setStructure((current) => { const next = clone(current); const list = type === 'kategorie' ? next.kategorien : type === 'bereich' ? next.bereiche : type === 'ansicht' ? next.ansichten : next.tracker; const target = list.find((item) => item.id === id); if (target) target.aktiv = !target.aktiv; return next; });
  const confirmDelete = () => { if (!deleteTarget) return; setStructure((current) => { const next = clone(current); if (deleteTarget.type === 'kategorie') { const category = next.kategorien.find((item) => item.id === deleteTarget.id); const areas = next.bereiche.filter((area) => category?.bereichIds.includes(area.id)); const viewIds = areas.flatMap((area) => area.ansichtIds); next.kategorien = next.kategorien.filter((item) => item.id !== deleteTarget.id); next.bereiche = next.bereiche.filter((item) => !category?.bereichIds.includes(item.id)); next.ansichten = next.ansichten.filter((item) => !viewIds.includes(item.id)); } else if (deleteTarget.type === 'bereich') { const area = next.bereiche.find((item) => item.id === deleteTarget.id); next.kategorien.forEach((item) => { item.bereichIds = item.bereichIds.filter((id) => id !== deleteTarget.id); }); next.bereiche = next.bereiche.filter((item) => item.id !== deleteTarget.id); next.ansichten = next.ansichten.filter((item) => !area?.ansichtIds.includes(item.id)); } else if (deleteTarget.type === 'ansicht') { next.bereiche.forEach((item) => { item.ansichtIds = item.ansichtIds.filter((id) => id !== deleteTarget.id); }); next.ansichten = next.ansichten.filter((item) => item.id !== deleteTarget.id); } else next.tracker = next.tracker.filter((item) => item.id !== deleteTarget.id); return next; }); setDeleteTarget(null); };

  const saveDay = (date: string, values: Record<string, Formularwert>, notes: string) => { const now = new Date().toISOString(); setDays((current) => { const previous = current.find((item) => item.datum === date); const next = previous ? clone(previous) : emptyRecord(date); getAllTrackers(structure).filter((item) => item.aktiv).forEach((item) => { const value = values[item.id]; const target = item.datentyp === 'Ereignis' ? next.ereignisse : next.messwerte; if (valueExists(value)) target[item.id] = ['Zahl', 'Dezimalzahl', 'Bewertung 0 bis 10', 'Dauer'].includes(item.typ) ? Number(value) : value; else delete target[item.id]; }); next.notizen = notes.trim(); next.geaendertAm = now; return previous ? current.map((item) => item.datum === date ? next : item) : [...current, next]; }); showSuccess('Tagesdatensatz erfolgreich gespeichert.'); };
  const resetDay = () => { setSuccess(''); };
  const selectHistoryDay = (record: Tagesdatensatz) => { setSelectedDate(record.datum); setDetailRecord(null); go('heute'); };
  const deleteHistoryDay = (record: Tagesdatensatz) => {
    if (!window.confirm(`Möchtest du den Eintrag vom ${formatDate(record.datum)} wirklich endgültig löschen?`)) return;
    setDays((current) => current.filter((item) => item.id !== record.id));
    setDetailRecord(null);
    showSuccess('Tagesdatensatz wurde gelöscht.');
  };
  const exportData = () => { const exportedAt = new Date().toISOString(); const data = { version: 2, app: 'HollowTrack', exportiertAm: exportedAt, struktur: structure, tage: days }; const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }); const url = URL.createObjectURL(blob); const link = document.createElement('a'); link.href = url; link.download = `hollowtrack-sicherung-${exportedAt.slice(0, 10)}.json`; link.click(); URL.revokeObjectURL(url); setBackupInfo((current) => ({ ...current, letzteSicherung: exportedAt })); showSuccess('JSON-Sicherung wurde erstellt.'); };
  const prepareImport = async (file: File) => { try { const parsed = JSON.parse(await file.text()) as { tage?: Tagesdatensatz[]; struktur?: Struktur }; if (!Array.isArray(parsed.tage)) throw new Error('Keine Tagesdaten gefunden.'); const unique = [...new Map(parsed.tage.filter((item) => item && item.datum).map((item) => [item.datum, item])).values()]; const conflictTage = unique.filter((item) => days.some((existing) => existing.datum === item.datum)).map((item) => item.datum); const neueTage = unique.filter((item) => !conflictTage.includes(item.datum)).map((item) => item.datum); setImportDecisions(Object.fromEntries(conflictTage.map((date) => [date, 'behalten']))); setImportPreview({ tage: unique, struktur: parsed.struktur, konfliktTage: conflictTage, neueTage }); setImportMessage(''); } catch { setImportMessage('Die Datei konnte nicht gelesen werden. Bitte wähle eine gültige HollowTrack-JSON-Datei.'); } };
  const executeImport = () => { if (!importPreview || !window.confirm('Möchtest du die angezeigten Daten wirklich importieren?')) return; setStructure((current) => importPreview.struktur ? mergeStructure(current, importPreview.struktur) : current); setDays((current) => { const result = [...current]; importPreview.tage.forEach((incoming) => { const index = result.findIndex((item) => item.datum === incoming.datum); if (index < 0) result.push(incoming); else if (importDecisions[incoming.datum] === 'uebernehmen') result[index] = incoming; else if (importDecisions[incoming.datum] === 'zusammenfuehren') result[index] = mergeRecords(result[index], incoming); }); return result; }); setBackupInfo((current) => ({ ...current, letzterImport: new Date().toISOString() })); setImportPreview(null); setImportMessage('Import erfolgreich abgeschlossen.'); showSuccess('Daten wurden erfolgreich importiert.'); };
  const importChatData = () => { if (backupInfo.chatImportiert) { setImportMessage('Die bisherigen Chatdaten wurden bereits importiert.'); return; } if (!window.confirm('Möchtest du die beiden bisherigen Chatdaten jetzt einmalig importieren?')) return; const incoming = chatDays(structure); setDays((current) => [...current, ...incoming.filter((item) => !current.some((existing) => existing.datum === item.datum))]); setBackupInfo((current) => ({ ...current, chatImportiert: true, letzterImport: new Date().toISOString() })); showSuccess('Die beiden Chatdatensätze wurden einmalig importiert.'); };

  if (!ready) return <main className="app-main"><section className="module"><div className="skeleton" /></section></main>;
  const today = <section className="module module--intro" id="heute" aria-labelledby="heute-titel"><p className="module__eyebrow">Persönliches Dashboard · {formatDate(localDate())}</p><h1 className="module__title" id="heute-titel">Heute</h1><p className="module__description">Erfasse deinen Tag Schritt für Schritt. Fehlende Werte bleiben leer und werden nicht automatisch ergänzt.</p><div className="intro-grid"><div className="intro-note"><ShieldCheck size={17} /><span>Deine Daten bleiben auf diesem Gerät.</span></div><div className="intro-note"><Activity size={17} /><span>{activeTrackerCount} aktive Tracker bereit.</span></div></div><div className="day-date-picker"><label className="field"><span className="field__label">Datum des Tages</span><input type="date" value={selectedDate} onChange={(event) => setSelectedDate(event.target.value)} /></label></div><DayForm structure={structure} date={selectedDate} days={days} onSave={saveDay} onReset={resetDay} success={success} /></section>;
  const settings = <><SectionHeader eyebrow="Verwaltung" title="Einstellungen" description="Verwalte Kategorien, Bereiche, Ansichten und globale Tracker. Sichere deine lokalen Daten." icon={Settings} /><div className="settings-intro"><CircleHelp size={16} /><span>Tracker werden nur einmal gespeichert und können in mehreren Ansichten erscheinen. Diätmodus und externe Anbindungen sind für spätere Funktionen vorbereitet.</span></div><div className="verwaltung-aktionen"><button className="button button--primary" type="button" onClick={() => openCreate('kategorie')}><Plus size={15} />Neue Kategorie</button><button className="button" type="button" onClick={() => openCreate('bereich')}><Plus size={15} />Neuer Bereich</button><button className="button" type="button" onClick={() => openCreate('ansicht')}><Plus size={15} />Neue Ansicht</button><button className="button" type="button" onClick={() => openCreate('tracker')}><Plus size={15} />Neuer Tracker</button></div><div className="verwaltungsliste">{[...flattenedItems, ...trackerItems].map((item) => <article className={`verwaltungseintrag ${item.className} ${item.active ? '' : 'element--deaktiviert'}`} key={`${item.type}-${item.id}`}><div className="verwaltungseintrag__kopf"><div><h3 className="verwaltungseintrag__titel">{item.name}</h3><span className="verwaltungseintrag__typ">{item.active ? item.label : `${item.label} · deaktiviert`}</span></div></div><div className="verwaltungseintrag__aktionen"><button className="aktions-button" type="button" onClick={() => toggleStatus(item.type, item.id)}>{item.active ? <CircleOff size={14} /> : <Check size={14} />}{item.active ? 'Deaktivieren' : 'Aktivieren'}</button>{item.type === 'tracker' ? <button className="aktions-button" type="button" onClick={() => openEditTracker(structure.tracker.find((trackerItem) => trackerItem.id === item.id)!)}><Pencil size={14} />Bearbeiten</button> : <button className="aktions-button" type="button" onClick={() => openRename(item.type, item.id, item.name)}><Pencil size={14} />Umbenennen</button>}<button className="aktions-button aktions-button--loeschen" type="button" onClick={() => setDeleteTarget({ type: item.type, id: item.id, name: item.name })}><Trash2 size={14} />Löschen</button></div></article>)}</div><section className="backup-panel"><div className="backup-panel__heading"><div><p className="module__eyebrow">Datensicherung</p><h3 className="backup-panel__title">Lokale Daten verwalten</h3></div><FileJson size={22} /></div><p className="backup-warning">Die Daten werden nur auf diesem Gerät und in diesem Browser gespeichert. Regelmäßige JSON-Exporte werden empfohlen.</p><div className="backup-stats"><span><strong>{days.length}</strong> gespeicherte Tage</span><span>Letzte Sicherung: <strong>{formatDateTime(backupInfo.letzteSicherung)}</strong></span><span>Letzter Import: <strong>{formatDateTime(backupInfo.letzterImport)}</strong></span></div><div className="backup-actions"><button className="button button--primary" type="button" onClick={exportData}><Download size={15} />Daten als JSON exportieren</button><button className="button" type="button" onClick={() => fileInputRef.current?.click()}><Upload size={15} />JSON-Datei importieren</button><input ref={fileInputRef} className="visually-hidden" type="file" accept="application/json,.json" onChange={(event) => { const file = event.target.files?.[0]; if (file) void prepareImport(file); event.target.value = ''; }} /><button className="button" type="button" onClick={importChatData} disabled={backupInfo.chatImportiert}><Import size={15} />{backupInfo.chatImportiert ? 'Chatdaten bereits importiert' : 'Bisherige Chatdaten importieren'}</button></div>{importMessage ? <p className="save-success" role="status"><Check size={14} />{importMessage}</p> : null}{importPreview ? <div className="import-preview"><h3>Importvorschau</h3><p>{importPreview.neueTage.length} neue Datensätze · {importPreview.konfliktTage.length} bereits vorhanden</p>{importPreview.konfliktTage.map((date) => <label className="import-conflict" key={date}><span>{formatDate(date)}</span><select value={importDecisions[date]} onChange={(event) => setImportDecisions((current) => ({ ...current, [date]: event.target.value as ImportKonflikt }))}><option value="behalten">Vorhandenen Eintrag behalten</option><option value="uebernehmen">Importierten Eintrag übernehmen</option><option value="zusammenfuehren">Datensätze zusammenführen</option></select></label>)}<div className="modal__actions"><button className="button button--quiet" type="button" onClick={() => setImportPreview(null)}>Import abbrechen</button><button className="button button--primary" type="button" onClick={executeImport}><Check size={14} />Import durchführen</button></div></div> : null}</section></>;

  return <div className="app-shell"><header className="app-header"><div className="app-header__inner"><a className="app-logo" href={import.meta.env.BASE_URL} aria-label="HollowTrack – Heute öffnen" onClick={(event) => { event.preventDefault(); go('heute'); }}><span className="app-logo__mark">H</span><span>HollowTrack</span></a><p className="app-header__subtitle">Dein persönlicher Überblick</p><div className="app-header__meta"><span className="status-dot" />Lokal gespeichert</div></div></header><nav className="main-navigation" aria-label="Hauptnavigation"><div className="main-navigation__inner">{navigation.map(({ id, label, icon: Icon }) => <a className={`main-navigation__link ${page === id ? 'main-navigation__link--active' : ''}`} href={`${import.meta.env.BASE_URL.replace(/\/$/, '')}/${id === 'heute' ? '' : id}`} key={id} onClick={(event) => { event.preventDefault(); go(id); }}><Icon size={15} />{label}</a>)}</div></nav><main className="app-main">{page === 'heute' ? today : null}{page === 'tracker' ? <section className="module module--wide"><div className="module__heading"><div><p className="module__eyebrow">Deine Architektur</p><h1 className="module__title">Tracker</h1></div><p className="module__status">{counts.categories} Kategorien · {counts.areas} Bereiche · {counts.views} Ansichten · {counts.trackers} Tracker</p></div><p className="module__description">Kategorien und Bereiche dienen der Übersicht. Tracker sind zentral und können in mehreren Ansichten verwendet werden.</p><div className="tracker-view"><TreeView structure={structure} /></div></section> : null}{page === 'verlauf' ? <section className="module module--wide"><SectionHeader title="Verlauf" description="Gespeicherte Tage, neuester Tag zuerst. Tippe auf einen Tag für die vollständige Ansicht." icon={History} />{sortedDays.length ? <div className="history-list">{sortedDays.map((record) => <button className="history-card" type="button" key={record.id} onClick={() => setDetailRecord(record)}><span className="history-card__date">{formatDate(record.datum)}</span><strong>{summaryFor(record, structure)}</strong><span className="history-card__hint">Vollständigen Tag öffnen</span></button>)}</div> : <EmptyState text="Noch keine Verlaufsdaten vorhanden." icon={Clock3} />}</section> : null}{page === 'ernaehrung-sport' ? <><section className="module"><SectionHeader title="Ernährung" description="Ernährungswerte deiner gespeicherten Tage werden über zentrale Tracker erfasst." icon={Utensils} /><EmptyState text="Nutze „Heute“, um Ernährung zu erfassen." icon={Leaf} /></section><section className="module"><SectionHeader title="Sport & Aktivität" description="Training und Aktivität bleiben in derselben Tageserfassung und erzeugen keine doppelten Messdaten." icon={Dumbbell} /><EmptyState text="Nutze „Heute“, um Training und Aktivität zu erfassen." icon={Activity} /></section></> : null}{page === 'einstellungen' ? <section className="module module--wide">{settings}</section> : null}</main><footer className="app-footer"><p>HollowTrack · persönlich, lokal, übersichtlich</p></footer>{modal ? <Modal modal={modal} structure={structure} name={modalName} parentId={parentId} inputType={inputType} dataType={dataType} setName={setModalName} setParentId={setParentId} setInputType={setInputType} setDataType={setDataType} onClose={() => setModal(null)} onSubmit={submitModal} /> : null}{deleteTarget ? <DeleteModal name={deleteTarget.name} onClose={() => setDeleteTarget(null)} onConfirm={confirmDelete} /> : null}{detailRecord ? <DayDetail record={detailRecord} structure={structure} onClose={() => setDetailRecord(null)} onEdit={() => selectHistoryDay(detailRecord)} onDelete={() => deleteHistoryDay(detailRecord)} /> : null}</div>;
}

function NotFound() { return <main className="app-main"><section className="module"><p className="module__eyebrow">HollowTrack</p><h1 className="module__title">Diese Seite gibt es nicht.</h1><p className="module__description">Kehre zur Startseite zurück.</p><a className="button button--primary" href={import.meta.env.BASE_URL}>Zur Startseite</a></section></main>; }
function Router() { return <Switch><Route path="/" component={Home} /><Route path="/heute" component={Home} /><Route path="/tracker" component={Home} /><Route path="/verlauf" component={Home} /><Route path="/ernaehrung-sport" component={Home} /><Route path="/einstellungen" component={Home} /><Route component={NotFound} /></Switch>; }
const queryClient = new QueryClient();
function App() { return <QueryClientProvider client={queryClient}><TooltipProvider><WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}><Router /></WouterRouter><Toaster /></TooltipProvider></QueryClientProvider>; }
export default App;