"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ChevronDown, History, Printer, ArrowRight } from "lucide-react";

import {
  getAnalysisHistory,
  getFarms,
  type Farm,
  type AnalysisHistoryRecord,
} from "@/lib/api";

interface AnalysisHistoryProps {
  refreshKey?: number;
}

function escapeHtml(value: unknown): string {
  return String(value ?? "").replace(/[&<>"']/g, (character) => {
    const entities: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };

    return entities[character];
  });
}

async function fetchAnalysisImage(
  recordId: number
): Promise<string | null> {
  const token = localStorage.getItem("access_token");

  if (!token) {
    throw new Error("Please log in to view the report image.");
  }

  const apiUrl = (
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"
  ).replace(/\/+$/, "");

  const response = await fetch(
    `${apiUrl}/api/v1/analysis/history/${recordId}/image`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "ngrok-skip-browser-warning": "true",
      },
      cache: "no-store",
    }
  );

  // Older analyses may not have a saved original image.
  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new Error("Could not load the original analysis image.");
  }

  const blob = await response.blob();
  return URL.createObjectURL(blob);
}

export default function AnalysisHistory({
  refreshKey = 0,
}: AnalysisHistoryProps) {
  const [records, setRecords] = useState<AnalysisHistoryRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const [fieldNames, setFieldNames] = useState<Record<number, string>>({});

  const loadHistory = useCallback(async () => {
  setLoading(true);
  setError(null);

  try {
    const data = await getAnalysisHistory();

    const sortedRecords = [...data].sort(
      (a, b) =>
        new Date(b.created_at).getTime() -
        new Date(a.created_at).getTime()
    );

    setRecords(sortedRecords);

    try {
      const farms: Farm[] = await getFarms();
      const names: Record<number, string> = {};

      farms.forEach((farm) => {
        farm.fields?.forEach((field) => {
          names[field.id] = `${farm.name} / ${field.name}`;
        });
      });

      setFieldNames(names);
    } catch {
      // Keep analysis history available if farm names cannot load.
      setFieldNames({});
    }
  } catch (err) {
    setError(
      err instanceof Error
        ? err.message
        : "Could not load analysis history."
    );
  } finally {
    setLoading(false);
  }
}, []);

  useEffect(() => {
    void loadHistory();
  }, [loadHistory, refreshKey]);

  const viewFullReport = async (record: AnalysisHistoryRecord) => {
    // Open the window before awaiting anything to avoid popup blockers.
    const reportWindow = window.open("", "_blank");

    if (!reportWindow) {
      setError("Allow pop-ups in your browser to open the report.");
      return;
    }

    setError(null);

    reportWindow.document.open();
    reportWindow.document.write(`
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <title>Analysis Report #${record.id}</title>
          <style>
            body {
              font-family: Arial, Helvetica, sans-serif;
              color: #1f2937;
              max-width: 1000px;
              margin: 30px auto;
              padding: 0 24px;
              line-height: 1.6;
            }
            h1 { margin-bottom: 6px; }
            h2 {
              margin-top: 30px;
              padding-bottom: 8px;
              border-bottom: 1px solid #d1d5db;
            }
            .muted { color: #6b7280; }
            .summary {
              display: grid;
              grid-template-columns: repeat(3, minmax(0, 1fr));
              gap: 12px;
              margin: 24px 0;
            }
            .stat {
              border: 1px solid #d1d5db;
              border-radius: 8px;
              padding: 16px;
            }
            .stat strong {
              display: block;
              font-size: 24px;
            }
            .original-image { margin-top: 24px; }
            .original-image img {
              display: block;
              max-width: 100%;
              max-height: 650px;
              object-fit: contain;
              margin: 12px auto;
              border: 1px solid #d1d5db;
              border-radius: 8px;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 12px;
            }
            th, td {
              border: 1px solid #d1d5db;
              padding: 10px;
              text-align: left;
              vertical-align: top;
            }
            th { background: #f3f4f6; }
            .disease { color: #b91c1c; }
            .actions { display: flex; gap: 10px; margin: 24px 0; }
            .actions button {
              padding: 10px 16px;
              border: 0;
              border-radius: 6px;
              cursor: pointer;
              background: #047857;
              color: white;
              font-size: 14px;
            }
            .actions .close { background: #4b5563; }
            @media (max-width: 600px) {
              body { padding: 0 12px; }
              .summary { grid-template-columns: 1fr; }
              table { font-size: 12px; }
              th, td { padding: 6px; }
            }
            @media print {
              body { max-width: none; margin: 0; padding: 0; }
              .actions { display: none; }
              .stat, tr, .original-image {
                break-inside: avoid;
              }
              h2 { break-after: avoid; }
            }
          </style>
        </head>
        <body>
          <p>Loading analysis report and original image...</p>
        </body>
      </html>
    `);
    reportWindow.document.close();

    let imageUrl: string | null = null;

    try {
      imageUrl = await fetchAnalysisImage(record.id);

      const crops = record.results?.crops ?? [];

      const cropRows = crops.length
        ? crops
            .map((crop) => {
              const diseases = crop.diseases?.length
                ? crop.diseases
                    .map(
                      (disease) => `
                        <div class="disease">
                          <strong>${escapeHtml(disease.disease)}</strong>
                          <br />
                          Confidence:
                          ${(disease.confidence * 100).toFixed(1)}%
                          ${
                            disease.affected_area_percent != null
                              ? `<br />Affected area: ${Number(
                                  disease.affected_area_percent
                                ).toFixed(1)}%`
                              : ""
                          }
                        </div>
                      `
                    )
                    .join("")
                : "No disease detected";

              return `
                <tr>
                  <td>${escapeHtml(crop.crop_id)}</td>
                  <td>${escapeHtml(crop.crop)}</td>
                  <td>${(crop.confidence * 100).toFixed(1)}%</td>
                  <td>${diseases}</td>
                </tr>
              `;
            })
            .join("")
        : `
            <tr>
              <td colspan="4">No crop detections were recorded.</td>
            </tr>
          `;

      if (reportWindow.closed) {
        if (imageUrl) URL.revokeObjectURL(imageUrl);
        return;
      }

      const reportHtml = `
        <!DOCTYPE html>
        <html lang="en">
          <head>
            <meta charset="UTF-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1.0" />
            <title>Analysis Report #${record.id}</title>
            <style>
              body {
                font-family: Arial, Helvetica, sans-serif;
                color: #1f2937;
                max-width: 1000px;
                margin: 30px auto;
                padding: 0 24px;
                line-height: 1.6;
              }
              h1 { margin-bottom: 6px; }
              h2 {
                margin-top: 30px;
                padding-bottom: 8px;
                border-bottom: 1px solid #d1d5db;
              }
              .muted { color: #6b7280; }
              .summary {
                display: grid;
                grid-template-columns: repeat(3, minmax(0, 1fr));
                gap: 12px;
                margin: 24px 0;
              }
              .stat {
                border: 1px solid #d1d5db;
                border-radius: 8px;
                padding: 16px;
              }
              .stat strong {
                display: block;
                font-size: 24px;
              }
              .original-image { margin-top: 24px; }
              .original-image img {
                display: block;
                max-width: 100%;
                max-height: 650px;
                object-fit: contain;
                margin: 12px auto;
                border: 1px solid #d1d5db;
                border-radius: 8px;
              }
              table {
                width: 100%;
                border-collapse: collapse;
                margin-top: 12px;
              }
              th, td {
                border: 1px solid #d1d5db;
                padding: 10px;
                text-align: left;
                vertical-align: top;
              }
              th { background: #f3f4f6; }
              .disease { color: #b91c1c; }
              .actions { display: flex; gap: 10px; margin: 24px 0; }
              .actions button {
                padding: 10px 16px;
                border: 0;
                border-radius: 6px;
                cursor: pointer;
                background: #047857;
                color: white;
                font-size: 14px;
              }
              .actions .close { background: #4b5563; }
              @media (max-width: 600px) {
                body { padding: 0 12px; }
                .summary { grid-template-columns: 1fr; }
                table { font-size: 12px; }
                th, td { padding: 6px; }
              }
              @media print {
                body { max-width: none; margin: 0; padding: 0; }
                .actions { display: none; }
                .stat, tr, .original-image {
                  break-inside: avoid;
                }
                h2 { break-after: avoid; }
              }
            </style>
          </head>
          <body>
            <h1>Agricultural Crop Analysis Report</h1>
            <p class="muted">Analysis #${record.id}</p>
            <p>
              <strong>Analysis date:</strong>
              ${escapeHtml(new Date(record.created_at).toLocaleString())}
            </p>

            <div class="summary">
              <div class="stat">
                <span>Total crops</span>
                <strong>${escapeHtml(record.crop_count)}</strong>
              </div>
              <div class="stat">
                <span>Diseased crops</span>
                <strong>${escapeHtml(record.diseased_crop_count)}</strong>
              </div>
              <div class="stat">
                <span>Disease detections</span>
                <strong>${escapeHtml(record.disease_count)}</strong>
              </div>
            </div>

            <section class="original-image">
              <h2>Original Field Image</h2>
              ${
                imageUrl
                  ? `<img src="${imageUrl}" alt="Original field image for analysis ${record.id}" />`
                  : "<p class=\"muted\">Original image is unavailable for this analysis.</p>"
              }
            </section>

            <section>
              <h2>Crop and Disease Findings</h2>
              <table>
                <thead>
                  <tr>
                    <th>Crop ID</th>
                    <th>Crop</th>
                    <th>Crop Confidence</th>
                    <th>Disease Findings</th>
                  </tr>
                </thead>
                <tbody>${cropRows}</tbody>
              </table>
            </section>

            <div class="actions">
              <button onclick="window.print()">Print / Save as PDF</button>
              <button class="close" onclick="window.close()">Close Report</button>
            </div>

            <p class="muted">
              This report reflects the detections saved when the analysis was performed.
            </p>
          </body>
        </html>
      `;

      reportWindow.document.open();
      reportWindow.document.write(reportHtml);
      reportWindow.document.close();

      // Keep the image available until the report window is closed.
      if (imageUrl) {
        const urlToRevoke = imageUrl;
        reportWindow.addEventListener(
          "beforeunload",
          () => URL.revokeObjectURL(urlToRevoke),
          { once: true }
        );
      }
    } catch (err) {
      if (imageUrl) URL.revokeObjectURL(imageUrl);

      if (!reportWindow.closed) {
        reportWindow.close();
      }

      setError(
        err instanceof Error
          ? err.message
          : "Could not generate the analysis report."
      );
    }
  };

  return (
    <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <History className="h-5 w-5 text-emerald-400" />
            <h2 className="text-lg font-semibold">Analysis History</h2>
          </div>

          <p className="mt-1 text-sm text-white/40">
            Previously saved crop and disease analyses.
          </p>
        </div>

        <button
          type="button"
          onClick={() => void loadHistory()}
          disabled={loading}
          className="rounded-lg border border-white/10 px-4 py-2 text-sm hover:bg-white/5 disabled:opacity-50"
        >
          {loading ? "Loading..." : "Refresh"}
        </button>
      </div>

      {error && (
        <p
          role="alert"
          className="mb-4 rounded-lg bg-red-400/10 p-3 text-sm text-red-300"
        >
          {error}
        </p>
      )}

      {loading && records.length === 0 ? (
        <p className="py-6 text-center text-sm text-white/50">
          Loading analysis history...
        </p>
      ) : records.length === 0 ? (
        <p className="py-6 text-center text-sm text-white/50">
          No saved analyses yet.
        </p>
      ) : (
        <div className="space-y-3">
          {records.slice(0, 5).map((record) => {
            const expanded = expandedId === record.id;
            const crops = record.results?.crops ?? [];

            return (
              <div
                key={record.id}
                className="overflow-hidden rounded-xl border border-white/10"
              >
                <button
                  type="button"
                  aria-expanded={expanded}
                  onClick={() =>
                    setExpandedId(expanded ? null : record.id)
                  }
                  className="flex w-full flex-col gap-3 p-4 text-left hover:bg-white/[0.03] md:flex-row md:items-center md:justify-between"
                >
                  <div>
                    <p className="text-sm font-medium">
                      {record.field_id != null
                        ? fieldNames[record.field_id] ?? `Field #${record.field_id}`
                        : "Unassigned field"}
                    </p>
                    <p className="mt-1 text-xs text-white/50">
                      Analysis #{record.id}
                    </p>
                    <p className="mt-1 text-xs text-white/40">
                      {new Date(record.created_at).toLocaleString()}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-4 text-sm">
                    <span>Crops: {record.crop_count}</span>
                    <span className="text-red-300">
                      Diseased: {record.diseased_crop_count}
                    </span>
                    <span>Diseases: {record.disease_count}</span>
                    <ChevronDown
                      className={`h-4 w-4 transition-transform ${
                        expanded ? "rotate-180" : ""
                      }`}
                    />
                  </div>
                </button>

                {expanded && (
                  <div className="border-t border-white/10 p-4">
                    <div className="mb-4 flex justify-end">
                      <button
                        type="button"
                        onClick={() => void viewFullReport(record)}
                        className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-500"
                      >
                        <Printer className="h-4 w-4" />
                        View Full Report
                      </button>
                    </div>

                    {crops.length > 0 ? (
                      <div className="space-y-3">
                        {crops.map((crop, index) => (
                          <div
                            key={`${record.id}-${crop.crop_id}-${index}`}
                            className="rounded-lg border border-white/10 p-3"
                          >
                            <div className="flex flex-wrap justify-between gap-2">
                              <p className="text-sm font-medium">
                                Crop #{crop.crop_id}: {crop.crop}
                              </p>
                              <span className="text-xs text-white/50">
                                Confidence:{" "}
                                {(crop.confidence * 100).toFixed(0)}%
                              </span>
                            </div>

                            {crop.diseases?.length ? (
                              <div className="mt-3 space-y-2">
                                {crop.diseases.map((disease, index) => (
                                  <div
                                    key={`${crop.crop_id}-disease-${index}`}
                                    className="rounded-lg bg-red-400/[0.06] p-3"
                                  >
                                    <p className="text-sm text-red-300">
                                      {disease.disease}
                                    </p>
                                    <p className="mt-1 text-xs text-white/50">
                                      Confidence:{" "}
                                      {(disease.confidence * 100).toFixed(0)}%
                                    </p>

                                    {disease.affected_area_percent != null && (
                                      <p className="mt-1 text-xs text-white/50">
                                        Affected area:{" "}
                                        {disease.affected_area_percent.toFixed(1)}%
                                      </p>
                                    )}
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="mt-2 text-xs text-white/40">
                                No disease detections for this crop.
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-white/50">
                        No crop detections were recorded for this analysis.
                      </p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
          <div className="mt-5 flex justify-end">
            <Link
              href="/reports"
              className="inline-flex items-center gap-2 rounded-lg border border-emerald-500/30 px-4 py-2 text-sm font-medium text-emerald-400 transition hover:bg-emerald-500/10"
            >
              Show more
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      )}
    </section>
  );
}
