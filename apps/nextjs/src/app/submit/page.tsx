import CreateSetup from "../_components/setup-submit";

export default function SubmitPage() {
  return (
    <main className="container h-screen py-16">
      <header
        className="text-center"
        aria-label="Setup Submit - Share your workspace setup with the community"
      >
        <h1 className="text-5xl font-extrabold tracking-tight sm:text-[5rem]">
          Submit Your <span className="text-primary">Setup</span>
        </h1>
      </header>
      <div className="mt-8 border-t border-gray-600" aria-hidden="true"></div>
      <CreateSetup />
    </main>
  );
}
