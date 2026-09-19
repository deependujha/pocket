"use client";

import { signOut } from "next-auth/react";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";

export function SignOutButton() {
    return <Button variant="outline" className="w-full rounded-xl" onClick={ () => signOut( { callbackUrl: "/login" } ) }><LogOut size={ 16 } /> Sign out</Button>;
}
