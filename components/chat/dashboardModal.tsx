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

    console.log(toolData)

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="lg:!max-w-[50vw] lg:h-[95vh] p-0 gap-0 overflow-hidden bg-blue-50">
                    <DialogTitle>
                    </DialogTitle>
                <div className="sticky top-0 z-10 bg-linear-to-r from-slate-50 to-slate-100 border-b px-8 py-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={onClose}
                                className="h-10 w-10 rounded-full hover:bg-slate-200/50"
                            >
                                <ArrowLeft className="h-5 w-5" />
                            </Button>
                            <div>
                                <h2 className="text-2xl font-semibold text-slate-900">Dashboard de Estadísticas</h2>
                                <p className="text-sm text-slate-600 mt-0.5">Visualización completa de datos</p>
                            </div>
                        </div>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={onClose}
                            className="h-10 w-10 rounded-full hover:bg-slate-200/50"
                        >
                            <X className="h-5 w-5" />
                        </Button>
                    </div>
                </div>
            
                <div className="flex-1 overflow-y-auto bg-slate-50/30 px-8 py-6 ">
                    <ToolData  output={toolData.output} index={0} />
                </div>
            </DialogContent>
        </Dialog>
    )
}
