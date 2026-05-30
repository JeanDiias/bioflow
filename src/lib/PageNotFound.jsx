import { Link } from 'react-router-dom';
import { FlaskConical } from 'lucide-react';

export default function PageNotFound() {
  return (
    <div className="flex flex-col items-center justify-center h-[70vh] gap-4 text-center">
      <FlaskConical className="w-12 h-12 text-muted-foreground/30" />
      <p className="font-mono text-5xl font-bold text-muted-foreground/40">404</p>
      <p className="text-muted-foreground text-sm">Página não encontrada</p>
      <Link
        to="/"
        className="text-primary hover:underline text-sm mt-2"
      >
        Voltar ao Dashboard
      </Link>
    </div>
  );
}
