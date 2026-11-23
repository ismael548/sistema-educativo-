export type MaterialCategory = "Teoría" | "Práctica" | "Videos de Complemento";

export const MATERIAL_CATEGORIES: readonly MaterialCategory[] = [
  "Teoría",
  "Práctica",
  "Videos de Complemento",
];

const CATEGORY_SEPARATOR = "::";

export function encodeMaterialFileType(
  fileType: string,
  category: MaterialCategory
): string {
  const cleanType = fileType.trim() || "Documento";
  return `${category}${CATEGORY_SEPARATOR}${cleanType}`;
}

export function inferResourceFileType(
  url: string,
  category: MaterialCategory
): string {
  const lower = url.toLowerCase();
  if (category === "Videos de Complemento") {
    if (lower.includes("youtube.com") || lower.includes("youtu.be")) {
      return "YouTube";
    }
    if (lower.includes("drive.google.com")) {
      return "Video Drive";
    }
    return "Video";
  }
  if (lower.includes("docs.google.com/document")) return "Google Docs";
  if (lower.includes("docs.google.com/spreadsheets")) return "Google Sheets";
  if (lower.includes("docs.google.com/presentation")) return "Google Slides";
  if (lower.includes("colab.research.google.com")) return "Google Colab";
  if (lower.includes("github.com")) return "GitHub";
  if (lower.includes("drive.google.com")) return "Google Drive";
  if (lower.endsWith(".pdf")) return "PDF";
  return "Enlace Web";
}

export function parseMaterialFileType(rawFileType?: string | null): {
  category: MaterialCategory;
  fileType: string;
} {
  const value = (rawFileType || "").trim();
  if (!value) {
    return { category: "Teoría", fileType: "Documento" };
  }

  const sepIndex = value.indexOf(CATEGORY_SEPARATOR);
  if (sepIndex !== -1) {
    const rawCat = value.slice(0, sepIndex).trim().toLowerCase();
    const rest =
      value.slice(sepIndex + CATEGORY_SEPARATOR.length).trim() || "Documento";
    if (rawCat === "videos de complemento") {
      return { category: "Videos de Complemento", fileType: rest };
    }
    if (rawCat === "práctica" || rawCat === "practica") {
      return { category: "Práctica", fileType: rest };
    }
    return { category: "Teoría", fileType: rest };
  }

  // Documentos antiguos sin categoría explícita -> Teoría por defecto
  return { category: "Teoría", fileType: value };
}
