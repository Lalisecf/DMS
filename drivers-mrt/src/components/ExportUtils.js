import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

//
// CSV Export
//
export const exportCSV = (rows, cols, fileName) => {
  const header = cols.map(c => c.header);
  const data = rows.map(row => cols.map(col => row[col.accessorKey] || ''));
  const worksheet = XLSX.utils.aoa_to_sheet([header, ...data]);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Drivers');
  XLSX.writeFile(workbook, `${fileName}.csv`);
};

//
// Excel (XLSX) Export
//
export const exportXLSX = (rows, cols, fileName) => {
  const header = cols.map(c => c.header);
  const data = rows.map(row => cols.map(col => row[col.accessorKey] || ''));
  const worksheet = XLSX.utils.aoa_to_sheet([header, ...data]);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Drivers');
  XLSX.writeFile(workbook, `${fileName}.xlsx`);
};

//
// PDF Export (with configurable styling)
//
export const exportPDF = (rows, cols, fileName, cfg = {}) => {
  const doc = new jsPDF();

  if (cfg.title) {
    doc.setFontSize(cfg.titleFontSize || 16);
    doc.text(cfg.title, 14, 15);
  }

  const headers = cols.map(c => c.header);
  const data = rows.map(row => cols.map(col => row[col.accessorKey] || ''));

  autoTable(doc, {
    head: [headers],
    body: data,
    startY: cfg.title ? 22 : 15,
    theme: cfg.theme || 'grid',
    styles: { fontSize: cfg.fontSize || 10, ...cfg.styles },
    headStyles: { fillColor: cfg.headerColor || [66, 135, 245] },
    alternateRowStyles: cfg.altRowColor ? { fillColor: cfg.altRowColor } : undefined,
  });

  doc.save(`${fileName}.pdf`);
};

//
// JSON Export (generic or custom)
//
export const exportJSON = (rows, fileName, mapper) => {
  const out = mapper ? mapper(rows) : rows;
  const dataStr = JSON.stringify(out, null, 2);
  const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
  const linkElement = document.createElement('a');
  linkElement.setAttribute('href', dataUri);
  linkElement.setAttribute('download', `${fileName}.json`);
  linkElement.click();
};

//
// QuickBooks JSON Export
//
export const exportQuickBooksJSON = (rows, fileName) => {
  const qbData = rows.map(r => ({
    TxnDate: r.hireDate,
    EntityRef: { name: r.name, value: r.id },
    Status: r.status,
    Location: r.location
  }));
  exportJSON(qbData, `${fileName}-QuickBooks`);
};

//
// FMCSA PDF Export
//
export const exportFMCSAPDF = (rows, fileName) => {
  const doc = new jsPDF();

  doc.setFontSize(18);
  doc.text("FMCSA Driver Report", 14, 15);

  const headers = ["Driver ID", "Name", "Status", "Location", "Hire Date"];
  const data = rows.map(r => [
    r.id, r.name, r.status, r.location, r.hireDate
  ]);

  autoTable(doc, {
    head: [headers],
    body: data,
    startY: 25,
    theme: 'striped',
    headStyles: { fillColor: [0, 51, 102], textColor: [255, 255, 255] },
  });

  doc.save(`${fileName}-FMCSA.pdf`);
};
