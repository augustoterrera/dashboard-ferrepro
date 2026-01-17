'use client'
import { getInvoices } from "./action"

export default function page() {
    const handleSubmit = async () => {
        await getInvoices()
    }
    return (
        <div>
            Hola
            <button onClick={handleSubmit}>enviar</button>
        </div>
    )
}