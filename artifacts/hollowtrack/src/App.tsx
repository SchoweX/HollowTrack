import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Activity, CalendarDays, Check, ChevronDown, CircleHelp, CircleOff, Clock3, Dumbbell, Folder, FolderOpen, HeartPulse, History, Leaf, Moon, Pencil, Plus, Settings, ShieldCheck, Trash2, Utensils, X } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Route, Switch, Router as WouterRouter } from 'wouter';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';

type Tracker = {
  id: string;
  name: string;
  aktiv: boolean;
  position: number;
  typ: string;
};

type Unterordner = {
  id: string;
  name: string;
  aktiv: boolean;
  position: number;
  tracker: Tracker[];
};

type Oberordner = {
  id: string;
  name: string;
  aktiv: boolean;
  position: number;
  unterordner: Unterordner[];
};

type Struktur = {
  oberordner: Oberordner[];
};

type ElementTyp = 'oberordner' | 'unterordner' | 'tracker';
type ModalState =
  | { mode: 'create'; type: ElementTyp }
  | { mode: 'rename'; type: ElementTyp; id: string }
  | null;

type NavItem = {
  id: string;
  label: string;
  icon: LucideIcon;
};

const STORAGE_KEY = 'hollowtrack-tracker-struktur';

const navigation: NavItem[] = [
  { id: 'heute', label: 'Heute', icon: CalendarDays },
  { id: 'tracker', label: 'Tracker', icon: Activity },
  { id: 'verlauf', label: 'Verlauf', icon: History },
  { id: 'ernaehrung', label: 'Ernährung', icon: Utensils },
  { id: 'training', label: 'Training', icon: Dumbbell },
  { id: 'schlaf', label: 'Schlaf', icon: Moon },
  { id: 'einstellungen', label: 'Einstellungen', icon: Settings },
];

const initialStructure: Struktur = {
  oberordner: [
    {
      id: 'oberordner-koerper-gesundheit',
      name: 'Körper & Gesundheit',
      aktiv: true,
      position: 1,
      unterordner: [
        { id: 'unterordner-schlaf', name: 'Schlaf', aktiv: true, position: 1, tracker: [] },
        { id: 'unterordner-wohlbefinden', name: 'Wohlbefinden', aktiv: true, position: 2, tracker: [] },
        { id: 'unterordner-training', name: 'Training & Aktivität', aktiv: true, position: 3, tracker: [] },
        { id: 'unterordner-ernaehrung', name: 'Ernährung', aktiv: true, position: 4, tracker: [] },
        { id: 'unterordner-hunger', name: 'Hunger & Sättigung', aktiv: true, position: 5, tracker: [] },
        { id: 'unterordner-koerperwerte', name: 'Körperwerte', aktiv: true, position: 6, tracker: [] },
      ],
    },
    {
      id: 'oberordner-garten',
      name: 'Garten',
      aktiv: true,
      position: 2,
      unterordner: [
        { id: 'unterordner-wetter', name: 'Wetter & Umwelt', aktiv: true, position: 1, tracker: [] },
        { id: 'unterordner-pflanzen', name: 'Pflanzen', aktiv: true, position: 2, tracker: [] },
        { id: 'unterordner-pflege', name: 'Pflege', aktiv: true, position: 3, tracker: [] },
        { id: 'unterordner-arbeiten', name: 'Arbeiten & Kosten', aktiv: true, position: 4, tracker: [] },
      ],
    },
  ],
};

function cloneStructure(structure: Struktur): Struktur {
  return JSON.parse(JSON.stringify(structure)) as Struktur;
}

function newId(prefix: string): string {
  return `hollowtrack-${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function sorted<T extends { position: number }>(items: T[]): T[] {
  return [...items].sort((a, b) => a.position - b.position);
}

function loadStructure(): Struktur {
  if (typeof window === 'undefined') {
    return cloneStructure(initialStructure);
  }

  const saved = window.localStorage.getItem(STORAGE_KEY);
  if (!saved) {
    return cloneStructure(initialStructure);
  }

  try {
    const parsed = JSON.parse(saved) as Struktur;
    return parsed && Array.isArray(parsed.oberordner) ? parsed : cloneStructure(initialStructure);
  } catch {
    return cloneStructure(initialStructure);
  }
}

function EmptyState({ title, text, icon: Icon = CircleHelp }: { title?: string; text: string; icon?: LucideIcon }) {
  return (
    <div className="empty-state" data-testid={`empty-state-${text.slice(0, 8).toLowerCase()}`}>
      <Icon size={21} strokeWidth={1.7} />
      {title ? <h3 className="empty-state__title">{title}</h3> : null}
      <p className="empty-state__text">{text}</p>
    </div>
  );
}

function TreeView({ structure }: { structure: Struktur }) {
  const folders = sorted(structure.oberordner);

  if (!folders.length) {
    return <p className="tracker-leer" data-testid="text-no-top-folders">Noch keine Oberordner vorhanden.</p>;
  }

  return (
    <>
      {folders.map((folder) => (
        <section className={`tracker-oberordner ${folder.aktiv ? '' : 'element--deaktiviert'}`} key={folder.id} data-testid={`card-top-folder-${folder.id}`}>
          <details open>
            <summary className="tracker-oberordner__kopf">
              <span className="tracker-oberordner__kopf-content">
                <FolderOpen size={16} />
                <span className="tracker-oberordner__titel">{folder.name}</span>
              </span>
            </summary>
            <div className="tracker-oberordner__inhalt">
              {sorted(folder.unterordner || []).length ? sorted(folder.unterordner || []).map((subfolder) => (
                <details className={`tracker-unterordner ${subfolder.aktiv ? '' : 'element--deaktiviert'}`} open key={subfolder.id} data-testid={`card-sub-folder-${subfolder.id}`}>
                  <summary className="tracker-unterordner__kopf">
                    <span className="tracker-unterordner__kopf-content">
                      <Folder size={15} />
                      <span className="tracker-unterordner__titel">{subfolder.name}</span>
                    </span>
                  </summary>
                  <div className="tracker-unterordner__inhalt">
                    {sorted(subfolder.tracker || []).length ? sorted(subfolder.tracker || []).map((tracker) => (
                      <div className={`tracker-eintrag ${tracker.aktiv ? '' : 'element--deaktiviert'}`} key={tracker.id} data-testid={`row-tracker-${tracker.id}`}>
                        <span className="tracker-eintrag__name">{tracker.name}</span>
                      </div>
                    )) : <p className="tracker-leer">Noch keine Tracker vorhanden.</p>}
                  </div>
                </details>
              )) : <p className="tracker-leer">Noch keine Unterordner vorhanden.</p>}
            </div>
          </details>
        </section>
      ))}
    </>
  );
}

function SectionHeader({ eyebrow, title, description, icon: Icon }: { eyebrow?: string; title: string; description: string; icon?: LucideIcon }) {
  return (
    <>
      {Icon ? <div className="section-icon" aria-hidden="true"><Icon size={17} /></div> : null}
      {eyebrow ? <p className="module__eyebrow">{eyebrow}</p> : null}
      <h2 className="module__title">{title}</h2>
      <p className="module__description">{description}</p>
    </>
  );
}

function Modal({
  modal,
  structure,
  name,
  parentId,
  setName,
  setParentId,
  onClose,
  onSubmit,
}: {
  modal: Exclude<ModalState, null>;
  structure: Struktur;
  name: string;
  parentId: string;
  setName: (value: string) => void;
  setParentId: (value: string) => void;
  onClose: () => void;
  onSubmit: () => void;
}) {
  const isRename = modal.mode === 'rename';
  const title = isRename
    ? 'Element umbenennen'
    : modal.type === 'oberordner' ? 'Oberordner anlegen' : modal.type === 'unterordner' ? 'Unterordner anlegen' : 'Tracker anlegen';
  const eligibleFolders = structure.oberordner.filter((item) => item.aktiv);
  const eligibleSubfolders = eligibleFolders.flatMap((folder) => sorted(folder.unterordner || []).filter((item) => item.aktiv).map((item) => ({ ...item, parentName: folder.name })));
  const noParent = !isRename && ((modal.type === 'unterordner' && !eligibleFolders.length) || (modal.type === 'tracker' && !eligibleSubfolders.length));

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section className="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title" data-testid="dialog-element-form">
        <div className="modal__header">
          <div>
            <h2 className="modal__title" id="modal-title">{title}</h2>
            <p className="modal__description">{isRename ? 'Der Name wird überall in deiner Struktur aktualisiert.' : 'Änderungen werden direkt auf diesem Gerät gespeichert.'}</p>
          </div>
          <button className="icon-button" type="button" onClick={onClose} aria-label="Dialog schließen" data-testid="button-close-dialog"><X size={17} /></button>
        </div>
        <form className="modal__form" onSubmit={(event) => { event.preventDefault(); onSubmit(); }}>
          <label className="field">
            <span className="field__label">Name</span>
            <input autoFocus value={name} onChange={(event) => setName(event.target.value)} placeholder="Zum Beispiel Morgenroutine" data-testid="input-element-name" />
          </label>
          {!isRename && modal.type === 'unterordner' ? (
            <label className="field">
              <span className="field__label">Oberordner</span>
              <select value={parentId} onChange={(event) => setParentId(event.target.value)} data-testid="select-parent-folder">
                {eligibleFolders.map((folder) => <option value={folder.id} key={folder.id}>{folder.name}</option>)}
              </select>
              {!eligibleFolders.length ? <span className="field__hint">Lege zuerst einen aktiven Oberordner an.</span> : null}
            </label>
          ) : null}
          {!isRename && modal.type === 'tracker' ? (
            <label className="field">
              <span className="field__label">Unterordner</span>
              <select value={parentId} onChange={(event) => setParentId(event.target.value)} data-testid="select-parent-subfolder">
                {eligibleSubfolders.map((folder) => <option value={folder.id} key={folder.id}>{folder.name} · {folder.parentName}</option>)}
              </select>
              {!eligibleSubfolders.length ? <span className="field__hint">Lege zuerst einen aktiven Unterordner an.</span> : null}
            </label>
          ) : null}
          <div className="modal__actions">
            <button className="button button--quiet" type="button" onClick={onClose} data-testid="button-cancel-dialog">Abbrechen</button>
            <button className="button button--primary" type="submit" disabled={noParent || !name.trim()} data-testid="button-save-element"><Check size={15} />Speichern</button>
          </div>
        </form>
      </section>
    </div>
  );
}

function DeleteModal({ name, onClose, onConfirm }: { name: string; onClose: () => void; onConfirm: () => void }) {
  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section className="modal modal--confirm" role="dialog" aria-modal="true" aria-labelledby="delete-title" data-testid="dialog-delete-confirm">
        <div className="modal__header">
          <div>
            <h2 className="modal__title" id="delete-title">Element löschen?</h2>
            <p className="modal__description">„{name}“ und alle darunterliegenden Elemente werden dauerhaft aus dieser lokalen Struktur entfernt.</p>
          </div>
          <button className="icon-button" type="button" onClick={onClose} aria-label="Dialog schließen" data-testid="button-close-delete-dialog"><X size={17} /></button>
        </div>
        <div className="modal__actions">
          <button className="button button--quiet" type="button" onClick={onClose} data-testid="button-cancel-delete">Abbrechen</button>
          <button className="button button--danger" type="button" onClick={onConfirm} data-testid="button-confirm-delete"><Trash2 size={15} />Löschen</button>
        </div>
      </section>
    </div>
  );
}

function Home() {
  const [structure, setStructure] = useState<Struktur>(loadStructure);
  const [ready, setReady] = useState(false);
  const [activeSection, setActiveSection] = useState('heute');
  const [modal, setModal] = useState<ModalState>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ type: ElementTyp; id: string; name: string } | null>(null);
  const [modalName, setModalName] = useState('');
  const [parentId, setParentId] = useState('');

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(structure));
    setReady(true);
  }, [structure]);

  useEffect(() => {
    document.title = 'HollowTrack – Dein persönlicher Überblick';
    const sections = navigation.map((item) => document.getElementById(item.id)).filter(Boolean) as HTMLElement[];
    const observer = new IntersectionObserver((entries) => {
      const visible = entries.filter((entry) => entry.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (visible) setActiveSection(visible.target.id);
    }, { rootMargin: '-20% 0px -62% 0px', threshold: [0.05, 0.2, 0.5] });
    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, []);

  const counts = useMemo(() => {
    const folders = structure.oberordner.reduce((total, folder) => total + folder.unterordner.length, 0);
    const trackers = structure.oberordner.reduce((total, folder) => total + folder.unterordner.reduce((subtotal, subfolder) => subtotal + subfolder.tracker.length, 0), 0);
    return { top: structure.oberordner.length, folders, trackers };
  }, [structure]);

  const openCreate = (type: ElementTyp) => {
    const firstTop = structure.oberordner.find((item) => item.aktiv);
    const firstSub = firstTop?.unterordner.find((item) => item.aktiv);
    setModalName('');
    setParentId(type === 'unterordner' ? firstTop?.id || '' : type === 'tracker' ? firstSub?.id || '' : '');
    setModal({ mode: 'create', type });
  };

  const openRename = (type: ElementTyp, id: string, name: string) => {
    setModalName(name);
    setParentId('');
    setModal({ mode: 'rename', type, id });
  };

  const submitModal = () => {
    const value = modalName.trim();
    if (!modal || !value) return;
    setStructure((current) => {
      const next = cloneStructure(current);
      if (modal.mode === 'rename') {
        if (modal.type === 'oberordner') next.oberordner.find((item) => item.id === modal.id)!.name = value;
        if (modal.type === 'unterordner') next.oberordner.flatMap((item) => item.unterordner).find((item) => item.id === modal.id)!.name = value;
        if (modal.type === 'tracker') next.oberordner.flatMap((item) => item.unterordner).flatMap((item) => item.tracker).find((item) => item.id === modal.id)!.name = value;
      } else if (modal.type === 'oberordner') {
        next.oberordner.push({ id: newId('oberordner'), name: value, aktiv: true, position: next.oberordner.length + 1, unterordner: [] });
      } else if (modal.type === 'unterordner') {
        const parent = next.oberordner.find((item) => item.id === parentId);
        if (parent) parent.unterordner.push({ id: newId('unterordner'), name: value, aktiv: true, position: parent.unterordner.length + 1, tracker: [] });
      } else {
        const parent = next.oberordner.flatMap((item) => item.unterordner).find((item) => item.id === parentId);
        if (parent) parent.tracker.push({ id: newId('tracker'), name: value, aktiv: true, position: parent.tracker.length + 1, typ: 'Text' });
      }
      return next;
    });
    setModal(null);
  };

  const toggleStatus = (type: ElementTyp, id: string) => {
    setStructure((current) => {
      const next = cloneStructure(current);
      const item = type === 'oberordner'
        ? next.oberordner.find((element) => element.id === id)
        : type === 'unterordner'
          ? next.oberordner.flatMap((element) => element.unterordner).find((element) => element.id === id)
          : next.oberordner.flatMap((element) => element.unterordner).flatMap((element) => element.tracker).find((element) => element.id === id);
      if (item) item.aktiv = !item.aktiv;
      return next;
    });
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;
    setStructure((current) => {
      const next = cloneStructure(current);
      if (deleteTarget.type === 'oberordner') next.oberordner = next.oberordner.filter((item) => item.id !== deleteTarget.id);
      if (deleteTarget.type === 'unterordner') next.oberordner.forEach((folder) => { folder.unterordner = folder.unterordner.filter((item) => item.id !== deleteTarget.id); });
      if (deleteTarget.type === 'tracker') next.oberordner.forEach((folder) => folder.unterordner.forEach((subfolder) => { subfolder.tracker = subfolder.tracker.filter((item) => item.id !== deleteTarget.id); }));
      return next;
    });
    setDeleteTarget(null);
  };

  const flattenedItems = useMemo(() => structure.oberordner.flatMap((folder) => [
    { type: 'oberordner' as ElementTyp, id: folder.id, name: folder.name, active: folder.aktiv, label: 'Oberordner', className: '' },
    ...sorted(folder.unterordner || []).flatMap((subfolder) => [
      { type: 'unterordner' as ElementTyp, id: subfolder.id, name: subfolder.name, active: subfolder.aktiv, label: `Unterordner in „${folder.name}“`, className: 'verwaltungseintrag--unterordner' },
      ...sorted(subfolder.tracker || []).map((tracker) => ({ type: 'tracker' as ElementTyp, id: tracker.id, name: tracker.name, active: tracker.aktiv, label: `Tracker in „${subfolder.name}“`, className: 'verwaltungseintrag--tracker' })),
    ]),
  ]), [structure]);

  if (!ready) {
    return <main className="app-main"><section className="module"><div className="skeleton" /></section><section className="module"><div className="skeleton" /></section></main>;
  }

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="app-header__inner">
          <a className="app-logo" href="#heute" aria-label="HollowTrack – Heute öffnen" data-testid="link-logo">
            <span className="app-logo__mark" aria-hidden="true">H</span>
            <span>HollowTrack</span>
          </a>
          <p className="app-header__subtitle">Dein persönlicher Überblick</p>
          <div className="app-header__meta"><span className="status-dot" />Lokal gespeichert</div>
        </div>
      </header>

      <nav className="main-navigation" aria-label="Hauptnavigation">
        <div className="main-navigation__inner">
          {navigation.map(({ id, label, icon: Icon }) => (
            <a className={`main-navigation__link ${activeSection === id ? 'main-navigation__link--active' : ''}`} href={`#${id}`} key={id} onClick={() => setActiveSection(id)} data-testid={`link-nav-${id}`}>
              <Icon size={15} />{label}
            </a>
          ))}
        </div>
      </nav>

      <main className="app-main">
        <section className="module module--intro" id="heute" aria-labelledby="heute-titel">
          <p className="module__eyebrow">Persönliches Dashboard · {new Intl.DateTimeFormat('de-DE', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date())}</p>
          <h1 className="module__title" id="heute-titel">Heute</h1>
          <p className="module__description">Ein ruhiger Ort für deine tägliche Übersicht. Messwerte kommen erst dazu, wenn du sie selbst anlegst.</p>
          <div className="intro-grid">
            <div className="intro-note"><ShieldCheck size={17} /><span>Deine Struktur bleibt auf diesem Gerät.</span></div>
            <div className="intro-note"><Activity size={17} /><span>{counts.trackers} {counts.trackers === 1 ? 'Tracker' : 'Tracker'} bereit für deine Einträge.</span></div>
          </div>
          <EmptyState title="Noch keine Einträge" text="Dieser Bereich ist für deine täglichen Angaben vorbereitet." icon={CalendarDays} />
        </section>

        <section className="module module--wide" id="tracker" aria-labelledby="tracker-titel">
          <div className="module__heading">
            <div>
              <p className="module__eyebrow">Deine Struktur</p>
              <h2 className="module__title" id="tracker-titel">Tracker</h2>
            </div>
            <p className="module__status" data-testid="status-tracker-count">{counts.top} Oberordner · {counts.folders} Unterordner</p>
          </div>
          <p className="module__description">Ordne deine persönlichen Bereiche in einer klaren Hierarchie. Noch sind keine Messwerte hinterlegt.</p>
          <div className="tracker-view" id="tracker-view" aria-live="polite"><TreeView structure={structure} /></div>
        </section>

        <section className="module" id="verlauf" aria-labelledby="verlauf-titel">
          <SectionHeader title="Verlauf" description="Bisher gibt es noch keine Einträge oder Entwicklungen zum Anzeigen." icon={History} />
          <EmptyState text="Noch keine Verlaufsdaten vorhanden." icon={Clock3} />
        </section>
        <section className="module" id="ernaehrung" aria-labelledby="ernaehrung-titel">
          <SectionHeader title="Ernährung" description="Deine Ernährungsübersicht findet hier später ihren Platz." icon={Utensils} />
          <EmptyState text="Der Bereich ist noch leer." icon={Leaf} />
        </section>
        <section className="module" id="training" aria-labelledby="training-titel">
          <SectionHeader title="Training" description="Plane hier später deine Trainingsübersicht und Aktivitäten." icon={Dumbbell} />
          <EmptyState text="Der Bereich ist noch leer." icon={Activity} />
        </section>
        <section className="module" id="schlaf" aria-labelledby="schlaf-titel">
          <SectionHeader title="Schlaf" description="Dieser Bereich ist für deine persönliche Schlafübersicht vorbereitet." icon={Moon} />
          <EmptyState text="Der Bereich ist noch leer." icon={Moon} />
        </section>

        <section className="module module--wide" id="einstellungen" aria-labelledby="einstellungen-titel">
          <SectionHeader eyebrow="Verwaltung" title="Einstellungen" description="Verwalte hier die Hierarchie deiner Tracker. Alle Änderungen werden zunächst nur auf diesem Gerät gespeichert." icon={Settings} />
          <div className="settings-intro"><CircleHelp size={16} /><span>Oberordner bilden die erste Ebene. Darunter liegen Unterordner und anschließend deine Tracker. Deaktivierte Elemente bleiben erhalten, erscheinen aber zurückhaltend.</span></div>
          <div className="verwaltung-aktionen" aria-label="Neue Elemente erstellen">
            <button className="button button--primary" type="button" onClick={() => openCreate('oberordner')} data-testid="button-create-top-folder"><Plus size={15} />Neuer Oberordner</button>
            <button className="button" type="button" onClick={() => openCreate('unterordner')} data-testid="button-create-sub-folder"><Plus size={15} />Neuer Unterordner</button>
            <button className="button" type="button" onClick={() => openCreate('tracker')} data-testid="button-create-tracker"><Plus size={15} />Neuer Tracker</button>
          </div>
          <div className="verwaltungsliste" id="verwaltungsliste">
            {flattenedItems.length ? flattenedItems.map((item) => (
              <article className={`verwaltungseintrag ${item.className} ${item.active ? '' : 'element--deaktiviert'}`} key={item.id} data-testid={`row-management-${item.id}`}>
                <div className="verwaltungseintrag__kopf">
                  <div>
                    <h3 className="verwaltungseintrag__titel">{item.name}</h3>
                    <span className="verwaltungseintrag__typ">{item.active ? item.label : `${item.label} · deaktiviert`}</span>
                  </div>
                </div>
                <div className="verwaltungseintrag__aktionen">
                  <button className="aktions-button" type="button" onClick={() => toggleStatus(item.type, item.id)} data-testid={`button-toggle-${item.id}`}>{item.active ? <CircleOff size={14} /> : <Check size={14} />}{item.active ? 'Deaktivieren' : 'Aktivieren'}</button>
                  <button className="aktions-button" type="button" onClick={() => openRename(item.type, item.id, item.name)} data-testid={`button-rename-${item.id}`}><Pencil size={14} />Umbenennen</button>
                  <button className="aktions-button aktions-button--loeschen" type="button" onClick={() => setDeleteTarget({ type: item.type, id: item.id, name: item.name })} data-testid={`button-delete-${item.id}`}><Trash2 size={14} />Löschen</button>
                </div>
              </article>
            )) : <p className="verwaltung-leer">Noch keine Elemente vorhanden. Lege deinen ersten Oberordner an.</p>}
          </div>
        </section>
      </main>

      <footer className="app-footer"><p>HollowTrack · persönlich, lokal, übersichtlich</p></footer>

      {modal ? <Modal modal={modal} structure={structure} name={modalName} parentId={parentId} setName={setModalName} setParentId={setParentId} onClose={() => setModal(null)} onSubmit={submitModal} /> : null}
      {deleteTarget ? <DeleteModal name={deleteTarget.name} onClose={() => setDeleteTarget(null)} onConfirm={confirmDelete} /> : null}
    </div>
  );
}

function NotFound() {
  return <main className="app-main"><section className="module"><p className="module__eyebrow">HollowTrack</p><h1 className="module__title">Diese Seite gibt es nicht.</h1><p className="module__description">Kehre zur Startseite zurück, um deine Tracker-Struktur zu öffnen.</p><a className="button button--primary" href="/">Zur Startseite</a></section></main>;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route component={NotFound} />
    </Switch>
  );
}

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;