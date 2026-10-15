import {
  ArrowRight,
  Bell,
  Bot,
  BriefcaseBusiness,
  CalendarDays,
  CirclePlay,
  Clock3,
  Code2,
  Lightbulb,
  ListChecks,
  ListPlus,
  MessageCircle,
  Search,
  Sparkles,
  Target
} from "lucide-react"
import { Link } from "react-router-dom"

const schedule = [
  {
    title: "Review daily priorities",
    start: "9:00 AM",
    end: "9:30 AM",
    done: true
  },
  {
    title: "Product design sync",
    start: "10:00 AM",
    end: "10:45 AM",
    done: false
  },
  {
    title: "Focus time: dashboard",
    start: "11:00 AM",
    end: "12:30 PM",
    done: false
  },
  { title: "Lunch break", start: "12:30 PM", end: "1:15 PM", done: false }
]

const quickLinks = [
  { label: "GitHub", href: "https://github.com", icon: Code2 },
  { label: "Twitter", href: "https://twitter.com", icon: MessageCircle },
  { label: "YouTube", href: "https://youtube.com", icon: CirclePlay },
  { label: "LinkedIn", href: "https://linkedin.com", icon: BriefcaseBusiness }
]

const workspaceStats = [
  {
    label: "Today's tasks",
    value: "3/5",
    progress: 60,
    icon: ListChecks,
    tone: "blue"
  },
  {
    label: "This week",
    value: "6/10",
    progress: 60,
    icon: CalendarDays,
    tone: "teal"
  },
  {
    label: "Daily goal",
    value: "75%",
    progress: 75,
    icon: Target,
    tone: "amber"
  }
]

const quickActions = [
  {
    label: "Add task",
    detail: "Capture a to-do",
    icon: ListPlus,
    to: "/tasks"
  },
  {
    label: "Add goal",
    detail: "Set a new target",
    icon: Target,
    to: "/goals"
  },
  {
    label: "Browse ideas",
    detail: "Find inspiration",
    icon: Lightbulb,
    to: "/newsandinsights"
  },
  {
    label: "Open AI assistant",
    detail: "Coming soon",
    icon: Bot
  }
]

function DashboardPage() {
  const currentDate = new Date()
  const dateLabel = currentDate.toLocaleDateString(undefined, {
    weekday: "long",
    month: "short",
    day: "numeric",
    year: "numeric"
  })

  return (
    <section className="dashboard-page" aria-labelledby="dashboard-title">
      <div className="dashboard-topbar">
        <form className="dashboard-search" role="search">
          <Search
            className="dashboard-search-icon"
            size={18}
            aria-hidden="true"
          />
          <label className="visually-hidden" htmlFor="dashboard-search">
            Search your workspace
          </label>
          <input
            id="dashboard-search"
            type="search"
            placeholder="Search your workspace..."
          />
        </form>
        <div className="dashboard-tools">
          <time className="dashboard-date" dateTime={currentDate.toISOString()}>
            {dateLabel}
          </time>
          <button
            className="dashboard-notifications"
            type="button"
            aria-label="Notifications, 3 unread"
            title="Notifications">
            <Bell size={19} strokeWidth={1.8} aria-hidden="true" />
            <span className="notification-badge" aria-hidden="true">
              3
            </span>
          </button>
        </div>
      </div>
      <header className="page-header">
        <h1 id="dashboard-title">Good morning, John! 👋</h1>
        <p className="page-subtitle">
          Small steps every day lead to big results.
        </p>
      </header>

      <div className="dashboard-grid">
        <section
          className="dashboard-primary"
          aria-label="Main dashboard workspace">
          <div className="workspace-stats" aria-label="Progress overview">
            {workspaceStats.map(
              ({ label, value, progress, icon: Icon, tone }) => (
                <article className={`workspace-stat stat-${tone}`} key={label}>
                  <div className="workspace-stat-icon-wrapper">
                    <span className="workspace-stat-icon" aria-hidden="true">
                      <Icon size={18} strokeWidth={1.9} />
                    </span>
                  </div>
                  <h2>{label}</h2>
                  <div
                    className="workspace-stat-progress-wrapper"
                    aria-hidden="true">
                    <p className="workspace-stat-value">{value}</p>
                  </div>
                  <div
                    className="workspace-progress"
                    role="progressbar"
                    aria-label={label}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={progress}>
                    <span style={{ width: `${progress}%` }} />
                  </div>
                </article>
              )
            )}
          </div>
          <div className="workspace-lower">
            <section className="planner-promo" aria-labelledby="planner-title">
              <div className="planner-promo-copy">
                <p className="planner-eyebrow">Make room for what matters</p>
                <h2 id="planner-title">Build the life you want</h2>
                <p className="planner-tagline">
                  <span>Stay focused, stay consistent, stay you.</span>
                </p>
                <Link className="planner-link" to="/planner">
                  View planner
                  <ArrowRight size={16} aria-hidden="true" />
                </Link>
              </div>
            </section>

            <section
              className="quick-actions"
              aria-labelledby="quick-actions-title">
              <header className="quick-actions-heading">
                <div>
                  <h2 id="quick-actions-title">Quick actions</h2>
                  <p>A little momentum goes a long way</p>
                </div>
              </header>
              <div className="quick-actions-list">
                {quickActions.map(({ label, detail, icon: Icon, to }) => {
                  const content = (
                    <>
                      <span className="quick-action-icon" aria-hidden="true">
                        <Icon size={19} strokeWidth={1.8} />
                      </span>
                      <span className="quick-action-copy">
                        <span className="quick-action-label">{label}</span>
                        <span className="quick-action-detail">{detail}</span>
                      </span>
                      {to && (
                        <ArrowRight
                          className="quick-action-arrow"
                          size={15}
                          aria-hidden="true"
                        />
                      )}
                    </>
                  )

                  return to ? (
                    <Link className="quick-action" key={label} to={to}>
                      {content}
                    </Link>
                  ) : (
                    <div
                      className="quick-action quick-action-disabled"
                      key={label}
                      aria-label={`${label}, ${detail}`}>
                      {content}
                    </div>
                  )
                })}
              </div>
            </section>
          </div>
        </section>

        <aside className="dashboard-side" aria-label="Daily overview">
          <section className="dashboard-panel" aria-labelledby="schedule-title">
            <header className="panel-heading">
              <div>
                <h2 id="schedule-title">Today&apos;s Schedule</h2>
                <p>What&apos;s on your agenda</p>
              </div>
              <CalendarDays size={19} aria-hidden="true" />
            </header>

            <ul className="schedule-list">
              {schedule.map((item) => (
                <li className="schedule-item" key={item.title}>
                  <label className="schedule-check">
                    <input
                      type="checkbox"
                      defaultChecked={item.done}
                      aria-label={`${item.title}: ${item.done ? "complete" : "incomplete"}`}
                    />
                  </label>
                  <div className="schedule-details">
                    <p className="schedule-title">{item.title}</p>
                    <div className="schedule-meta">
                      <span>
                        <Clock3 size={13} aria-hidden="true" />
                        {item.start} – {item.end}
                      </span>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </section>

          <section
            className="dashboard-panel"
            aria-labelledby="quick-links-title">
            <header className="panel-heading">
              <div>
                <h2 id="quick-links-title">Quick links</h2>
                <p>Your favorite places</p>
              </div>
            </header>
            <nav className="quick-links" aria-label="Quick links">
              {quickLinks.map(({ label, href, icon: Icon }) => (
                <a
                  className="quick-link"
                  href={href}
                  key={label}
                  target="_blank"
                  rel="noreferrer">
                  <Icon size={19} strokeWidth={1.8} aria-hidden="true" />
                  <span>{label}</span>
                </a>
              ))}
            </nav>
          </section>
        </aside>
      </div>
    </section>
  )
}

export default DashboardPage
