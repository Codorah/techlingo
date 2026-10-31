import {
  Activity, BrainCircuit, Boxes, ChartColumn, Cloud, Code, Container, Cpu, Database, Gauge, GitBranch, Globe, Kanban,
  Laptop, LayoutTemplate, type LucideIcon, Network, PenTool, Plug, Server, ShieldCheck, Smartphone, Sparkles, Target,
  TestTubeDiagonal, Users, WandSparkles, Workflow
} from 'lucide-react';

// Icons referenced by name in content/roles.json and content/categories.json.
const ICONS: Record<string, LucideIcon> = {
  Activity, BrainCircuit, Boxes, ChartColumn, Cloud, Code, Container, Cpu, Database, Gauge, GitBranch, Globe, Kanban,
  Laptop, LayoutTemplate, Network, PenTool, Plug, Server, ShieldCheck, Smartphone, Sparkles, Target, TestTubeDiagonal,
  Users, WandSparkles, Workflow
};

export function DynamicIcon({ name, size = 22, className }: { name: string; size?: number; className?: string }) {
  const Icon = ICONS[name] ?? Sparkles;
  return <Icon size={size} className={className} aria-hidden />;
}
