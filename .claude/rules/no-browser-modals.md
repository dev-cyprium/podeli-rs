# No Browser Confirmation Modals

**Never use native browser modals** like `confirm()`, `alert()`, or `prompt()` in the codebase.

Instead, use the shadcn/ui `AlertDialog` component from `@/components/ui/alert-dialog` for all confirmation dialogs.

## Pattern

For destructive/confirmation actions, use `AlertDialog` inline with a trigger button:

```tsx
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

<AlertDialog>
  <AlertDialogTrigger asChild>
    <Button variant="outline">Otkaži</Button>
  </AlertDialogTrigger>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>Da li ste sigurni?</AlertDialogTitle>
      <AlertDialogDescription>
        Ova radnja ne može biti poništena.
      </AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel>Ne</AlertDialogCancel>
      <AlertDialogAction onClick={handleAction}>Da</AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
```

## Why

- Browser modals block the main thread and are not stylable
- They break the visual consistency of the app
- They don't work well on mobile devices
- They can't be localized per-component
