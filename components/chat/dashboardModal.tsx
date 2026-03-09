"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { ArrowLeft, X } from "lucide-react"
import { ToolData } from "./toolData"

interface DashboardModalProps {
    open: boolean
    onClose: () => void
    toolData: any
}

export function DashboardModal({
    open,
    onClose,
    toolData,
}: DashboardModalProps) {
    if (!toolData) return null

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="lg:max-w-[55vw]! lg:h-[92vh] p-0 gap-0 overflow-hidden bg-slate-900 border border-slate-800 rounded-2xl">
                <DialogTitle className="sr-only">Dashboard de Estadísticas</DialogTitle>

                {/* Header */}
                <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900 shrink-0">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={onClose}
                            className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
                        >
                            <ArrowLeft className="h-4 w-4" />
                        </button>
                        <div>
                            <h2 className="text-base font-bold text-slate-100 tracking-tight">Dashboard de Estadísticas</h2>
                            <p className="text-xs text-slate-500">Visualización completa de datos</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto px-6 py-6 bg-slate-950/40 custom-scrollbar">
                    <ToolData output={toolData.output} toolName={toolData.toolName} />
                </div>
            </DialogContent>
        </Dialog>
    )
}
