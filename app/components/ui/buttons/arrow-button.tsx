import { Button } from '~/components/ui/button';
import { CircleFadingArrowUpIcon } from 'lucide-react';

export function ButtonIcon() {
  return (
    <Button variant="outline" size="icon">
      <CircleFadingArrowUpIcon />
    </Button>
  );
}
