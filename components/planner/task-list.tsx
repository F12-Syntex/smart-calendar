"use client";

import { Checkbox } from "@heroui/checkbox";

export interface TaskData {
  id: string;
  title: string;
  description?: string | null;
  completed: boolean;
}

interface TaskListProps {
  tasks: TaskData[];
  onToggle: (id: string, completed: boolean) => void;
  emptyMessage?: string;
}

export const TaskList = ({
  tasks,
  onToggle,
  emptyMessage = "No tasks yet",
}: TaskListProps) => {
  if (tasks.length === 0) {
    return (
      <p className="text-xs text-default-300 italic py-3">{emptyMessage}</p>
    );
  }

  const completed = tasks.filter((t) => t.completed).length;
  const total = tasks.length;
  const progress = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2 mb-3">
        <div className="flex-1 h-1.5 bg-default-200/30 rounded-full overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
        <span className="text-[10px] text-default-400 font-semibold whitespace-nowrap">
          {completed}/{total}
        </span>
      </div>
      {tasks.map((task) => (
        <div
          key={task.id}
          className={`flex items-start gap-2 px-3 py-2.5 rounded-xl transition-all ${
            task.completed
              ? "opacity-50"
              : "hover:bg-default-100/50"
          }`}
        >
          <Checkbox
            classNames={{
              wrapper: "mt-0.5",
            }}
            isSelected={task.completed}
            size="sm"
            onValueChange={(checked) => onToggle(task.id, checked)}
          />
          <div className="flex-1 min-w-0">
            <p
              className={`text-sm font-medium ${
                task.completed ? "line-through text-default-400" : ""
              }`}
            >
              {task.title}
            </p>
            {task.description && (
              <p className="text-[11px] text-default-400 mt-0.5 truncate">
                {task.description}
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};
