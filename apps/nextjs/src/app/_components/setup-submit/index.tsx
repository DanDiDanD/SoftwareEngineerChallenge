import { Card, CardContent, CardHeader, CardTitle } from "@acme/ui";

import CreateSetupForm from "./createSetupForm";

export default function CreateSetup() {
  return (
    <Card className="mx-auto mt-8 w-full max-w-2xl">
      <CardHeader className="pb-4">
        <CardTitle>Submit Your Setup</CardTitle>
      </CardHeader>
      <CardContent>
        <CreateSetupForm />
      </CardContent>
    </Card>
  );
}
