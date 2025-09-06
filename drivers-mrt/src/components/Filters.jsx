import React, { useEffect, useRef } from 'react';
import { Card, CardContent, Button } from './Buttons';
import { Filter } from 'lucide-react';
import { DateRangePicker } from './DateRangePicker';
import { useTranslation } from 'react-i18next';

export function Filters({ config, values, setValues, onApply, onClear }) {
  const { t } = useTranslation();
  const local = useRef({ ...values });

  useEffect(() => {
    local.current = { ...values };
  }, [values]);

  const onText = (id, v, debounce = 0) => {
    if (debounce) {
      clearTimeout(local.current[`timer_${id}`]);
      local.current[`timer_${id}`] = setTimeout(() => setValues(prev => ({ ...prev, [id]: v })), debounce);
    } else {
      setValues(prev => ({ ...prev, [id]: v }));
    }
  };

  const onSelect = (id, v) => setValues(prev => ({ ...prev, [id]: v }));
  const onDate = (id, patch) => setValues(prev => ({ ...prev, [id]: { ...(prev[id] || {}), ...patch } }));

  return (
    <Card className="w-full">
      <CardContent>
        <div className="flex items-center gap-2 mb-4">
          <Filter size={18} />
          <strong className="text-lg">{t('page.filters.title')}</strong>
        </div>

        {/* Filters side by side */}
        <div className="flex flex-wrap gap-4">
          {config.filters.map(f => {
            if (f.type === 'select') {
              const val = values[f.id] || '';
              return (
                <div key={f.id} className="flex-1 min-w-[150px]">
                  <label className="block text-sm font-medium">{t(f.labelKey)}</label>
                  <select
                    value={val}
                    onChange={e => onSelect(f.id, e.target.value)}
                    className="w-full p-2 border rounded-md bg-white shadow-sm hover:border-gray-400 transition"
                  >
                    {f.options.map(o => (
                      <option key={o.value} value={o.value}>
                        {o.value === '' ? 'All' : t(o.labelKey)}
                      </option>
                    ))}
                  </select>
                </div>
              );
            }

            if (f.type === 'text') {
              return (
                <div key={f.id} className="flex-1 min-w-[150px]">
                  <label className="block text-sm font-medium">{t(f.labelKey)}</label>
                  <input
                    value={values[f.id] || ''}
                    onChange={e => onText(f.id, e.target.value, f.debounceMs || 0)}
                    className="w-full p-2 border rounded-md"
                    placeholder={t(f.labelKey)}
                  />
                </div>
              );
            }

            if (f.type === 'dateRange') {
              const v = values[f.id] || {};
              return (
                <div key={f.id} className="flex-1 min-w-[200px]">
                  <label className="block text-sm font-medium">{t(f.labelKey)}</label>
                  <DateRangePicker value={v} onChange={range => onDate(f.id, range)} presets={f.presets} />
                  {v.start && v.end && (
                    <div className="text-xs mt-1">
                      Selected: {v.start} to {v.end}
                    </div>
                  )}
                </div>
              );
            }

            return null;
          })}
        </div>

        {/* Apply / Clear buttons inline */}
        <div className="mt-4 flex flex-wrap gap-2 justify-start">
          <Button onClick={() => onApply(values)}>{t('page.filters.apply')}</Button>
          <Button variant="secondary" onClick={onClear}>
            {t('page.filters.clear')}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
