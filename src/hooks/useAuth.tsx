import { useSession, signIn, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";

export function useAuth() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const user = session?.user;
  
  const isLoading = status === "loading";
  const isAuthenticated = status === "authenticated";
  const isUnauthenticated = status === "unauthenticated";
  
  const login = async (email: string, password: string) => {
    try {
      const response = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });
      
      return response;
    } catch (error) {
      console.error("Login error:", error);
      return { error: "Authentication failed", ok: false };
    }
  };
  
  const logout = async () => {
    await signOut({ redirect: false });
    router.push("/");
  };
  
  return {
    user,
    isLoading,
    isAuthenticated,
    isUnauthenticated,
    login,
    logout,
  };
} 