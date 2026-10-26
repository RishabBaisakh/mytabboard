import React from "react"

import { tasksService, type Task } from "../../services/tasks"
import { getLocalDate } from "./plannerCalendar"
import { createLatestGuard, getDayRange } from "./plannerRequests"

export type TodayTasksState = {
  tasks: Task[]
  status: "loading" | "succeeded" | "failed"
  error: string
}

// One request for today's tasks (local calendar date), shared by every Dashboard widget.
export function useTodayTasks() {
  const [state, setState] = React.useState<TodayTasksState>({
    tasks: [],
    status: "loading",
    error: ""
  })
  const [reloadToken, setReloadToken] = React.useState(0)
  const guardRef = React.useRef(createLatestGuard())

  React.useEffect(() => {
    const isCurrent = guardRef.current.begin()
    setState((current) => ({ ...current, status: "loading", error: "" }))
    tasksService
      .list(getDayRange(getLocalDate(new Date())))
      .then((tasks) => {
        if (isCurrent()) setState({ tasks, status: "succeeded", error: "" })
      })
      .catch((error: unknown) => {
        if (!isCurrent()) return
        setState({
          tasks: [],
          status: "failed",
          error:
            error instanceof Error ? error.message : "Unable to load tasks."
        })
      })
    return () => guardRef.current.cancel()
  }, [reloadToken])

  const replaceTask = React.useCallback((updated: Task) => {
    setState((current) => ({
      ...current,
      tasks: current.tasks.map((task) =>
        task.id === updated.id ? updated : task
      )
    }))
  }, [])

  const reload = React.useCallback(() => setReloadToken((n) => n + 1), [])

  return { ...state, replaceTask, reload }
}
