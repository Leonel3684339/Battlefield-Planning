interface AnalysisSectionProps {
  losActive: boolean;
  setLosActive: (active: boolean) => void;
  onGenerateAI: () => void;
  onReset: () => void;
  isGenerating: boolean;
  onClearAll?: () => void; // new
}

export function AnalysisSection({ losActive, setLosActive, onGenerateAI, onReset, isGenerating, onClearAll }: AnalysisSectionProps) {
  return (
    <div className="space-y-3">
      <h3 className="text-md font-semibold text-[#e0e0c0] border-b border-[#5a5a3e] pb-1">Analysis</h3>
      <button
        onClick={() => setLosActive(!losActive)}
        className={`w-full px-3 py-2 rounded transition ${
          losActive
            ? 'bg-[#4b5320] text-[#e0e0c0]'
            : 'bg-[#2e3b2e] text-[#b0a080] hover:bg-[#4b5320] hover:text-[#e0e0c0]'
        }`}
      >
        {losActive ? 'LOS Active' : 'Line of Sight'}
      </button>
      <button
        onClick={onGenerateAI}
        disabled={isGenerating}
        className={`w-full px-3 py-2 rounded transition ${
          isGenerating
            ? 'bg-gray-600 cursor-not-allowed text-gray-300'
            : 'bg-[#4b5320] hover:bg-[#3a4018] text-[#e0e0c0]'
        }`}
      >
        {isGenerating ? 'Generating...' : 'Generate AI Plan'}
      </button>
      <button
        onClick={onReset}
        className="w-full px-3 py-2 bg-[#2e3b2e] text-[#b0a080] hover:bg-[#4b5320] hover:text-[#e0e0c0] rounded transition"
      >
        Reset
      </button>
      {onClearAll && (
        <button
          onClick={onClearAll}
          className="w-full px-3 py-2 bg-[#2e3b2e] text-[#b0a080] hover:bg-[#4b5320] hover:text-[#e0e0c0] rounded transition"
        >
          Clear All
        </button>
      )}
    </div>
  );
}