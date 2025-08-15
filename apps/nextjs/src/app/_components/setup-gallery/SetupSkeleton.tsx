import { Card, CardContent, CardFooter, CardHeader } from "@acme/ui";

function SetupItemSkeleton() {
  return (
    <article role="listitem" className="animate-pulse">
      <Card className="overflow-hidden">
        <div className="relative aspect-video bg-gray-200" />
        <CardHeader>
          <div className="h-6 w-3/4 rounded bg-gray-200" />
          <div className="h-4 w-1/2 rounded bg-gray-200" />
        </CardHeader>
        <CardContent>
          <div className="mb-3 space-y-2">
            <div className="h-4 w-full rounded bg-gray-200" />
            <div className="h-4 w-4/5 rounded bg-gray-200" />
          </div>
          <div className="flex flex-wrap gap-1">
            <div className="h-6 w-16 rounded-full bg-gray-200" />
            <div className="h-6 w-20 rounded-full bg-gray-200" />
            <div className="h-6 w-14 rounded-full bg-gray-200" />
          </div>
        </CardContent>
        <CardFooter>
          <div className="h-8 w-16 rounded bg-gray-200" />
        </CardFooter>
      </Card>
    </article>
  );
}

function SetupListSkeleton() {
  return (
    <section className="mx-auto px-4 py-8">
      <div
        className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3"
        role="list"
      >
        {Array.from({ length: 6 }).map((_, index) => (
          <SetupItemSkeleton key={index} />
        ))}
      </div>
    </section>
  );
}

function SetupSkeleton() {
  return <SetupListSkeleton />;
}

SetupSkeleton.List = SetupListSkeleton;
SetupSkeleton.Item = SetupItemSkeleton;

export { SetupSkeleton };
