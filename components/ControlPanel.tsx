import React from 'react';
import { WindSettings, ModelSettings } from '../types';
import { Upload, Wind, Activity, Gauge, Box } from 'lucide-react';

interface ControlPanelProps {
  settings: WindSettings;
  modelSettings: ModelSettings;
  onSettingsChange: (newSettings: WindSettings) => void;
  onModelSettingsChange: (newSettings: ModelSettings) => void;
  onFileUpload: (file: File) => void;
  onAnalyze: () => void;
  isAnalyzing: boolean;
  analysisResult: string | null;
}

export const ControlPanel: React.FC<ControlPanelProps> = ({
  settings,
  modelSettings,
  onSettingsChange,
  onModelSettingsChange,
  onFileUpload,
  onAnalyze,
  isAnalyzing,
  analysisResult,
}) => {
  
  const handleSliderChange = (key: keyof WindSettings, value: number) => {
    onSettingsChange({ ...settings, [key]: value });
  };

  const handleModelRotationChange = (key: keyof ModelSettings, value: number) => {
    onModelSettingsChange({ ...modelSettings, [key]: value });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onFileUpload(e.target.files[0]);
    }
  };

  return (
    <div className="absolute top-0 left-0 h-full w-80 bg-slate-900/90 backdrop-blur-md border-r border-slate-700 p-6 overflow-y-auto text-slate-100 flex flex-col gap-6 z-10">
      <div>
        <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent mb-2">
          AeroFlow
        </h1>
        <p className="text-xs text-slate-400">Advanced Wind Tunnel Simulation</p>
      </div>

      {/* Upload Section */}
      <div className="p-4 border border-dashed border-slate-600 rounded-lg bg-slate-800/50 hover:bg-slate-800 transition-colors relative group">
        <input
          type="file"
          accept=".stl"
          onChange={handleFileChange}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
        />
        <div className="flex flex-col items-center justify-center text-center space-y-2">
          <Upload className="w-8 h-8 text-blue-400 group-hover:scale-110 transition-transform" />
          <span className="text-sm font-medium text-slate-300">Upload STL Model</span>
          <span className="text-xs text-slate-500">Click or Drag & Drop</span>
        </div>
      </div>

      {/* Model Orientation */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-purple-400 mb-2">
          <Box className="w-5 h-5" />
          <h2 className="font-semibold">Model Orientation</h2>
        </div>

        {/* Rotation X */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs">
            <span>Rotation X</span>
            <span className="font-mono text-purple-300">{modelSettings.rotationX}°</span>
          </div>
          <input
            type="range"
            min="0"
            max="360"
            value={modelSettings.rotationX}
            onChange={(e) => handleModelRotationChange('rotationX', parseInt(e.target.value))}
            className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
          />
        </div>

        {/* Rotation Y */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs">
            <span>Rotation Y</span>
            <span className="font-mono text-purple-300">{modelSettings.rotationY}°</span>
          </div>
          <input
            type="range"
            min="0"
            max="360"
            value={modelSettings.rotationY}
            onChange={(e) => handleModelRotationChange('rotationY', parseInt(e.target.value))}
            className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
          />
        </div>

        {/* Rotation Z */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs">
            <span>Rotation Z</span>
            <span className="font-mono text-purple-300">{modelSettings.rotationZ}°</span>
          </div>
          <input
            type="range"
            min="0"
            max="360"
            value={modelSettings.rotationZ}
            onChange={(e) => handleModelRotationChange('rotationZ', parseInt(e.target.value))}
            className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
          />
        </div>
      </div>

      {/* Wind Controls */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-blue-400 mb-2">
          <Wind className="w-5 h-5" />
          <h2 className="font-semibold">Wind Parameters</h2>
        </div>

        {/* Speed */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs">
            <span>Flow Speed</span>
            <span className="font-mono text-blue-300">{settings.speed.toFixed(1)} m/s</span>
          </div>
          <input
            type="range"
            min="0"
            max="50"
            step="0.5"
            value={settings.speed}
            onChange={(e) => handleSliderChange('speed', parseFloat(e.target.value))}
            className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
          />
        </div>

        {/* Direction X */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs">
            <span>Direction X</span>
            <span className="font-mono text-blue-300">{settings.directionX.toFixed(1)}</span>
          </div>
          <input
            type="range"
            min="-1"
            max="1"
            step="0.1"
            value={settings.directionX}
            onChange={(e) => handleSliderChange('directionX', parseFloat(e.target.value))}
            className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
          />
        </div>

        {/* Direction Y */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs">
            <span>Direction Y</span>
            <span className="font-mono text-blue-300">{settings.directionY.toFixed(1)}</span>
          </div>
          <input
            type="range"
            min="-1"
            max="1"
            step="0.1"
            value={settings.directionY}
            onChange={(e) => handleSliderChange('directionY', parseFloat(e.target.value))}
            className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
          />
        </div>
        
        {/* Particles */}
         <div className="space-y-1">
          <div className="flex justify-between text-xs">
            <span>Streamlines Density</span>
            <span className="font-mono text-blue-300">{settings.particleCount}</span>
          </div>
          <input
            type="range"
            min="100"
            max="5000"
            step="100"
            value={settings.particleCount}
            onChange={(e) => handleSliderChange('particleCount', parseInt(e.target.value))}
            className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
          />
        </div>
      </div>

      {/* Legend */}
      <div className="bg-slate-800/50 p-3 rounded-lg border border-slate-700 space-y-2">
        <div className="flex items-center gap-2 text-slate-300 text-xs font-semibold mb-1">
          <Gauge className="w-4 h-4" />
          <span>Surface Pressure</span>
        </div>
        <div className="h-3 w-full rounded-full bg-gradient-to-r from-blue-500 via-yellow-400 to-red-500"></div>
        <div className="flex justify-between text-[10px] text-slate-500">
          <span>Low (Wake)</span>
          <span>Neutral</span>
          <span>High (Impact)</span>
        </div>
      </div>

      {/* Analysis Action */}
      <div className="pt-4 border-t border-slate-700">
        <button
          onClick={onAnalyze}
          disabled={isAnalyzing}
          className={`w-full py-3 rounded-lg font-bold flex items-center justify-center gap-2 transition-all ${
            isAnalyzing
              ? 'bg-slate-700 cursor-wait text-slate-400'
              : 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-900/20'
          }`}
        >
          {isAnalyzing ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
              Analyzing...
            </>
          ) : (
            <>
              <Activity className="w-4 h-4" />
              AI Aerodynamic Analysis
            </>
          )}
        </button>
      </div>

      {/* Analysis Output */}
      {analysisResult && (
        <div className="flex-1 overflow-y-auto mt-2 bg-slate-800 rounded-lg p-3 border border-slate-700 text-sm leading-relaxed text-slate-300 shadow-inner">
          <h3 className="text-blue-400 font-bold mb-2 flex items-center gap-2">
            <Activity className="w-3 h-3" /> Report
          </h3>
          <div className="prose prose-invert prose-sm max-w-none">
            <pre className="whitespace-pre-wrap font-sans text-xs">{analysisResult}</pre>
          </div>
        </div>
      )}

      {/* Credits */}
      <div className="mt-4 pt-4 border-t border-slate-800 text-center text-xs text-slate-500 font-mono">
        Made by David Alvarez
      </div>
    </div>
  );
};