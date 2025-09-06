import React, { useEffect, useMemo, useState } from 'react';
import { MaterialReactTable } from 'material-react-table';
import { ArrowLeft, RefreshCw, Globe, Download } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Filters } from '../components/Filters';
import { exportCSV, exportXLSX, exportPDF, exportJSON, exportQuickBooksJSON, exportFMCSAPDF } from '../components/ExportUtils';
import { mockDrivers } from '../data/mockDrivers';
import './DriversPage.css';

export default function DriversPage({ config: incoming = {} }) {
  const merged = useMemo(() => ({ ...baseConfig, ...incoming }), [incoming]);
  const { t, i18n } = useTranslation();

  useEffect(() => {
    if (merged.i18n?.lng) i18n.changeLanguage(merged.i18n.lng);
  }, [merged.i18n?.lng, i18n]);

  const [mode, setMode] = useState(merged.dataSource.mode || 'mock');
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({ status: '', location: '', hireDate: { start: '', end: '' } });

  const fetchData = async () => {
    setLoading(true);
    try {
      if (mode === 'mock') {
        await new Promise((r) => setTimeout(r, 500));
        setRows(mockDrivers);
      } else {
        const res = await fetch(merged.dataSource.api.url, {
          method: merged.dataSource.api.method || 'GET',
        });
        const json = await res.json();
        const mapped = merged.dataSource.api.map
          ? merged.dataSource.api.map(json)
          : json.map((d) => ({
              id: d.id,
              name: d.name || d.fullName || '',
              status: d.status || d.state || '',
              location: d.location || d.city || '',
              hireDate: d.hireDate || d.hiredOn || '',
            }));
        setRows(mapped);
      }
    } catch (e) {
      console.error('Failed to fetch data:', e);
      setRows(mockDrivers);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [mode]);

  const filtered = useMemo(
    () =>
      rows.filter((r) => {
        if (filters.status && r.status.toLowerCase() !== filters.status.toLowerCase()) return false;
        const q = (filters.location || '').trim().toLowerCase();
        if (q && !((r.location || '').toLowerCase().includes(q) || (r.name || '').toLowerCase().includes(q)))
          return false;
        const hireDate = new Date(r.hireDate);
        if (filters.hireDate?.start && hireDate < new Date(filters.hireDate.start)) return false;
        if (filters.hireDate?.end) {
          const end = new Date(filters.hireDate.end);
          end.setHours(23, 59, 59);
          if (hireDate > end) return false;
        }
        return true;
      }),
    [rows, filters]
  );

  const cols = useMemo(
    () =>
      merged.table.columns.map((c) => ({
        accessorKey: c.accessorKey,
        header: t(c.headerKey),
        size: c.accessorKey === 'id' ? 50 : 150,
      })),
    [merged.table.columns, t]
  );

  const exportButtons = [
    { fn: exportCSV, label: 'CSV' },
    { fn: exportXLSX, label: 'XLSX' },
    { fn: (rows, cols, name) => exportPDF(rows, cols, name, { title: 'Driver Report' }), label: 'PDF' },
    { fn: (rows, cols, name) => exportJSON(rows, name), label: 'JSON' },
    { fn: (rows, cols, name) => exportQuickBooksJSON(rows, name), label: 'QuickBooks' },
    { fn: (rows, cols, name) => exportFMCSAPDF(rows, name), label: 'FMCSA' },
  ];

  return (
    <div className="page">
      {/* Header */}
      <div className="header">
        <div className="left-actions">
          <button onClick={() => (window.history.length > 1 ? window.history.back() : window.location.assign('/'))}>
            <ArrowLeft size={16} /> {t('page.back')}
          </button>
          <button onClick={fetchData} disabled={loading}>
            <RefreshCw size={16} className={loading ? 'spin' : ''} /> {t('page.reload')}
          </button>
        </div>

        <div className="right-actions">
          <span className="badge">{t(`page.source.${mode === 'mock' ? 'mock' : 'api'}`)}</span>
          <label className="switch">
            <input type="checkbox" checked={mode === 'api'} onChange={(e) => setMode(e.target.checked ? 'api' : 'mock')} />
            <span>API Mode</span>
          </label>
          <select value={i18n.language} onChange={(e) => i18n.changeLanguage(e.target.value)}>
            <option value="en">EN</option>
            <option value="om">OR</option>
            <option value="am">AM</option>
          </select>
        </div>
      </div>

   
      <h1 className="title">{t(merged.titleKey)}</h1>

  
      <div className="layout">
        {}
        <aside className="filters">
          <Filters config={merged} values={filters} setValues={setFilters} onApply={(v) => setFilters(v)}
            onClear={() => setFilters({ status: '', location: '', hireDate: { start: '', end: '' } })} />
        </aside>

  
        <main className="table-area">
  <div className="table-header">
    <h2>{t('Driver list')}</h2>
    <div className="export-buttons">
      {exportButtons.map((exp, idx) => (
        <button key={idx} onClick={() => exp.fn(filtered, cols, merged.export.fileBaseName)}>
          <Download size={14} /> {exp.label}
        </button>
      ))}
    </div>
  </div>

  <MaterialReactTable
    columns={cols}
    data={filtered}
    enableSorting={merged.table.sorting}
    enableColumnResizing
    enableExpanding
    stickyHeader
    muiTableContainerProps={{
      sx: { maxHeight: 600, overflowY: 'auto' },
    }}
    state={{ showProgressBars: loading, isLoading: loading }}
  />

  {!filtered.length && !loading && <div className="empty">{t('empty.noRows')}</div>}
</main>


      </div>
    </div>
  );
}



export const baseConfig = {
  titleKey: 'page.title',
  dataSource: {
    mode: 'mock',
    mockData: mockDrivers,
    api: {
      url: 'http://localhost:5000/drivers',
      method: 'GET',
      map: (data) =>
        data.map((d) => ({
          id: d.id,
          name: d.name || d.fullName || '',
          status: d.status || d.state || '',
          location: d.location || d.city || '',
          hireDate: d.hireDate || d.hiredOn || '',
        })),
    },
  },
  table: {
    columns: [
      { accessorKey: 'id', headerKey: 'col.id' },
      { accessorKey: 'name', headerKey: 'col.name' },
      { accessorKey: 'status', headerKey: 'col.status' },
      { accessorKey: 'location', headerKey: 'col.location' },
      { accessorKey: 'hireDate', headerKey: 'col.hireDate' },
    ],
    sorting: true,
  },
  filters: [
    { type: 'select', id: 'status', labelKey: 'filter.status.label', multi: false, options: [
        { value: '', labelKey: 'filter.status.all' },
        { value: 'Active', labelKey: 'filter.status.active' },
        { value: 'Inactive', labelKey: 'filter.status.inactive' },
      ] },
    { type: 'text', id: 'location', labelKey: 'filter.location.label' },
    { type: 'dateRange', id: 'hireDate', labelKey: 'filter.dateRange.label', presets: [
        { id: 'last7', labelKey: 'filter.dateRange.preset.last7', range: () => ({ start: new Date(Date.now() - 7 * 86400000), end: new Date() }) },
        { id: 'last30', labelKey: 'filter.dateRange.preset.last30', range: () => ({ start: new Date(Date.now() - 30 * 86400000), end: new Date() }) },
      ] },
  ],
  export: { fileBaseName: 'drivers-report' },
};
