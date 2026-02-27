import { useState } from "react";
import {
  useAllEvents,
  useApplyToEvent,
  useCreateEvent,
  useEventApplications,
  useApproveApplication,
  useRejectApplication,
} from "../hooks/useQueries";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar, Plus, Users, Clock, Tag, ChevronDown, ChevronUp, Loader2, CheckCircle, XCircle } from "lucide-react";
import { PrincipalText } from "../components/PrincipalText";
import { toast } from "sonner";
import type { Event } from "../backend.d.ts";
import type { Principal } from "@icp-sdk/core/principal";

function formatEventDate(date: bigint): string {
  const ms = Number(date / BigInt(1_000_000));
  return new Date(ms).toLocaleDateString("en-US", {
    weekday: "short", month: "short", day: "numeric", year: "numeric",
  });
}

interface EventDetailProps {
  event: Event;
  callerPrincipal?: Principal;
}

function EventDetail({ event, callerPrincipal }: EventDetailProps) {
  const [open, setOpen] = useState(false);
  const isOrganizer = callerPrincipal
    ? event.organizer.toString() === callerPrincipal.toString()
    : false;

  const applicationsQuery = useEventApplications(open && isOrganizer ? event.id : null);
  const applyMutation = useApplyToEvent();
  const approveMutation = useApproveApplication();
  const rejectMutation = useRejectApplication();

  const handleApply = () => {
    applyMutation.mutate(event.id, {
      onSuccess: () => toast.success("Application submitted!"),
      onError: () => toast.error("Failed to apply"),
    });
  };

  return (
    <div className="glass-card rounded-xl overflow-hidden hover:border-primary/30 transition-colors">
      <div className="p-4 space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="font-semibold text-foreground">{event.title}</p>
            <div className="flex items-center gap-1.5 mt-1 text-xs text-muted-foreground">
              <Clock className="w-3 h-3" />
              {formatEventDate(event.date)}
            </div>
          </div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
            <Users className="w-3 h-3" />
            Max {event.maxParticipants.toString()}
          </div>
        </div>

        {event.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">{event.description}</p>
        )}

        {/* Tags */}
        {event.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            <Tag className="w-3 h-3 text-muted-foreground self-center" />
            {event.tags.map((tag) => (
              <Badge key={tag} variant="secondary" className="text-xs py-0">
                {tag}
              </Badge>
            ))}
          </div>
        )}

        {/* Organizer */}
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <span>Organized by</span>
          <PrincipalText principal={event.organizer} />
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-1">
          {!isOrganizer && (
            <Button
              size="sm"
              onClick={handleApply}
              disabled={applyMutation.isPending}
              className="btn-glow flex-1"
            >
              {applyMutation.isPending ? (
                <><Loader2 className="mr-2 h-3 w-3 animate-spin" /> Applying...</>
              ) : "Apply"}
            </Button>
          )}

          {isOrganizer && (
            <Button
              size="sm"
              variant="outline"
              className="flex-1"
              onClick={() => setOpen(!open)}
            >
              {open ? <ChevronUp className="w-4 h-4 mr-1" /> : <ChevronDown className="w-4 h-4 mr-1" />}
              Applicants
            </Button>
          )}
        </div>

        {/* Applicants Panel */}
        {isOrganizer && open && (
          <div className="border-t border-border/40 pt-3 space-y-2">
            <p className="text-xs font-medium text-muted-foreground">Applications</p>
            {applicationsQuery.isLoading ? (
              <div className="space-y-2">
                {[1, 2].map((i) => <Skeleton key={i} className="h-8 w-full rounded-lg" />)}
              </div>
            ) : (applicationsQuery.data ?? []).length === 0 ? (
              <p className="text-xs text-muted-foreground">No applications yet</p>
            ) : (
              <div className="space-y-2">
                {(applicationsQuery.data ?? []).map((applicant) => (
                  <div key={applicant.toString()} className="flex items-center justify-between bg-muted/30 rounded-lg px-3 py-2">
                    <PrincipalText principal={applicant} />
                    <div className="flex gap-1.5">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 px-2 text-emerald-400 hover:bg-emerald-400/10"
                        onClick={() =>
                          approveMutation.mutate(
                            { eventId: event.id, applicant },
                            { onSuccess: () => toast.success("Approved") }
                          )
                        }
                        disabled={approveMutation.isPending}
                      >
                        <CheckCircle className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 px-2 text-rose-400 hover:bg-rose-400/10"
                        onClick={() =>
                          rejectMutation.mutate(
                            { eventId: event.id, applicant },
                            { onSuccess: () => toast.success("Rejected") }
                          )
                        }
                        disabled={rejectMutation.isPending}
                      >
                        <XCircle className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

interface EventsPageProps {
  callerPrincipal?: Principal;
}

export function EventsPage({ callerPrincipal }: EventsPageProps) {
  const [createOpen, setCreateOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [dateStr, setDateStr] = useState("");
  const [tagsStr, setTagsStr] = useState("");
  const [maxParticipants, setMaxParticipants] = useState("50");

  const eventsQuery = useAllEvents();
  const createEvent = useCreateEvent();

  const handleCreate = () => {
    if (!title.trim() || !dateStr) return;
    const date = BigInt(new Date(dateStr).getTime()) * BigInt(1_000_000);
    const tags = tagsStr.split(",").map((t) => t.trim()).filter(Boolean);

    createEvent.mutate(
      {
        title: title.trim(),
        description: desc.trim(),
        date,
        tags,
        maxParticipants: BigInt(Math.max(1, parseInt(maxParticipants) || 50)),
      },
      {
        onSuccess: () => {
          setTitle("");
          setDesc("");
          setDateStr("");
          setTagsStr("");
          setMaxParticipants("50");
          setCreateOpen(false);
          toast.success("Event created!");
        },
        onError: () => toast.error("Failed to create event"),
      }
    );
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary" />
            Events
          </h2>
          <p className="text-sm text-muted-foreground mt-1">Hackathons, workshops, and campus events</p>
        </div>

        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="btn-glow">
              <Plus className="w-4 h-4 mr-1" /> Create
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Create Event</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Title *</Label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Event name" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Description</Label>
                <Textarea
                  value={desc}
                  onChange={(e) => setDesc(e.target.value)}
                  placeholder="Describe the event..."
                  className="min-h-20 resize-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Date *</Label>
                  <Input
                    type="date"
                    value={dateStr}
                    onChange={(e) => setDateStr(e.target.value)}
                    className="bg-muted/50"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Max Participants</Label>
                  <Input
                    type="number"
                    value={maxParticipants}
                    onChange={(e) => setMaxParticipants(e.target.value)}
                    min="1"
                    className="bg-muted/50"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Tags (comma-separated)</Label>
                <Input
                  value={tagsStr}
                  onChange={(e) => setTagsStr(e.target.value)}
                  placeholder="Hackathon, AI, Web3"
                />
              </div>
              <Button
                onClick={handleCreate}
                disabled={createEvent.isPending || !title.trim() || !dateStr}
                className="w-full btn-glow"
              >
                {createEvent.isPending ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating...</>
                ) : "Create Event"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {eventsQuery.isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="glass-card rounded-xl p-4 space-y-3">
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-3 w-32" />
              <Skeleton className="h-3 w-full" />
              <div className="flex gap-2">
                <Skeleton className="h-5 w-16 rounded-full" />
                <Skeleton className="h-5 w-14 rounded-full" />
              </div>
            </div>
          ))}
        </div>
      ) : (eventsQuery.data ?? []).length === 0 ? (
        <div className="glass-card rounded-xl p-10 text-center space-y-3">
          <Calendar className="w-12 h-12 text-muted-foreground/40 mx-auto" />
          <p className="text-muted-foreground">No events yet. Create the first one!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {(eventsQuery.data ?? []).map((event) => (
            <EventDetail key={event.id} event={event} callerPrincipal={callerPrincipal} />
          ))}
        </div>
      )}
    </div>
  );
}
