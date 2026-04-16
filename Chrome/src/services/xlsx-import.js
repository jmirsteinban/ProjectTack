const OFFICE_REL_NS = "http://schemas.openxmlformats.org/officeDocument/2006/relationships";

function decodeText(bytes) {
  return new TextDecoder("utf-8").decode(bytes);
}

function readUint16(view, offset) {
  return view.getUint16(offset, true);
}

function readUint32(view, offset) {
  return view.getUint32(offset, true);
}

function normalizeZipPath(value) {
  return String(value ?? "")
    .replace(/\\/g, "/")
    .replace(/^\/+/, "");
}

function resolveZipPath(basePath, targetPath) {
  const baseSegments = normalizeZipPath(basePath).split("/").slice(0, -1);
  const targetSegments = normalizeZipPath(targetPath).split("/");
  const segments = targetPath.startsWith("/")
    ? targetSegments
    : [...baseSegments, ...targetSegments];

  return segments.reduce((accumulator, segment) => {
    if (!segment || segment === ".") {
      return accumulator;
    }
    if (segment === "..") {
      accumulator.pop();
      return accumulator;
    }
    accumulator.push(segment);
    return accumulator;
  }, []).join("/");
}

function findEndOfCentralDirectory(bytes) {
  for (let offset = bytes.length - 22; offset >= 0; offset -= 1) {
    if (
      bytes[offset] === 0x50
      && bytes[offset + 1] === 0x4b
      && bytes[offset + 2] === 0x05
      && bytes[offset + 3] === 0x06
    ) {
      return offset;
    }
  }

  throw new Error("The XLSX file is missing the ZIP end-of-central-directory record.");
}

function parseZipEntries(buffer) {
  const bytes = new Uint8Array(buffer);
  const view = new DataView(buffer);
  const eocdOffset = findEndOfCentralDirectory(bytes);
  const totalEntries = readUint16(view, eocdOffset + 10);
  const centralDirectoryOffset = readUint32(view, eocdOffset + 16);
  const entries = new Map();
  let offset = centralDirectoryOffset;

  for (let index = 0; index < totalEntries; index += 1) {
    if (readUint32(view, offset) !== 0x02014b50) {
      throw new Error("The XLSX file central directory is corrupted.");
    }

    const compressionMethod = readUint16(view, offset + 10);
    const compressedSize = readUint32(view, offset + 20);
    const uncompressedSize = readUint32(view, offset + 24);
    const fileNameLength = readUint16(view, offset + 28);
    const extraFieldLength = readUint16(view, offset + 30);
    const fileCommentLength = readUint16(view, offset + 32);
    const localHeaderOffset = readUint32(view, offset + 42);
    const fileNameBytes = bytes.subarray(offset + 46, offset + 46 + fileNameLength);
    const fileName = decodeText(fileNameBytes);

    entries.set(normalizeZipPath(fileName), {
      compressionMethod,
      compressedSize,
      uncompressedSize,
      localHeaderOffset,
    });

    offset += 46 + fileNameLength + extraFieldLength + fileCommentLength;
  }

  return { bytes, view, entries };
}

async function inflateZipEntry(entryBytes, compressionMethod) {
  if (compressionMethod === 0) {
    return entryBytes;
  }

  if (compressionMethod !== 8) {
    throw new Error(`Unsupported XLSX compression method: ${compressionMethod}.`);
  }

  if (typeof DecompressionStream === "undefined") {
    throw new Error("This browser cannot decompress XLSX files yet.");
  }

  const stream = new Blob([entryBytes]).stream().pipeThrough(new DecompressionStream("deflate-raw"));
  const buffer = await new Response(stream).arrayBuffer();
  return new Uint8Array(buffer);
}

async function readZipEntryText(zipData, entryPath) {
  const normalizedPath = normalizeZipPath(entryPath);
  const entry = zipData.entries.get(normalizedPath);
  if (!entry) {
    return null;
  }

  if (readUint32(zipData.view, entry.localHeaderOffset) !== 0x04034b50) {
    throw new Error(`The XLSX entry ${normalizedPath} is corrupted.`);
  }

  const fileNameLength = readUint16(zipData.view, entry.localHeaderOffset + 26);
  const extraFieldLength = readUint16(zipData.view, entry.localHeaderOffset + 28);
  const entryDataOffset = entry.localHeaderOffset + 30 + fileNameLength + extraFieldLength;
  const compressedBytes = zipData.bytes.subarray(entryDataOffset, entryDataOffset + entry.compressedSize);
  const inflatedBytes = await inflateZipEntry(compressedBytes, entry.compressionMethod);

  if (entry.uncompressedSize && inflatedBytes.length !== entry.uncompressedSize) {
    return decodeText(inflatedBytes);
  }

  return decodeText(inflatedBytes);
}

function parseXml(xmlText) {
  const xml = new DOMParser().parseFromString(xmlText, "application/xml");
  if (xml.querySelector("parsererror")) {
    throw new Error("The XLSX file contains invalid XML.");
  }
  return xml;
}

function getXmlNodes(root, localName) {
  return Array.from(root.getElementsByTagNameNS("*", localName));
}

function getCellColumnIndex(reference) {
  const match = String(reference ?? "").match(/^[A-Z]+/i);
  if (!match) {
    return 0;
  }

  return match[0]
    .toUpperCase()
    .split("")
    .reduce((value, character) => value * 26 + (character.charCodeAt(0) - 64), 0) - 1;
}

function readInlineText(node) {
  return getXmlNodes(node, "t").map((item) => item.textContent ?? "").join("");
}

function parseSharedStrings(xml) {
  return getXmlNodes(xml, "si").map((item) => readInlineText(item));
}

function parseWorkbookSheets(xml) {
  return getXmlNodes(xml, "sheet").map((sheet) => ({
    name: sheet.getAttribute("name") ?? "",
    relId:
      sheet.getAttribute("r:id")
      ?? sheet.getAttributeNS(OFFICE_REL_NS, "id")
      ?? "",
  }));
}

function parseWorkbookRelationships(xml) {
  return new Map(
    getXmlNodes(xml, "Relationship").map((relationship) => [
      relationship.getAttribute("Id") ?? "",
      relationship.getAttribute("Target") ?? "",
    ]),
  );
}

function parseSheetRows(xml, sharedStrings) {
  return getXmlNodes(xml, "row").map((row) => {
    const values = [];

    getXmlNodes(row, "c").forEach((cell) => {
      const columnIndex = getCellColumnIndex(cell.getAttribute("r"));
      const cellType = cell.getAttribute("t") ?? "";
      const valueNode = getXmlNodes(cell, "v")[0] ?? null;
      const inlineText = readInlineText(cell);
      let value = "";

      if (cellType === "s") {
        const sharedIndex = Number(valueNode?.textContent ?? "");
        value = Number.isFinite(sharedIndex) ? (sharedStrings[sharedIndex] ?? "") : "";
      } else if (cellType === "inlineStr") {
        value = inlineText;
      } else if (cellType === "b") {
        value = valueNode?.textContent === "1" ? "true" : "false";
      } else {
        value = valueNode?.textContent ?? inlineText;
      }

      values[columnIndex] = String(value ?? "").trim();
    });

    return values;
  });
}

function normalizeHeader(value) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

function extractAnnotationType(value) {
  const match = String(value ?? "").trim().match(/^\[([^\]]+)\]/);
  return match ? match[1].trim() : "";
}

function normalizeTaskStatus(value) {
  const normalized = String(value ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ");

  switch (normalized) {
    case "completed":
    case "completado":
      return "Completado";
    case "in progress":
    case "en progreso":
    case "en desarrollo":
      return "En desarrollo";
    case "error":
    case "blocked":
    case "bloqueado":
      return "Error";
    default:
      return "Pendiente";
  }
}

function createTaskKey(task) {
  const sourceKey = String(task.sourceExternalId ?? "").trim();
  if (sourceKey) {
    return `source:${sourceKey.toLowerCase()}`;
  }

  return [
    task.page,
    task.itemNumber,
    task.documentName,
    task.requestText,
  ]
    .map((part) => String(part ?? "").trim().toLowerCase().replace(/\s+/g, " "))
    .join("|");
}

function getHeaderValue(row, headers, key) {
  const index = headers.get(key);
  if (typeof index !== "number") {
    return "";
  }
  return String(row[index] ?? "").trim();
}

export async function parseTrackerWorkbook(file) {
  const fileName = file?.name ?? "";
  if (!file || !/\.xlsx$/i.test(fileName)) {
    throw new Error("Select a valid .xlsx tracker file.");
  }

  const buffer = await file.arrayBuffer();
  const zipData = parseZipEntries(buffer);
  const workbookText = await readZipEntryText(zipData, "xl/workbook.xml");
  const workbookRelsText = await readZipEntryText(zipData, "xl/_rels/workbook.xml.rels");
  if (!workbookText || !workbookRelsText) {
    throw new Error("The tracker workbook is missing its main sheet definition.");
  }

  const workbookXml = parseXml(workbookText);
  const workbookRelsXml = parseXml(workbookRelsText);
  const sheets = parseWorkbookSheets(workbookXml);
  const relationships = parseWorkbookRelationships(workbookRelsXml);
  const selectedSheet = sheets.find((sheet) => normalizeHeader(sheet.name) === "tracker") ?? sheets[0];
  if (!selectedSheet?.relId) {
    throw new Error("The tracker workbook does not contain any readable sheet.");
  }

  const selectedSheetTarget = relationships.get(selectedSheet.relId);
  if (!selectedSheetTarget) {
    throw new Error(`The workbook sheet ${selectedSheet.name || "Tracker"} could not be resolved.`);
  }

  const sharedStringsText = await readZipEntryText(zipData, "xl/sharedStrings.xml");
  const sharedStrings = sharedStringsText ? parseSharedStrings(parseXml(sharedStringsText)) : [];
  const sheetPath = resolveZipPath("xl/workbook.xml", selectedSheetTarget);
  const sheetText = await readZipEntryText(zipData, sheetPath);
  if (!sheetText) {
    throw new Error(`The tracker sheet ${selectedSheet.name || "Tracker"} could not be opened.`);
  }

  const rows = parseSheetRows(parseXml(sheetText), sharedStrings).filter((row) => row.some(Boolean));
  if (!rows.length) {
    throw new Error("The tracker workbook is empty.");
  }

  const headerRow = rows[0];
  const headers = new Map(headerRow.map((value, index) => [normalizeHeader(value), index]));
  const requiredHeaders = ["page", "number", "document", "requested modification"];
  const missingHeaders = requiredHeaders.filter((header) => !headers.has(header));
  if (missingHeaders.length) {
    throw new Error(`The tracker workbook is missing required columns: ${missingHeaders.join(", ")}.`);
  }

  const tasks = rows
    .slice(1)
    .map((row) => {
      const sourceExternalId = getHeaderValue(row, headers, "id");
      const page = getHeaderValue(row, headers, "page");
      const itemNumber = getHeaderValue(row, headers, "number");
      const documentName = getHeaderValue(row, headers, "document");
      const requestText = getHeaderValue(row, headers, "requested modification");
      const legacyStatus = getHeaderValue(row, headers, "status");

      if (!page && !itemNumber && !documentName && !requestText) {
        return null;
      }

      const task = {
        sourceExternalId: sourceExternalId || null,
        page,
        itemNumber,
        documentName,
        requestText,
        annotationType: extractAnnotationType(requestText),
        status: normalizeTaskStatus(legacyStatus),
      };

      return {
        ...task,
        taskKey: createTaskKey(task),
      };
    })
    .filter(Boolean);

  if (!tasks.length) {
    throw new Error("The tracker workbook does not contain any task rows to import.");
  }

  return {
    fileName,
    sheetName: selectedSheet.name || "Tracker",
    tasks,
  };
}
