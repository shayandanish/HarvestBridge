const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Agro-Investment Platform API',
            version: '1.0.0',
            description: 'Comprehensive API documentation for the Agro-Investment Platform',
            contact: {
                name: 'Developer Support',
                email: 'support@planttree.com'
            }
        },
        servers: [
            {
                url: process.env.NODE_ENV === 'production'
                    ? 'https://api.planttree.com/api/v1'
                    : 'http://localhost:5000/api/v1',
                description: 'Development server'
            }
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT'
                }
            }
        },
        security: [{
            bearerAuth: []
        }]
    },
    apis: ['./src/routes/*.js', './src/controllers/*.js'] // Paths to files containing OpenAPI definitions
};

const specs = swaggerJsdoc(options);

module.exports = { swaggerUi, specs };
