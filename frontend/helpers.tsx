import {
  Bell,
  FolderKanban,
  FolderOpen,
  Users,
  UserPlus,
  UserMinus,
  Shield,
  ClipboardList,
  MessageSquare,
  Link2,
  Rocket,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  BookOpen,
  Bug,
  CheckSquare,
  ListTodo,
  Layers3
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

   export const getNotificationIcon = (type: string) => {
      switch (type) {
        case "WORKSPACE_CREATED":
        case "WORKSPACE_UPDATED":
        case "WORKSPACE_DELETED":
          return <FolderKanban className="h-5 w-5" />;
  
        case "WORKSPACE_MEMBER_INVITED":
        case "PROJECT_MEMBER_INVITED":
          return <UserPlus className="h-5 w-5" />;
  
        case "WORKSPACE_MEMBER_REMOVED":
        case "PROJECT_MEMBER_REMOVED":
          return <UserMinus className="h-5 w-5" />;
  
        case "WORKSPACE_ROLE_UPDATED":
          return <Shield className="h-5 w-5" />;
  
        case "WORKSPACE_INVITE_ACCEPTED":
        case "SPRINT_COMPLETED":
          return <CheckCircle2 className="h-5 w-5" />;
  
        case "WORKSPACE_INVITE_DECLINED":
          return <AlertCircle className="h-5 w-5" />;
  
        case "PROJECT_CREATED":
        case "PROJECT_UPDATED":
        case "PROJECT_DELETED":
          return <FolderOpen className="h-5 w-5" />;
  
        case "PROJECT_MEMBER_ADDED":
        case "PROJECT_MEMBER_JOINED":
          return <Users className="h-5 w-5" />;
  
        case "SPRINT_CREATED":
        case "SPRINT_UPDATED":
        case "SPRINT_STARTED":
        case "SPRINT_DELETED":
        case "SPRINT_HEALTH":
          return <Rocket className="h-5 w-5" />;
  
        case "TASK_ADDED_TO_SPRINT":
        case "TASK_REMOVED_FROM_SPRINT":
        case "TASK_CREATED":
        case "TASK_UPDATED":
        case "TASK_DELETED":
        case "TASK_ASSIGNED":
        case "TASK_STATUS_UPDATED":
        case "TASK_MOVED_TO_SPRINT":
        case "TASK_MOVED_TO_BACKLOG":
        case "TASK_COMMENT_MENTION":
          return <ClipboardList className="h-5 w-5" />;
  
        case "TASK_COMMENT_ADDED":
        case "TASK_COMMENT_DELETED":
          return <MessageSquare className="h-5 w-5" />;
  
        case "TASK_LINKED":
        case "TASK_LINK_REMOVED":
        case "TASK_LINK_UPDATED":
          return <Link2 className="h-5 w-5" />;
  
        case "SYSTEM":
          return <Sparkles className="h-5 w-5" />;
  
        default:
          return <Bell className="h-5 w-5" />;
      }
    };
  
    // =====================================================
    // REDIRECT URL
    // =====================================================
  
    export const getRedirectUrl = (notification: any) => {
      switch (notification?.type) {
        case "WORKSPACE_CREATED":
        case "WORKSPACE_UPDATED":
        case "WORKSPACE_DELETED":
        case "WORKSPACE_MEMBER_INVITED":
        case "PROJECT_MEMBER_INVITED":
        case "WORKSPACE_ROLE_UPDATED":
        case "WORKSPACE_INVITE_ACCEPTED":
        case "WORKSPACE_INVITE_DECLINED":
        case "WORKSPACE_MEMBER_REMOVED":
        case "PROJECT_MEMBER_REMOVED":
          return `/workspace/${notification?.workspaceId}`;
  
        case "PROJECT_CREATED":
        case "PROJECT_UPDATED":
        case "PROJECT_DELETED":
        case "PROJECT_MEMBER_ADDED":
        case "PROJECT_MEMBER_JOINED":
          return `/workspace/${notification?.workspaceId}/projects`;
  
        case "SPRINT_CREATED":
        case "SPRINT_UPDATED":
        case "SPRINT_STARTED":
        case "SPRINT_COMPLETED":
        case "SPRINT_DELETED":
          return `/sprint/${notification?.projectId}?sprintId=${notification?.sprintId}`;
  
        case "TASK_ADDED_TO_SPRINT":
        case "TASK_REMOVED_FROM_SPRINT":
        case "TASK_CREATED":
        case "TASK_UPDATED":
        case "TASK_DELETED":
        case "TASK_ASSIGNED":
        case "TASK_STATUS_UPDATED":
        case "TASK_MOVED_TO_SPRINT":
        case "TASK_MOVED_TO_BACKLOG":
        case "TASK_COMMENT_ADDED":
        case "TASK_COMMENT_DELETED":
        case "TASK_COMMENT_MENTION":
  
        case "TASK_LINKED":
        case "TASK_LINK_REMOVED":
        case "TASK_LINK_UPDATED":
        case "TASK_DUE_REMINDER":
        case "TASK_OVERDUE":
          return `/tasks/${notification?.projectId}?sprintId=${notification?.sprintId}&taskId=${notification?.taskId}`;

        case "SPRINT_HEALTH":
          return `/sprint/${notification?.sprintId}/dashboard`
          
  
        default:
          return "#";
      }
    };

  export const buildCommentTree = (comments: any[]) => {
  const map = new Map();

  const roots: any[] = [];

  comments.forEach((comment) => {
    map.set(comment.id, {
      ...comment,
      replies: [],
    });
  });

  comments.forEach((comment) => {
    if (comment.parentId) {
      const parent = map.get(comment.parentId);

      if (parent) {
        parent.replies.push(map.get(comment.id));
      }
    } else {
      roots.push(map.get(comment.id));
    }
  });

  return roots;
};