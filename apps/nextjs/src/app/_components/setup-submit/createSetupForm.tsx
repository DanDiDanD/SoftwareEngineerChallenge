import { Button, Input, Label } from "@acme/ui";

export default function CreateSetupForm() {
  return (
    <form className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="title">Setup Title</Label>
        <Input id="title" name="title" placeholder="Enter setup title" />
      </div>

      <div className="space-y-2">
        <Label htmlFor="author">Author</Label>
        <Input id="author" name="author" placeholder="Enter author name" />
      </div>

      <div className="space-y-2">
        <Label htmlFor="imageUrl">Image URL</Label>
        <Input id="imageUrl" name="imageUrl" placeholder="Enter image URL" />
      </div>

      <Button type="submit" className="w-full">
        Submit Setup
      </Button>
    </form>
  );
}
