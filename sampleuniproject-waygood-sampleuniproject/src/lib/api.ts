// API Service Layer for connecting frontend to backend

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

// Types for API responses
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}

export interface Admin {
  id: string;
  username: string;
  email: string;
  role: string;
  isActive: boolean;
}

export interface LoginResponse {
  admin: Admin;
  token: string;
}

export interface Course {
  _id: string;
  course_id: string;
  title: string;
  description: string;
  category: string;
  instructor: string;
  duration: number;
  level: string;
  price: number;
  enrollments: number;
  rating: number;
  tags: string[];
  prerequisites: string[];
  learning_outcomes: string[];
  thumbnail_url: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface CourseUploadResponse {
  total_rows: number;
  valid_courses: number;
  saved_courses: number;
  courses: Course[];
  errors: string[];
}

export interface CourseStats {
  overview: {
    totalCourses: number;
    totalEnrollments: number;
    averageRating: number;
    averageDuration: number;
    averagePrice: number;
  };
  categories: Array<{
    category: string;
    courseCount: number;
    totalEnrollments: number;
    averageRating: number;
  }>;
}

// Generic API request function
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  try {
    const url = `${API_BASE_URL}${endpoint}`;
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || `HTTP error! status: ${response.status}`);
    }

    return data;
  } catch (error) {
    console.error('API request failed:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'An unknown error occurred',
    };
  }
}

// Auth API functions
export const authApi = {
  async login(email: string, password: string): Promise<ApiResponse<LoginResponse>> {
    return apiRequest<LoginResponse>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },

  async signup(username: string, email: string, password: string, role = 'admin'): Promise<ApiResponse<LoginResponse>> {
    return apiRequest<LoginResponse>('/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ username, email, password, role }),
    });
  },

  async getProfile(token: string): Promise<ApiResponse<{ admin: Admin }>> {
    return apiRequest<{ admin: Admin }>('/api/auth/profile', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  },

  async verifyToken(token: string): Promise<ApiResponse<{ admin: Admin }>> {
    return apiRequest<{ admin: Admin }>('/api/auth/verify', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  },
};

// Course API functions
export const courseApi = {
  async getCourses(params: {
    page?: number;
    limit?: number;
    category?: string;
    instructor?: string;
    level?: string;
    status?: string;
    sort?: string;
    order?: string;
    search?: string;
  } = {}): Promise<ApiResponse<{
    courses: Course[];
    pagination: {
      current_page: number;
      total_pages: number;
      total_items: number;
      items_per_page: number;
      has_next: boolean;
      has_prev: boolean;
    };
  }>> {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, value.toString());
      }
    });

    return apiRequest(`/api/courses?${searchParams.toString()}`);
  },

  async getCourse(id: string): Promise<ApiResponse<{ course: Course }>> {
    return apiRequest<{ course: Course }>(`/api/courses/${id}`);
  },

  async searchCourses(query: string, filters: {
    category?: string;
    instructor?: string;
    page?: number;
    size?: number;
  } = {}): Promise<ApiResponse<{
    courses: Course[];
    pagination: {
      current_page: number;
      total_pages: number;
      total_items: number;
      items_per_page: number;
      has_next: boolean;
      has_prev: boolean;
    };
    query: string;
  }>> {
    const searchParams = new URLSearchParams({ q: query });
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, value.toString());
      }
    });

    return apiRequest(`/api/courses/search?${searchParams.toString()}`);
  },

  async uploadCourses(file: File, token: string): Promise<ApiResponse<CourseUploadResponse>> {
    const formData = new FormData();
    formData.append('csvFile', file);

    try {
      const response = await fetch(`${API_BASE_URL}/api/courses/upload`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `HTTP error! status: ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error('Course upload failed:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Upload failed',
      };
    }
  },

  async createCourse(courseData: Partial<Course>, token: string): Promise<ApiResponse<{ course: Course }>> {
    return apiRequest<{ course: Course }>('/api/courses', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(courseData),
    });
  },

  async getCourseStats(): Promise<ApiResponse<CourseStats>> {
    return apiRequest<CourseStats>('/api/courses/stats/overview');
  },
};

// AI Recommendations API functions
export const aiApi = {
  async getRecommendations(preferences: {
    topics?: string[];
    skill_level?: string;
    learning_goals?: string[];
    preferred_duration?: string;
    budget_range?: string;
    exclude_categories?: string[];
  }): Promise<ApiResponse<{
    recommendations: Array<{
      title: string;
      description: string;
      category: string;
      instructor: string;
      duration: number;
      level: string;
      rating: number;
      relevance_score: number;
      reasons: string[];
      is_real_course?: boolean;
    }>;
    preferences_used: typeof preferences;
    ai_generated: boolean;
  }>> {
    return apiRequest('/api/recommendations', {
      method: 'POST',
      body: JSON.stringify(preferences),
    });
  },

  async getTrendingCourses(): Promise<ApiResponse<{
    courses: Array<Course & {
      trending_score: number;
      trending_reasons: string[];
    }>;
  }>> {
    return apiRequest('/api/recommendations/trending');
  },

  async getLearningPath(params: {
    current_skills?: string[];
    career_goal?: string;
    time_commitment?: string;
    experience_level?: string;
  }): Promise<ApiResponse<{
    career_goal: string;
    current_skills: string[];
    experience_level: string;
    estimated_duration: string;
    phases: Array<{
      phase: string;
      duration: string;
      skills: string[];
      order: number;
      status: string;
      recommended_courses: Array<{
        title: string;
        duration: string;
        difficulty: string;
      }>;
    }>;
    time_commitment: string;
    next_steps: string[];
  }>> {
    return apiRequest('/api/recommendations/learning-path', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  },
};

// Health check functions
export const healthApi = {
  async checkGateway(): Promise<ApiResponse<{
    services: {
      auth: string;
      courses: string;
      ai: string;
    };
  }>> {
    return apiRequest('/health');
  },

  async checkAuthService(): Promise<ApiResponse<{ service: string }>> {
    return apiRequest('/api/auth/health');
  },

  async checkCourseService(): Promise<ApiResponse<{ service: string }>> {
    return apiRequest('/api/courses/health');
  },

  async checkAiService(): Promise<ApiResponse<{ service: string }>> {
    return apiRequest('/api/ai/health');
  },
};