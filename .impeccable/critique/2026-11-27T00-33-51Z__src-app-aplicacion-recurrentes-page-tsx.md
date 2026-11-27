---
target: /recurrentes
total_score: 27
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 3
target_identity: "file:F:\\Proyectos\\Tino\\tino-web\\src\\app\\(aplicacion)\\recurrentes\\page.tsx"
target_fingerprint: "sha256:698dc9de3c56dfdc939c58144927fa31b6b4fb6be949247cf6dafbee597b8f0f"
target_path: "F:\\Proyectos\\Tino\\tino-web\\src\\app\\(aplicacion)\\recurrentes\\page.tsx"
timestamp: 2026-11-27T00-33-51Z
slug: src-app-aplicacion-recurrentes-page-tsx
---
# Critique /recurrentes — 27/40
Method: dual-agent. Detector: 0 hallazgos CLI; overlay: "Omitido" en terciario (2,9:1), placeholder concepto 3:1, pestañas tipo móvil 38 px ancho, grupos de radios sin nombre programático.
Heurísticas: 1:3 2:3 3:4 4:2 5:3 6:3 7:2 8:2 9:2 10:3
P1 bandeja cae a fila angosta a 1440 (columna 664 < @2xl 672) — bandeja-recurrentes.tsx:336
P1 móvil: comprometido antes de la bandeja accionable — page.tsx:90,99
P1 aviso Deshacer fuera de vista al confirmar filas bajas — bandeja-recurrentes.tsx:205
P2 panel: dos "Importe", detalle pegado al rótulo, validación cliente solo monto, pie fijo enorme en móvil — panel-plantilla.tsx:70,147,306,313
P2 comprometido pinta transferencias (pago tarjeta) como salida terracota — comprometido-mes.tsx:49
Menores: Omitir botón a mano; "Omitido" terciario como texto; radios sin fieldset/legend; borde radio terciario; Confirmar ajuste sin signo.
