"use client";

import { PDFDownloadLink, Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";

const DAY_NAMES = ["Domenica", "Lunedì", "Martedì", "Mercoledì", "Giovedì", "Venerdì", "Sabato"];

interface Exercise {
  name: string;
  muscleGroup: string;
  targetSets: number;
  targetRepsMin: number;
  targetRepsMax: number;
}

interface Session {
  dayOfWeek: number;
  name: string;
  exercises: Exercise[];
}

export interface WorkoutPDFData {
  clientName: string;
  weekStart: string;
  sessions: Session[];
}

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: "Helvetica",
    fontSize: 10,
    color: "#1e293b",
  },
  header: {
    marginBottom: 30,
    borderBottomWidth: 2,
    borderBottomColor: "#06b6d4",
    paddingBottom: 15,
  },
  title: {
    fontSize: 24,
    fontFamily: "Helvetica-Bold",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 11,
    color: "#64748b",
  },
  section: {
    marginBottom: 20,
  },
  sessionTitle: {
    fontSize: 14,
    fontFamily: "Helvetica-Bold",
    marginBottom: 8,
    color: "#0f172a",
  },
  sessionSubtitle: {
    fontSize: 10,
    color: "#64748b",
    marginBottom: 10,
  },
  exerciseRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 6,
    borderBottomWidth: 0.5,
    borderBottomColor: "#e2e8f0",
  },
  exerciseName: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    flex: 1,
  },
  exerciseMuscle: {
    fontSize: 9,
    color: "#64748b",
    flex: 1,
    textAlign: "center",
  },
  exerciseSets: {
    fontSize: 10,
    color: "#06b6d4",
    fontFamily: "Helvetica-Bold",
    width: 80,
    textAlign: "right",
  },
  footer: {
    position: "absolute",
    bottom: 40,
    left: 40,
    right: 40,
    fontSize: 8,
    color: "#94a3b8",
    textAlign: "center",
    borderTopWidth: 0.5,
    borderTopColor: "#e2e8f0",
    paddingTop: 10,
  },
});

export function WorkoutPDF({ data }: { data: WorkoutPDFData }) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Piano di Allenamento</Text>
          <Text style={styles.subtitle}>
            {data.clientName} — Settimana del {new Date(data.weekStart).toLocaleDateString("it-IT")}
          </Text>
        </View>

        {/* Sessions */}
        {data.sessions.map((session, idx) => (
          <View key={idx} style={styles.section}>
            <Text style={styles.sessionTitle}>
              {DAY_NAMES[session.dayOfWeek]} — {session.name}
            </Text>
            {session.exercises.map((ex, exIdx) => (
              <View key={exIdx} style={styles.exerciseRow}>
                <Text style={styles.exerciseName}>{ex.name}</Text>
                <Text style={styles.exerciseMuscle}>{ex.muscleGroup}</Text>
                <Text style={styles.exerciseSets}>
                  {ex.targetSets} × {ex.targetRepsMin}–{ex.targetRepsMax}
                </Text>
              </View>
            ))}
          </View>
        ))}

        {/* Footer */}
        <Text style={styles.footer}>
          Generato con NutriPlan Pro — {new Date().toLocaleDateString("it-IT")}
        </Text>
      </Page>
    </Document>
  );
}

export function WorkoutPDFDownload({
  data,
  disabled,
}: {
  data: WorkoutPDFData;
  disabled?: boolean;
}) {
  return (
    <PDFDownloadLink
      document={<WorkoutPDF data={data} />}
      fileName={`allenamento-${data.clientName.toLowerCase().replace(/\s+/g, "-")}.pdf`}
      className="inline-flex items-center gap-1.5 h-8 px-3 rounded-[var(--radius-sm)] bg-slate-800/50 border border-slate-700/50 text-xs font-body text-slate-400 hover:text-slate-100 transition-colors"
    >
      {({ loading }) => (loading ? "Generazione..." : "Scarica PDF")}
    </PDFDownloadLink>
  );
}
