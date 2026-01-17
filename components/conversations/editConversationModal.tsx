"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface EditConversationModalProps {
  open: boolean
  onClose: () => void
  conversationId: string | null
  initialTitle: string
  onSave: (id: string, title: string) => void
}

export function EditConversationModal({
  open,
  onClose,
  conversationId,
  initialTitle,
  onSave,
}: EditConversationModalProps) {
  const [title, setTitle] = useState(initialTitle)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setTitle(initialTitle)
  }, [initialTitle])

  const handleSave = async () => {
    if (!conversationId || !title.trim()) return

    setLoading(true)
    try {
      await onSave(conversationId, title.trim())
      onClose()
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar conversación</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Título de la conversación"
            disabled={loading}
          />

          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={onClose} disabled={loading}>
              Cancelar
            </Button>

            <Button onClick={handleSave} disabled={loading}>
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                </span>
              ) : (
                "Guardar"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
