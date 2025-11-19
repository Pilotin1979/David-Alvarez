import React, { useState, useCallback, useRef } from 'react';
import * as THREE from 'three';
import { WindTunnelScene } from './components/WindTunnelScene';
import { ControlPanel } from './components/ControlPanel';
import { WindSettings, ModelSettings } from './types';
import { analyzeAerodynamics } from './services/geminiService';

const App: React.FC = () => {
  // State
  const [windSettings, setWindSettings] = useState<WindSettings>({
    speed: 20,
    directionX: 1,
    directionY: 0,
    directionZ: 0,
    particleCount: 2000,
  });

  const [modelSettings, setModelSettings] = useState<ModelSettings>({
    rotationX: 0,
    rotationY: 0,
    rotationZ: 0,
  });
  
  const [stlFileUrl, setStlFileUrl] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);
  
  // WebGL Renderer Ref for screenshots
  const glRef = useRef<THREE.WebGLRenderer | null>(null);

  const handleFileUpload = useCallback((file: File) => {
    const url = URL.createObjectURL(file);
    setStlFileUrl(url);
    setAnalysisResult(null); // Clear previous analysis
  }, []);

  const handleAnalyze = useCallback(async () => {
    if (!glRef.current) {
      console.error("Canvas context not found");
      return;
    }

    setIsAnalyzing(true);
    setAnalysisResult(null);

    try {
      // Capture the current canvas view
      const canvas = glRef.current.domElement;
      const dataUrl = canvas.toDataURL('image/png');

      // Send to Gemini
      const result = await analyzeAerodynamics(dataUrl, windSettings.speed);
      setAnalysisResult(result);
    } catch (error: any) {
      setAnalysisResult(`Error: ${error.message}`);
    } finally {
      setIsAnalyzing(false);
    }
  }, [windSettings.speed]);

  return (
    <div className="w-full h-screen relative bg-slate-950 overflow-hidden font-sans">
      
      {/* 3D Viewport */}
      <div className="absolute inset-0 z-0">
        <WindTunnelScene 
          stlUrl={stlFileUrl} 
          windSettings={windSettings}
          modelSettings={modelSettings}
          setGl={(gl) => { glRef.current = gl; }}
        />
      </div>

      {/* Sidebar Controls */}
      <ControlPanel
        settings={windSettings}
        modelSettings={modelSettings}
        onSettingsChange={setWindSettings}
        onModelSettingsChange={setModelSettings}
        onFileUpload={handleFileUpload}
        onAnalyze={handleAnalyze}
        isAnalyzing={isAnalyzing}
        analysisResult={analysisResult}
      />

      {/* Overlay hints if no model is loaded */}
      {!stlFileUrl && (
        <div className="absolute inset-0 z-0 flex items-center justify-center pointer-events-none">
          <div className="bg-slate-900/80 backdrop-blur p-8 rounded-xl border border-slate-700 text-center max-w-md">
            <h2 className="text-3xl font-bold text-white mb-4">Welcome to AeroFlow</h2>
            <p className="text-slate-300 mb-6">
              Visualize aerodynamics in real-time. 
              Upload an .STL file from the sidebar to begin your wind tunnel simulation.
            </p>
            <div className="text-sm text-slate-500">
              Tip: Use the controls to rotate the model and adjust airflow intensity. 
              Red areas indicate high pressure drag.
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;