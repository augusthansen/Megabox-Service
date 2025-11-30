"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

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
    priority: "medium",
    machineDown: false,
    errorCode: "",
    frequency: "",
    stepsToReproduce: "",
    firstOccurred: "",
    lastOccurred: "",
  });

  const [photos, setPhotos] = useState<File[]>([]);
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);
  const [videos, setVideos] = useState<File[]>([]);
  const [videoPreviews, setVideoPreviews] = useState<string[]>([]);

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
        
        // Redirect to success page with ticket number
        router.push(`/customer/tickets/${ticket.id}?success=true`);
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-slate-500">Loading form...</p>
        </div>
      </div>
    );
  }

  if (sites.length === 0) {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="card p-8 text-center">
          <svg className="w-16 h-16 text-slate-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <h2 className="text-xl font-bold text-slate-900 mb-2">No Locations Available</h2>
          <p className="text-slate-600 mb-6">
            You don't have any locations set up yet. Please contact your administrator to add locations to your account.
          </p>
          <Link href="/customer" className="btn-primary">
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/customer"
          className="inline-flex items-center text-sm text-slate-600 hover:text-slate-900 mb-4"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Dashboard
        </Link>
        <h1 className="text-3xl font-bold text-slate-900">Submit Service Ticket</h1>
        <p className="mt-2 text-slate-600">
          Describe the issue you're experiencing and we'll get a technician on it right away.
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="card p-6 md:p-8 space-y-6">
        {/* Site Selection */}
        <div>
          <label htmlFor="siteId" className="block text-sm font-semibold text-slate-700 mb-2">
            Location *
          </label>
          {sites.length === 0 ? (
            <div className="input bg-slate-50 text-slate-500">
              No locations available. Please contact support.
            </div>
          ) : (
            <select
              id="siteId"
              value={formData.siteId}
              onChange={(e) => setFormData({ ...formData, siteId: e.target.value })}
              className="input"
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
          <p className="mt-1 text-xs text-slate-500">
            Which location is experiencing the issue?
          </p>
        </div>

        {/* Machine Selection */}
        <div>
          <label htmlFor="machineId" className="block text-sm font-semibold text-slate-700 mb-2">
            Machine (Optional)
          </label>
          <select
            id="machineId"
            value={formData.machineId}
            onChange={(e) => setFormData({ ...formData, machineId: e.target.value })}
            className="input"
            disabled={!formData.siteId}
          >
            <option value="">General issue (not machine-specific)</option>
            {filteredMachines.map((machine) => (
              <option key={machine.id} value={machine.id}>
                {machine.name} - {machine.model}
                {machine.serialNumber && ` (SN: ${machine.serialNumber})`}
              </option>
            ))}
          </select>
          {!formData.siteId && (
            <p className="mt-1 text-xs text-slate-500">
              Select a location first to see available machines
            </p>
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
              className="w-5 h-5 text-red-600 border-slate-300 rounded focus:ring-red-500"
            />
          </div>
          <div className="ml-3">
            <label htmlFor="machineDown" className="font-semibold text-slate-700">
              🚨 Machine is down (urgent)
            </label>
            <p className="text-sm text-slate-500">
              Check this if the machine is completely non-operational and needs immediate attention
            </p>
          </div>
        </div>

        {/* Priority Selection */}
        <div>
          <label htmlFor="priority" className="block text-sm font-semibold text-slate-700 mb-2">
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
                    ? `border-${priority.color}-500 bg-${priority.color}-50`
                    : "border-slate-200 hover:border-slate-300"
                }`}
              >
                <div className="font-semibold text-slate-900">{priority.label}</div>
                <div className="text-xs text-slate-500">{priority.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Subject */}
        <div>
          <label htmlFor="subject" className="block text-sm font-semibold text-slate-700 mb-2">
            What's the issue? *
          </label>
          <input
            id="subject"
            type="text"
            value={formData.subject}
            onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
            className="input"
            placeholder="e.g., Machine is jamming on every run"
            required
          />
        </div>

        {/* Description */}
        <div>
          <label htmlFor="description" className="block text-sm font-semibold text-slate-700 mb-2">
            Description of Issue *
          </label>
          <textarea
            id="description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="input min-h-[120px]"
            placeholder="Please describe what's happening, when it started, any error messages, etc."
            rows={5}
            required
          />
          <p className="mt-1 text-xs text-slate-500">
            The more details you provide, the faster we can help!
          </p>
        </div>

        {/* Error Code */}
        <div>
          <label htmlFor="errorCode" className="block text-sm font-semibold text-slate-700 mb-2">
            Error Code (if applicable)
          </label>
          <input
            id="errorCode"
            type="text"
            value={formData.errorCode}
            onChange={(e) => setFormData({ ...formData, errorCode: e.target.value })}
            className="input"
            placeholder="e.g., E001, JAM-001, etc."
          />
          <p className="mt-1 text-xs text-slate-500">
            If the machine displays an error code, enter it here
          </p>
        </div>

        {/* Frequency */}
        <div>
          <label htmlFor="frequency" className="block text-sm font-semibold text-slate-700 mb-2">
            How often does this occur?
          </label>
          <select
            id="frequency"
            value={formData.frequency}
            onChange={(e) => setFormData({ ...formData, frequency: e.target.value })}
            className="input"
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
          <label htmlFor="stepsToReproduce" className="block text-sm font-semibold text-slate-700 mb-2">
            Steps to Reproduce (if known)
          </label>
          <textarea
            id="stepsToReproduce"
            value={formData.stepsToReproduce}
            onChange={(e) => setFormData({ ...formData, stepsToReproduce: e.target.value })}
            className="input min-h-[80px]"
            placeholder="1. Step one...&#10;2. Step two...&#10;3. Then the issue occurs..."
            rows={4}
          />
          <p className="mt-1 text-xs text-slate-500">
            If you know the steps that lead to the issue, please list them
          </p>
        </div>

        {/* When it first/last occurred */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="firstOccurred" className="block text-sm font-semibold text-slate-700 mb-2">
              When did this first occur?
            </label>
            <input
              id="firstOccurred"
              type="datetime-local"
              value={formData.firstOccurred}
              onChange={(e) => setFormData({ ...formData, firstOccurred: e.target.value })}
              className="input"
            />
          </div>
          <div>
            <label htmlFor="lastOccurred" className="block text-sm font-semibold text-slate-700 mb-2">
              When did this last occur?
            </label>
            <input
              id="lastOccurred"
              type="datetime-local"
              value={formData.lastOccurred}
              onChange={(e) => setFormData({ ...formData, lastOccurred: e.target.value })}
              className="input"
            />
          </div>
        </div>

        {/* Photo Upload */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">
            Photos (Optional)
          </label>
          <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center hover:border-slate-400 transition-colors">
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
              <svg className="w-12 h-12 text-slate-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <p className="text-sm text-slate-600">
                <span className="font-semibold text-primary-600">Click to upload photos</span> or drag and drop
              </p>
              <p className="text-xs text-slate-500 mt-1">
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
                    className="w-full h-24 object-cover rounded-lg border border-slate-200"
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
          <label className="block text-sm font-semibold text-slate-700 mb-2">
            Videos (Optional)
          </label>
          <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center hover:border-slate-400 transition-colors">
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
              <svg className="w-12 h-12 text-slate-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              <p className="text-sm text-slate-600">
                <span className="font-semibold text-primary-600">Click to upload videos</span> or drag and drop
              </p>
              <p className="text-xs text-slate-500 mt-1">
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
                    className="w-full h-32 object-cover rounded-lg border border-slate-200"
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
        <div className="pt-4 border-t border-slate-200">
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
          <p className="mt-3 text-center text-sm text-slate-500">
            You'll receive a confirmation with your ticket number
          </p>
        </div>
      </form>
    </div>
  );
}

