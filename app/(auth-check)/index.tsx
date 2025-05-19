import { useEffect } from "react";
import { router } from "expo-router";
import { useUser } from "../context/UserContext";

export default function Index() {
  const { user, cargando } = useUser();

  useEffect(() => {
    if (!cargando) {
      if (user) {
        router.replace("/components/ui/BottomNavbar");
      } else {
        router.replace("/screens/Login");
      }
    }
  }, [user, cargando]);

  return null;
}
