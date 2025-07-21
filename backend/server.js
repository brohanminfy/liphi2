import app from './app.js';
import dotenv from 'dotenv';
import { createServer } from 'http';

dotenv.config();
import swaggerUi from 'swagger-ui-express';
import YAML from 'yamljs';
const swaggerDocument = YAML.load('../openapi.yaml');
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

const PORT = process.env.PORT || 3001;

const httpServer = createServer(app);

httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
