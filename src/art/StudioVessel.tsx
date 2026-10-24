import { useState } from 'react';
import { VesselArt } from './VesselArt';
import { normalizeDesign } from './model';
import type { DesignState } from './model';
import moonInk from './studies/moon-ink.png';
import solInk from './studies/sol-ink.png';
import foldChalk from './studies/fold-chalk.png';
import moonClay from './studies/moon-clay.png';

const studies: Record<string, string> = { 'moon-ink': moonInk, 'sol-ink': solInk, 'fold-chalk': foldChalk, 'moon-clay': moonClay };

/** Static Blender Cycles studies; live parameterized previews retain the shared SVG API. */
export function StudioVessel({ design, className = '', label, priority = false }: { design: DesignState; className?: string; label: string; priority?: boolean }) {
  const state = normalizeDesign(design);
  const source = studies[`${state.profile}-${state.glaze}`];
  const [failedSource, setFailedSource] = useState<string | null>(null);
  const originalProportions = state.height === 100 && state.fullness === 100 && state.lip === 100 && state.rotation === 0;
  if (!source || failedSource === source || !originalProportions) return <VesselArt design={state} className={className} label={label}/>;
  return <img className={`studio-vessel ${className}`} src={source} alt={label} width="600" height="750" loading={priority ? 'eager' : 'lazy'} fetchPriority={priority ? 'high' : 'auto'} decoding="async" onError={() => setFailedSource(source)}/>;
}
