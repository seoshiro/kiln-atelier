import { useId } from 'react';
import { ART_BASELINE, ART_SCALE, DEFAULT_DESIGN, GLAZES, mixColor, normalizeDesign, outerProfile, vesselPath } from './model';
import type { DesignState } from './model';

interface VesselArtProps { design?: DesignState; className?: string; label?: string }

/** Authored ceramic study: vector silhouette, glaze strata and deterministic grain. */
export function VesselArt({ design = DEFAULT_DESIGN, className, label = 'Sculptural ceramic vessel' }: VesselArtProps) {
  const id = useId().replace(/:/g, ''), state = normalizeDesign(design);
  const glaze = GLAZES.find(({ id }) => id === state.glaze)!;
  const points = outerProfile(state), top = points.at(-1)!, foot = points[0];
  const topY = ART_BASELINE - top.y * ART_SCALE, mouth = top.x * ART_SCALE;
  const path = vesselPath(state), darkest = mixColor(glaze.color, '#121720', .63);
  const light = mixColor(glaze.color, '#fff0cf', state.glaze === 'chalk' ? .25 : .39);
  const speckles = Array.from({ length: 190 }, (_, i) => ({ x: (i*73.17 + 19) % 400, y: (i*111.77 + 67) % 500, r: .35 + (i % 4)*.20 }));
  return <svg className={className} viewBox="0 0 400 500" role="img" aria-label={label} xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id={`${id}-body`} x1="0" y1=".15" x2="1" y2=".36" gradientUnits="objectBoundingBox">
        <stop offset="0" stopColor={darkest}/><stop offset=".14" stopColor={glaze.color}/><stop offset=".32" stopColor={light}/><stop offset=".51" stopColor={glaze.color}/><stop offset=".8" stopColor={mixColor(glaze.color, '#161e2b', .28)}/><stop offset="1" stopColor={darkest}/>
      </linearGradient>
      <linearGradient id={`${id}-vertical`} x1="0" y1="0" x2=".15" y2="1"><stop stopColor="#f2dbb4" stopOpacity=".17"/><stop offset=".5" stopColor="#f2dbb4" stopOpacity="0"/><stop offset="1" stopColor="#000" stopOpacity=".25"/></linearGradient>
      <radialGradient id={`${id}-mouth`} cx=".45" cy="0" r="1"><stop stopColor={mixColor(glaze.color, '#fff0cf', .18)}/><stop offset=".45" stopColor={darkest}/><stop offset="1" stopColor="#10151e"/></radialGradient>
      <radialGradient id={`${id}-shadow`}><stop stopColor="#151b28" stopOpacity=".35"/><stop offset="1" stopColor="#151b28" stopOpacity="0"/></radialGradient>
      <clipPath id={`${id}-clip`}><path d={path}/></clipPath>
    </defs>
    <ellipse cx="209" cy="454" rx={foot.x * 108 + 44} ry="16" fill={`url(#${id}-shadow)`}/>
    <path d={path} fill={`url(#${id}-body)`}/>
    <g clipPath={`url(#${id}-clip)`}>
      <path d={path} fill={`url(#${id}-vertical)`}/>
      {Array.from({ length: 43 }, (_, i) => <ellipse key={i} cx="200" cy={topY + 14 + i*8.5} rx="181" ry={13 + i*.08} fill="none" stroke={i%3 === 0 ? '#f1d7b0' : '#0b152a'} strokeOpacity={i%3 === 0 ? .065 : .055} strokeWidth={i%4 === 0 ? 1.3 : .6}/>)}
      {speckles.map(({ x, y, r }, i) => <circle key={i} cx={x} cy={y} r={r} fill={i%3 === 0 ? '#f5e4c4' : '#151820'} opacity={i%3 === 0 ? .22 : .18}/>)}
      <path d={`M0,${ART_BASELINE-8} Q200,${ART_BASELINE+4} 400,${ART_BASELINE-8} V500 H0Z`} fill="#a77f5c" opacity=".48"/>
    </g>
    <ellipse cx="200" cy={topY} rx={mouth} ry={Math.max(6, mouth*.24)} fill={light}/>
    <ellipse cx="200" cy={topY+.8} rx={Math.max(2, mouth-5.5)} ry={Math.max(2, mouth*.24-3.3)} fill={`url(#${id}-mouth)`}/>
    <path d={`M${200-mouth},${topY} A${mouth},${mouth*.24} 0 0 0 ${200+mouth},${topY}`} fill="none" stroke={mixColor(glaze.color, '#fff2d9', .48)} strokeWidth="1.2" opacity=".7"/>
  </svg>;
}
