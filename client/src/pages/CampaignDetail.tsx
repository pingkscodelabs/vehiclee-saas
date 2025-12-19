import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { Upload, Loader2, CheckCircle, XCircle, Clock, ArrowLeft } from "lucide-react";
import { useState, useRef } from "react";
import { toast } from "sonner";
import { Link, useParams } from "wouter";

export default function CampaignDetail() {
  const { id } = useParams();
  const campaignId = parseInt(id || "0");
  const { user, isAuthenticated } = useAuth();
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: campaignDetail, refetch } = trpc.clientApp.getCampaignDetail.useQuery(
    { campaignId },
    { enabled: isAuthenticated && user?.role === "client" && !!campaignId }
  );

  const uploadAssetMutation = trpc.clientApp.uploadAsset.useMutation({
    onSuccess: () => {
      toast.success("Creative uploaded successfully!");
      setUploadDialogOpen(false);
      setSelectedFile(null);
      setPreviewUrl(null);
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to upload creative");
    },
  });

  const submitCreativeMutation = trpc.clientApp.submitCreative.useMutation({
    onSuccess: () => {
      toast.success("Creative submitted for approval!");
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to submit creative");
    },
  });

  const approveCreativeMutation = trpc.clientApp.approveCreative.useMutation({
    onSuccess: () => {
      toast.success("Creative approved!");
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to approve creative");
    },
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("File size must be less than 5MB");
        return;
      }
      if (!file.type.startsWith("image/")) {
        toast.error("Only image files are allowed");
        return;
      }
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onload = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = (reader.result as string).split(",")[1];
      uploadAssetMutation.mutate({
        campaignId,
        fileName: selectedFile.name,
        fileData: base64,
        mimeType: selectedFile.type,
      });
    };
    reader.readAsDataURL(selectedFile);
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { icon: React.ReactNode; variant: "default" | "secondary" | "destructive" | "outline"; label: string }> = {
      draft: { icon: <Clock className="h-3 w-3" />, variant: "secondary", label: "Draft" },
      awaiting_creative: { icon: <Clock className="h-3 w-3" />, variant: "outline", label: "Awaiting Creative" },
      awaiting_approval: { icon: <Clock className="h-3 w-3" />, variant: "outline", label: "Awaiting Approval" },
      approved: { icon: <CheckCircle className="h-3 w-3" />, variant: "default", label: "Approved" },
      active: { icon: <CheckCircle className="h-3 w-3" />, variant: "default", label: "Active" },
      completed: { icon: <CheckCircle className="h-3 w-3" />, variant: "secondary", label: "Completed" },
      cancelled: { icon: <XCircle className="h-3 w-3" />, variant: "destructive", label: "Cancelled" },
    };
    const config = variants[status] || { icon: <Clock className="h-3 w-3" />, variant: "secondary" as const, label: status };
    return (
      <Badge variant={config.variant} className="flex items-center gap-1 w-fit">
        {config.icon}
        {config.label}
      </Badge>
    );
  };

  if (!campaignDetail) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header */}
      <header className="bg-background border-b">
        <div className="container py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/client">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            </Link>
            <h1 className="text-2xl font-bold">{campaignDetail.campaignName}</h1>
          </div>
          <div className="flex items-center gap-4">
            {getStatusBadge(campaignDetail.status || "draft")}
          </div>
        </div>
      </header>

      <main className="container py-8">
        <div className="grid gap-6 md:grid-cols-2">
          {/* Campaign Details */}
          <Card>
            <CardHeader>
              <CardTitle>Campaign Details</CardTitle>
              <CardDescription>Overview of your campaign configuration</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-muted-foreground">Description</Label>
                <p className="text-sm">{campaignDetail.description || "No description provided"}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">City</Label>
                  <p className="text-sm font-medium">{campaignDetail.city}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Number of Cars</Label>
                  <p className="text-sm font-medium">{campaignDetail.numberOfCars}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Start Date</Label>
                  <p className="text-sm font-medium">
                    {campaignDetail.startDate ? new Date(campaignDetail.startDate).toLocaleDateString() : "-"}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">End Date</Label>
                  <p className="text-sm font-medium">
                    {campaignDetail.endDate ? new Date(campaignDetail.endDate).toLocaleDateString() : "-"}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Daily Budget</Label>
                  <p className="text-sm font-medium">€{((campaignDetail.dailyBudget || 0) / 100).toFixed(2)}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Total Budget</Label>
                  <p className="text-sm font-medium">€{((campaignDetail.totalBudget || 0) / 100).toFixed(2)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Creative Management */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Creative</CardTitle>
                  <CardDescription>Upload and manage your ad creative</CardDescription>
                </div>
                {campaignDetail.status === "draft" && (
                  <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
                    <DialogTrigger asChild>
                      <Button size="sm">
                        <Upload className="mr-2 h-4 w-4" />
                        Upload
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Upload Creative</DialogTitle>
                        <DialogDescription>Upload an image for your campaign (max 5MB)</DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label>Select Image</Label>
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleFileSelect}
                            className="hidden"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            className="w-full"
                            onClick={() => fileInputRef.current?.click()}
                          >
                            Choose File
                          </Button>
                          {selectedFile && (
                            <p className="text-sm text-muted-foreground">
                              Selected: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(2)} KB)
                            </p>
                          )}
                        </div>

                        {previewUrl && (
                          <div className="space-y-2">
                            <Label>Preview</Label>
                            <div className="border rounded-lg overflow-hidden">
                              <img src={previewUrl} alt="Preview" className="w-full h-auto" />
                            </div>
                          </div>
                        )}

                        <div className="flex justify-end gap-2">
                          <Button type="button" variant="outline" onClick={() => setUploadDialogOpen(false)}>
                            Cancel
                          </Button>
                          <Button
                            type="button"
                            onClick={handleUpload}
                            disabled={!selectedFile || uploadAssetMutation.isPending}
                          >
                            {uploadAssetMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Upload
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {campaignDetail.creatives && campaignDetail.creatives.length > 0 ? (
                <div className="space-y-4">
                  {campaignDetail.creatives.map((creative) => (
                    <div key={creative.id} className="border rounded-lg p-4 space-y-4">
                      <div className="aspect-video bg-muted rounded-lg overflow-hidden">
                        <img src={creative.assetUrl} alt="Creative" className="w-full h-full object-contain" />
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <p className="text-sm font-medium">Status: {creative.approvalStatus}</p>
                          {creative.clientApprovedAt && (
                            <p className="text-xs text-muted-foreground">
                              Approved: {new Date(creative.clientApprovedAt).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                        <div className="flex gap-2">
                          {creative.approvalStatus === "pending" && !creative.clientApprovedAt && (
                            <Button
                              size="sm"
                              onClick={() => approveCreativeMutation.mutate({ creativeId: creative.id })}
                              disabled={approveCreativeMutation.isPending}
                            >
                              Approve
                            </Button>
                          )}
                          {campaignDetail.status === "awaiting_creative" && creative.clientApprovedAt && (
                            <Button
                              size="sm"
                              onClick={() =>
                                submitCreativeMutation.mutate({ campaignId, creativeId: creative.id })
                              }
                              disabled={submitCreativeMutation.isPending}
                            >
                              Submit for Review
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <Upload className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No creative uploaded yet</p>
                  <p className="text-sm">Upload an image to get started</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
