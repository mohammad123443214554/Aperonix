import pdfParse from "pdf-parse";
import mammoth from "mammoth";
import * as XLSX from "xlsx";

const MAX_EXTRACTED_CHARS = 50_000;

const TEXT_EXTENSIONS = new Set([
  "txt", "md", "markdown", "csv", "tsv", "json", "xml", "html", "htm",
  "css", "scss", "less", "js", "jsx", "mjs", "cjs", "ts", "tsx",
  "py", "pyw", "java", "c", "h", "cc", "cpp", "cxx", "hpp",
  "cs", "go", "rs", "php", "rb", "swift", "kt", "kts", "sql", "sh",
  "bash", "zsh", "fish", "ps1", "bat", "cmd", "toml", "ini", "cfg",
  "conf", "yaml", "yml", "env", "log", "tex"
]);

function extension(fileName: string) {
  const match = fileName.toLowerCase().match(/\.([a-z0-9]+)$/);
  return match?.[1] ?? "";
}

function limitText(text: string) {
  const cleaned = text.replace(/\u0000/g, "").trim();
  if (cleaned.length <= MAX_EXTRACTED_CHARS) return cleaned;
  return (
    cleaned.slice(0, MAX_EXTRACTED_CHARS) +
    "\n\n[File content truncated by Aperonix for context size.]"
  );
}

export async function extractFileText(
  buffer: Buffer,
  mimeType: string,
  fileName: string
): Promise<{ text: string | null; note?: string }> {
  const ext = extension(fileName);

  if (mimeType === "application/pdf" || ext === "pdf") {
    const parsed = await pdfParse(buffer);
    const text = limitText(parsed.text || "");
    return text
      ? { text }
      : { text: null, note: "No readable text was extracted from this PDF." };
  }

  if (
    mimeType ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    ext === "docx"
  ) {
    const parsed = await mammoth.extractRawText({ buffer });
    const text = limitText(parsed.value || "");
    return text
      ? { text }
      : { text: null, note: "No readable text was extracted from this DOCX file." };
  }

  if (
    mimeType ===
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
    mimeType === "application/vnd.ms-excel" ||
    ext === "xlsx" ||
    ext === "xls"
  ) {
    const workbook = XLSX.read(buffer, { type: "buffer" });
    const sections = workbook.SheetNames.map((sheetName) => {
      const sheet = workbook.Sheets[sheetName];
      return `Sheet: ${sheetName}\n${XLSX.utils.sheet_to_csv(sheet)}`;
    });

    const text = limitText(sections.join("\n\n"));
    return text
      ? { text }
      : { text: null, note: "No readable cell data was found in this spreadsheet." };
  }

  if (
    mimeType.startsWith("text/") ||
    mimeType === "application/json" ||
    mimeType === "application/xml" ||
    mimeType === "text/csv" ||
    mimeType === "text/markdown" ||
    TEXT_EXTENSIONS.has(ext)
  ) {
    return { text: limitText(buffer.toString("utf8")) };
  }

  if (mimeType.startsWith("image/")) {
    return {
      text: null,
      note:
        "This image was uploaded successfully, but the current Aperonix text model cannot inspect image pixels yet."
    };
  }

  if (mimeType.startsWith("video/")) {
    return {
      text: null,
      note:
        "This video was uploaded successfully, but the current Aperonix text model cannot inspect video frames yet."
    };
  }

  if (mimeType.startsWith("audio/")) {
    return {
      text: null,
      note:
        "This audio file was uploaded successfully, but the current Aperonix text model cannot transcribe audio yet."
    };
  }

  return {
    text: null,
    note: "This file type is stored with the chat but its contents are not readable by the current text model."
  };
}
