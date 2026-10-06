"use client";

import { useRef, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  ImagePlus,
  Star,
  Trash2,
  Replace,
  LocateFixed,
} from "lucide-react";
import { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import {
  CENTER_FOCAL_POINT,
  getImageFocalPoint,
  ImageFocalPoint,
  ImageFocalPoints,
} from "@/lib/item-photos";

interface ItemPhotoEditorProps {
  images: Id<"_storage">[];
  urls?: Record<string, string | null>;
  points: ImageFocalPoints;
  busy: boolean;
  onUpload: (
    files: FileList | null,
    replaceId?: Id<"_storage">,
  ) => Promise<Id<"_storage"> | undefined>;
  onRemove: (id: Id<"_storage">) => void;
  onCover: (id: Id<"_storage">) => void;
  onFocus: (id: Id<"_storage">, point: ImageFocalPoint) => void;
}

export function ItemPhotoEditor({
  images,
  urls,
  points,
  busy,
  onUpload,
  onRemove,
  onCover,
  onFocus,
}: ItemPhotoEditorProps) {
  const [selected, setSelected] = useState(images[0]);
  const addInput = useRef<HTMLInputElement>(null);
  const replaceInput = useRef<HTMLInputElement>(null);
  const rail = useRef<HTMLDivElement>(null);
  const activeId = images.includes(selected) ? selected : images[0];
  const index = images.indexOf(activeId);
  const point = getImageFocalPoint(activeId, index, points);
  const activeUrl = urls?.[activeId];

  function select(id: Id<"_storage">) {
    setSelected(id);
    rail.current
      ?.querySelector<HTMLButtonElement>(`[data-image-id="${id}"]`)
      ?.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
        inline: "nearest",
      });
  }

  function position(event: React.PointerEvent<HTMLButtonElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    onFocus(activeId, {
      x: Math.round(
        Math.max(
          0,
          Math.min(100, ((event.clientX - rect.left) / rect.width) * 100),
        ),
      ),
      y: Math.round(
        Math.max(
          0,
          Math.min(100, ((event.clientY - rect.top) / rect.height) * 100),
        ),
      ),
    });
  }

  return (
    <section
      className="space-y-4"
      aria-label="Fotografije predmeta"
      aria-busy={busy}
    >
      <input
        ref={addInput}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(event) => {
          void onUpload(event.target.files).then((id) => {
            if (id) setSelected(id);
          });
          event.target.value = "";
        }}
      />
      <input
        ref={replaceInput}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(event) => {
          void onUpload(event.target.files, activeId).then((id) => {
            if (id) setSelected(id);
          });
          event.target.value = "";
        }}
      />
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="font-medium">
            Fotografije{" "}
            <span className="text-sm text-muted-foreground">
              ({images.length}/10)
            </span>
          </p>
          <p className="text-xs text-muted-foreground">
            Naslovna se prikazuje prva u oglasu.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={busy || images.length >= 10}
          onClick={() => addInput.current?.click()}
        >
          <ImagePlus className="h-4 w-4" /> Dodaj
        </Button>
      </div>
      {images.length === 0 ? (
        <Button
          type="button"
          disabled={busy}
          onClick={() => addInput.current?.click()}
          variant="ghost"
          className="flex h-auto w-full flex-col items-center gap-3 rounded-xl border-2 border-dashed border-border bg-muted/30 px-6 py-14 hover:border-podeli-accent"
        >
          <ImagePlus className="h-8 w-8 text-muted-foreground" />
          <span className="font-medium">Dodaj fotografije predmeta</span>
          <span className="text-xs text-muted-foreground">
            Do 10 fotografija, najviše 10 MB po fotografiji.
          </span>
        </Button>
      ) : (
        <>
          <div className="overflow-hidden rounded-xl border border-border">
            <div className="flex items-center justify-between border-b border-border px-3 py-2">
              <span className="text-sm font-medium">
                Fotografija {index + 1} / {images.length}
                {index === 0 && (
                  <span className="ml-2 rounded-full bg-podeli-accent/10 px-2 py-1 text-xs text-podeli-accent">
                    Naslovna
                  </span>
                )}
              </span>
              <div className="flex gap-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label="Prethodna fotografija"
                  disabled={busy || index <= 0}
                  onClick={() => select(images[index - 1])}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label="Sledeća fotografija"
                  disabled={busy || index >= images.length - 1}
                  onClick={() => select(images[index + 1])}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="flex h-[300px] items-center justify-center bg-muted/30 p-4 sm:h-[340px]">
              {activeUrl ? (
                <Button
                  type="button"
                  disabled={busy}
                  aria-label={`Postavi fokus fotografije ${index + 1}`}
                  aria-describedby="photo-focus-hint"
                  variant="ghost"
                  className="relative block h-auto max-h-full max-w-full p-0 hover:bg-transparent cursor-crosshair touch-none rounded-lg focus-visible:outline-2 focus-visible:outline-podeli-accent"
                  onPointerDown={(event) => {
                    event.currentTarget.setPointerCapture(event.pointerId);
                    position(event);
                  }}
                  onPointerMove={(event) => {
                    if (event.currentTarget.hasPointerCapture(event.pointerId))
                      position(event);
                  }}
                  onKeyDown={(event) => {
                    const directions: Record<string, ImageFocalPoint> = {
                      ArrowLeft: { x: -2, y: 0 },
                      ArrowRight: { x: 2, y: 0 },
                      ArrowUp: { x: 0, y: -2 },
                      ArrowDown: { x: 0, y: 2 },
                    };
                    const delta = directions[event.key];
                    if (!delta) return;
                    event.preventDefault();
                    onFocus(activeId, {
                      x: Math.max(0, Math.min(100, point.x + delta.x)),
                      y: Math.max(0, Math.min(100, point.y + delta.y)),
                    });
                  }}
                >
                  {/* The button hugs the actual image, so letterboxing cannot distort focus coordinates. */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={activeUrl}
                    alt={`Fotografija ${index + 1} za uređivanje`}
                    draggable={false}
                    className="block max-h-[268px] w-auto max-w-full rounded-lg sm:max-h-[308px]"
                  />
                  <span
                    aria-hidden="true"
                    className="pointer-events-none absolute h-6 w-6 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-podeli-accent/70 shadow-[0_0_0_2px_rgba(0,0,0,0.3)]"
                    style={{ left: `${point.x}%`, top: `${point.y}%` }}
                  />
                </Button>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Učitavanje fotografije…
                </p>
              )}
            </div>
            <div className="flex flex-wrap gap-2 border-t border-border p-3">
              <Button
                type="button"
                size="sm"
                variant={index === 0 ? "secondary" : "outline"}
                disabled={busy || index === 0}
                onClick={() => onCover(activeId)}
              >
                <Star className="h-4 w-4" />
                {index === 0 ? "Naslovna fotografija" : "Postavi kao naslovnu"}
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                disabled={busy}
                onClick={() => onFocus(activeId, CENTER_FOCAL_POINT)}
                aria-label="Vrati fokus na sredinu"
              >
                <LocateFixed className="h-4 w-4" />
                Centriraj
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                disabled={busy}
                onClick={() => replaceInput.current?.click()}
              >
                <Replace className="h-4 w-4" />
                Zameni
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                disabled={busy}
                onClick={() => onRemove(activeId)}
                className="text-podeli-red hover:text-podeli-red"
              >
                <Trash2 className="h-4 w-4" />
                Ukloni
              </Button>
            </div>
          </div>
          <p id="photo-focus-hint" className="text-xs text-muted-foreground">
            Klikni ili prevuci oznaku na najvažniji deo fotografije. Za precizno
            pomeranje koristi strelice na tastaturi.
          </p>
          <div
            ref={rail}
            className="flex snap-x gap-3 overflow-x-auto pb-2"
            aria-label="Izaberi fotografiju"
          >
            {images.map((id, i) => {
              const focus = getImageFocalPoint(id, i, points);
              return (
                <Button
                  key={id}
                  type="button"
                  variant="ghost"
                  data-image-id={id}
                  aria-label={`Uredi fotografiju ${i + 1}${i === 0 ? ", naslovna" : ""}`}
                  aria-pressed={id === activeId}
                  disabled={busy}
                  onClick={() => select(id)}
                  className={`relative h-24 w-24 shrink-0 snap-start overflow-hidden p-0 rounded-xl border-2 transition-colors ${id === activeId ? "border-podeli-accent ring-2 ring-podeli-accent/20" : "border-transparent hover:border-border"}`}
                >
                  {urls?.[id] && (
                    // Storage URLs are already resolved; native images preserve their intrinsic editor dimensions.
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={urls[id]!}
                      alt={`Pregled fotografije ${i + 1}`}
                      className="h-full w-full object-cover"
                      style={{ objectPosition: `${focus.x}% ${focus.y}%` }}
                    />
                  )}
                  <span className="absolute bottom-1 left-1 rounded-md bg-black/65 px-1.5 py-0.5 text-xs text-white">
                    {i === 0 ? "Naslovna" : i + 1}
                  </span>
                </Button>
              );
            })}
          </div>
        </>
      )}
      {busy && (
        <p role="status" className="text-sm text-muted-foreground">
          Učitavanje fotografija…
        </p>
      )}
    </section>
  );
}
