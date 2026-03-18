import type { ReactNode } from "react";
import Image from "next/image";

interface AuthShellProps {
  children: ReactNode;
}

export function AuthShell({ children }: AuthShellProps) {
  return (
    <>
      <Image src="/topimg.png" className="bg-texture" alt="Background texture" width={1000} height={1000} priority />
      <Image src="/ticket.png" className="ticket-img" alt="Ticket icon" width={1000} height={1000} priority />

      <div className="auth-container">{children}</div>
    </>
  );
}
