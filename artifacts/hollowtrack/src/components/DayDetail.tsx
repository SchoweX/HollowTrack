import { Pencil, Trash2 } from 'lucide-react';

import type { Struktur, Tagesdatensatz } from '../types';
import { getAllTrackers, recordValue, summaryFor } from '../records';
import { formatDate, valueExists } from '../utils';

export function DayDetail({ record, structure, onClose, onEdit, onDelete }: { record: Tagesdatensatz; structure: Struktur; onClose: () => void; onEdit: () => void; onDelete: () => void }) {
  const entries = getAllTrackers(structure).map((item) => ({ item, value: recordValue(record, item) })).filter(({ value }) => valueExists(value));
  return <div className="modal-backdrop" role="presentation"><section className="modal modal--wide" role="dialog" aria-modal="true" aria-labelledby="detail-title"><div className="modal__header"><div><p className="module__eyebrow">Gespeicherter Tag</p><h2 className="modal__title" id="detail-title">{formatDate(record.datum)}</h2><p className="modal__description">{summaryFor(record, structure)}</p></div><button className="icon-button" type="button" onClick={onClose} aria-label="Tagesansicht schließen"><X size={17} /></button></div><div className="detail-list">{entries.length ? entries.map(({ item, value }) => <div className="detail-row" key={item.id}><span>{item.name}</span><strong>{value === true ? 'Ja' : value === false ? 'Nein' : Array.isArray(value) ? value.join(', ') : String(value)}{item.einheit ? ` ${item.einheit}` : ''}</strong></div>) : <p className="hinweis">Für diesen Tag sind keine Trackerwerte gespeichert.</p>}</div>{record.notizen ? <div className="detail-notes"><strong>Notizen</strong><p>{record.notizen}</p></div> : null}<div className="modal__actions"><button className="button button--quiet" type="button" onClick={onClose}>Schließen</button><button className="button button--danger" type="button" onClick={onDelete}><Trash2 size={14} />Eintrag löschen</button><button className="button button--primary" type="button" onClick={onEdit}><Pencil size={14} />Tag bearbeiten</button></div></section></div>;
}
