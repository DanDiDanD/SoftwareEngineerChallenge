# Design Choices & Rationale

---

## 1. Application Architecture Overview

My application follows the following Next.js 15 + tRPC architecture:

- **Gallery Page (`/`)**: Main page that renders the setup gallery with its associated functionalities. Composed of the following components:

  - **SetupGallery**: Server Component responsible for obtaining setup data through the tRPC query `setup.all`, showing `<SetupSkeleton />` during loading.
  - **SetupList**: Server Component that defines the responsive grid structure to display setups. Shows a feedback message if there are no posts to show.
  - **SetupItem**: Server Component that renders an individual Card with setup data.
  - **LikeButton**: Client Component that handles like functionality using `useState` and `useOptimistic`. Connected to the `likeSetup` Server Action.

- **Submission Page (`/submit`)**: Page dedicated to the form for creating new setups. Composed of the following components:

  - **CreateSetup**: Server Component container that wraps the creation form.
  - **CreateSetupForm**: Client Component that implements the creation form using `useForm` for state management and validation with Zod schema, additionally, it shows errors from both client and server. Connects to the `createSetup` Server Action.

- **Server Actions**: Two Server Actions are implemented connected to Client Components, both simulate server response time and 25% probability of error:

  - **createSetup**: Processes form submission, validates data with Zod schema, and returns validation errors when they fail. Redirects to gallery and updates cache if successful.
  - **likeSetup**: Processes the current state of the post and returns the new state for `useOptimistic` update.

---

## 2. Key Technical Decisions & Trade-Offs

### Data Fetching Strategy

- **Why did you choose tRPC over REST APIs or direct file reading?**: The challenge requires the use of tRPC, however, some of the benefits of using tRPC that I have noticed would be:

  - Validate and type data from a single definition for both client and server, thus gaining great consistency in data reliability. In REST, types would have to be defined on client and server separately, losing robustness.
  - tRPC routers are located in the same repository as the client, creating living documentation through types that is intuitive to read and navigate.

- **Server Components vs Client Components**: The Next.js "server-first approach" was adopted: all components are Server Components by default, migrating to Client Components only when they require interactivity. This optimizes user experience by sending most HTML content pre-rendered and the application only hydrates the interactive parts.

  - **Server Components**: Most of the project remains as Server Components. The main pages ([Setup Gallery Page]("./apps/nextjs/src/app/page.tsx") and [Setup Form Page]("./apps/nextjs/src/app/submit/page.tsx")) render initial content on the server, improving First Contentful Paint. The [SetupGallery]("./apps/nextjs/src/app/_components/setup-gallery/index.tsx") component is also a Server Component that executes data fetching with tRPC directly on the server. All pure presentation components (cards, layouts, skeletons) remain as Server Components.
  - **Client Components**: Only [LikeButton]("./apps/nextjs/src/app/_components/setup-gallery/LikeButton.tsx") and [CreateSetupForm]("./apps/nextjs/src/app/_components/setup-submit/createSetupForm.tsx") are Client Components, specifically because they require interactivity: they handle local state with hooks (useState, useForm, useOptimistic), respond to user events, and execute Server Actions.

### State Management for Likes

- **How did you implement the like functionality?** Due to the reduced time of the test, React State was used with the `likes` and `isLiked` states for the "like" functionality. This could have been handled with a custom hook and it would also be useful to use a **state management** to be able to obtain user data (the ID specifically) to perform the "like" action.

- **Did you implement optimistic updates?** Yes, I used the `useOptimistic` hook in the [`LikeButton`](./apps/nextjs/src/app/_components/setup-gallery/LikeButton.tsx) Client Component. This immediately updates the like counter (+1/-1) and toggles the `isLiked` state while the [`likeSetup`](./apps/nextjs/src/app/actions.ts) Server Action runs in the background. If the action fails (a 25% error probability is simulated from the action), the state automatically reverts to previous values, ensuring data consistency.

- **Local vs Persistent State**: As a first step I would add synchronization between tabs using localStorage events, allowing that, once the **likeSetup action** resolves correctly, changes are instantly reflected in all tabs. The next step would be to integrate the tRPC server with a PostgreSQL + Prisma database, using services like Vercel Postgres or a PostgreSQL database hosted on a Node.js server + Framework in this same repository.

### Form Handling & Validation

- **Client-side vs Server-side validation**: Validations were performed on both client and server side. This schema is reused in both cases.

- **Zod schema design**: **SetupSchema** is defined based on the TS **Setup** interface, from this schema **CreateSetupSchema** is extracted (and gives the possibility of being able to continue extracting schemas for CRUD) which is used for validation in the **CreateSetupForm** component (integrating within a **useForm**) and in the **createSetup** action.

- **Error handling**: On the client side, errors are shown below the input that contains the error, these errors are automatically managed by the **useForm** hook which has **CreateSetupSchema** defined as validator schema. An edge case is also handled where a generic error message is shown if a server error occurs that is not related to type validation.

### Component Architecture & Design Patterns

- **Component composition**: Some of the patterns I used for my components were the following:

  - **Compound Components Pattern**: While this pattern is natively integrated in **shadcn/ui**, it is also implemented in custom components like `<SetupSkeleton />`. Its structure includes `<SetupSkeleton.List />` and `<SetupSkeleton.Item />`, keeping the component open for extensions but closed for modifications in case the Setup UI grows.
  - **Atomic Design**: While the traditional Atomic Design folder structure is not implemented, its composition philosophy is respected, creating a hierarchy of components from the most basic to the most complex. For example: `Atoms (Button) → Molecules (LikeButton) → Organisms (SetupItem) → Templates (SetupList)`.
  - **Single Responsibility**: Each component has a single responsibility: Example: `SetupItem only renders a setup`, `LikeButton: only handles likes`, `CreateSetupForm: only handles creation`
  - **Render Props Pattern**: The **FormField** component from **shadcn/ui** implements this pattern natively, automating input control and validation through the defined schema.
    The Hooks Pattern could have been added
  - **Container/Presentational Pattern**: Divides components into two functional types: **Containers** responsible for data fetching and handling (**SetupGallery** using tRPC), and **Presentational** focused solely on visual presentation (**SetupList** without business logic, only UI).

- **Styling approach**: For the styling approach, the following methodology was followed:

  - **UI Library Components**: **shadcn/ui** components are used for generic components that a web application might have. They function as Atoms in the Atomic Design approach (highly reusable)
  - **Custom Components**: Custom components are used that encapsulate logic and/or UI of specific features, facilitating separation of responsibilities and code maintenance. (e.g. `LikeButton`, `CreateSetupForm`).
  - **Tailwind CSS classes directly:** Tailwind CSS classes are added directly for specific styles and specific layouts that do not require abstraction in separate components. Applied when reuse is limited or the style is contextual to the specific component (e.g. `SetupList`, `SetupItem`).

- **Image optimization**: Next.js Image component was used which provides optimizations like lazy loading and dynamic resizing automatically; additionally, the `sizes` prop is added to serve different resolutions depending on the device, and `aspect-video` is added to maintain consistent proportion. It was necessary to configure remotePatterns in `next.config.js` to allow images from `https://images.unsplash.com`. At the same time, it is necessary to add a fallback for images that fail to load.

### Type Safety & Developer Experience

- **TypeScript integration**: Types inferred from tRPC calls automatically propagate to the client, eliminating discrepancies between server and client. However, this could be improved by centralizing type and schema definitions in the tRPC router instead of in Next.js, using them consistently in setupRouter definition, and exporting these types/schemas to the Next.js project, creating a single source of truth for typing.

- **Error boundaries**: For CreateSetupForm, feedback is shown above the submit button when the action fails (simulated). For LikeButton no error feedback was implemented (an Error Boundary component needs to be implemented).

---

## 3. Future Improvements & Next Steps

### User Experience Enhancements

- **Search and filtering**: Search and filtering would be implemented through a **Client Component SetupFilter** that uses query parameters in the URL (/?title=value1&author=value2&tags=tag1,tag2) to maintain filter state. This would allow SSR of filtered results when loading the page directly with parameters.

- **Infinite scroll or pagination**: If Infinite Scroll were added, the **SetupList** component would become a Client Component that allows dynamic tRCP fetching while scrolling in the view and showing `<Skeleton.List>` while more setups load, additionally, it would implement **virtualization** with **@tanstack/react-virtual** to render only elements visible in the viewport, optimizing performance. For Pagination, **SetupList** can remain as Server Component and handle pagination with a query parameter in the URL (/?page=1) allowing SSR of results filtered by page.

- **Responsive design improvements**: It is necessary to improve the layout, component structure and margin arrangement for mobile design. Additionally, double-tap gesture could be added on cards to like (like on instagram).

### Performance Optimizations

- **Image loading strategies**: The first images visible in SetupList should have high priority using the priority={index < 6} prop in next/image to optimize LCP (Largest Contentful Paint). `placeholder="blur"` and `blurDataURL` can be added to show a low-definition version of the image while the real image loads. Also, implement a fallback when images fail to load.

- **Bundle optimization**: As the project grows, it will be necessary to implement **code splitting** with **dynamic imports** for large and complex components, such as a comment system that loads only when pressing its button (similar to Instagram). Additionally, webpack configuration should be optimized and bundle analyzed with tools like `@next/bundle-analyzer`.

### Feature Expansions

- **Add state management**: It will be necessary to use state management (Context API, Zustand) to have access to logged user data since this data will be necessary for **likeSetup** and **createSetup** actions when they are connected to a DB.

- **Add mutations**: Both **createSetup** and **likeSetup** actions are mocked. It would be necessary to create the mutations associated with these methods in **setupRouter**.

- **User authentication**: The getSession() function should be used to validate authentication in Server Components and authClient.useSession() to validate permissions in Client Components. Additionally, authentication should be validated in each tRPC procedure that requires an authenticated user.

- **Real-time updates**: The **useVisiblePolling** hook would be defined that detects setups visible in the viewport and adding a setInterval (30s) that updates the data of setups visible on screen.

- **Setup detail pages**: The `setup/[id]` route would be created and data would be obtained using the tRPC query `setup.byId()`. The page should allow viewing the complete detail of the post along with the post's comments.

- **Comment system**: The **setupComments** comment system would be opened via a button, similar to social media behavior like Facebook or Twitter. This **Client Component** would be loaded dynamically using **code splitting** and **dynamic imports**, optimizing the initial bundle by not being required in the first render.

### Production Readiness

- **Database integration**: To migrate to a DB I would implement **PostgreSQL** + **Prisma**, automatically generating TS interfaces and Zod schemas to maintain type consistency between client, server and validations. The createSetup and likeSetup Server Actions would become real mutations connected to Prisma. If you want to populate the DB with mock data, you should create a script to insert the data into the DB.

- **File uploads**: Integrate AWS S3 for image storage, direct upload from client and saving only the image URL on the server.

- **Rate limiting**: Cloudflare should be used for basic rate limiting and DDoS protection.

- **Monitoring and analytics**: Performance metrics would be implemented using Core Web Vitals for load times. I would also monitor actions that users perform in the application (likes, comments, time spent on pages) to analyze user behavior. Tools like Sentry would also be used for error tracking.

---

## 4. Challenges Faced & Lessons Learned

- **tRPC integration challenges**: Initially I tried to implement `createCallerFactory` (method recommended by official tRPC documentation for greater scalability), but this caused TS typing errors. As a solution, `createCaller` was implemented to define the generic **caller** function.

- **Next.js Server Actions**: Defining and validating with Zod for **Server Actions** was simple, however, to be able to perform client-side validation with the `useForm` fork, the action call had to be made within a callback associated with `onSubmit` instead of making the **createSetup** Server Action call directly in the form with `<form action={createSetup}>`. I'm not 100% sure if this approach is correct but I couldn't find that it was also valid.

- **State management complexity**: State management for like behavior is simple since everything works internally in **LikeButton**. This could be improved by creating a custom hook called `useLikeSetup` maintaining the state logic isolated (`useState`, `useOptimistic` and `useTransition`) and thus keeping the component only for presentation.

- **Styling and responsive design**:

  - The button to switch to light/dark mode stays fixed in a position (it doesn't scroll down when scrolling). I couldn't solve it in time.
  - Due to time, the versions for both desktop and mobile could not be improved separately

- **TypeScript complexities**: There were inference problems when trying to implement `createCallerFactory` so `createCaller` was used. Currently, TS types and interfaces are defined in the Next.js project however these should have been defined in `./packages` and given the typing to `setupRouter`.

---

## 5. Implementation Results & Quality Assessment

### Feature Completeness

- **Gallery Page**: Successfully obtains and displays all setups in a responsive grid format.
- **Like Functionality**: Like buttons work correctly with appropriate state management using `useState`, `useOptimistic` and a mock server action.
- **Submission Form**: Validations are handled using the **CreateSetupSchema** schema integrated to the **useForm** hook, so that, when submitting, the form is validated before being sent to the server, preventing data with incorrect format from reaching the **createSetup** action.
- **Server-side Processing**: The **createSetup** Server Action was implemented appropriately with Zod validation using the **CreateSetupSchema** schema. In the case of the **likeSetup** server action, Zod validation was not added since it is a mock function (and because I ran out of time).

### Code Quality Metrics

- **Type Safety**: Yes, but this is because the data in **setupRouter** is returned by the defined constant **mockSetups**, if the data were obtained in a real way, it would be necessary to add the interfaces and schemas in the same **setupRouter** (or that these are inferred from Prisma models).

- **Component Reusability**: Components are structured by features following composition and single responsibility principles, implementing patterns like Compound Components and following the Atomic Design principle. However, this organization could present scalability challenges as the project grows, so we could follow the following structure:

  - `/components/features/[feature]`: Specific components for each feature.
  - `/components/shared`: Reusable components between features.

- **Error Handling**: The application handles errors in a basic way. Validation errors in the **createSetupForm** form are shown with useForm + Zod Schema for client-side errors and the **createSetup** Server Action returns a generic error that is displayed on screen. It would be necessary to configure a global error handling system that combines Error Boundaries with React Context API, launching floating notifications for small errors (API failures) and full error screens for critical errors.

- **Performance**: The application has basic optimizations (lazy loading of images by default, almost all components are Server Components). **React.memo** can be added to components that re-render frequently like **SetupItem**. **Virtualization** can be implemented with **@tanstack/react-virtual** to render only Cards visible in the viewport.

### Advanced Challenge Implementation

If you tried any of the advanced challenges:

- **Optimistic UI**: The use of **useOptimistic** significantly improves UX by showing immediate changes before server confirmation (validated with the **likeSetup** action that simulates 25% errors). However, the implementation requires refactoring: extract the logic to a custom **useLikeSetup** hook to separate responsibilities and keep the LikeButton component cleaner. Additionally, sometimes a minimal occasional flicker is observed during **useOptimistic** resolution.

- **Shared Validation**: The **CreateSetupSchema** schema is effectively reused on both client and server, thus obtaining strong consistency between side validations.
- **Component Architecture**: **Compound Components** was implemented in the [SetupSkeleton]("./apps/nextjs/src/app/_components/setup-gallery/SetupSkeleton.tsx") component. This structure will be useful for implementing a **Load More Button** or an **Infinite Scroll**, where it is necessary to only re-render `<SetupSkeleton.List>` and not its entire layout.

### Self-Assessment

- **What aspects of your implementation are you most proud of?:** I am proud of the implementation of the Next.js "server-first approach", keeping most components as Server Components and migrating to Client Components only when they require interactivity (LikeButton, CreateSetupForm). This strategy optimizes performance by sending pre-rendered HTML from the server and minimizing client-side hydration, in addition to reducing state management complexity and improving code maintainability. Additionally, I feel satisfied for having been able to complete the technical challenge in the stipulated time (3h 49min).

- **What would you refactor if you started again?:** I would implement a better way to structure components, following a more scalable component architecture of `/features/[feature]` + `/shared` structure. Also, I would think about improving the relationship between the desktop and mobile application. Also, in improving the structure of structural components (like **SetupList** which is somewhat disorganized).

- **What would you prioritize to improve with more time?:** At the application level, I would prioritize improving the architecture by centralizing the definition of TS and schemas in tRPC routers to have a single source of truth (and integrate it later with Prisma). On the other hand, I would also prioritize improving the technical infrastructure by implementing integration and E2E testing, configuring CI/CD with GitHub Actions, code quality tools (ESlint + Prettier, Husky) to ensure project stability and maintainability.

## 6. Musical Choices for Programming

This project was developed while the following albums were playing (in order from start to finish)

- [Donuts (2006) by JDilla]("https://music.youtube.com/playlist?list=OLAK5uy_lbor6Q_JWE5Fkxip0eJo-_J8xoKx_1aX0&si=WEfpCHvJL_BCVtKn") - 2 plays
- [Daydream Nation (1988) by Sonic Youth]("https://music.youtube.com/playlist?list=OLAK5uy_nqb9jbgXiipch6I5teqAGwnp6-e4XOytc&si=PEwpZG5qGnwaPhkl") - 1 play
- [Leak 04-13 (2013) by Jai Paul](https://music.youtube.com/playlist?list=OLAK5uy_lmgPvytrMDIPghAt5K1J6nuaHsPQ6_Mas&si=jSeY38AxtMB2PYjq) - 1 play
- [Sewerslvt in Club Cyberia - mix of Sewerslut songs](https://youtu.be/IqMLfrs1qm4?si=P77Wzz04oxyNr24g) - 1 play
