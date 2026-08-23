import { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import type { ClimateGrid } from '@/lib/climateData';
import {
  BORDER_COLOR,
  fillColorExpression,
  type CountryEmissions,
} from '@/lib/countryEmissions';
import { resolveMetric, type AnyMetricId, type MergedCountryProps } from '@/lib/mapMetrics';
import { AnomalyRenderer, MAX_MERCATOR_LAT } from '@/lib/gridRenderer';
import { useI18n } from '@/i18n/LocaleProvider';

/** CARTO's Dark Matter — keyless, attribution-only. */
const BASEMAP_STYLE = 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json';
const SOURCE_ID = 'anomaly-grid';
const LAYER_ID = 'anomaly-grid-layer';
const COUNTRY_SOURCE = 'co2-countries';
const COUNTRY_FILL = 'co2-countries-fill';
const COUNTRY_LINE = 'co2-countries-line';

export interface MapMarker {
  latitude: number;
  longitude: number;
  label: string;
}

interface Props {
  grid: ClimateGrid;
  year: number;
  marker: MapMarker | null;
  onPickPoint: (lat: number, lon: number) => void;
  /** Forme + valori per paese; null finché il layer non viene acceso. */
  countries: CountryEmissions | null;
  /** Metrica da dipingere, o null per tornare alle anomalie. */
  metric: AnyMetricId | null;
}

export function ClimateMap({ grid, year, marker, onPickPoint, countries, metric }: Props) {
  const { locale, t } = useI18n();
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const rendererRef = useRef<AnomalyRenderer | null>(null);
  const markerRef = useRef<maplibregl.Marker | null>(null);
  const readyRef = useRef(false);
  // Lo stesso fatto in forma reattiva: i layer aggiunti dopo il `load` devono
  // poter riprovare quando i dati arrivano, e un ref non fa ripartire l'effetto.
  const [ready, setReady] = useState(false);
  // Keep the latest click handler reachable without re-binding the map listener.
  const pickRef = useRef(onPickPoint);
  pickRef.current = onPickPoint;
  // Il popup si costruisce dentro un listener MapLibre, fuori dal render di
  // React: senza un ref la lingua letta lì dentro resterebbe quella di quando
  // il listener è stato agganciato, non quella corrente.
  const i18nRef = useRef({ locale, t });
  i18nRef.current = { locale, t };

  // --- init (once) ---------------------------------------------------------
  useEffect(() => {
    if (!containerRef.current) return;

    const renderer = new AnomalyRenderer(grid.meta);
    rendererRef.current = renderer;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: BASEMAP_STYLE,
      center: [12, 30],
      zoom: 1.55,
      minZoom: 1,
      maxZoom: 9,
      // The overlay canvas covers exactly one world; repeated copies would
      // leave the neighbouring worlds bare.
      renderWorldCopies: false,
      attributionControl: false,
    });
    mapRef.current = map;

    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'bottom-right');
    map.addControl(
      new maplibregl.AttributionControl({
        compact: true,
        customAttribution:
          '<a href="https://data.giss.nasa.gov/gistemp/" target="_blank" rel="noreferrer">NASA GISTEMP v4</a>',
      }),
      'bottom-right',
    );

    map.on('load', () => {
      map.addSource(SOURCE_ID, {
        type: 'canvas',
        canvas: renderer.canvas,
        coordinates: [
          [-180, MAX_MERCATOR_LAT],
          [180, MAX_MERCATOR_LAT],
          [180, -MAX_MERCATOR_LAT],
          [-180, -MAX_MERCATOR_LAT],
        ],
        animate: false,
      });

      // Slip the overlay under the basemap's labels so place names stay legible.
      const firstSymbol = map.getStyle().layers?.find((l) => l.type === 'symbol')?.id;
      map.addLayer(
        {
          id: LAYER_ID,
          type: 'raster',
          source: SOURCE_ID,
          paint: { 'raster-opacity': 1, 'raster-fade-duration': 0, 'raster-resampling': 'linear' },
        },
        firstSymbol,
      );

      readyRef.current = true;
      setReady(true);
      renderer.render(grid.plane(year));
      refreshCanvasSource(map);
    });

    map.on('click', (e) => pickRef.current(e.lngLat.lat, e.lngLat.lng));
    map.getCanvas().style.cursor = 'crosshair';

    return () => {
      readyRef.current = false;
      setReady(false);
      markerRef.current?.remove();
      markerRef.current = null;
      map.remove();
      mapRef.current = null;
    };
    // Deliberately mount-only: the map instance outlives prop changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --- year changes --------------------------------------------------------
  useEffect(() => {
    const map = mapRef.current;
    const renderer = rendererRef.current;
    if (!map || !renderer || !readyRef.current) return;
    renderer.render(grid.plane(year));
    refreshCanvasSource(map);
  }, [year, grid]);

  // --- country emissions layer ---------------------------------------------
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready || !countries) return;

    const existing = map.getSource(COUNTRY_SOURCE) as maplibregl.GeoJSONSource | undefined;
    if (existing) {
      // Le forme sono le stesse, ma le proprietà no: quando arriva la tabella
      // dell'inquinamento la collezione è un oggetto nuovo, e senza `setData`
      // la mappa continuerebbe a leggere le feature senza quei campi.
      existing.setData(countries as unknown as GeoJSON.FeatureCollection);
    } else {
      map.addSource(COUNTRY_SOURCE, {
        type: 'geojson',
        data: countries as unknown as GeoJSON.FeatureCollection,
      });
      const firstSymbol = map.getStyle().layers?.find((l) => l.type === 'symbol')?.id;
      map.addLayer(
        {
          id: COUNTRY_FILL,
          type: 'fill',
          source: COUNTRY_SOURCE,
          paint: { 'fill-color': 'rgba(0,0,0,0)', 'fill-opacity': 0.85 },
        },
        firstSymbol,
      );
      map.addLayer(
        {
          id: COUNTRY_LINE,
          type: 'line',
          source: COUNTRY_SOURCE,
          paint: { 'line-color': BORDER_COLOR, 'line-width': 0.6 },
        },
        firstSymbol,
      );
    }

    const active = metric !== null;
    if (active) {
      map.setPaintProperty(
        COUNTRY_FILL,
        'fill-color',
        fillColorExpression(resolveMetric(metric, locale)) as never,
      );
    }
    for (const id of [COUNTRY_FILL, COUNTRY_LINE]) {
      map.setLayoutProperty(id, 'visibility', active ? 'visible' : 'none');
    }
    // Le due mappe rispondono a domande opposte — chi lo subisce, chi lo causa.
    // Sovrapporle darebbe un impasto che non risponde a nessuna delle due.
    map.setLayoutProperty(LAYER_ID, 'visibility', active ? 'none' : 'visible');
  }, [countries, metric, ready, locale]);

  // --- hover popup over countries ------------------------------------------
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready || !countries || !metric) return;

    const popup = new maplibregl.Popup({
      closeButton: false,
      closeOnClick: false,
      offset: 12,
      className: 'climalens-popup',
    });

    const onMove = (e: maplibregl.MapLayerMouseEvent) => {
      const feature = e.features?.[0];
      if (!feature) return;
      const props = feature.properties as unknown as MergedCountryProps;
      const value = props[metric];
      // Letto a ogni hover, non catturato alla creazione del listener: così
      // un cambio di lingua a metà sessione vale dal prossimo movimento del
      // mouse, senza dover riattaccare l'handler.
      const { locale: currentLocale, t: currentT } = i18nRef.current;
      const m = resolveMetric(metric, currentLocale);

      // setDOMContent invece di setHTML: i nomi arrivano da un file di dati e
      // non hanno motivo di passare per un parser HTML.
      const root = document.createElement('div');
      const name = document.createElement('strong');
      name.textContent = props.name[currentLocale];
      const line = document.createElement('span');
      line.textContent = typeof value === 'number' ? m.format(value) : currentT('common.noData');
      if (typeof value !== 'number') line.className = 'is-empty';
      root.append(name, line);

      // Il contorno del numero, quando il numero da solo mente per omissione:
      // «scritto in una legge» senza l'anno promesso non è un'informazione.
      const extra =
        typeof value === 'number'
          ? m.detail?.(props as unknown as Record<string, unknown>)
          : null;
      if (extra) {
        const note = document.createElement('span');
        note.className = 'is-detail';
        note.textContent = extra;
        root.append(note);
      }

      popup.setLngLat(e.lngLat).setDOMContent(root).addTo(map);
      map.getCanvas().style.cursor = 'pointer';
    };

    const onLeave = () => {
      popup.remove();
      map.getCanvas().style.cursor = 'crosshair';
    };

    map.on('mousemove', COUNTRY_FILL, onMove);
    map.on('mouseleave', COUNTRY_FILL, onLeave);
    return () => {
      map.off('mousemove', COUNTRY_FILL, onMove);
      map.off('mouseleave', COUNTRY_FILL, onLeave);
      popup.remove();
      map.getCanvas().style.cursor = 'crosshair';
    };
  }, [ready, countries, metric]);

  // --- selection marker ----------------------------------------------------
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (!marker) {
      markerRef.current?.remove();
      markerRef.current = null;
      return;
    }

    if (!markerRef.current) {
      const el = document.createElement('div');
      el.className = 'climalens-marker';
      el.innerHTML = '<span class="climalens-marker__pulse"></span><span class="climalens-marker__dot"></span>';
      markerRef.current = new maplibregl.Marker({ element: el, anchor: 'center' });
    }

    markerRef.current.setLngLat([marker.longitude, marker.latitude]).addTo(map);
    map.easeTo({
      center: [marker.longitude, marker.latitude],
      zoom: Math.max(map.getZoom(), 3.4),
      duration: 900,
    });
  }, [marker]);

  return <div ref={containerRef} className="absolute inset-0" aria-label={t('legend.mapAriaLabel')} />;
}

/**
 * A canvas source only re-uploads its texture while "playing". We flip it on
 * for a single frame after each repaint instead of leaving the map in a
 * continuous render loop.
 */
function refreshCanvasSource(map: maplibregl.Map) {
  const source = map.getSource(SOURCE_ID) as maplibregl.CanvasSource | undefined;
  if (!source) return;
  source.play();
  requestAnimationFrame(() => {
    if (map.getSource(SOURCE_ID)) source.pause();
  });
}
