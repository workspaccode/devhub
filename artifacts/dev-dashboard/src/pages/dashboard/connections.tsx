import {
  useListPlatforms,
  useDisconnectPlatform,
  useSyncPlatform,
  useConnectPlatform,
  getListPlatformsQueryKey,
} from "@workspace/api-client-react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { formatRelative, formatDate, PLATFORM_LABELS } from "@/lib/utils";
import { PlatformIcon } from "@/components/PlatformIcon";
import { RefreshCw, Unplug, AlertTriangle, CheckCircle2, Circle } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

const PLATFORM_DOCS: Record<string, { desc: string; oauthHint: string }> = {
  github: {
    desc: "Connect to GitHub to view repos, issues, pull requests, and contribution activity.",
    oauthHint: "You'll need a GitHub Personal Access Token with scopes: repo, read:user, read:org",
  },
  gitlab: {
    desc: "Connect to GitLab to view projects, merge requests, and pipeline activity.",
    oauthHint: "You'll need a GitLab Personal Access Token with scopes: api, read_user",
  },
  bitbucket: {
    desc: "Connect to Bitbucket to view repositories and pull requests.",
    oauthHint: "You'll need a Bitbucket App Password with repository and pullrequest permissions",
  },
  slack: {
    desc: "Connect to Slack to view channels and recent workspace activity.",
    oauthHint: "You'll need a Slack User OAuth Token (xoxp-...)",
  },
  zoho: {
    desc: "Connect Zoho Mail to view recent company emails.",
    oauthHint: "You'll need a Zoho Mail OAuth access token",
  },
};

function ConnectModal({ platform, onClose }: { platform: string; onClose: () => void }) {
  const [token, setToken] = useState("");
  const [username, setUsername] = useState("");
  const { mutateAsync: connectPlatform } = useConnectPlatform();
  const qc = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleConnect() {
    if (!token.trim()) { setError("Token is required"); return; }
    setLoading(true);
    setError("");
    try {
      await connectPlatform({
        platform: platform as any,
        data: { accessToken: token.trim(), username: username.trim() || undefined },
      });
      await qc.invalidateQueries({ queryKey: getListPlatformsQueryKey() });
      onClose();
    } catch (e: any) {
      setError(e.message ?? "Failed to connect");
    } finally {
      setLoading(false);
    }
  }

  const docs = PLATFORM_DOCS[platform];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={onClose}>
      <div className="bg-card border border-border rounded-xl p-6 w-full max-w-md mx-4 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-2 mb-4">
          <PlatformIcon platform={platform} size={18} />
          <h2 className="text-base font-semibold">Connect {PLATFORM_LABELS[platform] ?? platform}</h2>
        </div>
        {docs && (
          <>
            <p className="text-sm text-muted-foreground mb-3">{docs.desc}</p>
            <div className="bg-background rounded border border-border p-3 mb-4">
              <p className="text-xs text-muted-foreground font-mono">{docs.oauthHint}</p>
            </div>
          </>
        )}
        <div className="space-y-3">
          <div>
            <label className="text-xs text-muted-foreground block mb-1">Username (optional)</label>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="your-username"
              className="w-full bg-background border border-border rounded px-3 py-2 text-sm font-mono focus:outline-none focus:border-primary/50"
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground block mb-1">Access Token *</label>
            <input
              value={token}
              onChange={(e) => setToken(e.target.value)}
              type="password"
              placeholder="paste your token here..."
              className="w-full bg-background border border-border rounded px-3 py-2 text-sm font-mono focus:outline-none focus:border-primary/50"
            />
          </div>
          {error && <p className="text-xs text-red-400">{error}</p>}
        </div>
        <div className="flex gap-2 mt-5">
          <button onClick={onClose} className="flex-1 px-4 py-2 rounded border border-border text-sm hover:bg-card/50 transition-colors">
            Cancel
          </button>
          <button
            onClick={handleConnect}
            disabled={loading}
            className="flex-1 px-4 py-2 rounded bg-primary/10 border border-primary/30 text-primary text-sm hover:bg-primary/20 transition-colors disabled:opacity-50"
          >
            {loading ? "Connecting..." : "Connect"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Connections() {
  const { data: platforms } = useListPlatforms();
  const { mutateAsync: disconnectPlatform } = useDisconnectPlatform();
  const { mutateAsync: syncPlatform } = useSyncPlatform();
  const qc = useQueryClient();
  const [syncing, setSyncing] = useState<string | null>(null);
  const [connectingPlatform, setConnectingPlatform] = useState<string | null>(null);

  async function handleSync(platform: string) {
    setSyncing(platform);
    try {
      await syncPlatform({ platform: platform as any });
      await qc.invalidateQueries({ queryKey: getListPlatformsQueryKey() });
    } finally {
      setSyncing(null);
    }
  }

  async function handleDisconnect(platform: string) {
    await disconnectPlatform({ platform: platform as any });
    await qc.invalidateQueries({ queryKey: getListPlatformsQueryKey() });
  }

  return (
    <DashboardLayout>
      {connectingPlatform && (
        <ConnectModal platform={connectingPlatform} onClose={() => setConnectingPlatform(null)} />
      )}
      <div className="space-y-4 max-w-3xl">
        <p className="text-sm text-muted-foreground">
          Connect your development platforms to pull live activity into your dashboard.
          Tokens are stored server-side only and never exposed to the browser.
        </p>

        <div className="space-y-3">
          {(platforms ?? []).map((p) => {
            const isExpiring = p.tokenExpiresAt && new Date(p.tokenExpiresAt).getTime() - Date.now() < 7 * 86400000;
            return (
              <div key={p.platform} className={`border rounded-xl bg-card overflow-hidden ${isExpiring ? "border-amber-500/40" : "border-border"}`}>
                {isExpiring && (
                  <div className="flex items-center gap-2 px-4 py-2 bg-amber-500/10 border-b border-amber-500/20">
                    <AlertTriangle size={12} className="text-amber-400" />
                    <span className="text-xs text-amber-400">Token expires {formatDate(p.tokenExpiresAt)}</span>
                  </div>
                )}
                <div className="px-5 py-4 flex items-start gap-4">
                  <div className="mt-0.5">
                    <PlatformIcon platform={p.platform} size={22} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-sm">{PLATFORM_LABELS[p.platform] ?? p.platform}</span>
                      {p.isConnected ? (
                        <span className="flex items-center gap-1 text-xs text-emerald-400">
                          <CheckCircle2 size={11} /> Connected
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Circle size={11} /> Not connected
                        </span>
                      )}
                    </div>
                    {p.isConnected && p.username && (
                      <p className="text-xs text-muted-foreground mb-1 font-mono">{p.username}</p>
                    )}
                    {p.isConnected && p.lastSyncedAt && (
                      <p className="text-xs text-muted-foreground">Last synced {formatRelative(p.lastSyncedAt)}</p>
                    )}
                    {p.isConnected && (p.activityCount ?? 0) > 0 && (
                      <p className="text-xs text-muted-foreground">{p.activityCount} activity items</p>
                    )}
                    {p.scopes && p.scopes.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {p.scopes.map((s) => (
                          <span key={s} className="text-xs px-1.5 py-0.5 rounded bg-background border border-border text-muted-foreground font-mono">{s}</span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {p.isConnected && (
                      <>
                        <button
                          onClick={() => handleSync(p.platform)}
                          disabled={syncing === p.platform}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded border border-border text-xs hover:bg-card/50 transition-colors disabled:opacity-50"
                        >
                          <RefreshCw size={11} className={syncing === p.platform ? "animate-spin" : ""} />
                          Sync
                        </button>
                        <button
                          onClick={() => handleDisconnect(p.platform)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded border border-destructive/30 text-xs text-destructive hover:bg-destructive/10 transition-colors"
                        >
                          <Unplug size={11} /> Disconnect
                        </button>
                      </>
                    )}
                    {!p.isConnected && (
                      <button
                        onClick={() => setConnectingPlatform(p.platform)}
                        className="flex items-center gap-1.5 px-4 py-1.5 rounded bg-primary/10 border border-primary/30 text-primary text-xs hover:bg-primary/20 transition-colors"
                      >
                        Connect
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </DashboardLayout>
  );
}
