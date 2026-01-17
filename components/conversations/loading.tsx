export function LoadingConversation() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-3 p-4">
      <div className="h-8 w-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      <p className="text-sm text-muted-foreground">
        Cargando conversación...
      </p>
    </div>
  )
}
