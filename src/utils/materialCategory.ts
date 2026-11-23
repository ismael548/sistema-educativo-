export type MaterialCategory = "Teoría" | "Práctica";

export const MATERIAL_CATEGORIES: readonly MaterialCategory[] = ["Teoría", "Práctica"];

const CATEGORY_SEPARATOR = "::";

export function encodeMaterialFileType(
  fileType: string,
  category: MaterialCategory
): string {
  const cleanType = fileType.trim() || "Documento";
  return `${category}${CATEGORY_SEPARATOR}${cleanType}`;
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
    const rest = value.slice(sepIndex + CATEGORY_SEPARATOR.length).trim() || "Documento";
    if (rawCat === "práctica" || rawCat === "practica") {
      return { category: "Práctica", fileType: rest };
    }
    return { category: "Teoría", fileType: rest };
  }

  // Documentos antiguos sin categoría explícita -> Teoría por defecto
  return { category: "Teoría", fileType: value };
}
