import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Review, Job, User } from '@shared/schema';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Loader2, Star, ThumbsUp, ThumbsDown, MessageSquare } from 'lucide-react';

interface ReviewsContentProps {
  userId: number;
}

const ReviewsContent: React.FC<ReviewsContentProps> = ({ userId }) => {
  const { data: reviews, isLoading } = useQuery<Review[]>({
    queryKey: [`/api/reviews/user/${userId}`],
  });
  
  const { data: jobs } = useQuery<Job[]>({
    queryKey: ['/api/jobs'],
  });

  const { data: users } = useQuery<User[]>({
    queryKey: ['/api/users'],
  });
  
  // Helper function to get job details
  const getJobDetails = (jobId: number | null) => {
    if (!jobId || !jobs) return { title: `Job #${jobId || ''}` };
    return jobs.find(job => job.id === jobId) || { title: `Job #${jobId}` };
  };

  // Helper function to get user name
  const getUserName = (userId: number | null) => {
    if (!userId || !users) return '';
    const user = users.find(user => user.id === userId);
    return user ? user.fullName : '';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!reviews || reviews.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8">
        <div className="bg-primary/10 rounded-full p-4 mb-4">
          <Star className="h-8 w-8 text-primary" />
        </div>
        <h3 className="text-lg font-semibold mb-2">No reviews yet</h3>
        <p className="text-muted-foreground text-sm">
          Complete jobs to start receiving reviews from clients
        </p>
      </div>
    );
  }

  // Calculate average rating
  const avgRating = reviews.reduce((acc, curr) => acc + curr.rating, 0) / reviews.length;
  
  // Count ratings by star level
  const ratingCounts = [1, 2, 3, 4, 5].map(rating => ({
    rating,
    count: reviews.filter(r => Math.round(r.rating) === rating).length,
    percentage: (reviews.filter(r => Math.round(r.rating) === rating).length / reviews.length) * 100
  }));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between pb-1 border-b">
        <h2 className="text-sm font-medium text-muted-foreground">My Reviews</h2>
        <Badge variant="secondary" className="text-xs">{reviews.length} total</Badge>
      </div>

      {/* Rating summary */}
      <div className="border rounded-lg overflow-hidden">
        <div className="p-3">
          <div className="flex items-center justify-between">
            <div className="flex flex-col items-center">
              <div className="text-2xl font-bold text-primary">{avgRating.toFixed(1)}</div>
              <div className="flex items-center my-0.5">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`h-3 w-3 ${
                      i < Math.round(avgRating) ? 'text-amber-500 fill-amber-500' : 'text-gray-300'
                    }`}
                  />
                ))}
              </div>
              <p className="text-xs text-muted-foreground">Average rating</p>
            </div>
            
            <div className="flex-1 ml-5">
              {ratingCounts.reverse().map(({ rating, count, percentage }) => (
                <div key={rating} className="flex items-center mb-1">
                  <div className="flex items-center w-10">
                    <span className="text-xs mr-1">{rating}</span>
                    <Star className="h-2.5 w-2.5 text-amber-500" />
                  </div>
                  <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-primary rounded-full"
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                  <span className="text-xs ml-2 w-6 text-right">{count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Reviews list */}
      <div className="space-y-4">
        {reviews.sort((a, b) => new Date(b.dateReviewed || Date.now()).getTime() - new Date(a.dateReviewed || Date.now()).getTime())
          .map((review, index) => {
            const job = getJobDetails(review.jobId);
            return (
              <Card key={index}>
                <CardHeader className="pb-2">
                  <div className="flex justify-between">
                    <div>
                      <CardTitle className="text-base">{job.title}</CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {new Date(review.dateReviewed || Date.now()).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`h-4 w-4 ${
                            i < review.rating ? 'text-amber-500 fill-amber-500' : 'text-gray-200'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <p className="italic text-sm">"{review.comment}"</p>
                    
                    <div className="flex justify-between items-center pt-2">
                      <div className="flex items-center">
                        <Avatar className="h-8 w-8 mr-2">
                          <AvatarFallback className="bg-primary/10 text-primary text-xs">
                            {getUserName(review.reviewerId)?.substring(0, 2) || 'CL'}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm font-medium">{getUserName(review.reviewerId) || 'Client'}</span>
                      </div>
                      
                      {/* Reactions removed */}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
      </div>
    </div>
  );
};

export default ReviewsContent;