'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { aiApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Sparkles, Star, Zap } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

interface CourseRecommendation {
  title: string;
  description: string;
  category: string;
  instructor: string;
  duration: number;
  level: string;
  rating: number;
  relevance_score: number;
  reasons: string[];
}

export default function CourseMatchPage() {
  const [recommendations, setRecommendations] = useState<CourseRecommendation[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [description, setDescription] = useState('');

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setRecommendations(null);
    
    try {
      // Extract topics from description (simple keyword extraction)
      const topics = extractTopicsFromDescription(description);
      
      const result = await aiApi.getRecommendations({
        topics: topics,
        skill_level: 'Beginner', // Default, could be made configurable
        learning_goals: ['Learn new skills', 'Career advancement'],
        preferred_duration: 'medium'
      });
      
      if (result.success && result.data) {
        setRecommendations(result.data.recommendations);
      } else {
        setError(result.message || 'Failed to get recommendations');
      }
    } catch (e) {
      setError('An error occurred while generating recommendations. Please try again.');
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  }

  function extractTopicsFromDescription(desc: string): string[] {
    const keywords = ['programming', 'web development', 'data science', 'machine learning', 'artificial intelligence', 'cloud computing', 'cybersecurity', 'mobile development', 'ui/ux', 'design'];
    const foundTopics = keywords.filter(keyword => 
      desc.toLowerCase().includes(keyword.toLowerCase())
    );
    return foundTopics.length > 0 ? foundTopics : ['programming', 'web development'];
  }

  const exampleDescription = "I'm a high school student with strong grades in Math and Physics. I love coding, building small robots, and I'm fascinated by artificial intelligence. I'm looking for an undergraduate program at a top-tier university, preferably in the US, that has a great reputation for engineering and a vibrant campus life.";

  return (
    <div className="container mx-auto max-w-4xl py-12 px-4">
      <div className="text-center mb-12">
        <Sparkles className="mx-auto h-12 w-12 text-accent mb-4" />
        <h1 className="font-headline text-4xl md:text-5xl font-extrabold tracking-tight text-primary">
          AI Course Match
        </h1>
        <p className="mt-4 text-lg text-muted-foreground">
          Describe your interests, academic background, and what you're looking for in a course. Our AI will suggest the best matches for you.
        </p>
      </div>

      <Card>
        <form onSubmit={onSubmit}>
          <CardContent className="p-6">
            <div className="space-y-4">
              <label className="text-lg font-semibold">Your Description</label>
              <Textarea
                placeholder="e.g., 'I'm interested in environmental science and want a hands-on program...'"
                className="min-h-[150px] mt-2"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
              />
              <Button 
                type="button" 
                variant="link" 
                className="p-0 h-auto text-accent mt-2"
                onClick={() => setDescription(exampleDescription)}>
                Use an example
              </Button>
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={isLoading} className="w-full md:w-auto">
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Zap className="mr-2 h-4 w-4" />
                  Find My Courses
                </>
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>

      {error && (
        <div className="mt-8 text-center text-destructive bg-destructive/10 p-4 rounded-md">
          {error}
        </div>
      )}

      {recommendations && (
        <div className="mt-12">
          <h2 className="font-headline text-3xl font-bold mb-6 text-center text-primary">Your Recommended Courses</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {recommendations.map((rec, index) => (
              <Card key={index} className="flex flex-col">
                <CardHeader>
                  <CardTitle className="font-headline text-xl">{rec.title}</CardTitle>
                  <CardDescription>{rec.instructor} • {rec.category}</CardDescription>
                </CardHeader>
                <CardContent className="flex-grow space-y-4">
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm font-semibold flex items-center gap-1"><Star className="h-4 w-4 text-yellow-500" /> Match Score</span>
                      <Badge variant={rec.relevance_score > 0.8 ? 'default' : 'secondary'} className="bg-accent text-accent-foreground">{Math.round(rec.relevance_score * 100)}%</Badge>
                    </div>
                    <Progress value={rec.relevance_score * 100} className="h-2" />
                  </div>
                  <p className="text-sm text-muted-foreground">{rec.description}</p>
                  <div className="space-y-2">
                    <p className="text-sm font-semibold text-primary">Why this course:</p>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      {rec.reasons.map((reason, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="text-accent">•</span>
                          {reason}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>Duration: {rec.duration} hours</span>
                    <span>Level: {rec.level}</span>
                    <span>Rating: {rec.rating}/5</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
