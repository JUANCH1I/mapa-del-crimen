import React, { createContext, useContext, useEffect, useState } from "react"
import { useColorScheme } from "react-native"

export const lightTheme = {
  background: "#fff",
  text: "#000",
  primary: "#007AFF",
  card: "#f4f4f4",
}

export const darkTheme = {
  background: "#000",
  text: "#fff",
  primary: "#0A84FF",
  card: "#1c1c1e",
}

const ThemeContext = createContext({
  theme: lightTheme,
  isDark: false,
  toggle: () => {},
})

export const useTheme = () => useContext(ThemeContext)

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const colorScheme = useColorScheme()
  const [isDark, setIsDark] = useState(colorScheme === "dark")

  const toggle = () => setIsDark((prev) => !prev)

  const theme = isDark ? darkTheme : lightTheme

  return (
    <ThemeContext.Provider value={{ theme, isDark, toggle }}>
      {children}
    </ThemeContext.Provider>
  )
}
