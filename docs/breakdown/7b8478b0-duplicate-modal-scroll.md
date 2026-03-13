# Breakdown: Duplicate Post Modal Scroll Fix

**Splitter:** 7b8478b0-2b5d-4e6f-9b15-ff1895961a56  
**Task:** Duplicate Post Modal scrollt nicht richtig  
**Breakdown von:** Minh, 2026-03-13

---

## Zusammenfassung

Ein-Zeiler-Bugfix in `CreatePostDialog.tsx`. Die Ursache ist eine fehlerhafte CSS-Klasse im Content-Wrapper — `h-full` funktioniert nicht in einem Flex-Container mit nur `max-height`. Fix: `flex-1 min-h-0` statt `h-full`.

Kein Refactoring, keine Nebenbaustellen. Minimales Risiko.

---

## Tasks

### T01 — CSS-Klasse ändern in CreatePostDialog.tsx

**Datei:** `@fanslib/apps/web/src/features/library/components/CreatePostDialog.tsx`  
**Zeile:** 418  
**Änderung:**

```tsx
// VORHER:
className="flex flex-col h-full"

// NACHHER:
className="flex flex-col flex-1 min-h-0"
```

Das ist der einzige Task. Keine anderen Änderungen nötig.

---

## Acceptance Criteria (aus Spec)

1. `motion.div` Zeile 418 hat `className="flex flex-col flex-1 min-h-0"` (nicht `h-full`)
2. Duplicate Post Modal scrollt wenn Inhalt > 90vh
3. Create Post via Virtual Slot scrollt ebenfalls korrekt (gleicher Dialog)
4. Header und Footer bleiben beim Scrollen sichtbar
5. Kein visueller Fehler bei kurzem Inhalt (kein Scroll nötig)

---

## Hintergrund

Vollständige Erklärung: `docs/architecture/7b8478b0-duplicate-modal-scroll.md`  
Spec: `docs/specs/7b8478b0-duplicate-modal-scroll.json`

Kurzfassung: `height: 100%` (`h-full`) in einem Flex-Item löst sich nur auf, wenn der Parent eine **definite height** hat. Das Outer Panel hat nur `max-height: 90vh` — das reicht nicht. `flex-1 min-h-0` löst das Problem: das Item bekommt genau den verfügbaren Flex-Space als definite Höhe.

---

## Scope-Hinweis

- ✅ Nur `CreatePostDialog.tsx`, nur Zeile 418
- ❌ Kein Refactoring der ScrollArea
- ❌ Keine anderen Modals anfassen
- ❌ Kein Layout-Umbau

Wenn etwas unklar ist → Minh fragen, nicht selbst entscheiden.
