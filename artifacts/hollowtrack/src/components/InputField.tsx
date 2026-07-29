import type { Formularwert, Tracker } from '../types';

export function InputField({ item, value, onChange }: { item: Tracker; value: Formularwert; onChange: (value: Formularwert) => void }) {
  const label = <span className="field__label">{item.name}{item.einheit ? <small> ({item.einheit})</small> : null}</span>;
  if (item.typ === 'Ja/Nein') return <label className="field field--check"><input type="checkbox" checked={value === true} onChange={(event) => onChange(event.target.checked ? true : undefined)} />{label}</label>;
  if (item.typ === 'Mehrzeiliger Text' || item.typ === 'Mehrfachauswahl') return <label className="field">{label}<textarea value={Array.isArray(value) ? value.join(', ') : String(value ?? '')} onChange={(event) => onChange(event.target.value || undefined)} placeholder="Noch keine Angabe" rows={3} /></label>;
  if (item.typ === 'Auswahlliste') return <label className="field">{label}<select value={String(value ?? '')} onChange={(event) => onChange(event.target.value || undefined)}><option value="">Nicht angegeben</option>{(item.optionen || []).map((option) => <option value={option} key={option}>{option}</option>)}</select></label>;
  const numberType = item.typ === 'Zahl' || item.typ === 'Dezimalzahl' || item.typ === 'Bewertung 0 bis 10' || item.typ === 'Dauer';
  return <label className="field">{label}<input type={numberType ? 'number' : item.typ === 'Datum' ? 'date' : item.typ === 'Uhrzeit' ? 'time' : 'text'} min={item.typ === 'Bewertung 0 bis 10' ? 0 : undefined} max={item.typ === 'Bewertung 0 bis 10' ? 10 : undefined} step={item.typ === 'Dezimalzahl' ? '0.1' : '1'} value={String(value ?? '')} onChange={(event) => onChange(event.target.value || undefined)} placeholder="Nicht angegeben" /></label>;
}
