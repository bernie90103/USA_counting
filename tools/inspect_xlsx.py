from __future__ import annotations

import sys
import zipfile
import xml.etree.ElementTree as ET


NS = {
    "main": "http://schemas.openxmlformats.org/spreadsheetml/2006/main",
    "rel": "http://schemas.openxmlformats.org/officeDocument/2006/relationships",
    "pkgrel": "http://schemas.openxmlformats.org/package/2006/relationships",
}


def read_xml(archive: zipfile.ZipFile, name: str) -> ET.Element:
    return ET.fromstring(archive.read(name))


def shared_strings(archive: zipfile.ZipFile) -> list[str]:
    if "xl/sharedStrings.xml" not in archive.namelist():
        return []

    root = read_xml(archive, "xl/sharedStrings.xml")
    values: list[str] = []
    for item in root.findall("main:si", NS):
        values.append("".join(text.text or "" for text in item.findall(".//main:t", NS)))
    return values


def sheet_paths(archive: zipfile.ZipFile) -> list[tuple[str, str]]:
    workbook = read_xml(archive, "xl/workbook.xml")
    rels = read_xml(archive, "xl/_rels/workbook.xml.rels")
    rel_targets = {
        rel.attrib["Id"]: rel.attrib["Target"]
        for rel in rels.findall("pkgrel:Relationship", NS)
    }

    paths: list[tuple[str, str]] = []
    for sheet in workbook.findall("main:sheets/main:sheet", NS):
        sheet_name = sheet.attrib["name"]
        rel_id = sheet.attrib[f"{{{NS['rel']}}}id"]
        target = rel_targets[rel_id].lstrip("/")
        if not target.startswith("xl/"):
            target = f"xl/{target}"
        paths.append((sheet_name, target))
    return paths


def cell_value(cell: ET.Element, strings: list[str]) -> str:
    value = cell.find("main:v", NS)
    if value is None:
        inline = cell.find("main:is", NS)
        if inline is None:
            return ""
        return "".join(text.text or "" for text in inline.findall(".//main:t", NS))

    raw = value.text or ""
    if cell.attrib.get("t") == "s":
        return strings[int(raw)] if raw.isdigit() and int(raw) < len(strings) else raw
    return raw


def inspect(path: str) -> None:
    with zipfile.ZipFile(path) as archive:
        strings = shared_strings(archive)
        for sheet_name, sheet_path in sheet_paths(archive):
            print(f"## {sheet_name} ({sheet_path})")
            root = read_xml(archive, sheet_path)
            for row in root.findall("main:sheetData/main:row", NS)[:20]:
                values = [cell_value(cell, strings) for cell in row.findall("main:c", NS)]
                print(values)


if __name__ == "__main__":
    inspect(sys.argv[1])
