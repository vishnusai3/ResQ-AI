import React, { useState } from 'react';
import {
  X,
  Upload,
  Sparkles,
  MapPin,
  Flame,
  ChevronDown,
  ChevronUp,
  Loader2,
  CheckCircle2,
} from 'lucide-react';
import { DisasterType, SeverityLevel, Coordinates } from '../types';
import { api } from '../services/api';

interface IncidentCreationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (incidentData: any) => Promise<void>;
  pickedCoordinates?: Coordinates | null;
}

const PRESET_LOCATIONS = [
  { name: 'Kukatpally Y-Junction (Flood prone)', coords: { lat: 17.4947, lng: 78.3996 } },
  { name: 'Begumpet Airport Enclave', coords: { lat: 17.4448, lng: 78.4664 } },
  { name: 'Secunderabad Railway Terminal', coords: { lat: 17.4399, lng: 78.4983 } },
  { name: 'Gachibowli Outer Ring Road', coords: { lat: 17.4401, lng: 78.3489 } },
  { name: 'Uppal Musi Riverbank Basin', coords: { lat: 17.4022, lng: 78.5601 } },
  { name: 'Miyapur Metro Corridor', coords: { lat: 17.4968, lng: 78.3614 } },
  { name: 'Mehdipatnam PVNR Expressway', coords: { lat: 17.3916, lng: 78.4399 } },
];

export const IncidentCreationModal: React.FC<IncidentCreationModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  pickedCoordinates,
}) => {
  const [disasterType, setDisasterType] = useState<DisasterType>('Flood');
  const [location, setLocation] = useState('Kukatpally Y-Junction, Hyderabad');
  const [coords, setCoords] = useState<Coordinates>(
    pickedCoordinates || { lat: 17.4947, lng: 78.3996 }
  );
  const [severity, setSeverity] = useState<SeverityLevel>('CRITICAL');
  const [peopleAffected, setPeopleAffected] = useState(100);
  const [injured, setInjured] = useState(5);
  const [missing, setMissing] = useState(3);
  const [description, setDescription] = useState(
    'Rapid storm runoff overwhelming underpass and basement levels with trapped citizens.'
  );

  // Progressive disclosure: Add incident image
  const [showImageUpload, setShowImageUpload] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isAnalyzingImage, setIsAnalyzingImage] = useState(false);
  const [imageAnalysisResult, setImageAnalysisResult] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  React.useEffect(() => {
    if (pickedCoordinates) {
      setCoords(pickedCoordinates);
    }
  }, [pickedCoordinates]);

  if (!isOpen) return null;

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImageFile(file);
    const reader = new FileReader();
    reader.onload = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleAnalyzeImageWithAI = async () => {
    if (!imagePreview) return;
    setIsAnalyzingImage(true);
    try {
      const base64Data = imagePreview.split(',')[1];
      const analysis = await api.analyzeImage(base64Data, imageFile?.type || 'image/jpeg');
      setImageAnalysisResult(analysis);

      if (analysis.disasterType) setDisasterType(analysis.disasterType as DisasterType);
      if (analysis.urgencyLevel) setSeverity(analysis.urgencyLevel as SeverityLevel);
      if (analysis.estimatedDamage) {
        setDescription(`AI Visual Assessment: ${analysis.estimatedDamage}. Accessibility: ${analysis.roadAccessibility || 'Impaired'}.`);
      }
      if (analysis.peopleVisibleCount) {
        setPeopleAffected(Math.max(20, analysis.peopleVisibleCount * 5));
      }
    } catch (err) {
      console.error('Failed to analyze image with AI', err);
    } finally {
      setIsAnalyzingImage(false);
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onSubmit({
        title: `${disasterType} at ${location.split(',')[0]}`,
        disasterType,
        location,
        coordinates: coords,
        severity,
        peopleAffected: Number(peopleAffected),
        injured: Number(injured),
        missing: Number(missing),
        description,
        imageUrl: imagePreview,
        imageAnalysis: imageAnalysisResult,
        autoTriggerAgents: true,
      });
      onClose();
    } catch (err) {
      console.error('Failed to submit incident', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-xl shadow-2xl overflow-hidden my-6">
        {/* Header */}
        <div className="px-5 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Flame className="w-4 h-4 text-rose-500" />
            <h2 className="text-sm font-bold text-white font-mono uppercase tracking-wider">
              CREATE EMERGENCY
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleFormSubmit} className="p-5 space-y-4 text-xs font-mono">
          {/* Disaster Type */}
          <div>
            <label className="block text-slate-300 font-bold mb-1 uppercase tracking-wider text-[11px]">
              Disaster Type *
            </label>
            <select
              value={disasterType}
              onChange={(e) => setDisasterType(e.target.value as DisasterType)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:border-rose-500 focus:outline-none"
            >
              <option value="Flood">Flood (Flash Flood / Inundation)</option>
              <option value="Fire">Fire (Structural / Commercial Blaze)</option>
              <option value="Earthquake">Earthquake (Tremor / Building Debris)</option>
              <option value="Accident">Accident (Multi-Vehicle Transit Collision)</option>
              <option value="Cyclone">Cyclone (Storm Surge / Gale Flooding)</option>
              <option value="Building Collapse">Building Collapse</option>
              <option value="Other">Other Hazardous Incident</option>
            </select>
          </div>

          {/* Location + Presets */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-slate-300 font-bold uppercase tracking-wider text-[11px]">
                Location *
              </label>
              <span className="text-[10px] text-slate-500">
                (or click on Live Map to set pin)
              </span>
            </div>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. Kukatpally Y-Junction, Hyderabad"
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:border-rose-500 focus:outline-none"
              required
            />

            {/* Presets */}
            <div className="mt-2 flex flex-wrap gap-1.5 items-center">
              <span className="text-[10px] text-slate-500">Presets:</span>
              {PRESET_LOCATIONS.slice(0, 4).map((preset, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setLocation(preset.name);
                    setCoords(preset.coords);
                  }}
                  className="px-2 py-0.5 rounded bg-slate-950 hover:bg-slate-800 text-[10px] text-slate-300 border border-slate-800 transition-colors"
                >
                  {preset.name.split(' (')[0]}
                </button>
              ))}
            </div>

            <div className="mt-1.5 text-[10px] text-slate-500 flex items-center gap-1.5">
              <MapPin className="w-3 h-3 text-rose-500" />
              <span>Coords: {coords.lat.toFixed(4)}, {coords.lng.toFixed(4)}</span>
            </div>
          </div>

          {/* People Affected | Injured | Missing */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-slate-300 font-bold mb-1 uppercase tracking-wider text-[10px]">
                People Affected
              </label>
              <input
                type="number"
                min="0"
                value={peopleAffected}
                onChange={(e) => setPeopleAffected(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:border-rose-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-rose-400 font-bold mb-1 uppercase tracking-wider text-[10px]">
                Injured
              </label>
              <input
                type="number"
                min="0"
                value={injured}
                onChange={(e) => setInjured(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-rose-300 font-bold focus:border-rose-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-amber-400 font-bold mb-1 uppercase tracking-wider text-[10px]">
                Missing
              </label>
              <input
                type="number"
                min="0"
                value={missing}
                onChange={(e) => setMissing(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-amber-300 font-bold focus:border-rose-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-slate-300 font-bold mb-1 uppercase tracking-wider text-[11px]">
              Description
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:border-rose-500 focus:outline-none font-sans text-xs"
            />
          </div>

          {/* Optional: Add Incident Image (Progressive Disclosure) */}
          <div className="pt-1">
            <button
              type="button"
              onClick={() => setShowImageUpload(!showImageUpload)}
              className="flex items-center gap-1.5 text-slate-400 hover:text-slate-200 text-[11px] font-mono transition-colors"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Add Incident Image (Optional)</span>
              {showImageUpload ? (
                <ChevronUp className="w-3.5 h-3.5" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5" />
              )}
            </button>

            {showImageUpload && (
              <div className="mt-2 p-3 bg-slate-950 border border-slate-800 rounded-lg space-y-2">
                <div className="flex items-center gap-2">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="text-xs text-slate-400 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-[11px] file:font-semibold file:bg-slate-800 file:text-slate-200 cursor-pointer"
                  />
                  {imagePreview && !imageAnalysisResult && (
                    <button
                      type="button"
                      onClick={handleAnalyzeImageWithAI}
                      disabled={isAnalyzingImage}
                      className="flex items-center gap-1 px-2.5 py-1 rounded bg-rose-600 hover:bg-rose-500 text-white text-[11px] font-semibold transition-colors"
                    >
                      {isAnalyzingImage ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <Sparkles className="w-3 h-3 text-amber-300" />
                      )}
                      <span>AI Extract</span>
                    </button>
                  )}
                </div>

                {imageAnalysisResult && (
                  <div className="p-2 rounded bg-emerald-950/40 border border-emerald-500/30 text-[10px] text-emerald-300 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Visual assessment extracted & applied.</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer Buttons: CANCEL (Secondary) | CREATE INCIDENT (Primary) */}
          <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-xs font-bold text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
            >
              CANCEL
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-lg text-xs font-bold font-mono bg-rose-600 hover:bg-rose-500 active:bg-rose-700 text-white shadow-md shadow-rose-950 flex items-center gap-2 transition-colors cursor-pointer"
            >
              {isSubmitting ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Flame className="w-3.5 h-3.5" />
              )}
              <span>{isSubmitting ? 'CREATING...' : 'CREATE INCIDENT'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
