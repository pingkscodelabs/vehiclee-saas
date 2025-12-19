import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc } from "@/lib/trpc";
import { CheckCircle, XCircle, Clock, Loader2, Eye, LogOut } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { getLoginUrl } from "@/const";

export default function AdminDashboard() {
  const { user, logout, isAuthenticated } = useAuth();
  const [selectedCreative, setSelectedCreative] = useState<any>(null);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [activeTab, setActiveTab] = useState("pending");

  const { data: stats } = trpc.adminApp.getComplianceStats.useQuery(undefined, {
    enabled: isAuthenticated && user?.role === "admin",
  });

  const { data: complianceQueue, refetch: refetchQueue } = trpc.adminApp.getComplianceQueue.useQuery(
    { status: activeTab === "all" ? undefined : activeTab },
    { enabled: isAuthenticated && user?.role === "admin" }
  );

  const reviewCreativeMutation = trpc.adminApp.reviewCreative.useMutation({
    onSuccess: () => {
      toast.success("Creative reviewed successfully!");
      setReviewDialogOpen(false);
      setSelectedCreative(null);
      setRejectionReason("");
      refetchQueue();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to review creative");
    },
  });

  const handleApproveCreative = () => {
    if (!selectedCreative) return;
    reviewCreativeMutation.mutate({
      complianceId: selectedCreative.id,
      creativeId: selectedCreative.entityId,
      approved: true,
    });
  };

  const handleRejectCreative = () => {
    if (!selectedCreative || !rejectionReason.trim()) {
      toast.error("Please provide a rejection reason");
      return;
    }
    reviewCreativeMutation.mutate({
      complianceId: selectedCreative.id,
      creativeId: selectedCreative.entityId,
      approved: false,
      rejectionReason,
    });
  };

  const getStatusBadge = (status: string | null) => {
    const variants: Record<string, { icon: React.ReactNode; variant: "default" | "secondary" | "destructive" | "outline"; label: string }> = {
      pending: { icon: <Clock className="h-3 w-3" />, variant: "outline", label: "Pending Review" },
      approved: { icon: <CheckCircle className="h-3 w-3" />, variant: "default", label: "Approved" },
      rejected: { icon: <XCircle className="h-3 w-3" />, variant: "destructive", label: "Rejected" },
    };
    const config = (status && variants[status]) || { icon: <Clock className="h-3 w-3" />, variant: "secondary" as const, label: status || "Unknown" };
    return (
      <Badge variant={config.variant} className="flex items-center gap-1 w-fit">
        {config.icon}
        {config.label}
      </Badge>
    );
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Authentication Required</CardTitle>
            <CardDescription>Please log in to access the admin dashboard</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <a href={getLoginUrl()}>Log In</a>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (user?.role !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>This dashboard is only accessible to admin accounts</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header */}
      <header className="bg-background border-b">
        <div className="container py-4 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <h1 className="text-2xl font-bold text-primary">Vehiclee Admin</h1>
            <nav className="hidden md:flex gap-6">
              <span className="text-sm font-medium text-primary">Compliance</span>
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">{user?.name || user?.email}</span>
            <Button variant="ghost" size="sm" onClick={() => logout()}>
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="container py-8">
        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-3 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.pending || 0}</div>
              <p className="text-xs text-muted-foreground">Awaiting approval</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Approved</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.approved || 0}</div>
              <p className="text-xs text-muted-foreground">Successfully approved</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Rejected</CardTitle>
              <XCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.rejected || 0}</div>
              <p className="text-xs text-muted-foreground">Rejected creatives</p>
            </CardContent>
          </Card>
        </div>

        {/* Compliance Queue */}
        <Card>
          <CardHeader>
            <CardTitle>Compliance Queue</CardTitle>
            <CardDescription>Review and approve submitted campaign creatives</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList>
                <TabsTrigger value="pending">Pending ({stats?.pending || 0})</TabsTrigger>
                <TabsTrigger value="approved">Approved ({stats?.approved || 0})</TabsTrigger>
                <TabsTrigger value="rejected">Rejected ({stats?.rejected || 0})</TabsTrigger>
                <TabsTrigger value="all">All</TabsTrigger>
              </TabsList>

              <TabsContent value={activeTab} className="mt-4">
                {complianceQueue && complianceQueue.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Entity ID</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {complianceQueue.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell className="font-mono text-sm">#{item.id}</TableCell>
                          <TableCell className="capitalize">{item.entityType}</TableCell>
                          <TableCell className="font-mono text-sm">#{item.entityId}</TableCell>
                          <TableCell>{getStatusBadge(item.status)}</TableCell>
                          <TableCell>{item.createdAt ? new Date(item.createdAt as any).toLocaleDateString() : "-"}</TableCell>
                          <TableCell>
                            {item.status === "pending" && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setSelectedCreative(item);
                                  setReviewDialogOpen(true);
                                }}
                              >
                                <Eye className="h-4 w-4 mr-2" />
                                Review
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <p>No items in this queue</p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </main>

      {/* Review Dialog */}
      <Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Review Creative</DialogTitle>
            <DialogDescription>Review the submitted creative and approve or reject it</DialogDescription>
          </DialogHeader>

          {selectedCreative && (
            <div className="space-y-6">
              <div className="space-y-2">
                <Label className="text-muted-foreground">Compliance Queue ID</Label>
                <p className="text-sm font-mono">#{selectedCreative.id}</p>
              </div>

              <div className="space-y-2">
                <Label className="text-muted-foreground">Entity Type</Label>
                <p className="text-sm capitalize">{selectedCreative.entityType}</p>
              </div>

              <div className="space-y-2">
                <Label className="text-muted-foreground">Entity ID</Label>
                <p className="text-sm font-mono">#{selectedCreative.entityId}</p>
              </div>

              <div className="space-y-2">
                <Label className="text-muted-foreground">Current Status</Label>
                <p className="text-sm">{getStatusBadge(selectedCreative.status)}</p>
              </div>

              <div className="space-y-2">
                <Label className="text-muted-foreground">Submitted</Label>
                <p className="text-sm">{selectedCreative.createdAt ? new Date(selectedCreative.createdAt).toLocaleString() : "-"}</p>
              </div>

              {selectedCreative.status === "pending" && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="rejectionReason">Rejection Reason (if rejecting)</Label>
                    <Textarea
                      id="rejectionReason"
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      placeholder="Provide a reason if you plan to reject this creative..."
                      rows={4}
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-4">
                    <Button variant="outline" onClick={() => setReviewDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={handleRejectCreative}
                      disabled={reviewCreativeMutation.isPending}
                    >
                      {reviewCreativeMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Reject
                    </Button>
                    <Button onClick={handleApproveCreative} disabled={reviewCreativeMutation.isPending}>
                      {reviewCreativeMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Approve
                    </Button>
                  </div>
                </>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
