// Componente stub — exibido apenas se authError.type === 'user_not_registered'.
// Com a AuthContext local (requiresAuth: false), este componente nunca é renderizado.
export default function UserNotRegisteredError() {
  return (
    <div className="flex flex-col items-center justify-center h-screen gap-3">
      <p className="font-mono text-lg font-bold text-muted-foreground">Acesso negado</p>
      <p className="text-sm text-muted-foreground">Usuário não registrado no sistema.</p>
    </div>
  );
}
