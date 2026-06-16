import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CalendarPlus, Loader2, ExternalLink, Calendar } from "lucide-react";
import { toast } from "sonner";

const CONNECTOR_ID = "6a31b29fd03140a38ccb7b13";

export default function ScheduleMeetingModal({ open, onClose, person, funderName, grantTitle }) {
  const today = new Date();
  const defaultDate = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

  const [form, setForm] = useState({ date: defaultDate, time: "10:00", duration: 60, notes: "" });
  const [scheduling, setScheduling] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [connected, setConnected] = useState(null); // null=unknown, true, false
  const [eventLink, setEventLink] = useState(null);

  const checkConnection = async () => {
    try {
      await base44.functions.invoke("scheduleFollowUpMeeting", {
        person_name: "__test__", date: "2099-01-01", time: "00:00"
      });
      setConnected(true);
    } catch (e) {
      // If it's a "not connected" error vs a real error
      if (e.message?.includes("not connected") || e.message?.includes("No connection") || e.message?.includes("connection")) {
        setConnected(false);
      } else {
        setConnected(true); // connection exists, other error is fine
      }
    }
  };

  const handleConnect = async () => {
    setConnecting(true);
    const url = await base44.connectors.connectAppUser(CONNECTOR_ID);
    const popup = window.open(url, "_blank");
    const timer = setInterval(() => {
      if (!popup || popup.closed) {
        clearInterval(timer);
        setConnecting(false);
        setConnected(true);
      }
    }, 500);
  };

  const handleSchedule = async () => {
    if (!form.date || !form.time) { toast.error("Please set a date and time"); return; }
    setScheduling(true);
    try {
      const res = await base44.functions.invoke("scheduleFollowUpMeeting", {
        person_name: person.name,
        person_role: person.role,
        funder_name: funderName,
        grant_title: grantTitle,
        date: form.date,
        time: form.time,
        duration_minutes: form.duration,
        notes: form.notes,
      });
      if (res.data?.event_link) {
        setEventLink(res.data.event_link);
        toast.success("Meeting added to your Google Calendar!");
      } else {
        toast.error(res.data?.error || "Failed to create event");
      }
    } catch (e) {
      if (e.message?.includes("not connected") || e.message?.includes("No connection")) {
        setConnected(false);
        toast.error("Connect your Google Calendar first");
      } else {
        toast.error("Failed: " + e.message);
      }
    }
    setScheduling(false);
  };

  const handleOpen = () => {
    setEventLink(null);
    setConnected(null);
    checkConnection();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md" onOpenAutoFocus={handleOpen}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <CalendarPlus className="w-4 h-4 text-emerald-600" />
            Schedule Follow-up Meeting
          </DialogTitle>
        </DialogHeader>

        {/* Person info */}
        <div className="bg-slate-50 rounded-lg px-3 py-2.5 border border-slate-200">
          <p className="text-sm font-semibold text-slate-800">{person?.name}</p>
          <p className="text-xs text-slate-500">{person?.role} · {funderName}</p>
        </div>

        {/* Not connected state */}
        {connected === false && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 space-y-2">
            <p className="text-sm text-amber-800 font-medium flex items-center gap-2">
              <Calendar className="w-4 h-4" /> Connect your Google Calendar
            </p>
            <p className="text-xs text-amber-700">You'll only need to do this once. Meetings will be added directly to your calendar.</p>
            <Button size="sm" onClick={handleConnect} disabled={connecting} className="gap-2 bg-amber-600 hover:bg-amber-700 text-white">
              {connecting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ExternalLink className="w-3.5 h-3.5" />}
              {connecting ? "Opening…" : "Connect Google Calendar"}
            </Button>
          </div>
        )}

        {/* Success state */}
        {eventLink && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 space-y-2">
            <p className="text-sm text-emerald-800 font-medium">✓ Meeting created!</p>
            <a href={eventLink} target="_blank" rel="noreferrer">
              <Button size="sm" variant="outline" className="gap-2 border-emerald-300 text-emerald-700">
                <ExternalLink className="w-3.5 h-3.5" /> Open in Google Calendar
              </Button>
            </a>
          </div>
        )}

        {/* Form */}
        {!eventLink && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Date</Label>
                <Input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} className="mt-1 text-sm" />
              </div>
              <div>
                <Label className="text-xs">Time</Label>
                <Input type="time" value={form.time} onChange={e => setForm(f => ({ ...f, time: e.target.value }))} className="mt-1 text-sm" />
              </div>
            </div>
            <div>
              <Label className="text-xs">Duration</Label>
              <select
                value={form.duration}
                onChange={e => setForm(f => ({ ...f, duration: Number(e.target.value) }))}
                className="mt-1 w-full border border-input rounded-md px-3 py-2 text-sm bg-transparent"
              >
                <option value={30}>30 minutes</option>
                <option value={45}>45 minutes</option>
                <option value={60}>1 hour</option>
                <option value={90}>1.5 hours</option>
              </select>
            </div>
            <div>
              <Label className="text-xs">Notes (optional)</Label>
              <Textarea
                value={form.notes}
                onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                placeholder={`Agenda, talking points for meeting with ${person?.name}…`}
                className="mt-1 text-xs resize-none min-h-16"
              />
            </div>
            <Button
              onClick={handleSchedule}
              disabled={scheduling || connected === false}
              className="w-full gap-2 bg-emerald-600 hover:bg-emerald-700"
            >
              {scheduling ? <Loader2 className="w-4 h-4 animate-spin" /> : <CalendarPlus className="w-4 h-4" />}
              {scheduling ? "Adding to Calendar…" : "Schedule Meeting"}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}