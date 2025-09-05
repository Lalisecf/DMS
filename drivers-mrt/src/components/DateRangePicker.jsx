import React, { useState } from 'react';
import { Button, Card, CardContent } from './Buttons';
import { Calendar } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const iso = (d) => (d ? new Date(d).toISOString().slice(0, 10) : '');

  export const DateRangePicker = ({ value, onChange, presets = [] }) => {

  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [startDate, setStartDate] = useState(value?.start || '');
  const [endDate, setEndDate] = useState(value?.end || '');

  const applyPreset = (preset) => {
    const { start, end } = preset.range(preset.n);
    onChange({ start: iso(start), end: iso(end) });
    setIsOpen(false);
  };

  const applyCustomRange = () => {
    onChange({ start: startDate, end: endDate });
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <Button variant="outline" onClick={() => setIsOpen(!isOpen)}>
        <Calendar size={16} />
        {value?.start && value?.end ? `${value.start} to ${value.end}` : 'Select date range'}
      </Button>

      {isOpen && (
        <Card className="absolute top-full left-0 mt-1 z-10 w-80">
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-sm font-medium">Start Date</label>
                  <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full p-2 border rounded" />
                </div>
                <div>
                  <label className="text-sm font-medium">End Date</label>
                  <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full p-2 border rounded" />
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="font-medium">Presets</h4>
                {presets.map(preset => (
                  <button key={preset.id} className="block w-full text-left px-3 py-1 text-sm hover:bg-gray-100 rounded" onClick={() => applyPreset(preset)}>
                    {preset.n ? t(preset.labelKey, { n: preset.n }) : t(preset.labelKey)}
                  </button>
                ))}
              </div>

              <Button onClick={applyCustomRange} className="w-full">Apply Custom Range</Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
