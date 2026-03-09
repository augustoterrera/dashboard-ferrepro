// Formato de mensajes guardados en DB (para carga inicial)
export type DBMessage = {
    id: string;
    role: "user" | "assistant";
    content: string;
    tool_invocations?: Array<{
        type: string;
        output: any;
    }> | null;
};
