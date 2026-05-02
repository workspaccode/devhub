import { useGetProfile, useUpdateProfile, getGetProfileQueryKey } from "@workspace/api-client-react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { Save } from "lucide-react";

const WORK_STATUS_OPTS = [
  { value: "employed", label: "Employed" },
  { value: "freelance", label: "Freelance" },
  { value: "open", label: "Open to Work" },
];

export default function ProfilePage() {
  const { data: profile } = useGetProfile();
  const { mutateAsync: updateProfile } = useUpdateProfile();
  const qc = useQueryClient();

  const [form, setForm] = useState({
    fullName: "", title: "", bio: "", location: "",
    currentCompany: "", currentRole: "", workStatus: "employed",
    skills: "", email: "", websiteUrl: "", avatarUrl: "",
  });
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (profile) {
      setForm({
        fullName: profile.fullName ?? "",
        title: profile.title ?? "",
        bio: profile.bio ?? "",
        location: profile.location ?? "",
        currentCompany: profile.currentCompany ?? "",
        currentRole: profile.currentRole ?? "",
        workStatus: profile.workStatus ?? "employed",
        skills: (profile.skills ?? []).join(", "),
        email: profile.email ?? "",
        websiteUrl: profile.websiteUrl ?? "",
        avatarUrl: profile.avatarUrl ?? "",
      });
    }
  }, [profile]);

  function set(key: string, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSave() {
    setLoading(true);
    try {
      await updateProfile({
        data: {
          fullName: form.fullName || undefined,
          title: form.title || undefined,
          bio: form.bio || undefined,
          location: form.location || undefined,
          currentCompany: form.currentCompany || undefined,
          currentRole: form.currentRole || undefined,
          workStatus: form.workStatus as any,
          skills: form.skills ? form.skills.split(",").map((s) => s.trim()).filter(Boolean) : [],
          email: form.email || undefined,
          websiteUrl: form.websiteUrl || undefined,
          avatarUrl: form.avatarUrl || undefined,
        },
      });
      await qc.invalidateQueries({ queryKey: getGetProfileQueryKey() });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setLoading(false);
    }
  }

  const Field = ({ label, field, placeholder, type = "text" }: { label: string; field: string; placeholder?: string; type?: string }) => (
    <div>
      <label className="text-xs text-muted-foreground block mb-1">{label}</label>
      <input
        type={type}
        value={(form as any)[field]}
        onChange={(e) => set(field, e.target.value)}
        placeholder={placeholder}
        className="w-full bg-background border border-border rounded px-3 py-2 text-sm focus:outline-none focus:border-primary/50"
      />
    </div>
  );

  return (
    <DashboardLayout>
      <div className="max-w-2xl space-y-6">
        <div className="border border-border rounded-xl bg-card p-6 space-y-4">
          <h2 className="text-sm font-mono font-medium">Personal Info</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Full Name" field="fullName" placeholder="Your Name" />
            <Field label="Username" field="username" placeholder="yourhandle" />
            <Field label="Title" field="title" placeholder="Senior Software Engineer" />
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Work Status</label>
              <select value={form.workStatus} onChange={(e) => set("workStatus", e.target.value)} className="w-full bg-background border border-border rounded px-3 py-2 text-sm focus:outline-none focus:border-primary/50">
                {WORK_STATUS_OPTS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="text-xs text-muted-foreground block mb-1">Bio</label>
            <textarea
              value={form.bio}
              onChange={(e) => set("bio", e.target.value)}
              rows={3}
              placeholder="A short bio about yourself..."
              className="w-full bg-background border border-border rounded px-3 py-2 text-sm focus:outline-none focus:border-primary/50 resize-none"
            />
          </div>
        </div>

        <div className="border border-border rounded-xl bg-card p-6 space-y-4">
          <h2 className="text-sm font-mono font-medium">Work</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Current Company" field="currentCompany" placeholder="RESC Company" />
            <Field label="Current Role" field="currentRole" placeholder="Senior Developer" />
            <Field label="Location" field="location" placeholder="Remote" />
          </div>
        </div>

        <div className="border border-border rounded-xl bg-card p-6 space-y-4">
          <h2 className="text-sm font-mono font-medium">Links & Skills</h2>
          <Field label="Email" field="email" type="email" placeholder="you@company.com" />
          <Field label="Website URL" field="websiteUrl" placeholder="https://yoursite.dev" />
          <Field label="Avatar URL" field="avatarUrl" placeholder="https://..." />
          <div>
            <label className="text-xs text-muted-foreground block mb-1">Skills (comma-separated)</label>
            <input
              value={form.skills}
              onChange={(e) => set("skills", e.target.value)}
              placeholder="TypeScript, React, Node.js, Go..."
              className="w-full bg-background border border-border rounded px-3 py-2 text-sm focus:outline-none focus:border-primary/50"
            />
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={loading}
          className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary/10 border border-primary/30 text-primary text-sm hover:bg-primary/20 transition-colors disabled:opacity-50"
        >
          <Save size={14} />
          {saved ? "Saved!" : loading ? "Saving..." : "Save Profile"}
        </button>
      </div>
    </DashboardLayout>
  );
}
