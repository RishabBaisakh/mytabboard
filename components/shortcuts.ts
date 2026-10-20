import {
  BookOpen,
  BriefcaseBusiness,
  CalendarDays,
  CirclePlay,
  Code2,
  Folder,
  Mail,
  MessageCircle,
  Palette,
  PenTool,
  Search,
  Video,
  type LucideIcon
} from "lucide-react"

export type Shortcut = {
  label: string
  href: string
  icon: LucideIcon
}

export const SHORTCUTS: readonly Shortcut[] = [
  { label: "Google Search", href: "https://www.google.com/", icon: Search },
  { label: "Gmail", href: "https://mail.google.com/", icon: Mail },
  {
    label: "Google Calendar",
    href: "https://calendar.google.com/",
    icon: CalendarDays
  },
  { label: "X", href: "https://x.com/", icon: Folder },
  { label: "ChatGPT", href: "https://chatgpt.com/", icon: MessageCircle },
  { label: "GitHub", href: "https://github.com/", icon: Code2 },
  { label: "Notion", href: "https://www.notion.so/", icon: BookOpen },
  { label: "Canva", href: "https://www.canva.com/", icon: Palette },
  { label: "Figma", href: "https://www.figma.com/", icon: PenTool },
  { label: "YouTube", href: "https://www.youtube.com/", icon: CirclePlay },
  {
    label: "LinkedIn",
    href: "https://www.linkedin.com/",
    icon: BriefcaseBusiness
  },
  { label: "Zoom", href: "https://zoom.us/", icon: Video }
]
