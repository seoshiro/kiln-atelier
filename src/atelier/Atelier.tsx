import { useCallback, useEffect, useReducer, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import { DEFAULT_DESIGN, GLAZES, PARAMETER_LIMITS, PROFILES } from '../art/model';
import type { DesignState } from '../art/model';
import { VesselViewer } from '../art/VesselViewer';
import { atelierReducer, createHistory } from './state';
import { createDesignJSON, createDesignSVG, designFilename, downloadFile } from './export';
import './atelier.css';
import { SlideTextButton } from '../components/SlideTextButton';

const SHAPE_CONTROLS = [
  { key: 'height', name: 'Height', low: 'Grounded', high: 'Elongated' },
  { key: 'fullness', name: 'Fullness', low: 'Slender', high: 'Generous' },
  { key: 'lip', name: 'Lip opening', low: 'Gathered', high: 'Open' },
] as const;

function Arrow({ direction = 'right' }: { direction?: 'left' | 'right' | 'down' }) {
  return <svg aria-hidden="true" viewBox="0 0 24 24" width="20" height="20" className={`atelier-arrow atelier-arrow--${direction}`}><path d="M4 12h15m-6-6 6 6-6 6" fill="none" stroke="currentColor" strokeWidth="1.5" /></svg>;
}

export default function Atelier() {
  const [history, dispatch] = useReducer(atelierReducer, DEFAULT_DESIGN, createHistory);
  const [status, setStatus] = useState('');
  const cleanups = useRef(new Set<() => void>());
  const design = history.present;
  const profile = PROFILES.find((item) => item.id === design.profile)!;
  const glaze = GLAZES.find((item) => item.id === design.glaze)!;
  const canUndo = history.past.length > 0 || history.gesture !== null;
  const rotate = useCallback((delta: number) => dispatch({ type: 'rotate', delta }), []);
  const dragRotate = useCallback((delta: number) => dispatch({ type: 'rotate', delta, transient: true }), []);
  const finishRotation = useCallback(() => dispatch({ type: 'commit' }), []);

  useEffect(() => {
    const current = cleanups.current;
    return () => { current.forEach((cleanup) => cleanup()); current.clear(); };
  }, []);

  function exportDesign(extension: 'svg' | 'json') {
    dispatch({ type: 'commit' });
    try {
      // Only the currently rendered design is used; exports have no asynchronous state race.
      const content = extension === 'svg' ? createDesignSVG(design) : createDesignJSON(design);
      const cleanup = downloadFile(content, designFilename(design, extension), extension === 'svg' ? 'image/svg+xml;charset=utf-8' : 'application/json;charset=utf-8', (release) => cleanups.current.delete(release));
      cleanups.current.add(cleanup);
      setStatus(`${extension.toUpperCase()} download prepared for ${profile.name} in ${glaze.name}.`);
    } catch {
      setStatus('The download could not start. Please try again in your browser.');
    }
  }

  function shapeChange(key: keyof Pick<DesignState, 'height' | 'fullness' | 'lip'>, value: number) {
    dispatch({ type: 'patch', patch: { [key]: value }, transient: true });
  }

  return <section id="atelier" className="atelier" aria-labelledby="atelier-title">
    <div className="atelier-heading">
      <p className="atelier-kicker"><span>05 / THE DIGITAL ATELIER</span><span>AN EXERCISE IN POSSIBILITY</span></p>
      <div className="atelier-intro"><h2 id="atelier-title">A little less perfect.<br /><em>A little more you.</em></h2><p>Start with a form. Follow a feeling.<br />An open studio for your own small exploration of shape and surface.</p></div>
    </div>

    <div className="atelier-workspace">
      <div className="atelier-preview">
        <div className="atelier-preview-top"><span>FORM STUDY / {String(PROFILES.findIndex((item) => item.id === design.profile) + 1).padStart(2, '0')}</span><span className="atelier-live-dot">LIVE STUDY</span></div>
        <div className="atelier-object"><VesselViewer design={design} onRotate={dragRotate} onRotateEnd={finishRotation} /></div>
        <div className="atelier-object-caption"><div><span className="atelier-tiny-label">YOUR CURRENT FORM</span><p>{profile.name} <i>/</i> {glaze.name}</p></div><div className="atelier-rotation"><button type="button" onClick={() => rotate(-15)} aria-label="Rotate left"><Arrow direction="left" /></button><span aria-label={`Rotation ${design.rotation} degrees`}>{Math.round(design.rotation)}°</span><button type="button" onClick={() => rotate(15)} aria-label="Rotate right"><Arrow /></button></div></div>
        <p className="atelier-drag-note">Drag to turn the vessel · or use the arrows</p>
      </div>

      <div className="atelier-controls">
        <fieldset className="atelier-fieldset"><legend><span>01</span> Choose your starting form</legend><div className="atelier-profiles">{PROFILES.map((item, index) => <button type="button" key={item.id} className={design.profile === item.id ? 'is-selected' : ''} aria-pressed={design.profile === item.id} onClick={() => dispatch({ type: 'profile', profile: item.id })}><span className="atelier-profile-index">0{index + 1} </span><span className="atelier-profile-name" id={`atelier-profile-${item.id}`}>{item.name}</span><svg aria-hidden="true" viewBox="0 0 16 16" width="16" height="16"><path d="m3 8 3 3 7-7" fill="none" stroke="currentColor" strokeWidth="1.4" /></svg></button>)}</div><p className="atelier-control-note">{profile.note}</p></fieldset>

        <fieldset className="atelier-fieldset atelier-shape"><legend><span>02</span> Find your proportions</legend>{SHAPE_CONTROLS.map((control) => <div className="atelier-slider" key={control.key}><div className="atelier-slider-label"><label htmlFor={`atelier-${control.key}`}>{control.name}</label><output htmlFor={`atelier-${control.key}`}>{design[control.key]}<small>%</small></output></div><input id={`atelier-${control.key}`} type="range" min={PARAMETER_LIMITS[control.key].min} max={PARAMETER_LIMITS[control.key].max} step={PARAMETER_LIMITS[control.key].step} value={design[control.key]} onChange={(event) => shapeChange(control.key, event.currentTarget.valueAsNumber)} onPointerUp={() => dispatch({ type: 'commit' })} onPointerCancel={() => dispatch({ type: 'commit' })} onLostPointerCapture={() => dispatch({ type: 'commit' })} onKeyUp={() => dispatch({ type: 'commit' })} onBlur={() => dispatch({ type: 'commit' })} aria-valuetext={`${design[control.key]} percent`} style={{ '--range-fill': `${(design[control.key] - PARAMETER_LIMITS[control.key].min) / (PARAMETER_LIMITS[control.key].max - PARAMETER_LIMITS[control.key].min) * 100}%` } as CSSProperties} /><div className="atelier-slider-extents" aria-hidden="true"><span>{control.low}</span><span>{control.high}</span></div></div>)}</fieldset>

        <fieldset className="atelier-fieldset"><legend><span>03</span> Give it a surface</legend><div className="atelier-glazes">{GLAZES.map((item) => <button type="button" key={item.id} aria-label={item.name} aria-pressed={design.glaze === item.id} className={design.glaze === item.id ? 'is-selected' : ''} onClick={() => dispatch({ type: 'patch', patch: { glaze: item.id } })}><span className="atelier-swatch" style={{ backgroundColor: item.color }}><svg aria-hidden="true" viewBox="0 0 16 16" width="16" height="16"><path d="m3 8 3 3 7-7" fill="none" stroke="currentColor" strokeWidth="1.6" /></svg></span><span>{item.name}</span></button>)}</div><p className="atelier-control-note">{glaze.note}</p></fieldset>

        <div className="atelier-history"><button type="button" disabled={!canUndo} onClick={() => { dispatch({ type: 'undo' }); setStatus('Last adjustment undone.'); }}><span aria-hidden="true">↶</span> Undo adjustment</button><button type="button" onClick={() => { dispatch({ type: 'reset' }); setStatus(`Design reset to ${PROFILES.find((item) => item.id === DEFAULT_DESIGN.profile)!.name} in ${GLAZES.find((item) => item.id === DEFAULT_DESIGN.glaze)!.name}, with original proportions.`); }}>Reset design <span aria-hidden="true">↺</span></button></div>
        <div className="atelier-save"><p>Yours, to keep.</p><SlideTextButton className="atelier-download" variant="default" onClick={() => exportDesign('svg')} text="Download SVG card" icon={<Arrow direction="down" />} /><SlideTextButton className="atelier-json" variant="ghost" onClick={() => exportDesign('json')} text="Download JSON" icon={<Arrow direction="down" />} /><p className="atelier-export-note">SVG is a front-silhouette design card. JSON keeps your parameters and viewing rotation. Both are free, and made here in your browser.</p></div>
        <p className="atelier-status" role="status" aria-live="polite">{status}</p>
      </div>
    </div>
    <p className="atelier-concept"><span className="atelier-concept-mark" aria-hidden="true">✳</span> A digital form study. These imagined vessels are an artistic exploration, not production specifications.</p>
  </section>;
}
