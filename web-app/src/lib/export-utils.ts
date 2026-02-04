import { Metric } from "@/types/metrics";


const escapeCSV = (value: string | number | null | undefined): string => {
  if (value === null || value === undefined) return "";
  const stringValue = String(value);
  if (/[",\n\r]/.test(stringValue)) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }
  return stringValue;
};

const escapeXML = (value: string | number | null | undefined): string => {
  if (value === null || value === undefined) return "";
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
};

const sanitizeXMLTag = (key: string): string => {
  // Reemplazar espacios y caracteres inválidos por guiones bajos
  // XML tags deben comenzar con letra o guion bajo
  let safe = key.replace(/[^a-zA-Z0-9_\-\.]/g, "_");
  if (/^[^a-zA-Z_]/.test(safe)) {
    safe = "_" + safe;
  }
  return safe;
};

// Ara acceptem 't' com a argument per traduir les claus i valors
const formatDataForExport = (data: Metric[], t: any) => {
  return data.map((row) => ({
    [t("Export.date")]:
      new Date(row.createdAt).toLocaleDateString() +
      " " +
      new Date(row.createdAt).toLocaleTimeString(),
    [t("Export.context")]: row.measurementContext
      ? t(`ContextOptions.${row.measurementContext}`)
      : "-",
    [t("Export.bp")]: row.bloodPressure || "-",
    [t("Export.pulse")]: row.pulse ? row.pulse.toString() : "-",
    [t("Export.spo2")]: row.spo2 ? row.spo2.toString() : "-",
    [t("Export.weight")]: row.weight ? row.weight.toString() : "-",
    [t("Export.location")]: row.weightLocation
      ? t(`LocationOptions.${row.weightLocation}`)
      : "-",
    [t("Export.ca125")]: row.ca125 ? row.ca125.toString() : "-",
    [t("Export.notes")]: row.notes
      ? row.notes.replace(/(\r\n|\n|\r)/gm, " ")
      : "-",
  }));
};

export const downloadCSV = (data: Metric[], filename: string, t: any) => {
  const formattedData = formatDataForExport(data, t);
  if (formattedData.length === 0) return;

  const headers = Object.keys(formattedData[0]);
  const csvContent = [
    headers.map(escapeCSV).join(","), // Headers escaped
    ...formattedData.map((row) =>
      headers
        .map((fieldName) => escapeCSV((row as any)[fieldName]))
        .join(",")
    ),
  ].join("\r\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `${filename}_${new Date().toISOString().split("T")[0]}.csv`
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};

export const downloadXML = (data: Metric[], filename: string, t: any) => {
  const formattedData = formatDataForExport(data, t);
  if (formattedData.length === 0) return;

  let xmlContent = '<?xml version="1.0" encoding="UTF-8"?>\n<registros>\n';

  formattedData.forEach((row) => {
    xmlContent += "  <registro>\n";
    Object.entries(row).forEach(([key, value]) => {
      const safeKey = sanitizeXMLTag(key);
      const safeValue = escapeXML(value as string);
      xmlContent += `    <${safeKey}>${safeValue}</${safeKey}>\n`;
    });
    xmlContent += "  </registro>\n";
  });
  xmlContent += "</registros>";

  const blob = new Blob([xmlContent], { type: "text/xml;charset=utf-8;" });
  const link = document.createElement("a");
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `${filename}_${new Date().toISOString().split("T")[0]}.xml`
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};
