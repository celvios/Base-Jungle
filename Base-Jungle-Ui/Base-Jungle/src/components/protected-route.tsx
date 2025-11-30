import { useWallet } from "@/contexts/wallet-context";
import { Redirect } from "wouter";
import { ReactNode } from "react";

interface ProtectedRouteProps {
    children: ReactNode;
    redirectTo?: string;
}

export function ProtectedRoute({ children, redirectTo = "/" }: ProtectedRouteProps) {
    const { isConnected } = useWallet();

    if (!isConnected) {
        return <Redirect to={redirectTo} />;
    }

    return <>{children}</>;
}
