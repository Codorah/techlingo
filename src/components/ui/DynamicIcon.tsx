import {
  Activity, BrainCircuit, Boxes, Briefcase, ChartColumn, ChartPie, Cloud, Code, Container, Cpu, Database, Gauge, GitBranch,
  Globe, Kanban, Laptop, LayoutTemplate, type LucideIcon, Mail, Megaphone, MessagesSquare, Network, Newspaper, PenLine, PenTool,
  Plug, Search, Server, ShieldCheck, ShoppingCart, Smartphone, Sparkles, Target, TestTubeDiagonal, TrendingUp, Users,
  WandSparkles, Workflow
} from 'lucide-react';

// Icons referenced by name in content/domains.json, roles.json and categories.json.
const ICONS: Record<string, LucideIcon> = {
  Activity, BrainCircuit, Boxes, Briefcase, ChartColumn, ChartPie, Cloud, Code, Container, Cpu, Database, Gauge, GitBranch,
  Globe, Kanban, Laptop, LayoutTemplate, Mail, Megaphone, MessagesSquare, Network, Newspaper, PenLine, PenTool, Plug, Search,
  Server, ShieldCheck, ShoppingCart, Smartphone, Sparkles, Target, TestTubeDiagonal, TrendingUp, Users, WandSparkles, Workflow
};

export function DynamicIcon({ name, size = 22, className }: { name: string; size?: number; className?: string }) {
  const Icon = ICONS[name] ?? Sparkles;
  return <Icon size={size} className={className} aria-hidden />;
}
