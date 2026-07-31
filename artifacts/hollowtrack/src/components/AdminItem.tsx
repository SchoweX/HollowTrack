import { useState } from 'react';
import { Check, CircleOff, Pencil, Trash2 } from 'lucide-react';
import { categoryIcon } from '../categoryIcons';

type AdminItemProps = {
  item: any;
  structure: any;
  toggleStatus: (type: any, id: string) => void;
  openEditTracker: (tracker: any) => void;
  openRename: (type: any, id: string, name: string) => void;
  setDeleteTarget: (target: any) => void;
};

export function AdminItem({
  item,
  structure,
  toggleStatus,
  openEditTracker,
  openRename,
  setDeleteTarget,
}: AdminItemProps) {
  const [open, setOpen] = useState(false);

  return (
    <article className={`verwaltungseintrag verwaltungseintrag--${item.type} ${item.className} ${item.active ? '' : 'element--deaktiviert'}`} key={`${item.type}-${item.id}`}><div
  className="verwaltungseintrag__kopf"
  onClick={() => setOpen((value) => !value)}
><div><h3 className="verwaltungseintrag__titel">{item.type === 'kategorie' ? (() => { const Icon = categoryIcon(structure.kategorien.find((category) => category.id === item.id)?.icon || 'FolderOpen'); return <Icon size={16} />; })() : null}{item.name}</h3><span className="verwaltungseintrag__typ">{item.active ? item.label : `${item.label} · deaktiviert`}</span></div></div>{open ? <div className="verwaltungseintrag__aktionen"><button className="aktions-button" type="button" onClick={() => toggleStatus(item.type, item.id)}>{item.active ? <CircleOff size={14} /> : <Check size={14} />}{item.active ? 'Deaktivieren' : 'Aktivieren'}</button>{item.type === 'tracker' ? <button className="aktions-button" type="button" onClick={() => openEditTracker(structure.tracker.find((trackerItem) => trackerItem.id === item.id)!)}><Pencil size={14} />Bearbeiten</button> : <button className="aktions-button" type="button" onClick={() => openRename(item.type, item.id, item.name)}><Pencil size={14} />Umbenennen</button>}<button className="aktions-button aktions-button--loeschen" type="button" onClick={() => setDeleteTarget({ type: item.type, id: item.id, name: item.name })}><Trash2 size={14} />Löschen</button></div> : null}</article>
  );
}
