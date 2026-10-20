
"use client";

import { useEffect, useState } from "react";

import DashboardShell from "@/components/dashboard/DashboardShell";
import PageHeader from "@/components/dashboard/PageHeader";

import {
  getFarms,
  createFarm,
  updateFarm,
  deleteFarm,
  createField,
  updateField,
  deleteField,
} from "@/lib/api";

import type { Farm, FarmField } from "@/lib/api";


export default function FieldsPage() {

    // Farm and field management
  const [farms, setFarms] = useState<Farm[]>([]);
  const [selectedFarmId, setSelectedFarmId] =
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

  return (
    <DashboardShell>
      <div className="space-y-6 p-5 md:p-8">
        {/* Header */}
        <PageHeader
          title="Fields"
          description="Create and manage farms, field details, crop types, and field areas."
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
                      Manage the fields registered under this farm.
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
                          className={`rounded-xl border p-4 `}
                        >
                          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                            <label className="flex cursor-pointer items-start gap-3">
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
      </div>
    </DashboardShell>
  );
}