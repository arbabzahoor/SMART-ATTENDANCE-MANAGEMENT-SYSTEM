import React, { useState } from 'react';
import { Calculator, AlertCircle, CheckCircle, ArrowRight, Zap, Target } from 'lucide-react';

interface AttendanceCalculatorProps {
  defaultAttended?: number;
  defaultTotal?: number;
  minThreshold?: number;
}

export const AttendanceCalculator: React.FC<AttendanceCalculatorProps> = ({
  defaultAttended = 18,
  defaultTotal = 25,
  minThreshold = 75,
}) => {
  const [attended, setAttended] = useState<number>(defaultAttended);
  const [total, setTotal] = useState<number>(defaultTotal);
  const [targetPct, setTargetPct] = useState<number>(minThreshold);

  const safeTotal = total > 0 ? total : 1;
  const safeAttended = Math.min(attended, safeTotal);
  const currentPct = Math.round((safeAttended / safeTotal) * 100);

  // Formulas
  let neededClasses = 0;
  let missableClasses = 0;

  if (currentPct < targetPct) {
    neededClasses = Math.ceil((targetPct * safeTotal - 100 * safeAttended) / (100 - targetPct));
    if (neededClasses < 0) neededClasses = 0;
  } else {
    missableClasses = Math.floor((100 * safeAttended - targetPct * safeTotal) / targetPct);
    if (missableClasses < 0) missableClasses = 0;
  }

  return (
    <div className="saas-card p-6 max-w-4xl mx-auto text-[#292524]">
      <div className="flex items-center gap-3 mb-6 pb-4 border-b border-[#E7E5E4]">
        <div className="p-3 bg-[#EAF5F0] text-[#3F8F72] rounded-xl border border-[#A3D9C9]">
          <Calculator className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-xl font-bold tracking-tight text-[#292524]">Smart Attendance Prediction Calculator</h2>
          <p className="text-xs text-[#57534E]">
            Accurate mathematical prediction model to maintain your required attendance threshold.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        
        {/* Attended input */}
        <div className="bg-[#F5F5F4] p-4 rounded-xl border border-[#E7E5E4]">
          <label className="block text-xs font-semibold text-[#57534E] mb-2">Attended Classes</label>
          <input
            type="number"
            min="0"
            max={total}
            value={attended}
            onChange={e => setAttended(Math.max(0, parseInt(e.target.value) || 0))}
            className="w-full bg-white border border-[#D6D3D1] rounded-lg px-3 py-2 text-sm font-bold text-[#292524] focus:outline-none focus:border-[#3F8F72]"
          />
        </div>

        {/* Total input */}
        <div className="bg-[#F5F5F4] p-4 rounded-xl border border-[#E7E5E4]">
          <label className="block text-xs font-semibold text-[#57534E] mb-2">Total Conducted Classes</label>
          <input
            type="number"
            min="1"
            value={total}
            onChange={e => setTotal(Math.max(1, parseInt(e.target.value) || 1))}
            className="w-full bg-white border border-[#D6D3D1] rounded-lg px-3 py-2 text-sm font-bold text-[#292524] focus:outline-none focus:border-[#3F8F72]"
          />
        </div>

        {/* Target Threshold */}
        <div className="bg-[#F5F5F4] p-4 rounded-xl border border-[#E7E5E4]">
          <label className="block text-xs font-semibold text-[#57534E] mb-2">Required Target (%)</label>
          <input
            type="number"
            min="50"
            max="100"
            value={targetPct}
            onChange={e => setTargetPct(Math.min(100, Math.max(10, parseInt(e.target.value) || 75)))}
            className="w-full bg-white border border-[#D6D3D1] rounded-lg px-3 py-2 text-sm font-bold text-[#292524] focus:outline-none focus:border-[#3F8F72]"
          />
        </div>

      </div>

      {/* Progress Bar Display */}
      <div className="bg-[#F5F5F4] p-5 rounded-xl border border-[#E7E5E4] mb-8">
        <div className="flex justify-between items-center mb-2">
          <span className="text-xs font-semibold text-[#57534E]">Current Attendance Rate</span>
          <span className={`text-sm font-extrabold ${currentPct >= targetPct ? 'text-[#3F8F72]' : 'text-[#D95C5C]'}`}>
            {currentPct}%
          </span>
        </div>
        
        <div className="w-full bg-[#E7E5E4] h-4 rounded-full overflow-hidden relative">
          <div
            className={`h-full transition-all duration-500 rounded-full ${
              currentPct >= targetPct
                ? 'bg-[#3F8F72]'
                : 'bg-[#D95C5C]'
            }`}
            style={{ width: `${Math.min(100, currentPct)}%` }}
          />
          {/* Target marker line */}
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-[#D99A3D] z-10 shadow-xs"
            style={{ left: `${targetPct}%` }}
            title={`Required threshold: ${targetPct}%`}
          />
        </div>
        
        <div className="flex justify-between text-[11px] text-[#57534E] mt-2">
          <span>0%</span>
          <span className="text-[#D99A3D] font-semibold">Target Threshold: {targetPct}%</span>
          <span>100%</span>
        </div>
      </div>

      {/* Calculation Result Cards */}
      {currentPct < targetPct ? (
        <div className="bg-[#FDF2F2] border border-[#FCA5A5] rounded-2xl p-5 flex items-start gap-4">
          <AlertCircle className="w-8 h-8 text-[#D95C5C] shrink-0 mt-1" />
          <div className="space-y-1.5">
            <h3 className="text-base font-bold text-[#292524]">Below Required Attendance Threshold!</h3>
            <p className="text-xs text-[#57534E] leading-relaxed">
              Your attendance is currently <span className="font-bold text-[#D95C5C]">{currentPct}%</span>, which is below the required <span className="font-bold text-[#D99A3D]">{targetPct}%</span> limit.
            </p>
            <div className="mt-3 p-3 bg-white rounded-xl border border-[#FCA5A5] inline-flex items-center gap-3 shadow-2xs">
              <Zap className="w-5 h-5 text-[#D99A3D] shrink-0" />
              <span className="text-sm font-bold text-[#292524]">
                You must attend the next <span className="text-[#D99A3D] text-base">{neededClasses}</span> consecutive classes without missing to reach {targetPct}%.
              </span>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-[#EAF5F0] border border-[#A3D9C9] rounded-2xl p-5 flex items-start gap-4">
          <CheckCircle className="w-8 h-8 text-[#3F8F72] shrink-0 mt-1" />
          <div className="space-y-1.5">
            <h3 className="text-base font-bold text-[#292524]">Safe Attendance Level!</h3>
            <p className="text-xs text-[#57534E] leading-relaxed">
              Your attendance is currently <span className="font-bold text-[#3F8F72]">{currentPct}%</span>, well above the required threshold of <span className="font-bold text-[#D99A3D]">{targetPct}%</span>.
            </p>
            <div className="mt-3 p-3 bg-white rounded-xl border border-[#A3D9C9] inline-flex items-center gap-3 shadow-2xs">
              <Target className="w-5 h-5 text-[#3F8F72] shrink-0" />
              <span className="text-sm font-bold text-[#292524]">
                You can miss up to <span className="text-[#3F8F72] text-base">{missableClasses}</span> upcoming classes and still maintain {targetPct}%.
              </span>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
