# Design Choices & Rationale

---

## 1. Application Architecture Overview

Mi aplicación sigue la siguiente arquitectura de Next.js 15 + tRPC:

- **Gallery Page (`/`)**: Página principal que renderiza la galería de setups con sus funcionalidades asociadas. Compuesta por los siguientes componentes:

  - **SetupGallery**: Server Component responsable de obtener datos de setups mediante la query tRPC `setup.all`, mostrando `<SetupSkeleton />` durante la carga.
  - **SetupList**: Server Component que define la estructura de grid responsivo para mostrar los setups. Muestra un mensaje de feedback si no hay publicaciones por mostrar.
  - **SetupItem**: Server Component que renderiza un Card individual con los datos de un setup.
  - **LikeButton**: Client Component que maneja la funcionalidad de likes utilizando `useState` y `useOptimistic`. Conectado al Server Action `likeSetup`.

- **Submission Page (`/submit`)**: Página dedicada al formulario de creación de nuevos setups. Compuesta por los siguientes componentes:

  - **CreateSetup**: Server Component contenedor que envuelve el formulario de creación.
  - **CreateSetupForm**: Client Component que implementa el formulario de creación utilizando `useForm` para gestión de estado y validación con schema Zod, además, muestra errores tanto del cliente como del servidor. Se conecta al Server Action `createSetup`.

- **Server Actions**: Se implementan dos Server Actions conectados a los Client Components, ambos simulan tiempo de respuesta del servidor y 25% de probabilidad de error:

  - **createSetup**: Procesa el envío del formulario, valida datos con schema Zod, y devuelve errores de validación cuando fallan. Redirige a la galería y actualiza el cache si es exitoso.
  - **likeSetup**: Procesa el estado actual de la publicación y devuelve el nuevo estado para actualización el `useOptimistic`.

---

## 2. Key Technical Decisions & Trade-Offs

### Data Fetching Strategy

- **Why did you choose tRPC over REST APIs or direct file reading?**: El challenge requiere el uso de tRPC, sin embargo, alguno de los beneficios de utilizar tRPC que he notado sería:

  - Validar y tipar datos desde una sola definición tanto para client como server, ganando así una gran consistencia en la fiabilidad de los datos. En REST se tendría que definir los tipos en el client y el server por separado, perdiendo robustez.
  - Los routers de tRPC se encuentran en el mismo repositorio que el cliente, creando una documentación viviente a través de los tipos que es intuitiva de leer y navegar.

- **Server Components vs Client Components**: Se adoptó el "server-first approach" de Next.js: todos los componentes son Server Components por defecto, migrando a Client Components solo cuando requieren interactividad. Esto optimiza la experiencia del usuario al enviar la mayor parte del contenido HTML pre-renderizado y la aplicación solo se hidrata lo interactivo.

  - **Server Components**: La mayoría del proyecto permanece como Server Components. Las páginas principales ([Setup Galley Page]("./apps/nextjs/src/app/page.tsx") y [Setup Form Page]("./apps/nextjs/src/app/submit/page.tsx")) renderizan el contenido inicial en el servidor, mejorando el First Contentful Paint. El componente [SetupGallery]("./apps/nextjs/src/app/_components/setup-gallery/index.tsx") también es un Server Component que ejecuta el fetching de datos con tRPC directamente en el servidor. Todos los componentes de presentación pura (cards, layouts, skeletons) permanecen como Server Components.
  - **Client Components**: Solo [LikeButton]("./apps/nextjs/src/app/_components/setup-gallery/LikeButton.tsx") y [CreateSetupForm]("./apps/nextjs/src/app/_components/setup-submit/createSetupForm.tsx") son Client Components, específicamente porque requieren interactividad: manejan estado local con hooks (useState, useForm, useOptimistic), responden a eventos del usuario, y ejecutan Server Actions.

### State Management for Likes

- **How did you implement the like functionality?** Debido al tiempo reducido de la prueba, se utilizó un React State con los estados `likes` y `isLiked` para la funcionalidad de "me gusta". Esto pudo haber sido manejado con un custom hook y además sería util utilizar un **state management** para poder obtener los datos del usuario(el ID en concreto) para realizar la acción de "me gusta".

- **Did you implement optimistic updates?** Sí, utilicé el hook `useOptimistic` en el Client Component [`LikeButton`](./apps/nextjs/src/app/_components/setup-gallery/LikeButton.tsx). Este actualiza inmediatamente el contador de likes (+1/-1) y alterna el estado `isLiked` mientras el Server Action [`likeSetup`](./apps/nextjs/src/app/actions.ts) se ejecuta en segundo plano. Si la acción falla (se simula un 25% de probabilidad de error del action), el estado se revierte automáticamente a los valores previos, garantizando consistencia de datos.

- **Local vs Persistent State**: Como primer paso añadiría sincronización entre pestañas utilizando localStorage events, permitiendo que, una vez que **likeSetup action** se resuelva correctamente, los cambios se reflejen instantaneamente en todas las pestañas. El siguiente paso sería integrar el servidor tRPC con una base de datos PostgreSQL + Prisma, utilizando servicios como Vercel Postgres o una base de datos PostgreSQL alojada en un servidor Node.js + Framework en este mismo repositorio.

### Form Handling & Validation

- **Client-side vs Server-side validation**: Se realizó validaciones tanto del lado del cliente como en el servidor. Este schema se reutiliza en ambos casos.

- **Zod schema design**: Se define **SetupSchema** basado en la interface TS **Setup**, de este schema se extrae **CreateSetupSchema** (y da la posibilidad de poder seguir extrayendo schemas para el CRUD) el cuál se utiliza para la validación en el componente **CreateSetupForm** (integrando dentro de un **useForm**) y en el action **createSetup**.

- **Error handling**: Del lado del cliente, los errores se muestran debajo del input que contiene el error, estos errores son gestionados automáticamente por el hook **useForm** el cuál tiene definido como schema validador **CreateSetupSchema**. También se maneja un caso borde en el que se muestra un mensaje de error genérico si ocurre un error en el server que no esté relacionado con la validación de tipos.

### Component Architecture & Design Patterns

- **Component composition**: Alguno de los patrones que utilicé para mis componentes fueron los siguiente:

  - **Compound Components Pattern**: Si bien este patrón está integrado nativamente en **shadcn/ui**, también se implementa en componentes custom como `<SetupSkeleton />`. Su estructura incluye `<SetupSkeleton.List />` y `<SetupSkeleton.Item />`, manteniendo el componente abierto para extensiones pero cerrado para modificaciones en caso la UI de Setup crezca.
  - **Atomic Design**: Si bien no se implementa la estructura de carpetas tradicional del Atomic Design, sí se respeta su filosofía de composición, creando una jerarquía de componentes desde los más básicos hasta los más complejos. Por ejemplo: `Atoms (Button) → Molecules (LikeButton) → Organisms (SetupItem) → Templates (SetupList)`.
  - **Single Responsability**: Cada componente tiene una sola responsabilidad: Ejemplo: `SetupItem solo renderiza un setup`, `LikeButton: solo maneja likes`, `CreateSetupForm: solo maneja creación`
  - **Render Props Pattern**: El componente **FormField** de **shadcn/ui** implementa este patrón de forma nativa, automatizando el control de los inputs y la validación a través del schema definido.
    Se pudo haber agregado el Hooks Pattern
  - **Container/Presentational Pattern**: Divide los componentes en dos tipos funcionales: **Containers** responsables de la obtención y manejo de datos (**SetupGallery** usando tRPC), y **Presentational** enfocados únicamente en la presentación visual (**SetupList** sin lógica
    de negocio, solo UI).

- **Styling approach**: Para el enfoque de estilos, se siguió la siguiente metodología:

  - **UI Library Components**: se utiliza los componentes **shadcn/ui** para los componentes genéricos que una aplicación web pueda tener. Funcionan como Atoms en el enfoque de Atomic Design (altamente reutilizables)
  - **Custom Componentes**: se utilizan componentes custom que encapsulan lógica y/o UI de features específicas, facilitando la separación de responsabilidades y el mantenimiento del código. (ej. `LikeButton`, `CreateSetupForm`).
  - **Tailwind CSS classes directly:** Se agregan clases de Tailwind CSS directamente para estilos puntuales y disposiciones específicas que no requieren abstracción en componentes separados. Se aplica cuando la reutilización es limitada o el estilo es contextual al componente específico (ej. `SetupList`, `SetupItem`).

- **Image optimization**: Se utilizó el componente Image de Next.js que proporciona optimizaciones como lazy loading y redimensionado dinámico de forma automática; además, se agrega el prop `sizes` para servir diferentes resoluciones según el dispositivo, y se agrega `aspect-video` mantiene una proporción consistente. Fue necesario configurar el remotePatterns en `next.config.js` para permitir imágenes de `https://images.unsplash.com`. A su vez, es necesario agregar un fallback para las imágenes que fallan en su carga.

### Type Safety & Developer Experience

- **TypeScript integration**: Los tipos inferidos de las llamadas tRPC se propagan automáticamente hasta el cliente, eliminando discrepancias entre servidor y cliente. Sin embargo, esto podría mejorarse centralizando la definición de tipos y schemas en el router tRPC en lugar del en Next.js, utilizándolos consistentemente en la definición de setupRouter, y exportando estos tipos/schemas hacia el proyecto Next.js, creando una única fuente de verdad para el tipado.

- **Error boundaries**: Para CreateSetupForm, se muestra feedback encima del botón de submit cuando el action falla (simulado). Para LikeButton no se implementó feedback de error (hace falta implementar un componente de Error Boundary).

---

## 3. Future Improvements & Next Steps

### User Experience Enhancements

- **Search and filtering**: La búsqueda y filtrado se implementaría mediante un **Client Component SetupFilter** que utilice query parameters en la URL (/?title=value1&author=value2&tags=tag1,tag2) para mantener el estado de filtros. Esto permitiría hacer SSR de resultados filtrados al cargar la página directamente con parámetros.

- **Infinite scroll or pagination**: De agregarse un Scroll Infinito el componente **SetupList** pasaría a ser Client Component que permita hacer tRCP fetch dinámicamente mientras se scrollea en la vista y mostrando `<Skeleton.List>` mientras cargan más setups, además, implementaría **virtualización** con **@tanstack/react-virtual** para renderizar solo elementos visibles en el viewport, optimizando la performance. Para el caso de Paginación, **SetupList** puede mantenerse como Server Component y manejar la paginación con un query parameter en la URL (/?page=1) permitiendo hacer SSR de los resultados filtrados por página.

- **Responsive design improvements**: Es necesario mejorar el layout, la estructura de componentes y la disposición de márgenes para el diseño mobile. Adicionalmente, se podría agregar double-tap gesture en las cards para dar like (como en instagram).

### Performance Optimizations

- **Image loading strategies**: Las primeras imágenes visibles en SetupList deben tener priority alta usando la prop priority={index < 6} en next/image para optimizar el LCP (Largest Contentful Paint). Se puede agregar `placeholder="blur"` y `blurDataURL` para mostrar una versión en baja definición de la imagen mientras carga la imagen real. Además, implementar un fallback cuando las imágenes fallan en cargar.

- **Bundle optimization**: Conforme el proyecto crezca, será necesario implementar **code splitting** con **dynamic imports** para componentes grandes y complejos, como un sistema de comentarios que se cargue únicamente al presionar su botón (similar a Instagram). Adicionalmente, se debe optimizar la configuración de webpack y analizar el bundle con herramientas como `@next/bundle-analyzer`.

### Feature Expansions

- **Add state management**: será necesario utilizar un state management (Context API, Zustand) para tener acceso a los datos del usuario logueado ya que estos datos serán necesarios para los actions **likeSetup** y **createSetup** cuando estos estén conectados a una DB.

- **Add mutations**: Tanto el action **createSetup** como **likeSetup** están mockeados. Haría falta crear los mutation asociados a estos métodos en **setupRouter**.

- **User authentication**: Se debe utilizar la función getSession() para validar autenticación en Server Components y authClient.useSession() para validar permisos en Client Components. Además, se debe validar la autenticación en cada procedure de tRPC que requiera usuario autenticado.

- **Real-time updates**: Se definiría el hook **useVisiblePolling** que detecte los setups visibles en el viewport y agregando un setInterval (30s) que haga update a los datos de los setups visibles en pantalla.

- **Setup detail pages**: Se crearía la ruta `setup/[id]` y se obtendrían los datos utilizando la query tRPC `setup.byId()`. La página deberá permitir visualizar el detalle completo de la publicación junto con los comentarios de la publicación.

- **Comment system**: El sistema de comentarios **setupComments** se abriría mediante un botón, similar al comportamiento de redes sociales como Facebook o Twitter. Este **Client Component** se cargaría dinámicamente usando **code splitting** y **dynamic imports**, optimizando el bundle inicial al no requerirse en el primer render.

### Production Readiness

- **Database integration**: Para migrar a una DB implementaría **PostgreSQL** + **Prisma**, generando las interfaces de TS y los schemas de Zod automáticamente para mantener la consistencia de tipos entre cliente, servidor y validaciones. Los Server Actions createSetup y likeSetup se convertirían en mutations reales conectadas a Prisma. Si se desea poblar la DB con los datos mock, se deberá crear un script para insertar los datos en la DB.

- **File uploads**: Integrar AWS S3 para el almacenamiento de imágenes, subida directa desde el cliente y guardando únicamente la URL de la imagen en el servidor."

- **Rate limiting**: Se debería usar Cloudflare para rate limiting básico y protección DDoS.

- **Monitoring and analytics**: Se implementaría métricas de performance utilizando Core Web Vitals para los tiempos de carga. También monitorearía las acciones que los usuarios realizan en la aplicación (likes, comentarios, tiempo de permanencia en páginas) para analizar el comportamiento de los usuarios. También se utilizaría herramientas como Sentry para el trackeo de errores.

---

## 4. Challenges Faced & Lessons Learned

- **tRPC integration challenges**: Inicialmente se intentó implementar `createCallerFactory` (método recomendado por la documentación oficial de tRPC para mayor escalabilidad), pero esto causó errores de tipado de TS. Como solución, se implementó `createCaller` para definir la función **caller** genérica.

- **Next.js Server Actions**: La definición y validación con Zod de los **Server Actions** fue sencilla, sin embargo, para poder realizar la validación del lado del cliente con el fork de `useForm`, se debió hacer el llamado del action dentro de un callback asociado al `onSubmit` en lugar de hacer el llamado del Server Action `createSetup` directamente en el formulario con `<form action={createSetup}>`. No estoy 100% seguro si este approach es correcto pero no pude encontrar que fuera válido también.

- **State management complexity**: La gestión de estado para el comportamiento de like es sencilla ya que todo funciona internamente en **LikeButton**. Esto podría mejorar creando un custom hook llamado `useLikeSetup` manteniendo la lógica de estados aislada (`useState`, `useOptimistic` y `useTransition`) y así mantener el componente únicamente para la presentación.

- **Styling and responsive design**:

  - El botón para cambiar a modo claro/oscuro queda fijo en una posición (no se desplaza hacia abajo al hacer scroll). No pude solucionarlo a tiempo.
  - Debido al tiempo, no se pudo mejorar las versiones tanto para desktop como para mobile por separado

- **TypeScript complexities**: Se tuvo problemas de inferencia al tratar de implementar `createCallerFactory` por lo que se utilizó `createCaller`. Actualmente, los types e interfaces de TS están definidos en el proyecto de Next.js sin embargo estos debieron estar definidos enen `./packages` y darle el typado a `setupRouter`.

---

## 5. Implementation Results & Quality Assessment

### Feature Completeness

- **Gallery Page**: Se obtiene y muestra exitosamente todos los setups en un formato de grid responsive.
- **Like Functionality**: Los botones de me gusta funcionan correctamente con gestión de estado apropiada utilizando `useState`, `useOptimistic` y un server action mock.
- **Submission Form**: Se maneja las validaciónes utilizando el schema **CreateSetupSchema** integrado al hook **useForm**, de tal forma que, al hacer submit, se valida el formulario antes de ser enviado al servidor, evitando que lleguen datos con el formato incorrecto al action **createSetup**.
- **Server-side Processing**: El Server Action **createSetup** fue implementado apropiadamente con validación Zod utilizando el schema **CreateSetupSchema**. En el caso del server action **likeSetup** no se le agregó validación Zod ya que es una función mock (y porque se me acabó el tiempo).

### Code Quality Metrics

- **Type Safety**: Sí, pero esto es debido a que los datos en **setupRouter** son devueltos por la constante definida **mockSetups**, de ser obtenidos los datos de forma real, sería necesario agregar las interfaces y schemas en el mismo **setupRouter** (o que estas sean inferidas desde los modelos de Prisma).

- **Component Reusability**: Los componentes están estructurados por features siguiendo principios de composición y responsabilidad única, implementando patrones como Compound Components y siguiendo el principio de Atomic Design. Sin embargo, esta organización podría presentar desafíos de escalabilidad conforme el proyecto crezca, por lo que podríamos seguir la siguiente estructura:

  - `/components/features/[feature]`: Componentes específicos para cada feature.
  - `/components/shared`: Componentes reutilizables entre features.

- **Error Handling**: La aplicación maneja errores de forma básica. Los errores de validación en el formulario **createSetupForm** se muestran con useForm + Schema de Zod para errores del lado del cliente y el Server Action **createSetup** retorna un error genérico que se muestra en pantalla. Sería necesario configurar un sistema global de manejo de errores que combine Error Boundaries con React Context API, lanzando notificaciones flotantes para errores pequeños (fallos de API) y pantallas de error completas para errores críticos.

- **Performance**: La aplicacion tiene optimizaciones básicas (lazy loading de imagenes por defecto, casi todos los componentes son Server Components). Se puede agregar **React.memo** a componentes que se re-renderizan frecuentemente como **SetupItem**. Se puede implementar **virtualización** con **@tanstack/react-virtual** para renderizar únicamente los Cards visibles en el viewport.

### Advanced Challenge Implementation

Si intentaste alguno de los desafíos avanzados:

- **Optimistic UI**: El uso de **useOptimistic** mejora significativamente la UX al mostrar cambios inmediatos antes de la confirmación del servidor (validado con el action **likeSetup** que simula 25% de errores). Sin embargo, la implementación requiere refactoring: extraer la lógica a un custom hook **useLikeSetup** para separar responsabilidades y mantener el componente LikeButton más limpio. Adicionalmente, a veces se observa un parpadeo mínimo ocasional durante la resolución del **useOptimistic**.

- **Shared Validation**: Se reutiliza efectivamente el schema **CreateSetupSchema** tanto en el client como en el server, obteniendo así una consistencia fuerte entre la validación de lados.
- **Component Architecture**: Se implementó **Compound Components** en el componente [SetupSkeleton]("./apps/nextjs/src/app/_components/setup-gallery/SetupSkeleton.tsx"). Esta estructura será util para el punto de implementarse un **Load More Button** o un **Scroll Infinito**, donde sea necesario solo volver a renderizar `<SetupSkeleton.List>` y no todo su layout.

### Self-Assessment

- **¿Qué aspectos de tu implementación son de los que más te sientes orgulloso?:** Me siento orgulloso de la implementación del "server-first approach" de Next.js, manteniendo la mayoría de componentes como Server Components y migrando a Client Components solo cuando requieren interactividad (LikeButton, CreateSetupForm). Esta estrategia optimiza el rendimiento al enviar HTML pre-renderizado desde el servidor y minimizar la hidratación del lado del cliente, además de reducir la complejidad de manejo de estados y mejorando la mantenibilidad del codigo. Además, me siento satisfecho por haber podido concluir con el reto técnico en el tiempo estipulado (3h 49min).

- **¿Qué refactorizarías si empezaras de nuevo?:** Implementaría una mejor forma de estructurar los componentes, siguiendo una arquitectura de componentes más escalable de estructura `/features/[feature]` + `/shared`. También, pensaría en mejorar la relación entre la aplicación en desktop y mobile. También, en mejorar la estructura de los componentes estructurales (como **SetupList** el cual está algo desordenado).

- **¿Qué priorizarías mejorar con más tiempo?:** A nivel de aplicación, priorizaría mejorar la arquitectura centralizando la definición del TS y schemas en los routers de tRPC para tener única fuente de verdad (e integrarlo después con Prisma). Por otro lado, También priorizaría mejorar la infrastructura técnica implementando testing de integración y de E2E, configurando CI/CD con GitHub Actions, herramientas de calidad de código (ESlint + Prettier, Husky) para asegurar la estabilidad y mantenibilidad del proyecto.

## 6. Elecciones musicales para programar

Este proyecto fue desarrollado mientras sonaban los siguientes albumnes (en orden de inicio a fin)

- [Donuts (2006) by JDilla]("https://music.youtube.com/playlist?list=OLAK5uy_lbor6Q_JWE5Fkxip0eJo-_J8xoKx_1aX0&si=WEfpCHvJL_BCVtKn") - 2 plays
- [Daydream Nation (1988) by Sonic Youth]("https://music.youtube.com/playlist?list=OLAK5uy_nqb9jbgXiipch6I5teqAGwnp6-e4XOytc&si=PEwpZG5qGnwaPhkl") - 1 play
- [Leak 04-13 (2013) by Jai Paul](https://music.youtube.com/playlist?list=OLAK5uy_lmgPvytrMDIPghAt5K1J6nuaHsPQ6_Mas&si=jSeY38AxtMB2PYjq) - 1 play
- [Sewerslvt in Club Cyberia - mix of Sewerslut songs](https://youtu.be/IqMLfrs1qm4?si=P77Wzz04oxyNr24g) - 1 play
