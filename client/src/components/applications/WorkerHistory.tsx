import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { format } from 'date-fns';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from '@/components/ui/tabs';
import { 
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger 
} from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Star, StarHalf, Calendar, CheckCircle2, Clock, MapPin, AlertCircle, User2, Award, Loader2, Briefcase, DollarSign, ThumbsUp } from 'lucide-react';

// Type definitions
interface WorkerJob {
  id: number;
  title: string;
  description: string;
  status: string;
  category: string;
  datePosted: string;
  dateCompleted?: string;
  paymentAmount: number;
  posterName: string;
  location: string;
  rating?: number;
  review?: string;
  tasks?: WorkerTask[];
}

interface WorkerTask {
  id: number;
  description: string;
  isCompleted: boolean;
  completedAt?: string;
  isOptional: boolean;
  bonusAmount?: number;
}

interface WorkerMetrics {
  totalJobs: number;
  completedJobs: number;
  canceledJobs: number;
  averageRating: number;
  reviewCount: number;
  successRate: number;
  responseTime: number; // in hours
  categoryCounts: Record<string, number>;
  earnedBadges: string[];
  totalEarnings: number;
}

interface WorkerProfileData {
  id: number;
  username: string;
  fullName: string;
  avatarUrl?: string;
  bio?: string;
  skills: string[];
  joinedDate: string;
  location?: string;
  rating?: number;
  metrics: WorkerMetrics;
  jobs: WorkerJob[];
}

// Display star rating component
const StarRating = ({ rating }: { rating: number }) => {
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;
  
  return (
    <div className="flex items-center">
      {Array.from({ length: fullStars }).map((_, i) => (
        <Star key={`full-${i}`} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
      ))}
      {hasHalfStar && <StarHalf className="h-4 w-4 fill-yellow-400 text-yellow-400" />}
      {Array.from({ length: 5 - fullStars - (hasHalfStar ? 1 : 0) }).map((_, i) => (
        <Star key={`empty-${i}`} className="h-4 w-4 text-gray-300" />
      ))}
      <span className="ml-1 text-sm">{rating.toFixed(1)}</span>
    </div>
  );
};

// JobListItem component for worker's past jobs
const JobListItem = ({ job }: { job: WorkerJob }) => {
  // Calculate job duration in days if both date posted and completed exist
  const calculateDuration = () => {
    if (job.datePosted && job.dateCompleted) {
      const start = new Date(job.datePosted);
      const end = new Date(job.dateCompleted);
      const diffTime = Math.abs(end.getTime() - start.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays === 0 ? "Same day" : diffDays === 1 ? "1 day" : `${diffDays} days`;
    }
    return null;
  };
  
  const jobDuration = calculateDuration();

  return (
    <div className={`mb-4 border rounded-lg p-4 hover:bg-accent/10 transition-colors ${
      job.status === 'completed' ? 'border-green-500/20' : 
      job.status === 'in_progress' ? 'border-blue-500/20' : 
      job.status === 'canceled' ? 'border-red-500/20' : ''
    }`}>
      <div className="flex justify-between items-start">
        <div>
          <h3 className="font-medium flex items-center">
            {job.title}
            {job.category && (
              <Badge variant="outline" className="ml-2 text-xs">
                {job.category}
              </Badge>
            )}
          </h3>
          <div className="text-sm text-muted-foreground mt-1.5 flex items-center gap-2">
            <Calendar className="h-3.5 w-3.5" />
            <span>{format(new Date(job.datePosted), 'MMM d, yyyy')}</span>
            {job.dateCompleted && (
              <span className="flex items-center">
                <span className="mx-1">–</span>
                <span>{format(new Date(job.dateCompleted), 'MMM d, yyyy')}</span>
                {jobDuration && (
                  <span className="ml-1.5 px-1.5 py-0.5 bg-muted text-xs rounded-sm">
                    {jobDuration}
                  </span>
                )}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 mt-1 text-sm">
            <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-muted-foreground">{job.location}</span>
          </div>
        </div>
        <div className="flex flex-col items-end">
          <Badge 
            variant={
              job.status === 'completed' ? 'green' : 
              job.status === 'in_progress' ? 'default' : 
              job.status === 'canceled' ? 'destructive' : 
              'outline'
            }
            className="mb-2"
          >
            {job.status === 'completed' && <CheckCircle2 className="mr-1 h-3 w-3" />}
            {job.status === 'in_progress' && <Clock className="mr-1 h-3 w-3" />}
            {job.status === 'canceled' && <AlertCircle className="mr-1 h-3 w-3" />}
            {job.status.replace('_', ' ')}
          </Badge>
          <div className="text-sm text-muted-foreground">
            {job.rating && <StarRating rating={job.rating} />}
          </div>
        </div>
      </div>
      
      <p className="text-sm mt-2 line-clamp-2">{job.description}</p>
      
      <div className="flex flex-wrap justify-between items-center gap-2 mt-3">
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="font-medium">
            <DollarSign className="h-3 w-3 mr-1" />
            ${job.paymentAmount.toFixed(2)}
          </Badge>
          
          {job.tasks && job.tasks.length > 0 && (
            <Badge variant="outline" className="text-xs">
              {job.tasks.filter(t => t.isCompleted).length}/{job.tasks.length} Tasks
            </Badge>
          )}
        </div>
        <div className="flex items-center text-sm text-muted-foreground">
          <User2 className="h-3.5 w-3.5 mr-1" />
          <span>{job.posterName}</span>
        </div>
      </div>
      
      {job.review && (
        <div className="mt-3 p-3 bg-muted/50 rounded-md text-sm italic">
          <div className="flex items-start gap-2">
            <span className="text-xl text-muted-foreground font-serif leading-none mt-1">"</span>
            <p className="flex-1">{job.review}</p>
            <span className="text-xl text-muted-foreground font-serif leading-none mt-1">"</span>
          </div>
        </div>
      )}
    </div>
  );
};

// Main WorkerHistory component
interface WorkerHistoryProps {
  workerId: number;
  onHire?: () => void; // Optional callback for hire action
}

export default function WorkerHistory({ workerId, onHire }: WorkerHistoryProps) {
  // Fetch worker profile data including job history and metrics
  const { 
    data: workerData, 
    isLoading, 
    isError, 
    error 
  } = useQuery({
    queryKey: ['worker-history', workerId],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/workers/${workerId}/job-history`);
      if (!response.ok) {
        throw new Error('Failed to fetch worker history');
      }
      return response.json() as Promise<WorkerProfileData>;
    },
  });

  if (isLoading) {
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
          {error instanceof Error ? error.message : 'Failed to load worker history'}
        </AlertDescription>
      </Alert>
    );
  }
  
  // Check if we have worker data
  if (!workerData) {
    return (
      <Alert variant="default" className="mb-4">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>No Data Available</AlertTitle>
        <AlertDescription>
          This worker's profile information could not be found. They may be new to the platform.
        </AlertDescription>
      </Alert>
    );
  }

  // Group jobs by status
  const completedJobs = workerData?.jobs?.filter(job => job.status === 'completed') || [];
  const inProgressJobs = workerData?.jobs?.filter(job => job.status === 'in_progress') || [];
  const canceledJobs = workerData?.jobs?.filter(job => job.status === 'canceled') || [];

  return (
    <div className="space-y-6">
      {/* Worker Profile Summary */}
      <Card className="border-primary/20">
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-4">
              <Avatar className="h-12 w-12 border-2 border-primary/20">
                <AvatarImage src={workerData?.avatarUrl} alt={workerData?.fullName} />
                <AvatarFallback>{workerData?.fullName?.charAt(0) || workerData?.username?.charAt(0) || '?'}</AvatarFallback>
              </Avatar>
              <div>
                <CardTitle>{workerData?.fullName}</CardTitle>
                <CardDescription className="flex items-center mt-1">
                  @{workerData?.username} · Member since {format(new Date(workerData?.joinedDate || Date.now()), 'MMM yyyy')}
                </CardDescription>
                {workerData?.rating && 
                  <div className="mt-1">
                    <StarRating rating={workerData.rating} />
                  </div>
                }
              </div>
            </div>
            {/* Verification badge if worker has completed >5 jobs with good ratings */}
            {workerData?.metrics?.completedJobs > 5 && workerData?.metrics?.averageRating >= 4.5 && (
              <Badge className="bg-green-500/90 text-white hover:bg-green-500/80">
                <CheckCircle2 className="mr-1 h-3 w-3" />
                Verified Worker
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {workerData?.bio && (
            <p className="text-sm mb-4">{workerData.bio}</p>
          )}
          
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
            <div className="flex flex-col">
              <span className="text-sm text-muted-foreground">Success Rate</span>
              <div className="mt-1">
                <Progress value={workerData?.metrics?.successRate || 0} className="h-2" />
              </div>
              <span className="text-sm font-medium mt-1">{workerData?.metrics?.successRate || 0}%</span>
            </div>
            
            <div className="flex flex-col">
              <span className="text-sm text-muted-foreground">Jobs Completed</span>
              <span className="text-lg font-medium">{workerData?.metrics?.completedJobs || 0}</span>
            </div>
            
            <div className="flex flex-col">
              <span className="text-sm text-muted-foreground">Avg. Rating</span>
              <div className="flex items-center">
                <span className="text-lg font-medium mr-1">
                  {(workerData?.metrics?.averageRating || 0).toFixed(1)}
                </span>
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              </div>
            </div>
            
            <div className="flex flex-col">
              <span className="text-sm text-muted-foreground">Response Time</span>
              <span className="text-lg font-medium">
                {(workerData?.metrics?.responseTime || 0) < 1 
                  ? `${Math.round((workerData?.metrics?.responseTime || 0) * 60)} min` 
                  : `${(workerData?.metrics?.responseTime || 0).toFixed(1)} hrs`}
              </span>
            </div>
          </div>

          {/* Skills section */}
          <div className="mb-4">
            <h3 className="text-sm font-medium mb-2">Skills</h3>
            <div className="flex flex-wrap gap-2">
              {workerData?.skills?.map((skill, index) => (
                <Badge key={index} variant="secondary">
                  {skill}
                </Badge>
              )) || (
                <span className="text-sm text-muted-foreground">No skills listed</span>
              )}
            </div>
          </div>

          {/* Top categories */}
          {workerData?.metrics?.categoryCounts && Object.keys(workerData.metrics.categoryCounts).length > 0 && (
            <div>
              <h3 className="text-sm font-medium mb-2">Top Categories</h3>
              <div className="flex flex-wrap gap-2">
                {Object.entries(workerData.metrics.categoryCounts)
                  .sort((a, b) => b[1] - a[1])
                  .slice(0, 3)
                  .map(([category, count]) => (
                    <Badge key={category} variant="outline" className="flex items-center gap-1">
                      <Briefcase className="h-3 w-3" />
                      {category}
                      <span className="ml-1 text-xs bg-primary/10 px-1.5 py-0.5 rounded-full">
                        {count}
                      </span>
                    </Badge>
                  ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Badges Section */}
      {workerData?.metrics?.earnedBadges && workerData.metrics.earnedBadges.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center">
              <Award className="h-5 w-5 mr-2" />
              Earned Badges
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              {workerData.metrics.earnedBadges.map((badge, index) => (
                <Badge key={index} className="py-1.5 px-3">
                  <Award className="h-3.5 w-3.5 mr-1.5" />
                  {badge}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Job History Tabs */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Job History</CardTitle>
          <CardDescription>
            {workerData?.metrics?.totalJobs || 0} total jobs • ${(workerData?.metrics?.totalEarnings || 0).toFixed(2)} total earnings
          </CardDescription>
        </CardHeader>
        <CardContent className="pb-0">
          <Tabs defaultValue="all">
            <TabsList className="mb-4">
              <TabsTrigger value="all">
                All Jobs ({workerData?.jobs?.length || 0})
              </TabsTrigger>
              <TabsTrigger value="completed">
                Completed ({completedJobs.length})
              </TabsTrigger>
              <TabsTrigger value="in_progress">
                In Progress ({inProgressJobs.length})
              </TabsTrigger>
              <TabsTrigger value="canceled">
                Canceled ({canceledJobs.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="mt-0">
              {workerData?.jobs && workerData.jobs.length > 0 ? (
                <div className="max-h-96 overflow-y-auto pr-2">
                  {workerData.jobs.map(job => (
                    <JobListItem key={job.id} job={job} />
                  ))}
                </div>
              ) : (
                <p className="text-center py-8 text-muted-foreground">No jobs found.</p>
              )}
            </TabsContent>

            <TabsContent value="completed" className="mt-0">
              {completedJobs.length > 0 ? (
                <div className="max-h-96 overflow-y-auto pr-2">
                  {completedJobs.map(job => (
                    <JobListItem key={job.id} job={job} />
                  ))}
                </div>
              ) : (
                <p className="text-center py-8 text-muted-foreground">No completed jobs found.</p>
              )}
            </TabsContent>

            <TabsContent value="in_progress" className="mt-0">
              {inProgressJobs.length > 0 ? (
                <div className="max-h-96 overflow-y-auto pr-2">
                  {inProgressJobs.map(job => (
                    <JobListItem key={job.id} job={job} />
                  ))}
                </div>
              ) : (
                <p className="text-center py-8 text-muted-foreground">No in-progress jobs found.</p>
              )}
            </TabsContent>

            <TabsContent value="canceled" className="mt-0">
              {canceledJobs.length > 0 ? (
                <div className="max-h-96 overflow-y-auto pr-2">
                  {canceledJobs.map(job => (
                    <JobListItem key={job.id} job={job} />
                  ))}
                </div>
              ) : (
                <p className="text-center py-8 text-muted-foreground">No canceled jobs found.</p>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
      
      {/* Action panel with hire button if provided */}
      {onHire && (
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="py-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="text-center md:text-left space-y-2">
                <h3 className="text-lg font-medium">Ready to hire {workerData?.fullName}?</h3>
                <p className="text-muted-foreground text-sm max-w-md">
                  After hiring, you'll be able to communicate directly and create tasks for {workerData?.fullName.split(' ')[0]} to complete.
                </p>
              </div>
              <Button 
                onClick={onHire}
                size="lg"
                className="px-8 py-6 h-auto"
              >
                <Briefcase className="mr-2 h-5 w-5" />
                Hire {workerData?.fullName.split(' ')[0]}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Success rate and stats panel */}
      <Card className="mt-6 border-green-500/20 bg-green-50/10 dark:bg-green-900/5">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center">
            <ThumbsUp className="h-4 w-4 mr-2 text-green-500" />
            Why Hire {workerData?.fullName.split(' ')[0] || 'This Worker'}?
          </CardTitle>
        </CardHeader>
        <CardContent className="pb-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Success Rate</p>
              <p className="text-2xl font-semibold">{workerData?.metrics?.successRate || 0}%</p>
            </div>
            
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Completed Jobs</p>
              <p className="text-2xl font-semibold">{workerData?.metrics?.completedJobs || 0}</p>
            </div>
            
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Rating</p>
              <div className="flex items-center">
                <p className="text-2xl font-semibold mr-1">{(workerData?.metrics?.averageRating || 0).toFixed(1)}</p>
                <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
              </div>
            </div>
            
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Response Time</p>
              <p className="text-2xl font-semibold">
                {(workerData?.metrics?.responseTime || 0) < 1 ? (
                  <>{Math.round((workerData?.metrics?.responseTime || 0) * 60)}m</>
                ) : (
                  <>{(workerData?.metrics?.responseTime || 0).toFixed(1)}h</>
                )}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}