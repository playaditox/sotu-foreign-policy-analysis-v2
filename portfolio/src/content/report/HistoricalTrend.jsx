import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { ChartMark, ChartTooltip, EvidenceChart, Switch } from "../../data-app-public.jsx";
import { ReportDisclosure } from "../shared/ReportDisclosure.jsx";
import { eventLabelDate } from "./sotu-data.js";

export const HistoricalEventsContext = createContext(null);

// Month-precision dates are located at mid-month, without claiming a precise day.
export function eventTime(value) {
  if (!value) return null;
  return Date.parse(value.length === 4 ? `${value}-07-01` : value.length === 7 ? `${value}-15` : value);
}

export function windowEvents(events, start, end) {
  return events.filter(event => eventTime(event.start) <= end
    && (event.end ? eventTime(event.end) : event.ongoing ? end : eventTime(event.start)) >= start);
}

function dates(event) {
  return `${eventLabelDate(event.start)}${event.end ? ` – ${eventLabelDate(event.end)}` : event.ongoing ? " – ongoing aftermath" : ""}`;
}

function HistoricalMark({ event, id, left, top, onInspect }) {
  const row = useMemo(() => ({ ...event, displayed_interval: dates(event),
    interpretation: "Owner-selected historical context; not a causal estimate" }), [event.reviewedRow ?? event]);
  const context = useMemo(() => ({ kind: "chart", chartId: id, chartType: "timeline", label: row.label,
    value: row.displayed_interval, row, actions: row.source_url ? [{ label: "Read historical source",
      onSelect: () => window.open(row.source_url, "_blank", "noopener,noreferrer") }] : [] }), [row, id]);
  return <ChartMark className="sotu-history-mark" style={{ left, top }}
    aria-label={`${row.label}: ${row.displayed_interval}`} data-event-id={row.id} context={context}
    onClick={() => onInspect(row.id)}
    tooltip={<ChartTooltip active details={[]}>
      <div className="sotu-history-tooltip">
        <strong>{row.label}</strong>
        <p className="sotu-history-tooltip-date">{row.displayed_interval}</p>
        <p>{row.description}</p>
        {row.note && <p className="sotu-history-tooltip-note">{row.note}</p>}
      </div>
    </ChartTooltip>}>
    <span className="sotu-event-dot" aria-hidden="true" />
  </ChartMark>;
}

function EventPlot({ plot, chart, events, id, showEvents }) {
  const root = useRef(null), native = useRef(null);
  const [geometry, setGeometry] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  useEffect(() => {
    let frame;
    const measure = () => {
      frame = null;
      const host = root.current, surface = native.current?.querySelector("svg.recharts-surface");
      const probe = surface?.querySelector('[data-temporal-axis-scale="time"]');
      const ticks = [...(surface?.querySelectorAll('[data-temporal-axis-tick]') ?? [])];
      const clip = surface?.querySelector("clipPath rect");
      // Read the painted native time scale, including its padding and zoom.
      // No fixed gutters, replacement axes, or mutations of runtime DOM.
      let next = null;
      if (host && surface && probe && clip && ticks.length >= 2 && chart.x === "date"
        && ["line", "area", "stackedArea"].includes(chart.type)) {
        const bounds = host.getBoundingClientRect(), matrix = surface.getScreenCTM();
        // Definition-only clip rectangles have no painted DOM bounding box.
        // Transform their reviewed SVG coordinates through the actual viewport.
        const a = new DOMPoint(Number(clip.getAttribute("x")), Number(clip.getAttribute("y"))).matrixTransform(matrix);
        const b = new DOMPoint(Number(clip.getAttribute("x")) + Number(clip.getAttribute("width")),
          Number(clip.getAttribute("y")) + Number(clip.getAttribute("height"))).matrixTransform(matrix);
        const box = { left: a.x, top: a.y, width: b.x - a.x, height: b.y - a.y };
        const points = ticks.map(tick => ({ time: Number(tick.dataset.axisValue),
          x: tick.getBoundingClientRect().left + tick.getBoundingClientRect().width / 2 - bounds.left }))
          .filter(point => Number.isFinite(point.time)).sort((a, b) => a.time - b.time);
        const first = points[0], last = points.at(-1);
        if (last?.time > first?.time && box.width > 0) next = {
          left: box.left - bounds.left, top: box.top - bounds.top, width: box.width, height: box.height,
          anchor: first.x, time: first.time, slope: (last.x - first.x) / (last.time - first.time),
          start: Date.parse(probe.dataset.temporalAxisStart), end: Date.parse(probe.dataset.temporalAxisEnd),
        };
      }
      setGeometry(current => JSON.stringify(current) === JSON.stringify(next) ? current : next);
    };
    const schedule = () => { if (frame == null) frame = requestAnimationFrame(measure); };
    const resize = new ResizeObserver(schedule), changes = new MutationObserver(schedule);
    if (native.current) { resize.observe(native.current); changes.observe(native.current, { subtree: true, childList: true, attributes: true }); }
    schedule();
    return () => { resize.disconnect(); changes.disconnect(); cancelAnimationFrame(frame); };
  }, [chart.x, chart.type]);
  const visible = geometry && showEvents ? windowEvents(events, geometry.start, geometry.end) : [];
  const chosen = visible.find(event => event.id === selectedId);
  const x = time => Math.max(geometry.left, Math.min(geometry.left + geometry.width,
    geometry.anchor + (time - geometry.time) * geometry.slope));
  return <div className="sotu-history-plot" ref={root} data-chart-interaction-root>
    <div ref={native}>{plot}</div>
    {geometry && showEvents && <div className="sotu-history-layer" data-reviewed-rows
      aria-label={`${visible.length} selected historical events on the chart’s date axis`}>
      {visible.map((event, index) => {
        const left = x(eventTime(event.start)), end = x(event.end ? eventTime(event.end) : geometry.end);
        const interval = Boolean(event.end || event.ongoing);
        return <React.Fragment key={event.id}>
          {interval && <span className="sotu-history-band" data-event-duration={event.id}
            style={{ left, top: geometry.top, width: Math.max(2, end - left), height: geometry.height }} />}
          <span className="sotu-history-guide" style={{ left, top: geometry.top, height: geometry.height }} />
          {interval && <span className={`sotu-history-duration ${event.ongoing ? "is-ongoing" : ""}`}
            style={{ left, width: Math.max(2, end - left), top: geometry.top + 13 + (index % 4) * 17 }} />}
          <HistoricalMark event={event} id={id} left={left} top={geometry.top + 13 + (index % 4) * 17} onInspect={setSelectedId} />
        </React.Fragment>;
      })}
    </div>}
    {!geometry && showEvents && <p className="sotu-history-fallback">Historical dates are listed below. Event overlays require a dated trend with at least two labelled time ticks.</p>}
    {chosen && <div className="sotu-event-detail" data-reviewed-rows aria-live="polite">
      <strong>{chosen.label}</strong><span>{dates(chosen)}</span><p>{chosen.description}</p><p>{chosen.note}</p>
      {chosen.source_url && <a href={chosen.source_url} target="_blank" rel="noreferrer">Read historical source ↗</a>}
    </div>}
  </div>;
}

export function HistoricalTrend({ events, rows, queryIds = [], sourceRows, sourceRowsByQuery, headerControls, children, ...props }) {
  const eventsControl = useContext(HistoricalEventsContext);
  const showEvents = eventsControl?.showEvents ?? true;
  const start = Math.min(...rows.map(row => Date.parse(row.date)));
  const end = Math.max(...rows.map(row => Date.parse(row.date)));
  const scopedEvents = windowEvents(events, start, end);
  const sourceMap = { ...(sourceRowsByQuery ?? { [props.queryId]: sourceRows }), events: scopedEvents.map(event => event.reviewedRow ?? event) };
  return <EvidenceChart {...props} rows={rows} queryIds={[...new Set([props.queryId, ...queryIds, "events"])]}
    sourceRowsByQuery={sourceMap}
    headerControls={<>{headerControls}{eventsControl?.setShowEvents && <Switch label="Show historical events"
      checked={showEvents} onChange={eventsControl.setShowEvents} size="compact" />}</>}
    renderPlot={(plot, chart) => <EventPlot plot={plot} chart={chart} events={scopedEvents} id={props.id} showEvents={showEvents} />}>
    {children}
    {showEvents && <>
    <p className="sotu-history-key" data-reviewed-rows><span className="sotu-event-dot" /> All owner-selected events in the displayed date range appear in red. Shading and bars show approximate durations; dots mark milestones. Hover or select a dot for details.</p>
    <p className="sotu-history-caption">This is the project owner’s editorial selection of historical context, not an exhaustive chronology. The events share the speech-date axis; proximity does not demonstrate causation. A speech may precede an event in the same year. Ongoing aftermath is clipped to the chart’s latest speech.</p>
    <ReportDisclosure id={`${props.id}:event-list`} label={`Browse the ${scopedEvents.length} selected events in this speech window`}>
      <ol className="sotu-history-list" data-reviewed-rows>{scopedEvents.map(event => <li key={event.id}>
        <strong>{event.label}</strong><span>{dates(event)}</span><p>{event.description} {event.note}</p>
        {event.source_url && <a href={event.source_url} target="_blank" rel="noreferrer">Historical source ↗</a>}
      </li>)}</ol>
    </ReportDisclosure>
    </>}
  </EvidenceChart>;
}
