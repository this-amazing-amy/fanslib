import { createFileRoute } from '@tanstack/react-router';
import { LibraryPage } from './library';

export const Route = createFileRoute('/')({
  component: LibraryPage,
});
