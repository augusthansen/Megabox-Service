"use client";

import { useTheme } from "@/lib/theme-context";
import { useEffect, useState } from "react";

interface NotificationSettings {
  emailNotifications: boolean;
  browserNotifications: boolean;
}

export default function SettingsPage() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [user, setUser] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>({
    emailNotifications: true,
    browserNotifications: false,
  });
  const [browserNotificationStatus, setBrowserNotificationStatus] = useState<"default" | "granted" | "denied">("default");

  useEffect(() => {
    // Load user data
    const userData = sessionStorage.getItem("user");
    if (userData) {
      setUser(JSON.parse(userData));
    }

    // Load saved notification settings
    const savedSettings = localStorage.getItem("notificationSettings");
    if (savedSettings) {
      setNotificationSettings(JSON.parse(savedSettings));
    }

    // Check browser notification permission status
    if (typeof window !== "undefined" && "Notification" in window) {
      setBrowserNotificationStatus(Notification.permission);
    }
  }, []);

  const handleEmailNotificationToggle = () => {
    const newSettings = {
      ...notificationSettings,
      emailNotifications: !notificationSettings.emailNotifications,
    };
    setNotificationSettings(newSettings);
    localStorage.setItem("notificationSettings", JSON.stringify(newSettings));
    showSaveMessage("success", "Email notification preference saved");
  };

  const handleBrowserNotificationToggle = async () => {
    if (!("Notification" in window)) {
      showSaveMessage("error", "Browser notifications are not supported in your browser");
      return;
    }

    if (notificationSettings.browserNotifications) {
      // Turning off
      const newSettings = {
        ...notificationSettings,
        browserNotifications: false,
      };
      setNotificationSettings(newSettings);
      localStorage.setItem("notificationSettings", JSON.stringify(newSettings));
      showSaveMessage("success", "Browser notifications disabled");
    } else {
      // Turning on - need to request permission
      if (Notification.permission === "denied") {
        showSaveMessage("error", "Browser notifications are blocked. Please enable them in your browser settings.");
        return;
      }

      if (Notification.permission === "default") {
        const permission = await Notification.requestPermission();
        setBrowserNotificationStatus(permission);

        if (permission !== "granted") {
          showSaveMessage("error", "Permission for browser notifications was denied");
          return;
        }
      }

      // Permission granted, enable notifications
      const newSettings = {
        ...notificationSettings,
        browserNotifications: true,
      };
      setNotificationSettings(newSettings);
      localStorage.setItem("notificationSettings", JSON.stringify(newSettings));
      showSaveMessage("success", "Browser notifications enabled");

      // Show a test notification
      new Notification("Megabox Service", {
        body: "Browser notifications are now enabled!",
        icon: "/favicon.ico",
      });
    }
  };

  const showSaveMessage = (type: "success" | "error", text: string) => {
    setSaveMessage({ type, text });
    setTimeout(() => setSaveMessage(null), 3000);
  };

  return (
    <div className="max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Settings</h2>
        {saveMessage && (
          <div
            className={`px-4 py-2 rounded-lg text-sm font-medium ${
              saveMessage.type === "success"
                ? "bg-success-50 text-success-700 dark:bg-success-900/30 dark:text-success-400"
                : "bg-danger-50 text-danger-700 dark:bg-danger-900/30 dark:text-danger-400"
            }`}
          >
            {saveMessage.text}
          </div>
        )}
      </div>

      {/* Appearance Section */}
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow border border-slate-200 dark:border-slate-700 mb-6">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Appearance</h3>
          <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">
            Customize how the application looks on your device
          </p>
        </div>
        <div className="p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <label className="text-sm font-medium text-gray-900 dark:text-white">
                Theme
              </label>
              <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">
                Select your preferred color theme
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setTheme("light")}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border transition-all ${
                  theme === "light"
                    ? "bg-primary-50 dark:bg-primary-900/30 border-primary-500 text-primary-700 dark:text-primary-400"
                    : "bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-600"
                }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
                  />
                </svg>
                Light
              </button>
              <button
                onClick={() => setTheme("dark")}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border transition-all ${
                  theme === "dark"
                    ? "bg-primary-50 dark:bg-primary-900/30 border-primary-500 text-primary-700 dark:text-primary-400"
                    : "bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-600"
                }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
                  />
                </svg>
                Dark
              </button>
              <button
                onClick={() => setTheme("system")}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border transition-all ${
                  theme === "system"
                    ? "bg-primary-50 dark:bg-primary-900/30 border-primary-500 text-primary-700 dark:text-primary-400"
                    : "bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-600"
                }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
                System
              </button>
            </div>
          </div>
          <p className="text-xs text-gray-500 dark:text-slate-400 mt-4">
            Currently using: <span className="font-medium capitalize text-gray-700 dark:text-slate-200">{resolvedTheme}</span> theme
            {theme === "system" && " (based on your system preferences)"}
          </p>
        </div>
      </div>

      {/* Profile Section */}
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow border border-slate-200 dark:border-slate-700 mb-6">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Profile</h3>
          <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">
            Your account information
          </p>
        </div>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                Name
              </label>
              <p className="text-gray-900 dark:text-white">{user?.name || "—"}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                Email
              </label>
              <p className="text-gray-900 dark:text-white">{user?.email || "—"}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                Role
              </label>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                user?.role === "super_admin"
                  ? "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400"
                  : user?.role === "service_tech"
                  ? "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
                  : "bg-gray-100 text-gray-800 dark:bg-slate-700 dark:text-slate-300"
              }`}>
                {user?.role === "super_admin"
                  ? "Super Admin"
                  : user?.role === "service_tech"
                  ? "Service Technician"
                  : user?.role === "customer"
                  ? "Customer"
                  : user?.role || "—"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Notifications Section */}
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow border border-slate-200 dark:border-slate-700 mb-6">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Notifications</h3>
          <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">
            Configure how you receive notifications
          </p>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            {/* Email Notifications */}
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-900 dark:text-white">
                  Email notifications
                </label>
                <p className="text-sm text-gray-500 dark:text-slate-400">
                  Receive email updates about ticket activity
                </p>
              </div>
              <button
                onClick={handleEmailNotificationToggle}
                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:focus:ring-offset-slate-800 ${
                  notificationSettings.emailNotifications
                    ? "bg-primary-600"
                    : "bg-slate-200 dark:bg-slate-600"
                }`}
                role="switch"
                aria-checked={notificationSettings.emailNotifications}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    notificationSettings.emailNotifications ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>

            {/* Browser Notifications */}
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-900 dark:text-white">
                  Browser notifications
                </label>
                <p className="text-sm text-gray-500 dark:text-slate-400">
                  Get push notifications in your browser
                </p>
                {browserNotificationStatus === "denied" && (
                  <p className="text-xs text-danger-600 dark:text-danger-400 mt-1">
                    Notifications are blocked. Enable them in your browser settings.
                  </p>
                )}
              </div>
              <button
                onClick={handleBrowserNotificationToggle}
                disabled={browserNotificationStatus === "denied"}
                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:focus:ring-offset-slate-800 ${
                  notificationSettings.browserNotifications && browserNotificationStatus === "granted"
                    ? "bg-primary-600"
                    : "bg-slate-200 dark:bg-slate-600"
                } ${browserNotificationStatus === "denied" ? "opacity-50 cursor-not-allowed" : ""}`}
                role="switch"
                aria-checked={notificationSettings.browserNotifications}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    notificationSettings.browserNotifications && browserNotificationStatus === "granted"
                      ? "translate-x-5"
                      : "translate-x-0"
                  }`}
                />
              </button>
            </div>
          </div>
          <p className="text-xs text-gray-500 dark:text-slate-400 mt-4">
            Settings are saved automatically when changed.
          </p>
        </div>
      </div>

      {/* System Info Section */}
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow border border-slate-200 dark:border-slate-700">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">System Information</h3>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-500 dark:text-slate-400">Version:</span>
              <span className="ml-2 text-gray-900 dark:text-white">1.0.0</span>
            </div>
            <div>
              <span className="text-gray-500 dark:text-slate-400">Environment:</span>
              <span className="ml-2 text-gray-900 dark:text-white">
                {process.env.NODE_ENV === "production" ? "Production" : "Development"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
