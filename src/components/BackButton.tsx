import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function BackButton() {
  return (
    <Button
      variant="ghost"
      size="sm"
      className="mb-4"
      onClick={() => window.history.back()}
    >
      <ArrowLeft className="h-4 w-4 mr-1" />
      Back
    </Button>
  );
}
