import { CircleHelp, type LucideIcon } from 'lucide-react';

export function EmptyState({ title, text, icon: Icon = CircleHelp }: { title?: string; text: string; icon?: LucideIcon }) { return <div className="empty-state"><Icon size={21} strokeWidth={1.7} />{title ? <h3 className="empty-state__title">{title}</h3> : null}<p className="empty-state__text">{text}</p></div>; }
export function SectionHeader({ eyebrow, title, description, icon: Icon }: { eyebrow?: string; title: string; description: string; icon?: LucideIcon }) { return <>{Icon ? <div className="section-icon" aria-hidden="true"><Icon size={17} /></div> : null}{eyebrow ? <p className="module__eyebrow">{eyebrow}</p> : null}<h2 className="module__title">{title}</h2><p className="module__description">{description}</p></>; }
