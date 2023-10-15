const express = require("express");

const app = express();

require('dotenv').config({path: '.env'})


const Vimeo = require("vimeo").Vimeo;
const cors = require("cors"); // Import the cors package
const rateLimit = require("express-rate-limit");


const access_token = process.env.VIMEO_ACCESS_TOKEN;
const client_id = process.env.VIMEO_CLIENT_ID;
const client_secret = process.env.VIMEO_CLIENT_SECRET;

const vimeoClient = new Vimeo(client_id, client_secret, access_token);

// Enable CORS for all routes
app.use(cors());

// Apply rate limiting middleware
const limiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 	250, // Max 250 requests per windowMs
  message: "Too many requests from this IP, please try again later.",
});

app.set("trust proxy", 1);

app.use(limiter);



// Error handling middleware
app.use((err, req, res, next) => {
  if (err instanceof rateLimit.RateLimitError) {
    res
      .status(429)
      .json({ error: "Rate limit exceeded. Please try again later." });
  } else {
    // Handle other errors
    res.status(500).json({ error: "Something went wrong." });
  }
});



//Requests to vimeo API 
app.get("/api/videos/:videoId", async (req, res) => {
  const videoId = req.params.videoId;

 try {
    const body = await vimeoClientRequest({
      method: "GET",
      path: `/videos/${videoId}`,
    });

    res.json(body);
  }
    catch (error) {
    console.error(error);
    res.status(500).json({ error: "An error occurred while fetching video details." });
  }
});



// Start the server
const PORT = process.env.PORT || 8081;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
