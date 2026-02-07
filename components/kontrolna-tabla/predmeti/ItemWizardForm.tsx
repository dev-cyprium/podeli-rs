"use client";

import { useState, useEffect } from "react";
import { type DateRange } from "react-day-picker";
import { format, parseISO, addWeeks, addMonths, addYears } from "date-fns";
import { Trash2 } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useMutation, useQuery } from "convex/react";
import { Doc, Id } from "@/convex/_generated/dataModel";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PreferredContactForm } from "./PreferredContactForm";
import { CategoryCombobox } from "./CategoryCombobox";

type AvailabilitySlot = {
  startDate: string;
  endDate: string;
};

type DeliveryMethod = "licno";

type PlanLimits = {
  planName: string;
  planSlug: string;
  maxListings: number;
  allowedDeliveryMethods: string[];
  hasBadge: boolean;
  badgeLabel?: string;
  listingCount: number;
  planExpiresAt?: number;
  listingDurationDays?: number;
  isSubscription: boolean;
};

const ALL_DELIVERY_OPTIONS: { value: string; label: string; comingSoon?: boolean }[] = [
  { value: "licno", label: "Lično preuzimanje" },
  { value: "kurir", label: "Partnerska kurirska služba", comingSoon: true },
];

export type ItemFormData = {
  title: string;
  description: string;
  category: string;
  pricePerDay: number;
  deposit?: number;
  images: Id<"_storage">[];
  availabilitySlots: AvailabilitySlot[];
  deliveryMethods: DeliveryMethod[];
};

const CONTACT_LABELS: Record<string, string> = {
  chat: "Chat",
  email: "Email",
  phone: "Telefon",
};

interface ItemWizardFormProps {
  item: Doc<"items"> | null;
  onSave: (data: ItemFormData) => Promise<void>;
  onCancel?: () => void;
  planLimits?: PlanLimits;
  preferredContactTypes?: string[];
}

export function ItemWizardForm({
  item,
  onSave,
  onCancel,
  planLimits: _planLimits,
  preferredContactTypes = [],
}: ItemWizardFormProps) {
  const generateUploadUrl = useMutation(api.items.generateUploadUrl);
  const categories = useQuery(api.categories.listNames) ?? [];
  const [title, setTitle] = useState(item?.title ?? "");
  const [description, setDescription] = useState(item?.description ?? "");
  const [category, setCategory] = useState(
    item?.category ?? categories[0] ?? "",
  );
  const [pricePerDay, setPricePerDay] = useState(
    item?.pricePerDay?.toString() ?? "",
  );
  const [deposit, setDeposit] = useState(
    item?.deposit?.toString() ?? "",
  );
  const [images, setImages] = useState<Id<"_storage">[]>(
    item?.images && item.images.length > 0 ? [item.images[0]] : [],
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
  const [contactModalOpen, setContactModalOpen] = useState(false);
  const [invalidSteps, setInvalidSteps] = useState<Set<number>>(new Set());
  const [visitedSteps, setVisitedSteps] = useState<Set<number>>(new Set()); // Don't mark any step as visited initially

  // Set category to first available when categories load and no category is set
  useEffect(() => {
    if (!category && categories.length > 0 && !item?.category) {
      setCategory(categories[0]);
    }
  }, [categories, category, item?.category]);

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
      title: "Fotografija",
      description: "Dodajte fotografiju predmeta.",
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

  function removeImage() {
    setImages([]);
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

  function addPresetSlot(duration: "week" | "month" | "year") {
    const today = new Date();
    let endDate: Date;
    if (duration === "week") {
      endDate = addWeeks(today, 1);
    } else if (duration === "month") {
      endDate = addMonths(today, 1);
    } else {
      endDate = addYears(today, 1);
    }
    setAvailabilitySlots((prev) => [
      ...prev,
      {
        startDate: format(today, "yyyy-MM-dd"),
        endDate: format(endDate, "yyyy-MM-dd"),
      },
    ]);
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
    // Only take the first file
    const file = files[0];
    
    // Delete the old image if it exists
    if (images.length > 0) {
      // Note: We don't delete from storage here as it will be handled by the update mutation
      // when the form is submitted
    }
    
    try {
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
      // Replace the image instead of appending
      setImages([storageId as Id<"_storage">]);
    } catch (error) {
      setFormError("Greška pri učitavanju slike. Pokušajte ponovo.");
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
        return "Dodajte fotografiju predmeta.";
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
    if (stepIndex === 3) {
      if (deliveryMethods.length === 0) {
        return "Odaberite bar jedan način dostave.";
      }
    }
    return null;
  }

  function validateAllSteps() {
    const newInvalidSteps = new Set<number>();
    for (let i = 0; i < steps.length; i++) {
      // Only validate steps that have been visited
      if (visitedSteps.has(i)) {
        const error = validateStep(i);
        if (error) {
          newInvalidSteps.add(i);
        }
      }
    }
    setInvalidSteps(newInvalidSteps);
    return newInvalidSteps.size === 0;
  }

  function isStepValid(stepIndex: number): boolean {
    return validateStep(stepIndex) === null;
  }

  // Re-validate visited steps when form data changes
  useEffect(() => {
    if (visitedSteps.size > 0) {
      const newInvalidSteps = new Set<number>();
      for (let i = 0; i < steps.length; i++) {
        // Only validate steps that have been visited
        if (visitedSteps.has(i)) {
          const error = validateStep(i);
          if (error) {
            newInvalidSteps.add(i);
          }
        }
      }
      setInvalidSteps(newInvalidSteps);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title, description, category, pricePerDay, images.length, availabilitySlots.length, deliveryMethods.length, visitedSteps.size]);

  function handleNext() {
    // Mark current step as visited when trying to proceed
    const newVisitedSteps = new Set(visitedSteps);
    newVisitedSteps.add(currentStep);
    setVisitedSteps(newVisitedSteps);

    const errorMessage = validateStep(currentStep);
    if (errorMessage) {
      setFormError(errorMessage);
      const newInvalidSteps = new Set(invalidSteps);
      newInvalidSteps.add(currentStep);
      setInvalidSteps(newInvalidSteps);
      return;
    }
    setFormError(null);
    const newInvalidSteps = new Set(invalidSteps);
    newInvalidSteps.delete(currentStep);
    setInvalidSteps(newInvalidSteps);
    const nextStep = Math.min(currentStep + 1, steps.length - 1);
    setCurrentStep(nextStep);
    // Don't mark next step as visited until user interacts with it
    // Re-validate all steps
    validateAllSteps();
  }

  function handleBack() {
    setFormError(null);
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  }

  function goToStep(stepIndex: number) {
    if (stepIndex >= 0 && stepIndex < steps.length) {
      // Only mark current step as visited if we're trying to move forward
      if (stepIndex > currentStep) {
        const newVisitedSteps = new Set(visitedSteps);
        newVisitedSteps.add(currentStep);
        setVisitedSteps(newVisitedSteps);

        // Validate all previous steps before allowing navigation
        // Moving forward - validate current step first
        const currentError = validateStep(currentStep);
        if (currentError) {
          setFormError(currentError);
          const newInvalidSteps = new Set(invalidSteps);
          newInvalidSteps.add(currentStep);
          setInvalidSteps(newInvalidSteps);
          return;
        }
        // Validate all steps up to the target
        for (let i = 0; i < stepIndex; i++) {
          const error = validateStep(i);
          if (error) {
            setFormError(`Molimo popunite korak ${i + 1} pre nego što nastavite.`);
            const newInvalidSteps = new Set(invalidSteps);
            newInvalidSteps.add(i);
            setInvalidSteps(newInvalidSteps);
            return;
          }
        }
      }
      setFormError(null);
      setCurrentStep(stepIndex);
      // Don't mark target step as visited until user interacts with it
      // Re-validate all steps to update invalid indicators
      validateAllSteps();
    }
  }

  async function handleSubmit() {
    if (currentStep < steps.length - 1) {
      handleNext();
      return;
    }

    // Mark all steps as visited when trying to submit
    const newVisitedSteps = new Set(visitedSteps);
    for (let i = 0; i < steps.length; i++) {
      newVisitedSteps.add(i);
    }
    setVisitedSteps(newVisitedSteps);

    // Validate all steps before submission
    const allValid = validateAllSteps();
    if (!allValid) {
      setFormError("Molimo popunite sve obavezne polja pre nego što sačuvate predmet.");
      // Navigate to first invalid step
      for (let i = 0; i < steps.length; i++) {
        if (invalidSteps.has(i)) {
          setCurrentStep(i);
          break;
        }
      }
      return;
    }

    setFormError(null);
    const numericPrice = Number(pricePerDay);
    const numericDeposit = deposit.trim() ? Number(deposit) : undefined;
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
        deposit: numericDeposit !== undefined && numericDeposit >= 0 ? numericDeposit : undefined,
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

  async function handleSaveFromAnyStep() {
    // Mark all steps as visited
    const allVisited = new Set<number>();
    for (let i = 0; i < steps.length; i++) {
      allVisited.add(i);
    }
    setVisitedSteps(allVisited);

    // Validate all steps
    const newInvalidSteps = new Set<number>();
    for (let i = 0; i < steps.length; i++) {
      const error = validateStep(i);
      if (error) {
        newInvalidSteps.add(i);
      }
    }
    setInvalidSteps(newInvalidSteps);

    if (newInvalidSteps.size > 0) {
      // Navigate to first invalid step
      for (let i = 0; i < steps.length; i++) {
        if (newInvalidSteps.has(i)) {
          setCurrentStep(i);
          setFormError(validateStep(i));
          break;
        }
      }
      return;
    }

    setFormError(null);
    const numericPrice = Number(pricePerDay);
    const numericDeposit = deposit.trim() ? Number(deposit) : undefined;
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
        deposit: numericDeposit !== undefined && numericDeposit >= 0 ? numericDeposit : undefined,
        images,
        availabilitySlots: cleanedSlots,
        deliveryMethods,
      });
      setFormError(null);
    } catch {
      setFormError("Sačuvavanje nije uspelo. Pokušajte ponovo.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-podeli-dark">
              {steps[currentStep].title}
            </p>
            <p className="text-xs text-muted-foreground">
              {steps[currentStep].description}
            </p>
          </div>
          <div className="text-xs font-semibold text-muted-foreground">
            Korak {currentStep + 1} / {steps.length}
          </div>
        </div>
        <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-muted">
          <motion.div
            className="h-full rounded-full bg-podeli-accent"
            initial={{ width: "0%" }}
            animate={{
              width: `${((currentStep + 1) / steps.length) * 100}%`,
            }}
            transition={{ type: "spring", bounce: 0.35, duration: 0.5 }}
          />
        </div>
        <div className="mt-4 grid gap-2 sm:grid-cols-4">
          {steps.map((step, index) => {
            const isInvalid = invalidSteps.has(index) && visitedSteps.has(index);
            return (
              <motion.div
                key={step.id}
                layout
                onClick={() => goToStep(index)}
                className={`relative cursor-pointer rounded-lg border px-3 py-2 text-xs font-semibold transition-colors ${
                  index === currentStep
                    ? "border-podeli-accent/30 bg-podeli-accent/10 text-podeli-accent"
                    : isInvalid
                      ? "border-podeli-red/30 bg-podeli-red/10 text-podeli-red"
                      : "border-border bg-muted text-muted-foreground hover:border-podeli-accent/30 hover:bg-podeli-accent/5"
                }`}
              >
                {index + 1}. {step.title}
                {isInvalid && (
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-podeli-red opacity-75"></span>
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-podeli-red"></span>
                  </span>
                )}
              </motion.div>
            );
          })}
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
                <Label>Kategorija</Label>
                <CategoryCombobox
                  value={category}
                  onChange={setCategory}
                />
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

              <div className="space-y-2">
                <Label htmlFor="item-deposit">Sigurnosni depozit (opciono)</Label>
                <Input
                  id="item-deposit"
                  type="number"
                  min="0"
                  value={deposit}
                  onChange={(event) => setDeposit(event.target.value)}
                  placeholder="npr. 5000"
                />
                <p className="text-xs text-muted-foreground">
                  Iznos u RSD koji se vraća nakon vraćanja predmeta
                </p>
              </div>
            </div>
          ) : null}

          {currentStep === 1 ? (
            <div className="space-y-4">
              <div>
                <Label>Fotografija</Label>
              </div>
              {isProcessingImages ? (
                <div className="flex items-center justify-center rounded-lg border border-border bg-muted p-12">
                  <p className="text-sm text-muted-foreground">Učitavanje fotografije...</p>
                </div>
              ) : null}
              {!isProcessingImages && images.length === 0 ? (
                <label className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-border bg-muted p-12 text-center transition-colors hover:border-podeli-accent hover:bg-podeli-accent/5 cursor-pointer">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(event) =>
                      handleImageUpload(event.target.files)
                    }
                    className="hidden"
                  />
                  <div className="mb-3 text-muted-foreground">
                    <svg
                      className="mx-auto h-12 w-12"
                      stroke="currentColor"
                      fill="none"
                      viewBox="0 0 48 48"
                      aria-hidden="true"
                    >
                      <path
                        d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                        strokeWidth={2}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                  <p className="text-sm font-medium text-podeli-dark">
                    Kliknite da dodate fotografiju
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    PNG, JPG ili GIF do 10MB
                  </p>
                </label>
              ) : null}
              {!isProcessingImages && images.length > 0 ? (
                <div className="relative group">
                  <div className="relative overflow-hidden rounded-lg border-2 border-border bg-muted">
                    {imageUrlsMap?.[images[0]] ? (
                      <img
                        src={imageUrlsMap[images[0]] ?? undefined}
                        alt="Fotografija predmeta"
                        className="h-[400px] w-full object-contain"
                      />
                    ) : (
                      <div className="flex h-[400px] w-full items-center justify-center bg-muted text-sm text-muted-foreground">
                        Učitavanje...
                      </div>
                    )}
                  </div>
                  <div className="mt-3 flex items-center justify-center gap-3">
                    <label className="inline-flex items-center gap-2 rounded-md border border-border bg-card px-4 py-2 text-sm font-semibold text-podeli-dark hover:bg-muted transition-colors cursor-pointer">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(event) =>
                          handleImageUpload(event.target.files)
                        }
                        className="hidden"
                      />
                      Zameni fotografiju
                    </label>
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={removeImage}
                      className="inline-flex items-center gap-2 rounded-md border border-podeli-red/30 bg-card px-4 py-2 text-sm font-semibold text-podeli-red hover:bg-podeli-red/10"
                    >
                      <Trash2 className="h-4 w-4" />
                      Ukloni
                    </Button>
                  </div>
                </div>
              ) : null}
            </div>
          ) : null}

          {currentStep === 2 ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Dostupnost</Label>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => addPresetSlot("week")}
                  >
                    1 nedelja
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => addPresetSlot("month")}
                  >
                    1 mesec
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => addPresetSlot("year")}
                  >
                    1 godina
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addSlot}
                  >
                    Dodaj termin
                  </Button>
                </div>
              </div>
              <div className="space-y-3">
                {availabilitySlots.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
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
            <div className="space-y-4">
              {preferredContactTypes.length > 0 ? (
                <div className="rounded-lg border border-podeli-blue/20 bg-podeli-blue/5 px-4 py-3">
                  <p className="text-sm font-medium text-podeli-dark">
                    Kako će vas zainteresovani korisnici kontaktirati:
                  </p>
                  <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-muted-foreground">
                    {preferredContactTypes.map((t) => (
                      <li key={t}>
                        {CONTACT_LABELS[t] ?? t}
                      </li>
                    ))}
                  </ul>
                  <button
                    type="button"
                    onClick={() => setContactModalOpen(true)}
                    className="mt-2 inline-block text-sm font-medium text-podeli-blue hover:text-podeli-blue/90 hover:underline"
                  >
                    Izmeni način kontakta
                  </button>
                </div>
              ) : null}
              <div className="space-y-2">
                <Label>Način dostave</Label>
                <div className="grid gap-2">
                {ALL_DELIVERY_OPTIONS.map((option) => {
                  // "comingSoon" options are always locked regardless of plan
                  const isLocked = option.comingSoon === true;

                  return (
                    <label
                      key={option.value}
                      className={`flex items-center gap-2 rounded-lg border px-2 py-1 text-sm ${
                        isLocked
                          ? "border-border bg-muted opacity-60 cursor-not-allowed"
                          : "border-border text-podeli-dark cursor-pointer hover:bg-muted"
                      }`}
                    >
                      <Checkbox
                        checked={!isLocked && deliveryMethods.includes(option.value as DeliveryMethod)}
                        onChange={() => !isLocked && toggleDelivery(option.value as DeliveryMethod)}
                        disabled={isLocked}
                      />
                      <span className="flex items-center gap-2">
                        <span className={isLocked ? "text-muted-foreground" : ""}>
                          {option.label}
                        </span>
                        {isLocked && (
                          <span className="rounded-full bg-[#f0a202]/10 px-1.5 py-0.5 text-[10px] font-medium text-[#f0a202]">
                            Uskoro
                          </span>
                        )}
                      </span>
                    </label>
                  );
                })}
                </div>
              </div>
            </div>
          ) : null}
        </motion.div>
      </AnimatePresence>

      {formError ? (
        <div className="rounded-lg border border-podeli-red/30 bg-podeli-red/10 px-3 py-2 text-sm text-podeli-red">
          {formError}
        </div>
      ) : null}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {currentStep > 0 ? (
            <Button type="button" variant="outline" onClick={handleBack}>
              Nazad
            </Button>
          ) : null}
          {currentStep < steps.length - 1 ? (
            <Button
              type="button"
              className="bg-podeli-accent text-white hover:bg-podeli-accent/90"
              onClick={handleNext}
            >
              Napred
            </Button>
          ) : null}
        </div>
        <div>
          {item ? (
            <Button
              type="button"
              className="bg-podeli-accent text-white hover:bg-podeli-accent/90"
              disabled={isSubmitting}
              onClick={handleSaveFromAnyStep}
            >
              Sačuvaj izmene
            </Button>
          ) : currentStep === steps.length - 1 ? (
            <Button
              type="button"
              className="bg-podeli-accent text-white hover:bg-podeli-accent/90"
              disabled={isSubmitting || invalidSteps.size > 0}
              onClick={handleSubmit}
            >
              Sačuvaj predmet
            </Button>
          ) : null}
        </div>
      </div>

      <Dialog open={contactModalOpen} onOpenChange={setContactModalOpen}>
        <DialogContent
          accessibleTitle="Izmeni način kontakta"
          accessibleDescription="Odaberite kako želite da vas zainteresovani korisnici kontaktiraju."
        >
          <DialogHeader>
            <DialogTitle>Izmeni način kontakta</DialogTitle>
          </DialogHeader>
          <PreferredContactForm
            preferredContactTypes={preferredContactTypes}
            compact
            embedded
            initialExpanded
            onSave={() => setContactModalOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
