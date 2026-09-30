"use client";

import {
  ChangeEvent,
  Children,
  FormEvent,
  cloneElement,
  isValidElement,
  type ReactElement,
  type ReactNode,
  useEffect,
  useMemo,
  useRef,
  useState
} from "react";
import ReactMarkdown, { type Components } from "react-markdown";
import { createPortal } from "react-dom";


import { COUNTRY_CALLING_CODES } from "@/lib/countries";
import { supabase } from "@/lib/supabase/client";
import type { ChatAttachment, ChatMessage, ChatSession, FeedbackType } from "@/types/chat";

const welcomeMessage: ChatMessage = {
  role: "assistant",
  content: "Hi! I’m Aperonix AI. How can I help you today?"
};


const PROFILE_FILTERS = [
  { name: "Original", css: "none" },
  { name: "Bright", css: "brightness(1.14) saturate(1.05)" },
  { name: "Contrast", css: "contrast(1.2)" },
  { name: "Soft", css: "brightness(1.04) contrast(.95) saturate(.92)" },
  { name: "Fade", css: "contrast(.9) brightness(1.08) saturate(.8)" },
  { name: "Warm", css: "sepia(.12) saturate(1.2) hue-rotate(-8deg) brightness(1.04)" },
  { name: "Cool", css: "saturate(.95) hue-rotate(10deg) brightness(1.03)" },
  { name: "Golden", css: "sepia(.24) saturate(1.36) brightness(1.04)" },
  { name: "Sunset", css: "sepia(.14) saturate(1.5) hue-rotate(-18deg) contrast(1.05)" },
  { name: "Rose", css: "sepia(.08) saturate(1.5) hue-rotate(-28deg) brightness(1.02)" },
  { name: "Violet", css: "saturate(1.15) hue-rotate(22deg) contrast(1.05)" },
  { name: "Ocean", css: "saturate(1.12) hue-rotate(42deg) contrast(1.04)" },
  { name: "Mint", css: "saturate(1.08) hue-rotate(78deg) brightness(1.05)" },
  { name: "Forest", css: "saturate(1.12) hue-rotate(105deg) contrast(1.08)" },
  { name: "Aqua", css: "saturate(1.2) hue-rotate(62deg) brightness(1.02)" },
  { name: "Teal", css: "saturate(1.18) hue-rotate(52deg) contrast(1.06)" },
  { name: "Lavender", css: "sepia(.05) saturate(1.05) hue-rotate(18deg) brightness(1.07)" },
  { name: "Peach", css: "sepia(.12) saturate(1.3) hue-rotate(-12deg) brightness(1.05)" },
  { name: "Honey", css: "sepia(.2) saturate(1.45) hue-rotate(-4deg) brightness(1.03)" },
  { name: "Emerald", css: "saturate(1.25) hue-rotate(95deg) contrast(1.04)" },
  { name: "Crimson", css: "saturate(1.3) hue-rotate(-35deg) contrast(1.08)" },
  { name: "Cobalt", css: "saturate(1.18) hue-rotate(28deg) contrast(1.12)" },
  { name: "Midnight", css: "brightness(.82) contrast(1.18) saturate(.92)" },
  { name: "Deep Blue", css: "brightness(.86) saturate(1.2) hue-rotate(26deg) contrast(1.12)" },
  { name: "Neon", css: "saturate(1.7) contrast(1.18) brightness(1.03)" },
  { name: "Cyber", css: "saturate(1.4) contrast(1.2) hue-rotate(16deg)" },
  { name: "Candy", css: "saturate(1.45) brightness(1.1) hue-rotate(-10deg)" },
  { name: "Pop", css: "saturate(1.55) contrast(1.15)" },
  { name: "Punch", css: "saturate(1.25) contrast(1.25)" },
  { name: "Matte", css: "contrast(.9) saturate(.85) brightness(1.06)" },
  { name: "Clean", css: "brightness(1.05) contrast(1.03) saturate(1.02)" },
  { name: "Crisp", css: "contrast(1.16) saturate(1.12) brightness(1.01)" },
  { name: "Dream", css: "brightness(1.1) saturate(.9) contrast(.92) blur(.1px)" },
  { name: "Haze", css: "brightness(1.12) contrast(.86) saturate(.84)" },
  { name: "Mist", css: "brightness(1.08) contrast(.88) saturate(.8)" },
  { name: "Glow", css: "brightness(1.13) saturate(1.18) contrast(.98)" },
  { name: "Dramatic", css: "contrast(1.34) saturate(1.12) brightness(.96)" },
  { name: "Film", css: "contrast(1.08) saturate(.92) sepia(.08) brightness(1.01)" },
  { name: "Vintage", css: "sepia(.3) contrast(.92) saturate(.8) brightness(1.04)" },
  { name: "Sepia", css: "sepia(.72) contrast(.96) saturate(.72)" },
  { name: "Copper", css: "sepia(.34) saturate(1.2) hue-rotate(-16deg) contrast(1.04)" },
  { name: "Chrome", css: "grayscale(.16) contrast(1.22) brightness(1.04) saturate(.7)" },
  { name: "Silver", css: "grayscale(.55) contrast(1.08) brightness(1.05)" },
  { name: "Noir", css: "grayscale(1) contrast(1.28) brightness(.9)" },
  { name: "Mono", css: "grayscale(1) contrast(1.05)" },
  { name: "B&W Soft", css: "grayscale(1) contrast(.9) brightness(1.08)" },
  { name: "B&W Hard", css: "grayscale(1) contrast(1.4)" },
  { name: "Slate", css: "grayscale(.55) hue-rotate(165deg) saturate(.72) contrast(1.06)" },
  { name: "Frost", css: "saturate(.75) brightness(1.12) hue-rotate(180deg) contrast(.94)" },
  { name: "Ice", css: "saturate(.8) brightness(1.08) hue-rotate(155deg) contrast(1.02)" },
  { name: "Arctic", css: "saturate(.72) brightness(1.06) hue-rotate(135deg) contrast(1.08)" },
  { name: "Berry", css: "saturate(1.32) hue-rotate(-24deg) brightness(1.03)" },
  { name: "Plum", css: "saturate(1.16) hue-rotate(8deg) brightness(.98) contrast(1.08)" },
  { name: "Indigo", css: "saturate(1.18) hue-rotate(32deg) contrast(1.08)" },
  { name: "Sapphire", css: "saturate(1.1) hue-rotate(38deg) brightness(.98) contrast(1.14)" },
  { name: "Ruby", css: "saturate(1.4) hue-rotate(-42deg) contrast(1.1)" },
  { name: "Amber", css: "sepia(.18) saturate(1.55) hue-rotate(-6deg) contrast(1.03)" },
  { name: "Coral", css: "sepia(.08) saturate(1.45) hue-rotate(-16deg) brightness(1.05)" },
  { name: "Olive", css: "sepia(.2) saturate(1.05) hue-rotate(42deg) contrast(1.03)" },
  { name: "Moss", css: "sepia(.1) saturate(1.2) hue-rotate(70deg) brightness(1.02)" },
  { name: "Twilight", css: "brightness(.92) saturate(1.18) hue-rotate(18deg) contrast(1.08)" },
  { name: "Night", css: "brightness(.72) contrast(1.2) saturate(.95) hue-rotate(10deg)" },
  { name: "Lunar", css: "grayscale(.2) brightness(.98) contrast(1.12) hue-rotate(165deg)" },
  { name: "Soft Glow", css: "brightness(1.12) contrast(.94) saturate(1.06)" },
  { name: "Studio", css: "brightness(1.06) contrast(1.08) saturate(.96)" },
  { name: "Portrait", css: "brightness(1.04) contrast(.96) saturate(.94) sepia(.04)" },
  { name: "Natural", css: "brightness(1.03) contrast(1.01) saturate(1.04)" }
];

function createLocalSession(): ChatSession {
  const now = Date.now();
  return {
    id: crypto.randomUUID(),
    title: "New chat",
    messages: [],
    createdAt: now,
    updatedAt: now,
    isPinned: false
  };
}

function makeTitle(content: string) {
  const cleaned = content.replace(/\s+/g, " ").trim();
  return cleaned.length > 38 ? `${cleaned.slice(0, 38)}…` : cleaned || "New chat";
}

const MAX_CHAT_FILES_PER_MESSAGE = 5;

const FILE_SIZE_LIMITS = {
  image: 10 * 1024 * 1024,
  document: 25 * 1024 * 1024,
  spreadsheet: 15 * 1024 * 1024,
  text: 10 * 1024 * 1024,
  audio: 25 * 1024 * 1024,
  video: 50 * 1024 * 1024,
  other: 10 * 1024 * 1024
} as const;

const ALLOWED_FILE_EXTENSIONS = new Set([
  "pdf", "docx", "txt", "md", "markdown", "csv", "tsv", "json", "xml", "html", "htm",
  "css", "scss", "less", "js", "jsx", "mjs", "cjs", "ts", "tsx", "py", "pyw",
  "java", "c", "h", "cc", "cpp", "cxx", "hpp", "cs", "go", "rs", "php", "rb",
  "swift", "kt", "kts", "sql", "sh", "bash", "zsh", "fish", "ps1", "bat", "cmd",
  "toml", "ini", "cfg", "conf", "yaml", "yml", "env", "log", "tex",
  "xlsx", "xls", "png", "jpg", "jpeg", "webp", "gif", "mp3", "wav", "m4a", "ogg",
  "mp4", "mov", "webm", "mkv"
]);

function getFileExtension(fileName: string) {
  return fileName.toLowerCase().match(/\.([a-z0-9]+)$/)?.[1] ?? "";
}

function getFileLimitCategory(file: File) {
  const ext = getFileExtension(file.name);

  if (file.type.startsWith("image/")) return "image" as const;
  if (file.type.startsWith("video/")) return "video" as const;
  if (file.type.startsWith("audio/")) return "audio" as const;
  if (["pdf", "docx"].includes(ext)) return "document" as const;
  if (["xlsx", "xls", "csv", "tsv"].includes(ext)) return "spreadsheet" as const;

  if (
    file.type.startsWith("text/") ||
    ["txt", "md", "markdown", "json", "xml", "html", "htm", "css", "scss", "less",
      "js", "jsx", "mjs", "cjs", "ts", "tsx", "py", "pyw", "java", "c", "h", "cc",
      "cpp", "cxx", "hpp", "cs", "go", "rs", "php", "rb", "swift", "kt", "kts",
      "sql", "sh", "bash", "zsh", "fish", "ps1", "bat", "cmd", "toml", "ini",
      "cfg", "conf", "yaml", "yml", "env", "log", "tex"].includes(ext)
  ) {
    return "text" as const;
  }

  return "other" as const;
}

function formatFileSize(sizeBytes: number) {
  if (sizeBytes < 1024) return `${sizeBytes} B`;
  if (sizeBytes < 1024 * 1024) return `${(sizeBytes / 1024).toFixed(1)} KB`;
  return `${(sizeBytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatFileLimit(bytes: number) {
  return `${Math.round(bytes / (1024 * 1024))} MB`;
}

function sortSessions(items: ChatSession[]) {
  return [...items].sort(
    (a, b) =>
      Number(b.isPinned) - Number(a.isPinned) ||
      b.updatedAt - a.updatedAt
  );
}

const profileMonths = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

function profileYears() {
  const current = new Date().getFullYear();
  return Array.from({ length: current - 1899 }, (_, index) => current - index);
}

function normalizeSpeechWord(value: string) {
  return value
    .toLocaleLowerCase()
    .replace(/[^\p{L}\p{N}'’-]/gu, "");
}

function toSpeechText(markdown: string) {
  return markdown
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/`{3}(?:[^\n]*)\n?([\s\S]*?)`{3}/g, "$1")
    .replace(/^\s{0,3}#{1,6}\s+/gm, "")
    .replace(/^\s*[-*+]\s+/gm, "")
    .replace(/^\s*\d+\.\s+/gm, "")
    .replace(/[>*_~|]/g, "")
    .replace(/`/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function createReadableMarkdownComponents(
  messageKey: string,
  highlightedWordIndex: number | null
): Components {
  let wordIndex = 0;

  const wrapChildren = (children: ReactNode): ReactNode =>
    Children.map(children, (child) => {
      if (typeof child === "string") {
        return child.split(/(\s+)/).map((piece, pieceIndex) => {
          if (!piece || /^\s+$/.test(piece)) return piece;

          const currentIndex = wordIndex++;
          const isHighlighted = currentIndex === highlightedWordIndex;

          return (
            <span
              key={`read-word-${currentIndex}-${pieceIndex}`}
              className={`read-aloud-word ${isHighlighted ? "is-reading" : ""}`}
              data-read-aloud-word={currentIndex}
            >
              {piece}
            </span>
          );
        });
      }

      if (isValidElement(child)) {
        const element = child as ReactElement<{ children?: ReactNode }>;
        return cloneElement(element, {
          children: wrapChildren(element.props.children)
        });
      }

      return child;
    });

  const block = (Tag: "p" | "h1" | "h2" | "h3" | "h4" | "h5" | "h6") =>
    (props: any) => {
      const { children, ...rest } = props;
      return <Tag {...rest}>{wrapChildren(children)}</Tag>;
    };

  const components: Components = {
    p: block("p"),
    h1: block("h1"),
    h2: block("h2"),
    h3: block("h3"),
    h4: block("h4"),
    h5: block("h5"),
    h6: block("h6"),
    ul: (props) => {
      const { children, ...rest } = props;
      return <ul {...rest}>{wrapChildren(children)}</ul>;
    },
    ol: (props) => {
      const { children, ...rest } = props;
      return <ol {...rest}>{wrapChildren(children)}</ol>;
    },
    blockquote: (props) => {
      const { children, ...rest } = props;
      return <blockquote {...rest}>{wrapChildren(children)}</blockquote>;
    },
    pre: (props) => {
      const { children, ...rest } = props;
      return <pre {...rest}>{wrapChildren(children)}</pre>;
    },
    table: (props) => {
      const { children, ...rest } = props;
      return <table {...rest}>{wrapChildren(children)}</table>;
    },
    thead: (props) => {
      const { children, ...rest } = props;
      return <thead {...rest}>{wrapChildren(children)}</thead>;
    },
    tbody: (props) => {
      const { children, ...rest } = props;
      return <tbody {...rest}>{wrapChildren(children)}</tbody>;
    },
    tfoot: (props) => {
      const { children, ...rest } = props;
      return <tfoot {...rest}>{wrapChildren(children)}</tfoot>;
    }
  };

  return components;
}
async function ensureAuthenticatedUser() {
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user || data.user.is_anonymous) {
    throw error ?? new Error("Please sign in to use Aperonix AI.");
  }

  return data.user;
}

export default function Chat({ onSignOut }: { onSignOut: () => Promise<void> }) {
  const [pathname, setPathname] = useState(() =>
    typeof window !== "undefined" ? window.location.pathname : "/chat"
  );

  const [sessions, setSessions] = useState<ChatSession[]>([]);

  function navigate(path: string, replace = false) {
    if (typeof window === "undefined") return;

    if (replace) {
      window.history.replaceState({}, "", path);
    } else {
      window.history.pushState({}, "", path);
    }

    setPathname(path);
  }


  const [activeSessionId, setActiveSessionId] = useState("");
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [pinFlashId, setPinFlashId] = useState<string | null>(null);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [feedbackByMessageId, setFeedbackByMessageId] = useState<Record<string, FeedbackType>>({});
  const [shareModal, setShareModal] = useState<{
    url: string | null;
    content: string;
    kind: "response" | "prompt" | "chat";
    chatTitle?: string;
    chatMessages?: Array<{
      role: "user" | "assistant";
      content: string;
    }>;
    copied: boolean;
    preparing: boolean;
  } | null>(null);
  const [nativeShareSupported, setNativeShareSupported] = useState(false);
  const [isPinnedSectionOpen, setIsPinnedSectionOpen] = useState(true);
  const [isRecentSectionOpen, setIsRecentSectionOpen] = useState(true);
  const [deleteSession, setDeleteSession] = useState<ChatSession | null>(null);
  const [renameSession, setRenameSession] = useState<ChatSession | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [profileOpen, setProfileOpen] = useState(false);
  const [profileDetailsOpen, setProfileDetailsOpen] = useState(false);
  const [profileEditOpen, setProfileEditOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [aperonixSettingOpen, setAperonixSettingOpen] = useState(false);
  const [dangerZoneOpen, setDangerZoneOpen] = useState(false);
  const [aperonixSetting, setAperonixSetting] = useState("");
  const [settingsDraft, setSettingsDraft] = useState("");
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [settingsError, setSettingsError] = useState("");
  const [profile, setProfile] = useState({
    firstName: "",
    lastName: "",
    email: "",
    dateOfBirth: "",
    gender: "",
    phoneCountryCode: "+91",
    phoneNumber: "",
    accountCreatedAt: "",
    avatarUrl: "",
    avatarPath: ""
  });
  const [profileDraft, setProfileDraft] = useState(profile);
  const [photoEditorOpen, setPhotoEditorOpen] = useState(false);
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState("");
  const [photoFilterIndex, setPhotoFilterIndex] = useState(0);
  const [photoZoom, setPhotoZoom] = useState(1);
  const [photoRotation, setPhotoRotation] = useState(0);
  const [photoOffsetX, setPhotoOffsetX] = useState(0);
  const [photoOffsetY, setPhotoOffsetY] = useState(0);
  const [photoSaving, setPhotoSaving] = useState(false);
  const [photoRemoving, setPhotoRemoving] = useState(false);
  const [photoError, setPhotoError] = useState("");
  const photoFileRef = useRef<File | null>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const [accountDeleteOpen, setAccountDeleteOpen] = useState(false);
  const [accountDeleteText, setAccountDeleteText] = useState("");
  const [accountDeleteError, setAccountDeleteError] = useState("");
  const [accountDeleting, setAccountDeleting] = useState(false);
  const [profileSaving, setProfileSaving] = useState(false);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [fileUploadError, setFileUploadError] = useState("");
  const [filePickerOpen, setFilePickerOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [readAloudMessageKey, setReadAloudMessageKey] = useState<string | null>(null);
  const [readAloudStatus, setReadAloudStatus] = useState<"idle" | "loading" | "speaking">("idle");
  const [readAloudWordIndex, setReadAloudWordIndex] = useState<number | null>(null);
  const readAloudUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const readAloudGenerationRef = useRef(0);
  const readAloudHighlightTimerRef = useRef<number | null>(null);
  const readAloudBoundaryWordRef = useRef<number | null>(null);
  const readAloudBoundaryTimeRef = useRef(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handlePopState = () => {
      setPathname(window.location.pathname);
    };

    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, []);

  useEffect(() => {
    stopReadAloud();
  }, [pathname]);

  useEffect(() => {
    setNativeShareSupported(
      typeof navigator !== "undefined" && typeof navigator.share === "function"
    );
  }, []);

  useEffect(() => {
    return () => {
      stopReadAloud();
    };
  }, []);

  useEffect(() => {
    setProfileDetailsOpen(pathname === "/profile");
    setProfileEditOpen(pathname === "/profile/edit");
    setSettingsOpen(
      pathname === "/settings" ||
      pathname === "/settings/aperonix" ||
      pathname === "/settings/danger-zone"
    );
    setAperonixSettingOpen(pathname === "/settings/aperonix");
    setDangerZoneOpen(pathname === "/settings/danger-zone");
    setAccountDeleteOpen(pathname === "/account/delete");

    if (!pathname.startsWith("/profile/edit")) {
      setPhotoEditorOpen(false);
    }

    setProfileOpen(false);
    setOpenMenuId(null);
  }, [pathname]);

  useEffect(() => {
    let mounted = true;

    async function loadHistory() {
      try {
        const user = await ensureAuthenticatedUser();

        await supabase.from("profiles").upsert(
          { id: user.id },
          { onConflict: "id" }
        );

        const { data: profileRow } = await supabase
          .from("profiles")
          .select("first_name,last_name,email,date_of_birth,gender,phone_country_code,phone_number,avatar_url,avatar_path,aperonix_setting")
          .eq("id", user.id)
          .maybeSingle();

        if (mounted) {
          setProfile({
            firstName: profileRow?.first_name ?? "",
            lastName: profileRow?.last_name ?? "",
            email: profileRow?.email ?? user.email ?? "",
            dateOfBirth: profileRow?.date_of_birth ?? "",
            gender: profileRow?.gender ?? "",
            phoneCountryCode: profileRow?.phone_country_code ?? "+91",
            phoneNumber: profileRow?.phone_number ?? "",
            accountCreatedAt: user.created_at ?? "",
            avatarUrl: profileRow?.avatar_url ?? "",
            avatarPath: profileRow?.avatar_path ?? ""
          });
          setAperonixSetting(profileRow?.aperonix_setting ?? "");
          setSettingsDraft(profileRow?.aperonix_setting ?? "");
        }

        const { data: chats, error: chatsError } = await supabase
          .from("chat_sessions")
          .select("id,title,created_at,updated_at,is_pinned,branch_from_chat_id,branch_from_message_id")
          .eq("user_id", user.id)
          .order("is_pinned", { ascending: false })
          .order("updated_at", { ascending: false });

        if (chatsError) throw chatsError;

        const chatIds = (chats ?? []).map((chat) => chat.id);
        let messageRows: Array<{
          id: string;
          chat_id: string;
          role: ChatMessage["role"];
          content: string;
          created_at: string;
        }> = [];

        if (chatIds.length > 0) {
          const { data: rows, error: messagesError } = await supabase
            .from("chat_messages")
            .select("id,chat_id,role,content,created_at")
            .in("chat_id", chatIds)
            .order("created_at", { ascending: true });

          if (messagesError) throw messagesError;
          messageRows = rows ?? [];
        }

        let attachmentRows: Array<{
          id: string;
          chat_id: string;
          message_id: string;
          file_name: string;
          mime_type: string;
          size_bytes: number;
          storage_path: string;
          created_at: string;
        }> = [];

        if (chatIds.length > 0) {
          const { data: rows, error: attachmentsError } = await supabase
            .from("chat_attachments")
            .select("id,chat_id,message_id,file_name,mime_type,size_bytes,storage_path,created_at")
            .in("chat_id", chatIds)
            .order("created_at", { ascending: true });

          if (
            attachmentsError &&
            !/does not exist|relation .*chat_attachments/i.test(attachmentsError.message)
          ) {
            throw attachmentsError;
          }

          attachmentRows = rows ?? [];
        }

        const attachmentsByMessageId = new Map<string, ChatAttachment[]>();

        for (const row of attachmentRows) {
          const items = attachmentsByMessageId.get(row.message_id) ?? [];
          items.push({
            id: row.id,
            chatId: row.chat_id,
            messageId: row.message_id,
            fileName: row.file_name,
            mimeType: row.mime_type,
            sizeBytes: Number(row.size_bytes),
            storagePath: row.storage_path,
            createdAt: new Date(row.created_at).getTime()
          });
          attachmentsByMessageId.set(row.message_id, items);
        }

        const loaded: ChatSession[] = (chats ?? []).map((chat) => ({
          id: chat.id,
          title: chat.title,
          messages: messageRows
            .filter((message) => message.chat_id === chat.id)
            .map(({ id, role, content, created_at }) => ({
              id,
              role,
              content,
              attachments: attachmentsByMessageId.get(id) ?? [],
              createdAt: new Date(created_at).getTime()
            })),
          createdAt: new Date(chat.created_at).getTime(),
          updatedAt: new Date(chat.updated_at).getTime(),
          isPinned: Boolean(chat.is_pinned),
          branchFromChatId: chat.branch_from_chat_id ?? null,
          branchFromMessageId: chat.branch_from_message_id ?? null
        }));

        if (!mounted) return;

        const assistantMessageIds = messageRows
          .filter((message) => message.role === "assistant")
          .map((message) => message.id);

        if (assistantMessageIds.length > 0) {
          const { data: feedbackRows, error: feedbackError } = await supabase
            .from("message_feedback")
            .select("message_id,feedback")
            .eq("user_id", user.id)
            .in("message_id", assistantMessageIds);

          if (feedbackError && !/does not exist|relation .*message_feedback/i.test(feedbackError.message)) {
            console.error("Feedback load error:", feedbackError);
          }

          if (mounted && feedbackRows) {
            setFeedbackByMessageId(
              Object.fromEntries(
                feedbackRows.map((row) => [row.message_id, row.feedback as FeedbackType])
              )
            );
          }
        }

        if (loaded.length > 0) {
          setSessions(loaded);
          setActiveSessionId(loaded[0].id);
        } else {
          const { data: created, error: createError } = await supabase
            .from("chat_sessions")
            .insert({ user_id: user.id, title: "New chat" })
            .select("id,title,created_at,updated_at,is_pinned,branch_from_chat_id,branch_from_message_id")
            .single();

          if (createError) throw createError;

          const initial: ChatSession = {
            id: created.id,
            title: created.title,
            messages: [],
            createdAt: new Date(created.created_at).getTime(),
            updatedAt: new Date(created.updated_at).getTime(),
            isPinned: Boolean(created.is_pinned),
            branchFromChatId: created.branch_from_chat_id ?? null,
            branchFromMessageId: created.branch_from_message_id ?? null
          };

          setSessions([initial]);
          setActiveSessionId(initial.id);
        }
      } catch (error) {
        console.error("Aperonix history load error:", error);

        if (!mounted) return;
        const fallback = createLocalSession();
        setSessions([fallback]);
        setActiveSessionId(fallback.id);
      }
    }

    void loadHistory();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (sessions.length === 0) return;

    const chatMatch = pathname.match(/^\/chat\/([^/]+)$/);
    if (chatMatch) {
      const requestedId = decodeURIComponent(chatMatch[1]);
      const requestedSession = sessions.find((session) => session.id === requestedId);

      if (requestedSession) {
        setActiveSessionId(requestedSession.id);
      } else {
        const fallback = sessions[0];
        setActiveSessionId(fallback.id);
        navigate(`/chat/${fallback.id}`);
      }
    } else if (pathname === "/chat") {
      setActiveSessionId((current) =>
        sessions.some((session) => session.id === current) ? current : sessions[0].id
      );
    }
  }, [pathname, sessions]);

  const activeSession =
    sessions.find((session) => session.id === activeSessionId) ?? sessions[0];

  const messages = activeSession?.messages ?? [];
  const isEmptyChat = Boolean(activeSession && messages.length === 0);

  const canSend = useMemo(
    () =>
      (input.trim().length > 0 || pendingFiles.length > 0) &&
      !isLoading &&
      Boolean(activeSession),
    [input, isLoading, activeSession]
  );

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  useEffect(() => {
    const element = document.querySelector<HTMLTextAreaElement>(
      ".composer textarea"
    );
    if (!element) return;
    element.style.height = "auto";
    element.style.height = `${Math.min(element.scrollHeight, 156)}px`;
    element.scrollTop = element.scrollHeight;
  }, [input]);

  function selectSession(id: string) {
    if (isLoading) return;
    stopReadAloud();
    setActiveSessionId(id);
    setOpenMenuId(null);
    setIsSidebarOpen(false);
    navigate(`/chat/${id}`);
  }

  async function handleNewChat() {
    if (isLoading) return;
    stopReadAloud();

    try {
      const user = await ensureAuthenticatedUser();
      const { data, error } = await supabase
        .from("chat_sessions")
        .insert({ user_id: user.id, title: "New chat" })
        .select("id,title,created_at,updated_at,is_pinned,branch_from_chat_id,branch_from_message_id")
        .single();

      if (error) throw error;

      const next: ChatSession = {
        id: data.id,
        title: data.title,
        messages: [],
        createdAt: new Date(data.created_at).getTime(),
        updatedAt: new Date(data.updated_at).getTime(),
        isPinned: Boolean(data.is_pinned),
        branchFromChatId: data.branch_from_chat_id ?? null,
        branchFromMessageId: data.branch_from_message_id ?? null
      };

      setSessions((current) => sortSessions([...current, next]));
      setActiveSessionId(next.id);
      navigate(`/chat/${next.id}`);
    } catch (error) {
      console.error("New chat error:", error);
    }

    setInput("");
    setOpenMenuId(null);
    setIsSidebarOpen(false);
  }

  function handleDelete(session: ChatSession) {
    if (isLoading) return;
    setOpenMenuId(null);
    setDeleteSession(session);
  }

  async function confirmDelete() {
    if (!deleteSession || isLoading) return;

    const session = deleteSession;
    setDeleteSession(null);

    const { error } = await supabase
      .from("chat_sessions")
      .delete()
      .eq("id", session.id);

    if (error) {
      console.error("Delete chat error:", error);
      return;
    }

    const remaining = sessions.filter((item) => item.id !== session.id);
    setSessions(remaining);

    if (session.id === activeSessionId) {
      if (remaining.length > 0) {
        setActiveSessionId(remaining[0].id);
        navigate(`/chat/${remaining[0].id}`);
      } else {
        await handleNewChat();
      }
    }
  }

  function handleRename(session: ChatSession) {
    if (isLoading) return;
    setOpenMenuId(null);
    setRenameSession(session);
    setRenameValue(session.title);
  }

  async function confirmRename() {
    if (!renameSession || isLoading) return;

    const nextTitle = renameValue.trim();
    if (!nextTitle || nextTitle === renameSession.title) {
      setRenameSession(null);
      return;
    }

    const session = renameSession;
    const { error } = await supabase
      .from("chat_sessions")
      .update({ title: nextTitle, updated_at: new Date().toISOString() })
      .eq("id", session.id);

    if (error) {
      console.error("Rename chat error:", error);
      return;
    }

    setSessions((current) =>
      current.map((item) =>
        item.id === session.id
          ? { ...item, title: nextTitle, updatedAt: Date.now() }
          : item
      )
    );
    setRenameSession(null);
  }

  async function handlePin(session: ChatSession) {
    if (isLoading) return;
    setOpenMenuId(null);

    const nextPinned = !session.isPinned;
    const { error } = await supabase
      .from("chat_sessions")
      .update({
        is_pinned: nextPinned
      })
      .eq("id", session.id);

    if (error) {
      console.error("Pin chat error:", error);
      return;
    }

    setSessions((current) =>
      sortSessions(
        current.map((item) =>
          item.id === session.id
            ? { ...item, isPinned: nextPinned }
            : item
        )
      )
    );

    setPinFlashId(session.id);
    window.setTimeout(() => {
      setPinFlashId((current) => (current === session.id ? null : current));
    }, 650);
  }

  async function handleDuplicate(session: ChatSession) {
    if (isLoading) return;
    setOpenMenuId(null);

    try {
      const user = await ensureAuthenticatedUser();
      const title = `${session.title} (copy)`;

      const { data: copy, error: chatError } = await supabase
        .from("chat_sessions")
        .insert({
          user_id: user.id,
          title,
          is_pinned: false,
          branch_from_chat_id: session.branchFromChatId ?? null,
          branch_from_message_id: session.branchFromMessageId ?? null
        })
        .select("id,title,created_at,updated_at,is_pinned,branch_from_chat_id,branch_from_message_id")
        .single();

      if (chatError) throw chatError;

      const messagesToCopy = session.messages
        .filter((message) => message.role !== "system")
        .map((message) => ({
          chat_id: copy.id,
          user_id: user.id,
          role: message.role,
          content: message.content
        }));

      let copiedRows: Array<{ id: string; created_at: string }> = [];

      if (messagesToCopy.length > 0) {
        const { data: insertedRows, error: messageError } = await supabase
          .from("chat_messages")
          .insert(messagesToCopy)
          .select("id,created_at");

        if (messageError) throw messageError;
        copiedRows = insertedRows ?? [];
      }

      let copiedIndex = 0;
      const duplicatedMessages = session.messages.map((message) => {
        if (message.role === "system") return message;

        const copiedRow = copiedRows[copiedIndex++];
        return {
          ...message,
          id: copiedRow?.id,
          createdAt: copiedRow ? new Date(copiedRow.created_at).getTime() : message.createdAt
        };
      });

      const duplicate: ChatSession = {
        id: copy.id,
        title: copy.title,
        messages: duplicatedMessages,
        createdAt: new Date(copy.created_at).getTime(),
        updatedAt: new Date(copy.updated_at).getTime(),
        isPinned: false,
        branchFromChatId: copy.branch_from_chat_id ?? null,
        branchFromMessageId: copy.branch_from_message_id ?? null
      };

      setSessions((current) => sortSessions([duplicate, ...current]));
      setActiveSessionId(duplicate.id);
      navigate(`/chat/${duplicate.id}`);
    } catch (error) {
      console.error("Duplicate chat error:", error);
    }
  }

  async function saveProfile() {
    if (profileSaving) return;

    setProfileSaving(true);
    const { data: userData } = await supabase.auth.getUser();

    if (!userData.user) {
      setProfileSaving(false);
      return;
    }

    const nextProfile = {
      ...profileDraft,
      firstName: profileDraft.firstName.trim(),
      lastName: profileDraft.lastName.trim(),
      phoneCountryCode: profileDraft.phoneCountryCode || "+91",
      phoneNumber: profileDraft.phoneNumber.replace(/\D/g, "")
    };

    const { error: profileError } = await supabase
      .from("profiles")
      .update({
        first_name: nextProfile.firstName,
        last_name: nextProfile.lastName,
        date_of_birth: nextProfile.dateOfBirth || null,
        gender: nextProfile.gender || null,
        phone_country_code: nextProfile.phoneCountryCode,
        phone_number: nextProfile.phoneNumber
      })
      .eq("id", userData.user.id);

    if (profileError) {
      console.error("Profile update error:", profileError);
      setProfileSaving(false);
      return;
    }

    const { error: metadataError } = await supabase.auth.updateUser({
      data: {
        first_name: nextProfile.firstName,
        last_name: nextProfile.lastName,
        date_of_birth: nextProfile.dateOfBirth || null,
        gender: nextProfile.gender || null,
        phone_country_code: nextProfile.phoneCountryCode,
        phone_number: nextProfile.phoneNumber
      }
    });

    if (metadataError) {
      console.error("Profile metadata update error:", metadataError);
    }

    // Keep the live profile state and editor draft in sync so the
    // fallback avatar always uses the newly saved first letter.
    setProfile(nextProfile);
    setProfileDraft(nextProfile);
    setProfileSaving(false);
    setProfileEditOpen(false);
    navigate("/profile");
  }

  async function deleteAccount() {
    if (accountDeleting || accountDeleteText !== "DELETE MY ACCOUNT") return;

    setAccountDeleteError("");
    setAccountDeleting(true);

    try {
      let { data: sessionData } = await supabase.auth.getSession();

      if (!sessionData.session) {
        const refreshed = await supabase.auth.refreshSession();
        sessionData = refreshed.data;
      }

      const accessToken = sessionData.session?.access_token;
      if (!accessToken) throw new Error("Your session has expired.");

      const response = await fetch("/api/account/delete", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Could not delete the account.");
      }

      await supabase.auth.signOut();
      window.location.href = "/";
    } catch (error) {
      console.error("Account deletion error:", error);
      setAccountDeleteError(
        error instanceof Error
          ? error.message
          : "Could not permanently delete the account."
      );
      setAccountDeleting(false);
    }
  }

  function openProfileDetails() {
    setProfileOpen(false);
    setProfileDetailsOpen(true);
    setProfileEditOpen(false);
    navigate("/profile");
  }

  function openProfileEditor() {
    setProfileDraft(profile);
    setProfileEditOpen(true);
    setProfileOpen(false);
    setProfileDetailsOpen(false);
    navigate("/profile/edit");
  }


  function openSettings() {
    setSettingsError("");
    setAperonixSettingOpen(false);
    setSettingsOpen(true);
    setProfileOpen(false);
    setProfileDetailsOpen(false);
    setProfileEditOpen(false);
    navigate("/settings");
  }

  function openAperonixSetting() {
    setSettingsDraft(aperonixSetting);
    setSettingsError("");
    setAperonixSettingOpen(true);
    setDangerZoneOpen(false);
    navigate("/settings/aperonix");
  }

  function openDangerZone() {
    setDangerZoneOpen(true);
    setAperonixSettingOpen(false);
    setSettingsError("");
    navigate("/settings/danger-zone");
  }

  async function saveAperonixSetting() {
    if (settingsSaving) return;

    const cleaned = settingsDraft.trim();
    if (cleaned.length > 4000) {
      setSettingsError("Keep your Aperonix setting under 4000 characters.");
      return;
    }

    setSettingsSaving(true);
    setSettingsError("");

    try {
      const user = await ensureAuthenticatedUser();

      const { error } = await supabase
        .from("profiles")
        .update({ aperonix_setting: cleaned || null })
        .eq("id", user.id);

      if (error) throw error;

      setAperonixSetting(cleaned);
      setSettingsDraft(cleaned);
      setAperonixSettingOpen(false);
      setSettingsOpen(true);
      navigate("/settings");
    } catch (error) {
      console.error("Aperonix setting save error:", error);
      setSettingsError(
        error instanceof Error
          ? error.message
          : "Could not save your Aperonix setting."
      );
    } finally {
      setSettingsSaving(false);
    }
  }

  function getProfileDisplayName() {
    return [profile.firstName, profile.lastName].filter(Boolean).join(" ").trim() || "Your profile";
  }

  function getProfileInitial() {
    const firstName = profile.firstName.trim();
    const lastName = profile.lastName.trim();
    return (firstName || lastName || "A").charAt(0).toUpperCase();
  }

  function renderProfileAvatar(className = "profile-avatar") {
    return profile.avatarUrl ? (
      <img
        src={profile.avatarUrl}
        alt={getProfileDisplayName()}
        className={className}
      />
    ) : (
      <span className={className}>{getProfileInitial()}</span>
    );
  }

  function openPhotoPicker() {
    photoInputRef.current?.click();
  }

  function handlePhotoSelection(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setPhotoError("Please choose an image file.");
      return;
    }

    if (file.size > 8 * 1024 * 1024) {
      setPhotoError("Please choose an image smaller than 8 MB.");
      return;
    }

    if (photoPreviewUrl) {
      URL.revokeObjectURL(photoPreviewUrl);
    }

    photoFileRef.current = file;
    setPhotoPreviewUrl(URL.createObjectURL(file));
    setPhotoFilterIndex(0);
    setPhotoZoom(1);
    setPhotoRotation(0);
    setPhotoOffsetX(0);
    setPhotoOffsetY(0);
    setPhotoError("");
    setPhotoEditorOpen(true);
  }

  function closePhotoEditor() {
    if (photoPreviewUrl) {
      URL.revokeObjectURL(photoPreviewUrl);
    }

    photoFileRef.current = null;
    setPhotoPreviewUrl("");
    setPhotoEditorOpen(false);
    setPhotoError("");
    setPhotoSaving(false);
  }

  async function removeProfilePhoto() {
    if (photoRemoving || photoSaving || !profile.avatarUrl) return;

    setPhotoRemoving(true);
    setPhotoError("");

    try {
      const user = await ensureAuthenticatedUser();

      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          avatar_url: null,
          avatar_path: null
        })
        .eq("id", user.id);

      if (profileError) throw profileError;

      if (profile.avatarPath) {
        const { error: storageError } = await supabase.storage
          .from("avatars")
          .remove([profile.avatarPath]);

        if (storageError) {
          console.error("Profile photo storage cleanup error:", storageError);
        }
      }

      setProfile((current) => ({
        ...current,
        avatarUrl: "",
        avatarPath: ""
      }));
      setProfileDraft((current) => ({
        ...current,
        avatarUrl: "",
        avatarPath: ""
      }));
    } catch (error) {
      console.error("Profile photo remove error:", error);
      setPhotoError(
        error instanceof Error ? error.message : "Could not remove the profile photo."
      );
    } finally {
      setPhotoRemoving(false);
    }
  }

  async function saveProfilePhoto() {
    const file = photoFileRef.current;
    if (!file || !photoPreviewUrl || photoSaving) return;

    setPhotoSaving(true);
    setPhotoError("");

    try {
      const user = await ensureAuthenticatedUser();

      const image = new Image();
      image.src = photoPreviewUrl;
      await new Promise<void>((resolve, reject) => {
        image.onload = () => resolve();
        image.onerror = () => reject(new Error("Could not read this image."));
      });

      const size = 512;
      const canvas = document.createElement("canvas");
      canvas.width = size;
      canvas.height = size;

      const context = canvas.getContext("2d");
      if (!context) throw new Error("Could not prepare the photo editor.");

      context.clearRect(0, 0, size, size);
      context.save();
      context.translate(size / 2, size / 2);
      context.rotate((photoRotation * Math.PI) / 180);

      const baseScale = Math.max(size / image.width, size / image.height);
      const scale = baseScale * photoZoom;
      const drawWidth = image.width * scale;
      const drawHeight = image.height * scale;
      const drawX = -drawWidth / 2 + photoOffsetX;
      const drawY = -drawHeight / 2 + photoOffsetY;

      context.filter = PROFILE_FILTERS[photoFilterIndex].css;
      context.drawImage(image, drawX, drawY, drawWidth, drawHeight);
      context.restore();

      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, "image/webp", 0.9)
      );

      if (!blob) throw new Error("Could not create the edited photo.");

      const safeName = file.name.replace(/[^a-z0-9]/gi, "-").toLowerCase();
      const path = `${user.id}/avatar-${Date.now()}-${safeName || "photo"}.webp`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(path, blob, {
          contentType: "image/webp",
          upsert: false
        });

      if (uploadError) throw uploadError;

      const { data: publicData } = supabase.storage
        .from("avatars")
        .getPublicUrl(path);

      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          avatar_url: publicData.publicUrl,
          avatar_path: path
        })
        .eq("id", user.id);

      if (profileError) {
        await supabase.storage.from("avatars").remove([path]);
        throw profileError;
      }

      if (profile.avatarPath && profile.avatarPath !== path) {
        await supabase.storage.from("avatars").remove([profile.avatarPath]);
      }

      setProfile((current) => ({
        ...current,
        avatarUrl: publicData.publicUrl,
        avatarPath: path
      }));
      setProfileDraft((current) => ({
        ...current,
        avatarUrl: publicData.publicUrl,
        avatarPath: path
      }));

      closePhotoEditor();
    } catch (error) {
      console.error("Profile photo save error:", error);
      setPhotoError(
        error instanceof Error ? error.message : "Could not save your profile photo."
      );
      setPhotoSaving(false);
    }
  }

  function updateProfileDob(part: "day" | "month" | "year", value: string) {
    const parts = profileDraft.dateOfBirth
      ? profileDraft.dateOfBirth.split("-")
      : ["", "", ""];

    let year = parts[0] || "";
    let month = parts[1] || "";
    let day = parts[2] || "";

    if (part === "year") year = value;
    if (part === "month") month = value.padStart(2, "0");
    if (part === "day") day = value.padStart(2, "0");

    if (year && month && day) {
      setProfileDraft({
        ...profileDraft,
        dateOfBirth: `${year}-${month}-${day}`
      });
    } else {
      setProfileDraft({
        ...profileDraft,
        dateOfBirth: `${year}-${month}-${day}`
      });
    }
  }

  function messageReadAloudKey(message: ChatMessage, index: number) {
    return `${activeSession?.id ?? "session"}:${message.id ?? `index-${index}`}`;
  }

  function wordIndexAtCharacter(text: string, characterIndex: number) {
    const safeIndex = Math.max(0, Math.min(characterIndex, text.length));
    const before = text.slice(0, safeIndex);
    const words = before.match(/\S+/g);
    return Math.max(0, (words?.length ?? 1) - 1);
  }

  function buildSpeechChunks(text: string) {
    const words = text.split(/\s+/).filter(Boolean);
    const chunks: Array<{
      text: string;
      wordOffset: number;
      languageCode: "hi-IN" | "en-IN";
    }> = [];

    if (words.length === 0) return chunks;

    // A Hindi response or a Hinglish response stays on the Hindi voice.
    // Only responses without Devanagari use the English voice.
    const languageCode: "hi-IN" | "en-IN" =
      /[\u0900-\u097F]/u.test(text) ? "hi-IN" : "en-IN";

    const WORDS_PER_CHUNK = 170;

    for (let offset = 0; offset < words.length; offset += WORDS_PER_CHUNK) {
      const chunkWords = words.slice(offset, offset + WORDS_PER_CHUNK);
      chunks.push({
        text: chunkWords.join(" "),
        wordOffset: offset,
        languageCode
      });
    }

    return chunks;
  }

  function pickHindiVoice(voices: SpeechSynthesisVoice[]) {
    return (
      voices.find((voice) => /^hi-IN$/i.test(voice.lang)) ??
      voices.find((voice) => /^hi(?:[-_])/i.test(voice.lang)) ??
      voices.find((voice) => /\bHindi\b/i.test(voice.name))
    );
  }

  function pickEnglishVoice(voices: SpeechSynthesisVoice[]) {
    const englishVoices = voices.filter((voice) => /^en(?:[-_])/i.test(voice.lang));
    const preferred = [
      "Microsoft Jenny",
      "Microsoft Zira",
      "Google UK English Female",
      "Google US English Female",
      "Samantha",
      "Karen",
      "Moira",
      "Ava"
    ];

    for (const name of preferred) {
      const match = englishVoices.find((voice) =>
        voice.name.toLocaleLowerCase().includes(name.toLocaleLowerCase())
      );
      if (match) return match;
    }

    return (
      englishVoices.find((voice) => /^en-IN$/i.test(voice.lang)) ??
      englishVoices.find((voice) => /^en-(GB|US|AU|CA)$/i.test(voice.lang)) ??
      englishVoices[0]
    );
  }

  function finishReadAloud(generation: number) {
    if (generation !== readAloudGenerationRef.current) return;

    readAloudUtteranceRef.current = null;
    setReadAloudMessageKey(null);
    setReadAloudStatus("idle");
    setReadAloudWordIndex(null);
  }

  function stopReadAloud() {
    readAloudGenerationRef.current += 1;

    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }

    if (
      typeof window !== "undefined" &&
      readAloudHighlightTimerRef.current !== null
    ) {
      window.clearInterval(readAloudHighlightTimerRef.current);
      readAloudHighlightTimerRef.current = null;
    }

    readAloudBoundaryWordRef.current = null;
    readAloudBoundaryTimeRef.current = 0;
    readAloudUtteranceRef.current = null;
    setReadAloudMessageKey(null);
    setReadAloudStatus("idle");
    setReadAloudWordIndex(null);
  }

  function startReadAloud(message: ChatMessage, index: number) {
    const text = toSpeechText(message.content);

    if (
      !text ||
      typeof window === "undefined" ||
      !("speechSynthesis" in window) ||
      typeof SpeechSynthesisUtterance === "undefined"
    ) {
      return;
    }

    stopReadAloud();

    const generation = readAloudGenerationRef.current + 1;
    readAloudGenerationRef.current = generation;
    const messageKey = messageReadAloudKey(message, index);
    const chunks = buildSpeechChunks(text);

    if (chunks.length === 0) return;

    setReadAloudMessageKey(messageKey);
    setReadAloudStatus("loading");
    setReadAloudWordIndex(null);

    let started = false;
    let chunkIndex = 0;

    const speakCurrentChunk = (voices: SpeechSynthesisVoice[]) => {
      if (started || generation !== readAloudGenerationRef.current) return;
      started = true;

      const speakChunk = () => {
        if (generation !== readAloudGenerationRef.current) return;

        const chunk = chunks[chunkIndex];
        if (!chunk) {
          finishReadAloud(generation);
          return;
        }

        const utterance = new SpeechSynthesisUtterance(chunk.text);
        const voice =
          chunk.languageCode === "hi-IN"
            ? pickHindiVoice(voices)
            : pickEnglishVoice(voices);

        if (voice) utterance.voice = voice;

        utterance.lang = chunk.languageCode;
        utterance.rate = 0.94;
        utterance.pitch = chunk.languageCode === "hi-IN" ? 1.02 : 1.03;
        utterance.volume = 1;

        const chunkWords = chunk.text.split(/\s+/).filter(Boolean);

        const clearHighlightTimer = () => {
          if (readAloudHighlightTimerRef.current !== null) {
            window.clearInterval(readAloudHighlightTimerRef.current);
            readAloudHighlightTimerRef.current = null;
          }
        };

        const startHighlightFallback = () => {
          clearHighlightTimer();
          readAloudBoundaryWordRef.current = null;
          readAloudBoundaryTimeRef.current = performance.now();

          // SpeechSynthesis word-boundary events are inconsistent across
          // browser/OS voice engines, especially for Hindi. This fallback
          // keeps Hindi highlighting moving and is resynchronised whenever
          // a native boundary event arrives.
          const approximateWordMs =
            chunk.languageCode === "hi-IN" ? 290 : 250;

          readAloudHighlightTimerRef.current = window.setInterval(() => {
            if (generation !== readAloudGenerationRef.current) {
              clearHighlightTimer();
              return;
            }

            const elapsed = performance.now() - readAloudBoundaryTimeRef.current;
            const baseWord = readAloudBoundaryWordRef.current ?? -1;
            const estimatedAdvance = Math.floor(elapsed / approximateWordMs);
            const localIndex = Math.min(
              chunkWords.length - 1,
              Math.max(0, baseWord + estimatedAdvance)
            );

            setReadAloudWordIndex(chunk.wordOffset + localIndex);
          }, 90);
        };

        utterance.onstart = () => {
          if (generation !== readAloudGenerationRef.current) return;
          setReadAloudStatus("speaking");
          setReadAloudWordIndex(chunk.wordOffset);
          startHighlightFallback();
        };

        utterance.onboundary = (event) => {
          if (generation !== readAloudGenerationRef.current) return;
          if (event.name && event.name !== "word") return;

          const localIndex = wordIndexAtCharacter(
            chunk.text,
            event.charIndex ?? 0
          );

          readAloudBoundaryWordRef.current = Math.max(0, localIndex);
          readAloudBoundaryTimeRef.current = performance.now();
          setReadAloudWordIndex(chunk.wordOffset + localIndex);
        };

        utterance.onend = () => {
          if (generation !== readAloudGenerationRef.current) return;

          clearHighlightTimer();
          readAloudUtteranceRef.current = null;
          readAloudBoundaryWordRef.current = null;
          readAloudBoundaryTimeRef.current = 0;
          chunkIndex += 1;
          speakChunk();
        };

        utterance.onerror = () => {
          if (generation !== readAloudGenerationRef.current) return;

          clearHighlightTimer();
          finishReadAloud(generation);
        };

        readAloudUtteranceRef.current = utterance;
        window.speechSynthesis.speak(utterance);
      };

      speakChunk();
    };

    const voices = window.speechSynthesis.getVoices();

    if (voices.length > 0) {
      speakCurrentChunk(voices);
      return;
    }

    const handleVoicesChanged = () => {
      const availableVoices = window.speechSynthesis.getVoices();
      if (availableVoices.length > 0) {
        window.speechSynthesis.removeEventListener(
          "voiceschanged",
          handleVoicesChanged
        );
        speakCurrentChunk(availableVoices);
      }
    };

    window.speechSynthesis.addEventListener(
      "voiceschanged",
      handleVoicesChanged
    );

    window.setTimeout(() => {
      window.speechSynthesis.removeEventListener(
        "voiceschanged",
        handleVoicesChanged
      );
      speakCurrentChunk(window.speechSynthesis.getVoices());
    }, 900);
  }

  async function copyMessage(message: ChatMessage) {
    try {
      await navigator.clipboard.writeText(message.content);
      const key = message.id ?? `copy-${message.content.slice(0, 24)}`;
      setCopiedMessageId(key);
      window.setTimeout(() => {
        setCopiedMessageId((current) => (current === key ? null : current));
      }, 1400);
    } catch (error) {
      console.error("Copy message error:", error);
    }
  }

  async function copyTextToClipboard(text: string) {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return;
    }

    const helper = document.createElement("textarea");
    helper.value = text;
    helper.setAttribute("readonly", "");
    helper.style.position = "fixed";
    helper.style.opacity = "0";
    document.body.appendChild(helper);
    helper.select();
    const copied = document.execCommand("copy");
    helper.remove();

    if (!copied) throw new Error("Could not copy the link.");
  }

  async function getAccessToken() {
    let { data: sessionData } = await supabase.auth.getSession();

    if (!sessionData.session) {
      const refreshed = await supabase.auth.refreshSession();
      sessionData = refreshed.data;
    }

    const accessToken = sessionData.session?.access_token;
    if (!accessToken) throw new Error("Your session has expired. Please sign in again.");

    return accessToken;
  }

  async function createShareLink(message: ChatMessage) {
    if (!activeSession || !message.id) {
      throw new Error("This response is not ready to share yet.");
    }

    const accessToken = await getAccessToken();

    const response = await fetch("/api/share", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + accessToken
      },
      body: JSON.stringify({
        chatId: activeSession.id,
        messageId: message.id
      })
    });

    const data = await response.json();
    if (!response.ok || typeof data.url !== "string") {
      throw new Error(data.error || "Could not create a share link.");
    }

    return data.url as string;
  }

  async function createShareChatLink(session: ChatSession) {
    const accessToken = await getAccessToken();

    const response = await fetch("/api/share-chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + accessToken
      },
      body: JSON.stringify({
        chatId: session.id
      })
    });

    const data = await response.json();
    if (!response.ok || typeof data.url !== "string") {
      throw new Error(data.error || "Could not create a chat share link.");
    }

    return data.url as string;
  }

  async function openShareModal(message: ChatMessage) {
    setShareModal({
      url: null,
      content: message.content,
      kind: message.role === "user" ? "prompt" : "response",
      copied: false,
      preparing: true
    });

    try {
      const url = await createShareLink(message);
      setShareModal((current) =>
        current && current.content === message.content && current.kind !== "chat"
          ? { ...current, url, preparing: false }
          : current
      );
    } catch (error) {
      console.error("Create share link error:", error);
      setShareModal((current) =>
        current && current.content === message.content && current.kind !== "chat"
          ? { ...current, preparing: false }
          : current
      );
    }
  }

  async function openChatShareModal(session: ChatSession) {
    if (isLoading) return;

    stopReadAloud();
    const chatMessages = session.messages
      .filter((message) => message.role === "user" || message.role === "assistant")
      .map((message) => ({
        role: message.role as "user" | "assistant",
        content: message.content
      }));

    setOpenMenuId(null);
    setShareModal({
      url: null,
      content: "",
      kind: "chat",
      chatTitle: session.title,
      chatMessages,
      copied: false,
      preparing: true
    });

    try {
      const url = await createShareChatLink(session);
      setShareModal((current) =>
        current && current.kind === "chat" && current.chatTitle === session.title
          ? { ...current, url, preparing: false }
          : current
      );
    } catch (error) {
      console.error("Create chat share link error:", error);
      setShareModal((current) =>
        current && current.kind === "chat" && current.chatTitle === session.title
          ? { ...current, preparing: false }
          : current
      );
    }
  }

  async function shareViaDevice() {
    if (!shareModal?.url || typeof navigator === "undefined" || typeof navigator.share !== "function") return;

    try {
      await navigator.share({
        title:
          shareModal.kind === "chat"
            ? "Aperonix AI chat"
            : shareModal.kind === "prompt"
              ? "Aperonix AI prompt"
              : "Aperonix AI response",
        text:
          shareModal.kind === "chat"
            ? "A chat shared from Aperonix AI."
            : shareModal.kind === "prompt"
              ? "A prompt shared from Aperonix AI."
              : "A response shared from Aperonix AI.",
        url: shareModal.url
      });
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      console.error("Native share error:", error);
    }
  }

  async function copyShareLink() {
    if (!shareModal?.url) return;

    try {
      await copyTextToClipboard(shareModal.url);
      setShareModal((current) => current ? { ...current, copied: true } : current);
      window.setTimeout(() => {
        setShareModal((current) => current ? { ...current, copied: false } : current);
      }, 1600);
    } catch (error) {
      console.error("Copy share link error:", error);
    }
  }

  async function branchResponseInNewChat(message: ChatMessage) {
    if (isLoading || !activeSession || !message.id) return;

    stopReadAloud();
    setOpenMenuId(null);
    setShareModal(null);

    try {
      const user = await ensureAuthenticatedUser();

      const branchTitle = `${activeSession.title.replace(/ — Branch$/i, "")} — Branch`;

      const { data, error } = await supabase
        .from("chat_sessions")
        .insert({
          user_id: user.id,
          title: branchTitle,
          is_pinned: false,
          branch_from_chat_id: activeSession.id,
          branch_from_message_id: message.id
        })
        .select("id,title,created_at,updated_at,is_pinned,branch_from_chat_id,branch_from_message_id")
        .single();

      if (error) throw error;

      const next: ChatSession = {
        id: data.id,
        title: data.title,
        messages: [],
        createdAt: new Date(data.created_at).getTime(),
        updatedAt: new Date(data.updated_at).getTime(),
        isPinned: Boolean(data.is_pinned),
        branchFromChatId: data.branch_from_chat_id ?? activeSession.id,
        branchFromMessageId: data.branch_from_message_id ?? message.id
      };

      setSessions((current) => sortSessions([...current, next]));
      setActiveSessionId(next.id);
      setInput("");
      setIsSidebarOpen(false);
      navigate("/chat/" + next.id);
    } catch (error) {
      console.error("Branch response error:", error);
    }
  }
  async function handleFeedback(message: ChatMessage, feedback: FeedbackType) {
    if (isLoading || !activeSession || !message.id) return;

    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData.user) {
      console.error("Feedback auth error:", userError);
      return;
    }

    const user = userData.user;
    const userName =
      [profile.firstName, profile.lastName].filter(Boolean).join(" ").trim() ||
      user.email ||
      "Unknown user";
    const current = feedbackByMessageId[message.id];

    try {
      if (current === feedback) {
        const { error } = await supabase
          .from("message_feedback")
          .delete()
          .eq("user_id", user.id)
          .eq("message_id", message.id);

        if (error) throw error;

        setFeedbackByMessageId((state) => {
          const next = { ...state };
          delete next[message.id as string];
          return next;
        });
        return;
      }

      const { error } = await supabase
        .from("message_feedback")
        .upsert(
          {
            user_id: user.id,
            user_name: userName,
            chat_id: activeSession.id,
            message_id: message.id,
            feedback,
            updated_at: new Date().toISOString()
          },
          { onConflict: "user_id,message_id" }
        );

      if (error) throw error;

      setFeedbackByMessageId((state) => ({
        ...state,
        [message.id as string]: feedback
      }));
    } catch (error) {
      console.error("Save feedback error:", error);
    }
  }

  function startEditingUserMessage(message: ChatMessage) {
    if (isLoading || message.role !== "user" || !message.id) return;

    stopReadAloud();
    setOpenMenuId(null);
    setShareModal(null);
    setEditingMessageId(message.id);
    setInput(message.content);
    window.setTimeout(() => {
      document.querySelector<HTMLTextAreaElement>(".composer textarea")?.focus();
    }, 0);
  }

  function cancelEditingUserMessage() {
    if (isLoading) return;
    setEditingMessageId(null);
    setInput("");
  }

  async function deleteMessagesAfterIndex(
    session: ChatSession,
    keepThroughIndex: number,
    userId: string
  ) {
    const removedMessages = session.messages.slice(keepThroughIndex + 1);
    const removedMessageIds = removedMessages
      .map((message) => message.id)
      .filter((id): id is string => Boolean(id));
    const removedAssistantIds = removedMessages
      .filter((message) => message.role === "assistant")
      .map((message) => message.id)
      .filter((id): id is string => Boolean(id));

    if (removedAssistantIds.length > 0) {
      const { error: feedbackDeleteError } = await supabase
        .from("message_feedback")
        .delete()
        .eq("user_id", userId)
        .in("message_id", removedAssistantIds);

      if (feedbackDeleteError) {
        console.error("Delete removed feedback error:", feedbackDeleteError);
      }

      setFeedbackByMessageId((state) => {
        const next = { ...state };
        for (const id of removedAssistantIds) {
          delete next[id];
        }
        return next;
      });
    }

    if (removedMessageIds.length === 0) return;

    const { error: messageDeleteError } = await supabase
      .from("chat_messages")
      .delete()
      .eq("chat_id", session.id)
      .in("id", removedMessageIds);

    if (messageDeleteError) throw messageDeleteError;
  }

  async function retryMessage(messageIndex: number) {
    if (isLoading || !activeSession) return;

    const assistant = activeSession.messages[messageIndex];
    const previousUserIndex = activeSession.messages
      .slice(0, messageIndex)
      .map((message) => message.role)
      .lastIndexOf("user");

    if (!assistant || assistant.role !== "assistant" || previousUserIndex < 0) return;

    stopReadAloud();
    setIsLoading(true);

    try {
      const user = await ensureAuthenticatedUser();
      const retryContext = activeSession.messages.slice(0, previousUserIndex + 1);

      let { data: sessionData } = await supabase.auth.getSession();

      if (!sessionData.session) {
        const refreshed = await supabase.auth.refreshSession();
        sessionData = refreshed.data;
      }

      const accessToken = sessionData.session?.access_token;
      if (!accessToken) throw new Error("Your session has expired. Please sign in again.");

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`
        },
        body: JSON.stringify({
          messages: retryContext.map(({ role, content }) => ({ role, content })),
          aperonixSetting,
          branchFromChatId: activeSession.branchFromChatId ?? null,
          branchFromMessageId: activeSession.branchFromMessageId ?? null,
          chatId: activeSession.id,
          generateTitle: false
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Could not retry the response.");
      }

      const nextContent = data.message?.content || "I could not generate a response.";

      await deleteMessagesAfterIndex(activeSession, messageIndex, user.id);

      if (assistant.id) {
        await supabase
          .from("message_feedback")
          .delete()
          .eq("user_id", user.id)
          .eq("message_id", assistant.id);

        setFeedbackByMessageId((state) => {
          const next = { ...state };
          delete next[assistant.id as string];
          return next;
        });

        const { error: updateError } = await supabase
          .from("chat_messages")
          .update({ content: nextContent })
          .eq("id", assistant.id);

        if (updateError) throw updateError;
      } else {
        const { data: inserted, error: insertError } = await supabase
          .from("chat_messages")
          .insert({
            chat_id: activeSession.id,
            user_id: user.id,
            role: "assistant",
            content: nextContent
          })
          .select("id,created_at")
          .single();

        if (insertError) throw insertError;

        assistant.id = inserted.id;
        assistant.createdAt = new Date(inserted.created_at).getTime();
      }

      const nextMessages = [
        ...activeSession.messages.slice(0, messageIndex),
        { ...assistant, content: nextContent }
      ];

      setSessions((current) =>
        current.map((session) =>
          session.id === activeSession.id
            ? {
                ...session,
                messages: nextMessages,
                updatedAt: Date.now()
              }
            : session
        )
      );

      await supabase
        .from("chat_sessions")
        .update({ updated_at: new Date().toISOString() })
        .eq("id", activeSession.id);
    } catch (error) {
      console.error("Retry message error:", error);
    } finally {
      setIsLoading(false);
    }
  }

  function handleFileSelection(event: ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(event.target.files ?? []);
    event.target.value = "";
    setFilePickerOpen(false);

    if (selected.length === 0) return;

    if (editingMessageId) {
      setFileUploadError("Attachments can only be added to a new message.");
      return;
    }

    if (pendingFiles.length + selected.length > MAX_CHAT_FILES_PER_MESSAGE) {
      setFileUploadError(`You can upload up to ${MAX_CHAT_FILES_PER_MESSAGE} files with one prompt.`);
      return;
    }

    const invalid = selected.find((file) => {
      return !ALLOWED_FILE_EXTENSIONS.has(getFileExtension(file.name));
    });

    if (invalid) {
      setFileUploadError(`Unsupported file type: ${invalid.name}`);
      return;
    }

    const tooLarge = selected.find((file) => {
      const category = getFileLimitCategory(file);
      return file.size > FILE_SIZE_LIMITS[category];
    });

    if (tooLarge) {
      const category = getFileLimitCategory(tooLarge);
      setFileUploadError(
        `${tooLarge.name} is too large. Maximum for this file type is ${formatFileLimit(FILE_SIZE_LIMITS[category])}.`
      );
      return;
    }

    setPendingFiles((current) => [...current, ...selected]);
    setFileUploadError("");
  }

  function removePendingFile(index: number) {
    if (isLoading) return;
    setPendingFiles((current) =>
      current.filter((_, currentIndex) => currentIndex !== index)
    );
    setFileUploadError("");
  }

  function openFilePicker() {
    if (isLoading || editingMessageId) return;

    setFileUploadError("");
    setFilePickerOpen((current) => !current);
    window.setTimeout(() => fileInputRef.current?.click(), 0);
  }

  async function uploadChatFiles(
    userId: string,
    chatId: string,
    messageId: string,
    files: File[]
  ): Promise<ChatAttachment[]> {
    if (files.length === 0) return [];

    const uploadedPaths: string[] = [];

    try {
      const results: ChatAttachment[] = [];

      for (const file of files) {
        const safeName =
          file.name
            .replace(/[^a-zA-Z0-9._-]+/g, "-")
            .replace(/-+/g, "-")
            .slice(0, 120) || "file";

        const storagePath = `${userId}/${chatId}/${crypto.randomUUID()}-${safeName}`;

        const { error: uploadError } = await supabase.storage
          .from("chat-files")
          .upload(storagePath, file, {
            upsert: false,
            contentType: file.type || "application/octet-stream"
          });

        if (uploadError) throw uploadError;
        uploadedPaths.push(storagePath);

        const { data: attachment, error: attachmentError } = await supabase
          .from("chat_attachments")
          .insert({
            user_id: userId,
            chat_id: chatId,
            message_id: messageId,
            file_name: file.name,
            mime_type: file.type || "application/octet-stream",
            size_bytes: file.size,
            storage_path: storagePath
          })
          .select("id,chat_id,message_id,file_name,mime_type,size_bytes,storage_path,created_at")
          .single();

        if (attachmentError) throw attachmentError;

        results.push({
          id: attachment.id,
          chatId: attachment.chat_id,
          messageId: attachment.message_id,
          fileName: attachment.file_name,
          mimeType: attachment.mime_type,
          sizeBytes: Number(attachment.size_bytes),
          storagePath: attachment.storage_path,
          createdAt: new Date(attachment.created_at).getTime()
        });
      }

      return results;
    } catch (error) {
      if (uploadedPaths.length > 0) {
        await supabase.storage.from("chat-files").remove(uploadedPaths);
      }

      await supabase
        .from("chat_attachments")
        .delete()
        .eq("message_id", messageId)
        .eq("user_id", userId);

      await supabase
        .from("chat_messages")
        .delete()
        .eq("id", messageId)
        .eq("user_id", userId);

      throw error;
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const content =
      input.trim() ||
      (pendingFiles.length > 0 ? "Please analyze the attached file(s)." : "");

    if (!content || isLoading || !activeSession) return;

    stopReadAloud();
    setIsLoading(true);

    try {
      const user = await ensureAuthenticatedUser();

      let { data: sessionData } = await supabase.auth.getSession();

      if (!sessionData.session) {
        const refreshed = await supabase.auth.refreshSession();
        sessionData = refreshed.data;
      }

      const accessToken = sessionData.session?.access_token;
      if (!accessToken) {
        throw new Error("Your session has expired. Please sign in again.");
      }

      if (editingMessageId) {
        const editingIndex = activeSession.messages.findIndex(
          (message) => message.id === editingMessageId
        );
        const originalMessage = editingIndex >= 0
          ? activeSession.messages[editingIndex]
          : null;

        if (
          editingIndex < 0 ||
          !originalMessage ||
          originalMessage.role !== "user" ||
          !originalMessage.id
        ) {
          setEditingMessageId(null);
          setInput("");
          return;
        }

        const editedMessages: ChatMessage[] = [
          ...activeSession.messages.slice(0, editingIndex),
          {
            ...originalMessage,
            content
          }
        ];

        const response = await fetch("/api/chat", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`
          },
          body: JSON.stringify({
            messages: editedMessages,
            aperonixSetting,
            branchFromChatId: activeSession.branchFromChatId ?? null,
            branchFromMessageId: activeSession.branchFromMessageId ?? null,
            chatId: activeSession.id,
            generateTitle: false
          })
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Could not resend the edited message.");
        }

        const nextContent =
          data.message?.content || "I could not generate a response.";

        await deleteMessagesAfterIndex(activeSession, editingIndex, user.id);

        const { error: updateError } = await supabase
          .from("chat_messages")
          .update({ content })
          .eq("id", originalMessage.id);

        if (updateError) throw updateError;

        const assistantMessage: ChatMessage = {
          role: "assistant",
          content: nextContent
        };

        const { data: savedAssistantMessage, error: assistantSaveError } =
          await supabase
            .from("chat_messages")
            .insert({
              chat_id: activeSession.id,
              user_id: user.id,
              role: "assistant",
              content: assistantMessage.content
            })
            .select("id,created_at")
            .single();

        if (assistantSaveError) throw assistantSaveError;

        assistantMessage.id = savedAssistantMessage.id;
        assistantMessage.createdAt = new Date(
          savedAssistantMessage.created_at
        ).getTime();

        const shouldUpdateTitle =
          editingIndex === 0 &&
          (activeSession.title === "New chat" ||
            activeSession.title === makeTitle(originalMessage.content));

        const newTitle = shouldUpdateTitle
          ? makeTitle(content)
          : activeSession.title;

        await supabase
          .from("chat_sessions")
          .update({
            title: newTitle,
            updated_at: new Date().toISOString()
          })
          .eq("id", activeSession.id);

        setSessions((current) =>
          current.map((session) =>
            session.id === activeSession.id
              ? {
                  ...session,
                  title: newTitle,
                  messages: [...editedMessages, assistantMessage],
                  updatedAt: Date.now()
                }
              : session
          )
        );

        setEditingMessageId(null);
        setInput("");
        return;
      }

      setInput("");

      const { data: savedUserMessage, error: messageError } = await supabase
        .from("chat_messages")
        .insert({
          chat_id: activeSession.id,
          user_id: user.id,
          role: "user",
          content
        })
        .select("id,created_at")
        .single();

      if (messageError) throw messageError;

      const filesForMessage = [...pendingFiles];
      const uploadedChatAttachments = await uploadChatFiles(
        user.id,
        activeSession.id,
        savedUserMessage.id,
        filesForMessage
      );

      const nextMessages: ChatMessage[] = [
        ...activeSession.messages,
        {
          id: savedUserMessage.id,
          role: "user",
          content,
          attachments: uploadedChatAttachments,
          createdAt: new Date(savedUserMessage.created_at).getTime()
        }
      ];

      setPendingFiles([]);
      setFileUploadError("");

      await supabase
        .from("chat_sessions")
        .update({
          updated_at: new Date().toISOString()
        })
        .eq("id", activeSession.id);

      setSessions((current) =>
        current.map((session) =>
          session.id === activeSession.id
            ? {
                ...session,
                messages: nextMessages,
                updatedAt: Date.now()
              }
            : session
        )
      );

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`
        },
        body: JSON.stringify({
          messages: nextMessages,
          aperonixSetting,
          branchFromChatId: activeSession.branchFromChatId ?? null,
          branchFromMessageId: activeSession.branchFromMessageId ?? null,
          chatId: activeSession.id,
          generateTitle:
            activeSession.title === "New chat" &&
            activeSession.messages.length === 0
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Something went wrong.");
      }

      const assistantMessage: ChatMessage = {
        role: "assistant",
        content: data.message?.content || "I could not generate a response."
      };

      const { data: savedAssistantMessage, error: assistantSaveError } = await supabase
        .from("chat_messages")
        .insert({
          chat_id: activeSession.id,
          user_id: user.id,
          role: "assistant",
          content: assistantMessage.content
        })
        .select("id,created_at")
        .single();

      if (assistantSaveError) throw assistantSaveError;

      assistantMessage.id = savedAssistantMessage.id;
      assistantMessage.createdAt = new Date(savedAssistantMessage.created_at).getTime();

      const generatedTitle =
        activeSession.title === "New chat" &&
        activeSession.messages.length === 0 &&
        typeof data.title === "string" &&
        data.title.trim()
          ? data.title.trim()
          : activeSession.title;

      await supabase
        .from("chat_sessions")
        .update({
          title: generatedTitle,
          updated_at: new Date().toISOString()
        })
        .eq("id", activeSession.id);

      setSessions((current) =>
        current.map((session) =>
          session.id === activeSession.id
            ? {
                ...session,
                title: generatedTitle,
                messages: [...session.messages, assistantMessage],
                updatedAt: Date.now()
              }
            : session
        )
      );
    } catch (error) {
      console.error("Aperonix chat error:", error);

      if (editingMessageId) {
        setInput(content);
        return;
      }

      setSessions((current) =>
        current.map((session) =>
          session.id === activeSession.id
            ? {
                ...session,
                messages: [
                  ...session.messages,
                  {
                    role: "assistant",
                    content: "Sorry, something went wrong. Please try again."
                  }
                ],
                updatedAt: Date.now()
              }
            : session
        )
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="chat-shell" onClick={() => openMenuId && setOpenMenuId(null)}>
      <aside className={`sidebar ${isSidebarOpen ? "open" : ""}`}>
        <div className="sidebar-top">
          <div className="sidebar-brand">
            <img src="/aperonix-logo.png" alt="Aperonix AI logo" />
            <div>
              <strong>Aperonix AI</strong>
              <span>AI assistant</span>
            </div>
          </div>

          <button
            className="new-chat-sidebar"
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              void handleNewChat();
            }}
            disabled={isLoading}
          >
            <span className="new-chat-icon">＋</span>
            <span>New chat</span>
          </button>
        </div>

        <div className="history">
          <div className={`history-section pinned-section ${isPinnedSectionOpen ? "is-open" : "is-collapsed"}`}>
            <button
              type="button"
              className="history-section-heading"
              onClick={() => setIsPinnedSectionOpen((current) => !current)}
              aria-expanded={isPinnedSectionOpen}
            >
              <span>Pinned</span>
              <span className="history-section-chevron" aria-hidden="true">
                <svg viewBox="0 0 24 24" focusable="false">
                  <path d="M6 9.5 12 15.5 18 9.5" />
                </svg>
              </span>
            </button>
            {isPinnedSectionOpen && <div className="history-list">
            {sessions.filter((session) => session.isPinned).map((session) => (
  <div
                key={session.id}
                className={`history-item-wrap ${session.id === activeSession?.id ? "active" : ""}`}
              >
                <button
                  type="button"
                  className="history-item"
                  onClick={() => selectSession(session.id)}
                  title={session.title}
                >
                  <span className="history-chat-avatar" aria-hidden="true">
                    <span className="history-chat-avatar-mark">◌</span>
                  </span>

                  {session.isPinned && (
                    <span
                      className={`history-pin-indicator ${pinFlashId === session.id ? "pin-flash" : ""}`}
                      aria-hidden="true"
                    >
                      <svg viewBox="0 0 24 24">
                        <path d="M8.1 4.1h7.8l-.9 4.8 2.3 2.3v1.4H6.7v-1.4L9 8.9l-.9-4.8Z" />
                        <path d="M12 12.6v7.3" />
                      </svg>
                    </span>
                  )}

                  <span className="history-title">{session.title}</span>
                </button>

                <button
                  type="button"
                  className="history-menu-button"
                  aria-label={`Options for ${session.title}`}
                  onClick={(event) => {
                    event.stopPropagation();
                    setOpenMenuId((current) =>
                      current === session.id ? null : session.id
                    );
                  }}
                >
                  ⋯
                </button>

                {openMenuId === session.id && (
                  <div
                    className="history-menu"
                    onClick={(event) => event.stopPropagation()}
                  >
                    <button type="button" onClick={() => void handleDuplicate(session)}>
                      Duplicate
                    </button>
                    <button type="button" onClick={() => void openChatShareModal(session)}>
                      Share chat
                    </button>
                    <button type="button" onClick={() => void handleRename(session)}>
                      Rename
                    </button>
                    <button type="button" onClick={() => void handlePin(session)}>
                      {session.isPinned ? "Unpin chat" : "Pin chat"}
                    </button>
                    <button
                      type="button"
                      className="danger"
                      onClick={() => void handleDelete(session)}
                    >
                      Delete chat
                    </button>
                  </div>
                )}
              </div>
            ))}
            </div>}
          </div>

          <div className={`history-section recent-section ${isRecentSectionOpen ? "is-open" : "is-collapsed"}`}>
            <button
              type="button"
              className="history-section-heading"
              onClick={() => setIsRecentSectionOpen((current) => !current)}
              aria-expanded={isRecentSectionOpen}
            >
              <span>Recents</span>
              <span className="history-section-chevron" aria-hidden="true">
                <svg viewBox="0 0 24 24" focusable="false">
                  <path d="M6 9.5 12 15.5 18 9.5" />
                </svg>
              </span>
            </button>
            {isRecentSectionOpen && <div className="history-list">
            {sessions.filter((session) => !session.isPinned).map((session) => (
  <div
                key={session.id}
                className={`history-item-wrap ${session.id === activeSession?.id ? "active" : ""}`}
              >
                <button
                  type="button"
                  className="history-item"
                  onClick={() => selectSession(session.id)}
                  title={session.title}
                >
                  <span className="history-chat-avatar" aria-hidden="true">
                    <span className="history-chat-avatar-mark">◌</span>
                  </span>

                  {session.isPinned && (
                    <span
                      className={`history-pin-indicator ${pinFlashId === session.id ? "pin-flash" : ""}`}
                      aria-hidden="true"
                    >
                      <svg viewBox="0 0 24 24">
                        <path d="M8.1 4.1h7.8l-.9 4.8 2.3 2.3v1.4H6.7v-1.4L9 8.9l-.9-4.8Z" />
                        <path d="M12 12.6v7.3" />
                      </svg>
                    </span>
                  )}

                  <span className="history-title">{session.title}</span>
                </button>

                <button
                  type="button"
                  className="history-menu-button"
                  aria-label={`Options for ${session.title}`}
                  onClick={(event) => {
                    event.stopPropagation();
                    setOpenMenuId((current) =>
                      current === session.id ? null : session.id
                    );
                  }}
                >
                  ⋯
                </button>

                {openMenuId === session.id && (
                  <div
                    className="history-menu"
                    onClick={(event) => event.stopPropagation()}
                  >
                    <button type="button" onClick={() => void handleDuplicate(session)}>
                      Duplicate
                    </button>
                    <button type="button" onClick={() => void openChatShareModal(session)}>
                      Share chat
                    </button>
                    <button type="button" onClick={() => void handleRename(session)}>
                      Rename
                    </button>
                    <button type="button" onClick={() => void handlePin(session)}>
                      {session.isPinned ? "Unpin chat" : "Pin chat"}
                    </button>
                    <button
                      type="button"
                      className="danger"
                      onClick={() => void handleDelete(session)}
                    >
                      Delete chat
                    </button>
                  </div>
                )}
              </div>
            ))}
              {sessions.filter((session) => !session.isPinned).length === 0 && (
                <div className="history-empty">No recent chats</div>
              )}
            </div>}
          </div>
        </div>

        <button
          type="button"
          className="profile-trigger"
          onClick={() => setProfileOpen((current) => !current)}
          aria-expanded={profileOpen}
        >
          {renderProfileAvatar("profile-avatar")}
          <span className="profile-summary">
            <strong>{[profile.firstName, profile.lastName].filter(Boolean).join(" ") || "Your profile"}</strong>
            <small>{profile.email || "Account"}</small>
          </span>
          <span className="profile-chevron">›</span>
        </button>

        {profileOpen && (
          <div className="profile-popover" role="dialog" aria-label="Profile actions">
            <div className="profile-popover-head">
              {renderProfileAvatar("profile-avatar large")}
              <div>
                <strong>{[profile.firstName, profile.lastName].filter(Boolean).join(" ") || "Your profile"}</strong>
                <small>{profile.email}</small>
              </div>
            </div>
            <button type="button" onClick={openProfileDetails}>Account</button>
            <button type="button" onClick={openSettings}>Settings</button>
            <button type="button" onClick={() => void onSignOut()} disabled={isLoading}>Sign out</button>
          </div>
        )}
      </aside>

      {isSidebarOpen && (
        <button
          className="sidebar-backdrop"
          aria-label="Close sidebar"
          type="button"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <section className="chat-main">
        <header className="topbar">
          <button
            className="menu-button"
            type="button"
            aria-label="Open chat history"
            onClick={() => setIsSidebarOpen(true)}
          >
            ☰
          </button>

          <div className="mobile-title">
            <span>{activeSession?.title || "Aperonix AI"}</span>
            {activeSession?.branchFromChatId && (
              <span className="branch-chat-badge">Branch</span>
            )}
          </div>
        </header>

        <section className="messages" aria-live="polite">
          <div className="messages-inner">
            {isEmptyChat ? (
              <div className="empty-chat-welcome" aria-label="Aperonix welcome">
                <img src="/aperonix-logo.png" alt="Aperonix AI" className="empty-chat-logo" />
                <p className="empty-chat-greeting">Hello! How can I help you today?</p>
                {activeSession?.branchFromChatId && (
                  <p className="branch-memory-note">
                    This is a branch chat. Your previous conversation memory is available here, while this chat starts with no messages.
                  </p>
                )}
              </div>
            ) : (
              messages.map((message, index) => (
              <article
                key={`${activeSession?.id}-${message.role}-${index}`}
                className={`message-row ${message.role}`}
              >
                {message.role === "assistant" && (
                  <img src="/aperonix-logo.png" alt="" className="avatar" />
                )}

                {message.role === "assistant" ? (
                  <div className="assistant-content">
                    <div className="message-label">Aperonix</div>
                    <div
                      data-read-aloud-message={messageReadAloudKey(message, index)}
                      className="assistant-markdown"
                    >
                      <ReactMarkdown
                        components={createReadableMarkdownComponents(
                          messageReadAloudKey(message, index),
                          readAloudMessageKey === messageReadAloudKey(message, index)
                            ? readAloudWordIndex
                            : null
                        )}
                      >
                        {message.content}
                      </ReactMarkdown>
                    </div>

                    <div className="message-actions" aria-label="Response actions">
                      <button
                        type="button"
                        className="message-action-button"
                        onClick={() => void copyMessage(message)}
                        aria-label="Copy response"
                        title={copiedMessageId === (message.id ?? `copy-${message.content.slice(0, 24)}`) ? "Copied" : "Copy"}
                      >
                        <svg viewBox="0 0 24 24" aria-hidden="true">
                          <rect x="8" y="8" width="11" height="11" rx="2" />
                          <path d="M16 8V6.8A2.8 2.8 0 0 0 13.2 4H6.8A2.8 2.8 0 0 0 4 6.8v6.4A2.8 2.8 0 0 0 6.8 16H8" />
                        </svg>
                      </button>

                      <button
                        type="button"
                        className="message-action-button share-response-button"
                        onClick={() => void openShareModal(message)}
                        disabled={isLoading || !message.id}
                        aria-label="Share response"
                        title="Share"
                      >
                        <svg viewBox="0 0 24 24" aria-hidden="true">
                          <circle cx="18" cy="5" r="2.3" />
                          <circle cx="6" cy="12" r="2.3" />
                          <circle cx="18" cy="19" r="2.3" />
                          <path d="m8.1 10.9 7.7-4.5M8.1 13.1l7.7 4.5" />
                        </svg>
                      </button>

                      <button
                        type="button"
                        className="message-action-button branch-response-button"
                        onClick={() => void branchResponseInNewChat(message)}
                        disabled={isLoading || !message.id}
                        aria-label="Branch in new chat"
                        title="Branch in new chat"
                      >
                        <svg viewBox="0 0 24 24" aria-hidden="true">
                          <path d="M7 4v7a5 5 0 0 0 5 5h5" />
                          <path d="M7 12a5 5 0 0 1 5-5h3" />
                          <path d="m15 4 3 3-3 3" />
                          <path d="m15 16 3 3-3 3" />
                        </svg>
                      </button>

                      <button
                        type="button"
                        className={`message-action-button read-aloud-button ${readAloudMessageKey === messageReadAloudKey(message, index) ? "is-reading" : ""}`}
                        onClick={() => {
                          const key = messageReadAloudKey(message, index);

                          if (readAloudMessageKey === key && readAloudStatus !== "idle") {
                            stopReadAloud();
                          } else {
                            void startReadAloud(message, index);
                          }
                        }}
                        aria-label={
                          readAloudMessageKey === messageReadAloudKey(message, index) &&
                          readAloudStatus !== "idle"
                            ? "Stop reading"
                            : "Read response aloud"
                        }
                        title={
                          readAloudMessageKey === messageReadAloudKey(message, index) &&
                          readAloudStatus !== "idle"
                            ? "Stop"
                            : "Read aloud"
                        }
                      >
                        {readAloudMessageKey === messageReadAloudKey(message, index) &&
                        readAloudStatus !== "idle" ? (
                          <svg viewBox="0 0 24 24" aria-hidden="true">
                            <rect x="7.5" y="7.5" width="9" height="9" rx="1.4" />
                          </svg>
                        ) : (
                          <svg viewBox="0 0 24 24" aria-hidden="true">
                            <path d="M5.5 9.5v5l3.1 2.4h2.1V7.1H8.6L5.5 9.5Z" />
                            <path d="M14.1 9.2a4.3 4.3 0 0 1 0 5.6" />
                            <path d="M16.7 6.8a7.8 7.8 0 0 1 0 10.4" />
                          </svg>
                        )}
                      </button>

                      <button
                        type="button"
                        className="message-action-button"
                        onClick={() => void retryMessage(index)}
                        disabled={isLoading}
                        aria-label="Retry response"
                        title="Retry"
                      >
                        <svg viewBox="0 0 24 24" aria-hidden="true">
                          <path d="M20 11a8 8 0 0 0-14.9-3M4 13a8 8 0 0 0 14.9 3" />
                          <path d="M5 4v4h4M19 20v-4h-4" />
                        </svg>
                      </button>

                      <button
                        type="button"
                        className={`message-action-button ${feedbackByMessageId[message.id ?? ""] === "good" ? "is-feedback-good" : ""}`}
                        onClick={() => void handleFeedback(message, "good")}
                        disabled={isLoading || !message.id}
                        aria-label="Good response"
                        title="Good response"
                      >
                        <svg viewBox="0 0 24 24" aria-hidden="true">
                          <path d="M7.5 10.5v9H4v-9h3.5Z" />
                          <path d="M7.5 19.5h9.1c.85 0 1.57-.58 1.76-1.41l1.21-5.26A1.8 1.8 0 0 0 17.82 10H14l.62-3.33A2.2 2.2 0 0 0 12.46 4H11.8L7.5 10.5" />
                        </svg>
                      </button>

                      <button
                        type="button"
                        className={`message-action-button ${feedbackByMessageId[message.id ?? ""] === "bad" ? "is-feedback-bad" : ""}`}
                        onClick={() => void handleFeedback(message, "bad")}
                        disabled={isLoading || !message.id}
                        aria-label="Bad response"
                        title="Bad response"
                      >
                        <svg viewBox="0 0 24 24" aria-hidden="true">
                          <path d="M7.5 13.5v-9H4v9h3.5Z" />
                          <path d="M7.5 4.5h9.1c.85 0 1.57.58 1.76 1.41l1.21 5.26A1.8 1.8 0 0 1 17.82 14H14l.62 3.33A2.2 2.2 0 0 1 12.46 20H11.8L7.5 13.5" />
                        </svg>
                      </button>

                      {copiedMessageId === (message.id ?? `copy-${message.content.slice(0, 24)}`) && (
                        <span className="copy-feedback" role="status">Copied</span>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="user-message-content">
                    <div className="user-bubble">
                      <ReactMarkdown>{message.content}</ReactMarkdown>

                      {message.attachments && message.attachments.length > 0 && (
                        <div className="message-attachment-list">
                          {message.attachments.map((attachment) => (
                            <div className="message-attachment-card" key={attachment.id}>
                              <span className="message-attachment-icon" aria-hidden="true">↗</span>
                              <span className="message-attachment-meta">
                                <strong>{attachment.fileName}</strong>
                                <small>{formatFileSize(attachment.sizeBytes)}</small>
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="message-actions user-message-actions" aria-label="Message actions">
                      <button
                        type="button"
                        className="message-action-button edit-message-button"
                        onClick={() => startEditingUserMessage(message)}
                        disabled={isLoading || !message.id}
                        aria-label="Edit message"
                        title="Edit message"
                      >
                        <svg viewBox="0 0 24 24" aria-hidden="true">
                          <path d="m4.5 19.5 1.1-4.1L15.7 5.3a2.3 2.3 0 0 1 3.2 3.2l-10 10-4.4 1Z" />
                          <path d="m14.6 6.4 3.1 3.1" />
                        </svg>
                      </button>

                      <button
                        type="button"
                        className="message-action-button"
                        onClick={() => void copyMessage(message)}
                        disabled={isLoading || !message.id}
                        aria-label="Copy prompt"
                        title={copiedMessageId === (message.id ?? `copy-${message.content.slice(0, 24)}`) ? "Copied" : "Copy prompt"}
                      >
                        <svg viewBox="0 0 24 24" aria-hidden="true">
                          <rect x="8" y="8" width="11" height="11" rx="2" />
                          <path d="M16 8V6.8A2.8 2.8 0 0 0 13.2 4H6.8A2.8 2.8 0 0 0 4 6.8v6.4A2.8 2.8 0 0 0 6.8 16H8" />
                        </svg>
                      </button>

                      <button
                        type="button"
                        className="message-action-button share-response-button"
                        onClick={() => void openShareModal(message)}
                        disabled={isLoading || !message.id}
                        aria-label="Share prompt"
                        title="Share prompt"
                      >
                        <svg viewBox="0 0 24 24" aria-hidden="true">
                          <circle cx="18" cy="5" r="2.3" />
                          <circle cx="6" cy="12" r="2.3" />
                          <circle cx="18" cy="19" r="2.3" />
                          <path d="m8.1 10.9 7.7-4.5M8.1 13.1l7.7 4.5" />
                        </svg>
                      </button>

                      {copiedMessageId === (message.id ?? `copy-${message.content.slice(0, 24)}`) && (
                        <span className="copy-feedback" role="status">Copied</span>
                      )}
                    </div>
                  </div>
                )}
              </article>
              ))
            )}

            {isLoading && (
              <article className="message-row assistant">
                <img src="/aperonix-logo.png" alt="" className="avatar" />
                <div className="assistant-content">
                  <div className="message-label">Aperonix</div>
                  <div className="typing" aria-label="Aperonix is typing">
                    <span />
                    <span />
                    <span />
                  </div>
                </div>
              </article>
            )}

            <div ref={messagesEndRef} />
          </div>
        </section>

        <div className="composer-wrap">
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".pdf,.docx,.txt,.md,.markdown,.csv,.tsv,.json,.xml,.html,.htm,.css,.scss,.less,.js,.jsx,.mjs,.cjs,.ts,.tsx,.py,.pyw,.java,.c,.h,.cc,.cpp,.cxx,.hpp,.cs,.go,.rs,.php,.rb,.swift,.kt,.kts,.sql,.sh,.bash,.zsh,.fish,.ps1,.bat,.cmd,.toml,.ini,.cfg,.conf,.yaml,.yml,.env,.log,.tex,.xlsx,.xls,.png,.jpg,.jpeg,.webp,.gif,.mp3,.wav,.m4a,.ogg,.mp4,.mov,.webm,.mkv"
            className="chat-file-input"
            onChange={handleFileSelection}
          />

          {fileUploadError && (
            <div className="chat-file-error" role="alert">
              {fileUploadError}
            </div>
          )}

          {pendingFiles.length > 0 && (
            <div className="composer-attachments" aria-label="Files ready to upload">
              {pendingFiles.map((file, index) => (
                <div className="composer-attachment-card" key={`${file.name}-${file.size}-${file.lastModified}-${index}`}>
                  <span className="composer-attachment-icon" aria-hidden="true">↗</span>
                  <span className="composer-attachment-meta">
                    <strong>{file.name}</strong>
                    <small>{formatFileSize(file.size)}</small>
                  </span>
                  <button
                    type="button"
                    className="composer-attachment-remove"
                    onClick={() => removePendingFile(index)}
                    disabled={isLoading}
                    aria-label={`Remove ${file.name}`}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}

          {editingMessageId && (
            <div className="composer-editing-bar" role="status">
              <span>Editing message</span>
              <button
                type="button"
                onClick={cancelEditingUserMessage}
                disabled={isLoading}
              >
                Cancel
              </button>
            </div>
          )}

          <form className="composer" onSubmit={handleSubmit}>
            <textarea
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder={editingMessageId ? "Edit your message..." : "Message Aperonix AI..."}
              rows={1}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  event.currentTarget.form?.requestSubmit();
                }
              }}
              aria-label="Message Aperonix AI"
            />

            <div className="composer-toolbar">
              <button
                type="button"
                className={`composer-plus-button ${filePickerOpen ? "is-open" : ""}`}
                onClick={openFilePicker}
                disabled={isLoading || Boolean(editingMessageId)}
                aria-label="Attach files"
                title={editingMessageId ? "Attachments are disabled while editing" : "Attach files"}
              >
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M12 5v14M5 12h14" />
                </svg>
              </button>

              <button
                type="submit"
                className="send-button"
                disabled={!canSend}
                aria-label={editingMessageId ? "Save edited message and resend" : "Send message"}
              >
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M20.4 3.7 4.1 10.2c-.7.3-.7 1.3 0 1.6l6.2 2.3 2.3 6.2c.3.7 1.3.7 1.6 0l6.5-16.3c.3-.8-.1-1.1-.3-1.1Z" />
                </svg>
              </button>
            </div>
          </form>

          <p className="composer-note">
            Aperonix AI can make mistakes. Check important information.
          </p>
        </div>
      </section>

      {profileDetailsOpen && (
        <section className="account-page-overlay">
          <div className="account-page-header">
            <button type="button" className="account-page-back" onClick={() => {
                setProfileDetailsOpen(false);
                navigate("/chat");
              }}>
              <span>←</span> Back
            </button>
            <span className="account-page-title">Profile</span>
          </div>

          <div className="account-page-content">
            <div className="account-hero-card">
              <div className="profile-details-avatar">
                {profile.avatarUrl ? (
                  <img src={profile.avatarUrl} alt={getProfileDisplayName()} />
                ) : (
                  getProfileInitial()
                )}
              </div>
              <div>
                <div className="account-eyebrow">APERONIX ACCOUNT</div>
                <h1>{[profile.firstName, profile.lastName].filter(Boolean).join(" ") || "Your profile"}</h1>
                <p>{profile.email}</p>
              </div>
            </div>

            <div className="account-section-card">
              <div className="account-section-heading">
                <div>
                  <span className="hero-kicker">Account information</span>
                  <h2>Your details</h2>
                </div>
                <button type="button" className="modal-primary" onClick={openProfileEditor}>Edit profile</button>
              </div>

              <div className="profile-view-grid account-view-grid">
                <div><span>First name</span><strong>{profile.firstName || "—"}</strong></div>
                <div><span>Last name</span><strong>{profile.lastName || "—"}</strong></div>
                <div><span>Email</span><strong>{profile.email || "—"}</strong></div>
                <div><span>Date of birth</span><strong>{profile.dateOfBirth || "—"}</strong></div>
                <div><span>Gender</span><strong>{profile.gender || "—"}</strong></div>
                <div><span>Phone</span><strong>{profile.phoneNumber ? `${profile.phoneCountryCode} ${profile.phoneNumber}` : "—"}</strong></div>
                <div className="full"><span>Account created</span><strong>{profile.accountCreatedAt ? new Date(profile.accountCreatedAt).toLocaleString() : "—"}</strong></div>
              </div>
            </div>
          </div>
        </section>
      )}

      {settingsOpen && (
        <section className="account-page-overlay settings-page-overlay">
          <div className="account-page-header">
            <button
              type="button"
              className="account-page-back"
              onClick={() => {
                if (aperonixSettingOpen || dangerZoneOpen) {
                  setAperonixSettingOpen(false);
                  setDangerZoneOpen(false);
                  setSettingsError("");
                  setSettingsDraft(aperonixSetting);
                  navigate("/settings");
                } else {
                  setSettingsOpen(false);
                  navigate("/chat");
                }
              }}
              disabled={settingsSaving}
            >
              <span>←</span> Back
            </button>
            <span className="account-page-title">
              {aperonixSettingOpen
                ? "Aperonix setting"
                : dangerZoneOpen
                  ? "Danger zone"
                  : "Settings"}
            </span>
          </div>

          <div className="account-page-content">
            {!aperonixSettingOpen && !dangerZoneOpen ? (
              <div className="settings-options-card">
                <button
                  type="button"
                  className="settings-option"
                  onClick={openAperonixSetting}
                >
                  <span className="settings-option-icon" aria-hidden="true">
                    <svg viewBox="0 0 24 24">
                      <path d="M12 3.8 13.7 9l5.1 1.7-5.1 1.7L12 17.6l-1.7-5.2-5.1-1.7L10.3 9 12 3.8Z" />
                      <path d="m18.5 4.2.7 2.1 2.1.7-.7 2.1-2.1-.7-2.1-.7 2.1-.7.7-2.1Z" />
                    </svg>
                  </span>
                  <span className="settings-option-copy">
                    <strong>Aperonix setting</strong>
                    <small>Choose how Aperonix should behave and respond to you.</small>
                  </span>
                  <span className="settings-option-chevron" aria-hidden="true">›</span>
                </button>

                <button
                  type="button"
                  className="settings-option danger-zone-option"
                  onClick={openDangerZone}
                >
                  <span className="settings-option-icon danger-zone-icon" aria-hidden="true">
                    <svg viewBox="0 0 24 24">
                      <path d="M12 3.3 20 6.8v5.7c0 4-2.5 6.9-8 8.7-5.5-1.8-8-4.7-8-8.7V6.8l8-3.5Z" />
                      <path d="M12 8.1v4.5" />
                      <circle cx="12" cy="15.9" r=".8" />
                    </svg>
                  </span>
                  <span className="settings-option-copy">
                    <strong>Danger zone</strong>
                    <small>Account actions that can permanently affect your Aperonix account.</small>
                  </span>
                  <span className="settings-option-chevron" aria-hidden="true">›</span>
                </button>
              </div>
            ) : dangerZoneOpen ? (
              <div className="account-section-card settings-card danger-zone-card">
                <div className="account-section-heading">
                  <div>
                    <span className="danger-zone-kicker">ACCOUNT SAFETY</span>
                    <h2>Danger zone</h2>
                    <p className="account-section-note">
                      These actions can permanently affect your account and cannot be easily undone.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  className="danger-zone-action"
                  onClick={() => {
                    setAccountDeleteText("");
                    setAccountDeleteError("");
                    setAccountDeleteOpen(true);
                  }}
                >
                  <span className="danger-zone-action-icon" aria-hidden="true">
                    <svg viewBox="0 0 24 24">
                      <path d="M5 7h14" />
                      <path d="M9 7V4.8h6V7" />
                      <path d="m7.5 7 .8 12.2h7.4L16.5 7" />
                      <path d="M10 10.5v5.7M14 10.5v5.7" />
                    </svg>
                  </span>
                  <span className="settings-option-copy">
                    <strong>Delete account</strong>
                    <small>Permanently delete your account, profile, chats, and associated data.</small>
                  </span>
                  <span className="settings-option-chevron" aria-hidden="true">›</span>
                </button>
              </div>
            ) : (
              <div className="account-section-card settings-card">
                <div className="account-section-heading">
                  <div>
                    <span className="hero-kicker">Personalize your AI</span>
                    <h2>Aperonix setting</h2>
                    <p className="account-section-note">
                      Write in any language about how you want Aperonix to behave for you.
                    </p>
                  </div>
                </div>

                <label className="aperonix-setting-field">
                  <span>What should Aperonix be for you?</span>
                  <textarea
                    value={settingsDraft}
                    onChange={(event) => setSettingsDraft(event.target.value)}
                    maxLength={4000}
                    placeholder="Example: Help me learn step by step, keep answers simple, and speak casually with me."
                    rows={8}
                    disabled={settingsSaving}
                  />
                  <small>{settingsDraft.length}/4000 characters</small>
                </label>

                {settingsError && <div className="auth-error">{settingsError}</div>}

                <div className="account-modal-actions">
                  <button
                    type="button"
                    className="modal-secondary"
                    onClick={() => {
                      setSettingsDraft(aperonixSetting);
                      setSettingsError("");
                      setAperonixSettingOpen(false);
                    }}
                    disabled={settingsSaving}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="modal-primary"
                    onClick={() => void saveAperonixSetting()}
                    disabled={settingsSaving}
                  >
                    {settingsSaving ? "Saving..." : "Save setting"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {profileEditOpen && (
        <section className="account-page-overlay">
          <div className="account-page-header">
            <button type="button" className="account-page-back" onClick={() => {
              setProfileEditOpen(false);
              navigate("/profile");
            }}>
              <span>←</span> Back
            </button>
            <span className="account-page-title">Edit profile</span>
          </div>

          <div className="account-page-content">
            <div className="account-section-card edit-account-card">
              <div className="account-section-heading">
                <div>
                  <span className="hero-kicker">Manage your details</span>
                  <h2>Edit profile</h2>
                  <p className="account-section-note">Your account email cannot be changed here.</p>
                </div>
              </div>

              <div className="profile-photo-editor-entry">
                <div className="profile-photo-preview-wrap">
                  <div className="profile-details-avatar profile-edit-avatar">
                    {profile.avatarUrl ? (
                      <img src={profile.avatarUrl} alt={getProfileDisplayName()} />
                    ) : (
                      getProfileInitial()
                    )}
                  </div>
                  <button
                    type="button"
                    className="profile-photo-pencil"
                    onClick={openPhotoPicker}
                    aria-label="Change profile photo"
                    title="Change profile photo"
                  >
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                      <path d="m4.5 16.7-.7 3.5 3.5-.7L18.7 8.1l-2.8-2.8L4.5 16.7Z" />
                      <path d="m14.8 6.4 2.8 2.8M3.8 20.2l4.3-.9" />
                    </svg>
                  </button>
                </div>
                <div className="profile-photo-entry-copy">
                  <strong>Profile photo</strong>
                  <span>Add a photo or keep your first-letter avatar.</span>
                  <div className="profile-photo-action-row">
                    <button type="button" className="profile-photo-change-button" onClick={openPhotoPicker} disabled={photoRemoving || photoSaving}>
                      {profile.avatarUrl ? "Change photo" : "Add photo"}
                    </button>
                    {profile.avatarUrl && (
                      <button
                        type="button"
                        className="profile-photo-remove-button"
                        onClick={() => void removeProfilePhoto()}
                        disabled={photoRemoving || photoSaving}
                      >
                        {photoRemoving ? "Removing..." : "Remove photo"}
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div className="profile-details-grid">
                <label>
                  First name
                  <input value={profileDraft.firstName} onChange={(event) => setProfileDraft({ ...profileDraft, firstName: event.target.value })} autoComplete="given-name" />
                </label>
                <label>
                  Last name
                  <input value={profileDraft.lastName} onChange={(event) => setProfileDraft({ ...profileDraft, lastName: event.target.value })} autoComplete="family-name" />
                </label>

                <label className="full">
                  Email
                  <input value={profile.email} readOnly />
                  <small>This email is linked to your login.</small>
                </label>

                <label>
                  Day
                  <select
                    value={profileDraft.dateOfBirth ? String(Number(profileDraft.dateOfBirth.slice(8))) : ""}
                    onChange={(event) => updateProfileDob("day", event.target.value)}
                  >
                    <option value="">Day</option>
                    {Array.from({ length: 31 }, (_, index) => index + 1).map((day) => <option key={day} value={day}>{day}</option>)}
                  </select>
                </label>
                <label>
                  Month
                  <select
                    value={profileDraft.dateOfBirth ? String(Number(profileDraft.dateOfBirth.slice(5, 7))) : ""}
                    onChange={(event) => updateProfileDob("month", event.target.value)}
                  >
                    <option value="">Month</option>
                    {profileMonths.map((name, index) => <option key={name} value={index + 1}>{name}</option>)}
                  </select>
                </label>
                <label>
                  Year
                  <select
                    value={profileDraft.dateOfBirth ? profileDraft.dateOfBirth.slice(0, 4) : ""}
                    onChange={(event) => updateProfileDob("year", event.target.value)}
                  >
                    <option value="">Year</option>
                    {profileYears().map((year) => <option key={year} value={year}>{year}</option>)}
                  </select>
                </label>

                <label>
                  Gender
                  <select value={profileDraft.gender} onChange={(event) => setProfileDraft({ ...profileDraft, gender: event.target.value })}>
                    <option value="">Select gender</option>
                    <option>Female</option>
                    <option>Male</option>
                    <option>Non-binary</option>
                    <option>Other</option>
                    <option>Prefer not to say</option>
                  </select>
                </label>

                <label className="full">
                  Phone number
                  <div className="profile-phone-row">
                    <select
                      value={COUNTRY_CALLING_CODES.find((country) => country.dialCode === profileDraft.phoneCountryCode)?.iso2 ?? "IN"}
                      onChange={(event) => {
                        const country = COUNTRY_CALLING_CODES.find((item) => item.iso2 === event.target.value);
                        setProfileDraft({ ...profileDraft, phoneCountryCode: country?.dialCode ?? "+91" });
                      }}
                      aria-label="Country calling code"
                    >
                      {COUNTRY_CALLING_CODES.map((country) => (
                        <option key={country.iso2 + country.dialCode} value={country.iso2}>
                          {country.name} ({country.dialCode})
                        </option>
                      ))}
                    </select>
                    <input
                      inputMode="numeric"
                      value={profileDraft.phoneNumber}
                      onChange={(event) => setProfileDraft({ ...profileDraft, phoneNumber: event.target.value.replace(/\D/g, "").slice(0, 15) })}
                      placeholder="Phone number"
                    />
                  </div>
                </label>
              </div>

              <div className="account-modal-actions">
                <button type="button" className="modal-secondary" onClick={() => setProfileEditOpen(false)}>Cancel</button>
                <button type="button" className="modal-primary" onClick={() => void saveProfile()} disabled={profileSaving}>
                  {profileSaving ? "Saving..." : "Save changes"}
                </button>
              </div>
            </div>
          </div>
        </section>
      )}

      <input
        ref={photoInputRef}
        type="file"
        accept="image/*"
        className="profile-photo-file-input"
        onChange={handlePhotoSelection}
      />

      {photoEditorOpen && photoPreviewUrl && typeof document !== "undefined"
        ? createPortal(
            <div className="photo-editor-backdrop" role="presentation">
              <section className="photo-editor-modal" role="dialog" aria-modal="true" aria-labelledby="photo-editor-title">
            <div className="photo-editor-header">
              <div>
                <span className="hero-kicker">Personalize your profile</span>
                <h2 id="photo-editor-title">Adjust profile photo</h2>
                <p>Crop, rotate and choose a filter before saving.</p>
              </div>
              <button type="button" className="photo-editor-close" onClick={closePhotoEditor} disabled={photoSaving} aria-label="Close photo editor">×</button>
            </div>

            <div className="photo-editor-preview-area">
              <div className="photo-editor-frame">
                <img
                  src={photoPreviewUrl}
                  alt="Profile preview"
                  className="photo-editor-preview"
                  style={{
                    filter: PROFILE_FILTERS[photoFilterIndex].css,
                    transform: `translate(${photoOffsetX}px, ${photoOffsetY}px) rotate(${photoRotation}deg) scale(${photoZoom})`
                  }}
                />
              </div>
            </div>

            {photoError && <div className="auth-error">{photoError}</div>}

            <div className="photo-editor-controls">
              <label>
                Zoom
                <input type="range" min="1" max="2.5" step="0.05" value={photoZoom} onChange={(event) => setPhotoZoom(Number(event.target.value))} />
              </label>
              <label>
                Rotate
                <input type="range" min="-180" max="180" step="1" value={photoRotation} onChange={(event) => setPhotoRotation(Number(event.target.value))} />
              </label>
              <label>
                Horizontal
                <input type="range" min="-120" max="120" step="2" value={photoOffsetX} onChange={(event) => setPhotoOffsetX(Number(event.target.value))} />
              </label>
              <label>
                Vertical
                <input type="range" min="-120" max="120" step="2" value={photoOffsetY} onChange={(event) => setPhotoOffsetY(Number(event.target.value))} />
              </label>
            </div>

            <div className="photo-filter-section">
              <div className="photo-filter-heading">
                <strong>Filters</strong>
                <span>{PROFILE_FILTERS.length}+ styles</span>
              </div>
              <div className="photo-filter-grid">
                {PROFILE_FILTERS.map((filter, index) => (
                  <button
                    type="button"
                    key={filter.name}
                    className={`photo-filter-option ${photoFilterIndex === index ? "active" : ""}`}
                    onClick={() => setPhotoFilterIndex(index)}
                  >
                    <span
                      className="photo-filter-thumb"
                      style={{
                        backgroundImage: `url(${photoPreviewUrl})`,
                        filter: filter.css
                      }}
                    />
                    <span>{filter.name}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="photo-editor-actions">
              <button type="button" className="modal-secondary" onClick={closePhotoEditor} disabled={photoSaving}>Cancel</button>
              <button type="button" className="modal-primary" onClick={() => void saveProfilePhoto()} disabled={photoSaving}>
                {photoSaving ? "Saving..." : "Save photo"}
              </button>
            </div>
              </section>
            </div>,
            document.body
          )
        : null}

      {accountDeleteOpen && (
        <div className="account-modal-backdrop account-delete-backdrop" role="presentation">
          <div className="account-modal danger-modal account-delete-confirm" role="dialog" aria-modal="true" aria-labelledby="delete-account-title">
            <div className="danger-icon">!</div>
            <h2 id="delete-account-title">Delete your account?</h2>
            <p>This permanently deletes your Aperonix account and its associated profile and chat data. This cannot be undone.</p>
            <p className="delete-confirm-instruction">Type <strong>DELETE MY ACCOUNT</strong> below to continue.</p>
            {accountDeleteError && <div className="auth-error account-delete-error">{accountDeleteError}</div>}
            <input
              className="delete-confirm-input"
              value={accountDeleteText}
              onChange={(event) => setAccountDeleteText(event.target.value)}
              autoComplete="off"
              autoCapitalize="characters"
              spellCheck={false}
              placeholder="DELETE MY ACCOUNT"
            />
            <div className="account-modal-actions">
              <button type="button" className="modal-secondary" onClick={() => {
                setAccountDeleteOpen(false);
                setAccountDeleteText("");
                setAccountDeleteError("");
                navigate("/settings/danger-zone");
              }} disabled={accountDeleting}>Cancel</button>
              <button
                type="button"
                className="modal-danger"
                onClick={() => void deleteAccount()}
                disabled={accountDeleting || accountDeleteText !== "DELETE MY ACCOUNT"}
              >
                {accountDeleting ? "Deleting..." : "Delete permanently"}
              </button>
            </div>
          </div>
        </div>
      )}

      {shareModal && (
        <div
          className="share-modal-backdrop"
          role="presentation"
          onClick={() => setShareModal(null)}
        >
          <section
            className="share-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="share-response-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="share-modal-header">
              <div>
                <span className="hero-kicker">Aperonix AI</span>
                <h2 id="share-response-title">
                  {shareModal.kind === "chat"
                    ? "Share chat"
                    : shareModal.kind === "prompt"
                      ? "Share prompt"
                      : "Share response"}
                </h2>
                <p>
                  {shareModal.kind === "chat"
                    ? "Share this entire conversation with anyone using a link."
                    : shareModal.kind === "prompt"
                      ? "Share this prompt with anyone using a link."
                      : "Share this response with anyone using a link."}
                </p>
              </div>
              <button
                type="button"
                className="share-modal-close"
                onClick={() => setShareModal(null)}
                aria-label="Close share dialog"
              >
                ×
              </button>
            </div>

            {shareModal.kind === "chat" ? (
              <div className="share-response-preview share-chat-preview">
                <div className="share-chat-preview-title">
                  <span>Full conversation</span>
                  <strong>{shareModal.chatTitle}</strong>
                </div>
                <div className="share-chat-preview-list">
                  {(shareModal.chatMessages ?? []).map((message, index) => (
                    <div
                      key={`share-chat-preview-${index}`}
                      className={`share-chat-preview-message ${message.role === "user" ? "is-user" : "is-assistant"}`}
                    >
                      <div className="share-chat-preview-role">
                        {message.role === "user" ? "User" : "Aperonix AI"}
                      </div>
                      <div className="share-chat-preview-content">
                        <ReactMarkdown>{message.content}</ReactMarkdown>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="share-response-preview">
                <ReactMarkdown>{shareModal.content}</ReactMarkdown>
              </div>
            )}

            <div className="share-link-box">
              <span>
                {shareModal.preparing
                  ? "Preparing secure share link..."
                  : shareModal.url ?? "Share link could not be created."}
              </span>
            </div>

            {shareModal.preparing && (
              <div className="share-preparing-status" role="status" aria-live="polite">
                <span className="share-preparing-spinner" aria-hidden="true" />
                <span>Preparing secure share link…</span>
              </div>
            )}

            {!shareModal.preparing && !shareModal.url && (
              <div className="share-preparing-error" role="status">
                Couldn’t create the share link. Please close this window and try again.
              </div>
            )}

            <div className="share-modal-actions">
              <button
                type="button"
                className="share-modal-button share-native-button"
                onClick={() => void shareViaDevice()}
                disabled={!nativeShareSupported || shareModal.preparing || !shareModal.url}
              >
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <circle cx="18" cy="5" r="2.3" />
                  <circle cx="6" cy="12" r="2.3" />
                  <circle cx="18" cy="19" r="2.3" />
                  <path d="m8.1 10.9 7.7-4.5M8.1 13.1l7.7 4.5" />
                </svg>
                <span>{nativeShareSupported ? "Share via device" : "Native sharing unavailable"}</span>
              </button>

              <button
                type="button"
                className="share-modal-button share-copy-button"
                onClick={() => void copyShareLink()}
                disabled={shareModal.preparing || !shareModal.url}
              >
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <rect x="8" y="8" width="11" height="11" rx="2" />
                  <path d="M16 8V6.8A2.8 2.8 0 0 0 13.2 4H6.8A2.8 2.8 0 0 0 4 6.8v6.4A2.8 2.8 0 0 0 6.8 16H8" />
                </svg>
                <span>{shareModal.copied ? "Link copied" : "Copy link"}</span>
              </button>
            </div>

            <p className="share-modal-note">
              {shareModal.kind === "chat"
                ? "The complete conversation shown above is shared. Other private chats are not included."
                : shareModal.kind === "prompt"
                  ? "Only this selected Aperonix prompt is shared. Your private chat history is not included."
                  : "Only this selected Aperonix response is shared. Your private chat history is not included."}
            </p>
          </section>
        </div>
      )}

      {deleteSession && (
        <div className="chat-modal-backdrop" role="presentation" onClick={() => setDeleteSession(null)}>
          <div className="chat-modal" role="dialog" aria-modal="true" aria-labelledby="delete-chat-title" onClick={(event) => event.stopPropagation()}>
            <div className="chat-modal-title" id="delete-chat-title">Delete chat?</div>
            <p>This will also delete all messages in this chat.</p>
            <div className="chat-modal-actions">
              <button type="button" onClick={() => setDeleteSession(null)}>Cancel</button>
              <button type="button" className="danger" onClick={() => void confirmDelete()}>Delete</button>
            </div>
          </div>
        </div>
      )}

      {renameSession && (
        <div className="chat-modal-backdrop" role="presentation" onClick={() => setRenameSession(null)}>
          <div className="chat-modal" role="dialog" aria-modal="true" aria-labelledby="rename-chat-title" onClick={(event) => event.stopPropagation()}>
            <div className="chat-modal-title" id="rename-chat-title">Rename chat</div>
            <input
              className="chat-modal-input"
              value={renameValue}
              onChange={(event) => setRenameValue(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  void confirmRename();
                }
                if (event.key === "Escape") setRenameSession(null);
              }}
              autoFocus
              maxLength={80}
            />
            <div className="chat-modal-actions">
              <button type="button" onClick={() => setRenameSession(null)}>Cancel</button>
              <button type="button" className="primary" onClick={() => void confirmRename()}>Save</button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
