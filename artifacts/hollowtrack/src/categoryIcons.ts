import {
  Activity,
  FolderOpen,
  Leaf,
  ShieldCheck,
  type LucideIcon,
} from 'lucide-react';

export const categoryIconMap: Record<string, LucideIcon> = {
  Activity,
  FolderOpen,
  Leaf,
  ShieldCheck,
};

export function categoryIcon(icon: string): LucideIcon {
  return categoryIconMap[icon] || FolderOpen;
}
