import {
  Bug,
  CheckSquare,
  BookOpen,
  Layers3,
  Sparkles,
  ListTodo,
} from "lucide-react";

export const getTaskTypeIcon = (type: string) => {
  switch (type) {
    case "STORY":
      return <BookOpen className="h-3.5 w-3.5 text-blue-500" />;
    case "BUG":
      return <Bug className="h-3.5 w-3.5 text-red-500" />;
    case "TASK":
      return <CheckSquare className="h-3.5 w-3.5 text-emerald-500" />;
    case "SUBTASK":
      return <ListTodo className="h-3.5 w-3.5 text-violet-500" />;
    case "EPIC":
      return <Layers3 className="h-3.5 w-3.5 text-orange-500" />;
    case "IMPROVEMENT":
      return <Sparkles className="h-3.5 w-3.5 text-pink-500" />;
    default:
      return <CheckSquare className="h-3.5 w-3.5 text-neutral-500" />;
  }
};

export const slugify = (text: string) =>
  text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9\-]/g, "")
    .replace(/\-+/g, "-");