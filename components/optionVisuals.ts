import {
  Apple,
  BarChart3,
  BookOpen,
  Brain,
  Briefcase,
  Camera,
  Code2,
  Cpu,
  Dumbbell,
  HeartPulse,
  Lightbulb,
  ListChecks,
  Moon,
  Mountain,
  Music2,
  Palette,
  Plane,
  Rocket,
  Sparkles,
  TrendingUp,
  UsersRound,
  Wallet,
  type LucideIcon
} from "lucide-react"

export const OPTION_VISUALS: Record<
  string,
  { icon: LucideIcon; color: string }
> = {
  "Software Engineering": { icon: Code2, color: "#287b9f" },
  "Artificial Intelligence": { icon: Brain, color: "#8063b4" },
  Technology: { icon: Cpu, color: "#3676b8" },
  Entrepreneurship: { icon: Rocket, color: "#cc693f" },
  "Personal Finance": { icon: Wallet, color: "#31866a" },
  Investing: { icon: TrendingUp, color: "#36814f" },
  Business: { icon: Briefcase, color: "#526b8d" },
  Reading: { icon: BookOpen, color: "#9c6d37" },
  Fitness: { icon: Dumbbell, color: "#b44f52" },
  Nutrition: { icon: Apple, color: "#54884a" },
  "Mental Wellness": { icon: HeartPulse, color: "#bd5c79" },
  Travel: { icon: Plane, color: "#3889a9" },
  Photography: { icon: Camera, color: "#ad7043" },
  Music: { icon: Music2, color: "#ac6743" },
  Design: { icon: Palette, color: "#3c8882" },
  Analytical: { icon: BarChart3, color: "#3877a6" },
  Creative: { icon: Sparkles, color: "#b66b43" },
  Curious: { icon: Lightbulb, color: "#aa8231" },
  Ambitious: { icon: Mountain, color: "#538366" },
  Organized: { icon: ListChecks, color: "#4d70a4" },
  Collaborative: { icon: UsersRound, color: "#a25672" },
  Reflective: { icon: Moon, color: "#6872a4" }
}

export const FALLBACK_OPTION_VISUAL = {
  icon: Sparkles,
  color: "#55708f"
}

export function getOptionVisual(label: string) {
  return OPTION_VISUALS[label] ?? FALLBACK_OPTION_VISUAL
}
