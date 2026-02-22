"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  X,
  RefreshCcw,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Loader2,
  PlayCircle,
  XCircle,
  Calendar,
} from "lucide-react";
import clsx from "clsx";

function TaskList({
  title,
  tasks,
  emptyLabel,
  accentColor,
  statusIcon: StatusIcon,
  statusBgColor,
  statusTextColor,
  selectedTaskId,
  onSelect,
}) {
  return (
    <div className="space-y-2.5">
      <div className="flex items-center gap-2">
        <div
          className={clsx(
            "flex h-7 w-7 items-center justify-center rounded-lg",
            statusBgColor
          )}
        >
          <StatusIcon className={clsx("h-4 w-4", statusTextColor)} />
        </div>
        <h3 className="text-sm font-bold text-gray-800">{title}</h3>
        <span
          className={clsx(
            "ml-auto rounded-full px-2 py-0.5 text-xs font-bold",
            statusBgColor,
            statusTextColor
          )}
        >
          {tasks.length}
        </span>
      </div>
      {tasks.length === 0 ? (
        <div className="rounded-lg border border-dashed border-gray-200 bg-gray-50/50 px-3 py-2.5 text-xs text-gray-500">
          {emptyLabel}
        </div>
      ) : (
        <div className="space-y-3">
          {tasks.map((task, index) => {
            const active = task.taskId === selectedTaskId;
            const progressValue = Math.max(
              0,
              Math.min(100, task.progress ?? 0)
            );

            return (
              <motion.button
                key={task.taskId}
                type="button"
                onClick={() => onSelect(task)}
                className={clsx(
                  "relative w-full rounded-xl border px-3.5 py-2.5 text-left shadow-sm transition cursor-pointer overflow-hidden",
                  active
                    ? "border-sky-400 bg-sky-50 shadow"
                    : "border-gray-200 bg-white hover:border-sky-200 hover:bg-gray-50"
                )}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03 }}
              >
                {/* Animated processing line for processing tasks */}
                {title === "Processing" && (
                  <motion.div
                    className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-400 via-amber-500 to-amber-400"
                    initial={{ x: "-100%" }}
                    animate={{ x: "100%" }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "linear",
                    }}
                    style={{
                      backgroundSize: "200% 100%",
                    }}
                  />
                )}
                {/* Static success line for completed tasks */}
                {title === "Completed" && (
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-400 to-emerald-500" />
                )}
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1 space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span
                        className={clsx(
                          "inline-flex h-2 w-2 flex-shrink-0 rounded-full animate-pulse",
                          accentColor
                        )}
                      ></span>
                      <span className="text-sm font-semibold text-gray-900 truncate">
                        {task.queries?.[0] || "Unnamed query"}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5">
                      {task.providers?.length ? (
                        <span className="inline-flex items-center rounded-md bg-sky-100 px-1.5 py-0.5 text-[10px] font-semibold text-sky-700">
                          {task.providers.length} provider
                          {task.providers.length === 1 ? "" : "s"}
                        </span>
                      ) : null}
                      {task.totalQueries != null && (
                        <span className="inline-flex items-center rounded-md bg-gray-100 px-1.5 py-0.5 text-[10px] font-medium text-gray-600">
                          {task.totalQueries} queries
                        </span>
                      )}
                      {task.processedQueries != null && (
                        <span className="inline-flex items-center rounded-md bg-blue-100 px-1.5 py-0.5 text-[10px] font-medium text-blue-700">
                          {task.processedQueries} done
                        </span>
                      )}
                    </div>
                    {task.error && (
                      <p className="text-xs text-rose-600 line-clamp-1">
                        {task.error}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-1 text-right">
                    {(task.completedAt || task.createdAt) && (
                      <div className="flex items-center gap-1 text-[10px] text-gray-400">
                        <Calendar className="h-3 w-3" />
                        <span className="whitespace-nowrap">
                          {new Date(
                            task.completedAt || task.createdAt
                          ).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </motion.button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function SearchRankingTaskDrawer({
  open,
  onClose,
  taskStatus,
  loadingTasks,
  onRefresh,
  selectedTaskId,
  onSelectTask,
}) {
  const summary = taskStatus?.summary || {};
  const summaryItems = [
    {
      key: "processing",
      label: "Processing",
      value: summary.processing ?? 0,
      icon: Clock,
      iconBg: "bg-amber-100 text-amber-600",
      valueClass: "text-amber-700",
      description: "Jobs currently running",
    },
    {
      key: "completed",
      label: "Completed",
      value: summary.completed ?? 0,
      icon: CheckCircle2,
      iconBg: "bg-emerald-100 text-emerald-600",
      valueClass: "text-emerald-700",
      description: "Jobs finished successfully",
    },
    {
      key: "failed",
      label: "Failed",
      value: summary.failed ?? 0,
      icon: AlertTriangle,
      iconBg: "bg-rose-100 text-rose-600",
      valueClass: "text-rose-600",
      description: "Jobs that need attention",
    },
  ];

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 z-40 bg-black/40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.aside
            className="fixed right-0 top-0 z-50 flex h-full w-full max-w-3xl flex-col bg-white shadow-2xl"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 260, damping: 30 }}
          >
            <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  Task Monitor
                </h2>
                <p className="text-sm text-gray-500">
                  Review processing, completed, and failed AI discover jobs.
                </p>
              </div>
              <button
                onClick={onClose}
                className="rounded-full p-2 text-gray-500 transition hover:bg-gray-100 hover:text-gray-700 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="border-b border-gray-100 bg-gray-50/80 px-6 py-5">
              <div className="grid gap-3 sm:grid-cols-3">
                {summaryItems.map((item, index) => {
                  const IconComponent = item.icon;
                  return (
                    <motion.div
                      key={item.key}
                      className="relative overflow-hidden rounded-2xl border border-gray-200 bg-white/90 px-4 py-4 shadow-sm"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <div className="flex items-center justify-between gap-4">
                        <div
                          className={clsx(
                            "flex h-10 w-10 items-center justify-center rounded-xl",
                            item.iconBg
                          )}
                        >
                          <IconComponent className="h-5 w-5" />
                        </div>
                        <span
                          className={clsx(
                            "text-2xl font-semibold",
                            item.valueClass
                          )}
                        >
                          {item.value}
                        </span>
                      </div>
                      <div className="mt-3 space-y-1 text-xs text-gray-600">
                        <div className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">
                          {item.label}
                        </div>
                        <div>{item.description}</div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
              <TaskList
                title="Processing"
                tasks={taskStatus.processing}
                emptyLabel="No tasks currently processing."
                accentColor="bg-amber-500"
                statusIcon={Loader2}
                statusBgColor="bg-amber-100"
                statusTextColor="text-amber-700"
                selectedTaskId={selectedTaskId}
                onSelect={onSelectTask}
              />
              <TaskList
                title="Completed"
                tasks={taskStatus.completed}
                emptyLabel="No completed tasks yet."
                accentColor="bg-emerald-500"
                statusIcon={CheckCircle2}
                statusBgColor="bg-emerald-100"
                statusTextColor="text-emerald-700"
                selectedTaskId={selectedTaskId}
                onSelect={onSelectTask}
              />
              <TaskList
                title="Failed"
                tasks={taskStatus.failed}
                emptyLabel="No failed tasks detected."
                accentColor="bg-rose-500"
                statusIcon={XCircle}
                statusBgColor="bg-rose-100"
                statusTextColor="text-rose-700"
                selectedTaskId={selectedTaskId}
                onSelect={onSelectTask}
              />
            </div>

            <div className="flex items-center justify-between border-t border-gray-200 px-6 py-4">
              <div className="text-xs text-gray-500">
                Total tasks: <strong>{taskStatus.summary?.total ?? 0}</strong>
              </div>
              <button
                type="button"
                onClick={onRefresh}
                className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-sky-50 px-4 py-2 text-sm font-semibold text-sky-700 transition hover:border-sky-300 hover:bg-sky-100 disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer"
                disabled={loadingTasks}
              >
                <RefreshCcw
                  className={clsx(
                    "h-4 w-4",
                    loadingTasks && "animate-spin text-sky-600"
                  )}
                />
                {loadingTasks ? "Refreshing..." : "Refresh"}
              </button>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
