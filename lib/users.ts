/**
 * Un usuario invitado se guarda con este centinela en `password_hash` porque la
 * columna es NOT NULL. No es un hash bcrypt válido, así que jamás puede
 * satisfacer un `bcrypt.compare`: la cuenta queda sin acceso hasta que la
 * persona elige su contraseña desde el mail de invitación.
 *
 * Cuando `password_hash` pase a ser nullable, el centinela se reemplaza por
 * null y `isPending` sigue siendo el único punto a tocar.
 */
export const INVITED_PASSWORD_SENTINEL = "__INVITED__";

/** Cuenta creada por un superadmin que todavía no eligió su contraseña. */
export function isPending(passwordHash: string | null | undefined): boolean {
  return !passwordHash || passwordHash === INVITED_PASSWORD_SENTINEL;
}

export type UserRecord = {
  id: string;
  email: string;
  name: string | null;
  role: string;
  id_sucursal: number | null;
  password_hash?: string | null;
};

/** Nunca devolvemos `password_hash` al cliente: lo colapsamos a `pending`. */
export function toPublicUser<T extends UserRecord>({ password_hash, ...user }: T) {
  return { ...user, pending: isPending(password_hash) };
}
