import { useMemo, useRef, useState } from "react";

export default function BroadcastPage({
  classes = [
    { id: "c1", name: "Class 1" },
    { id: "c2", name: "Class 2" },
  ],
  sectionsByClassId = {
    c1: [
      { id: "s1", name: "A" },
      { id: "s2", name: "B" },
    ],
    c2: [{ id: "s3", name: "A" }],
  },
  studentsBySectionId = {
    s1: [{ id: "st1", name: "Aarav Sharma" }],
    s2: [{ id: "st2", name: "Diya Singh" }],
    s3: [{ id: "st3", name: "Kabir Verma" }],
  },
}) {
  /* ---------------- state ---------------- */
  const [targetType, setTargetType] = useState("SCHOOL");
  const [classId, setClassId] = useState("");
  const [sectionId, setSectionId] = useState("");
  const [studentId, setStudentId] = useState("");

  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");

  const [showTargetModal, setShowTargetModal] = useState(false);

  /* ---------------- derived ---------------- */
  const sections = useMemo(
    () => sectionsByClassId[classId] || [],
    [classId]
  );

  const students = useMemo(
    () => studentsBySectionId[sectionId] || [],
    [sectionId]
  );

  /* ---------------- helpers ---------------- */
  function resetCascade(type) {
    setTargetType(type);
    setClassId("");
    setSectionId("");
    setStudentId("");
  }

  const canSubmit = title.trim() && message.trim();

  /* ---------------- render ---------------- */
  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col md:h-auto">
      {/* ===== Mobile Target Button ===== */}
      <div className="md:hidden mb-3">
        <button
          onClick={() => setShowTargetModal(true)}
          className="w-full px-4 py-3 rounded-xl border bg-[var(--color-surface)] flex justify-between items-center"
        >
          <div className="text-left">
            <p className="text-xs text-slate-500">Target audience</p>
            <p className="text-sm font-semibold">
              {formatTargetLabel({
                targetType,
                classId,
                sectionId,
                studentId,
                classes,
                sectionsByClassId,
                studentsBySectionId,
              })}
            </p>
          </div>
          <span className="text-xs px-2 py-1 border rounded-lg">
            Change
          </span>
        </button>
      </div>

      {/* ===== Desktop Layout ===== */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-12 gap-4 overflow-hidden">
        {/* ---- Desktop Target Panel ---- */}
        <aside className="hidden md:block md:col-span-4 border rounded-xl p-4 bg-[var(--color-surface)]">
          <TargetSelector
            {...{
              targetType,
              classId,
              sectionId,
              studentId,
              classes,
              sections,
              students,
              resetCascade,
              setClassId,
              setSectionId,
              setStudentId,
            }}
          />
        </aside>

        {/* ---- Form ---- */}
        <section className="md:col-span-8 flex flex-col border rounded-xl bg-[var(--color-surface)] overflow-hidden">
          {/* Form body scrolls */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            <Input
              label="Title"
              value={title}
              onChange={setTitle}
              placeholder="Enter title"
            />

            <Textarea
              label="Message"
              value={message}
              onChange={setMessage}
              placeholder="Write your message..."
            />
          </div>

          {/* Footer */}
          <div className="border-t p-4 bg-[var(--color-surface)]">
            <button
              disabled={!canSubmit}
              className="w-full py-2 rounded-xl bg-[var(--color-primary-600)] text-white disabled:opacity-50"
            >
              Send Broadcast
            </button>
          </div>
        </section>
      </div>

      {/* ===== Mobile Bottom Sheet ===== */}
      {showTargetModal && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setShowTargetModal(false)}
          />

          <div className="absolute bottom-0 w-full rounded-t-2xl bg-[var(--color-surface)] max-h-[85vh] overflow-y-auto">
            <div className="p-4 border-b flex justify-between items-center">
              <h3 className="text-sm font-semibold">Select Audience</h3>
              <button
                onClick={() => setShowTargetModal(false)}
                className="text-xs px-2 py-1 border rounded-lg"
              >
                Done
              </button>
            </div>

            <div className="p-4">
              <TargetSelector
                {...{
                  targetType,
                  classId,
                  sectionId,
                  studentId,
                  classes,
                  sections,
                  students,
                  resetCascade,
                  setClassId,
                  setSectionId,
                  setStudentId,
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ================================================= */
/* ================= Subcomponents ================= */
/* ================================================= */

function TargetSelector({
  targetType,
  classId,
  sectionId,
  studentId,
  classes,
  sections,
  students,
  resetCascade,
  setClassId,
  setSectionId,
  setStudentId,
}) {
  return (
    <div className="space-y-4">
      <Select
        label="Target type"
        value={targetType}
        onChange={resetCascade}
        options={[
          { value: "SCHOOL", label: "Entire School" },
          { value: "CLASS", label: "Class" },
          { value: "SECTION", label: "Section" },
          { value: "STUDENT", label: "Student" },
        ]}
      />

      {targetType !== "SCHOOL" && (
        <Select
          label="Class"
          value={classId}
          onChange={setClassId}
          options={classes.map(c => ({ value: c.id, label: c.name }))}
        />
      )}

      {(targetType === "SECTION" || targetType === "STUDENT") && (
        <Select
          label="Section"
          value={sectionId}
          onChange={setSectionId}
          disabled={!classId}
          options={sections.map(s => ({ value: s.id, label: s.name }))}
        />
      )}

      {targetType === "STUDENT" && (
        <Select
          label="Student"
          value={studentId}
          onChange={setStudentId}
          disabled={!sectionId}
          options={students.map(s => ({ value: s.id, label: s.name }))}
        />
      )}
    </div>
  );
}

/* ---------------- UI primitives ---------------- */

function Select({ label, value, onChange, options, disabled }) {
  return (
    <div>
      <label className="text-xs font-semibold">{label}</label>
      <select
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full border rounded-xl px-3 py-2 text-sm"
      >
        <option value="">Select</option>
        {options.map(o => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  );
}

function Input({ label, value, onChange, placeholder }) {
  return (
    <div>
      <label className="text-xs font-semibold">{label}</label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="mt-1 w-full border rounded-xl px-3 py-2 text-sm"
      />
    </div>
  );
}

function Textarea({ label, value, onChange, placeholder }) {
  return (
    <div>
      <label className="text-xs font-semibold">{label}</label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={6}
        className="mt-1 w-full border rounded-xl px-3 py-2 text-sm resize-none max-h-40 overflow-y-auto"
      />
    </div>
  );
}

/* ---------------- helpers ---------------- */

function formatTargetLabel({
  targetType,
  classId,
  sectionId,
  studentId,
  classes,
  sectionsByClassId,
  studentsBySectionId,
}) {
  if (targetType === "SCHOOL") return "Entire School";
  const c = classes.find(x => x.id === classId)?.name;
  const s = sectionsByClassId[classId]?.find(x => x.id === sectionId)?.name;
  const st = studentsBySectionId[sectionId]?.find(x => x.id === studentId)?.name;
  return [c, s, st].filter(Boolean).join(" • ");
}
