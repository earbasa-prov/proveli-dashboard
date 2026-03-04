"use client";

import { useCallback, useState } from "react";
import { Upload, AlertTriangle, CheckCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useProductionData } from "@/lib/production/production-data-context";
import { toast } from "sonner";

const ACCEPTED_MIME =
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv,application/csv";

export function DefectUploadZone({ compact = false }: { compact?: boolean }) {
  const { loadDefectFile, hasDefectData } = useProductionData();
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  const handleFiles = useCallback(
    async (files: FileList | null) => {
      if (!files?.length) return;
      const file = files[0];
      const ext = file.name.split(".").pop()?.toLowerCase();
      if (ext !== "xlsx" && ext !== "csv" && ext !== "xls") {
        toast.error("Please upload a .xlsx or .csv file");
        return;
      }
      setIsLoading(true);
      setErrors([]);
      try {
        const result = await loadDefectFile(file);
        if (result.success) {
          toast.success(result.errors.length ? "Defects loaded with warnings" : "Defect data loaded");
          if (result.errors.length > 0) setErrors(result.errors.slice(0, 5));
        } else {
          toast.error("Failed to parse defect file");
          setErrors(result.errors);
        }
      } finally {
        setIsLoading(false);
      }
    },
    [loadDefectFile]
  );

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      handleFiles(e.dataTransfer.files);
    },
    [handleFiles]
  );

  const onInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      handleFiles(e.target.files);
      e.target.value = "";
    },
    [handleFiles]
  );

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={isLoading}
          onClick={() => document.getElementById("defect-file-input")?.click()}
          className={hasDefectData ? "border-amber-300 bg-amber-50 dark:bg-amber-950/30" : ""}
        >
          {hasDefectData ? <CheckCircle className="mr-2 h-4 w-4 text-amber-600" /> : <Upload className="mr-2 h-4 w-4" />}
          {isLoading ? "Loading..." : hasDefectData ? "Replace defects" : "Upload defects"}
        </Button>
        <input
          id="defect-file-input"
          type="file"
          accept={ACCEPTED_MIME}
          className="hidden"
          onChange={onInputChange}
        />
      </div>
    );
  }

  return (
    <Card
      className={`transition-colors ${hasDefectData ? "border-amber-300/60 dark:border-amber-700/40" : "border-amber-200/60 dark:border-amber-800/40"}`}
      onDrop={onDrop}
      onDragOver={(e) => e.preventDefault()}
      onDragLeave={(e) => e.preventDefault()}
    >
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-amber-800 dark:text-amber-200">
          {hasDefectData ? (
            <CheckCircle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
          ) : (
            <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
          )}
          Upload Defect Data
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Separate defect file (Original Order No, Channel, Dept, Defect Type, Reason) — affects Defect % KPIs
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div
          className={`flex flex-col items-center justify-center rounded-lg border-2 border-dashed py-12 px-6 cursor-pointer transition-colors ${
            hasDefectData
              ? "border-amber-300 bg-amber-50/50 hover:border-amber-500 dark:bg-amber-950/20 dark:hover:border-amber-500"
              : "border-amber-300 bg-amber-50/50 hover:border-amber-500 hover:bg-amber-100/50 dark:border-amber-700 dark:bg-amber-950/20 dark:hover:border-amber-500 dark:hover:bg-amber-950/40"
          }`}
          onClick={() => document.getElementById("defect-file-input")?.click()}
        >
          <Upload className="mb-4 h-12 w-12 text-amber-500 dark:text-amber-400" />
          <p className="mb-1 font-medium">
            {hasDefectData ? "Defect data loaded. Drag to replace, or click to browse" : "Drag and drop defect .xlsx or .csv, or click to browse"}
          </p>
          <p className="text-sm text-muted-foreground">
            Required: Original Order No., Channel of original order
          </p>
          <input
            id="defect-file-input"
            type="file"
            accept={ACCEPTED_MIME}
            className="hidden"
            onChange={onInputChange}
            disabled={isLoading}
          />
          <Button
            className="mt-4 bg-amber-600 text-white hover:bg-amber-700"
            disabled={isLoading}
          >
            {isLoading ? "Parsing..." : hasDefectData ? "Replace defect file" : "Select defect file"}
          </Button>
        </div>
        {errors.length > 0 && (
          <div className="rounded-md border border-destructive/50 bg-destructive/10 p-3">
            <div className="flex items-center gap-2 text-sm font-medium text-destructive">
              <AlertTriangle className="h-4 w-4" />
              Validation messages
            </div>
            <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-muted-foreground">
              {errors.map((err, i) => (
                <li key={i}>{err}</li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
