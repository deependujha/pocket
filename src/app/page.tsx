"use client";
import { LoginPage } from "@/components/pages/login/login";
import { TrackerPage } from "@/components/pages/tracker/tracker";
import { useSession, signIn, signOut } from "next-auth/react"


type PageProps = {
  searchParams?: Promise<{
    token?: string;
  }>;
};

export function Home( { searchParams }: PageProps ) {
  const { data: session } = useSession()

  // Logged-in user
  if ( session ) {
    return <TrackerPage />;
  }
  return <LoginPage />;
}

export default Home;
