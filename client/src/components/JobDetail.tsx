import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatCurrency, formatDistance, formatDateTime, getCategoryIcon, getCategoryColor } from '@/lib/utils';
import { Job, Earning, Review } from '@shared/schema';
import { useAuth } from '@/hooks/use-auth';
import { useState } from 'react';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import TaskList from './TaskList';
import ReviewForm from './ReviewForm';
import ReviewsList from './ReviewsList';
import PaymentNotification from './PaymentNotification';
import JobPayment from './JobPayment';
import ApplicationForm from './applications/ApplicationForm';
import WorkerHistory from './applications/WorkerHistory';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Loader2, CheckCircle2, MessageCircle, Star, X, BriefcaseBusiness, UserCheck, ClipboardCheck, XCircle, Send } from 'lucide-react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { StripeConnectRequired } from '@/components/stripe';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

interface JobDetailProps {
  job: Job;
  distance?: number;
  onClose?: () => void;
}

const JobDetail: React.FC<JobDetailProps> = ({ job, distance = 0.5, onClose }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isApplying, setIsApplying] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('details');
  const [showStripeConnectRequired, setShowStripeConnectRequired] = useState(false);
  const [showApplicationForm, setShowApplicationForm] = useState(false);
  const [showWorkerHistory, setShowWorkerHistory] = useState(false);
  const [selectedWorkerId, setSelectedWorkerId] = useState<number | null>(null);
  
  const {
    id: jobId,
    title,
    description,
    category,
    paymentType,
    paymentAmount,
    serviceFee = 2.50, // Default service fee if not provided
    totalAmount = paymentAmount + serviceFee, // Calculate total if not provided
    location,
    dateNeeded,
    requiredSkills,
    equipmentProvided,
    posterId,
    status
  } = job;

  const categoryColor = getCategoryColor(category);
  const categoryIcon = getCategoryIcon(category);
  
  // Determine if user is assigned worker
  const isAssignedWorker = user?.id === job.workerId;
  
  // Determine if user is job poster
  const isJobPoster = user?.id === job.posterId;
  
  // Determine if job is in progress (assigned to worker but not completed)
  const isJobInProgress = status === 'in_progress' || status === 'assigned';
  
  // Determine if job is completed
  const isJobCompleted = status === 'completed';
  
  // Determine if job is canceled
  const isJobCanceled = status === 'canceled';
  
  // Determine if job can be canceled (no worker assigned yet or still in open status)
  const isJobCancelable = status === 'open' || (status === 'assigned' && !job.workerId);
  
  // Check if the current user has already reviewed this job
  const { data: hasReviewed } = useQuery({
    queryKey: ['/api/reviews/job', job.id, 'user-has-reviewed', user?.id],
    queryFn: async () => {
      try {
        const res = await apiRequest('GET', `/api/reviews/job/${job.id}`);
        const reviews = await res.json();
        return reviews.some((review: Review) => review.reviewerId === user?.id);
      } catch (error) {
        return false;
      }
    },
    enabled: !!(user && isJobCompleted && (isAssignedWorker || isJobPoster)),
  });
  
  // Check if user has already applied to this job
  const { data: userApplications } = useQuery({
    queryKey: ['/api/applications/worker', user?.id],
    enabled: !!user && user.accountType === 'worker',
  });

  const hasAlreadyApplied = userApplications && Array.isArray(userApplications) 
    ? userApplications.some((app: any) => app.jobId === job.id)
    : false;

  // Query to get applications for job (only for job posters)
  const { data: jobApplications } = useQuery({
    queryKey: ['/api/applications/job', job.id],
    enabled: !!user && isJobPoster && status === 'open',
  });

  // Apply for job helpers
  const openApplicationForm = async () => {
    if (!user) {
      toast({
        title: "Login Required",
        description: "Please login to apply for this job",
        variant: "destructive"
      });
      return;
    }
    
    if (user.accountType !== 'worker') {
      toast({
        title: "Worker Account Required",
        description: "You need a worker account to apply for jobs",
        variant: "destructive"
      });
      return;
    }
    
    // Check if the user has already applied
    if (hasAlreadyApplied) {
      toast({
        title: "Already Applied",
        description: "You have already applied for this job",
      });
      return;
    }
    
    // Check if user has a Stripe Connect account
    try {
      const res = await apiRequest('GET', '/api/stripe/connect/account-status');
      const accountStatus = await res.json();
      
      // If user doesn't have an active Connect account, show the setup modal
      if (!accountStatus || accountStatus.accountStatus !== 'active') {
        setShowStripeConnectRequired(true);
        return;
      }
      
      // If they have an active Connect account, show the application form
      setShowApplicationForm(true);
    } catch (error: any) {
      // If the error is a 404 (no account), show the Stripe Connect setup
      if (error.status === 404) {
        setShowStripeConnectRequired(true);
        return;
      }
      
      toast({
        title: "Error",
        description: "There was an error checking your account status. Please try again.",
        variant: "destructive"
      });
    }
  };
  
  // Apply for job mutation
  const handleApply = async (message: string) => {
    try {
      setIsApplying(true);
      const response = await apiRequest('POST', '/api/applications', {
        jobId: job.id,
        workerId: user!.id,
        message: message || null
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to submit application');
      }
      
      // Close the form and show success message
      setShowApplicationForm(false);
      
      toast({
        title: "Application Submitted",
        description: "Your job application has been submitted successfully!"
      });
      
      // Refresh the applications data
      queryClient.invalidateQueries({ queryKey: ['/api/applications/worker', user?.id] });
    } catch (error: any) {
      const errorMessage = error.message || "There was an error submitting your application. Please try again.";
      
      toast({
        title: "Application Failed",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsApplying(false);
    }
  };
  
  // Handle viewing worker history
  const handleViewWorkerHistory = (workerId: number) => {
    setSelectedWorkerId(workerId);
    setShowWorkerHistory(true);
  };
  
  // Handle application status updates
  const updateApplicationStatus = useMutation({
    mutationFn: async ({ applicationId, status }: { applicationId: number, status: string }) => {
      const res = await apiRequest('PATCH', `/api/applications/${applicationId}`, { status });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/applications/job', job.id] });
      toast({
        title: "Application Updated",
        description: "The application status has been updated"
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  });
  
  // Complete job mutation
  const completeJobMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest('POST', `/api/jobs/${jobId}/complete`, {});
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/jobs/${jobId}`] });
      queryClient.invalidateQueries({ queryKey: ['/api/jobs'] });
      queryClient.invalidateQueries({ queryKey: ['/api/earnings/worker', user?.id] });
      
      toast({
        title: "Job Completed",
        description: "The job has been marked as completed. Your payment will be processed automatically if all tasks are completed.",
      });
      
      // Show the review form
      setShowReviewForm(true);
    },
    onError: (error: Error) => {
      toast({
        title: "Error Completing Job",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  // State for payment notification
  const [showPaymentNotification, setShowPaymentNotification] = useState(false);
  const [earnedPayment, setEarnedPayment] = useState<(Earning & { job?: Job }) | null>(null);
  
  // Create earning mutation
  const createEarningMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest('POST', '/api/earnings', {
        jobId: job.id,
        workerId: user?.id,
        amount: paymentAmount,
        status: 'pending'
      });
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/earnings/worker', user?.id] });
      
      // Show the payment notification with the job details
      setEarnedPayment({ ...data, job });
      setShowPaymentNotification(true);
    },
    onError: (error: Error) => {
      console.error("Error creating earning record:", error);
      // We don't show this error to the user since the job was already marked complete
    }
  });
  
  // Cancel job mutation
  const cancelJobMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest('PATCH', `/api/jobs/${jobId}`, {
        status: 'canceled'
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/jobs/${jobId}`] });
      queryClient.invalidateQueries({ queryKey: ['/api/jobs'] });
      
      toast({
        title: "Job Canceled",
        description: "The job has been canceled successfully.",
      });
      
      // Close the job detail view if there's a close function
      if (onClose) {
        onClose();
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Error Canceling Job",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  return (
    <div className="bg-card">
      {/* Stripe Connect Required Modal */}
      {showStripeConnectRequired && (
        <StripeConnectRequired
          onComplete={() => {
            setShowStripeConnectRequired(false);
            // After setup, try to apply again after a small delay
            setTimeout(() => {
              openApplicationForm();
            }, 500);
          }}
          onSkip={() => setShowStripeConnectRequired(false)}
        />
      )}
      
      {/* Payment notification overlay */}
      {showPaymentNotification && earnedPayment && (
        <PaymentNotification
          earning={earnedPayment}
          onDismiss={() => setShowPaymentNotification(false)}
        />
      )}
      
      {/* Application form dialog */}
      <Dialog open={showApplicationForm} onOpenChange={setShowApplicationForm}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Apply for Job</DialogTitle>
          </DialogHeader>
          <ApplicationForm 
            jobId={job.id}
            onSuccess={() => {
              setShowApplicationForm(false);
              // Refresh applications data
              queryClient.invalidateQueries({ 
                queryKey: ['/api/applications/worker', user?.id] 
              });
            }}
            onCancel={() => setShowApplicationForm(false)}
          />
        </DialogContent>
      </Dialog>
      
      {/* Worker history dialog */}
      <Dialog open={showWorkerHistory} onOpenChange={setShowWorkerHistory}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Worker History</DialogTitle>
          </DialogHeader>
          {selectedWorkerId && (
            <WorkerHistory workerId={selectedWorkerId} />
          )}
        </DialogContent>
      </Dialog>
      
      {showReviewForm ? (
        <div className="p-4">
          <ReviewForm 
            job={job} 
            onComplete={() => setShowReviewForm(false)}
          />
        </div>
      ) : (
        <div>
          {/* Tabs for job details and reviews */}
          <Tabs defaultValue="details" value={activeTab} onValueChange={setActiveTab}>
            <div className="px-5 pt-3">
              <TabsList className="w-full mb-2">
                <TabsTrigger value="details" className="flex-1">Details</TabsTrigger>
                <TabsTrigger value="reviews" className="flex-1">Reviews</TabsTrigger>
              </TabsList>
            </div>
            
            <TabsContent value="details" className="px-5 py-3">
              {/* Title and location */}
              <div className="flex items-center justify-between mb-1">
                <h3 className="text-lg font-bold text-foreground">{title}</h3>
                
                {/* Status badge */}
                <Badge 
                  className={`${
                    isJobCanceled
                      ? 'bg-gradient-to-r from-red-900 to-red-800 text-white'
                      : isJobCompleted 
                        ? 'bg-gradient-to-r from-green-900 to-green-800 text-white' 
                        : isJobInProgress 
                          ? 'bg-gradient-to-r from-primary/80 to-primary text-white' 
                          : 'bg-gradient-to-r from-yellow-800 to-amber-700 text-white'
                  }`}
                >
                  {isJobCanceled
                    ? 'Canceled'
                    : isJobCompleted 
                      ? 'Completed' 
                      : isJobInProgress 
                        ? 'In Progress' 
                        : 'Open'}
                </Badge>
              </div>
              
              <div className="flex items-center mb-3">
                <span 
                  className="inline-flex items-center justify-center w-5 h-5 rounded-full mr-1 animate-bounce-in"
                  style={{ backgroundColor: categoryColor || '#3b82f6' }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3">
                    {categoryIcon}
                  </svg>
                </span>
                <span className="text-sm text-muted-foreground">{category}</span>
                <span className="mx-2 text-muted-foreground/40">•</span>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 text-primary/70 mr-1">
                  <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
                <span className="text-sm text-muted-foreground">{formatDistance(distance)} away</span>
              </div>
              
              {/* Payment info in a card - DoorDash-style */}
              <div className="bg-gradient-to-br from-black/90 to-primary/80 text-white rounded-lg p-3 mb-4 border border-primary/40 animate-bounce-in shadow-md">
                <div className="flex justify-between items-center">
                  <div>
                    <div className="text-sm text-white/80">Payment</div>
                    <div className="font-bold text-lg text-white">
                      {formatCurrency(paymentAmount)}{paymentType === 'hourly' ? '/hr' : ''}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-white/80">Service Fee</div>
                    <div className="font-medium text-white/90">
                      {formatCurrency(serviceFee)}
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-between items-center mt-2 pt-2 border-t border-white/20">
                  <div className="text-sm font-medium text-white/90">
                    Total
                  </div>
                  <div className="font-bold text-white bg-gradient-to-r from-amber-200 to-yellow-400 bg-clip-text text-transparent">
                    {formatCurrency(totalAmount)}{paymentType === 'hourly' ? '/hr' : ''}
                  </div>
                </div>
              </div>
              
              {/* Complete Job button for assigned worker */}
              {isAssignedWorker && isJobInProgress && (
                <div className="mb-4">
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button 
                        className="w-full"
                        variant="default"
                      >
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                        Mark Job as Complete
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Confirm Job Completion</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to mark this job as complete? This will process your payment automatically.
                          <strong>All tasks must be completed before you can mark the job as complete.</strong> If any tasks are incomplete, your request will be rejected.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => completeJobMutation.mutate()}
                          disabled={completeJobMutation.isPending}
                        >
                          {completeJobMutation.isPending ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Processing...
                            </>
                          ) : (
                            "Yes, Mark Complete"
                          )}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              )}
              
              {/* Payment section for job poster */}
              {isJobPoster && isJobInProgress && (
                <div className="mb-4">
                  <JobPayment 
                    job={job}
                    onPaymentComplete={() => {
                      // Refresh job data
                      queryClient.invalidateQueries({ queryKey: [`/api/jobs/${jobId}`] });
                      queryClient.invalidateQueries({ queryKey: ['/api/jobs'] });
                      
                      // Show the review form when payment is complete
                      setShowReviewForm(true);
                    }}
                  />
                </div>
              )}
              
              {/* Applications Manager for job poster */}
              {isJobPoster && status === 'open' && (
                <div className="mb-4">
                  <h4 className="text-sm font-semibold text-foreground mb-2">Applications</h4>
                  
                  {jobApplications && Array.isArray(jobApplications) && jobApplications.length > 0 ? (
                    <div className="space-y-3">
                      {jobApplications.map((application: any) => (
                        <div 
                          key={application.id} 
                          className="p-3 border border-border rounded-md bg-card/50"
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <div className="font-medium">{application.workerName || 'Anonymous Worker'}</div>
                              <div className="text-sm text-muted-foreground mt-1">{application.message || 'No message provided'}</div>
                            </div>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleViewWorkerHistory(application.workerId)}
                            >
                              <ClipboardCheck className="h-3 w-3 mr-1" />
                              View History
                            </Button>
                          </div>
                          
                          <div className="flex gap-2 mt-3">
                            <Button
                              size="sm"
                              className="flex-1"
                              onClick={() => updateApplicationStatus.mutate({
                                applicationId: application.id,
                                status: 'accepted'
                              })}
                              disabled={updateApplicationStatus.isPending}
                            >
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              Accept
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="flex-1"
                              onClick={() => updateApplicationStatus.mutate({
                                applicationId: application.id,
                                status: 'rejected'
                              })}
                              disabled={updateApplicationStatus.isPending}
                            >
                              <XCircle className="h-3 w-3 mr-1" />
                              Decline
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-4 text-sm text-muted-foreground">
                      No applications yet. Workers will apply to your job soon!
                    </div>
                  )}
                </div>
              )}
              
              {/* Apply button for workers */}
              {!isJobPoster && !isAssignedWorker && status === 'open' && user?.accountType === 'worker' && (
                <div className="mb-4">
                  <Button 
                    className="w-full"
                    onClick={openApplicationForm}
                    disabled={isApplying || hasAlreadyApplied}
                  >
                    {isApplying ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Applying...
                      </>
                    ) : hasAlreadyApplied ? (
                      <>
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                        Already Applied
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-2" />
                        Apply for this Job
                      </>
                    )}
                  </Button>
                  
                  {hasAlreadyApplied && (
                    <p className="text-xs text-muted-foreground text-center mt-1">
                      You've already applied to this job. The job poster will review your application soon.
                    </p>
                  )}
                </div>
              )}
              
              {/* Cancel Job button for job poster */}
              {isJobPoster && isJobCancelable && (
                <div className="mb-4">
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button 
                        className="w-full"
                        variant="destructive"
                      >
                        <X className="h-4 w-4 mr-2" />
                        Cancel Job
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Cancel Job</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to cancel this job? This action cannot be undone.
                          {!job.workerId 
                            ? " Since no worker has been assigned yet, you can cancel without penalty."
                            : " This will notify the assigned worker."}
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Keep Job</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => cancelJobMutation.mutate()}
                          disabled={cancelJobMutation.isPending}
                        >
                          {cancelJobMutation.isPending ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Canceling...
                            </>
                          ) : (
                            "Yes, Cancel Job"
                          )}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              )}
              
              {/* Leave Review button for completed jobs */}
              {isJobCompleted && (isAssignedWorker || isJobPoster) && !hasReviewed && (
                <div className="mb-4">
                  <Button 
                    className="w-full"
                    variant="outline"
                    onClick={() => setShowReviewForm(true)}
                  >
                    <Star className="h-4 w-4 mr-2" />
                    Leave a Review
                  </Button>
                </div>
              )}
              
              {/* Date and time */}
              <div className="flex items-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 text-primary/70 mr-2">
                  <path d="M21 7.5V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-1.5" />
                  <path d="M16 2v4" />
                  <path d="M8 2v4" />
                  <path d="M3 10h18" />
                  <path d="M18 14v4h-4" />
                  <path d="M15 14h3v3" />
                </svg>
                <div className="text-sm text-muted-foreground">{formatDateTime(dateNeeded)}</div>
              </div>
              
              {/* Job description */}
              <div className="mb-4">
                <h4 className="text-sm font-semibold text-foreground mb-2">Description</h4>
                <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
              </div>
              
              {/* Location */}
              <div className="mb-4">
                <h4 className="text-sm font-semibold text-foreground mb-2">Location</h4>
                <div className="bg-card/50 border border-border rounded-lg overflow-hidden h-24 flex items-center justify-center mb-1">
                  <div className="text-sm text-muted-foreground">Map location preview</div>
                </div>
                <p className="text-sm text-muted-foreground">{location}</p>
              </div>
              
              {/* Skills tags */}
              {requiredSkills && requiredSkills.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-sm font-semibold text-foreground mb-2">Skills Required</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {requiredSkills.map((skill, index) => (
                      <Badge key={index} variant="outline" className="bg-primary/10 text-primary border-primary/30">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Equipment */}
              <div className="mb-4">
                <h4 className="text-sm font-semibold text-foreground mb-2">Equipment</h4>
                <div className="flex items-center text-sm text-muted-foreground">
                  {equipmentProvided ? (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 text-green-500 mr-2">
                        <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z"/>
                        <path d="m9 12 2 2 4-4"/>
                      </svg>
                      All equipment provided by job poster
                    </>
                  ) : (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 text-amber-500 mr-2">
                        <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z"/>
                        <path d="M12 8v4"/>
                        <path d="M12 16h.01"/>
                      </svg>
                      Worker must provide equipment
                    </>
                  )}
                </div>
              </div>
              
              {/* Task checklist */}
              <div className="mb-12"> {/* Extra margin at bottom for the fixed Apply button */}
                <h4 className="text-sm font-semibold text-foreground mb-2">Job Tasks</h4>
                <TaskList 
                  jobId={job.id} 
                  isJobPoster={isJobPoster}
                  isWorker={isAssignedWorker}
                />
              </div>
            </TabsContent>
            
            <TabsContent value="reviews" className="px-5 py-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Reviews</h3>
                {isJobCompleted && (isAssignedWorker || isJobPoster) && !hasReviewed && (
                  <Button 
                    size="sm"
                    onClick={() => setShowReviewForm(true)}
                  >
                    <MessageCircle className="h-4 w-4 mr-2" />
                    Write a Review
                  </Button>
                )}
              </div>
              <ReviewsList jobId={job.id} />
            </TabsContent>
          </Tabs>
        </div>
      )}
    </div>
  );
};

export default JobDetail;
