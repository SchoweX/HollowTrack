import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './queryClient';
import {
  loadStructureData,
  loadDaysData,
  loadBackupInfoData,
  saveStructureData,
  saveDaysData,
  saveBackupInfoData,
} from './dataStore';
import { createHistoryActions } from './historyActions';
import { createCategoryActions } from './categoryActions';
import { pageFromPath, pathForPage } from './navigation';
import { useAppNavigation } from './useAppNavigation';
import { runtimeConfig } from './runtimeConfig';
import { WebAppRouter } from './components/WebAppRouter';
import { createBackup, serializeBackup, parseBackup, prepareBackupImport } from './backupService';
import { normalizeStructure, mergeStructure } from './structureService';
import {
  toggleStructureStatus,
  cycleStructureCategoryIcon,
  deleteStructureElement,
} from './structureMutations';
import { browserDialogs } from './platform';
import { browserFilePlatform, readFileText, type ImportFile } from './filePlatform';
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
  Utensils,
  X,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
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


const navigation: NavItem[] = [
  { id: 'heute', label: 'Heute', icon: CalendarDays },
  { id: 'tracker', label: 'Tracker', icon: Activity },
  { id: 'verlauf', label: 'Verlauf', icon: History },
  { id: 'ernaehrung-sport', label: 'Ernährung & Sport', icon: Dumbbell },
  { id: 'einstellungen', label: 'Einstellungen', icon: Settings },
];

function loadStructure(): Struktur {
  return normalizeStructure(loadStructureData());
}

function loadDays(): Tagesdatensatz[] {
  return loadDaysData();
}

function loadBackupInfo(): Sicherungsinfo {
  return loadBackupInfoData();
}
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

import { DayDetail } from './components/DayDetail';

import { DeleteModal, Modal } from './components/Modals';
import { useImportExportState } from './hooks/useImportExportState';
import { AdminItem } from './components/AdminItem';
import { JsonFilePicker } from './components/JsonFilePicker';

function Home() {
  const { location, navigate } = useAppNavigation();
  const [structure, setStructure] = useState<Struktur>(loadStructure);
  const [days, setDays] = useState<Tagesdatensatz[]>(loadDays);
  const [ready, setReady] = useState(false);
  const [selectedDate, setSelectedDate] = useState(localDate);
  const [success, setSuccess] = useState('');
  const [settingsView, setSettingsView] = useState<'root' | 'today'>('root');
  const [modal, setModal] = useState<ModalState>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ type: ElementTyp; id: string; name: string } | null>(null);
  const {
    backupInfo,
    setBackupInfo,
    importPreview,
    setImportPreview,
    importDecisions,
    setImportDecisions,
    importMessage,
    setImportMessage,
  } = useImportExportState(loadBackupInfo);

  const [detailRecord, setDetailRecord] = useState<Tagesdatensatz | null>(null);
  const [modalName, setModalName] = useState('');
  const [parentId, setParentId] = useState('');
  const [inputType, setInputType] = useState<Eingabetyp>('Text');
  const [dataType, setDataType] = useState<TrackerDatentyp>('Messwert');
  const page: PageId = pageFromPath(location);
  const go = (next: PageId) => navigate(pathForPage(next));

  useEffect(() => { saveStructureData(structure); setReady(true); }, [structure]);
  useEffect(() => { saveDaysData(days); }, [days]);
  useEffect(() => { saveBackupInfoData(backupInfo); }, [backupInfo]);
  useEffect(() => { document.title = `HollowTrack – ${navigation.find((item) => item.id === page)?.label || 'Heute'}`; }, [page]);
  const counts = useMemo(() => ({ categories: structure.kategorien.length, areas: structure.bereiche.length, views: structure.ansichten.length, trackers: structure.tracker.length }), [structure]);
  const activeTrackerCount = structure.tracker.filter((item) => item.aktiv).length;
  const sortedDays = useMemo(() => [...days].sort((a, b) => b.datum.localeCompare(a.datum)), [days]);
  const flattenedItems = useMemo(() => sorted(structure.kategorien).flatMap((category) => [
    { type: 'kategorie' as ElementTyp, id: category.id, name: category.name, active: category.aktiv, label: 'Kategorie', className: '' },
    ...category.bereichIds.flatMap((areaId) => { const area = structure.bereiche.find((item) => item.id === areaId); if (!area) return []; return [{ type: 'bereich' as ElementTyp, id: area.id, name: area.name, active: area.aktiv, label: `Bereich in „${category.name}“`, className: 'verwaltungseintrag--unterordner' }, ...area.ansichtIds.flatMap((viewId) => { const view = structure.ansichten.find((item) => item.id === viewId); if (!view) return []; return [{ type: 'ansicht' as ElementTyp, id: view.id, name: view.name, active: view.aktiv, label: `Ansicht in „${area.name}“`, className: 'verwaltungseintrag--unterordner' }]; })]; }),
  ]), [structure]);
  const trackerItems = structure.tracker.map((item) => ({ type: 'tracker' as ElementTyp, id: item.id, name: item.name, active: item.aktiv, label: `${item.typ} · ${structure.ansichten.filter((view) => view.trackerIds.includes(item.id)).length} Ansichten`, className: 'verwaltungseintrag--tracker' }));



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
  const cycleCategoryIcon = (id: string) =>
    setStructure((current) => cycleStructureCategoryIcon(current, id));
  const { moveCategory } = createCategoryActions(setStructure);

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
  const toggleStatus = (type: ElementTyp, id: string) =>
    setStructure((current) => toggleStructureStatus(current, type, id));
  const confirmDelete = () => {
    if (!deleteTarget) return;

    setStructure((current) =>
      deleteStructureElement(current, deleteTarget.type, deleteTarget.id),
    );

    setDeleteTarget(null);
  };

  const saveDay = (date: string, values: Record<string, Formularwert>, notes: string) => { const now = new Date().toISOString(); setDays((current) => { const previous = current.find((item) => item.datum === date); const next = previous ? clone(previous) : emptyRecord(date); getAllTrackers(structure).filter((item) => item.aktiv).forEach((item) => { const value = values[item.id]; const target = item.datentyp === 'Ereignis' ? next.ereignisse : next.messwerte; if (valueExists(value)) target[item.id] = ['Zahl', 'Dezimalzahl', 'Bewertung 0 bis 10', 'Dauer'].includes(item.typ) ? Number(value) : value; else delete target[item.id]; }); next.notizen = notes.trim(); next.geaendertAm = now; return previous ? current.map((item) => item.datum === date ? next : item) : [...current, next]; }); showSuccess('Tagesdatensatz erfolgreich gespeichert.'); };
  const {
    resetDay,
    selectHistoryDay,
    deleteHistoryDay,
  } = createHistoryActions({
    setSuccess,
    setSelectedDate,
    setDetailRecord,
    setDays,
    goHome: () => go('heute'),
    showSuccess,
  });
  const exportData = () => { const exportedAt = new Date().toISOString(); const backup = createBackup(structure, days, exportedAt); browserFilePlatform.saveFile({ filename: `hollowtrack-sicherung-${exportedAt.slice(0, 10)}.json`, mimeType: 'application/json', content: serializeBackup(backup) }); setBackupInfo((current) => ({ ...current, letzteSicherung: exportedAt })); showSuccess('JSON-Sicherung wurde erstellt.'); };
  const prepareImport = async (file: ImportFile) => {
    try {
      const parsed = parseBackup(await readFileText(file));
      const prepared = prepareBackupImport(parsed);

      const unique = [
        ...new Map(
          prepared.tage
            .filter((item) => item && item.datum)
            .map((item) => [item.datum, item]),
        ).values(),
      ];

      const conflictTage = unique
        .filter((item) => days.some((existing) => existing.datum === item.datum))
        .map((item) => item.datum);

      const neueTage = unique
        .filter((item) => !conflictTage.includes(item.datum))
        .map((item) => item.datum);

      setImportDecisions(
        Object.fromEntries(conflictTage.map((date) => [date, 'behalten'])),
      );

      setImportPreview({
        tage: unique,
        struktur: prepared.struktur,
        konfliktTage: conflictTage,
        neueTage,
      });

      setImportMessage('');
    } catch {
      setImportMessage(
        'Die Datei konnte nicht gelesen werden. Bitte wähle eine gültige HollowTrack-JSON-Datei.',
      );
    }
  };
  const executeImport = () => { if (!importPreview || !browserDialogs.confirm('Möchtest du die angezeigten Daten wirklich importieren?')) return; setStructure((current) => importPreview.struktur ? mergeStructure(current, importPreview.struktur) : current); setDays((current) => { const result = [...current]; importPreview.tage.forEach((incoming) => { const index = result.findIndex((item) => item.datum === incoming.datum); if (index < 0) result.push(incoming); else if (importDecisions[incoming.datum] === 'uebernehmen') result[index] = incoming; else if (importDecisions[incoming.datum] === 'zusammenfuehren') result[index] = mergeRecords(result[index], incoming); }); return result; }); setBackupInfo((current) => ({ ...current, letzterImport: new Date().toISOString() })); setImportPreview(null); setImportMessage('Import erfolgreich abgeschlossen.'); showSuccess('Daten wurden erfolgreich importiert.'); };
  const importChatData = () => { if (backupInfo.chatImportiert) { setImportMessage('Die bisherigen Chatdaten wurden bereits importiert.'); return; } if (!browserDialogs.confirm('Möchtest du die beiden bisherigen Chatdaten jetzt einmalig importieren?')) return; const incoming = chatDays(structure); setDays((current) => [...current, ...incoming.filter((item) => !current.some((existing) => existing.datum === item.datum))]); setBackupInfo((current) => ({ ...current, chatImportiert: true, letzterImport: new Date().toISOString() })); showSuccess('Die beiden Chatdatensätze wurden einmalig importiert.'); };

  if (!ready) return <main className="app-main"><section className="module"><div className="skeleton" /></section></main>;
  const today = <section className="module module--intro" id="heute" aria-labelledby="heute-titel"><p className="module__eyebrow">Persönliches Dashboard · {formatDate(localDate())}</p><h1 className="module__title" id="heute-titel">Heute</h1><p className="module__description">Erfasse deinen Tag Schritt für Schritt. Fehlende Werte bleiben leer und werden nicht automatisch ergänzt.</p><div className="intro-grid"><div className="intro-note"><ShieldCheck size={17} /><span>Deine Daten bleiben auf diesem Gerät.</span></div><div className="intro-note"><Activity size={17} /><span>{activeTrackerCount} aktive Tracker bereit.</span></div></div><div className="day-date-picker"><label className="field"><span className="field__label">Datum des Tages</span><input type="date" value={selectedDate} onChange={(event) => setSelectedDate(event.target.value)} /></label></div><DayForm structure={structure} date={selectedDate} days={days} onSave={saveDay} onReset={resetDay} success={success} /></section>;
  const settings = <><SectionHeader eyebrow="Verwaltung" title="Einstellungen" description="Verwalte Kategorien, Bereiche, Ansichten und globale Tracker. Sichere deine lokalen Daten." icon={Settings} /><div className="settings-intro"><CircleHelp size={16} /><span>Tracker werden nur einmal gespeichert und können in mehreren Ansichten erscheinen. Diätmodus und externe Anbindungen sind für spätere Funktionen vorbereitet.</span></div><div className="verwaltung-aktionen"><button className="button button--primary" type="button" onClick={() => openCreate('kategorie')}><Plus size={15} />Neue Kategorie</button><button className="button" type="button" onClick={() => openCreate('bereich')}><Plus size={15} />Neuer Bereich</button><button className="button" type="button" onClick={() => openCreate('ansicht')}><Plus size={15} />Neue Ansicht</button><button className="button" type="button" onClick={() => openCreate('tracker')}><Plus size={15} />Neuer Tracker</button></div><div className="verwaltungsliste">{[...flattenedItems, ...trackerItems].map((item) => <AdminItem
  item={item}
  structure={structure}
  toggleStatus={toggleStatus}
  openEditTracker={openEditTracker}
  openRename={openRename}
  setDeleteTarget={setDeleteTarget}
  cycleCategoryIcon={cycleCategoryIcon}
  moveCategory={moveCategory}
  openMoveArea={openMoveArea}
/>)}</div><section className="backup-panel"><div className="backup-panel__heading"><div><p className="module__eyebrow">Datensicherung</p><h3 className="backup-panel__title">Lokale Daten verwalten</h3></div><FileJson size={22} /></div><p className="backup-warning">Die Daten werden nur auf diesem Gerät und in diesem Browser gespeichert. Regelmäßige JSON-Exporte werden empfohlen.</p><div className="backup-stats"><span><strong>{days.length}</strong> gespeicherte Tage</span><span>Letzte Sicherung: <strong>{formatDateTime(backupInfo.letzteSicherung)}</strong></span><span>Letzter Import: <strong>{formatDateTime(backupInfo.letzterImport)}</strong></span></div><div className="backup-actions"><button className="button button--primary" type="button" onClick={exportData}><Download size={15} />Daten als JSON exportieren</button><JsonFilePicker onFile={(file) => void prepareImport(file)} /><button className="button" type="button" onClick={importChatData} disabled={backupInfo.chatImportiert}><Import size={15} />{backupInfo.chatImportiert ? 'Chatdaten bereits importiert' : 'Bisherige Chatdaten importieren'}</button></div>{importMessage ? <p className="save-success" role="status"><Check size={14} />{importMessage}</p> : null}{importPreview ? <div className="import-preview"><h3>Importvorschau</h3><p>{importPreview.neueTage.length} neue Datensätze · {importPreview.konfliktTage.length} bereits vorhanden</p>{importPreview.konfliktTage.map((date) => <label className="import-conflict" key={date}><span>{formatDate(date)}</span><select value={importDecisions[date]} onChange={(event) => setImportDecisions((current) => ({ ...current, [date]: event.target.value as ImportKonflikt }))}><option value="behalten">Vorhandenen Eintrag behalten</option><option value="uebernehmen">Importierten Eintrag übernehmen</option><option value="zusammenfuehren">Datensätze zusammenführen</option></select></label>)}<div className="modal__actions"><button className="button button--quiet" type="button" onClick={() => setImportPreview(null)}>Import abbrechen</button><button className="button button--primary" type="button" onClick={executeImport}><Check size={14} />Import durchführen</button></div></div> : null}</section></>;

  return <div className="app-shell"><header className="app-header"><div className="app-header__inner"><a className="app-logo" href={runtimeConfig.basePath} aria-label="HollowTrack – Heute öffnen" onClick={(event) => { event.preventDefault(); go('heute'); }}><span className="app-logo__mark">H</span><span>HollowTrack</span></a><p className="app-header__subtitle">Dein persönlicher Überblick</p><div className="app-header__meta"><span className="status-dot" />Lokal gespeichert</div></div></header><nav className="main-navigation" aria-label="Hauptnavigation"><div className="main-navigation__inner">{navigation.map(({ id, label, icon: Icon }) => <a className={`main-navigation__link ${page === id ? 'main-navigation__link--active' : ''}`} href={`${runtimeConfig.basePath.replace(/\/$/, '')}/${id === 'heute' ? '' : id}`} key={id} onClick={(event) => { event.preventDefault(); go(id); }}><Icon size={15} />{label}</a>)}</div></nav><main className="app-main">{page === 'heute' ? today : null}{page === 'tracker' ? <section className="module module--wide"><div className="module__heading"><div><p className="module__eyebrow">Deine Architektur</p><h1 className="module__title">Tracker</h1></div><p className="module__status">{counts.categories} Kategorien · {counts.areas} Bereiche · {counts.views} Ansichten · {counts.trackers} Tracker</p></div><p className="module__description">Kategorien und Bereiche dienen der Übersicht. Tracker sind zentral und können in mehreren Ansichten verwendet werden.</p><div className="tracker-view"><TreeView structure={structure} /></div></section> : null}{page === 'verlauf' ? <section className="module module--wide"><SectionHeader title="Verlauf" description="Gespeicherte Tage, neuester Tag zuerst. Tippe auf einen Tag für die vollständige Ansicht." icon={History} />{sortedDays.length ? <div className="history-list">{sortedDays.map((record) => <button className="history-card" type="button" key={record.id} onClick={() => setDetailRecord(record)}><span className="history-card__date">{formatDate(record.datum)}</span><strong>{summaryFor(record, structure)}</strong><span className="history-card__hint">Vollständigen Tag öffnen</span></button>)}</div> : <EmptyState text="Noch keine Verlaufsdaten vorhanden." icon={Clock3} />}</section> : null}{page === 'ernaehrung-sport' ? <><section className="module"><SectionHeader title="Ernährung" description="Ernährungswerte deiner gespeicherten Tage werden über zentrale Tracker erfasst." icon={Utensils} /><EmptyState text="Nutze „Heute“, um Ernährung zu erfassen." icon={Leaf} /></section><section className="module"><SectionHeader title="Sport & Aktivität" description="Training und Aktivität bleiben in derselben Tageserfassung und erzeugen keine doppelten Messdaten." icon={Dumbbell} /><EmptyState text="Nutze „Heute“, um Training und Aktivität zu erfassen." icon={Activity} /></section></> : null}{page === 'einstellungen' ? <section className="module module--wide">{settingsView === 'root' ? <><SectionHeader eyebrow="Einstellungen" title="Einstellungen" description="Allgemeine Einstellungen und Verwaltung von HollowTrack." icon={Settings} /><div className="verwaltung-aktionen"><button className="button button--primary" type="button" onClick={() => setSettingsView('today')}>Heute einstellen</button></div><div className="settings-root-backup">{settings}</div></> : <><div className="verwaltung-aktionen"><button className="button" type="button" onClick={() => setSettingsView('root')}>← Zurück zu Einstellungen</button></div><div className="settings-today-content">{settings}</div></>}</section> : null}</main><footer className="app-footer"><p>HollowTrack · persönlich, lokal, übersichtlich</p></footer>{modal ? <Modal modal={modal} structure={structure} name={modalName} parentId={parentId} inputType={inputType} dataType={dataType} setName={setModalName} setParentId={setParentId} setInputType={setInputType} setDataType={setDataType} onClose={() => setModal(null)} onSubmit={submitModal} /> : null}{deleteTarget ? <DeleteModal name={deleteTarget.name} onClose={() => setDeleteTarget(null)} onConfirm={confirmDelete} /> : null}{detailRecord ? <DayDetail record={detailRecord} structure={structure} onClose={() => setDetailRecord(null)} onEdit={() => selectHistoryDay(detailRecord)} onDelete={() => deleteHistoryDay(detailRecord)} /> : null}</div>;
}

function App() { return <QueryClientProvider client={queryClient}><TooltipProvider><WebAppRouter home={Home} /><Toaster /></TooltipProvider></QueryClientProvider>; }
export default App;