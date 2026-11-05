import React, {useMemo} from 'react';
import {AbsoluteFill, Easing, interpolate, useCurrentFrame} from 'remotion';
import {geoGraticule, geoMercator, geoPath} from 'd3-geo';
import {feature} from 'topojson-client';
import type {Topology, GeometryCollection} from 'topojson-specification';
import type {Feature, FeatureCollection, Geometry} from 'geojson';
import world from 'world-atlas/countries-50m.json';
import {C, F} from '../theme';
import {Paper} from './Paper';
import {FilmLook} from '../components/FilmLook';

const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const WEXFORD: [number, number] = [-6.46, 52.34];

// Mapa histórico: Europa → zoom na Irlanda, com a data de 1951 e o pino em Wexford.
// Tempos (frames relativos à cena): yearAt = "1951", pinAt = "Irlanda".
export const MapScene: React.FC<{yearAt?: number; zoomFrom?: number; zoomTo?: number; pinAt?: number}> = ({
  yearAt = 22,
  zoomFrom = 30,
  zoomTo = 78,
  pinAt = 80,
}) => {
  const frame = useCurrentFrame();

  const countries = useMemo(() => {
    const topo = world as unknown as Topology<{countries: GeometryCollection}>;
    const fc = feature(topo, topo.objects.countries) as unknown as FeatureCollection<Geometry, {name: string}>;
    return fc.features.filter((f: Feature) => {
      const b = geoPath().bounds(f);
      return b[1][0] > -30 && b[0][0] < 45 && b[1][1] > 30 && b[0][1] < 75;
    });
  }, []);
  const graticule = useMemo(() => geoGraticule().step([5, 5])(), []);

  const t = interpolate(frame, [zoomFrom, zoomTo], [0, 1], {...clamp, easing: Easing.bezier(0.65, 0, 0.3, 1)});
  const scale = Math.exp(interpolate(t, [0, 1], [Math.log(1350), Math.log(8000)]));
  const lon = interpolate(t, [0, 1], [6, -7.9]);
  const lat = interpolate(t, [0, 1], [52.5, 53.45]);
  const drift = interpolate(frame, [0, zoomFrom], [1, 1.04], clamp);
  const proj = geoMercator().center([lon, lat]).scale(scale * drift).translate([540, 900]);
  const path = geoPath(proj);

  const irelandGold = interpolate(t, [0.6, 1], [0, 1], clamp);
  const pin = proj(WEXFORD) ?? [0, 0];
  const pinDrop = interpolate(frame, [pinAt, pinAt + 8], [-260, 0], {...clamp, easing: Easing.out(Easing.bounce)});
  const pinOp = interpolate(frame, [pinAt, pinAt + 2], [0, 1], clamp);
  const ring = interpolate(frame - pinAt - 8, [0, 20], [0, 1], clamp);
  const labelOp = interpolate(frame, [pinAt + 2, pinAt + 10], [0, 1], clamp);

  const yearScale = interpolate(frame, [yearAt, yearAt + 6], [1.9, 1], {...clamp, easing: Easing.out(Easing.cubic)});
  const yearOp = interpolate(frame, [yearAt, yearAt + 3], [0, 1], clamp);
  const entry = interpolate(frame, [0, 9], [1.12, 1], {...clamp, easing: Easing.out(Easing.cubic)});

  return (
    <AbsoluteFill style={{overflow: 'hidden', backgroundColor: C.black}}>
      <AbsoluteFill style={{scale: String(entry)}}>
        <Paper>
          <svg width={1080} height={1920} style={{position: 'absolute', inset: 0}}>
            <defs>
              <pattern id="hatch" width="14" height="14" patternUnits="userSpaceOnUse">
                <line x1="0" y1="7" x2="14" y2="7" stroke="#8a6f45" strokeWidth="1.2" opacity="0.35" />
              </pattern>
            </defs>
            <rect x={0} y={0} width={1080} height={1920} fill="url(#hatch)" />
            <path d={path(graticule) ?? ''} fill="none" stroke="#6e5334" strokeWidth={1.2} strokeDasharray="6 8" opacity={0.4} />
            {countries.map((f, i) => {
              const isIreland = f.properties?.name === 'Ireland';
              return (
                <path
                  key={i}
                  d={path(f) ?? ''}
                  fill={isIreland ? `rgba(201,151,58,${0.25 + 0.6 * irelandGold})` : '#efe3c5'}
                  stroke={C.ink}
                  strokeWidth={isIreland ? 2.4 : 1.3}
                  strokeLinejoin="round"
                />
              );
            })}
          </svg>
          {/* Pino em Wexford */}
          <div
            style={{
              position: 'absolute',
              left: pin[0] - 120,
              top: pin[1] - 120,
              width: 240,
              height: 240,
              borderRadius: '50%',
              border: `5px solid ${C.red}`,
              scale: String(0.2 + ring),
              opacity: (1 - ring) * pinOp,
            }}
          />
          <div style={{position: 'absolute', left: pin[0] - 26, top: pin[1] - 84, translate: `0px ${pinDrop}px`, opacity: pinOp}}>
            <svg width={52} height={84} viewBox="0 0 52 84">
              <path d="M26 82 C26 82 4 46 4 26 A22 22 0 1 1 48 26 C48 46 26 82 26 82 Z" fill={C.red} stroke={C.ink} strokeWidth={3} />
              <circle cx={26} cy={26} r={9} fill={C.cream} />
            </svg>
          </div>
          <div
            style={{
              position: 'absolute',
              left: pin[0] + 40,
              top: pin[1] - 20,
              fontFamily: F.type,
              fontSize: 40,
              color: C.ink,
              opacity: labelOp,
              whiteSpace: 'nowrap',
              background: 'rgba(234,220,188,0.85)',
              padding: '4px 10px',
            }}
          >
            Wexford
          </div>
          <div
            style={{
              position: 'absolute',
              width: 1080,
              top: 830,
              textAlign: 'center',
              fontFamily: F.fell,
              fontSize: 96,
              letterSpacing: 14,
              color: C.ink,
              opacity: labelOp,
              translate: `0px ${interpolate(labelOp, [0, 1], [20, 0])}px`,
              textShadow: `0 0 18px ${C.parchment}, 0 0 8px ${C.parchment}`,
            }}
          >
            IRLANDA
          </div>
          {/* Data */}
          <div style={{position: 'absolute', top: 150, width: 1080, display: 'flex', justifyContent: 'center'}}>
            <div
              style={{
                fontFamily: F.serif,
                fontWeight: 900,
                fontSize: 220,
                lineHeight: 1,
                color: C.red,
                border: `8px double ${C.red}`,
                padding: '6px 40px 18px',
                rotate: '-4deg',
                scale: String(yearScale),
                opacity: yearOp * 0.92,
                background: 'rgba(234,220,188,0.55)',
              }}
            >
              1951
            </div>
          </div>
        </Paper>
      </AbsoluteFill>
      <FilmLook grain={0.2} vignette={0.65} flicker={0.05} scratches seed="map" />
    </AbsoluteFill>
  );
};
