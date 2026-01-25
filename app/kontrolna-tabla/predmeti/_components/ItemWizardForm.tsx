"use client";

import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useMutation, useQuery } from "convex/react";
import { Doc, Id } from "@/convex/_generated/dataModel";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type AvailabilitySlot = {
  startDate: string;
  endDate: string;
};

type DeliveryMethod = "licno" | "glovo" | "wolt" | "cargo";

const CATEGORY_OPTIONS = [
  "Alat",
  "Elektronika",
  "Sport",
  "Kuća",
  "Auto",
  "Ostalo",
];

const DELIVERY_OPTIONS: { value: DeliveryMethod; label: string }[] = [
  { value: "licno", label: "Lično preuzimanje" },
  { value: "glovo", label: "Glovo" },
  { value: "wolt", label: "Wolt" },
  { value: "cargo", label: "Cargo" },
];

export type ItemFormData = {
  title: string;
  description: string;
  category: string;
  pricePerDay: number;
  images: Id<"_storage">[];
  availabilitySlots: AvailabilitySlot[];
  deliveryMethods: DeliveryMethod[];
};

interface ItemWizardFormProps {
  item: Doc<"items"> | null;
  onSave: (data: ItemFormData) => Promise<void>;
  onCancel?: () => void;
}

import { type DateRange } from "react-day-picker";
import { format, parseISO } from "date-fns";
import { Trash2 } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent } from "@/components/ui/card";

export function ItemWizardForm({
  item,
  onSave,
  onCancel,
}: ItemWizardFormProps) {
  const generateUploadUrl = useMutation(api.items.generateUploadUrl);
  const [title, setTitle] = useState(item?.title ?? "");
  const [description, setDescription] = useState(item?.description ?? "");
  const [category, setCategory] = useState(
    item?.category ?? CATEGORY_OPTIONS[0],
  );
  const [pricePerDay, setPricePerDay] = useState(
    item?.pricePerDay?.toString() ?? "",
  );
  const [images, setImages] = useState<Id<"_storage">[]>(
    item?.images && item.images.length > 0 ? item.images : [],
  );
  const [availabilitySlots, setAvailabilitySlots] = useState<
    AvailabilitySlot[]
  >(item?.availabilitySlots ?? []);
  const [deliveryMethods, setDeliveryMethods] = useState<DeliveryMethod[]>(
    (item?.deliveryMethods as DeliveryMethod[]) ?? [],
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isProcessingImages, setIsProcessingImages] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(0);

  // Get URLs for all images
  const imageUrlsMap = useQuery(
    api.items.getImageUrls,
    images.length > 0 ? { storageIds: images } : "skip"
  );

  const steps = [
    {
      id: "basic",
      title: "Osnovno",
      description: "Naziv, kategorija i cena.",
    },
    {
      id: "images",
      title: "Fotografije",
      description: "Dodajte nekoliko slika.",
    },
    {
      id: "availability",
      title: "Dostupnost",
      description: "Unesite termine kada je predmet dostupan.",
    },
    {
      id: "delivery",
      title: "Dostava",
      description: "Odaberite opcije preuzimanja.",
    },
  ];

  function removeImage(index: number) {
    setImages((prev) => prev.filter((_, idx) => idx !== index));
  }

  function addSlot() {
    setAvailabilitySlots((prev) => [...prev, { startDate: "", endDate: "" }]);
  }

  function updateSlotRange(index: number, range: DateRange | undefined) {
    setAvailabilitySlots((prev) =>
      prev.map((slot, idx) => {
        if (idx !== index) return slot;
        return {
          startDate: range?.from ? format(range.from, "yyyy-MM-dd") : "",
          endDate: range?.to ? format(range.to, "yyyy-MM-dd") : "",
        };
      }),
    );
  }

  function removeSlot(index: number) {
    setAvailabilitySlots((prev) => prev.filter((_, idx) => idx !== index));
  }

  function toggleDelivery(method: DeliveryMethod) {
    setDeliveryMethods((prev) =>
      prev.includes(method)
        ? prev.filter((itemValue) => itemValue !== method)
        : [...prev, method],
    );
  }

  async function handleImageUpload(files: FileList | null) {
    if (!files || files.length === 0) return;
    setIsProcessingImages(true);
    const fileArray = Array.from(files);
    try {
      const uploadPromises = fileArray.map(async (file) => {
        // Generate upload URL
        const uploadUrl = await generateUploadUrl();
        // Upload file to Convex
        const result = await fetch(uploadUrl, {
          method: "POST",
          headers: { "Content-Type": file.type },
          body: file,
        });
        if (!result.ok) {
          throw new Error("Neuspešno učitavanje fajla");
        }
        const { storageId } = await result.json();
        return storageId as Id<"_storage">;
      });
      const storageIds = await Promise.all(uploadPromises);
      setImages((prev) => [...prev, ...storageIds]);
    } catch (error) {
      setFormError("Greška pri učitavanju slika. Pokušajte ponovo.");
    } finally {
      setIsProcessingImages(false);
    }
  }

  function validateStep(stepIndex: number) {
    if (stepIndex === 0) {
      const numericPrice = Number(pricePerDay);
      if (!title.trim()) {
        return "Unesite naziv predmeta.";
      }
      if (!description.trim()) {
        return "Unesite opis predmeta.";
      }
      if (Number.isNaN(numericPrice) || numericPrice <= 0) {
        return "Cena po danu mora biti veća od nule.";
      }
    }
    if (stepIndex === 1) {
      if (images.length === 0) {
        return "Dodajte bar jednu fotografiju.";
      }
    }
    if (stepIndex === 2) {
      const cleanedSlots = availabilitySlots.filter(
        (slot) => slot.startDate && slot.endDate,
      );
      if (cleanedSlots.length === 0) {
        return "Dodajte bar jedan termin dostupnosti.";
      }
    }
    return null;
  }

  function handleNext() {
    const errorMessage = validateStep(currentStep);
    if (errorMessage) {
      setFormError(errorMessage);
      return;
    }
    setFormError(null);
    setCurrentStep((prev) => Math.min(prev + 1, steps.length - 1));
  }

  function handleBack() {
    setFormError(null);
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  }

  function goToStep(stepIndex: number) {
    if (stepIndex >= 0 && stepIndex < steps.length) {
      setFormError(null);
      setCurrentStep(stepIndex);
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (currentStep < steps.length - 1) {
      handleNext();
      return;
    }

    setFormError(null);
    const numericPrice = Number(pricePerDay);
    const cleanedSlots = availabilitySlots.filter(
      (slot) => slot.startDate && slot.endDate,
    );

    setIsSubmitting(true);
    try {
      await onSave({
        title: title.trim(),
        description: description.trim(),
        category,
        pricePerDay: numericPrice,
        images,
        availabilitySlots: cleanedSlots,
        deliveryMethods,
      });
      setFormError(null);
    } catch (submitError) {
      setFormError("Sačuvavanje nije uspelo. Pokušajte ponovo.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-slate-900">
              {steps[currentStep].title}
            </p>
            <p className="text-xs text-slate-500">
              {steps[currentStep].description}
            </p>
          </div>
          <div className="text-xs font-semibold text-slate-500">
            Korak {currentStep + 1} / {steps.length}
          </div>
        </div>
        <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-100">
          <motion.div
            className="h-full rounded-full bg-amber-500"
            initial={{ width: "0%" }}
            animate={{
              width: `${((currentStep + 1) / steps.length) * 100}%`,
            }}
            transition={{ type: "spring", bounce: 0.35, duration: 0.5 }}
          />
        </div>
        <div className="mt-4 grid gap-2 sm:grid-cols-4">
          {steps.map((step, index) => (
            <motion.div
              key={step.id}
              layout
              onClick={() => goToStep(index)}
              className={`cursor-pointer rounded-lg border px-3 py-2 text-xs font-semibold transition-colors ${
                index === currentStep
                  ? "border-amber-200 bg-amber-50 text-amber-700"
                  : "border-slate-200 bg-slate-50 text-slate-500 hover:border-slate-300 hover:bg-slate-100"
              }`}
            >
              {index + 1}. {step.title}
            </motion.div>
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -16 }}
          transition={{ type: "spring", bounce: 0.35, duration: 0.4 }}
          className="space-y-4"
        >
          {currentStep === 0 ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="item-title">Naziv predmeta</Label>
                <Input
                  id="item-title"
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  placeholder="Npr. Bušilica, bicikl..."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="item-category">Kategorija</Label>
                <select
                  id="item-category"
                  className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2"
                  value={category}
                  onChange={(event) => setCategory(event.target.value)}
                >
                  {CATEGORY_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="item-description">Opis</Label>
                <Textarea
                  id="item-description"
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  placeholder="Opišite stanje, pravila korišćenja i šta je uključeno."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="item-price">Cena po danu (RSD)</Label>
                <Input
                  id="item-price"
                  type="number"
                  min="0"
                  value={pricePerDay}
                  onChange={(event) => setPricePerDay(event.target.value)}
                  placeholder="1500"
                />
              </div>
            </div>
          ) : null}

          {currentStep === 1 ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Fotografije</Label>
                <div className="flex items-center gap-2">
                  <label className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50">
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={(event) =>
                        handleImageUpload(event.target.files)
                      }
                      className="hidden"
                    />
                    Dodaj slike
                  </label>
                </div>
              </div>
              {isProcessingImages ? (
                <p className="text-sm text-slate-500">Učitavanje slika...</p>
              ) : null}
              {images.length === 0 ? (
                <div className="rounded-lg border border-dashed border-slate-200 p-6 text-center text-sm text-slate-500">
                  Dodajte fotografije predmeta.
                </div>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  {images.map((imageId, index) => {
                    const imageUrl = imageUrlsMap?.[imageId] ?? null;
                    return (
                      <div
                        key={`image-${imageId}`}
                        className="group relative overflow-hidden rounded-lg border border-slate-200"
                      >
                        {imageUrl ? (
                          <img
                            src={imageUrl}
                            alt={`Slika ${index + 1}`}
                            className="h-40 w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-40 w-full items-center justify-center bg-slate-100 text-sm text-slate-500">
                            Učitavanje...
                          </div>
                        )}
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="absolute right-2 top-2 rounded-full bg-white/90 px-2 py-1 text-xs font-semibold text-slate-700 opacity-0 shadow-sm transition-opacity group-hover:opacity-100"
                        >
                          Ukloni
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : null}

          {currentStep === 2 ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Dostupnost</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addSlot}
                >
                  Dodaj termin
                </Button>
              </div>
              <div className="space-y-3">
                {availabilitySlots.length === 0 ? (
                  <p className="text-sm text-slate-500">
                    Još uvek nema definisanih termina.
                  </p>
                ) : (
                  availabilitySlots.map((slot, index) => (
                    <div key={`slot-${index}`} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label>Period dostupnosti</Label>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeSlot(index)}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Ukloni termin
                        </Button>
                      </div>
                      <Card className="w-fit">
                        <CardContent className="p-0">
                          <Calendar
                            mode="range"
                            defaultMonth={
                              slot.startDate
                                ? parseISO(slot.startDate)
                                : new Date()
                            }
                            selected={{
                              from: slot.startDate
                                ? parseISO(slot.startDate)
                                : undefined,
                              to: slot.endDate
                                ? parseISO(slot.endDate)
                                : undefined,
                            }}
                            onSelect={(range) => updateSlotRange(index, range)}
                            numberOfMonths={2}
                            className="rounded-lg"
                          />
                        </CardContent>
                      </Card>
                    </div>
                  ))
                )}
              </div>
            </div>
          ) : null}

          {currentStep === 3 ? (
            <div className="space-y-3">
              <Label>Način dostave</Label>
              <div className="grid gap-2">
                {DELIVERY_OPTIONS.map((option) => (
                  <label
                    key={option.value}
                    className="flex items-center gap-3 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700"
                  >
                    <Checkbox
                      checked={deliveryMethods.includes(option.value)}
                      onChange={() => toggleDelivery(option.value)}
                    />
                    {option.label}
                  </label>
                ))}
              </div>
            </div>
          ) : null}
        </motion.div>
      </AnimatePresence>

      {formError ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {formError}
        </div>
      ) : null}

      <div className="flex flex-wrap items-center gap-3">
        {currentStep > 0 ? (
          <Button type="button" variant="outline" onClick={handleBack}>
            Nazad
          </Button>
        ) : null}
        {currentStep < steps.length - 1 ? (
          <Button
            type="button"
            className="bg-amber-500 text-white hover:bg-amber-600"
            onClick={handleNext}
          >
            Nastavi
          </Button>
        ) : (
          <Button
            type="submit"
            className="bg-amber-500 text-white hover:bg-amber-600"
            disabled={isSubmitting}
          >
            {item ? "Sačuvaj izmene" : "Sačuvaj predmet"}
          </Button>
        )}
        {item && onCancel && currentStep < steps.length - 1 ? (
          <Button
            type="submit"
            className="bg-amber-500 text-white hover:bg-amber-600"
            disabled={isSubmitting}
          >
            Sačuvaj izmene
          </Button>
        ) : null}
      </div>
    </form>
  );
}
