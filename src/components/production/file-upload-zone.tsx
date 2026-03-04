"use client";

import { useCallback, useState } from "react";
import { Upload, FileSpreadsheet, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useProductionData } from "@/lib/production/production-data-context";
import { saveDashboard } from "@/lib/production/dashboard-save";
import { toast } from "sonner";

const ACCEPTED_MIME =
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv,application/csv";

export function FileUploadZone({ compact = false }: { compact?: boolean }) {
  const { loadFromFile, defects } = useProductionData();
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
        const result = await loadFromFile(file);
        if (result.success) {
          if (result.orders) {
            const filename = saveDashboard(result.orders, defects);
            toast.success(filename
              ? `Loaded and saved as ${filename}`
              : result.errors.length ? "Loaded with warnings" : "Loaded successfully");
          } else {
            toast.success(result.errors.length ? "Loaded with warnings" : "Loaded successfully");
          }
          if (result.errors.length > 0) setErrors(result.errors.slice(0, 5));
        } else {
          toast.error("Failed to parse file");
          setErrors(result.errors);
        }
      } finally {
        setIsLoading(false);
      }
    },
    [loadFromFile, defects]
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
          onClick={() => document.getElementById("production-file-input")?.click()}
        >
          <Upload className="mr-2 h-4 w-4" />
          {isLoading ? "Loading..." : "Replace data"}
        </Button>
        <input
          id="production-file-input"
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
      className="transition-colors border-teal-200/60 dark:border-teal-800/40"
      onDrop={onDrop}
      onDragOver={(e) => e.preventDefault()}
      onDragLeave={(e) => e.preventDefault()}
    >
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-teal-800 dark:text-teal-200">
          <FileSpreadsheet className="h-5 w-5 text-teal-600 dark:text-teal-400" />
          Upload Production Data
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div
          className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-teal-300 bg-teal-50/50 py-12 px-6 cursor-pointer transition-colors hover:border-teal-500 hover:bg-teal-100/50 dark:border-teal-700 dark:bg-teal-950/20 dark:hover:border-teal-500 dark:hover:bg-teal-950/40"
          onClick={() => document.getElementById("production-file-input")?.click()}
        >
          <Upload className="mb-4 h-12 w-12 text-teal-500 dark:text-teal-400" />
          <p className="mb-1 font-medium">Drag and drop your .xlsx or .csv file, or click to browse</p>
          <p className="text-sm text-muted-foreground">Required columns: Order No, Channel, Ship By Date, Status</p>
          <input
            id="production-file-input"
            type="file"
            accept={ACCEPTED_MIME}
            className="hidden"
            onChange={onInputChange}
            disabled={isLoading}
          />
          <Button className="mt-4 bg-teal-600 text-white hover:bg-teal-700" disabled={isLoading}>
            {isLoading ? "Parsing..." : "Select file"}
          </Button>
        </div>
        {errors.length > 0 && (
          <div className="rounded-md border border-destructive/50 bg-destructive/10 p-3">
            <div className="flex items-center gap-2 text-sm font-medium text-destructive">
              <AlertCircle className="h-4 w-4" />
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
