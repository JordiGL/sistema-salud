import { HealthMetric } from "./api";

// Ara acceptem 't' com a argument per traduir les claus
const formatDataForExport = (data: HealthMetric[], t: any) => {
  return data.map((row) => ({
    [t("Export.date")]:
      new Date(row.createdAt).toLocaleDateString() +
      " " +
      new Date(row.createdAt).toLocaleTimeString(),
    [t("Export.context")]: row.measurementContext || "-",
    [t("Export.bp")]: row.bloodPressure || "-",
    [t("Export.pulse")]: row.pulse ? row.pulse.toString() : "-",
    [t("Export.spo2")]: row.spo2 ? row.spo2.toString() : "-",
    [t("Export.weight")]: row.weight ? row.weight.toString() : "-",
    [t("Export.location")]: row.weightLocation || "-",
    [t("Export.ca125")]: row.ca125 ? row.ca125.toString() : "-",
    [t("Export.notes")]: row.notes
      ? row.notes.replace(/(\r\n|\n|\r)/gm, " ")
      : "-",
  }));
};

export const downloadCSV = (data: HealthMetric[], filename: string, t: any) => {
  const formattedData = formatDataForExport(data, t);
  if (formattedData.length === 0) return;

  const headers = Object.keys(formattedData[0]);
  const csvContent = [
    headers.join(","), // Capçalera traduïda
    ...formattedData.map((row) =>
      headers
        .map((fieldName) =>
          JSON.stringify((row as any)[fieldName], (key, value) =>
            value === null ? "" : value
          )
        )
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

export const downloadXML = (data: HealthMetric[], filename: string, t: any) => {
  const formattedData = formatDataForExport(data, t);
  if (formattedData.length === 0) return;

  let xmlContent = '<?xml version="1.0" encoding="UTF-8"?>\n<registros>\n';

  formattedData.forEach((row) => {
    xmlContent += "  <registro>\n";
    Object.entries(row).forEach(([key, value]) => {
      // Per a XML, és millor treure espais o caràcters estranys de les etiquetes si n'hi hagués
      // Però si les traduccions són simples ("Data", "Peso"), no hi haurà problema.
      const safeKey = key.replace(/\s+/g, "_");
      xmlContent += `    <${safeKey}>${value}</${safeKey}>\n`;
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
