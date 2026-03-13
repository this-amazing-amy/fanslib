# Architecture: Duplicate Post Modal Scroll Bug

**Splitter:** 7b8478b0-2b5d-4e6f-9b15-ff1895961a56  
**Feature:** Duplicate Post Modal scrollt nicht richtig  
**Datei betroffen:** `@fanslib/apps/web/src/features/library/components/CreatePostDialog.tsx`  
**Analyse von:** Minh, 2026-03-13

---

## Root Cause

Das Modal hat eine fehlerhafte Flexbox-Höhen-Kaskade:

```
Outer Panel (motion.div)
  └── max-h-[90vh] flex flex-col overflow-hidden p-6

  Inner Content (motion.div)   ← 🐛 HIER IST DAS PROBLEM
    └── flex flex-col h-full

    ScrollArea                 ← korrekt, aber hilflos
      └── flex-1 min-h-0 overflow-y-auto
```

**Das Problem mit `h-full`:**  
`height: 100%` in einem Flex-Item funktioniert nur wenn der Parent eine **definite height** hat — also ein echtes `height`-Attribut. Das Outer Panel hat aber nur `max-height: 90vh`, kein `height`. In CSS-Terms: `max-height` alleine reicht nicht um `height: 100%` im Child aufzulösen.

**Was passiert:**  
Die `ScrollArea` hat `flex-1 min-h-0` — das ist richtig. Aber das funktioniert nur, wenn der **direkte Parent** selbst eine begrenzte Höhe hat. Weil `h-full` auf dem Content-Div kein definitives Maß ergibt, wächst der Content-Div unkontrolliert über den `max-h-[90vh]`-Rahmen hinaus. Das Outer Panel clippt per `overflow-hidden`, aber die `ScrollArea` denkt sie hat unendlich Platz und scrollt nie.

**Beweis:** Die `ScrollArea` scrollt problemlos in anderen Contexts (z.B. wenn `maxHeight` prop gesetzt ist), weil dort die Höhe explizit definiert ist.

---

## Fix

**Eine Zeile ändern** in `CreatePostDialog.tsx`:

```tsx
// VORHER (Zeile ~240):
<motion.div
  className="flex flex-col h-full"
>

// NACHHER:
<motion.div
  className="flex flex-col flex-1 min-h-0"
>
```

**Warum das funktioniert:**  
- `flex-1` = `flex-grow: 1; flex-shrink: 1; flex-basis: 0%` → füllt den verfügbaren Space im Parent-Flex-Column
- `min-h-0` = überschreibt den Default `min-height: auto` bei Flex-Items → ermöglicht dem Item sich kleiner als seinen Content zu machen
- Das kombiniert ergibt eine definite Höhe: der Inner-Div bekommt genau den Platz den der Parent freigibt (90vh - padding), nicht mehr
- Die `ScrollArea` mit `flex-1 min-h-0` kann jetzt korrekt auf diesen begrenzten Raum reagieren und scrollt

Diese Pattern (`flex-1 min-h-0` statt `h-full`) ist der Standard-Fix für "scrollbarer Inhalt in einem Flex-Container mit max-height".

---

## Scope

- **Dateien:** Genau eine: `CreatePostDialog.tsx`
- **Änderungen:** Eine CSS-Klassen-Änderung (`h-full` → `flex-1 min-h-0`)
- **Risiko:** Minimal — die Änderung betrifft nur das Layout-Verhalten des Content-Wrappers, nicht die Logik
- **Tests:** Manuell: Modal öffnen (Duplicate Post + Create Post via Virtual Slot), Content sollte jetzt scrollbar sein wenn er über 90vh geht

---

## Kein Refactoring nötig

Die `ScrollArea`-Implementierung selbst ist korrekt. Die restliche Modal-Struktur (Header, Footer, Checkbox) hat alle `flex-shrink-0` korrekt gesetzt. Nur diese eine falsche Klasse verursacht den Bug.

---

## Hinweis für Sasha (Spec)

Kein Feature-Scope, reiner Bug-Fix. Die Spec kann minimal sein:

> **Fix:** In `CreatePostDialog.tsx`, Inner Content Wrapper: `h-full` ersetzen durch `flex-1 min-h-0`.  
> **Acceptance Criterion:** Das Duplicate Post Modal scrollt wenn der Inhalt die Viewport-Höhe übersteigt.
