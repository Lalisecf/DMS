import React, { useEffect, useMemo, useState } from 'react';
import { MaterialReactTable } from 'material-react-table';
import { ArrowLeft, RefreshCw, Globe, Download, Filter as FilterIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button, Card, CardContent } from '../components/Buttons';
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
  const [filters, setFilters] = useState({
    status: '',
    location: '',
    hireDate: { start: '', end: '' },
  });
  const [showFilters, setShowFilters] = useState(false); // for mobile toggle

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
      (rows || []).filter((r) => {
        if (
          filters.status &&
          (r.status || '').toLowerCase() !== filters.status.toLowerCase()
        )
          return false;

        const q = (filters.location || '').trim().toLowerCase();
        if (
          q &&
          !(
            (r.location || '').toLowerCase().includes(q) ||
            (r.name || '').toLowerCase().includes(q)
          )
        )
          return false;

        const hireDate = new Date(r.hireDate);
        if (filters.hireDate?.start && hireDate < new Date(filters.hireDate.start))
          return false;
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

  return (
    <div className="max-w-7xl mx-auto p-6 md:p-8 space-y-8 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex gap-2">
          <Button
            variant="secondary"
            className="shadow hover:shadow-lg transition"
            onClick={() =>
              window.history.length > 1
                ? window.history.back()
                : window.location.assign('/')
            }
          >
            <ArrowLeft size={18} /> {t('page.back')}
          </Button>
          <Button
            onClick={fetchData}
            disabled={loading}
            className="shadow hover:shadow-lg transition"
          >
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />{' '}
            {t('page.reload')}
          </Button>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <div className="text-sm px-3 py-1 border rounded-full bg-white shadow-sm">
            {t(`page.source.${mode === 'mock' ? 'mock' : 'api'}`)}
          </div>
          <label className="inline-flex items-center gap-2 text-sm cursor-pointer">
            API Mode
            <input
              type="checkbox"
              checked={mode === 'api'}
              onChange={(e) => setMode(e.target.checked ? 'api' : 'mock')}
              className="ml-1 rounded border-gray-300 cursor-pointer"
            />
          </label>
          <div className="flex items-center gap-2">
            <Globe size={18} />
            <select
              value={i18n.language}
              onChange={(e) => i18n.changeLanguage(e.target.value)}
              className="p-2 border rounded text-sm bg-white shadow-sm"
            >
              <option value="en">EN</option>
              <option value="om">OR</option>
              <option value="am">AM</option>
            </select>
          </div>
        </div>
      </div>

      {/* Title */}
      <h1 className="text-4xl font-extrabold text-gray-800 drop-shadow-sm">
        {t(merged.titleKey)}
      </h1>

      {/* Mobile filter toggle button */}
      <div className="lg:hidden flex justify-end mb-4">
        <Button
          onClick={() => setShowFilters(!showFilters)}
          className="shadow hover:shadow-lg transition flex items-center gap-1"
        >
          <FilterIcon size={16} /> {showFilters ? 'Hide Filters' : 'Show Filters'}
        </Button>
      </div>

      {/* Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Filters */}
        <div className={`lg:col-span-1 ${showFilters ? 'block' : 'hidden'} lg:block`}>
          <Filters
            config={merged}
            values={filters}
            setValues={setFilters}
            onApply={(v) => setFilters(v)}
            onClear={() =>
              setFilters({ status: '', location: '', hireDate: { start: '', end: '' } })
            }
          />
        </div>

        {/* Table */}
        <div className="lg:col-span-3 space-y-4">
        <Card className="shadow-xl border border-gray-200">
  <CardContent className="p-0 flex flex-col">
    {/* ✅ Export Buttons - sticky on top */}
    <div className="sticky top-0 z-20 p-4 border-b flex flex-wrap justify-end gap-2 bg-white">
      {[
        { fn: exportCSV, label: 'CSV' },
        { fn: exportXLSX, label: 'XLSX' },
        {
          fn: (rows, cols, name) =>
            exportPDF(rows, cols, name, { title: 'Driver Report' }),
          label: 'PDF',
        },
        { fn: (rows, cols, name) => exportJSON(rows, name), label: 'JSON' },
        {
          fn: (rows, cols, name) => exportQuickBooksJSON(rows, name),
          label: 'QuickBooks',
        },
        {
          fn: (rows, cols, name) => exportFMCSAPDF(rows, name),
          label: 'FMCSA',
        },
      ].map((exp, idx) => (
        <Button
          key={idx}
          onClick={() => exp.fn(filtered, cols, merged.export.fileBaseName)}
          variant="outline"
          className="hover:bg-gray-100 transition flex items-center gap-1"
        >
          <Download size={16} /> {exp.label}
        </Button>
      ))}
    </div>

    {/* ✅ Table container fills remaining space */}
    <div className="flex-1 overflow-auto max-h-[70vh]">
      <MaterialReactTable
        columns={cols}
        data={filtered}
        enableSorting={merged.table.sorting}
        state={{ showProgressBars: loading, isLoading: loading }}
        muiTableBodyRowProps={{
          hover: true,
          sx: { transition: 'all 0.2s', '&:hover': { backgroundColor: '#f3f4f6' } },
        }}
        muiTablePaperProps={{ elevation: 0 }}
        initialState={{ density: 'compact' }}
        muiTableContainerProps={{ sx: { minHeight: '0' } }} 
      />
      {!filtered.length && !loading && (
        <div className="p-8 text-center text-gray-400 italic">
          {t('empty.noRows')}
        </div>
      )}
    </div>
  </CardContent>
</Card>

        </div>
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
          range: () => ({
            start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
            end: new Date(),
          }),
        },
        {
          id: 'last30',
          labelKey: 'filter.dateRange.preset.last30',
          range: () => ({
            start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
            end: new Date(),
          }),
        },
        {
          id: 'quarter',
          labelKey: 'filter.dateRange.preset.quarter',
          range: () => {
            const now = new Date();
            const q = Math.floor(now.getMonth() / 3);
            return {
              start: new Date(now.getFullYear(), q * 3, 1),
              end: new Date(now.getFullYear(), q * 3 + 3, 0),
            };
          },
        },
        {
          id: 'last5yrs',
          labelKey: 'filter.dateRange.preset.lastNYears',
          n: 5,
          range: (n) => ({
            start: new Date(new Date().getFullYear() - n, 0, 1),
            end: new Date(),
          }),
        },
      ],
    },
  ],
  export: { fileBaseName: 'drivers-report' },
};
