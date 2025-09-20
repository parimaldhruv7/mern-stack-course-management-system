const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema({
  course_id: {
    type: String,
    required: [true, 'Course ID is required'],
    unique: true,
    trim: true,
    uppercase: true
  },
  title: {
    type: String,
    required: [true, 'Course title is required'],
    trim: true,
    minlength: [3, 'Title must be at least 3 characters long'],
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  description: {
    type: String,
    required: [true, 'Course description is required'],
    trim: true,
    minlength: [10, 'Description must be at least 10 characters long'],
    maxlength: [2000, 'Description cannot exceed 2000 characters']
  },
  category: {
    type: String,
    required: [true, 'Course category is required'],
    trim: true,
    enum: [
      'Programming',
      'Data Science',
      'Web Development',
      'Mobile Development',
      'Machine Learning',
      'DevOps',
      'Database',
      'Cloud Computing',
      'Cybersecurity',
      'UI/UX Design',
      'Digital Marketing',
      'Business',
      'Other'
    ]
  },
  instructor: {
    type: String,
    required: [true, 'Instructor name is required'],
    trim: true,
    minlength: [2, 'Instructor name must be at least 2 characters long'],
    maxlength: [100, 'Instructor name cannot exceed 100 characters']
  },
  duration: {
    type: Number,
    required: [true, 'Course duration is required'],
    min: [1, 'Duration must be at least 1 hour'],
    max: [1000, 'Duration cannot exceed 1000 hours']
  },
  level: {
    type: String,
    enum: ['Beginner', 'Intermediate', 'Advanced'],
    default: 'Beginner'
  },
  price: {
    type: Number,
    min: [0, 'Price cannot be negative'],
    default: 0
  },
  enrollments: {
    type: Number,
    min: [0, 'Enrollments cannot be negative'],
    default: 0
  },
  rating: {
    type: Number,
    min: [0, 'Rating cannot be negative'],
    max: [5, 'Rating cannot exceed 5'],
    default: 0
  },
  tags: [{
    type: String,
    trim: true,
    lowercase: true
  }],
  prerequisites: [{
    type: String,
    trim: true
  }],
  learning_outcomes: [{
    type: String,
    trim: true
  }],
  thumbnail_url: {
    type: String,
    trim: true,
    default: 'https://images.pexels.com/photos/3861958/pexels-photo-3861958.jpeg'
  },
  status: {
    type: String,
    enum: ['draft', 'published', 'archived'],
    default: 'published'
  },
  created_by: {
    type: String,
    default: 'admin'
  }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  toJSON: {
    transform: function(doc, ret) {
      delete ret.__v;
      return ret;
    }
  },
  toObject: {
    transform: function(doc, ret) {
      delete ret.__v;
      return ret;
    }
  }
});

// Indexes for efficient queries
courseSchema.index({ course_id: 1 });
courseSchema.index({ title: 'text', description: 'text', instructor: 'text' });
courseSchema.index({ category: 1 });
courseSchema.index({ instructor: 1 });
courseSchema.index({ level: 1 });
courseSchema.index({ status: 1 });
courseSchema.index({ created_at: -1 });
courseSchema.index({ rating: -1 });
courseSchema.index({ enrollments: -1 });

// Virtual for formatted duration
courseSchema.virtual('formatted_duration').get(function() {
  if (this.duration < 1) return `${Math.round(this.duration * 60)} minutes`;
  if (this.duration === 1) return '1 hour';
  if (this.duration < 24) return `${this.duration} hours`;
  const days = Math.floor(this.duration / 24);
  const hours = this.duration % 24;
  return `${days} day${days > 1 ? 's' : ''}${hours > 0 ? ` ${hours} hour${hours > 1 ? 's' : ''}` : ''}`;
});

// Static method to get course statistics
courseSchema.statics.getStatistics = async function() {
  return this.aggregate([
    {
      $group: {
        _id: null,
        totalCourses: { $sum: 1 },
        totalEnrollments: { $sum: '$enrollments' },
        averageRating: { $avg: '$rating' },
        averageDuration: { $avg: '$duration' },
        categoryCounts: {
          $push: '$category'
        }
      }
    },
    {
      $project: {
        _id: 0,
        totalCourses: 1,
        totalEnrollments: 1,
        averageRating: { $round: ['$averageRating', 2] },
        averageDuration: { $round: ['$averageDuration', 1] }
      }
    }
  ]);
};

// Instance method to increment enrollments
courseSchema.methods.incrementEnrollments = async function(count = 1) {
  this.enrollments += count;
  return this.save();
};

// Pre-save middleware to generate course_id if not provided
courseSchema.pre('save', function(next) {
  if (!this.course_id) {
    // Generate a course ID based on title and timestamp
    const titleAbbr = this.title
      .split(' ')
      .map(word => word.charAt(0).toUpperCase())
      .join('')
      .substring(0, 4);
    const timestamp = Date.now().toString().slice(-4);
    this.course_id = `${titleAbbr}${timestamp}`;
  }
  next();
});

module.exports = courseSchema;