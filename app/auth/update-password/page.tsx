import { Suspense } from "react";
import { UpdatePasswordForm } from "@/components/update-password-form";

export default function Page() {
  return (
    <div className="flex min-h-svh w-full items-center justify-center bg-slate-950 p-6 md:p-10">
      <div className="w-full max-w-sm">
        <Suspense>
          <UpdatePasswordForm />
        </Suspense>
      </div>
    </div>
  );
}
