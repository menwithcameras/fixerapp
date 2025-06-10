import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import WorkerHistory from './WorkerHistory';
import PaymentConfirmation from '../payments/PaymentConfirmation';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from '@/components/ui/dialog';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { 
  Loader2, 
  User, 
  Star, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Calendar, 
  MessageSquare, 
  ThumbsUp,
  AlertCircle,
  UserCheck,
  Briefcase,
  Bookmark,
  DollarSign
} from 'lucide-react';

// Type definitions
interface JobApplication {
  id: number;
  jobId: number;
  workerId: number;
  status: 'pending' | 'accepted' | 'rejected' | 'completed';
  dateApplied: string;
  coverLetter?: string;
  hourlyRate?: number;
  expectedDuration?: string;
  workerName: string;
  workerAvatar?: string;
  workerRating?: number;
  completedJobs?: number;
}

interface ApplicationDetailProps {
  application: JobApplication;
  onAccept: (id: number) => void;
  onReject: (id: number) => void;
  isProcessing: boolean;
  showWorkerHistory: (workerId: number) => void;
}



const ApplicationDetail = ({
  application,
  onAccept,
  onReject,
  isProcessing,
  showWorkerHistory
}: ApplicationDetailProps) => {
  return (
    <Card className="mb-4">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-4">
            <Avatar className="h-10 w-10">
              <AvatarImage src={application.workerAvatar} alt={application.workerName} />
              <AvatarFallback>
                {application.workerName && application.workerName.length > 0 
                  ? application.workerName[0] 
                  : '?'}
              </AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-base">{application.workerName || 'Applicant'}</CardTitle>
              <CardDescription>
                Applied {application.dateApplied ? format(new Date(application.dateApplied), 'MMM d, yyyy') : 'Recently'}
              </CardDescription>
            </div>
          </div>
          <div className="flex flex-col items-end">
            <Badge variant={
              application.status === 'accepted' ? 'primary' :
              application.status === 'rejected' ? 'destructive' :
              application.status === 'completed' ? 'green' :
              'secondary'
            }>
              {application.status === 'pending' && <Clock className="mr-1 h-3 w-3" />}
              {application.status === 'accepted' && <CheckCircle className="mr-1 h-3 w-3" />}
              {application.status === 'rejected' && <XCircle className="mr-1 h-3 w-3" />}
              {application.status === 'completed' && <CheckCircle className="mr-1 h-3 w-3" />}
              {application.status.charAt(0).toUpperCase() + application.status.slice(1)}
            </Badge>
            {application.workerRating && (
              <div className="flex items-center mt-1">
                <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                <span className="ml-1 text-xs text-muted-foreground">{application.workerRating.toFixed(1)}</span>
                {application.completedJobs && (
                  <span className="ml-1 text-xs text-muted-foreground">({application.completedJobs} jobs)</span>
                )}
              </div>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {application.coverLetter && (
          <div className="mb-4">
            <h4 className="text-sm font-medium mb-1">Cover Letter</h4>
            <p className="text-sm text-muted-foreground">{application.coverLetter}</p>
          </div>
        )}
        
        <div className="grid grid-cols-2 gap-4 text-sm">
          {application.hourlyRate && (
            <div className="flex items-start space-x-2">
              <div className="rounded-full bg-primary/10 p-2">
                <DollarSign className="h-4 w-4 text-primary" />
              </div>
              <div>
                <span className="text-muted-foreground">Hourly Rate</span>
                <div className="font-medium">${application.hourlyRate.toFixed(2)}/hr</div>
              </div>
            </div>
          )}
          
          {application.expectedDuration && (
            <div className="flex items-start space-x-2">
              <div className="rounded-full bg-primary/10 p-2">
                <Clock className="h-4 w-4 text-primary" />
              </div>
              <div>
                <span className="text-muted-foreground">Estimated Time</span>
                <div className="font-medium">{application.expectedDuration}</div>
              </div>
            </div>
          )}
        </div>
        
        {/* Estimated cost calculation */}
        {application.hourlyRate && application.expectedDuration && (
          <div className="mt-3 p-3 bg-secondary/30 rounded-md text-sm">
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <Briefcase className="h-4 w-4 mr-2 text-muted-foreground" />
                <span>Estimated Cost</span>
              </div>
              <div className="font-semibold">
                ${(() => {
                  // Calculate estimated cost based on hourly rate and duration
                  let hours = 0;
                  
                  if (application.expectedDuration.includes('Less than 1 hour')) {
                    hours = 0.5; // Assuming 30 minutes on average
                  } else if (application.expectedDuration.includes('1-2 hours')) {
                    hours = 1.5; // Midpoint
                  } else if (application.expectedDuration.includes('2-4 hours')) {
                    hours = 3; // Midpoint
                  } else if (application.expectedDuration.includes('Half day')) {
                    hours = 5; // Midpoint of 4-6 hours
                  } else if (application.expectedDuration.includes('Full day')) {
                    hours = 7; // Midpoint of 6-8 hours
                  } else if (application.expectedDuration.includes('Multiple days')) {
                    hours = 16; // Assuming 2 full days
                  }
                  
                  const cost = application.hourlyRate * hours;
                  return cost.toFixed(2);
                })()}
              </div>
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-between pt-0">
        <Button
          variant="outline"
          size="sm"
          onClick={() => showWorkerHistory(application.workerId)}
        >
          <User className="mr-2 h-4 w-4" />
          View Profile
        </Button>
        
        {application.status === 'pending' && (
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onReject(application.id)}
              disabled={isProcessing}
            >
              <XCircle className="mr-2 h-4 w-4" />
              Decline
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={() => onAccept(application.id)}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle className="mr-2 h-4 w-4" />
              )}
              Hire Worker
            </Button>
          </div>
        )}
      </CardFooter>
    </Card>
  );
};

interface ApplicationsManagerProps {
  jobId?: number;
  userId?: number;
  mode?: string;
  initialJobId?: number;
}

export default function ApplicationsManager({ 
  jobId, 
  userId, 
  mode = 'poster',
  initialJobId 
}: ApplicationsManagerProps) {
  // If initialJobId is provided, use that (backwards compatibility)
  const effectiveJobId = initialJobId || jobId;
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [processingId, setProcessingId] = useState<number | null>(null);
  const [selectedFilter, setSelectedFilter] = useState<string>('all');
  const [selectedWorkerId, setSelectedWorkerId] = useState<number | null>(null);
  const [showHistoryDialog, setShowHistoryDialog] = useState<boolean>(false);
  
  // Fetch applications for this job
  const {
    data: applications,
    isLoading,
    isError,
    error
  } = useQuery({
    queryKey: ['/api/applications', effectiveJobId],
    queryFn: async () => {
      if (!effectiveJobId) {
        // If in worker mode without a job ID, fetch user's applications
        if (mode === 'worker' && userId) {
          const response = await apiRequest('GET', `/api/workers/${userId}/applications`);
          if (!response.ok) {
            throw new Error('Failed to fetch your applications');
          }
          return response.json() as Promise<JobApplication[]>;
        }
        return [];
      }
      const response = await apiRequest('GET', `/api/jobs/${effectiveJobId}/applications`);
      if (!response.ok) {
        throw new Error('Failed to fetch applications');
      }
      return response.json() as Promise<JobApplication[]>;
    },
    enabled: mode === 'poster' ? !!effectiveJobId : true,
  });
  
  // Fetch job details
  const {
    data: job,
    isLoading: isLoadingJob
  } = useQuery({
    queryKey: ['/api/jobs', effectiveJobId],
    queryFn: async () => {
      if (!effectiveJobId) return null;
      const response = await apiRequest('GET', `/api/jobs/${effectiveJobId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch job details');
      }
      return response.json();
    },
    enabled: !!effectiveJobId,
  });
  
  // State for payment confirmation dialog
  const [showPaymentConfirmation, setShowPaymentConfirmation] = useState<boolean>(false);
  const [pendingApplicationId, setPendingApplicationId] = useState<number | null>(null);
  const [pendingWorkerId, setPendingWorkerId] = useState<number | null>(null);
  
  // Mutation for accepting an application
  const acceptMutation = useMutation({
    mutationFn: async (applicationId: number) => {
      const response = await apiRequest('PATCH', `/api/applications/${applicationId}/status`, {
        status: 'accepted'
      });
      if (!response.ok) {
        throw new Error('Failed to accept application');
      }
      return response.json();
    },
    onMutate: (applicationId) => {
      setProcessingId(applicationId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/applications', effectiveJobId] });
      queryClient.invalidateQueries({ queryKey: ['/api/jobs', effectiveJobId] });
      toast({
        title: 'Worker hired!',
        description: 'The worker has been notified and can now start the job.',
      });
      
      // Close payment confirmation if it was shown
      setShowPaymentConfirmation(false);
      setPendingApplicationId(null);
      setPendingWorkerId(null);
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to hire worker',
        variant: 'destructive',
      });
    },
    onSettled: () => {
      setProcessingId(null);
    }
  });
  
  // Mutation for rejecting an application
  const rejectMutation = useMutation({
    mutationFn: async (applicationId: number) => {
      const response = await apiRequest('PATCH', `/api/applications/${applicationId}/status`, {
        status: 'rejected'
      });
      if (!response.ok) {
        throw new Error('Failed to reject application');
      }
      return response.json();
    },
    onMutate: (applicationId) => {
      setProcessingId(applicationId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/applications', effectiveJobId] });
      toast({
        title: 'Application declined',
        description: 'The worker has been notified.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to decline application',
        variant: 'destructive',
      });
    },
    onSettled: () => {
      setProcessingId(null);
    }
  });
  
  const handleAccept = (applicationId: number) => {
    // Find the application to get the worker ID
    const application = applications?.find(app => app.id === applicationId);
    if (application) {
      setPendingApplicationId(applicationId);
      setPendingWorkerId(application.workerId);
      setShowPaymentConfirmation(true);
    } else {
      toast({
        title: 'Error',
        description: 'Could not find application details',
        variant: 'destructive',
      });
    }
  };
  
  const confirmHire = () => {
    if (pendingApplicationId) {
      acceptMutation.mutate(pendingApplicationId);
    }
  };
  
  const handleReject = (applicationId: number) => {
    rejectMutation.mutate(applicationId);
  };
  
  const handleShowWorkerHistory = (workerId: number) => {
    setSelectedWorkerId(workerId);
    setShowHistoryDialog(true);
  };
  
  // Filter applications based on selected filter
  const filteredApplications = applications?.filter(app => {
    if (selectedFilter === 'all') return true;
    return app.status === selectedFilter;
  });
  
  if (isLoading || isLoadingJob) {
    return (
      <div className="flex justify-center items-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  if (isError) {
    return (
      <Alert variant="destructive" className="mb-4">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
          {error instanceof Error ? error.message : 'Failed to load applications'}
        </AlertDescription>
      </Alert>
    );
  }
  
  // Render differently based on mode
  if (mode === 'worker') {
    return (
      <div className="space-y-6">
        {/* Worker's Applications View */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Briefcase className="mr-2 h-5 w-5" />
              Your Applications
            </CardTitle>
            <CardDescription>
              Track the status of your job applications
            </CardDescription>
          </CardHeader>
          <CardContent>
            {applications && applications.length > 0 ? (
              <div className="space-y-4">
                {applications.map(application => (
                  <Card key={application.id} className="overflow-hidden">
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between">
                        <CardTitle className="text-base">{application.jobId}</CardTitle>
                        <Badge variant={
                          application.status === 'accepted' ? 'primary' :
                          application.status === 'rejected' ? 'destructive' :
                          application.status === 'completed' ? 'green' :
                          'secondary'
                        }>
                          {application.status === 'pending' && <Clock className="mr-1 h-3 w-3" />}
                          {application.status === 'accepted' && <CheckCircle className="mr-1 h-3 w-3" />}
                          {application.status === 'rejected' && <XCircle className="mr-1 h-3 w-3" />}
                          {application.status === 'completed' && <CheckCircle className="mr-1 h-3 w-3" />}
                          {application.status.charAt(0).toUpperCase() + application.status.slice(1)}
                        </Badge>
                      </div>
                      <CardDescription>
                        Applied on {format(new Date(application.dateApplied), 'MMM d, yyyy')}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pb-3">
                      <p className="text-sm mb-2 line-clamp-2">
                        {application.coverLetter || "No cover letter provided"}
                      </p>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {application.hourlyRate && (
                          <Badge variant="outline" className="flex items-center">
                            <DollarSign className="h-3 w-3 mr-1" />
                            {application.hourlyRate}/hr
                          </Badge>
                        )}
                        {application.expectedDuration && (
                          <Badge variant="outline" className="flex items-center">
                            <Clock className="h-3 w-3 mr-1" />
                            {application.expectedDuration}
                          </Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="bg-muted rounded-full p-3 inline-flex mb-4">
                  <Briefcase className="h-6 w-6 text-muted-foreground" />
                </div>
                <h3 className="font-medium mb-1">No Applications Yet</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  You haven't applied to any jobs yet
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Job Details */}
      {job && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Briefcase className="mr-2 h-5 w-5" />
              {job.title}
            </CardTitle>
            <CardDescription>
              <div className="flex items-center mt-1">
                <Calendar className="mr-1 h-4 w-4" /> 
                Posted on {format(new Date(job.datePosted), 'MMMM d, yyyy')}
              </div>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-4">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Status</h3>
                <Badge variant={
                  job.status === 'open' ? 'primary' :
                  job.status === 'assigned' ? 'green' :
                  job.status === 'completed' ? 'green' :
                  'secondary'
                } className="mt-1">
                  {job.status === 'open' && <Bookmark className="mr-1 h-3 w-3" />}
                  {job.status === 'assigned' && <UserCheck className="mr-1 h-3 w-3" />}
                  {job.status === 'completed' && <CheckCircle className="mr-1 h-3 w-3" />}
                  {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
                </Badge>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Category</h3>
                <div className="text-sm font-medium mt-1">{job.category}</div>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Payment</h3>
                <div className="text-sm font-medium mt-1 flex items-center">
                  <DollarSign className="h-3 w-3 mr-1" />
                  {job.paymentAmount} {job.paymentType === 'hourly' ? '/hr' : 'fixed'}
                </div>
              </div>
            </div>
            
            <h3 className="text-sm font-medium mb-2">Description</h3>
            <p className="text-sm text-muted-foreground mb-4">{job.description}</p>
            
            {job.requiredSkills && job.requiredSkills.length > 0 && (
              <div className="mb-4">
                <h3 className="text-sm font-medium mb-2">Required Skills</h3>
                <div className="flex flex-wrap gap-2">
                  {job.requiredSkills.map((skill: string, index: number) => (
                    <Badge key={index} variant="outline">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
      
      {/* Applications List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <UserCheck className="mr-2 h-5 w-5" />
            Applications
            {applications && (
              <Badge variant="secondary" className="ml-2">
                {applications.length}
              </Badge>
            )}
          </CardTitle>
          <CardDescription>
            Review and manage worker applications for this job
          </CardDescription>
        </CardHeader>
        <CardContent>
          {applications && applications.length > 0 ? (
            <>
              <div className="mb-4">
                <Select
                  value={selectedFilter}
                  onValueChange={setSelectedFilter}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filter applications" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Applications</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="accepted">Accepted</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {filteredApplications && filteredApplications.length > 0 ? (
                filteredApplications.map(application => (
                  <ApplicationDetail
                    key={application.id}
                    application={application}
                    onAccept={handleAccept}
                    onReject={handleReject}
                    isProcessing={processingId === application.id}
                    showWorkerHistory={handleShowWorkerHistory}
                  />
                ))
              ) : (
                <div className="text-center py-8">
                  <div className="w-12 h-12 bg-muted/50 rounded-full flex items-center justify-center mx-auto mb-3">
                    <AlertCircle className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <h4 className="text-base font-medium mb-1">No matching applications</h4>
                  <p className="text-sm text-muted-foreground">
                    No applications match the "{selectedFilter}" filter. 
                    {selectedFilter !== 'all' && ' Try selecting "All Applications" to see all applications.'}
                  </p>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                <UserCheck className="h-6 w-6 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium mb-2">No Applications Yet</h3>
              <p className="text-muted-foreground mb-4 max-w-md mx-auto">
                Your job posting hasn't received any applications yet. Make sure your job description is clear and the compensation is competitive.
              </p>
              <div className="flex flex-col items-center gap-2">
                <Badge variant="outline" className="py-1.5 px-3">
                  <Clock className="h-3.5 w-3.5 mr-1.5" />
                  Posted {job?.datePosted ? new Date(job.datePosted).toLocaleDateString() : 'recently'}
                </Badge>
                {job?.viewCount > 0 && (
                  <div className="text-sm text-muted-foreground">
                    <span className="font-medium">{job.viewCount}</span> people have viewed this job
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Worker History Dialog */}
      {selectedWorkerId && (
        <Dialog open={showHistoryDialog} onOpenChange={setShowHistoryDialog}>
          <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Worker Profile & History</DialogTitle>
              <DialogDescription>
                Review this worker's job history and performance before making a decision
              </DialogDescription>
            </DialogHeader>
            
            <WorkerHistory 
              workerId={selectedWorkerId} 
              onHire={() => {
                const application = applications?.find(app => 
                  app.workerId === selectedWorkerId && 
                  app.status === 'pending'
                );
                if (application) {
                  handleAccept(application.id);
                  setShowHistoryDialog(false);
                }
              }}
            />
            
            <DialogFooter className="mt-4">
              <DialogClose asChild>
                <Button variant="outline">Close</Button>
              </DialogClose>
              
              {applications?.some(app => 
                app.workerId === selectedWorkerId && 
                app.status === 'pending'
              ) && (
                <Button 
                  onClick={() => {
                    const application = applications.find(app => 
                      app.workerId === selectedWorkerId && 
                      app.status === 'pending'
                    );
                    if (application) {
                      handleAccept(application.id);
                      setShowHistoryDialog(false);
                    }
                  }}
                  disabled={!!processingId}
                >
                  {processingId ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCircle className="mr-2 h-4 w-4" />
                  )}
                  Hire This Worker
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
      
      {/* Payment Confirmation Dialog */}
      <Dialog 
        open={showPaymentConfirmation} 
        onOpenChange={(open) => {
          if (!open) {
            setShowPaymentConfirmation(false);
            setPendingApplicationId(null);
            setPendingWorkerId(null);
          }
        }}
      >
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Complete Payment to Hire Worker</DialogTitle>
            <DialogDescription>
              Review payment details and confirm to hire the worker for your job
            </DialogDescription>
          </DialogHeader>
          
          {pendingApplicationId && pendingWorkerId && effectiveJobId && (
            <PaymentConfirmation
              jobId={effectiveJobId}
              applicationId={pendingApplicationId}
              workerId={pendingWorkerId}
              onSuccess={confirmHire}
              onCancel={() => {
                setShowPaymentConfirmation(false);
                setPendingApplicationId(null);
                setPendingWorkerId(null);
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}