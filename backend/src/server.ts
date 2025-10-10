import app from './app';
import { PORT } from './config';

const port = process.env.PORT || PORT;

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
