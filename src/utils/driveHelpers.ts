/**
 * Utilidades universales para enlaces de Google Drive, Google Docs/Sheets/Slides,
 * Google Colab, carpetas y enlaces externos (GitHub, Notion, etc.).
 */

export type LinkSourceType =
  | "drive_file"
  | "drive_folder"
  | "google_doc"
  | "google_sheet"
  | "google_slide"
  | "colab"
  | "external";

export interface DriveLinks {
  id: string | null;
  sourceType: LinkSourceType;
  isColab: boolean;
  previewUrl: string;
  downloadUrl: string | null;
}

/**
 * Verifica que una cadena sea una URL web válida (http:// o https://).
 */
export function isValidHttpUrl(rawUrl: string): boolean {
  if (!rawUrl || !rawUrl.trim()) return false;
  try {
    const parsed = new URL(rawUrl.trim());
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

/**
 * Extrae el ID de un enlace de Google Colab:
 * - https://colab.research.google.com/drive/{ID}...
 */
export function extractColabId(url: string): string | null {
  if (!url) return null;
  const trimmed = url.trim();
  const colabMatch = trimmed.match(/colab\.research\.google\.com\/drive\/([a-zA-Z0-9_-]+)/);
  return colabMatch?.[1] || null;
}

/**
 * Extrae el ID de un enlace de archivo en Google Drive:
 * - https://drive.google.com/file/d/{ID}/view?usp=sharing
 * - https://drive.google.com/file/d/{ID}/preview
 * - https://drive.google.com/open?id={ID}
 * - https://drive.google.com/uc?id={ID}&export=download
 */
export function extractGoogleDriveId(url: string): string | null {
  if (!url) return null;

  const trimmed = url.trim();

  const filePathMatch = trimmed.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (filePathMatch?.[1]) {
    return filePathMatch[1];
  }

  const queryIdMatch = trimmed.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (queryIdMatch?.[1]) {
    return queryIdMatch[1];
  }

  return null;
}

/**
 * Genera URLs limpias de vista previa y descarga según el proveedor del enlace.
 */
export function getDriveLinks(rawUrl: string): DriveLinks {
  const trimmed = (rawUrl || "").trim();

  // 1. Google Colab
  if (trimmed.includes("colab.research.google.com")) {
    return {
      id: extractColabId(trimmed),
      sourceType: "colab",
      isColab: true,
      previewUrl: trimmed,
      downloadUrl: null,
    };
  }

  // 2. Google Docs (Document)
  const docMatch = trimmed.match(/docs\.google\.com\/document\/d\/([a-zA-Z0-9_-]+)/);
  if (docMatch?.[1]) {
    const id = docMatch[1];
    return {
      id,
      sourceType: "google_doc",
      isColab: false,
      previewUrl: trimmed,
      downloadUrl: `https://docs.google.com/document/d/${id}/export?format=pdf`,
    };
  }

  // 3. Google Sheets (Spreadsheets)
  const sheetMatch = trimmed.match(/docs\.google\.com\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/);
  if (sheetMatch?.[1]) {
    const id = sheetMatch[1];
    return {
      id,
      sourceType: "google_sheet",
      isColab: false,
      previewUrl: trimmed,
      downloadUrl: `https://docs.google.com/spreadsheets/d/${id}/export?format=pdf`,
    };
  }

  // 4. Google Slides (Presentation)
  const slideMatch = trimmed.match(/docs\.google\.com\/presentation\/d\/([a-zA-Z0-9_-]+)/);
  if (slideMatch?.[1]) {
    const id = slideMatch[1];
    return {
      id,
      sourceType: "google_slide",
      isColab: false,
      previewUrl: trimmed,
      downloadUrl: `https://docs.google.com/presentation/d/${id}/export?format=pdf`,
    };
  }

  // 5. Carpeta de Google Drive
  if (trimmed.includes("drive.google.com/drive/folders/")) {
    const folderMatch = trimmed.match(/\/folders\/([a-zA-Z0-9_-]+)/);
    return {
      id: folderMatch?.[1] || null,
      sourceType: "drive_folder",
      isColab: false,
      previewUrl: trimmed,
      downloadUrl: null,
    };
  }

  // 6. Archivo individual de Google Drive
  if (trimmed.includes("drive.google.com")) {
    const driveId = extractGoogleDriveId(trimmed);
    if (driveId) {
      return {
        id: driveId,
        sourceType: "drive_file",
        isColab: false,
        previewUrl: `https://drive.google.com/file/d/${driveId}/preview`,
        downloadUrl: `https://drive.google.com/uc?export=download&id=${driveId}`,
      };
    }
  }

  // 7. Cualquier otro enlace web o repositorio (GitHub, Notion, etc.)
  return {
    id: null,
    sourceType: "external",
    isColab: false,
    previewUrl: trimmed,
    downloadUrl: null,
  };
}
