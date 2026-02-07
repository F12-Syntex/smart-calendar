"use client";

import { useState } from "react";
import { Checkbox } from "@heroui/checkbox";
import { Progress } from "@heroui/progress";
import { Input } from "@heroui/input";
import { Button } from "@heroui/button";

export interface TaskData {
  id: string;
  title: string;
  description?: string | null;
  completed: boolean;
}

interface TaskListProps {
  tasks: TaskData[];
  onToggle: (id: string, completed: boolean) => void;
  onEdit?: (id: string, title: string, description?: string) => void;
  onDelete?: (id: string) => void;
  onAdd?: (title: string) => void;
  emptyMessage?: string;
  compact?: boolean;
}

export const TaskList = ({
  tasks,
  onToggle,
  onEdit,
  onDelete,
  onAdd,
  emptyMessage = "No tasks yet",
  compact = false,
}: TaskListProps) => {
  const [expanded, setExpanded] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [addingTask, setAddingTask] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState("");

  const startEdit = (task: TaskData) => {
    if (!onEdit) return;
    setEditingId(task.id);
    setEditTitle(task.title);
  };

  const saveEdit = () => {
    if (editingId && editTitle.trim() && onEdit) {
      onEdit(editingId, editTitle.trim());
    }
    setEditingId(null);
    setEditTitle("");
  };

  const handleAdd = () => {
    if (newTaskTitle.trim() && onAdd) {
      onAdd(newTaskTitle.trim());
      setNewTaskTitle("");
      setAddingTask(false);
    }
  };

  if (tasks.length === 0 && !onAdd) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <div className="w-10 h-10 rounded-full bg-default-100/50 flex items-center justify-center mb-3">
          <span className="text-default-300 text-lg">+</span>
        </div>
        <p className="text-xs text-default-400">{emptyMessage}</p>
      </div>
    );
  }

  const completed = tasks.filter((t) => t.completed).length;
  const total = tasks.length;
  const progress = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <div>
      {total > 0 && (
        <div className="flex items-center gap-3 mb-3">
          <Progress
            classNames={{
              track: "h-1.5 bg-default-200/30",
              indicator: "bg-primary",
            }}
            value={progress}
          />
          <span className="text-[10px] text-default-400 font-semibold whitespace-nowrap tabular-nums">
            {completed}/{total}
          </span>
        </div>
      )}
      <div className={compact ? "space-y-0.5" : "space-y-1"}>
        {tasks.map((task) => (
          <div
            key={task.id}
            className={`group flex items-start gap-2.5 ${compact ? "px-2 py-1.5" : "px-3 py-2.5"} rounded-xl transition-all border border-transparent ${
              task.completed
                ? "opacity-40"
                : "hover:bg-default-100/40 hover:border-default-200/30"
            }`}
          >
            <Checkbox
              classNames={{ wrapper: "mt-0.5" }}
              isSelected={task.completed}
              size="sm"
              onValueChange={(checked) => onToggle(task.id, checked)}
            />
            <div className="flex-1 min-w-0">
              {editingId === task.id ? (
                <Input
                  autoFocus
                  classNames={{ inputWrapper: "rounded-lg bg-default-100/50 h-7 min-h-7" }}
                  size="sm"
                  value={editTitle}
                  onBlur={saveEdit}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") saveEdit();
                    if (e.key === "Escape") { setEditingId(null); setEditTitle(""); }
                  }}
                  onValueChange={setEditTitle}
                />
              ) : (
                <div
                  className="cursor-pointer"
                  onClick={() => {
                    if (task.description) {
                      setExpanded(expanded === task.id ? null : task.id);
                    }
                  }}
                  onDoubleClick={() => startEdit(task)}
                >
                  <p
                    className={`${compact ? "text-xs" : "text-sm"} font-medium leading-snug ${
                      task.completed ? "line-through text-default-400" : ""
                    }`}
                  >
                    {task.title}
                  </p>
                  {task.description && (
                    <p
                      className={`text-[11px] text-default-400 mt-0.5 transition-all ${
                        expanded === task.id ? "whitespace-pre-wrap" : "truncate"
                      }`}
                    >
                      {task.description}
                    </p>
                  )}
                </div>
              )}
            </div>
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 mt-0.5">
              {task.description && !task.completed && editingId !== task.id && (
                <span className="text-[10px] text-default-300">
                  {expanded === task.id ? "\u2212" : "+"}
                </span>
              )}
              {onDelete && !task.completed && (
                <button
                  className="text-[10px] text-default-300 hover:text-danger cursor-pointer ml-1"
                  onClick={() => onDelete(task.id)}
                >
                  &times;
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Add task */}
      {onAdd && (
        <div className="mt-2">
          {addingTask ? (
            <div className="flex items-center gap-2 px-3">
              <Input
                autoFocus
                classNames={{ inputWrapper: "rounded-lg bg-default-100/50 h-7 min-h-7" }}
                placeholder="Task title..."
                size="sm"
                value={newTaskTitle}
                onBlur={() => { if (!newTaskTitle.trim()) setAddingTask(false); }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleAdd();
                  if (e.key === "Escape") { setAddingTask(false); setNewTaskTitle(""); }
                }}
                onValueChange={setNewTaskTitle}
              />
              <Button
                className="rounded-lg h-7 min-w-0 px-3 text-[11px] font-semibold"
                color="primary"
                isDisabled={!newTaskTitle.trim()}
                size="sm"
                onPress={handleAdd}
              >
                Add
              </Button>
            </div>
          ) : (
            <button
              className="text-[11px] text-default-400 hover:text-primary px-3 py-1.5 cursor-pointer transition-colors"
              onClick={() => setAddingTask(true)}
            >
              + Add task
            </button>
          )}
        </div>
      )}
    </div>
  );
};
