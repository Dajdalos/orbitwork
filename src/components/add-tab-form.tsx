// src/components/add-tab-form.tsx
import { createTabAction } from '@/actions/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export function AddTabForm({ wsId }: { wsId: string }) {
  return (
    <form
      action={createTabAction.bind(null, wsId)}
      className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center"
    >
      <Input
        name="label"
        placeholder="Aug 2025"
        className="w-full sm:w-48"
      />
      <Button type="submit" className="whitespace-nowrap">
        Add tab
      </Button>
    </form>
  );
}
