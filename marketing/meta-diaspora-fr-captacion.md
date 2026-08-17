# Meta Ads — Captación de propietarios (diáspora marroquí en Francia)

**Status:** borrador de lanzamiento, sin publicar. Cuenta publicitaria pendiente
de resolver (ver § Bloqueante).
**Fecha:** 2026-08-17
**Objetivo:** captar propietarios residentes en Francia con un bien en Marrakech
(riad, villa, apartamento) que quieran **vender** o **poner en alquiler**.

> Esto es captación de OFERTA (inventario), no de demanda. Es la campaña gemela
> de `google-ads-propietarios.md`, pero en Meta y con el ángulo emocional que
> Search no permite.

---

## Bloqueante actual

No existe (o no es accesible) una cuenta publicitaria de Atlas Rouge. Las cuentas
alcanzables desde el acceso actual son Piro Jewelry, Nur Aromas y tres más
inutilizables. `@atlasrougeimmo` es un perfil de Instagram, no una ad account.

Antes de publicar hace falta:
1. Business Manager con **cuenta publicitaria** propia + método de pago.
2. **Página de Facebook** de Atlas Rouge vinculada al Instagram `@atlasrougeimmo`.
3. Acceso de socio para el usuario que opera la campaña.

---

## Por qué este público es distinto

El propietario diáspora no es un inversor. Es alguien que heredó o compró hace
años, vive a 2.000 km, y su bien es una carga logística envuelta en carga
emocional. Sus frenos reales, por orden:

1. **Desconfianza.** "Me van a estafar desde la distancia."
2. **Distancia física.** No puede ir a enseñar el bien ni supervisar obras.
3. **Papeleo marroquí.** Notario, título, herencia indivisa entre hermanos.
4. **Culpa familiar.** Vender la casa del padre no es una transacción neutra.

El anuncio que gana no promete precio alto. Promete **que no tiene que ir**.

## Restricción de segmentación (importante)

Meta **prohíbe** segmentar por origen étnico, nacionalidad de origen o religión,
y además la vivienda es **categoría especial de anuncios** en muchos mercados —
lo que restringe aún más edad, género y radio geográfico. Por tanto:

- La segmentación NO filtra la diáspora. **La creatividad sí.**
- Palanca real: **idioma** (árabe / francés como idioma de la interfaz),
  intereses de afinidad cultural (Maroc, Marrakech, Casablanca, Royal Air Maroc,
  Marhaba, cuisine marocaine), y viajeros frecuentes a Marruecos.
- Segundo filtro: el propio copy en francés con guiños culturales explícitos.
  Quien no es del colectivo no reacciona; quien lo es, se para en seco.

---

## Estructura recomendada

**1 campaña · 2 conjuntos de anuncios · 3 creativos cada uno**

```
CAMPAÑA — "FR | Propietarios Marrakech | Leads" (CBO, objetivo Leads)
│
├── AD SET A — VENDRE        (60% presión inicial)
│   └── 3 anuncios: A1 riad, A2 llaves split-screen, A3 story
│
└── AD SET B — LOUER         (40%)
    └── 3 anuncios: B1 villa vacía, B2 "ROI dormido", B3 story
```

**Por qué no dos campañas:** dividir el presupuesto duplica la fase de
aprendizaje y encarece el lead sin darte más información. Con CBO, si "vendre"
rinde el doble, Meta le manda el dinero solo — y eso ya es tu dato de mercado.

**Por qué no un solo ad set mezclado:** el copy de venta y el de alquiler se
canibalizan. Necesitas saber cuál de los dos dolores es el que realmente mueve a
este público, y eso solo se lee con los conjuntos separados.

### Configuración

| Parámetro | Valor |
|---|---|
| Objetivo | Clientes potenciales (Leads) |
| Destino de conversión | **Formulario instantáneo de Meta** (no la web) |
| Ubicación | Francia. Fase 2: Bélgica, Países Bajos, España, Italia |
| Idioma | Francés + Árabe |
| Edad | 30-65+ (los <30 rara vez son titulares) |
| Ubicaciones (placements) | Advantage+ (automáticas) |
| Presupuesto | 20-30 €/día mínimo para salir de aprendizaje en ~7 días |
| Puja | Coste más bajo, sin límite, primeras 2 semanas |

**Formulario nativo, no la web.** El propietario diáspora está en el móvil, en
el metro, en francés. Mandarlo a `atlasrouge.com` a rellenar un formulario mata
el 70% de los leads. El formulario nativo autocompleta nombre, email y teléfono.
Contrapartida: leads de menor intención → hay que llamar en <24h o se enfrían.

**Campos del formulario (4, ni uno más):**
1. Type de bien — Riad / Villa / Appartement / Terrain
2. Quartier à Marrakech — texto libre
3. Votre projet — Vendre / Louer / Je ne sais pas encore
4. Teléfono (autocompletado)

La opción "Je ne sais pas encore" es deliberada: mucha de esta gente no ha
decidido, y forzar la elección los expulsa.

---

## Ángulos y copy

### AD SET A — VENDRE

**A1 — El bien inmovilizado** *(creativo: patio de riad, hora dorada)*
> **Titre:** Vous avez un bien à Marrakech ?
> **Corps:** Riad, villa ou appartement — vous n'avez pas à faire le
> déplacement. Nous gérons l'estimation, les visites, le notaire et la
> transaction. Vous suivez tout depuis la France, en français.
> **CTA:** Estimation gratuite

**A2 — Sin sorpresas** *(creativo: llaves de latón, split-screen rojo)*
> **Titre:** Vendre au Maroc, depuis la France
> **Corps:** Le plus dur, ce n'est pas de vendre. C'est de tout gérer à 2 000 km.
> Titre foncier, notaire, acheteurs sérieux : on s'en occupe. Vous décidez, on
> exécute.
> **CTA:** Parler à un conseiller

**A3 — Herencia / indivisión** *(sin creativo aún — pendiente)*
> **Titre:** Un bien de famille à Marrakech ?
> **Corps:** Succession, indivision, papiers incomplets — ce sont les
> situations que nous traitons le plus souvent. Un premier échange, sans
> engagement, pour savoir où vous en êtes.
> **CTA:** En savoir plus

> ⚠️ El ángulo herencia es el de mayor intención y el más delicado. Nada de
> urgencia ni presión: rebota.

### AD SET B — LOUER

**B1 — La villa vacía** *(creativo: terraza con piscina y Atlas al fondo)*
> **Titre:** Votre villa reste vide toute l'année ?
> **Corps:** Location courte ou longue durée, gérée de A à Z : annonces,
> voyageurs, ménage, entretien, encaissements. Vous touchez, on s'occupe de tout.
> **CTA:** Je veux louer

**B2 — El capital dormido**
> **Titre:** Votre bien à Marrakech ne vous rapporte rien
> **Corps:** Charges, entretien, gardien — et zéro revenu. Mise en location
> gérée depuis Marrakech par une équipe francophone. Vous recevez un relevé
> chaque mois.
> **CTA:** Estimation de loyer

**B3 — Story genérica** *(creativo 9:16, vale para ambos ad sets)*
> **Titre:** Marrakech vous manque. Votre bien aussi.
> **CTA:** Estimation gratuite

---

## Creativos generados (2026-08-17, Higgsfield / nano_banana)

| # | Ángulo | Formato | Uso |
|---|---|---|---|
| 1 | Patio de riad — "Vous avez un bien à Marrakech ?" | 4:5 | A1 |
| 2 | Terraza villa + piscina — "Votre villa reste vide" | 4:5 | B1 |
| 3 | Llaves split-screen rojo — "Vendre depuis la France" | 4:5 | A2 |
| 4 | Marrakech aéreo atardecer — story | 9:16 | A3 / B3 |

### ⚠️ Regla dura sobre las imágenes

Estas imágenes son **conceptuales / de marca**. Ilustran el ángulo, no un
inmueble concreto. **Prohibido usarlas como si fueran un bien real de la
cartera** — en inmobiliaria eso es publicidad engañosa y además destruye la
confianza, que es justo el único activo que se le vende a este público.

Para creatividades que muestren propiedades reales: fotos reales de la cartera
de Atlas Rouge. (Alineado con la norma del proyecto en `CLAUDE.md`: nada de
imágenes IA como si fueran reales.)

---

## Qué medir y cuándo decidir

- **Días 1-7:** no tocar nada. Fase de aprendizaje.
- **Día 7:** comparar CPL de A vs B. Diferencia >40% → recortar el perdedor al 20%.
- **Día 14:** matar los creativos con CTR < 0,8%. Duplicar el ganador con nuevas
  variantes del mismo ángulo.
- **Métrica que manda:** no el CPL, sino el **coste por lead que coge el
  teléfono**. Con formulario nativo, un 40-50% de leads no contesta — es normal
  y hay que presupuestarlo.

## Pendiente

- [ ] Resolver cuenta publicitaria + Página FB (bloqueante)
- [ ] Creativos A3 (herencia) y B2 (capital dormido)
- [ ] Redactar el formulario instantáneo en Meta
- [ ] Definir quién llama a los leads y en qué plazo — sin esto la campaña quema
      presupuesto
- [ ] Versión en árabe/darija de los 2 ángulos ganadores (fase 2)
