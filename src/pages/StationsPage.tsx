import { useState } from 'react';
import { stations, lineMeta } from '../data/network';
import { getStationName } from '../components/StationPicker';
import { useLanguage } from '../i18n/LanguageContext';

export default function StationsPage() {
  const { lang } = useLanguage();
  const [activeLine, setActiveLine] = useState<'east-nile' | 'west-nile'>('east-nile');

  const lineStations = stations.filter((s: any) => {
    if (Array.isArray(s.lines)) return s.lines.includes(activeLine);
    return s.line === activeLine;
  });

  const meta = (lineMeta as any)?.[activeLine];

  return (
    <div className="subpage w-full min-h-screen bg-slate-50 text-slate-800 p-4 md:p-6 lg:p-8 font-sans">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column: Stations Timeline */}
        <div className="lg:col-span-9 bg-white rounded-3xl border border-slate-200 p-6 md:p-8 shadow-xs">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-6 mb-8 gap-4">
            <div>
              <span className="text-xs font-bold text-blue-600 uppercase tracking-wide">
                Stations Guide
              </span>
              <h1 className="text-2xl md:text-3xl font-bold text-slate-900 mt-1">
                {activeLine === 'east-nile' ? 'East Nile Line' : 'West Nile Line'}
              </h1>
            </div>

            <div className="flex items-center gap-3">
              <span className="px-3 py-1 bg-blue-50 text-blue-600 text-xs font-bold rounded-full">
                {lineStations.length} stations
              </span>

              <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200">
                <button
                  onClick={() => setActiveLine('east-nile')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
                    activeLine === 'east-nile'
                      ? 'bg-amber-400 text-slate-950 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  East Nile
                </button>
                <button
                  onClick={() => setActiveLine('west-nile')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
                    activeLine === 'west-nile'
                      ? 'bg-sky-500 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  West Nile
                </button>
              </div>
            </div>
          </div>

          {/* Timeline List */}
          <div className="space-y-6">
            {lineStations.map((st: any, idx: number) => {
              const isFirst = idx === 0;
              const isLast = idx === lineStations.length - 1;
              const transferNote = st.transfer || st.note;

              return (
                <div key={st.id || idx} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-none">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-bold text-slate-900">
                      {getStationName(st.name, lang)}
                    </span>

                    {transferNote && (
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
                        {typeof transferNote === 'object' ? getStationName(transferNote, lang) : transferNote}
                      </span>
                    )}

                    {isFirst && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-500">
                        Line start
                      </span>
                    )}
                    {isLast && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-500">
                        Line end
                      </span>
                    )}
                  </div>

                  <div className="w-4 h-4 rounded-full border-2 border-blue-600 bg-white"></div>
                </div>
              );
            })}
          </div>

          <div className="mt-8 pt-4 border-t border-slate-100 text-xs text-slate-400 flex items-center justify-between">
            <span>Data is based on official monorail project announcements and subject to change.</span>
            <span className="font-bold text-slate-600">National Authority for Tunnels</span>
          </div>

        </div>

        {/* Right Column: Dark Blue Monorail Card */}
        <div className="lg:col-span-3">
          <div className="bg-blue-900 text-white rounded-3xl p-6 shadow-sm flex flex-col justify-between min-h-[400px]">
            <div>
              <div className="w-10 h-10 bg-yellow-400 rounded-xl flex items-center justify-center text-slate-950 font-bold text-xl mb-4">
                M
              </div>
              <h2 className="text-xl font-bold mb-2">Driverless trains</h2>
              <p className="text-xs text-blue-200 leading-relaxed">
                The monorail operates automatically with platform screen doors for safety.
              </p>
            </div>

            <div className="mt-6 pt-4 border-t border-blue-800">
              <span className="text-[10px] text-blue-300 font-bold uppercase tracking-wider block">
                Coming soon
              </span>
              <h3 className="text-lg font-bold text-yellow-400">West Nile Line</h3>
              <p className="text-xs text-blue-200 mt-0.5">
                Under construction: {meta?.totalStations || 13} stations
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
