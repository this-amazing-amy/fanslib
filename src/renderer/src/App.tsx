import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Layout } from "./Layout";
import { CalendarPage } from "./pages/Calendar";
import { ContentPage } from "./pages/Content";
import { SettingsPage } from "./pages/Settings";
import { ThemeProvider } from "./components/ThemeProvider";
import { Toaster } from "./components/Toaster";
import { SettingsProvider } from "./contexts/SettingsContext";

const App = () => {
  return (
    <ThemeProvider>
      <SettingsProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Layout />}>
              <Route index element={<ContentPage />} />
              <Route path="calendar" element={<CalendarPage />} />
              <Route path="settings" element={<SettingsPage />} />
            </Route>
          </Routes>
        </BrowserRouter>
        <Toaster />
      </SettingsProvider>
    </ThemeProvider>
  );
};

export default App;
