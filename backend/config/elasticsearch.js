const { Client } = require('@elastic/elasticsearch');

class ElasticsearchClient {
  constructor() {
    this.client = null;
    this.isConnected = false;
  }

  async connect() {
    try {
      this.client = new Client({
        node: process.env.ELASTICSEARCH_NODE || 'http://localhost:9200',
        auth: process.env.ELASTICSEARCH_USERNAME && process.env.ELASTICSEARCH_PASSWORD 
          ? {
              username: process.env.ELASTICSEARCH_USERNAME,
              password: process.env.ELASTICSEARCH_PASSWORD
            }
          : undefined,
        requestTimeout: 30000,
        pingTimeout: 3000,
        sniffOnStart: false,
      });

      // Test connection
      const info = await this.client.info();
      console.log('✅ Elasticsearch connected successfully:', info.body.version.number);
      this.isConnected = true;
      
      // Create courses index if it doesn't exist
      await this.createCoursesIndex();
      
      return this.client;
    } catch (error) {
      console.error('❌ Elasticsearch connection failed:', error.message);
      this.isConnected = false;
      // Don't throw error to prevent app crash if Elasticsearch is not available
      return null;
    }
  }

  async createCoursesIndex() {
    const indexName = 'courses';
    
    try {
      const { body: exists } = await this.client.indices.exists({ index: indexName });
      
      if (!exists) {
        await this.client.indices.create({
          index: indexName,
          body: {
            mappings: {
              properties: {
                course_id: { type: 'keyword' },
                title: { 
                  type: 'text',
                  analyzer: 'standard',
                  fields: {
                    keyword: { type: 'keyword' }
                  }
                },
                description: { 
                  type: 'text',
                  analyzer: 'standard'
                },
                category: { type: 'keyword' },
                instructor: { 
                  type: 'text',
                  fields: {
                    keyword: { type: 'keyword' }
                  }
                },
                duration: { type: 'integer' },
                created_at: { type: 'date' },
                updated_at: { type: 'date' }
              }
            },
            settings: {
              number_of_shards: 1,
              number_of_replicas: 0
            }
          }
        });
        console.log('✅ Courses index created successfully');
      }
    } catch (error) {
      console.error('❌ Error creating courses index:', error);
    }
  }

  async indexCourse(course) {
    if (!this.isConnected || !this.client) {
      console.warn('Elasticsearch not connected, skipping indexing');
      return false;
    }

    try {
      await this.client.index({
        index: 'courses',
        id: course._id.toString(),
        body: {
          course_id: course.course_id,
          title: course.title,
          description: course.description,
          category: course.category,
          instructor: course.instructor,
          duration: course.duration,
          created_at: course.created_at,
          updated_at: course.updated_at
        }
      });
      return true;
    } catch (error) {
      console.error('Error indexing course:', error);
      return false;
    }
  }

  async searchCourses(query, filters = {}, page = 1, size = 10) {
    if (!this.isConnected || !this.client) {
      console.warn('Elasticsearch not connected, returning empty results');
      return { hits: [], total: 0 };
    }

    try {
      const must = [];
      const filter = [];

      if (query) {
        must.push({
          multi_match: {
            query: query,
            fields: ['title^2', 'description', 'instructor', 'category'],
            type: 'best_fields',
            fuzziness: 'AUTO'
          }
        });
      } else {
        must.push({ match_all: {} });
      }

      if (filters.category) {
        filter.push({ term: { category: filters.category } });
      }

      if (filters.instructor) {
        filter.push({ term: { 'instructor.keyword': filters.instructor } });
      }

      const searchBody = {
        query: {
          bool: {
            must,
            filter
          }
        },
        from: (page - 1) * size,
        size,
        sort: [
          { _score: { order: 'desc' } },
          { created_at: { order: 'desc' } }
        ]
      };

      const response = await this.client.search({
        index: 'courses',
        body: searchBody
      });

      return {
        hits: response.body.hits.hits.map(hit => ({
          ...hit._source,
          _id: hit._id,
          _score: hit._score
        })),
        total: response.body.hits.total.value,
        page,
        size
      };
    } catch (error) {
      console.error('Error searching courses:', error);
      return { hits: [], total: 0 };
    }
  }

  isHealthy() {
    return this.isConnected;
  }
}

module.exports = new ElasticsearchClient();