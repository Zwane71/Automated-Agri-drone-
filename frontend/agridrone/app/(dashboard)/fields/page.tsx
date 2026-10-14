"use client";

import { useEffect, useState } from "react";

import {
  AlertCircle,
  CheckCircle2,
  FileImage,
  Loader2,
  MapPin,
  Sprout,
  Upload,
} from "lucide-react";

import DashboardShell from "@/components/dashboard/DashboardShell";
import PageHeader from "@/components/dashboard/PageHeader";
import StatCard from "@/components/dashboard/StatCard";

import {
  analyzeFull,
  getFarms,
  createFarm,
  updateFarm,
  deleteFarm,
  createField,
  updateField,
  deleteField,
} from "@/lib/api";

import type {
  Farm,
  FarmField,
} from "@/lib/api";

import type {
  AnalysisResult,
  CropDetection,
  DiseaseDetection,
} from "@/components/analysis/types";

export default function FieldsPage() {
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);


    // Farm and field management
  const [farms, setFarms] = useState<Farm[]>([]);
  const [selectedFarmId, setSelectedFarmId] =
    useState<number | null>(null);
  const [selectedFieldId, setSelectedFieldId] =
    useState<number | null>(null);

  const [managementLoading, setManagementLoading] =
    useState(true);
  const [managementError, setManagementError] =
    useState<string | null>(null);
  const [managementMessage, setManagementMessage] =
    useState<string | null>(null);

  const [farmName, setFarmName] = useState("");
  const [farmLocation, setFarmLocation] = useState("");
  const [farmDescription, setFarmDescription] = useState("");
  const [editingFarmId, setEditingFarmId] =
    useState<number | null>(null);

  const [fieldName, setFieldName] = useState("");
  const [fieldArea, setFieldArea] = useState("");
  const [fieldCropType, setFieldCropType] = useState("");
  const [editingFieldId, setEditingFieldId] =
    useState<number | null>(null);

  const [savingManagement, setSavingManagement] =
    useState(false);

  const selectedFarm =
    farms.find((farm) => farm.id === selectedFarmId) ?? null;

  const selectedField =
    selectedFarm?.fields.find(
      (field) => field.id === selectedFieldId
    ) ?? null;


    const loadFarms = async () => {
    setManagementLoading(true);
    setManagementError(null);

    try {
      const data = await getFarms();

      setFarms(data);

      setSelectedFarmId((currentId) => {
        if (currentId && data.some((farm) => farm.id === currentId)) {
          return currentId;
        }

        return data[0]?.id ?? null;
      });
    } catch (err) {
      setManagementError(
        err instanceof Error
          ? err.message
          : "Failed to load farms."
      );
    } finally {
      setManagementLoading(false);
    }
  };

  useEffect(() => {
    void loadFarms();
  }, []);

  useEffect(() => {
    setSelectedFieldId(null);
  }, [selectedFarmId]);

  
  const resetFarmForm = () => {
    setEditingFarmId(null);
    setFarmName("");
    setFarmLocation("");
    setFarmDescription("");
  };

  const resetFieldForm = () => {
    setEditingFieldId(null);
    setFieldName("");
    setFieldArea("");
    setFieldCropType("");
  };

  const handleFarmSubmit = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();
    if (!farmName.trim()) return;

    setSavingManagement(true);
    setManagementError(null);
    setManagementMessage(null);

    try {
      const payload = {
        name: farmName.trim(),
        location: farmLocation.trim() || null,
        description: farmDescription.trim() || null,
      };

      if (editingFarmId !== null) {
        await updateFarm(editingFarmId, payload);
        setManagementMessage("Farm updated successfully.");
      } else {
        await createFarm(payload);
        setManagementMessage("Farm created successfully.");
      }

      resetFarmForm();
      await loadFarms();
    } catch (err) {
      setManagementError(
        err instanceof Error ? err.message : "Could not save farm."
      );
    } finally {
      setSavingManagement(false);
    }
  };

  const handleFarmEdit = (farm: Farm) => {
    setEditingFarmId(farm.id);
    setFarmName(farm.name);
    setFarmLocation(farm.location ?? "");
    setFarmDescription(farm.description ?? "");
  };

  const handleFarmDelete = async (farm: Farm) => {
    if (!window.confirm(`Delete "${farm.name}"?`)) return;

    setSavingManagement(true);
    setManagementError(null);

    try {
      await deleteFarm(farm.id);

      if (editingFarmId === farm.id) resetFarmForm();

      setManagementMessage("Farm deleted successfully.");
      await loadFarms();
    } catch (err) {
      setManagementError(
        err instanceof Error ? err.message : "Could not delete farm."
      );
    } finally {
      setSavingManagement(false);
    }
  };

  const handleFieldSubmit = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();
    if (!selectedFarm || !fieldName.trim()) return;

    const area = fieldArea.trim() ? Number(fieldArea) : null;

    if (area !== null && (!Number.isFinite(area) || area <= 0)) {
      setManagementError("Field area must be greater than zero.");
      return;
    }

    setSavingManagement(true);
    setManagementError(null);
    setManagementMessage(null);

    try {
      const payload = {
        name: fieldName.trim(),
        area_hectares: area,
        crop_type: fieldCropType.trim() || null,
      };

      if (editingFieldId !== null) {
        await updateField(editingFieldId, payload);
        setManagementMessage("Field updated successfully.");
      } else {
        await createField(selectedFarm.id, payload);
        setManagementMessage("Field created successfully.");
      }

      resetFieldForm();
      await loadFarms();
    } catch (err) {
      setManagementError(
        err instanceof Error ? err.message : "Could not save field."
      );
    } finally {
      setSavingManagement(false);
    }
  };

  const handleFieldEdit = (field: FarmField) => {
    setEditingFieldId(field.id);
    setFieldName(field.name);
    setFieldArea(
      field.area_hectares === null ? "" : String(field.area_hectares)
    );
    setFieldCropType(field.crop_type ?? "");
  };

  const handleFieldDelete = async (field: FarmField) => {
    if (!window.confirm(`Delete "${field.name}"?`)) return;

    setSavingManagement(true);
    setManagementError(null);

    try {
      await deleteField(field.id);

      if (selectedFieldId === field.id) {
        setSelectedFieldId(null);
        setResult(null);
        setFileName(null);
      }

      if (editingFieldId === field.id) resetFieldForm();

      setManagementMessage("Field deleted successfully.");
      await loadFarms();
    } catch (err) {
      setManagementError(
        err instanceof Error ? err.message : "Could not delete field."
      );
    } finally {
      setSavingManagement(false);
    }
  };

  const handleImageUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];

    if (!file) return;

    setLoading(true);
    setError(null);
    setResult(null);
    setFileName(file.name);

    try {

            if (!selectedField) {
        throw new Error("Please select a field before analyzing an image.");
      }
      const analysis = await analyzeFull(file, selectedField.id);
      setResult(analysis);
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : "Failed to analyze the field image."
      );
    } finally {
      setLoading(false);

      // Allow the same image to be selected again.
      event.target.value = "";
    }
  };

  const diseaseSummary = result
    ? result.crops.reduce<Record<string, number>>(
        (summary, crop) => {
          crop.diseases.forEach((disease) => {
            summary[disease.disease] =
              (summary[disease.disease] || 0) + 1;
          });

          return summary;
        },
        {}
      )
    : {};

  const allDiseases: DiseaseDetection[] = result
    ? result.crops.flatMap((crop) => crop.diseases)
    : [];

  const averageCropConfidence =
    result && result.crops.length > 0
      ? result.crops.reduce(
          (total, crop) => total + crop.confidence,
          0
        ) / result.crops.length
      : 0;

  const averageDiseaseConfidence =
    allDiseases.length > 0
      ? allDiseases.reduce(
          (total, disease) => total + disease.confidence,
          0
        ) / allDiseases.length
      : 0;

  return (
    <DashboardShell>
      <div className="space-y-6 p-5 md:p-8">
        {/* Header */}
        <PageHeader
          title="Fields"
          description="Manage farms and fields, then analyze crop images with AI."
        />

        
        {/* Farm and field management */}
        <section className="space-y-6 rounded-2xl border border-white/10 bg-white/[0.03] p-6">
          <div>
            <h2 className="text-lg font-semibold">Farm Management</h2>
            <p className="mt-1 text-sm text-white/40">
              Organize your farms and manage the fields within each farm.
            </p>
          </div>

          {managementError && (
            <div className="rounded-xl border border-red-400/20 bg-red-400/10 p-3 text-sm text-red-300">
              {managementError}
            </div>
          )}

          {managementMessage && (
            <div className="rounded-xl border border-emerald-400/20 bg-emerald-400/10 p-3 text-sm text-emerald-300">
              {managementMessage}
            </div>
          )}

          {managementLoading ? (
            <p className="text-sm text-white/50">Loading farms...</p>
          ) : (
            <>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm text-white/60">
                    Select farm
                  </label>
                  <select
                    value={selectedFarmId ?? ""}
                    onChange={(event) => {
                      setSelectedFarmId(
                        event.target.value
                          ? Number(event.target.value)
                          : null
                      );
                      setManagementMessage(null);
                      resetFieldForm();
                    }}
                    className="w-full rounded-xl border border-white/10 bg-[#111] p-3 text-sm"
                  >
                    <option value="">Select a farm</option>
                    {farms.map((farm) => (
                      <option key={farm.id} value={farm.id}>
                        {farm.name}
                      </option>
                    ))}
                  </select>
                </div>

                {selectedFarm && (
                  <div className="rounded-xl border border-white/10 p-4">
                    <p className="font-medium">{selectedFarm.name}</p>
                    <p className="mt-1 text-sm text-white/40">
                      {selectedFarm.location || "No location recorded"}
                    </p>
                    <p className="mt-2 text-xs text-white/40">
                      {selectedFarm.fields.length} field
                      {selectedFarm.fields.length === 1 ? "" : "s"}
                    </p>
                    <div className="mt-3 flex gap-3">
                      <button
                        type="button"
                        onClick={() => handleFarmEdit(selectedFarm)}
                        className="text-sm text-emerald-300 hover:text-emerald-200"
                      >
                        Edit farm
                      </button>
                      <button
                        type="button"
                        disabled={savingManagement}
                        onClick={() => void handleFarmDelete(selectedFarm)}
                        className="text-sm text-red-300 hover:text-red-200 disabled:opacity-40"
                      >
                        Delete farm
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <form
                onSubmit={handleFarmSubmit}
                className="grid gap-3 rounded-xl border border-white/10 bg-white/[0.02] p-4 md:grid-cols-2"
              >
                <h3 className="font-medium md:col-span-2">
                  {editingFarmId !== null ? "Edit farm" : "Add a farm"}
                </h3>

                <input
                  required
                  value={farmName}
                  onChange={(event) => setFarmName(event.target.value)}
                  placeholder="Farm name"
                  className="rounded-xl border border-white/10 bg-black/20 p-3 text-sm"
                />
                <input
                  value={farmLocation}
                  onChange={(event) => setFarmLocation(event.target.value)}
                  placeholder="Location (optional)"
                  className="rounded-xl border border-white/10 bg-black/20 p-3 text-sm"
                />
                <textarea
                  value={farmDescription}
                  onChange={(event) => setFarmDescription(event.target.value)}
                  placeholder="Description (optional)"
                  rows={2}
                  className="rounded-xl border border-white/10 bg-black/20 p-3 text-sm md:col-span-2"
                />

                <div className="flex gap-3 md:col-span-2">
                  <button
                    type="submit"
                    disabled={savingManagement}
                    className="rounded-xl bg-emerald-500 px-4 py-2 text-sm font-medium text-black disabled:opacity-50"
                  >
                    {savingManagement
                      ? "Saving..."
                      : editingFarmId !== null
                        ? "Save farm"
                        : "Create farm"}
                  </button>
                  {editingFarmId !== null && (
                    <button
                      type="button"
                      onClick={resetFarmForm}
                      className="rounded-xl border border-white/10 px-4 py-2 text-sm"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </form>

              {selectedFarm && (
                <>
                  <div className="border-t border-white/10 pt-5">
                    <h3 className="font-semibold">Fields in {selectedFarm.name}</h3>
                    <p className="mt-1 text-sm text-white/40">
                      Select a field to use it for your AI analysis.
                    </p>
                  </div>

                  {selectedFarm.fields.length === 0 ? (
                    <p className="rounded-xl border border-dashed border-white/10 p-5 text-sm text-white/40">
                      No fields yet. Create your first field below.
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {selectedFarm.fields.map((field) => (
                        <div
                          key={field.id}
                          className={`rounded-xl border p-4 ${
                            selectedFieldId === field.id
                              ? "border-emerald-400/50 bg-emerald-400/[0.06]"
                              : "border-white/10 bg-white/[0.02]"
                          }`}
                        >
                          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                            <label className="flex cursor-pointer items-start gap-3">
                              <input
                                type="radio"
                                name="selectedField"
                                checked={selectedFieldId === field.id}
                                onChange={() => setSelectedFieldId(field.id)}
                                className="mt-1 accent-emerald-400"
                              />
                              <span>
                                <span className="block font-medium">{field.name}</span>
                                <span className="mt-1 block text-xs text-white/40">
                                  {field.crop_type || "Crop not specified"}
                                  {" · "}
                                  {field.area_hectares != null
                                    ? `${field.area_hectares} hectares`
                                    : "Area not recorded"}
                                </span>
                              </span>
                            </label>

                            <div className="flex gap-3 pl-6 md:pl-0">
                              <button
                                type="button"
                                onClick={() => handleFieldEdit(field)}
                                className="text-sm text-emerald-300"
                              >
                                Edit
                              </button>
                              <button
                                type="button"
                                disabled={savingManagement}
                                onClick={() => void handleFieldDelete(field)}
                                className="text-sm text-red-300 disabled:opacity-40"
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <form
                    onSubmit={handleFieldSubmit}
                    className="grid gap-3 rounded-xl border border-white/10 bg-white/[0.02] p-4 md:grid-cols-2"
                  >
                    <h3 className="font-medium md:col-span-2">
                      {editingFieldId !== null ? "Edit field" : "Add a field"}
                    </h3>

                    <input
                      required
                      value={fieldName}
                      onChange={(event) => setFieldName(event.target.value)}
                      placeholder="Field name"
                      className="rounded-xl border border-white/10 bg-black/20 p-3 text-sm"
                    />
                    <input
                      value={fieldArea}
                      onChange={(event) => setFieldArea(event.target.value)}
                      type="number"
                      min="0.01"
                      step="any"
                      placeholder="Area in hectares (optional)"
                      className="rounded-xl border border-white/10 bg-black/20 p-3 text-sm"
                    />
                    <input
                      value={fieldCropType}
                      onChange={(event) => setFieldCropType(event.target.value)}
                      placeholder="Crop type (e.g. cabbage)"
                      className="rounded-xl border border-white/10 bg-black/20 p-3 text-sm md:col-span-2"
                    />

                    <div className="flex gap-3 md:col-span-2">
                      <button
                        type="submit"
                        disabled={savingManagement}
                        className="rounded-xl bg-emerald-500 px-4 py-2 text-sm font-medium text-black disabled:opacity-50"
                      >
                        {savingManagement
                          ? "Saving..."
                          : editingFieldId !== null
                            ? "Save field"
                            : "Create field"}
                      </button>
                      {editingFieldId !== null && (
                        <button
                          type="button"
                          onClick={resetFieldForm}
                          className="rounded-xl border border-white/10 px-4 py-2 text-sm"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </form>
                </>
              )}

              {!selectedFarm && (
                <p className="text-sm text-white/40">
                  Create a farm above to start adding fields.
                </p>
              )}
            </>
          )}
        </section>

        {/* Field analysis information */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-400/10">
              <Sprout className="h-5 w-5 text-emerald-400" />
            </div>

            <div>
              <h2 className="text-lg font-medium">
                Field Analysis
              </h2>

              <p className="mt-1 max-w-2xl text-sm leading-6 text-white/40">
                Upload a field image to detect crops and
                analyze the detected crops for disease.
              </p>
            </div>
          </div>
        </div>

        {/* Upload */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <FileImage className="h-4 w-4 text-white/50" />

                <h2 className="text-base font-medium">
                  Field Image
                </h2>
              </div>

              <p className="mt-1 text-sm text-white/40">
                Upload an image containing crops from the
                field.
              </p>

              {fileName && (
                <p className="mt-2 text-xs text-white/30">
                  Selected: {fileName}
                </p>
              )}
            </div>

            <label
              className={`inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-medium transition ${
                loading
                  ? "cursor-not-allowed bg-white/10 text-white/40"
                  : "cursor-pointer bg-emerald-500 text-black hover:bg-emerald-400"
              }`}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Analyzing Field...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4" />
                  Upload Image
                </>
              )}

              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                disabled={loading}
                className="hidden"
              />
            </label>
          </div>

          {error && (
            <div className="mt-5 flex items-start gap-3 rounded-xl border border-red-400/20 bg-red-400/10 p-4 text-sm text-red-300">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />

              <div>
                <p className="font-medium">
                  Field analysis failed
                </p>

                <p className="mt-1 text-red-300/70">
                  {error}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Empty state */}
        {!result && !loading && !error && (
          <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-10 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-white/[0.04]">
              <Sprout className="h-6 w-6 text-white/20" />
            </div>

            <h2 className="mt-4 text-base font-medium">
              No field analysis yet
            </h2>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-white/35">
              Upload a field image above to analyze the
              crops and detected diseases.
            </p>
          </div>
        )}

        {/* Results */}
        {result && (
          <>
            {/* Statistics */}
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <StatCard
                label="Total Crops"
                value={result.crop_count}
                change="Detected in field image"
                icon={<Sprout className="h-5 w-5" />}
              />

              <StatCard
                label="Diseased Crops"
                value={result.diseased_crop_count}
                change="Crops with disease detections"
                icon={
                  <AlertCircle className="h-5 w-5" />
                }
              />

              <StatCard
                label="Disease Findings"
                value={result.disease_count}
                change="Total detected disease regions"
                icon={
                  <CheckCircle2 className="h-5 w-5" />
                }
              />

              <StatCard
                label="Location"
                value="Not available"
                change="GPS will be added later"
                icon={<MapPin className="h-5 w-5" />}
              />
            </div>

            {/* Field overview */}
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
              <div className="mb-5">
                <h2 className="text-lg font-medium">
                  Field Overview
                </h2>

                <p className="mt-1 text-sm text-white/40">
                  Summary of the AI analysis for this field
                  image.
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
                  <p className="text-xs text-white/30">
                    Image Size
                  </p>

                  <p className="mt-2 text-lg font-semibold">
                    {result.image_width} ×{" "}
                    {result.image_height}
                  </p>
                </div>

                <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
                  <p className="text-xs text-white/30">
                    Crop Confidence
                  </p>

                  <p className="mt-2 text-lg font-semibold">
                    {(averageCropConfidence * 100).toFixed(0)}%
                  </p>
                </div>

                <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
                  <p className="text-xs text-white/30">
                    Disease Confidence
                  </p>

                  <p className="mt-2 text-lg font-semibold">
                    {allDiseases.length > 0
                      ? `${(
                          averageDiseaseConfidence * 100
                        ).toFixed(0)}%`
                      : "—"}
                  </p>
                </div>
              </div>
            </div>

            {/* Disease summary */}
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
              <div className="mb-5">
                <h2 className="text-lg font-medium">
                  Disease Summary
                </h2>

                <p className="mt-1 text-sm text-white/40">
                  Disease detections returned by the existing
                  AI model.
                </p>
              </div>

              {Object.keys(diseaseSummary).length === 0 ? (
                <div className="rounded-xl border border-white/10 bg-white/[0.02] p-6 text-center">
                  <CheckCircle2 className="mx-auto mb-3 h-8 w-8 text-emerald-400/50" />

                  <p className="text-sm text-white/50">
                    No disease detections
                  </p>

                  <p className="mt-1 text-xs text-white/30">
                    No disease regions were returned for the
                    detected crops.
                  </p>
                </div>
              ) : (
                <div className="grid gap-3 md:grid-cols-3">
                  {Object.entries(diseaseSummary).map(
                    ([disease, count]) => (
                      <div
                        key={disease}
                        className="rounded-xl border border-white/10 bg-white/[0.02] p-4"
                      >
                        <p className="text-sm font-medium capitalize">
                          {disease.replaceAll("_", " ")}
                        </p>

                        <p className="mt-2 text-2xl font-bold">
                          {count}
                        </p>

                        <p className="mt-1 text-xs text-white/30">
                          detection
                          {count === 1 ? "" : "s"}
                        </p>
                      </div>
                    )
                  )}
                </div>
              )}
            </div>

            {/* Crop analysis */}
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
              <div className="mb-5">
                <h2 className="text-lg font-medium">
                  Crop Analysis
                </h2>

                <p className="mt-1 text-sm text-white/40">
                  Each detected crop and the diseases found
                  inside it.
                </p>
              </div>

              {result.crops.length === 0 ? (
                <div className="rounded-xl border border-white/10 bg-white/[0.02] p-6 text-center">
                  <AlertCircle className="mx-auto mb-3 h-8 w-8 text-white/20" />

                  <p className="text-sm text-white/50">
                    No crops detected
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {result.crops.map(
                    (crop: CropDetection, index) => (
                      <div
                        key={crop.crop_id}
                        className="rounded-xl border border-white/10 bg-white/[0.02] p-5"
                      >
                        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-400/10">
                              <Sprout className="h-5 w-5 text-emerald-400" />
                            </div>

                            <div>
                              <p className="text-sm font-medium">
                                Crop {index + 1}
                              </p>

                              <p className="mt-1 text-xs capitalize text-white/40">
                                {crop.crop}
                              </p>
                            </div>
                          </div>

                          <div className="text-left md:text-right">
                            <p className="text-sm font-semibold">
                              {(crop.confidence * 100).toFixed(0)}%
                            </p>

                            <p className="text-xs text-white/30">
                              crop confidence
                            </p>
                          </div>
                        </div>

                        <div className="mt-4">
                          <div className="mb-1 flex justify-between text-xs">
                            <span className="text-white/30">
                              Crop detection confidence
                            </span>

                            <span className="text-white/50">
                              {(crop.confidence * 100).toFixed(0)}%
                            </span>
                          </div>

                          <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
                            <div
                              className="h-full rounded-full bg-emerald-400"
                              style={{
                                width: `${Math.min(
                                  crop.confidence * 100,
                                  100
                                )}%`,
                              }}
                            />
                          </div>
                        </div>

                        {crop.diseases.length > 0 && (
                          <div className="mt-5 border-t border-white/10 pt-4">
                            <p className="mb-3 text-xs font-medium text-white/50">
                              Diseases detected
                            </p>

                            <div className="space-y-2">
                              {crop.diseases.map(
                                (disease, diseaseIndex) => (
                                  <div
                                    key={`${disease.disease}-${diseaseIndex}`}
                                    className="flex items-center justify-between rounded-lg border border-red-400/10 bg-red-400/[0.04] px-3 py-2"
                                  >
                                    <div>
                                      <p className="text-sm capitalize text-white/70">
                                        {disease.disease.replaceAll(
                                          "_",
                                          " "
                                        )}
                                      </p>

                                      {disease.affected_area_percent !==
                                        undefined && (
                                        <p className="mt-1 text-xs text-white/30">
                                          Affected area:{" "}
                                          {disease.affected_area_percent.toFixed(
                                            2
                                          )}
                                          %
                                        </p>
                                      )}
                                    </div>

                                    <p className="text-xs font-medium text-red-300">
                                      {(
                                        disease.confidence * 100
                                      ).toFixed(0)}
                                      %
                                    </p>
                                  </div>
                                )
                              )}
                            </div>
                          </div>
                        )}

                        {crop.diseases.length === 0 && (
                          <div className="mt-5 border-t border-white/10 pt-4">
                            <p className="text-xs text-white/30">
                              No disease detections returned for
                              this crop.
                            </p>
                          </div>
                        )}
                      </div>
                    )
                  )}
                </div>
              )}
            </div>

            {/* Current limitations */}
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
              <div className="flex items-start gap-3">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-white/40" />

                <div>
                  <p className="text-sm font-medium text-white/60">
                    Field data
                  </p>

                  <p className="mt-1 text-sm leading-6 text-white/40">
                    This page currently analyzes a single
                    field image using the existing AI API.
                    GPS, field boundaries, multi-image census,
                    and historical field records will be added
                    when those backend capabilities are
                    available.
                  </p>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </DashboardShell>
  );
}