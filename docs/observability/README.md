# Web Vitals dashboard

Open the local dashboard at http://localhost:3000/d/slate-web-vitals.

`web-vitals-dashboard.json` is the reusable Grafana dashboard definition. To recreate it, use Grafana **Dashboards → New → Import**, upload the JSON, and select Import. It expects data sources with UIDs `prometheus` and `loki`, as provided by grafana/otel-lgtm.

The dashboard includes average reported LCP, INP, CLS, FCP and TTFB values, rolling metric trends, reported-update counts by metric/rating, and recent records with their URL and vital ID. It defaults to the last six hours with a ten-second refresh.

The cards query Loki for the average of reported values in the selected range. Trends query Prometheus histogram sums/counts using rates; these rolling averages differ from the whole-range card averages. Rating counts count reports, not unique visits. Missing data is left empty rather than converted to zero.

Browser instrumentation in `src/observability/browser.ts` uses `reportAllChanges: true`, so repeated updates for the same vital ID are included. These views are for local debugging, not per-visit p75 scores or a Core Web Vitals pass rate. Diagnostic-page measurements are included. Threshold colors are reference guides from https://web.dev/articles/vitals and the installed web-vitals library.

To generate data, run Slate in development, reload a page, interact with it, then switch tabs to trigger visibility-related reporting. Wait for the next telemetry export and Grafana refresh. Production browser telemetry is currently disabled.
