"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";

// Dynamic imports for chat and queue components
const ChatWindow = dynamic(() => import("@/components/chat/ChatWindow"), { ssr: false });
const PhoneQueueStatus = dynamic(() => import("@/components/queue/PhoneQueueStatus"), { ssr: false });

interface CreatedTicket {
  id: string;
  ticketNumber: string;
  subject: string;
}

type FormStep = "form" | "contact-method" | "chat" | "phone-queue";

/**
 * Customer Ticket Submission Page
 * Simple, mobile-friendly form for customers to submit service tickets
 */

interface Site {
  id: string;
  name: string;
  address: string;
}

interface Machine {
  id: string;
  name: string;
  model: string;
  serialNumber: string | null;
  siteId: string;
}

export default function NewTicketPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [sites, setSites] = useState<Site[]>([]);
  const [machines, setMachines] = useState<Machine[]>([]);
  const [filteredMachines, setFilteredMachines] = useState<Machine[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);

  const [formData, setFormData] = useState({
    siteId: "",
    machineId: "",
    subject: "",
    description: "",
    category: "",
    priority: "medium",
    machineDown: false,
    errorCode: "",
    frequency: "",
    stepsToReproduce: "",
    firstOccurred: "",
    lastOccurred: "",
  });

  // Issue category options - using simple SVG icons for uniform appearance
  const categoryOptions = [
    { value: "mechanical", label: "Mechanical", desc: "Jams, feeders, transport" },
    { value: "electrical", label: "Electrical", desc: "Power, motors, sensors" },
    { value: "software", label: "Software", desc: "DirectConnect, firmware" },
    { value: "scanner_camera", label: "Scanner/Camera", desc: "Barcode, OCR, vision" },
    { value: "network", label: "Network", desc: "Connectivity, remote access" },
    { value: "consumables", label: "Consumables", desc: "Ink, labels, envelopes" },
    { value: "training", label: "Training", desc: "How-to, guidance" },
    { value: "preventive_maintenance", label: "Maintenance", desc: "Scheduled service" },
    { value: "equipment_change", label: "Equipment", desc: "New or removed machine" },
    { value: "other", label: "Other", desc: "Something else" },
  ];

  // Category icons as simple SVG components
  const getCategoryIcon = (value: string) => {
    const iconClass = "w-6 h-6";
    switch (value) {
      case "mechanical":
        return (
          <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        );
      case "electrical":
        return (
          <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        );
      case "software":
        return (
          <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        );
      case "scanner_camera":
        return (
          <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        );
      case "network":
        return (
          <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
          </svg>
        );
      case "consumables":
        return (
          <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
        );
      case "training":
        return (
          <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
        );
      case "preventive_maintenance":
        return (
          <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 11-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 004.486-6.336l-3.276 3.277a3.004 3.004 0 01-2.25-2.25l3.276-3.276a4.5 4.5 0 00-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085m-1.745 1.437L5.909 7.5H4.5L3 4.5l1.5-1.5 3 1.5v1.409l4.26 4.26m-1.745 1.437l1.745-1.437" />
          </svg>
        );
      case "equipment_change":
        return (
          <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
          </svg>
        );
      case "other":
      default:
        return (
          <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
    }
  };

  const [photos, setPhotos] = useState<File[]>([]);
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);
  const [videos, setVideos] = useState<File[]>([]);
  const [videoPreviews, setVideoPreviews] = useState<string[]>([]);

  // Multi-step form state
  const [formStep, setFormStep] = useState<FormStep>("form");
  const [createdTicket, setCreatedTicket] = useState<CreatedTicket | null>(null);
  const [queueEntryId, setQueueEntryId] = useState<string | null>(null);

  useEffect(() => {
    const userData = sessionStorage.getItem("user");
    if (userData) {
      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);
      fetchData(parsedUser);
    }
  }, []);

  const fetchData = async (user: any) => {
    try {
      if (user.companyId) {
        // Fetch sites
        const sitesRes = await fetch(`/api/sites?companyId=${user.companyId}`);
        if (sitesRes.ok) {
          const sitesData = await sitesRes.json();
          setSites(sitesData);
        }

        // Fetch machines
        const machinesRes = await fetch(`/api/machines?companyId=${user.companyId}`);
        if (machinesRes.ok) {
          const machinesData = await machinesRes.json();
          setMachines(machinesData);
        }
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Filter machines when site is selected
  useEffect(() => {
    if (formData.siteId) {
      const filtered = machines.filter((m) => m.siteId === formData.siteId);
      setFilteredMachines(filtered);
      // Reset machine selection if current machine is not in filtered list
      if (formData.machineId && !filtered.find((m) => m.id === formData.machineId)) {
        setFormData({ ...formData, machineId: "" });
      }
    } else {
      setFilteredMachines([]);
      setFormData({ ...formData, machineId: "" });
    }
  }, [formData.siteId, machines]);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      
      // Limit to 5 photos
      if (files.length + photos.length > 5) {
        alert("Maximum 5 photos allowed");
        return;
      }

      // Validate file sizes (max 5MB each)
      const oversizedFiles = files.filter(f => f.size > 5 * 1024 * 1024);
      if (oversizedFiles.length > 0) {
        alert(`Some files are too large. Maximum size is 5MB per file.`);
        return;
      }

      // Create previews
      const newPreviews: string[] = [];
      files.forEach((file) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          newPreviews.push(reader.result as string);
          if (newPreviews.length === files.length) {
            setPhotoPreviews([...photoPreviews, ...newPreviews]);
          }
        };
        reader.readAsDataURL(file);
      });

      setPhotos([...photos, ...files]);
    }
  };

  const handleVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      
      // Limit to 2 videos
      if (files.length + videos.length > 2) {
        alert("Maximum 2 videos allowed");
        return;
      }

      // Validate file sizes (max 50MB each for videos)
      const oversizedFiles = files.filter(f => f.size > 50 * 1024 * 1024);
      if (oversizedFiles.length > 0) {
        alert(`Some videos are too large. Maximum size is 50MB per video.`);
        return;
      }

      // Create previews
      const newPreviews: string[] = [];
      files.forEach((file) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          newPreviews.push(reader.result as string);
          if (newPreviews.length === files.length) {
            setVideoPreviews([...videoPreviews, ...newPreviews]);
          }
        };
        reader.readAsDataURL(file);
      });

      setVideos([...videos, ...files]);
    }
  };

  const removePhoto = (index: number) => {
    setPhotos(photos.filter((_, i) => i !== index));
    setPhotoPreviews(photoPreviews.filter((_, i) => i !== index));
  };

  const removeVideo = (index: number) => {
    setVideos(videos.filter((_, i) => i !== index));
    setVideoPreviews(videoPreviews.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate required fields
    if (!formData.siteId) {
      alert("Please select a location from the list");
      document.getElementById("siteId")?.focus();
      return;
    }

    if (!formData.subject || !formData.subject.trim()) {
      alert("Please enter a subject for the ticket");
      document.getElementById("subject")?.focus();
      return;
    }

    if (!formData.description || !formData.description.trim()) {
      alert("Please enter a description of the issue");
      document.getElementById("description")?.focus();
      return;
    }

    setSubmitting(true);
    setUploadingPhotos(true);

    try {
      // Build enhanced description with additional fields
      let enhancedDescription = formData.description;
      
      if (formData.errorCode) {
        enhancedDescription += `\n\nError Code: ${formData.errorCode}`;
      }
      if (formData.frequency) {
        enhancedDescription += `\n\nFrequency: ${formData.frequency}`;
      }
      if (formData.stepsToReproduce) {
        enhancedDescription += `\n\nSteps to Reproduce:\n${formData.stepsToReproduce}`;
      }
      if (formData.firstOccurred) {
        enhancedDescription += `\n\nFirst Occurred: ${new Date(formData.firstOccurred).toLocaleString()}`;
      }
      if (formData.lastOccurred) {
        enhancedDescription += `\n\nLast Occurred: ${new Date(formData.lastOccurred).toLocaleString()}`;
      }

      // Create ticket
      const response = await fetch("/api/tickets", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          companyId: user.companyId,
          siteId: formData.siteId,
          machineId: formData.machineId || null,
          subject: formData.subject,
          description: enhancedDescription,
          category: formData.category || null,
          priority: formData.priority,
          status: "open",
          machineDown: formData.machineDown,
          // Don't send createdById - let API use site's primary contact
        }),
      });

      if (response.ok) {
        const ticket = await response.json();

        // Upload photos and videos if any
        const allFiles = [...photos, ...videos];
        if (allFiles.length > 0) {
          try {
            const uploadFormData = new FormData();
            uploadFormData.append("ticketId", ticket.id);
            uploadFormData.append("uploadedById", user.id);
            allFiles.forEach((file) => {
              uploadFormData.append("files", file);
            });

            const uploadResponse = await fetch("/api/attachments/upload", {
              method: "POST",
              body: uploadFormData,
            });

            if (!uploadResponse.ok) {
              console.error("Failed to upload files, but ticket was created");
              // Continue anyway - ticket is created
            }
          } catch (uploadError) {
            console.error("Error uploading files:", uploadError);
            // Continue anyway - ticket is created
          }
        }

        // Store created ticket info and show contact method selection
        setCreatedTicket({
          id: ticket.id,
          ticketNumber: ticket.ticketNumber,
          subject: ticket.subject,
        });
        setFormStep("contact-method");
      } else {
        const data = await response.json();
        alert(data.error || "Failed to submit ticket");
      }
    } catch (error) {
      console.error("Error submitting ticket:", error);
      alert("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
      setUploadingPhotos(false);
    }
  };

  // Handler for selecting chat as contact method
  const handleSelectChat = async () => {
    if (!createdTicket || !user) return;
    try {
      // Update ticket with contact method
      await fetch(`/api/tickets/${createdTicket.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contactMethod: "chat" }),
      });

      // Send initial chat message with ticket info
      await fetch("/api/chat/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ticketId: createdTicket.id,
          senderId: user.id,
          content: `New ticket submitted: ${createdTicket.subject}\n\nI'm ready to troubleshoot via chat.`,
        }),
      });

      setFormStep("chat");
    } catch (error) {
      console.error("Error starting chat:", error);
      alert("Failed to start chat. Please try again.");
    }
  };

  // Handler for selecting phone as contact method
  const handleSelectPhone = async () => {
    if (!createdTicket || !user) return;
    try {
      // Update ticket with contact method
      await fetch(`/api/tickets/${createdTicket.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contactMethod: "phone" }),
      });

      // Join phone queue
      const queueResponse = await fetch("/api/queue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ticketId: createdTicket.id,
          customerId: user.id,
        }),
      });

      if (queueResponse.ok) {
        const queueEntry = await queueResponse.json();
        setQueueEntryId(queueEntry.id);
        setFormStep("phone-queue");
      } else {
        alert("Failed to join phone queue. Please try again.");
      }
    } catch (error) {
      console.error("Error joining phone queue:", error);
      alert("Failed to join phone queue. Please try again.");
    }
  };

  // Handler to skip troubleshooting and just view the ticket
  const handleSkipTroubleshooting = () => {
    if (createdTicket) {
      router.push(`/customer/tickets/${createdTicket.id}?success=true`);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-slate-500 dark:text-slate-400">Loading form...</p>
        </div>
      </div>
    );
  }

  if (sites.length === 0) {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="card p-8 text-center dark:bg-slate-800 dark:border-slate-700">
          <svg className="w-16 h-16 text-slate-400 dark:text-slate-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">No Locations Available</h2>
          <p className="text-slate-600 dark:text-slate-400 mb-6">
            You don't have any locations set up yet. Please contact your administrator to add locations to your account.
          </p>
          <Link href="/customer" className="btn-primary">
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  // Contact method selection screen
  if (formStep === "contact-method" && createdTicket) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="card p-8 text-center dark:bg-slate-800 dark:border-slate-700">
          {/* Success checkmark */}
          <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>

          <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Ticket Submitted!</h1>
          <p className="text-slate-600 dark:text-slate-400 mb-2">
            Your ticket <span className="font-semibold text-primary-600 dark:text-primary-400">#{createdTicket.ticketNumber}</span> has been created.
          </p>
          <p className="text-slate-500 dark:text-slate-400 text-sm mb-8">
            {createdTicket.subject}
          </p>

          <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
            How would you like to proceed?
          </h2>
          <p className="text-slate-600 dark:text-slate-400 mb-6">
            Get help from a technician right now, or view your ticket later.
          </p>

          {/* Contact options */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {/* Online Chat Option */}
            <button
              onClick={handleSelectChat}
              className="p-6 border-2 border-slate-200 dark:border-slate-600 rounded-xl hover:border-blue-500 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all group"
            >
              <div className="w-14 h-14 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-blue-200 dark:group-hover:bg-blue-900/50 transition-colors">
                <svg className="w-7 h-7 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">Online Chat</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Chat with a technician in real-time. Video call available if needed.
              </p>
            </button>

            {/* Phone Call Option */}
            <button
              onClick={handleSelectPhone}
              className="p-6 border-2 border-slate-200 dark:border-slate-600 rounded-xl hover:border-green-500 dark:hover:border-green-500 hover:bg-green-50 dark:hover:bg-green-900/20 transition-all group"
            >
              <div className="w-14 h-14 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-green-200 dark:group-hover:bg-green-900/50 transition-colors">
                <svg className="w-7 h-7 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">Phone Call</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Join the queue for a callback. Video call available during the call.
              </p>
            </button>
          </div>

          {/* Skip option */}
          <button
            onClick={handleSkipTroubleshooting}
            className="text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 text-sm underline"
          >
            Skip for now - I'll view my ticket later
          </button>
        </div>
      </div>
    );
  }

  // Chat interface
  if (formStep === "chat" && createdTicket && user) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="mb-4">
          <Link
            href={`/customer/tickets/${createdTicket.id}`}
            className="inline-flex items-center text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            View Ticket Details
          </Link>
        </div>
        <ChatWindow
          ticketId={createdTicket.id}
          ticketNumber={createdTicket.ticketNumber}
          currentUserId={user.id}
          currentUserName={user.name || user.email}
          onClose={() => router.push(`/customer/tickets/${createdTicket.id}`)}
        />
      </div>
    );
  }

  // Phone queue interface
  if (formStep === "phone-queue" && createdTicket && user) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="mb-4">
          <Link
            href={`/customer/tickets/${createdTicket.id}`}
            className="inline-flex items-center text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            View Ticket Details
          </Link>
        </div>
        <PhoneQueueStatus
          ticketId={createdTicket.id}
          ticketNumber={createdTicket.ticketNumber}
          ticketSubject={createdTicket.subject}
          customerId={user.id}
          queueEntryId={queueEntryId || undefined}
          onClose={() => router.push(`/customer/tickets/${createdTicket.id}`)}
        />
      </div>
    );
  }

  // Default: Ticket submission form
  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/customer"
          className="inline-flex items-center text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white mb-4"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Dashboard
        </Link>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Submit Service Ticket</h1>
        <p className="mt-2 text-slate-600 dark:text-slate-400">
          Describe the issue you're experiencing and we'll get a technician on it right away.
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="card p-6 md:p-8 space-y-6 dark:bg-slate-800 dark:border-slate-700">
        {/* Site Selection */}
        <div>
          <label htmlFor="siteId" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
            Location *
          </label>
          {sites.length === 0 ? (
            <div className="input bg-slate-50 dark:bg-slate-700 text-slate-500 dark:text-slate-400">
              No locations available. Please contact support.
            </div>
          ) : (
            <select
              id="siteId"
              value={formData.siteId}
              onChange={(e) => setFormData({ ...formData, siteId: e.target.value })}
              className="input dark:bg-slate-700 dark:border-slate-600 dark:text-white"
              required
            >
              <option value="">-- Select a location --</option>
              {sites.map((site) => (
                <option key={site.id} value={site.id}>
                  {site.name} {site.address && `- ${site.address}`}
                </option>
              ))}
            </select>
          )}
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Which location is experiencing the issue?
          </p>
        </div>

        {/* Machine Selection */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
            Machine (Optional)
          </label>
          {!formData.siteId ? (
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Select a location first to see available machines
            </p>
          ) : filteredMachines.length === 0 ? (
            <p className="text-xs text-slate-500 dark:text-slate-400">
              No machines found at this location
            </p>
          ) : (
            <div className="space-y-2">
              {/* General Issue Option */}
              <button
                type="button"
                onClick={() => setFormData({ ...formData, machineId: "" })}
                className={`w-full p-3 border-2 rounded-lg text-left transition-all flex items-center gap-3 ${
                  formData.machineId === ""
                    ? "border-primary-500 bg-primary-50 dark:bg-primary-900/20 ring-2 ring-primary-200 dark:ring-primary-800"
                    : "border-slate-200 dark:border-slate-600 hover:border-slate-300 dark:hover:border-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700"
                }`}
              >
                <div className={`flex-shrink-0 ${formData.machineId === "" ? "text-primary-600 dark:text-primary-400" : "text-slate-400 dark:text-slate-500"}`}>
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <div>
                  <div className="font-semibold text-slate-900 dark:text-white text-sm">General Issue</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">Not specific to a machine</div>
                </div>
              </button>

              {/* Machine Options */}
              {filteredMachines.map((machine) => (
                <button
                  key={machine.id}
                  type="button"
                  onClick={() => setFormData({ ...formData, machineId: machine.id })}
                  className={`w-full p-3 border-2 rounded-lg text-left transition-all flex items-center gap-3 ${
                    formData.machineId === machine.id
                      ? "border-primary-500 bg-primary-50 dark:bg-primary-900/20 ring-2 ring-primary-200 dark:ring-primary-800"
                      : "border-slate-200 dark:border-slate-600 hover:border-slate-300 dark:hover:border-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700"
                  }`}
                >
                  <div className={`flex-shrink-0 ${formData.machineId === machine.id ? "text-primary-600 dark:text-primary-400" : "text-slate-400 dark:text-slate-500"}`}>
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5.25 14.25h13.5m-13.5 0a3 3 0 01-3-3m3 3a3 3 0 100 6h13.5a3 3 0 100-6m-16.5-3a3 3 0 013-3h13.5a3 3 0 013 3m-19.5 0a4.5 4.5 0 01.9-2.7L5.737 5.1a3.375 3.375 0 012.7-1.35h7.126c1.062 0 2.062.5 2.7 1.35l2.587 3.45a4.5 4.5 0 01.9 2.7m0 0a3 3 0 01-3 3m0 3h.008v.008h-.008v-.008zm0-6h.008v.008h-.008v-.008zm-3 6h.008v.008h-.008v-.008zm0-6h.008v.008h-.008v-.008z" />
                    </svg>
                  </div>
                  <div className="flex-grow min-w-0">
                    <div className="font-semibold text-slate-900 dark:text-white text-sm truncate">{machine.name}</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 truncate">
                      {machine.model}
                      {machine.serialNumber && ` • SN: ${machine.serialNumber}`}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Machine Down Checkbox */}
        <div className="flex items-start">
          <div className="flex items-center h-5">
            <input
              id="machineDown"
              type="checkbox"
              checked={formData.machineDown}
              onChange={(e) => setFormData({ ...formData, machineDown: e.target.checked })}
              className="w-5 h-5 text-red-600 border-slate-300 dark:border-slate-600 rounded focus:ring-red-500 dark:bg-slate-700"
            />
          </div>
          <div className="ml-3">
            <label htmlFor="machineDown" className="font-semibold text-slate-700 dark:text-slate-300">
              Machine is down (urgent)
            </label>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Check this if the machine is completely non-operational and needs immediate attention
            </p>
          </div>
        </div>

        {/* Priority Selection */}
        <div>
          <label htmlFor="priority" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
            Priority
          </label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { value: "low", label: "Low", color: "slate", desc: "Can wait" },
              { value: "medium", label: "Normal", color: "blue", desc: "Standard" },
              { value: "high", label: "High", color: "yellow", desc: "Soon" },
              { value: "urgent", label: "Urgent", color: "red", desc: "ASAP" },
            ].map((priority) => (
              <button
                key={priority.value}
                type="button"
                onClick={() => setFormData({ ...formData, priority: priority.value })}
                className={`p-3 border-2 rounded-lg text-center transition-all ${
                  formData.priority === priority.value
                    ? `border-${priority.color}-500 bg-${priority.color}-50 dark:bg-${priority.color}-900/20`
                    : "border-slate-200 dark:border-slate-600 hover:border-slate-300 dark:hover:border-slate-500"
                }`}
              >
                <div className="font-semibold text-slate-900 dark:text-white">{priority.label}</div>
                <div className="text-xs text-slate-500 dark:text-slate-400">{priority.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Issue Category Selection */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
            Issue Type
          </label>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
            Select the category that best describes your issue (optional but helps us route to the right tech)
          </p>
          <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
            {categoryOptions.map((cat) => (
              <button
                key={cat.value}
                type="button"
                onClick={() => setFormData({ ...formData, category: formData.category === cat.value ? "" : cat.value })}
                className={`p-3 border-2 rounded-lg text-center transition-all ${
                  formData.category === cat.value
                    ? "border-primary-500 bg-primary-50 dark:bg-primary-900/20 ring-2 ring-primary-200 dark:ring-primary-800"
                    : "border-slate-200 dark:border-slate-600 hover:border-slate-300 dark:hover:border-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700"
                }`}
              >
                <div className={`mb-1 flex justify-center ${formData.category === cat.value ? "text-primary-600 dark:text-primary-400" : "text-slate-500 dark:text-slate-400"}`}>
                  {getCategoryIcon(cat.value)}
                </div>
                <div className="font-semibold text-slate-900 dark:text-white text-sm">{cat.label}</div>
                <div className="text-xs text-slate-500 dark:text-slate-400 hidden md:block">{cat.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Subject */}
        <div>
          <label htmlFor="subject" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
            What's the issue? *
          </label>
          <input
            id="subject"
            type="text"
            value={formData.subject}
            onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
            className="input dark:bg-slate-700 dark:border-slate-600 dark:text-white dark:placeholder-slate-400"
            placeholder="e.g., Machine is jamming on every run"
            required
          />
        </div>

        {/* Description */}
        <div>
          <label htmlFor="description" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
            Description of Issue *
          </label>
          <textarea
            id="description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="input min-h-[120px] dark:bg-slate-700 dark:border-slate-600 dark:text-white dark:placeholder-slate-400"
            placeholder="Please describe what's happening, when it started, any error messages, etc."
            rows={5}
            required
          />
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            The more details you provide, the faster we can help!
          </p>
        </div>

        {/* Error Code */}
        <div>
          <label htmlFor="errorCode" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
            Error Code (if applicable)
          </label>
          <input
            id="errorCode"
            type="text"
            value={formData.errorCode}
            onChange={(e) => setFormData({ ...formData, errorCode: e.target.value })}
            className="input dark:bg-slate-700 dark:border-slate-600 dark:text-white dark:placeholder-slate-400"
            placeholder="e.g., E001, JAM-001, etc."
          />
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            If the machine displays an error code, enter it here
          </p>
        </div>

        {/* Frequency */}
        <div>
          <label htmlFor="frequency" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
            How often does this occur?
          </label>
          <select
            id="frequency"
            value={formData.frequency}
            onChange={(e) => setFormData({ ...formData, frequency: e.target.value })}
            className="input dark:bg-slate-700 dark:border-slate-600 dark:text-white"
          >
            <option value="">Select frequency</option>
            <option value="once">Once / First time</option>
            <option value="occasional">Occasionally (few times)</option>
            <option value="frequent">Frequently (many times)</option>
            <option value="every_time">Every time / Constant</option>
          </select>
        </div>

        {/* Steps to Reproduce */}
        <div>
          <label htmlFor="stepsToReproduce" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
            Steps to Reproduce (if known)
          </label>
          <textarea
            id="stepsToReproduce"
            value={formData.stepsToReproduce}
            onChange={(e) => setFormData({ ...formData, stepsToReproduce: e.target.value })}
            className="input min-h-[80px] dark:bg-slate-700 dark:border-slate-600 dark:text-white dark:placeholder-slate-400"
            placeholder="1. Step one...&#10;2. Step two...&#10;3. Then the issue occurs..."
            rows={4}
          />
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            If you know the steps that lead to the issue, please list them
          </p>
        </div>

        {/* When it first/last occurred */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="firstOccurred" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
              When did this first occur?
            </label>
            <input
              id="firstOccurred"
              type="datetime-local"
              value={formData.firstOccurred}
              onChange={(e) => setFormData({ ...formData, firstOccurred: e.target.value })}
              className="input dark:bg-slate-700 dark:border-slate-600 dark:text-white"
            />
          </div>
          <div>
            <label htmlFor="lastOccurred" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
              When did this last occur?
            </label>
            <input
              id="lastOccurred"
              type="datetime-local"
              value={formData.lastOccurred}
              onChange={(e) => setFormData({ ...formData, lastOccurred: e.target.value })}
              className="input dark:bg-slate-700 dark:border-slate-600 dark:text-white"
            />
          </div>
        </div>

        {/* Photo Upload */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
            Photos (Optional)
          </label>
          <div className="border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg p-6 text-center hover:border-slate-400 dark:hover:border-slate-500 transition-colors">
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handlePhotoChange}
              className="hidden"
              id="photo-upload"
              disabled={photos.length >= 5}
            />
            <label
              htmlFor="photo-upload"
              className={`cursor-pointer ${photos.length >= 5 ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              <svg className="w-12 h-12 text-slate-400 dark:text-slate-500 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                <span className="font-semibold text-primary-600 dark:text-primary-400">Click to upload photos</span> or drag and drop
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Up to 5 photos (JPG, PNG, max 5MB each)
              </p>
            </label>
          </div>

          {/* Photo Previews */}
          {photoPreviews.length > 0 && (
            <div className="mt-4 grid grid-cols-2 md:grid-cols-5 gap-4">
              {photoPreviews.map((preview, index) => (
                <div key={index} className="relative group">
                  <img
                    src={preview}
                    alt={`Preview ${index + 1}`}
                    className="w-full h-24 object-cover rounded-lg border border-slate-200 dark:border-slate-600"
                  />
                  <button
                    type="button"
                    onClick={() => removePhoto(index)}
                    className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Video Upload */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
            Videos (Optional)
          </label>
          <div className="border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg p-6 text-center hover:border-slate-400 dark:hover:border-slate-500 transition-colors">
            <input
              type="file"
              accept="video/*"
              multiple
              onChange={handleVideoChange}
              className="hidden"
              id="video-upload"
              disabled={videos.length >= 2}
            />
            <label
              htmlFor="video-upload"
              className={`cursor-pointer ${videos.length >= 2 ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              <svg className="w-12 h-12 text-slate-400 dark:text-slate-500 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                <span className="font-semibold text-primary-600 dark:text-primary-400">Click to upload videos</span> or drag and drop
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Up to 2 videos (MP4, MOV, max 50MB each)
              </p>
            </label>
          </div>

          {/* Video Previews */}
          {videoPreviews.length > 0 && (
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              {videoPreviews.map((preview, index) => (
                <div key={index} className="relative group">
                  <video
                    src={preview}
                    className="w-full h-32 object-cover rounded-lg border border-slate-200 dark:border-slate-600"
                    controls
                  />
                  <button
                    type="button"
                    onClick={() => removeVideo(index)}
                    className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Submit Button */}
        <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
          <button
            type="submit"
            disabled={submitting}
            className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {submitting || uploadingPhotos ? (
              <>
                <svg className="animate-spin h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                {uploadingPhotos ? "Uploading files..." : "Submitting..."}
              </>
            ) : (
              <>
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Submit Ticket
              </>
            )}
          </button>
          <p className="mt-3 text-center text-sm text-slate-500 dark:text-slate-400">
            You'll receive a confirmation with your ticket number
          </p>
        </div>
      </form>
    </div>
  );
}

