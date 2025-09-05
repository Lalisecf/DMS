import React, { useEffect, useMemo, useState } from 'react';
import { MaterialReactTable } from 'material-react-table';
import { ArrowLeft, RefreshCw, Globe, Download, Filter as FilterIcon, ChevronDown, ChevronUp } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Filters } from '../components/Filters';
import {
  exportCSV,
  exportXLSX,
  exportPDF,
  exportJSON,
  exportQuickBooksJSON,
  exportFMCSAPDF,
} from '../components/ExportUtils';
import { mockDrivers } from '../data/mockDrivers';

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
  const [showFilters, setShowFilters] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (mode === 'mock') {
        await new Promise((r) => setTimeout(r, 500));
        setRows(mockDrivers);
      } else {
        const res = await fetch(merged.dataSource.api.url, { method: merged.dataSource.api.method || 'GET' });
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

  useEffect(() => { fetchData(); }, [mode]);

  const filtered = useMemo(
    () => rows.filter((r) => {
      if (filters.status && r.status.toLowerCase() !== filters.status.toLowerCase()) return false;
      const q = (filters.location || '').trim().toLowerCase();
      if (q && !((r.location || '').toLowerCase().includes(q) || (r.name || '').toLowerCase().includes(q))) return false;
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

  const cols = useMemo(() =>
    merged.table.columns.map((c) => ({
      accessorKey: c.accessorKey,
      header: t(c.headerKey),
      size: c.accessorKey === 'id' ? 50 : 150,
    })),
    [merged.table.columns, t]
  );

  const exportButtons = [
    { fn: exportCSV, label: 'CSV', color: 'secondary' },
    { fn: exportXLSX, label: 'XLSX', color: 'success' },
    { fn: (rows, cols, name) => exportPDF(rows, cols, name, { title: 'Driver Report' }), label: 'PDF', color: 'danger' },
    { fn: (rows, cols, name) => exportJSON(rows, name), label: 'JSON', color: 'warning' },
    { fn: (rows, cols, name) => exportQuickBooksJSON(rows, name), label: 'QuickBooks', color: 'info' },
    { fn: (rows, cols, name) => exportFMCSAPDF(rows, name), label: 'FMCSA', color: 'dark' },
  ];

  return (
    <div className="container-fluid bg-light min-vh-100 py-4">
      <div className="container">
        {/* Header */}
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-start mb-4">
          <div className="d-flex mb-3 mb-md-0">
            <button className="btn btn-outline-primary mr-2" onClick={() => window.history.length > 1 ? window.history.back() : window.location.assign('/')}>
              <ArrowLeft size={18} className="mr-1" /> {t('page.back')}
            </button>
            <button className="btn btn-outline-secondary" onClick={fetchData} disabled={loading}>
              <RefreshCw size={18} className={loading ? 'spinner-border spinner-border-sm mr-1' : 'mr-1'} /> {t('page.reload')}
            </button>
          </div>

          <div className="d-flex align-items-center flex-wrap">
            <span className="badge badge-info text-dark px-3 py-2 mr-2 mb-2">{t(`page.source.${mode === 'mock' ? 'mock' : 'api'}`)}</span>
            <div className="custom-control custom-switch mr-3 mb-2">
              <input type="checkbox" className="custom-control-input" id="apiModeToggle" checked={mode === 'api'} onChange={e => setMode(e.target.checked ? 'api' : 'mock')} />
              <label className="custom-control-label" htmlFor="apiModeToggle">API Mode</label>
            </div>
            <div className="input-group input-group-sm mb-2">
              <Globe size={18} className="text-primary mr-1" />
              <select value={i18n.language} onChange={(e) => i18n.changeLanguage(e.target.value)} className="custom-select">
                <option value="en">EN</option>
                <option value="om">OR</option>
                <option value="am">AM</option>
              </select>
            </div>
          </div>
        </div>

        {/* Page Title */}
        <div className="card shadow-sm mb-4">
          <div className="card-body">
            <h1 className="h3 text-primary">{t(merged.titleKey)}</h1>
          </div>
        </div>

        {/* Mobile Filter Toggle */}
        <div className="d-lg-none d-flex justify-content-end mb-3">
          <button className="btn btn-outline-primary d-flex align-items-center" onClick={() => setShowFilters(!showFilters)}>
            <FilterIcon size={16} className="mr-1" /> {showFilters ? 'Hide Filters' : 'Show Filters'}
            {showFilters ? <ChevronUp size={16} className="ml-1" /> : <ChevronDown size={16} className="ml-1" />}
          </button>
        </div>

        <div className="row">
          {/* Filters - FIXED */}
          <div className={`col-lg-3 mb-4 ${showFilters ? 'd-block' : 'd-none d-lg-block'}`}>
            <div className="card shadow-sm">
              <div className="card-header bg-white">
                <h5 className="text-primary mb-0"><FilterIcon size={18} className="mr-2" /> Filters</h5>
              </div>
              <div className="card-body">
                <Filters config={merged} values={filters} setValues={setFilters} onApply={v => setFilters(v)} onClear={() => setFilters({ status: '', location: '', hireDate: { start: '', end: '' } })} />
              </div>
            </div>
          </div>

          {/* Main Table - FIXED with proper scrolling */}
          <div className={`col-lg-9 ${showFilters ? 'd-none d-lg-block' : ''}`}>
            <div className="card shadow-sm">
              <div className="card-header d-flex justify-content-between align-items-center">
                <h5 className="text-primary mb-0">Drivers List</h5>
                <div className="d-flex flex-wrap">
                  {exportButtons.map((exp, idx) => (
                    <button key={idx} className={`btn btn-sm btn-${exp.color} mr-2 mb-2 d-flex align-items-center`} onClick={() => exp.fn(filtered, cols, merged.export.fileBaseName)}>
                      <Download size={14} className="mr-1" /> {exp.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Added max-height and overflow to contain expanded rows */}
              <div className="card-body p-0 table-responsive" style={{ maxHeight: 'calc(100vh - 300px)', overflow: 'auto' }}>
                <MaterialReactTable
                  columns={cols}
                  data={filtered}
                  enableSorting={merged.table.sorting}
                  state={{ showProgressBars: loading, isLoading: loading }}
                  // Enable row expansion
                  enableExpanding={true}
                  // Bootstrap-style overrides
                  muiTableBodyRowProps={{
                    hover: true,
                    sx: {
                      transition: 'all 0.2s',
                      '&:hover': { backgroundColor: '#f8f9fa' },
                    },
                  }}
                  muiTablePaperProps={{
                    elevation: 0,
                    sx: { 
                      border: '1px solid #dee2e6',
                      maxHeight: '100%',
                      overflow: 'hidden'
                    },
                  }}
                  muiTableHeadCellProps={{
                    sx: {
                      backgroundColor: '#e9ecef',
                      fontWeight: 'bold',
                      color: '#495057',
                      borderBottom: '1px solid #dee2e6',
                    },
                  }}
                  muiTableContainerProps={{
                    sx: { maxHeight: '100%' }
                  }}
                />
                {!filtered.length && !loading && <div className="text-center py-5 text-muted font-italic">{t('empty.noRows')}</div>}
              </div>

              <div className="card-footer bg-light d-flex justify-content-between align-items-center">
                <small className="text-muted">Showing {filtered.length} of {filtered.length} records</small>
                <div className="d-flex align-items-center">
                  <small className="text-muted mr-2">Rows per page:</small>
                  <select className="custom-select custom-select-sm" style={{ width: 'auto' }}>
                    <option>10</option>
                    <option>25</option>
                    <option>50</option>
                    <option>100</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

// Base config (unchanged)
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
    {
      type: 'select',
      id: 'status',
      labelKey: 'filter.status.label',
      multi: false,
      options: [
        { value: '', labelKey: 'filter.status.all' },
        { value: 'Active', labelKey: 'filter.status.active' },
        { value: 'Inactive', labelKey: 'filter.status.inactive' },
      ],
    },
    { type: 'text', id: 'location', labelKey: 'filter.location.label' },
    {
      type: 'dateRange',
      id: 'hireDate',
      labelKey: 'filter.dateRange.label',
      presets: [
        {
          id: 'last7',
          labelKey: 'filter.dateRange.preset.last7',
          range: () => ({ start: new Date(Date.now() - 7*24*60*60*1000), end: new Date() }),
        },
        {
          id: 'last30',
          labelKey: 'filter.dateRange.preset.last30',
          range: () => ({ start: new Date(Date.now() - 30*24*60*60*1000), end: new Date() }),
        },
        {
          id: 'quarter',
          labelKey: 'filter.dateRange.preset.quarter',
          range: () => {
            const now = new Date();
            const q = Math.floor(now.getMonth()/3);
            return { start: new Date(now.getFullYear(), q*3, 1), end: new Date(now.getFullYear(), q*3+3, 0) };
          },
        },
        {
          id: 'last5yrs',
          labelKey: 'filter.dateRange.preset.lastNYears',
          n: 5,
          range: (n) => ({ start: new Date(new Date().getFullYear() - n, 0, 1), end: new Date() }),
        },
      ],
    },
  ],
  export: { fileBaseName: 'drivers-report' },
};