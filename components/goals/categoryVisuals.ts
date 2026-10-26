import {
  GraduationCap,
  HeartPulse,
  PiggyBank,
  Plane,
  Shapes,
  Sprout,
  UsersRound,
  type LucideIcon
} from "lucide-react"

export type CategoryVisual = {
  icon: LucideIcon
  color: string
  tint: string
}

// Keyed only by the stable backend category key. Names and descriptions come from the API.
const CATEGORY_VISUALS: Record<string, CategoryVisual> = {
  health_wellness: { icon: HeartPulse, color: "#b8455a", tint: "#fbeaed" },
  career_learning: { icon: GraduationCap, color: "#3e6fb1", tint: "#eaf1fb" },
  family_relationships: {
    icon: UsersRound,
    color: "#a0568c",
    tint: "#f7eaf3"
  },
  financial_life: { icon: PiggyBank, color: "#278277", tint: "#e6f4f1" },
  travel_experiences: { icon: Plane, color: "#b37a22", tint: "#fbf1df" },
  personal_life: { icon: Sprout, color: "#5a8a3c", tint: "#edf5e6" }
}

const FALLBACK_VISUAL: CategoryVisual = {
  icon: Shapes,
  color: "#596579",
  tint: "#eef2f8"
}

export function getCategoryVisual(key: string | null | undefined) {
  return (key && CATEGORY_VISUALS[key]) || FALLBACK_VISUAL
}
