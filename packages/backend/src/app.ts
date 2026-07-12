import express from 'express';
import cors from 'cors';

const app = express();

app.use(cors());
app.use(express.json());

// No routes implemented yet. This is neutral test infrastructure.

export default app;
