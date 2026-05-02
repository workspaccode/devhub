import { useListSlackWorkspaces, useListSlackChannels, useGetSlackActivity } from "@workspace/api-client-react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { formatRelative } from "@/lib/utils";
import { Hash, Lock, Users } from "lucide-react";

export default function SlackPage() {
  const { data: workspaces } = useListSlackWorkspaces();
  const { data: channels, isLoading } = useListSlackChannels();
  const { data: activity } = useGetSlackActivity({});

  const memberChannels = (channels ?? []).filter((c) => c.isMember);
  const otherChannels = (channels ?? []).filter((c) => !c.isMember);

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-5xl">
        {/* Workspace info */}
        {(workspaces ?? []).map((ws) => (
          <div key={ws.id} className="border border-border rounded-lg bg-card px-5 py-4 flex items-center gap-4">
            {ws.iconUrl && (
              <img src={ws.iconUrl} alt={ws.name} className="w-10 h-10 rounded" />
            )}
            <div>
              <div className="font-semibold">{ws.name}</div>
              <div className="text-xs text-muted-foreground font-mono">{ws.domain}.slack.com</div>
            </div>
          </div>
        ))}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Channels */}
          <div className="lg:col-span-1 border border-border rounded-lg bg-card">
            <div className="px-4 py-3 border-b border-border flex items-center justify-between">
              <span className="text-sm font-mono font-medium">Channels</span>
              <span className="text-xs text-muted-foreground">{channels?.length ?? 0}</span>
            </div>
            <div className="divide-y divide-border/50 max-h-[500px] overflow-y-auto">
              {isLoading ? (
                <div className="p-6 text-center text-muted-foreground text-sm">Loading...</div>
              ) : (channels ?? []).length === 0 ? (
                <div className="p-6 text-center text-muted-foreground text-sm">Connect Slack to see channels.</div>
              ) : (
                [...memberChannels, ...otherChannels].map((ch) => (
                  <div key={ch.id} className={`px-4 py-2.5 hover:bg-card/50 transition-colors ${ch.isMember ? "" : "opacity-50"}`}>
                    <div className="flex items-center gap-1.5">
                      {ch.isPrivate ? <Lock size={11} className="text-muted-foreground" /> : <Hash size={11} className="text-muted-foreground" />}
                      <span className="text-sm">{ch.name}</span>
                      {ch.isMember && <span className="text-xs text-emerald-400 ml-auto">joined</span>}
                    </div>
                    {ch.memberCount && (
                      <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                        <Users size={9} />{ch.memberCount} members
                      </p>
                    )}
                    {ch.topic && <p className="text-xs text-muted-foreground mt-0.5 truncate">{ch.topic}</p>}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Recent messages */}
          <div className="lg:col-span-2 border border-border rounded-lg bg-card">
            <div className="px-4 py-3 border-b border-border">
              <span className="text-sm font-mono font-medium">Recent Messages</span>
            </div>
            <div className="divide-y divide-border/50 max-h-[500px] overflow-y-auto">
              {(activity ?? []).length === 0 ? (
                <div className="p-8 text-center text-muted-foreground text-sm">No recent messages</div>
              ) : (
                (activity ?? []).map((msg) => (
                  <div key={msg.id} className="px-4 py-3 hover:bg-card/50 transition-colors">
                    <div className="flex items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm line-clamp-2">{msg.title}</p>
                        <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                          {msg.repoName && <span className="font-mono">{msg.repoName}</span>}
                          <span>{formatRelative(msg.activityAt)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
