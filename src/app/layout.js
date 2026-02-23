import { Inter } from "next/font/google";
import "./globals.css";
import "./styles/markdown-editor.css";
import { Toaster } from "react-hot-toast";
import { SelectionProvider } from "./context/SelectionContext";
import { ScheduledPostsProvider } from "../contexts/ScheduledPostsContext";
import { TaskMonitorProvider } from "./context/TaskMonitorContext";
import AuthWrapper from "./components/AuthWrapper";
import TaskMonitorDrawer from "./components/TaskMonitorDrawer";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata = {
  title: "SMS",
  description:
    "SMS - AI-powered platform for intelligent business growth and strategic insights",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`flex h-screen overflow-hidden ${inter.variable}`}>
        {/*  Wrap the entire layout in providers  */}
        <SelectionProvider>
          <TaskMonitorProvider>
            <ScheduledPostsProvider>
              <AuthWrapper>{children}</AuthWrapper>
              <TaskMonitorDrawer />
              <Toaster
                position="top-center"
                reverseOrder={false}
                toastOptions={{
                  duration: 10000, // 10 seconds for all toasts by default
                }}
              />
            </ScheduledPostsProvider>
          </TaskMonitorProvider>
        </SelectionProvider>
      </body>
    </html>
  );
}
