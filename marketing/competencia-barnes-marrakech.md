# Competencia — BARNES Marrakech

> Guardado 2026-07-24 a petición del owner, como referencia de competencia
> directa (agencia de lujo en Marrakech) mientras se decide la estrategia de
> landing para captar propietarios que quieren VENDER. Resumen en palabras
> propias — no es una copia del contenido (derechos de autor de BARNES).

## URLs relevantes

| Página | URL | Qué es |
|---|---|---|
| Búsqueda de venta (comprador) | https://www.barnes-marrakech.com/fr/vente/appartement-marrakech.html | Listado de 44 apartamentos en venta, con precios reales por barrio. Dirigida a COMPRADORES, no a propietarios. |
| Estimación (vendedor) | https://www.barnes-marrakech.com/fr/vendre/estimer-votre-bien/440-924-268/ | La página real de captación de VENDEDORES — el equivalente directo a lo que estamos construyendo para Atlas Rouge. |

## Datos de mercado observados (útiles como referencia de precios reales)

Precios de venta reales vistos en el listado (Guéliz, Hivernage, Agdal, Route
de Fès, Route de Ouarzazate, Palmeraie), rango aproximado 105.000 € – 950.000 €
según barrio/tamaño. Varias fichas usan "Prix Nous Consulter" (precio a
consultar) para propiedades de gama alta — mismo patrón que ya usamos en
Atlas Rouge para `price_on_request`.

## Cómo está construida su página de captación de vendedores

**Arquitectura: todo lo contrario a lo que hemos hecho esta sesión.**

- **NO es una landing cerrada.** Es una página normal dentro de su sitio
  multipágina completo: menú de navegación entero (Acheter/Louer/Vendre/
  Découvrir Marrakech/Actualités/Contact/FAQ), migas de pan, footer con
  newsletter — cero de la disciplina "una sola acción, cero distracciones"
  que hemos aplicado a `/proprietaires`.
- **Texto largo, tipo editorial.** Varios bloques de prosa explicando por qué
  elegir BARNES: experiencia del equipo, estimación in-situ y confidencial,
  red internacional (oficinas en Francia/Reino Unido/Suiza/EEUU) para dar
  salida a la venta, proceso de firma de mandato. Ningún "número gigante",
  ninguna reducción de texto — la antítesis del enfoque que pidió el owner
  para nuestra landing.
- **Un solo formulario, un solo paso.** "Estimer, Vendre Ou Louer Votre Bien":
  Tipo de bien (Villa/Appartement/Riad/Terrain) + Estilo
  (Marocain/Contemporain) + envío. No es progresivo como el nuestro (3
  pasos), es un formulario clásico de una sola pantalla.
- **Debajo del formulario, una newsletter genérica** de todo el grupo BARNES
  (yates, viñedos, arte, castillos...) — lógico para una marca de lujo
  internacional multi-vertical, pero fuera de escala para Atlas Rouge
  (agencia local, single-tenant).
- Botón de WhatsApp flotante — mismo patrón que ya usamos nosotros.

## Lectura para la decisión de la landing "vendre"

BARNES prioriza autoridad de marca y SEO/contenido sobre optimización pura de
conversión publicitaria — tiene sentido para una marca de lujo internacional
enorme y ya establecida. Atlas Rouge, más pequeña y en fase de captación de
tráfico de pago, se beneficia más del enfoque contrario que ya hemos aplicado
en `/proprietaires` esta sesión: landing cerrada, un solo CTA claro, mensaje
ajustado a la campaña, datos reales sin relleno. Esto refuerza la
recomendación ya dada: en vez de clonar el estilo de BARNES (largo, editorial,
multipágina), mantener el titular/mensaje de `/proprietaires` ajustado
dinámicamente según la campaña (`?service=vente`) en vez de construir una
landing separada al estilo BARNES.
