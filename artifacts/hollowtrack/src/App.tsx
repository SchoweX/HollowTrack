import { TodaySettingsTree } from './components/TodaySettingsTree';
import { usePersistenceSync } from './usePersistenceSync';
import { localDate, sorted, formatDate, formatDateTime, valueExists, clone, newId } from './utils';
import { browserAppPlatform } from './appPlatform';
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
import { chatDays } from './chatImportData';
import { createCategoryActions } from './categoryActions';
import { pageFromPath, pathForPage } from './navigation';
import { useAppNavigation } from './useAppNavigation';
import { runtimeConfig } from './runtimeConfig';
import { WebAppRouter } from './components/WebAppRouter';
import { createBackup, serializeBackup, parseBackup, prepareBackupImport } from './backupService';
import { normalizeStructure, mergeStructure, makeTracker } from './structureService';
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
import { BarChart3 } from 'lucide-react';
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
  TrackerTyp,
  Wertebereich,
} from './types';

type NavItem = { id: PageId; label: string; icon: LucideIcon };


const navigation: NavItem[] = [
  { id: 'heute', label: 'Heute', icon: CalendarDays },
  { id: 'sport', label: 'Sport', icon: Dumbbell },
  { id: 'ernaehrung', label: 'Ernährung', icon: Utensils },
  { id: 'tracker', label: 'Tracker', icon: Activity },
  { id: 'verlauf', label: 'Verlauf', icon: History },
  { id: 'statistik', label: 'Statistik', icon: BarChart3 },
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
import { SportView } from './components/SportView';

import { DayDetail } from './components/DayDetail';
import { StatisticsView } from './components/StatisticsView';

import { DeleteModal, Modal } from './components/Modals';
import { useImportExportState } from './hooks/useImportExportState';
import { AdminItem } from './components/AdminItem';
import { JsonFilePicker } from './components/JsonFilePicker';

function Home() {
  const { location, navigate } = useAppNavigation();
  const [structure, setStructure] = useState<Struktur>(loadStructure);
  const [days, setDays] = useState<Tagesdatensatz[]>(loadDays);
  
  const [selectedDate, setSelectedDate] = useState(localDate);
  const [success, setSuccess] = useState('');
  const [settingsView, setSettingsView] = useState<'root' | 'today' | 'sport' | 'ernaehrung'>('root');
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
  const [trackerTyp, setTrackerTyp] = useState<TrackerTyp>('standard');
  const [erfassungsart, setErfassungsart] =
    useState<'einzelwert' | 'saetze'>('einzelwert');
  const [gewichtAktiv, setGewichtAktiv] = useState(false);
  const [trainingsgewicht, setTrainingsgewicht] = useState('');
  const [selbsteinschaetzungAktiv, setSelbsteinschaetzungAktiv] =
    useState(false);
  const [selbsteinschaetzungName, setSelbsteinschaetzungName] =
    useState('Selbsteinschätzung');
  const page: PageId = pageFromPath(location);
  const go = (next: PageId) => navigate(pathForPage(next));

  const { ready } = usePersistenceSync({
    structure,
    days,
    backupInfo,
    saveStructure: saveStructureData,
    saveDays: saveDaysData,
    saveBackupInfo: saveBackupInfoData,
  });
  useEffect(() => {
    browserAppPlatform.setTitle(
      `HollowTrack – ${navigation.find((item) => item.id === page)?.label || 'Heute'}`,
    );
  }, [page]);
  const counts = useMemo(() => ({ categories: structure.kategorien.length, areas: structure.bereiche.length, views: structure.ansichten.length, trackers: structure.tracker.length }), [structure]);
  const activeTrackerCount = structure.tracker.filter((item) => item.aktiv).length;
  const sortedDays = useMemo(() => [...days].sort((a, b) => b.datum.localeCompare(a.datum)), [days]);
  const flattenedItems = useMemo(() => sorted(structure.kategorien).flatMap((category) => [
    { type: 'kategorie' as ElementTyp, id: category.id, name: category.name, active: category.aktiv, label: 'Kategorie', className: '' },
    ...category.bereichIds.flatMap((areaId) => { const area = structure.bereiche.find((item) => item.id === areaId); if (!area) return []; return [{ type: 'bereich' as ElementTyp, id: area.id, name: area.name, active: area.aktiv, label: `Bereich in „${category.name}“`, className: 'verwaltungseintrag--unterordner' }, ...area.ansichtIds.flatMap((viewId) => { const view = structure.ansichten.find((item) => item.id === viewId); if (!view) return []; return [{ type: 'ansicht' as ElementTyp, id: view.id, name: view.name, active: view.aktiv, label: `Ansicht in „${area.name}“`, className: 'verwaltungseintrag--unterordner' }]; })]; }),
  ]), [structure]);
  const trackerItems = structure.tracker.map((item) => ({ type: 'tracker' as ElementTyp, id: item.id, name: item.name, active: item.aktiv, label: `${item.typ} · ${structure.ansichten.filter((view) => view.trackerIds.includes(item.id)).length} Ansichten`, className: 'verwaltungseintrag--tracker' }));



  const showSuccess = (message: string) => {
    setSuccess(message);
    browserAppPlatform.schedule(() => setSuccess(''), 3500);
  };
  const openCreate = (type: ElementTyp) => { const category = structure.kategorien.find((item) => item.aktiv); const area = structure.bereiche.find((item) => item.aktiv); const view = structure.ansichten.find((item) => item.aktiv); setModalName(''); setParentId(type === 'bereich' ? category?.id || '' : type === 'ansicht' ? area?.id || '' : type === 'tracker' ? view?.id || '' : ''); setInputType('Text'); setDataType('Messwert'); setErfassungsart('einzelwert'); setTrackerTyp('standard'); setGewichtAktiv(false); setTrainingsgewicht('');
    setSelbsteinschaetzungAktiv(false);
    setSelbsteinschaetzungName('Selbsteinschätzung');
    setModal({ mode: 'create', type }); };
  const openRename = (type: ElementTyp, id: string, name: string) => { if (type === 'tracker') return; setModalName(name); setParentId(''); setModal({ mode: 'rename', type, id }); };
  const openMoveArea = (id: string) => {
    const currentCategory = structure.kategorien.find((category) => category.bereichIds.includes(id));
    const target = structure.kategorien.find((category) => category.aktiv && category.id !== currentCategory?.id);
    if (!target) { showSuccess('Es gibt keine andere aktive Kategorie zum Verschieben.'); return; }
    setModalName('');
    setParentId(target.id);
    setModal({ mode: 'move', type: 'bereich', id });
  };
  const openEditTracker = (item: Tracker) => { setModalName(item.name); setParentId(structure.ansichten.find((view) => view.trackerIds.includes(item.id))?.id || ''); setInputType(item.typ); setDataType(item.datentyp); setErfassungsart(item.erfassungsart ?? 'einzelwert'); setTrackerTyp(item.trackerTyp ?? (item.erfassungsart === 'saetze' ? 'training' : 'standard')); setGewichtAktiv(
    item.trainingsgewichtAktiv ??
      item.trainingsgewicht !== undefined,
  );
  setTrainingsgewicht(''); setModal({ mode: 'edit', type: 'tracker', id: item.id }); };
  const openEditStructureItem = (item: any) => {
    if (item.type === 'tracker') {
      const tracker = structure.tracker.find(
        (candidate) => candidate.id === item.id,
      );
      if (tracker) openEditTracker(tracker);
      return;
    }

    if (item.type === 'kategorie') {
      const category = structure.kategorien.find(
        (candidate) => candidate.id === item.id,
      );
      if (!category) return;

      setModalName(category.name);
      setParentId('');
      setSelbsteinschaetzungAktiv(
        category.selbsteinschaetzungAktiv ?? false,
      );
      setSelbsteinschaetzungName(
        category.selbsteinschaetzungName ?? 'Selbsteinschätzung',
      );
      setModal({
        mode: 'edit',
        type: 'kategorie',
        id: category.id,
      });
      return;
    }

    if (item.type === 'bereich') {
      const area = structure.bereiche.find(
        (candidate) => candidate.id === item.id,
      );
      if (!area) return;

      const category = structure.kategorien.find((candidate) =>
        candidate.bereichIds.includes(area.id),
      );

      setModalName(area.name);
      setParentId(category?.id ?? '');
      setModal({
        mode: 'edit',
        type: 'bereich',
        id: area.id,
      });
    }
  };

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
        if (modal.type === 'kategorie') {
          const category = next.kategorien.find((item) => item.id === modal.id);
          if (category) {
            category.name = value;
            category.selbsteinschaetzungAktiv =
              selbsteinschaetzungAktiv;
            category.selbsteinschaetzungName =
              selbsteinschaetzungName.trim() || 'Selbsteinschätzung';
          }
          return next;
        }

        if (modal.type === 'bereich') {
          const area = next.bereiche.find((item) => item.id === modal.id);
          if (area) {
            area.name = value;

            const oldCategory = next.kategorien.find((category) =>
              category.bereichIds.includes(area.id),
            );
            const newCategory = next.kategorien.find(
              (category) => category.id === parentId,
            );

            if (newCategory && oldCategory?.id !== newCategory.id) {
              if (oldCategory) {
                oldCategory.bereichIds = oldCategory.bereichIds.filter(
                  (areaId) => areaId !== area.id,
                );
              }

              if (!newCategory.bereichIds.includes(area.id)) {
                newCategory.bereichIds.push(area.id);
              }

              area.position = newCategory.bereichIds.length;
            }
          }
          return next;
        }

        const target = next.tracker.find((item) => item.id === modal.id);
        if (target) { target.name = value; target.typ = inputType; target.datentyp = dataType; target.erfassungsart = erfassungsart; target.trackerTyp = trackerTyp;
          target.trainingsgewichtAktiv = gewichtAktiv;
          delete target.trainingsgewicht; if (parentId) { const view = next.ansichten.find((item) => item.id === parentId); if (view && !view.trackerIds.includes(target.id)) view.trackerIds.push(target.id); } }
      } else if (modal.type === 'kategorie') next.kategorien.push({ id: newId('kategorie'), name: value, icon: 'FolderOpen', aktiv: true, position: next.kategorien.length + 1, bereichIds: [],
        selbsteinschaetzungAktiv,
        selbsteinschaetzungName:
          selbsteinschaetzungName.trim() || 'Selbsteinschätzung'
      });
      else if (modal.type === 'bereich') { const category = next.kategorien.find((item) => item.id === parentId); if (category) { const id = newId('bereich'); const viewId = newId('ansicht'); category.bereichIds.push(id); next.bereiche.push({ id, name: value, aktiv: true, position: category.bereichIds.length, ansichtIds: [viewId] }); next.ansichten.push({ id: viewId, name: 'Tagesübersicht', aktiv: true, position: 1, trackerIds: [] }); } }
      else if (modal.type === 'ansicht') { const area = next.bereiche.find((item) => item.id === parentId); if (area) { const id = newId('ansicht'); area.ansichtIds.push(id); next.ansichten.push({ id, name: value, aktiv: true, position: area.ansichtIds.length, trackerIds: [] }); } }
      else { const view = next.ansichten.find((item) => item.id === parentId); const item = makeTracker(
            newId('tracker'),
            value,
            inputType,
            dataType,
            next.tracker.length + 1,
            undefined,
            undefined,
            erfassungsart,
            trackerTyp,
          );
              item.trainingsgewichtAktiv = gewichtAktiv;
              next.tracker.push(item); if (view && !view.trackerIds.includes(item.id)) view.trackerIds.push(item.id); }
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

  const saveDay = (
    date: string,
    values: Record<string, Formularwert>,
    categoryNotes: Record<string, string>,
  ) => { const now = new Date().toISOString(); setDays((current) => { const previous = current.find((item) => item.datum === date); const next = previous ? clone(previous) : emptyRecord(date); getAllTrackers(structure).filter((item) => item.aktiv).forEach((item) => { const value = values[item.id]; const target = item.datentyp === 'Ereignis' ? next.ereignisse : next.messwerte; if (valueExists(value)) target[item.id] = ['Zahl', 'Dezimalzahl', 'Bewertung 0 bis 10', 'Dauer'].includes(item.typ) ? Number(value) : value; else delete target[item.id]; }); next.kategorieNotizen = Object.fromEntries(
        Object.entries(categoryNotes)
          .map(([categoryId, text]) => [categoryId, text.trim()])
          .filter(([, text]) => Boolean(text)),
      );

      next.notizen = structure.kategorien
        .map((category) => {
          const text = next.kategorieNotizen?.[category.id];

          return text ? `${category.name}:\n${text}` : '';
        })
        .filter(Boolean)
        .join('\n\n'); next.geaendertAm = now; return previous ? current.map((item) => item.datum === date ? next : item) : [...current, next]; }); showSuccess('Tagesdatensatz erfolgreich gespeichert.'); };
  const saveSport = (
    values: Record<string, string>,
    level: 1 | 2 | 3,
    trainingsart: string,
  ) => {
    const now = new Date().toISOString();

    const sportCategory = structure.kategorien.find(
      (category) =>
        category.aktiv &&
        category.name.trim().toLocaleLowerCase('de-DE') === 'sport',
    );

    const sportTrackerIds = new Set<string>();

    sportCategory?.bereichIds.forEach((areaId) => {
      const area = structure.bereiche.find(
        (item) => item.id === areaId && item.aktiv,
      );

      area?.ansichtIds.forEach((viewId) => {
        const view = structure.ansichten.find(
          (item) => item.id === viewId && item.aktiv,
        );

        view?.trackerIds.forEach((trackerId) => {
          const tracker = structure.tracker.find(
            (item) => item.id === trackerId && item.aktiv,
          );

          if (tracker) {
            sportTrackerIds.add(tracker.id);
          }
        });
      });
    });

    setDays((current) => {
      const previous = current.find(
        (item) => item.datum === selectedDate,
      );

      const next = previous
        ? clone(previous)
        : emptyRecord(selectedDate);

      sportTrackerIds.forEach((trackerId) => {
        const tracker = structure.tracker.find(
          (item) => item.id === trackerId,
        );

        const weightKey = `${trackerId}::gewicht`;


        const usesTrainingWeight =


          tracker?.trainingsgewichtAktiv === true ||


          tracker?.trainingsgewicht !== undefined;



        if (usesTrainingWeight) {


          const weightValue = values[weightKey]?.trim();



          if (weightValue) {


            next.messwerte[weightKey] = Number(weightValue);


          } else {


            delete next.messwerte[weightKey];


          }


        } else {


          delete next.messwerte[weightKey];


        }



        if (tracker?.erfassungsart === 'saetze') {
          const setCount = level === 3 ? 3 : 2;

          ([1, 2, 3] as const).forEach((setNumber) => {
            const setKey = `${trackerId}::satz-${setNumber}`;
            const value = values[setKey]?.trim();

            if (setNumber <= setCount && value) {
              next.messwerte[setKey] = Number(value);
            } else {
              delete next.messwerte[setKey];
            }
          });

          delete next.messwerte[trackerId];
          return;
        }

        const value = values[trackerId]?.trim();

        if (value) {
          next.messwerte[trackerId] = Number(value);
        } else {
          delete next.messwerte[trackerId];
        }

        ([1, 2, 3] as const).forEach((setNumber) => {
          delete next.messwerte[`${trackerId}::satz-${setNumber}`];
        });
      });

      next.ereignisse['sport-trainingsstufe'] = String(level);

      if (trainingsart) {
        next.ereignisse['sport-trainingsart'] = trainingsart;
      } else {
        delete next.ereignisse['sport-trainingsart'];
      }
      next.geaendertAm = now;

      return previous
        ? current.map((item) =>
            item.id === next.id ? next : item,
          )
        : [...current, next];
    });

    showSuccess('Training erfolgreich gespeichert.');
  };

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
  const executeImport = () => {
    if (
      !importPreview ||
      !importPreview.struktur ||
      !browserDialogs.confirm(
        'Möchtest du die angezeigten Daten wirklich importieren?',
      )
    ) {
      return;
    }

    const importStructure = importPreview.struktur;

    setStructure(importStructure); setDays((current) => { const result = [...current]; importPreview.tage.forEach((incoming) => { const index = result.findIndex((item) => item.datum === incoming.datum); if (index < 0) result.push(incoming); else if (importDecisions[incoming.datum] === 'uebernehmen') result[index] = incoming; else if (importDecisions[incoming.datum] === 'zusammenfuehren') result[index] = mergeRecords(result[index], incoming); }); return result; }); setBackupInfo((current) => ({ ...current, letzterImport: new Date().toISOString() })); setImportPreview(null); setImportMessage('Import erfolgreich abgeschlossen.'); showSuccess('Daten wurden erfolgreich importiert.'); };
  const importChatData = () => { if (backupInfo.chatImportiert) { setImportMessage('Die bisherigen Chatdaten wurden bereits importiert.'); return; } if (!browserDialogs.confirm('Möchtest du die beiden bisherigen Chatdaten jetzt einmalig importieren?')) return; const incoming = chatDays(structure); setDays((current) => [...current, ...incoming.filter((item) => !current.some((existing) => existing.datum === item.datum))]); setBackupInfo((current) => ({ ...current, chatImportiert: true, letzterImport: new Date().toISOString() })); showSuccess('Die beiden Chatdatensätze wurden einmalig importiert.'); };

  if (!ready) return <main className="app-main"><section className="module"><div className="skeleton" /></section></main>;
  const today = <section className="module module--intro" id="heute" aria-labelledby="heute-titel"><p className="module__eyebrow">Persönliches Dashboard · {formatDate(localDate())}</p><h1 className="module__title" id="heute-titel">Heute</h1><p className="module__description">Erfasse deinen Tag Schritt für Schritt. Fehlende Werte bleiben leer und werden nicht automatisch ergänzt.</p><div className="intro-grid"><div className="intro-note"><ShieldCheck size={17} /><span>Deine Daten bleiben auf diesem Gerät.</span></div><div className="intro-note"><Activity size={17} /><span>{activeTrackerCount} aktive Tracker bereit.</span></div></div><div className="day-date-picker"><label className="field"><span className="field__label">Datum des Tages</span><input type="date" value={selectedDate} onChange={(event) => setSelectedDate(event.target.value)} /></label></div><DayForm structure={{
  ...structure,
  kategorien: structure.kategorien.filter(
    (category) =>
      category.name.trim().toLocaleLowerCase('de-DE') !== 'sport',
  ),
}} date={selectedDate} days={days} onSave={saveDay} onReset={resetDay} success={success} /></section>;
  const settings = <><SectionHeader eyebrow="Verwaltung" title="Einstellungen" description="Verwalte Kategorien, Bereiche, Ansichten und globale Tracker. Sichere deine lokalen Daten." icon={Settings} /><div className="settings-intro"><CircleHelp size={16} /><span>Tracker werden nur einmal gespeichert und können in mehreren Ansichten erscheinen. Diätmodus und externe Anbindungen sind für spätere Funktionen vorbereitet.</span></div><div className="verwaltung-aktionen"><button className="button button--primary" type="button" onClick={() => openCreate('kategorie')}><Plus size={15} />Neue Kategorie</button><button className="button" type="button" onClick={() => openCreate('bereich')}><Plus size={15} />Neuer Bereich</button><button className="button" type="button" onClick={() => openCreate('ansicht')}><Plus size={15} />Neue Ansicht</button><button className="button" type="button" onClick={() => openCreate('tracker')}><Plus size={15} />Neuer Tracker</button></div><div className="verwaltungsliste">{[...flattenedItems, ...trackerItems].map((item) => <AdminItem
  item={item}
  structure={structure}
  toggleStatus={toggleStatus}
  openEditTracker={openEditTracker}
  openEditStructureItem={openEditStructureItem}
  openRename={openRename}
  setDeleteTarget={setDeleteTarget}
  cycleCategoryIcon={cycleCategoryIcon}
  moveCategory={moveCategory}
  openMoveArea={openMoveArea}
/>)}</div><section className="backup-panel"><div className="backup-panel__heading"><div><p className="module__eyebrow">Datensicherung</p><h3 className="backup-panel__title">Lokale Daten verwalten</h3></div><FileJson size={22} /></div><p className="backup-warning">Die Daten werden nur auf diesem Gerät und in diesem Browser gespeichert. Regelmäßige JSON-Exporte werden empfohlen.</p><div className="backup-stats"><span><strong>{days.length}</strong> gespeicherte Tage</span><span>Letzte Sicherung: <strong>{formatDateTime(backupInfo.letzteSicherung)}</strong></span><span>Letzter Import: <strong>{formatDateTime(backupInfo.letzterImport)}</strong></span></div><div className="backup-actions"><button className="button button--primary" type="button" onClick={exportData}><Download size={15} />Daten als JSON exportieren</button><JsonFilePicker onFile={(file) => void prepareImport(file)} /><button className="button" type="button" onClick={importChatData} disabled={backupInfo.chatImportiert}><Import size={15} />{backupInfo.chatImportiert ? 'Chatdaten bereits importiert' : 'Bisherige Chatdaten importieren'}</button></div>{importMessage ? <p className="save-success" role="status"><Check size={14} />{importMessage}</p> : null}{importPreview ? <div className="import-preview"><h3>Importvorschau</h3><p>{importPreview.neueTage.length} neue Datensätze · {importPreview.konfliktTage.length} bereits vorhanden</p>{importPreview.konfliktTage.map((date) => <label className="import-conflict" key={date}><span>{formatDate(date)}</span><select value={importDecisions[date]} onChange={(event) => setImportDecisions((current) => ({ ...current, [date]: event.target.value as ImportKonflikt }))}><option value="behalten">Vorhandenen Eintrag behalten</option><option value="uebernehmen">Importierten Eintrag übernehmen</option><option value="zusammenfuehren">Datensätze zusammenführen</option></select></label>)}<div className="modal__actions"><button className="button button--quiet" type="button" onClick={() => setImportPreview(null)}>Import abbrechen</button><button className="button button--primary" type="button" onClick={executeImport}><Check size={14} />Import durchführen</button></div></div> : null}</section></>;

  return <div className="app-shell"><header className="app-header"><div className="app-header__inner"><a className="app-logo" href={runtimeConfig.basePath} aria-label="HollowTrack – Heute öffnen" onClick={(event) => { event.preventDefault(); go('heute'); }}><span className="app-logo__mark">H</span><span>HollowTrack</span></a><p className="app-header__subtitle">Dein persönlicher Überblick</p><div className="app-header__meta"><span className="status-dot" />Lokal gespeichert</div></div></header><nav className="main-navigation" aria-label="Hauptnavigation"><div className="main-navigation__inner">{navigation.map(({ id, label, icon: Icon }) => <a className={`main-navigation__link ${page === id ? 'main-navigation__link--active' : ''}`} href={`${runtimeConfig.basePath.replace(/\/$/, '')}/${id === 'heute' ? '' : id}`} key={id} onClick={(event) => { event.preventDefault(); go(id); }}><Icon size={15} />{label}</a>)}</div></nav><main className="app-main">{page === 'heute' ? today : null}{page === 'tracker' ? <section className="module module--wide"><div className="module__heading"><div><p className="module__eyebrow">Deine Architektur</p><h1 className="module__title">Tracker</h1></div><p className="module__status">{counts.categories} Kategorien · {counts.areas} Bereiche · {counts.views} Ansichten · {counts.trackers} Tracker</p></div><p className="module__description">Kategorien und Bereiche dienen der Übersicht. Tracker sind zentral und können in mehreren Ansichten verwendet werden.</p><div className="tracker-view"><TreeView structure={structure} /></div></section> : null}{page === 'verlauf' ? <section className="module module--wide"><SectionHeader title="Verlauf" description="Gespeicherte Tage, neuester Tag zuerst. Tippe auf einen Tag für die vollständige Ansicht." icon={History} />{sortedDays.length ? <div className="history-list">{sortedDays.map((record) => <button className="history-card" type="button" key={record.id} onClick={() => setDetailRecord(record)}><span className="history-card__date">{formatDate(record.datum)}</span><strong>{summaryFor(record, structure)}</strong><span className="history-card__hint">Vollständigen Tag öffnen</span></button>)}</div> : <EmptyState text="Noch keine Verlaufsdaten vorhanden." icon={Clock3} />}</section> : null}{page === 'statistik' ? (
          <section className="module module--wide">
            <SectionHeader
              eyebrow="Auswertung"
              title="Statistik"
              description="Entwicklungen und Muster deiner Tagebucheinträge nach Kategorien und Trackern."
              icon={BarChart3}
            />

            <StatisticsView
              structure={structure}
              days={days}
            />
          </section>
        ) : page === 'sport' ? (
  <section className="module">
    <SectionHeader
      eyebrow="Training"
      title="Sport"
      description="Trainingsart, Trainingsstufe und deine Übungs-Tracker erfassen."
      icon={Dumbbell}
    />
    <SportView
  structure={structure}
  date={selectedDate}
  initialValues={(() => {
                const currentValues = Object.fromEntries(
                  Object.entries(
                    days.find((item) => item.datum === selectedDate)?.messwerte ?? {},
                  ).filter(
                    (entry): entry is [string, string | number] =>
                      typeof entry[1] === 'string' ||
                      typeof entry[1] === 'number',
                  ),
                );

                const previousWeights: Record<string, string | number> = {};

                [...days]
                  .filter((item) => item.datum < selectedDate)
                  .sort((first, second) =>
                    second.datum.localeCompare(first.datum),
                  )
                  .forEach((item) => {
                    Object.entries(item.messwerte ?? {}).forEach(
                      ([key, value]) => {
                        if (
                          key.endsWith('::gewicht') &&
                          previousWeights[key] === undefined &&
                          (typeof value === 'string' ||
                            typeof value === 'number')
                        ) {
                          previousWeights[key] = value;
                        }
                      },
                    );
                  });

                return {
                  ...previousWeights,
                  ...currentValues,
                };
              })()}
              previousValues={(() => {
                const result: Record<string, string | number> = {};
                const handledTrackerIds = new Set<string>();

                [...days]
                  .filter((item) => item.datum < selectedDate)
                  .sort((first, second) =>
                    second.datum.localeCompare(first.datum),
                  )
                  .forEach((item) => {
                    const messwerte = item.messwerte ?? {};
                    const keys = Object.keys(messwerte);

                    keys.forEach((key) => {
                      const match = key.match(
                        /^(.*)::(?:gewicht|satz-\d+)$/,
                      );

                      const trackerId = match?.[1];

                      if (!trackerId || handledTrackerIds.has(trackerId)) {
                        return;
                      }

                      const hasTrainingValue =
                        keys.some((candidate) =>
                          candidate.startsWith(`${trackerId}::satz-`),
                        ) ||
                        Object.prototype.hasOwnProperty.call(
                          messwerte,
                          trackerId,
                        );

                      if (!hasTrainingValue) {
                        return;
                      }

                      Object.entries(messwerte).forEach(
                        ([candidate, value]) => {
                          if (
                            (candidate === trackerId ||
                              candidate.startsWith(`${trackerId}::`)) &&
                            (typeof value === 'string' ||
                              typeof value === 'number')
                          ) {
                            result[candidate] = value;
                          }
                        },
                      );

                      handledTrackerIds.add(trackerId);
                    });
                  });

                return result;
              })()}

                previousStagnationCounts={(() => {
        const histories = new Map<
          string,
          { value: number; weight: number | undefined }[]
        >();

        [...days]
          .filter((item) => item.datum < selectedDate)
          .sort((first, second) =>
            second.datum.localeCompare(first.datum),
          )
          .forEach((item) => {
            const messwerte = item.messwerte ?? {};

            Object.entries(messwerte).forEach(([key, value]) => {
              if (!/::satz-\d+$/.test(key)) return;

              const numeric = Number(value);
              if (!Number.isFinite(numeric)) return;

              const trackerId = key.replace(/::satz-\d+$/, "");
              const rawWeight = messwerte[`${trackerId}::gewicht`];
              const parsedWeight = Number(rawWeight);
              const weight =
                rawWeight !== undefined &&
                rawWeight !== "" &&
                Number.isFinite(parsedWeight)
                  ? parsedWeight
                  : undefined;

              const history = histories.get(key) ?? [];
              history.push({ value: numeric, weight });
              histories.set(key, history);
            });
          });

        const result: Record<string, number> = {};

        histories.forEach((history, key) => {
          let stagnationCount = 0;

          for (let index = 1; index < history.length; index += 1) {
            if (history[index].weight !== history[index - 1].weight) break;
            if (history[index].value !== history[index - 1].value) break;
            stagnationCount += 1;
          }

          result[key] = stagnationCount;
        });

        return result;
      })()}
      initialLevel={(() => {
    const savedLevel = days.find(
      (item) => item.datum === selectedDate,
    )?.ereignisse['sport-trainingsstufe'];

    return savedLevel === '1' ||
      savedLevel === '2' ||
      savedLevel === '3'
      ? (Number(savedLevel) as 1 | 2 | 3)
      : 2;
  })()}
  initialTrainingsart={String(

    days.find((item) => item.datum === selectedDate)?.ereignisse?.[

      'sport-trainingsart'

    ] ?? '',

  )}

  onSave={saveSport}
/>
  </section>
) : page === 'ernaehrung' ? (
  <section className="module">
    <SectionHeader
      eyebrow="Ernährung"
      title="Ernährung"
      description="Ernährungswerte deiner gespeicherten Tage werden über zentrale Tracker erfasst."
      icon={Utensils}
    />
    <EmptyState
      text="Nutze „Heute“, um Ernährung zu erfassen."
      icon={Leaf}
    />
  </section>
) : page === 'einstellungen' ? <section className="module module--wide">{settingsView === 'root' ? <><SectionHeader eyebrow="Einstellungen" title="Einstellungen" description="Allgemeine Einstellungen und Verwaltung von HollowTrack." icon={Settings} /><div className="settings-overview__actions"><button className="button button--primary settings-overview__button" type="button" onClick={() => setSettingsView('today')}>Heute einstellen</button><button className="button settings-overview__button" type="button" onClick={() => setSettingsView('sport')}>Sport-Einstellungen</button><button className="button settings-overview__button" type="button" onClick={() => setSettingsView('ernaehrung')}>Ernährungseinstellungen</button></div><div className="settings-root-backup">{settings}</div></> : <><div className="verwaltung-aktionen"><button className="button" type="button" onClick={() => setSettingsView('root')}>← Zurück zu Einstellungen</button></div><div className="settings-today-content"><TodaySettingsTree
  categoryPurpose={settingsView === 'today' ? 'heute' : settingsView}
                  structure={structure}
  onEditCategory={(category) =>
              openEditStructureItem({
                ...category,
                type: 'kategorie',
              })
            }
  onCycleCategoryIcon={(category) => cycleCategoryIcon(category.id)}
  onMoveCategory={(category, direction) =>
    moveCategory(category.id, direction)
  }
  onToggleCategory={(category) =>
    toggleStatus('kategorie', category.id)
  }
  onDeleteCategory={(category) =>
    setDeleteTarget({
      type: 'kategorie',
      id: category.id,
      name: category.name,
    })
  }
  onEditArea={(area) => {
    setModalName(area.name);
    setModal({ mode: 'rename', type: 'bereich', id: area.id });
  }}
  onMoveArea={(area) => openMoveArea(area.id)}
                onSortArea={(category, area, direction) =>
                  setStructure((current) => {
                    const next = clone(current);
                    const targetCategory = next.kategorien.find(
                      (item) => item.id === category.id,
                    );

                    if (!targetCategory) return current;

                    const orderedIds = [...targetCategory.bereichIds].sort(
                      (firstId, secondId) => {
                        const first = next.bereiche.find(
                          (item) => item.id === firstId,
                        );
                        const second = next.bereiche.find(
                          (item) => item.id === secondId,
                        );

                        return (
                          (first?.position ?? 0) -
                          (second?.position ?? 0)
                        );
                      },
                    );

                    const currentIndex = orderedIds.indexOf(area.id);
                    const targetIndex = currentIndex + direction;

                    if (
                      currentIndex < 0 ||
                      targetIndex < 0 ||
                      targetIndex >= orderedIds.length
                    ) {
                      return current;
                    }

                    [
                      orderedIds[currentIndex],
                      orderedIds[targetIndex],
                    ] = [
                      orderedIds[targetIndex],
                      orderedIds[currentIndex],
                    ];

                    targetCategory.bereichIds = orderedIds;

                    orderedIds.forEach((areaId, position) => {
                      const targetArea = next.bereiche.find(
                        (item) => item.id === areaId,
                      );

                      if (targetArea) targetArea.position = position;
                    });

                    return next;
                  })
                }
  onToggleArea={(area) => toggleStatus('bereich', area.id)}
  onDeleteArea={(area) =>
    setDeleteTarget({
      type: 'bereich',
      id: area.id,
      name: area.name,
    })
  }
  onEditTracker={openEditTracker}
                onSortTracker={(area, tracker, direction) =>
                  setStructure((current) => {
                    const next = clone(current);

                    const trackerIds = new Set(
                      area.ansichtIds.flatMap((viewId) => {
                        const view = next.ansichten.find(
                          (item) => item.id === viewId,
                        );

                        return view?.trackerIds ?? [];
                      }),
                    );

                    const orderedTrackers = next.tracker
                      .filter((item) => trackerIds.has(item.id))
                      .sort(
                        (first, second) =>
                          first.position - second.position,
                      );

                    const currentIndex = orderedTrackers.findIndex(
                      (item) => item.id === tracker.id,
                    );
                    const targetIndex = currentIndex + direction;

                    if (
                      currentIndex < 0 ||
                      targetIndex < 0 ||
                      targetIndex >= orderedTrackers.length
                    ) {
                      return current;
                    }

                    [
                      orderedTrackers[currentIndex],
                      orderedTrackers[targetIndex],
                    ] = [
                      orderedTrackers[targetIndex],
                      orderedTrackers[currentIndex],
                    ];

                    orderedTrackers.forEach((item, position) => {
                      item.position = position;
                    });

                    return next;
                  })
                }
  onToggleTracker={(tracker) =>
    toggleStatus('tracker', tracker.id)
  }
  onDeleteTracker={(tracker) =>
    setDeleteTarget({
      type: 'tracker',
      id: tracker.id,
      name: tracker.name,
    })
  }
  onCreateCategory={() => openCreate('kategorie')}
  onCreateArea={(category) => {
    setModalName('');
    setParentId(category.id);
    setModal({ mode: 'create', type: 'bereich' });
  }}
  onCreateTracker={(area) => {
    const viewId = area.ansichtIds[0];

    if (!viewId) {
      showSuccess('Dieser Bereich hat noch keine Ansicht.');
      return;
    }

    setModalName('');
    setParentId(viewId);
    setInputType('Text');
    setDataType('Messwert');
    setErfassungsart('einzelwert');
    setModal({ mode: 'create', type: 'tracker' });
  }}
/></div></>}</section> : null}</main><footer className="app-footer"><p>HollowTrack · persönlich, lokal, übersichtlich</p></footer>{modal ? <Modal modal={modal} structure={structure} name={modalName} parentId={parentId} inputType={inputType} dataType={dataType} trackerTyp={trackerTyp} erfassungsart={erfassungsart} gewichtAktiv={gewichtAktiv} trainingsgewicht={trainingsgewicht} selbsteinschaetzungAktiv={selbsteinschaetzungAktiv} selbsteinschaetzungName={selbsteinschaetzungName} setName={setModalName} setParentId={setParentId} setInputType={setInputType} setDataType={setDataType} setTrackerTyp={setTrackerTyp} setErfassungsart={setErfassungsart} setGewichtAktiv={setGewichtAktiv} setTrainingsgewicht={setTrainingsgewicht} setSelbsteinschaetzungAktiv={setSelbsteinschaetzungAktiv} setSelbsteinschaetzungName={setSelbsteinschaetzungName} onClose={() => setModal(null)} onSubmit={submitModal} /> : null}{deleteTarget ? <DeleteModal name={deleteTarget.name} onClose={() => setDeleteTarget(null)} onConfirm={confirmDelete} /> : null}{detailRecord ? <DayDetail record={detailRecord} structure={structure} onClose={() => setDetailRecord(null)} onEdit={(section) => {
          selectHistoryDay(detailRecord);
          go(section);
        }} onDelete={() => deleteHistoryDay(detailRecord)} /> : null}</div>;
}

function App() { return <QueryClientProvider client={queryClient}><TooltipProvider><WebAppRouter home={Home} /><Toaster /></TooltipProvider></QueryClientProvider>; }
export default App;
