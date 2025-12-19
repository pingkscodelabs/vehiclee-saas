import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc } from "@/lib/trpc";
import { Wifi, WifiOff, Battery, Signal, Clock, Loader2, Eye, LogOut, Zap } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { getLoginUrl } from "@/const";

export default function FleetManagement() {
  const { user, logout, isAuthenticated } = useAuth();
  const [selectedDevice, setSelectedDevice] = useState<any>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [allocationDialogOpen, setAllocationDialogOpen] = useState(false);
  const [selectedCampaignId, setSelectedCampaignId] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<"all" | "online" | "offline">("all");

  const { data: overview } = trpc.fleetApp.getFleetOverview.useQuery(undefined, {
    enabled: isAuthenticated && user?.role === "admin",
  });

  const { data: devicesData, refetch: refetchDevices } = trpc.fleetApp.getDevices.useQuery(
    { status: statusFilter },
    { enabled: isAuthenticated && user?.role === "admin" }
  );

  const { data: campaigns } = trpc.clientApp.getCampaigns.useQuery(undefined, {
    enabled: isAuthenticated && user?.role === "admin",
  });

  const allocateMutation = trpc.fleetApp.allocateCampaign.useMutation({
    onSuccess: () => {
      toast.success("Campaign allocated successfully!");
      setAllocationDialogOpen(false);
      setSelectedCampaignId("");
      refetchDevices();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to allocate campaign");
    },
  });

  const deallocateMutation = trpc.fleetApp.deallocateCampaign.useMutation({
    onSuccess: () => {
      toast.success("Campaign deallocated successfully!");
      setDetailDialogOpen(false);
      setSelectedDevice(null);
      refetchDevices();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to deallocate campaign");
    },
  });

  const handleAllocate = () => {
    if (!selectedDevice || !selectedCampaignId) {
      toast.error("Please select a campaign");
      return;
    }
    allocateMutation.mutate({
      deviceId: selectedDevice.id,
      campaignId: parseInt(selectedCampaignId),
    });
  };

  const handleDeallocate = () => {
    if (!selectedDevice) return;
    deallocateMutation.mutate({
      deviceId: selectedDevice.id,
    });
  };

  const getDeviceStatus = (device: any) => {
    if (!device.telemetry) return "offline";
    const heartbeatTime = device.telemetry.heartbeatAt ? new Date(device.telemetry.heartbeatAt).getTime() : 0;
    const now = Date.now();
    return now - heartbeatTime < 5 * 60 * 1000 ? "online" : "offline";
  };

  const getBatteryStatus = (battery: number | null) => {
    if (!battery) return { color: "text-muted-foreground", label: "Unknown" };
    if (battery >= 80) return { color: "text-green-600", label: "Good" };
    if (battery >= 50) return { color: "text-yellow-600", label: "Fair" };
    if (battery >= 20) return { color: "text-orange-600", label: "Low" };
    return { color: "text-red-600", label: "Critical" };
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Authentication Required</CardTitle>
            <CardDescription>Please log in to access the fleet management dashboard</CardDescription>
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
            <h1 className="text-2xl font-bold text-primary">Fleet Management</h1>
            <nav className="hidden md:flex gap-6">
              <span className="text-sm font-medium text-primary">Devices & Telemetry</span>
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
        {/* Overview Stats */}
        <div className="grid gap-4 md:grid-cols-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Devices</CardTitle>
              <Zap className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{overview?.totalDevices || 0}</div>
              <p className="text-xs text-muted-foreground">In fleet</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Online</CardTitle>
              <Wifi className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{overview?.onlineDevices || 0}</div>
              <p className="text-xs text-muted-foreground">Connected now</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Campaigns</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{overview?.activeCampaigns || 0}</div>
              <p className="text-xs text-muted-foreground">Running</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Low Battery</CardTitle>
              <Battery className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{overview?.lowBattery || 0}</div>
              <p className="text-xs text-muted-foreground">Below 20%</p>
            </CardContent>
          </Card>
        </div>

        {/* Device List */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Device Fleet</CardTitle>
                <CardDescription>Monitor and manage e-paper devices</CardDescription>
              </div>
              <div className="flex gap-2">
                <Select value={statusFilter} onValueChange={(value: any) => setStatusFilter(value)}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Devices</SelectItem>
                    <SelectItem value="online">Online</SelectItem>
                    <SelectItem value="offline">Offline</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {devicesData && devicesData.devices.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Device ID</TableHead>
                    <TableHead>Vehicle</TableHead>
                    <TableHead>Driver</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Battery</TableHead>
                    <TableHead>Signal</TableHead>
                    <TableHead>Uptime</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {devicesData.devices.map((device) => {
                    const status = getDeviceStatus(device);
                    const battery = device.telemetry?.batteryLevel;
                    const batteryStatus = getBatteryStatus(battery);
                    const signal = device.telemetry?.signalStrength;

                    return (
                      <TableRow key={device.id}>
                        <TableCell className="font-mono text-sm">#{device.id}</TableCell>
                        <TableCell>{device.vehicle?.licensePlate || "-"}</TableCell>
                        <TableCell>{device.driver?.userId ? `Driver #${device.driver.userId}` : "-"}</TableCell>
                        <TableCell>
                          {status === "online" ? (
                            <Badge variant="default" className="flex items-center gap-1 w-fit">
                              <Wifi className="h-3 w-3" />
                              Online
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="flex items-center gap-1 w-fit">
                              <WifiOff className="h-3 w-3" />
                              Offline
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Battery className={`h-4 w-4 ${batteryStatus.color}`} />
                            <span className="text-sm">{battery}%</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Signal className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">{signal || "-"}%</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">{device.telemetry?.uptime ? `${Math.floor((device.telemetry.uptime || 0) / 3600)}h` : "-"}</TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedDevice(device);
                              setDetailDialogOpen(true);
                            }}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            Details
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <p>No devices found</p>
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      {/* Device Detail Dialog */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Device Details</DialogTitle>
            <DialogDescription>View device information and manage campaign allocation</DialogDescription>
          </DialogHeader>

          {selectedDevice && (
            <div className="space-y-6">
              <Tabs defaultValue="info" className="w-full">
                <TabsList>
                  <TabsTrigger value="info">Information</TabsTrigger>
                  <TabsTrigger value="telemetry">Telemetry</TabsTrigger>
                  <TabsTrigger value="allocation">Campaign</TabsTrigger>
                </TabsList>

                <TabsContent value="info" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-muted-foreground">Device ID</Label>
                      <p className="text-sm font-mono">#{selectedDevice.id}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Status</Label>
                      <p className="text-sm">
                        {getDeviceStatus(selectedDevice) === "online" ? (
                          <Badge variant="default">Online</Badge>
                        ) : (
                          <Badge variant="secondary">Offline</Badge>
                        )}
                      </p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Vehicle</Label>
                      <p className="text-sm">{selectedDevice.vehicle?.licensePlate || "-"}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Driver</Label>
                      <p className="text-sm">{selectedDevice.driver?.userId ? `Driver #${selectedDevice.driver.userId}` : "-"}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Model</Label>
                      <p className="text-sm">{selectedDevice.model || "-"}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Serial Number</Label>
                      <p className="text-sm font-mono">{selectedDevice.serialNumber || "-"}</p>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="telemetry" className="space-y-4">
                  {selectedDevice.telemetry ? (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-muted-foreground">Battery Level</Label>
                        <p className="text-sm">{selectedDevice.telemetry.batteryLevel}%</p>
                      </div>
                      <div>
                        <Label className="text-muted-foreground">Signal Strength</Label>
                        <p className="text-sm">{selectedDevice.telemetry.signalStrength}%</p>
                      </div>
                      <div>
                        <Label className="text-muted-foreground">Uptime</Label>
                        <p className="text-sm">{Math.floor((selectedDevice.telemetry.uptime || 0) / 3600)} hours</p>
                      </div>
                      <div>
                        <Label className="text-muted-foreground">Last Heartbeat</Label>
                        <p className="text-sm">
                          {selectedDevice.telemetry.heartbeatAt
                            ? new Date(selectedDevice.telemetry.heartbeatAt).toLocaleString()
                            : "-"}
                        </p>
                      </div>
                      {selectedDevice.telemetry.errorCode && (
                        <div className="col-span-2">
                          <Label className="text-muted-foreground">Error Code</Label>
                          <p className="text-sm text-red-600">{selectedDevice.telemetry.errorCode}</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No telemetry data available</p>
                  )}
                </TabsContent>

                <TabsContent value="allocation" className="space-y-4">
                  {selectedDevice.currentCampaign ? (
                    <div className="space-y-4">
                      <div>
                        <Label className="text-muted-foreground">Current Campaign</Label>
                        <p className="text-sm font-medium">{selectedDevice.currentCampaign.campaignName}</p>
                      </div>
                      <div>
                        <Label className="text-muted-foreground">Allocation Period</Label>
                        <p className="text-sm">
                          {selectedDevice.currentAllocation?.allocationStartDate
                            ? new Date(selectedDevice.currentAllocation.allocationStartDate).toLocaleDateString()
                            : "-"}{" "}
                          to{" "}
                          {selectedDevice.currentAllocation?.allocationEndDate
                            ? new Date(selectedDevice.currentAllocation.allocationEndDate).toLocaleDateString()
                            : "-"}
                        </p>
                      </div>
                      <Button
                        variant="destructive"
                        onClick={handleDeallocate}
                        disabled={deallocateMutation.isPending}
                        className="w-full"
                      >
                        {deallocateMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Deallocate Campaign
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <p className="text-sm text-muted-foreground">No campaign currently allocated to this device</p>
                      <div className="space-y-2">
                        <Label htmlFor="campaign-select">Select Campaign</Label>
                        <Select value={selectedCampaignId} onValueChange={setSelectedCampaignId}>
                          <SelectTrigger id="campaign-select">
                            <SelectValue placeholder="Choose a campaign..." />
                          </SelectTrigger>
                          <SelectContent>
                            {campaigns?.map((campaign) => (
                              <SelectItem key={campaign.id} value={campaign.id.toString()}>
                                {campaign.campaignName}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <Button
                        onClick={handleAllocate}
                        disabled={allocateMutation.isPending || !selectedCampaignId}
                        className="w-full"
                      >
                        {allocateMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Allocate Campaign
                      </Button>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
