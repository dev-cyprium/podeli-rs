"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { Lock, Pencil, Trash2, Merge, Check, X } from "lucide-react";

type CategoryRow = {
  _id: Id<"categories">;
  name: string;
  itemCount: number;
  isSystem?: boolean;
  createdBy?: string;
  order?: number;
  status?: "active" | "pending";
};

export function CategoriesPanel() {
  const categories = useQuery(api.categories.listAllWithItemCounts);
  const createCategory = useMutation(api.categories.create);
  const updateCategory = useMutation(api.categories.update);
  const removeCategory = useMutation(api.categories.remove);
  const mergeCategories = useMutation(api.categories.merge);
  const approveCategory = useMutation(api.categories.approve);
  const rejectCategory = useMutation(api.categories.reject);

  // Create form
  const [newName, setNewName] = useState("");
  const [newOrder, setNewOrder] = useState("");
  const [creating, setCreating] = useState(false);

  // Edit dialog
  const [editingCat, setEditingCat] = useState<CategoryRow | null>(null);
  const [editName, setEditName] = useState("");
  const [editOrder, setEditOrder] = useState("");

  // Delete dialog
  const [deletingCat, setDeletingCat] = useState<CategoryRow | null>(null);

  // Merge dialog
  const [mergingCat, setMergingCat] = useState<CategoryRow | null>(null);
  const [mergeTargetId, setMergeTargetId] = useState<Id<"categories"> | "">("");

  const activeCategories = categories?.filter(
    (c) => c.status === undefined || c.status === "active",
  );
  const pendingCategories = categories?.filter(
    (c) => c.status === "pending",
  );

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim()) {
      toast.error("Unesite naziv kategorije.");
      return;
    }
    setCreating(true);
    try {
      const order = newOrder.trim() ? Number(newOrder) : undefined;
      await createCategory({ name: newName.trim(), order });
      toast.success(`Kategorija "${newName.trim()}" kreirana.`);
      setNewName("");
      setNewOrder("");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Greška pri kreiranju.";
      toast.error(msg);
    } finally {
      setCreating(false);
    }
  }

  function openEdit(cat: CategoryRow) {
    setEditingCat(cat);
    setEditName(cat.name);
    setEditOrder(cat.order?.toString() ?? "");
  }

  async function handleEdit() {
    if (!editingCat) return;
    try {
      await updateCategory({
        id: editingCat._id,
        name: editName.trim() || undefined,
        order: editOrder.trim() ? Number(editOrder) : undefined,
      });
      toast.success("Kategorija ažurirana.");
      setEditingCat(null);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Greška pri ažuriranju.";
      toast.error(msg);
    }
  }

  async function handleDelete() {
    if (!deletingCat) return;
    try {
      await removeCategory({ id: deletingCat._id });
      toast.success(`Kategorija "${deletingCat.name}" obrisana.`);
      setDeletingCat(null);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Greška pri brisanju.";
      toast.error(msg);
    }
  }

  async function handleMerge() {
    if (!mergingCat || !mergeTargetId) return;
    try {
      await mergeCategories({
        sourceId: mergingCat._id,
        targetId: mergeTargetId as Id<"categories">,
      });
      toast.success(`Kategorija "${mergingCat.name}" spojena.`);
      setMergingCat(null);
      setMergeTargetId("");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Greška pri spajanju.";
      toast.error(msg);
    }
  }

  async function handleApprove(cat: CategoryRow) {
    try {
      await approveCategory({ id: cat._id });
      toast.success(`Kategorija "${cat.name}" odobrena.`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Greška pri odobravanju.";
      toast.error(msg);
    }
  }

  async function handleReject(cat: CategoryRow) {
    try {
      await rejectCategory({ id: cat._id });
      toast.success(`Predlog "${cat.name}" odbijen.`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Greška pri odbijanju.";
      toast.error(msg);
    }
  }

  return (
    <>
      {/* Pending categories */}
      {pendingCategories && pendingCategories.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Predlozi na čekanju
              <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-100 px-1.5 text-xs font-semibold text-amber-700">
                {pendingCategories.length}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="pb-2 pr-4 font-medium">Naziv</th>
                    <th className="pb-2 pr-4 font-medium">Predložio</th>
                    <th className="pb-2 font-medium">Akcije</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingCategories.map((cat) => (
                    <tr key={cat._id} className="border-b last:border-0">
                      <td className="py-3 pr-4 font-medium">{cat.name}</td>
                      <td className="py-3 pr-4 text-muted-foreground">
                        {cat.createdBy ?? "—"}
                      </td>
                      <td className="py-3">
                        <div className="flex items-center gap-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleApprove(cat)}
                            className="h-8 gap-1 text-green-600 hover:bg-green-50 hover:text-green-700"
                          >
                            <Check className="h-3.5 w-3.5" />
                            Odobri
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleReject(cat)}
                            className="h-8 gap-1 text-podeli-red hover:bg-red-50 hover:text-podeli-red"
                          >
                            <X className="h-3.5 w-3.5" />
                            Odbij
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Active categories */}
      <Card>
        <CardHeader>
          <CardTitle>Kategorije</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Create Form */}
          <form onSubmit={handleCreate} className="flex flex-wrap items-end gap-3">
            <div className="space-y-1">
              <Label htmlFor="cat-name">Naziv</Label>
              <Input
                id="cat-name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Nova kategorija"
                className="w-48"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="cat-order">Redosled</Label>
              <Input
                id="cat-order"
                type="number"
                value={newOrder}
                onChange={(e) => setNewOrder(e.target.value)}
                placeholder="0"
                className="w-24"
              />
            </div>
            <Button
              type="submit"
              disabled={creating}
              className="bg-podeli-accent text-white hover:bg-podeli-accent/90"
            >
              Dodaj
            </Button>
          </form>

          {/* Categories Table */}
          {!activeCategories ? (
            <p className="text-sm text-muted-foreground">Učitavanje...</p>
          ) : activeCategories.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nema kategorija.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="pb-2 pr-4 font-medium">Naziv</th>
                    <th className="pb-2 pr-4 font-medium">Predmeta</th>
                    <th className="pb-2 pr-4 font-medium">Tip</th>
                    <th className="pb-2 pr-4 font-medium">Redosled</th>
                    <th className="pb-2 font-medium">Akcije</th>
                  </tr>
                </thead>
                <tbody>
                  {activeCategories.map((cat) => (
                    <tr key={cat._id} className="border-b last:border-0">
                      <td className="py-3 pr-4">
                        <span className="flex items-center gap-2">
                          {cat.isSystem && (
                            <Lock className="h-3.5 w-3.5 text-muted-foreground" />
                          )}
                          {cat.name}
                        </span>
                      </td>
                      <td className="py-3 pr-4">{cat.itemCount}</td>
                      <td className="py-3 pr-4">
                        {cat.isSystem ? (
                          <span className="inline-flex items-center rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                            Sistemska
                          </span>
                        ) : cat.createdBy ? (
                          <span className="inline-flex items-center rounded-full border border-border px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                            Korisnička
                          </span>
                        ) : (
                          <span className="inline-flex items-center rounded-full border border-border px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                            Podrazumevana
                          </span>
                        )}
                      </td>
                      <td className="py-3 pr-4">{cat.order ?? "—"}</td>
                      <td className="py-3">
                        <div className="flex items-center gap-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => openEdit(cat)}
                            className="h-8 w-8"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          {!cat.isSystem && (
                            <>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                  setMergingCat(cat);
                                  setMergeTargetId("");
                                }}
                                className="h-8 w-8"
                                title="Spoji u drugu kategoriju"
                              >
                                <Merge className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => setDeletingCat(cat)}
                                className="h-8 w-8 text-podeli-red hover:text-podeli-red"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={!!editingCat} onOpenChange={(open) => !open && setEditingCat(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Izmeni kategoriju</DialogTitle>
            <DialogDescription>Promenite naziv ili redosled kategorije.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1">
              <Label>Naziv</Label>
              <Input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                disabled={!!editingCat?.isSystem}
              />
              {editingCat?.isSystem && (
                <p className="text-xs text-muted-foreground">
                  Sistemska kategorija ne može biti preimenovana.
                </p>
              )}
            </div>
            <div className="space-y-1">
              <Label>Redosled</Label>
              <Input
                type="number"
                value={editOrder}
                onChange={(e) => setEditOrder(e.target.value)}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setEditingCat(null)}>
                Otkaži
              </Button>
              <Button
                type="button"
                onClick={handleEdit}
                className="bg-podeli-accent text-white hover:bg-podeli-accent/90"
              >
                Sačuvaj
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletingCat} onOpenChange={(open) => !open && setDeletingCat(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Obriši kategoriju &quot;{deletingCat?.name}&quot;?</AlertDialogTitle>
            <AlertDialogDescription>
              {deletingCat && deletingCat.itemCount > 0
                ? `${deletingCat.itemCount} predmet(a) biće prebačeno u kategoriju "Ostalo".`
                : "Ova kategorija nema predmeta i biće trajno obrisana."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Otkaži</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-podeli-red text-white hover:bg-podeli-red/90"
            >
              Obriši
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Merge Dialog */}
      <Dialog open={!!mergingCat} onOpenChange={(open) => !open && setMergingCat(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Spoji &quot;{mergingCat?.name}&quot; u drugu kategoriju</DialogTitle>
            <DialogDescription>Izaberite ciljnu kategoriju u koju želite da spojite predmete.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Svi predmeti ({mergingCat?.itemCount ?? 0}) biće prebačeni u ciljnu kategoriju,
              a kategorija &quot;{mergingCat?.name}&quot; biće obrisana.
            </p>
            <div className="space-y-1">
              <Label>Ciljna kategorija</Label>
              <select
                className="flex h-10 w-full rounded-md border border-border bg-card px-3 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-podeli-accent focus:ring-offset-2"
                value={mergeTargetId}
                onChange={(e) => setMergeTargetId(e.target.value as Id<"categories">)}
              >
                <option value="">Izaberite...</option>
                {activeCategories
                  ?.filter((c) => c._id !== mergingCat?._id)
                  .map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.name} ({c.itemCount} predmeta)
                    </option>
                  ))}
              </select>
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setMergingCat(null)}>
                Otkaži
              </Button>
              <Button
                type="button"
                onClick={handleMerge}
                disabled={!mergeTargetId}
                className="bg-podeli-accent text-white hover:bg-podeli-accent/90"
              >
                Spoji
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
